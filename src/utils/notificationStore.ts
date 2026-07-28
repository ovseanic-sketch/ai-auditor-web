import { AppNotification, UserRole } from "../types";

const NOTIFICATIONS_STORAGE_KEY = "okk_notifications_v1";

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-001",
    recipientName: "Петров В.В.",
    recipientRole: "manager",
    recipientEmail: "petrov@company.com",
    title: "Новый Акт оценки ОКК на согласовании",
    message: "Аудитор №17 сформировал Акт AUD-2026-001 (Orange, Кишинев). Пожалуйста, проверьте результаты и утвердите или отправьте на пересмотр.",
    auditId: "AUD-2026-001",
    type: "NEW_AUDIT_FOR_APPROVAL",
    read: false,
    createdAt: "26.07.2026, 14:35",
    emailSentSimulation: {
      toEmail: "petrov@company.com",
      toName: "Петров В.В. (Руководитель)",
      subject: " [ОКК] Поступил новый Акт оценки AUD-2026-001 на согласование",
      bodyText: `Уважаемый Петров В.В.!\n\nАудитор сформировал новый Акт оценки ОКК AUD-2026-001.\nЛокация: Кишинев, Rîșcani (Филиал №17)\nОценка BPV: 100%\n\nПожалуйста, войдите в систему ОКК, ознакомьтесь с подробным отчетом и утвердите результаты или отправьте на пересмотр с комментарием.`
    }
  }
];

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return INITIAL_NOTIFICATIONS;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load notifications", e);
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error("Failed to save notifications", e);
  }
}

export function createNotification(params: {
  recipientName: string;
  recipientRole?: UserRole;
  recipientEmail?: string;
  title: string;
  message: string;
  auditId?: string;
  type: "NEW_AUDIT_FOR_APPROVAL" | "AUDIT_APPROVED" | "REVISION_REQUESTED" | "REVISION_SUBMITTED" | "PASSWORD_RESET_REQUEST" | "AUDIT_DELETE_REQUEST";
  emailSubject?: string;
  emailBody?: string;
}): AppNotification {
  const currentList = loadNotifications();
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipientName: params.recipientName,
    recipientRole: params.recipientRole,
    recipientEmail: params.recipientEmail || "manager@company.com",
    title: params.title,
    message: params.message,
    auditId: params.auditId || "",
    type: params.type,
    read: false,
    createdAt: new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    emailSentSimulation: {
      toEmail: params.recipientEmail || "manager@company.com",
      toName: params.recipientName,
      subject: params.emailSubject || `[ОКК Уведомление] ${params.title}`,
      bodyText: params.emailBody || params.message,
    }
  };

  const updated = [newNotif, ...currentList];
  saveNotifications(updated);
  return newNotif;
}
