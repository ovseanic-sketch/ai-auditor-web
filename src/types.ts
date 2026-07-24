export interface AuditFormData {
  checkType: string;
  date: string;
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
