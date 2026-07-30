export type UserRole = "admin" | "auditor" | "manager" | "supervisor" | "operator" | "inspector" | "shopper";

export type ApprovalStatus =
  | "DRAFT"
  | "SHOPPER_SUBMITTED"
  | "AI_PROCESSING"
  | "AUDITOR_REVIEW"
  | "INVALID"
  | "SHOPPER_CLARIFICATION_REQUESTED"
  | "SHOPPER_RESUBMITTED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "APPROVED_WITH_COMMENT"
  | "REVISION_REQUESTED"
  | "FINALIZED_NO_SCORE_CHANGE"
  | "FINALIZED_WITH_SCORE_CHANGE";

export interface ApprovalHistoryItem {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  comment?: string;
  oldScore?: number;
  newScore?: number;
}

export interface CashData {
  fiscalCheckIssued: "Да" | "Нет";
  cashDisciplineObserved: "Да" | "Нет";
  warrantyCardIssued?: "Да" | "Нет" | "N/A";
  comment?: string;
  source?: "shopper_manual" | "auditor_confirmed" | "auditor_corrected";
}

export interface VersionHistoryLogItem {
  versionNumber: number;
  action: string;
  authorId: string;
  authorRole: string;
  timestamp: string;
  managerComment?: string;
  auditorReturnComment?: string;
  shopperClarificationComment?: string;
  changedFields?: { fieldName: string; oldValue: any; newValue: any }[];
  reportVersionId: string;
}

export interface AppNotification {
  id: string;
  recipientName: string; // Target manager or auditor name
  recipientId?: string;
  recipientRole?: UserRole;
  recipientEmail?: string;
  title: string;
  message: string;
  auditId: string;
  type: "NEW_AUDIT_FOR_APPROVAL" | "AUDIT_APPROVED" | "REVISION_REQUESTED" | "REVISION_SUBMITTED" | "PASSWORD_RESET_REQUEST" | "AUDIT_DELETE_REQUEST" | "SHOPPER_CLARIFICATION";
  read: boolean;
  createdAt: string;
  emailSentSimulation?: {
    toEmail: string;
    toName: string;
    subject: string;
    bodyText: string;
  };
}

export interface UserAccount {
  id: string;
  login: string;
  password?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  network?: string;
  position?: string;
  role: UserRole;
  status: "active" | "blocked" | "archived";
  createdAt: string;
}

export interface UserProfile {
  id: string;
  login: string;
  role: UserRole;
  name: string;
  title: string;
  avatarUrl?: string;
}

export interface ShopperFormData {
  shopperName: string;
  visitDate: string;
  auditMonth: string;
  startTime: string;
  endTime: string;
  network: string;
  city: string;
  branch: string;
  consultantName: string;
  category?: string;
  target?: string;
  uniformStatus: "standard" | "partial" | "violation";
  neatnessStatus: "neat" | "minor_remarks" | "unneat";
  badgeStatus: "present" | "missing" | "reversed";
  appearanceComment?: string;
  cleanlinessRating: number;
  merchandisingRating: number;
  assortmentRating: number;
  storeComment?: string;
  staffAvailability: "immediate" | "had_to_search" | "absent";
  noGroupingStatus: "dispersed" | "grouped" | "smartphones";
  hallCleanlinessStatus: "clean" | "minor_issues" | "messy";
  hallComment?: string;
  whatLiked: string;
  whatDisliked: string;
  overallComment?: string;
  audioFileName?: string;
  audioUrl?: string;
  cashData?: CashData;
}

export interface SalesDriverItem {
  id: string;
  name: string;
  status: "Проявлен" | "Частично" | "Не проявлен" | "N/A";
  points: number; // 2, 1, 0
  maxPoints: number; // 2
  explanation?: string;
}

export interface DisputedPointItem {
  criterionId: string;
  criterionName: string;
  shopperInput: string;
  audioInput: string;
  note: string;
  resolvedStatus?: string;
}

export interface InspectorEditHistoryItem {
  timestamp: string;
  author: string;
  criterionId: string;
  criterionName: string;
  oldStatus: string;
  newStatus: string;
  oldPoints: number;
  newPoints: number;
  comment: string;
  originalShopperValue?: string;
}

export interface AuditFormData {
  id?: string;
  checkType?: string;
  date: string;
  month?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  brand: string;
  branch: string;
  city: string;
  region?: string;
  group?: string;
  manager?: string;
  primaryApproverId?: string;
  employeeCode: string;
  inspector: string;
  shopperName?: string;
  shopperId?: string;
  auditorName?: string;
  auditorId?: string;
  category: string;
  target: string;
  result: string;
  comment: string;
  standards: string;
  bpvScore?: number;
  speechScore?: number;
  salesDriveScore?: number;
  shopperSubmissionText?: string;
  shopperData?: ShopperFormData;
  machineTranscript?: string;
  auditorTranscript?: string;
  aiAnalysisText?: string;
  auditorFinalReport?: string;
  salesDrivers?: SalesDriverItem[];
  disputedPoints?: DisputedPointItem[];
  sourceAuditId?: string;
  cashData?: CashData;
}

export interface PresetAuditSample {
  id: string;
  title: string;
  description: string;
  auditData: AuditFormData;
  transcript: string;
}

export interface AuditRecord {
  id: string;
  primaryApproverId?: string;
  date: string;
  month?: string;
  startTime?: string;
  endTime?: string;
  brand: string;
  branch: string;
  city: string;
  region?: string;
  group?: string; // e.g. "Северный регион"
  manager?: string; // FIO/Name of manager
  category?: string;
  target?: string;
  result?: string;
  comment?: string;
  checkType: string;
  employeeCode: string;
  inspector: string;

  // Prompt 3.1 & 3.2 Separate Fields
  shopperSubmissionText?: string; // Read-only shopper submission
  shopperData?: ShopperFormData; // Structured shopper form
  machineTranscript?: string; // AI generated transcript
  auditorTranscript?: string; // Auditor edited transcript
  aiAnalysisText?: string; // Evidence AI analysis
  auditorFinalReport?: string; // ONLY text considered final report
  shopperName?: string;
  shopperId?: string;
  auditorName?: string;
  auditorId?: string;
  sourceAuditId?: string;
  audioFileName?: string;
  audioUrl?: string;
  audioData?: string; // Permanent Base64 Data URL
  audioMimeType?: string;
  audioStoragePath?: string;
  additionalAudioData?: string;
  additionalAudioName?: string;
  calculation?: any;
  criteria?: any[];
  cashData?: CashData;

  bpvScore: number;
  cashScore?: number;
  speechScore: number;
  salesDriveScore: number;
  stopFactors: number;
  reportSummary: string;
  fullReportText?: string;

  // Stage 2 & Prompt 3.2 additions
  salesDrivers?: SalesDriverItem[];
  disputedPoints?: DisputedPointItem[];
  inspectorEdits?: InspectorEditHistoryItem[];

  // Approval process fields
  approvalStatus?: ApprovalStatus;
  managerComment?: string;
  auditorRevisionComment?: string;
  auditorReturnComment?: string;
  shopperClarificationComment?: string;
  allowedShopperSections?: string[];
  revisedScore?: number;
  approvalHistory?: ApprovalHistoryItem[];
  versionHistory?: VersionHistoryLogItem[];
  versionNumber?: number;
  approvedAt?: string;
  approvedBy?: string;
}
