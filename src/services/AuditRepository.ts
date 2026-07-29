import { AuditRecord, UserRole } from "../types";
import { getSupabase, checkSupabaseConnection } from "./supabaseClient";
import { canTransition, AuditStatus } from "./auditStateMachine";

const STORAGE_KEY = "okk_audits_repository_v3";

export class AuditRepository {
  private static cachedAudits: AuditRecord[] | null = null;

  private static loadLocalAudits(): AuditRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to parse local audits repo", e);
    }
    return [];
  }

  private static saveLocalAudits(audits: AuditRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
      this.cachedAudits = audits;
    } catch (e) {
      console.warn("Failed to save local audits repo", e);
    }
  }

  public static async getAllAudits(initialFallback: AuditRecord[] = []): Promise<AuditRecord[]> {
    if (checkSupabaseConnection()) {
      const supabase = getSupabase()!;
      const { data, error } = await supabase.from("audit_records").select("payload").order("created_at", { ascending: false });
      if (error) {
        throw new Error(`Не удалось загрузить проверки: ${error.message}`);
      }
      if (data) {
        const mapped: AuditRecord[] = data
          .map((row: any) => row.payload as AuditRecord)
          .filter((row: AuditRecord | null) => Boolean(row?.id));
        await Promise.all(
          mapped.map(async (record) => {
            if (!record.audioStoragePath) return;
            const { data: signed } = await supabase.storage
              .from("audit-audio")
              .createSignedUrl(record.audioStoragePath, 60 * 60);
            record.audioUrl = signed?.signedUrl;
            record.audioData = undefined;
          })
        );
        this.cachedAudits = mapped;
        this.saveLocalAudits(mapped);
        return mapped;
      }
    }

    // Local / Demo Mode Fallback
    if (!this.cachedAudits || this.cachedAudits.length === 0) {
      const local = this.loadLocalAudits();
      if (local.length > 0) {
        this.cachedAudits = local;
      } else {
        this.cachedAudits = initialFallback;
        this.saveLocalAudits(initialFallback);
      }
    }
    return this.cachedAudits;
  }

  public static async replaceAllAudits(audits: AuditRecord[]): Promise<void> {
    this.saveLocalAudits(audits);
    if (!checkSupabaseConnection()) return;
    for (const audit of audits) {
      await this.upsertRemoteAudit(audit);
    }
    this.saveLocalAudits(audits);
  }

  public static async deleteAudit(auditId: string): Promise<void> {
    const remaining = this.getAuditsSync().filter((audit) => audit.id !== auditId);
    this.saveLocalAudits(remaining);
    if (!checkSupabaseConnection()) return;
    const supabase = getSupabase()!;
    const { error } = await supabase.from("audit_records").delete().eq("id", auditId);
    if (error) throw new Error(`Не удалось удалить проверку: ${error.message}`);
  }

  private static async upsertRemoteAudit(updatedAudit: AuditRecord): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    if (updatedAudit.audioData?.startsWith("data:") && !updatedAudit.audioStoragePath) {
      const [header, encoded] = updatedAudit.audioData.split(",", 2);
      const mime = header.match(/data:([^;]+)/)?.[1] || updatedAudit.audioMimeType || "audio/mpeg";
      const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      const safeName = (updatedAudit.audioFileName || "visit-audio.mp3").replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${updatedAudit.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("audit-audio")
        .upload(storagePath, new Blob([bytes], { type: mime }), {
          contentType: mime,
          upsert: false,
        });
      if (uploadError) throw new Error(`Не удалось загрузить аудио: ${uploadError.message}`);
      updatedAudit.audioStoragePath = storagePath;
      updatedAudit.audioData = undefined;
      const { data: signed } = await supabase.storage
        .from("audit-audio")
        .createSignedUrl(storagePath, 60 * 60);
      updatedAudit.audioUrl = signed?.signedUrl;
    }
    const payload = { ...updatedAudit, audioData: undefined, audioUrl: undefined };
    const { error } = await supabase.from("audit_records").upsert({
      id: updatedAudit.id,
      status: updatedAudit.approvalStatus || "SHOPPER_SUBMITTED",
      shopper_id: updatedAudit.shopperId,
      auditor_id: updatedAudit.auditorId,
      primary_approver_id: updatedAudit.primaryApproverId,
      visit_date: updatedAudit.date,
      audit_month: updatedAudit.month || updatedAudit.date.slice(0, 7),
      payload,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Не удалось сохранить проверку ${updatedAudit.id}: ${error.message}`);
  }

  public static getAuditsSync(initialFallback: AuditRecord[] = []): AuditRecord[] {
    if (this.cachedAudits && this.cachedAudits.length > 0) {
      return this.cachedAudits;
    }
    const local = this.loadLocalAudits();
    if (local.length > 0) {
      this.cachedAudits = local;
      return local;
    }
    this.cachedAudits = initialFallback;
    return initialFallback;
  }

  public static async saveAudit(audit: AuditRecord, userRole: UserRole = "auditor"): Promise<AuditRecord> {
    const audits = this.getAuditsSync();
    const existingIdx = audits.findIndex((a) => a.id === audit.id);

    const updatedAudit: AuditRecord = {
      ...audit,
      versionNumber: (audit.versionNumber || 1) + (existingIdx >= 0 ? 1 : 0),
    };

    if (existingIdx >= 0) {
      audits[existingIdx] = updatedAudit;
    } else {
      audits.unshift(updatedAudit);
    }

    this.saveLocalAudits(audits);

    // Save to Supabase if connected
    if (checkSupabaseConnection()) {
      const supabase = getSupabase()!;
      await this.upsertRemoteAudit(updatedAudit);
      this.saveLocalAudits(audits);
    }

    return updatedAudit;
  }

  public static async updateAuditStatus(
    auditId: string,
    targetStatus: AuditStatus,
    actorName: string,
    actorRole: UserRole,
    comment?: string
  ): Promise<{ success: boolean; updatedAudit?: AuditRecord; error?: string }> {
    const audits = this.getAuditsSync();
    const audit = audits.find((a) => a.id === auditId);

    if (!audit) {
      return { success: false, error: `Проверка с ID ${auditId} не найдена в единой базе.` };
    }

    const currentStatus = (audit.approvalStatus as AuditStatus) || "SHOPPER_SUBMITTED";
    const transitionCheck = canTransition(currentStatus, targetStatus, actorRole, comment);

    if (!transitionCheck.success) {
      return { success: false, error: transitionCheck.error };
    }

    const nowStr = new Date().toLocaleString("ru-RU");
    const historyItem = {
      timestamp: nowStr,
      user: actorName,
      role: actorRole,
      action: `Статус изменён с ${currentStatus} на ${targetStatus}`,
      comment: comment,
    };

    const updatedApprovalHistory = [...(audit.approvalHistory || []), historyItem];
    const newVersion = (audit.versionNumber || 1) + 1;

    const versionLogItem = {
      versionNumber: newVersion,
      action: `Переход в статус ${targetStatus}`,
      authorId: actorName,
      authorRole: actorRole,
      timestamp: nowStr,
      managerComment: comment,
      reportVersionId: `VER-${newVersion}`,
    };

    const updatedVersionHistory = [...(audit.versionHistory || []), versionLogItem];

    const updatedAudit: AuditRecord = {
      ...audit,
      approvalStatus: targetStatus as any,
      managerComment: comment || audit.managerComment,
      approvalHistory: updatedApprovalHistory,
      versionHistory: updatedVersionHistory,
      versionNumber: newVersion,
    };

    await this.saveAudit(updatedAudit, actorRole);
    return { success: true, updatedAudit };
  }
}
