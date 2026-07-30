import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 30 };

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается." });
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceKey) return res.status(503).json({ error: "Авторизация не настроена." });

  try {
    const login = String(req.body?.login || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!login || !password) return res.status(400).json({ error: "Введите логин и пароль." });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: profile } = await admin
      .from("profiles")
      .select("id,login,role,full_name,status,position,network_scope,created_at")
      .eq("login", login)
      .maybeSingle();
    if (!profile || profile.status !== "active") {
      return res.status(401).json({ error: "Неверный логин или пароль либо доступ заблокирован." });
    }

    const { data: authUser, error: userError } = await admin.auth.admin.getUserById(profile.id);
    const email = authUser.user?.email;
    if (userError || !email) return res.status(401).json({ error: "Неверный логин или пароль." });

    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data: signed, error: signError } = await authClient.auth.signInWithPassword({ email, password });
    if (signError || !signed.session) {
      return res.status(401).json({ error: "Неверный логин или пароль." });
    }

    return res.status(200).json({
      success: true,
      accessToken: signed.session.access_token,
      refreshToken: signed.session.refresh_token,
      profile,
    });
  } catch (error) {
    console.error("Login route failed:", error);
    return res.status(500).json({ error: "Вход временно недоступен." });
  }
}
