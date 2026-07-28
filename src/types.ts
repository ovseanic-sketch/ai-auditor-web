export type UserRole = "admin" | "auditor" | "manager" | "supervisor" | "operator" | "inspector" | "shopper";

export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "APPROVED_WITH_COMMENTS" | "REVISION_REQUESTED" | "FINALIZED";

export interface ApprovalHistoryItem {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  comment?: string;
  oldScore?: number;
  newScore?: number;
}

export interface AppNotification {
  id: string;
  recipientName: string; // Target manager or auditor name
  recipientRole?: UserRole;
  recipientEmail?: string;
  title: string;
  message: string;
  auditId: string;
  type: "NEW_AUDIT_FOR_APPROVAL" | "AUDIT_APPROVED" | "REVISION_REQUESTED" | "REVISION_SUBMITTED" | "PASSWORD_RESET_REQUEST" | "AUDIT_DELETE_REQUEST";
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
  status: "active" | "blocked";
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

export interface AuditFormData {
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
  employeeCode: string;
  inspector: string;
  category: string;
  target: string;
  result: string;
  comment: string;
  standards: string;
  bpvScore?: number;
  speechScore?: number;
  salesDriveScore?: number;
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
  bpvScore: number;
  cashScore?: number;
  speechScore: number;
  salesDriveScore: number;
  stopFactors: number;
  reportSummary: string;
  fullReportText?: string;
  audioFileName?: string;
  audioUrl?: string;

  // Approval process fields
  approvalStatus?: ApprovalStatus; // "PENDING_APPROVAL" | "APPROVED" | "REVISION_REQUESTED" | "FINALIZED"
  managerComment?: string;
  auditorRevisionComment?: string;
  revisedScore?: number;
  approvalHistory?: ApprovalHistoryItem[];
  approvedAt?: string;
  approvedBy?: string;
}
