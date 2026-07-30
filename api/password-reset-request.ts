import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 30 };

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается." });
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return res.status(503).json({ error: "Сервис уведомлений не настроен." });

  try {
    const login = String(req.body?.login || "").trim().toLowerCase();
    const comment = String(req.body?.comment || "").trim().slice(0, 500);
    if (!login) return res.status(400).json({ error: "Укажите логин." });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: user } = await admin
      .from("profiles")
      .select("id,login,full_name,role,status")
      .eq("login", login)
      .maybeSingle();

    // Always return the same public result, so the endpoint does not disclose accounts.
    if (user && user.status !== "archived") {
      const { data: admins } = await admin
        .from("profiles")
        .select("id,full_name")
        .eq("role", "admin")
        .eq("status", "active");

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("app_notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_role", "admin")
        .eq("payload->>type", "PASSWORD_RESET_REQUEST")
        .eq("payload->>requesterLogin", login)
        .gte("created_at", tenMinutesAgo);

      if (!count) {
        const now = new Date().toISOString();
        await admin.from("app_notifications").insert(
          (admins || []).map((target: any) => {
            const id = `pwd-${Date.now()}-${target.id.slice(0, 8)}`;
            const payload = {
              id,
              recipientName: target.full_name,
              recipientId: target.id,
              recipientRole: "admin",
              title: "Запрос на изменение пароля",
              message: `${user.full_name} (логин: ${user.login}) просит изменить пароль.${comment ? ` Комментарий: ${comment}` : ""}`,
              auditId: "",
              type: "PASSWORD_RESET_REQUEST",
              requesterId: user.id,
              requesterLogin: user.login,
              read: false,
              createdAt: new Date().toLocaleString("ru-RU"),
            };
            return {
              id,
              recipient_id: target.id,
              recipient_role: "admin",
              payload,
              read: false,
              created_at: now,
            };
          })
        );
      }
    }
    return res.status(200).json({
      success: true,
      message: "Запрос зарегистрирован. Администратор изменит пароль и сообщит новые данные.",
    });
  } catch (error) {
    console.error("Password request failed:", error);
    return res.status(500).json({ error: "Не удалось зарегистрировать запрос." });
  }
}
