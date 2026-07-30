import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 60 };

const ALLOWED_ROLES = new Set(["admin", "auditor", "manager", "shopper"]);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается." });
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceKey) {
    return res.status(503).json({ error: "Серверное приглашение пользователей ещё не настроено." });
  }

  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const authClient = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return res.status(401).json({ error: "Сессия истекла." });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: caller } = await admin
      .from("profiles")
      .select("role,status")
      .eq("id", authData.user.id)
      .single();
    if (caller?.role !== "admin" || caller?.status !== "active") {
      return res.status(403).json({ error: "Только активный администратор может добавлять пользователей." });
    }

    const { email, fullName, role, position, network } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(fullName || "").trim();
    if (!cleanEmail.includes("@") || !cleanName || !ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: "Заполните корректно имя, e-mail и роль." });
    }

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
      data: { full_name: cleanName, role },
      redirectTo: `${String(req.headers.origin || "").replace(/\/$/, "")}/`,
    });
    if (inviteError || !invited.user) {
      const duplicate = /already|registered|exists/i.test(inviteError?.message || "");
      return res.status(duplicate ? 409 : 400).json({
        error: duplicate ? "Пользователь с таким e-mail уже существует." : inviteError?.message || "Не удалось отправить приглашение.",
      });
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: invited.user.id,
      login: cleanEmail,
      full_name: cleanName,
      role,
      status: "active",
      position: String(position || "").trim() || null,
      network_scope: String(network || "").trim() || null,
      updated_at: new Date().toISOString(),
    });
    if (profileError) return res.status(500).json({ error: `Пользователь приглашён, но профиль не сохранён: ${profileError.message}` });
    return res.status(200).json({ success: true, userId: invited.user.id });
  } catch (error: any) {
    console.error("Admin invite failed:", error);
    return res.status(500).json({ error: "Не удалось создать пользователя. Повторите попытку." });
  }
}
