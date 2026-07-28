import React, { useState } from "react";
import { AuditRecord, UserAccount, ApprovalStatus } from "../types";
import { createNotification } from "../utils/notificationStore";
import { AudioPlayerWidget } from "./AudioPlayerWidget";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  History,
  FileCheck,
  RotateCcw,
  User,
  Shield,
  HelpCircle,
} from "lucide-react";

interface ApprovalWorkflowPanelProps {
  record: AuditRecord;
  currentUser?: UserAccount;
  onUpdateRecord: (updatedRecord: AuditRecord) => void;
  onNotificationSent?: () => void;
}

export const ApprovalWorkflowPanel: React.FC<ApprovalWorkflowPanelProps> = ({
  record,
  currentUser,
  onUpdateRecord,
  onNotificationSent,
}) => {
  const currentStatus: ApprovalStatus = record.approvalStatus || "PENDING_APPROVAL";

  // State for Manager "Approve with Comments"
  const [showApproveWithCommentsForm, setShowApproveWithCommentsForm] = useState(false);
  const [approveCommentText, setApproveCommentText] = useState("");
  const [approveCommentError, setApproveCommentError] = useState<string | null>(null);

  // State for Manager "Send for Revision"
  const [showManagerCommentForm, setShowManagerCommentForm] = useState(false);
  const [managerCommentText, setManagerCommentText] = useState("");
  const [managerError, setManagerError] = useState<string | null>(null);

  // State for Auditor Revision
  const [revisionOption, setRevisionOption] = useState<"adjust" | "keep">("adjust");
  const [newScoreVal, setNewScoreVal] = useState<number>(record.bpvScore || 90);
  const [auditorCommentText, setAuditorCommentText] = useState("");
  const [auditorError, setAuditorError] = useState<string | null>(null);

  const isManagerOrAdmin =
    currentUser?.role === "manager" || currentUser?.role === "admin";
  const isAuditorOrAdmin =
    currentUser?.role === "auditor" || currentUser?.role === "inspector" || currentUser?.role === "admin";

  // 1. MANAGER APPROVES AUDIT WITHOUT COMMENTS
  const handleManagerApprove = () => {
    const timestamp = new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedHistory = [
      ...(record.approvalHistory || []),
      {
        timestamp,
        user: currentUser?.name || record.manager || "Руководитель",
        role: "Руководитель",
        action: "Утвердил результаты Акта оценки ОКК (без замечаний)",
      },
    ];

    const updatedRecord: AuditRecord = {
      ...record,
      approvalStatus: "APPROVED",
      approvedAt: timestamp,
      approvedBy: currentUser?.name || record.manager || "Руководитель",
      approvalHistory: updatedHistory,
    };

    onUpdateRecord(updatedRecord);

    // Notify Auditor via System + E-mail
    createNotification({
      recipientName: record.inspector || "Аудитор ОКК",
      recipientRole: "auditor",
      recipientEmail: "auditor@company.com",
      title: `Акт ${record.id} успешно утвержден руководителем`,
      message: `Руководитель ${currentUser?.name || record.manager} утвердил результаты оценки по Акту ${record.id} (${record.brand}, ${record.branch}). Отчет сохранен в Реестре.`,
      auditId: record.id,
      type: "AUDIT_APPROVED",
      emailSubject: ` [ОКК] Акт ${record.id} утвержден руководителем`,
      emailBody: `Здравствуйте, ${record.inspector}!\n\nРуководитель ${currentUser?.name || record.manager} полностью утвердил результаты проведенной вами проверки ${record.id}.\nОкончательная оценка BPV (${record.bpvScore}%) зафиксирована в реестре и дэшбордах.`,
    });

    if (onNotificationSent) onNotificationSent();
  };

  // 2. MANAGER APPROVES AUDIT WITH COMMENTS
  const handleManagerApproveWithComments = () => {
    if (!approveCommentText.trim()) {
      setApproveCommentError("Пожалуйста, обязательно напишите ваши замечания при утверждении.");
      return;
    }

    setApproveCommentError(null);
    const timestamp = new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedHistory = [
      ...(record.approvalHistory || []),
      {
        timestamp,
        user: currentUser?.name || record.manager || "Руководитель",
        role: "Руководитель",
        action: "Утвердил Акт оценки ОКК с замечаниями",
        comment: approveCommentText.trim(),
      },
    ];

    const updatedRecord: AuditRecord = {
      ...record,
      approvalStatus: "APPROVED_WITH_COMMENTS",
      approvedAt: timestamp,
      approvedBy: currentUser?.name || record.manager || "Руководитель",
      managerComment: approveCommentText.trim(),
      approvalHistory: updatedHistory,
    };

    onUpdateRecord(updatedRecord);
    setShowApproveWithCommentsForm(false);

    // Notify Auditor via System + E-mail
    createNotification({
      recipientName: record.inspector || "Аудитор ОКК",
      recipientRole: "auditor",
      recipientEmail: "auditor@company.com",
      title: `Акт ${record.id} утвержден руководителем с замечаниями`,
      message: `Руководитель ${currentUser?.name || record.manager} утвердил Акт ${record.id} с замечанием: «${approveCommentText.trim()}»`,
      auditId: record.id,
      type: "AUDIT_APPROVED",
      emailSubject: ` [ОКК] Акт ${record.id} утвержден с замечаниями`,
      emailBody: `Здравствуйте, ${record.inspector}!\n\nРуководитель ${currentUser?.name || record.manager} утвердил Акт ${record.id} с замечанием:\n«${approveCommentText.trim()}».\n\nЗамечания сохранены в истории согласования.`,
    });

    if (onNotificationSent) onNotificationSent();
  };

  // 2. MANAGER REJECTS / REQUESTS REVISION
  const handleManagerSubmitRevision = () => {
    if (!managerCommentText.trim()) {
      setManagerError("Пожалуйста, обязательно напишите комментарий, с чем именно вы не согласны.");
      return;
    }

    setManagerError(null);
    const timestamp = new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedHistory = [
      ...(record.approvalHistory || []),
      {
        timestamp,
        user: currentUser?.name || record.manager || "Руководитель",
        role: currentUser?.role === "manager" ? "Руководитель" : "Сотрудник / Руководитель",
        action: "Подал протест / отправил Акт на пересмотр",
        comment: managerCommentText.trim(),
      },
    ];

    const updatedRecord: AuditRecord = {
      ...record,
      approvalStatus: "REVISION_REQUESTED",
      managerComment: managerCommentText.trim(),
      approvalHistory: updatedHistory,
    };

    onUpdateRecord(updatedRecord);
    setShowManagerCommentForm(false);

    // Notify Auditor via System + E-mail
    createNotification({
      recipientName: record.inspector || "Аудитор ОКК",
      recipientRole: "auditor",
      recipientEmail: "auditor@company.com",
      title: `Акт ${record.id} отправлен на пересмотр`,
      message: `Руководитель ${currentUser?.name || record.manager} не утвердил Акт ${record.id} и отправил его на пересмотр с замечанием: «${managerCommentText.trim()}»`,
      auditId: record.id,
      type: "REVISION_REQUESTED",
      emailSubject: `⚠️ [ОКК] Запрос пересмотра Акта ${record.id}`,
      emailBody: `Уважаемый аудитор ${record.inspector}!\n\nРуководитель ${currentUser?.name || record.manager} направил Акт оценки ${record.id} на пересмотр.\n\nЗамечания руководителя:\n«${managerCommentText.trim()}»\n\nПожалуйста, ознакомьтесь с замечаниями, скорректируйте оценку или напишите обоснование, и сохраните финальную оценку.`,
    });

    if (onNotificationSent) onNotificationSent();
  };

  // 3. AUDITOR SUBMITS REVISED SCORE & COMMENT
  const handleAuditorSubmitFinal = () => {
    if (!auditorCommentText.trim()) {
      setAuditorError("Пожалуйста, обязательно напишите комментарий аудитора по результатам пересмотра.");
      return;
    }

    setAuditorError(null);
    const timestamp = new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const finalScore = revisionOption === "adjust" ? Number(newScoreVal) : record.bpvScore;

    const updatedHistory = [
      ...(record.approvalHistory || []),
      {
        timestamp,
        user: currentUser?.name || record.inspector || "Аудитор ОКК",
        role: "Проверяющий",
        action:
          revisionOption === "adjust"
            ? `Скоректировал балл BPV с ${record.bpvScore}% на ${finalScore}%`
            : `Подтвердил прежний балл BPV (${record.bpvScore}%)`,
        comment: auditorCommentText.trim(),
        oldScore: record.bpvScore,
        newScore: finalScore,
      },
    ];

    const updatedRecord: AuditRecord = {
      ...record,
      approvalStatus: "FINALIZED",
      bpvScore: finalScore,
      revisedScore: finalScore,
      auditorRevisionComment: auditorCommentText.trim(),
      approvalHistory: updatedHistory,
    };

    onUpdateRecord(updatedRecord);

    // Notify Manager via System + E-mail
    createNotification({
      recipientName: record.manager || "Руководитель",
      recipientRole: "manager",
      recipientEmail: "manager@company.com",
      title: `Акт ${record.id}: Аудитор предоставил финальную оценку`,
      message: `Аудитор ${record.inspector} обработал запрос пересмотра Акта ${record.id}. Финальный балл BPV: ${finalScore}%. Комментарий: «${auditorCommentText.trim()}»`,
      auditId: record.id,
      type: "REVISION_SUBMITTED",
      emailSubject: ` [ОКК] Пересмотр Акта ${record.id} завершен аудитором`,
      emailBody: `Здравствуйте, ${record.manager || "Руководитель"}!\n\nАудитор ${record.inspector} завершил пересмотр Акта ${record.id}.\n\nФинальная оценка BPV: ${finalScore}%\nКомментарий аудитора:\n«${auditorCommentText.trim()}»\n\nРезультаты сохранены в системе ОКК.`,
    });

    if (onNotificationSent) onNotificationSent();
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Top Workflow Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            {currentStatus === "APPROVED" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {currentStatus === "APPROVED_WITH_COMMENTS" && <MessageSquare className="w-5 h-5 text-amber-400" />}
            {currentStatus === "PENDING_APPROVAL" && <Clock className="w-5 h-5 text-amber-400" />}
            {currentStatus === "REVISION_REQUESTED" && <RotateCcw className="w-5 h-5 text-amber-500 animate-spin-slow" />}
            {currentStatus === "FINALIZED" && <FileCheck className="w-5 h-5 text-blue-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Статус согласования:</span>
              {currentStatus === "APPROVED" && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Утвержден
                </span>
              )}
              {currentStatus === "APPROVED_WITH_COMMENTS" && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Утвержден с замечаниями
                </span>
              )}
              {currentStatus === "PENDING_APPROVAL" && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> На согласовании у руководителя
                </span>
              )}
              {currentStatus === "REVISION_REQUESTED" && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> На пересмотре у проверяющего
                </span>
              )}
              {currentStatus === "FINALIZED" && (
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" /> Финализирован аудитором
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Руководитель: <strong className="text-slate-200">{record.manager || "Петров В.В."}</strong> | Проверяющий: <strong className="text-slate-200">{record.inspector}</strong>
            </p>
          </div>
        </div>

        {/* Current Score Pill */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Оценка BPV</div>
          <div className="text-lg font-black text-amber-400">{record.bpvScore}%</div>
        </div>
      </div>

      {/* AUDIO RECORDING PLAYER */}
      <AudioPlayerWidget
        audioUrl={record.audioUrl}
        audioFileName={record.audioFileName}
        auditId={record.id}
      />

      {/* SECTION: MANAGER ACTIONS (When PENDING_APPROVAL or FINALIZED) */}
      {isManagerOrAdmin && (currentStatus === "PENDING_APPROVAL" || currentStatus === "FINALIZED") && (
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Панель решения Руководителя ({currentUser?.name || record.manager || "Руководитель"})</span>
          </div>

          {!showManagerCommentForm && !showApproveWithCommentsForm ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleManagerApprove}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Утвердить без замечаний</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowApproveWithCommentsForm(true);
                  setShowManagerCommentForm(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Утвердить с замечаниями</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowManagerCommentForm(true);
                  setShowApproveWithCommentsForm(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-all border border-amber-500/30 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Подать протест / Отправить на пересмотр</span>
              </button>
            </div>
          ) : showApproveWithCommentsForm ? (
            <div className="space-y-3 animate-fadeIn">
              <label className="text-xs text-amber-300 font-bold block">
                Укажите ваши замечания или рекомендации для аудитора/персонала при утверждении: <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={approveCommentText}
                onChange={(e) => setApproveCommentText(e.target.value)}
                placeholder="Пример: Акт утверждается. Однако обратите внимание сотрудника на более наглядную демонстрацию сопутствующих аксессуаров..."
                className="w-full bg-slate-950 border border-amber-500/60 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
              {approveCommentError && (
                <div className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{approveCommentError}</span>
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleManagerApproveWithComments}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Подтвердить утверждение с замечаниями</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowApproveWithCommentsForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-fadeIn">
              <label className="text-xs text-amber-300 font-bold block">
                Укажите причину протеста и подробный комментарий, с чем именно вы не согласны: <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={managerCommentText}
                onChange={(e) => setManagerCommentText(e.target.value)}
                placeholder="Пример: Подаю протест по пункту 3.2. Не согласен с оценкой речевых стандартов в диалоге 02:15. Просьба переслушать аудиозапись..."
                className="w-full bg-slate-950 border border-amber-500/60 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
              {managerError && (
                <div className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{managerError}</span>
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleManagerSubmitRevision}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить протест и замечания аудитору</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManagerCommentForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info banner for Auditor when status is PENDING_APPROVAL */}
      {currentStatus === "PENDING_APPROVAL" && !isManagerOrAdmin && (
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Акт находится на согласовании у руководителя ({record.manager || "Петров В.В."})</span>
          </div>
          <p className="text-slate-400">
            Акт передан руководителю для утверждения или возможного запроса пересмотра. Вносить изменения на этом этапе не требуется.
          </p>
        </div>
      )}

      {/* Info banner for Manager when status is REVISION_REQUESTED */}
      {currentStatus === "REVISION_REQUESTED" && !isAuditorOrAdmin && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Акт находится на пересмотре у проверяющего ({record.inspector})</span>
          </div>
          {record.managerComment && (
            <p className="text-slate-300">
              Вы направили замечания аудитору: <strong className="italic">«{record.managerComment}»</strong>.
              Ожидайте решение и комментарии аудитора по результатам повторного анализа.
            </p>
          )}
        </div>
      )}

      {/* Info banner when status is APPROVED */}
      {currentStatus === "APPROVED" && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Результаты Акта ОКК полностью утверждены</span>
          </div>
          <p className="text-slate-400">
            {record.approvedBy ? `Утвердил: ${record.approvedBy}` : "Руководитель утвердил Акт"}{" "}
            {record.approvedAt ? `(${record.approvedAt})` : ""}. Окончательная оценка BPV зафиксирована.
          </p>
        </div>
      )}

      {/* Info banner when status is APPROVED_WITH_COMMENTS */}
      {currentStatus === "APPROVED_WITH_COMMENTS" && (
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Акт ОКК утвержден руководителем с замечаниями</span>
          </div>
          <p className="text-slate-300">
            {record.approvedBy ? `Утвердил: ${record.approvedBy}` : "Руководитель утвердил Акт"}{" "}
            {record.approvedAt ? `(${record.approvedAt})` : ""}.
          </p>
          {record.managerComment && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-2.5 text-amber-200 italic">
              Замечания руководителя: «{record.managerComment}»
            </div>
          )}
        </div>
      )}

      {/* SECTION: AUDITOR REVISION ACTIONS (When REVISION_REQUESTED) */}
      {isAuditorOrAdmin && currentStatus === "REVISION_REQUESTED" && (
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Акт отправлен на пересмотр руководителем!</span>
          </div>

          {/* Manager Comment Display */}
          {record.managerComment && (
            <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Замечание руководителя ({record.manager}):
              </span>
              <p className="italic">«{record.managerComment}»</p>
            </div>
          )}

          {/* Auditor Form */}
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold block">Решение аудитора:</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer bg-slate-900 border border-slate-800 p-2.5 rounded-xl hover:border-blue-500">
                  <input
                    type="radio"
                    name="revisionOption"
                    checked={revisionOption === "adjust"}
                    onChange={() => setRevisionOption("adjust")}
                    className="text-blue-500"
                  />
                  <span>Скоректировать балл BPV</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer bg-slate-900 border border-slate-800 p-2.5 rounded-xl hover:border-blue-500">
                  <input
                    type="radio"
                    name="revisionOption"
                    checked={revisionOption === "keep"}
                    onChange={() => setRevisionOption("keep")}
                    className="text-blue-500"
                  />
                  <span>Оставить прежнюю оценку ({record.bpvScore}%)</span>
                </label>
              </div>
            </div>

            {revisionOption === "adjust" && (
              <div className="w-48 space-y-1">
                <label className="text-xs text-slate-400 font-medium block">Новый балл BPV (%):</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newScoreVal}
                  onChange={(e) => setNewScoreVal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-blue-300 font-bold focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-bold block">
                Комментарий аудитора по результатам пересмотра: <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={auditorCommentText}
                onChange={(e) => setAuditorCommentText(e.target.value)}
                placeholder="Например: Аудиозапись повторно прослушана. Оценка скорректирована с учетом аргументов руководителя..."
                className="w-full bg-slate-950 border border-blue-500/60 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-400"
              />
              {auditorError && (
                <div className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{auditorError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAuditorSubmitFinal}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Сохранить финальную оценку и отправить руководителю</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION: HISTORY TIMELINE */}
      {record.approvalHistory && record.approvalHistory.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <History className="w-4 h-4 text-blue-400" />
            <span>Цепочка действий и история согласования ({record.approvalHistory.length})</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-800/60">
            {record.approvalHistory.map((item, idx) => (
              <div key={idx} className="pt-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    {item.user} <span className="text-slate-500 font-normal">({item.role})</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                </div>
                <div className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>{item.action}</span>
                </div>
                {item.comment && (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-300 italic text-[11px] mt-1">
                    «{item.comment}»
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
