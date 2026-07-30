import { UserRole } from "../types";

export type AuditStatus =
  | "DRAFT"
  | "SHOPPER_SUBMITTED"
  | "AI_PROCESSING"
  | "AUDITOR_REVIEW"
  | "INVALID"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "APPROVED_WITH_COMMENT"
  | "REVISION_REQUESTED"
  | "SHOPPER_CLARIFICATION_REQUESTED"
  | "SHOPPER_RESUBMITTED"
  | "FINALIZED_NO_SCORE_CHANGE"
  | "FINALIZED_WITH_SCORE_CHANGE";

export interface StateTransitionResult {
  success: boolean;
  newStatus?: AuditStatus;
  error?: string;
}

export const ALLOWED_TRANSITIONS: Record<AuditStatus, AuditStatus[]> = {
  DRAFT: ["SHOPPER_SUBMITTED"],
  SHOPPER_SUBMITTED: ["AI_PROCESSING", "INVALID"],
  AI_PROCESSING: ["AUDITOR_REVIEW", "SHOPPER_SUBMITTED"],
  AUDITOR_REVIEW: ["INVALID", "PENDING_APPROVAL"],
  INVALID: [],
  PENDING_APPROVAL: ["APPROVED", "APPROVED_WITH_COMMENT", "REVISION_REQUESTED"],
  APPROVED: [],
  APPROVED_WITH_COMMENT: [],
  REVISION_REQUESTED: [
    "FINALIZED_NO_SCORE_CHANGE",
    "FINALIZED_WITH_SCORE_CHANGE",
    "SHOPPER_CLARIFICATION_REQUESTED",
  ],
  SHOPPER_CLARIFICATION_REQUESTED: ["SHOPPER_RESUBMITTED"],
  SHOPPER_RESUBMITTED: ["AUDITOR_REVIEW"],
  FINALIZED_NO_SCORE_CHANGE: [],
  FINALIZED_WITH_SCORE_CHANGE: [],
};

export function canTransition(
  currentStatus: AuditStatus,
  targetStatus: AuditStatus,
  role: UserRole,
  comment?: string
): StateTransitionResult {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      success: false,
      error: `Переход из статуса "${currentStatus}" в "${targetStatus}" не разрешен законом бизнес-процесса.`,
    };
  }

  // Mandatory comment checks
  if (
    targetStatus === "INVALID" ||
    targetStatus === "APPROVED_WITH_COMMENT" ||
    targetStatus === "REVISION_REQUESTED" ||
    targetStatus === "SHOPPER_CLARIFICATION_REQUESTED" ||
    targetStatus === "FINALIZED_NO_SCORE_CHANGE" ||
    targetStatus === "FINALIZED_WITH_SCORE_CHANGE"
  ) {
    if (!comment || comment.trim().length === 0) {
      return {
        success: false,
        error: `Для перехода в статус "${targetStatus}" требуется обязательное текстовое обоснование/комментарий.`,
      };
    }
  }

  // Role permissions check
  if (targetStatus === "SHOPPER_SUBMITTED" && role !== "shopper" && role !== "admin") {
    return { success: false, error: "Только шоппер может отправлять анкета на проверку." };
  }

  if (targetStatus === "PENDING_APPROVAL" && role !== "auditor" && role !== "admin") {
    return { success: false, error: "Только аудитор может передавать проверку на согласование." };
  }

  if (
    (targetStatus === "AI_PROCESSING" ||
      targetStatus === "AUDITOR_REVIEW" ||
      targetStatus === "INVALID" ||
      targetStatus === "FINALIZED_NO_SCORE_CHANGE" ||
      targetStatus === "FINALIZED_WITH_SCORE_CHANGE" ||
      targetStatus === "SHOPPER_CLARIFICATION_REQUESTED") &&
    role !== "auditor" &&
    role !== "inspector" &&
    role !== "admin"
  ) {
    return { success: false, error: "Этот переход разрешён только аудитору." };
  }

  if (targetStatus === "SHOPPER_RESUBMITTED" && role !== "shopper" && role !== "admin") {
    return { success: false, error: "Только шоппер может отправить запрошенное уточнение." };
  }

  if (
    (targetStatus === "APPROVED" || targetStatus === "APPROVED_WITH_COMMENT" || targetStatus === "REVISION_REQUESTED") &&
    role !== "manager" &&
    role !== "admin"
  ) {
    return { success: false, error: "Только назначенный руководитель может согласовывать или отправлять на пересмотр." };
  }

  return { success: true, newStatus: targetStatus };
}

export function isFinalStatus(status: AuditStatus): boolean {
  return (
    status === "APPROVED" ||
    status === "APPROVED_WITH_COMMENT" ||
    status === "FINALIZED_NO_SCORE_CHANGE" ||
    status === "FINALIZED_WITH_SCORE_CHANGE"
  );
}
