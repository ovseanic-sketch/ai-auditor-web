export type UserRole = "admin" | "manager" | "inspector";

export interface UserAccount {
  id: string;
  login: string;
  password?: string;
  name: string;
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
  time?: string;
  brand: string;
  branch: string;
  city: string;
  employeeCode: string;
  inspector: string;
  category: string;
  target: string;
  result: string;
  comment: string;
  standards: string;
}

export interface PresetAuditSample {
  id: string;
  title: string;
  description: string;
  auditData: AuditFormData;
  transcript: string;
}
