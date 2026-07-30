import { AppNotification, UserRole } from "../types";
import { checkSupabaseConnection, getSupabase } from "../services/supabaseClient";

const NOTIFICATIONS_STORAGE_KEY = "okk_notifications_v1";

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load notifications", e);
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error("Failed to save notifications", e);
  }
  if (checkSupabaseConnection()) {
    const supabase = getSupabase();
    void Promise.all(
      notifications.map((notification) =>
        supabase?.from("app_notifications").upsert({
          id: notification.id,
          recipient_id: notification.recipientId,
          recipient_role: notification.recipientRole,
          payload: notification,
          read: notification.read,
        })
      )
    );
  }
}

export function createNotification(params: {
  recipientName: string;
  recipientId?: string;
  recipientRole?: UserRole;
  recipientEmail?: string;
  title: string;
  message: string;
  auditId?: string;
  type: AppNotification["type"];
  emailSubject?: string;
  emailBody?: string;
}): AppNotification {
  const currentList = loadNotifications();
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipientName: params.recipientName,
    recipientId: params.recipientId,
    recipientRole: params.recipientRole,
    recipientEmail: params.recipientEmail,
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
      toEmail: params.recipientEmail || "",
      toName: params.recipientName,
      subject: params.emailSubject || `[ОКК Уведомление] ${params.title}`,
      bodyText: params.emailBody || params.message,
    }
  };

  const updated = [newNotif, ...currentList];
  saveNotifications(updated);
  return newNotif;
}

export async function loadNotificationsRemote(): Promise<AppNotification[]> {
  if (!checkSupabaseConnection()) return loadNotifications();
  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from("app_notifications")
    .select("payload,read")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Не удалось загрузить уведомления: ${error.message}`);
  const notifications = (data || []).map((row: any) => ({ ...row.payload, read: row.read }));
  saveNotifications(notifications);
  return notifications;
}
