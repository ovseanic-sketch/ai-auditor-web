import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 60 };

const ALLOWED_ROLES = new Set(["admin", "auditor", "manager", "shopper"]);
const LOGIN_PATTERN = /^[\p{L}\p{N}._-]{3,64}$/u;

function internalEmail(login: string): string {
  if (login.includes("@")) return login.toLowerCase();
  const encoded = Buffer.from(login.trim().toLowerCase(), "utf8").toString("base64url");
  return `u.${encoded}@auth.ai-auditor.app`;
}

function cleanLogin(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export default async function handler(req: any, res: any) {
  if (!["POST", "PATCH", "DELETE"].includes(req.method)) {
    return res.status(405).json({ error: "Метод не поддерживается." });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceKey) {
    return res.status(503).json({ error: "Серверное управление пользователями не настроено." });
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
      return res.status(403).json({ error: "Действие доступно только активному администратору." });
    }

    const body = req.body || {};
    const action = String(body.action || (req.method === "POST" ? "create" : "update"));

    if (action === "create") {
      const login = cleanLogin(body.login);
      const fullName = String(body.fullName || "").trim();
      const password = String(body.password || "");
      const role = String(body.role || "");
      if (!LOGIN_PATTERN.test(login) || !fullName || password.length < 8 || !ALLOWED_ROLES.has(role)) {
        return res.status(400).json({
          error: "Укажите уникальный логин (3–64 символа), ФИО, роль и пароль не короче 8 символов.",
        });
      }

      const { data: existing } = await admin.from("profiles").select("id").eq("login", login).maybeSingle();
      if (existing) return res.status(409).json({ error: "Пользователь с таким логином уже существует." });

      const authEmail = internalEmail(login);
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role, login },
      });
      if (createError || !created.user) {
        const duplicate = /already|registered|exists/i.test(createError?.message || "");
        return res.status(duplicate ? 409 : 400).json({
          error: duplicate ? "Пользователь с таким логином уже существует." : createError?.message || "Не удалось создать пользователя.",
        });
      }

      const profile = {
        id: created.user.id,
        login,
        full_name: fullName,
        role,
        status: "active",
        position: String(body.position || "").trim() || null,
        network_scope: String(body.network || "").trim() || null,
        updated_at: new Date().toISOString(),
      };
      const { error: profileError } = await admin.from("profiles").upsert(profile);
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
        return res.status(500).json({ error: `Не удалось сохранить профиль: ${profileError.message}` });
      }
      return res.status(200).json({ success: true, profile });
    }

    const userId = String(body.userId || "");
    if (!userId) return res.status(400).json({ error: "Не указан пользователь." });
    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (targetError || !target) return res.status(404).json({ error: "Пользователь не найден." });

    if (action === "set_password") {
      const password = String(body.password || "");
      if (password.length < 8) return res.status(400).json({ error: "Пароль должен содержать не менее 8 символов." });
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === "set_status" || action === "archive" || action === "restore") {
      const status =
        action === "archive" ? "archived" : action === "restore" ? "active" : String(body.status || "");
      if (!["active", "blocked", "archived"].includes(status)) {
        return res.status(400).json({ error: "Недопустимый статус пользователя." });
      }
      if (target.role === "admin" && target.status === "active" && status !== "active") {
        const { count } = await admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin")
          .eq("status", "active");
        if ((count || 0) <= 1) {
          return res.status(409).json({ error: "Нельзя заблокировать или архивировать последнего активного администратора." });
        }
      }
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: status === "active" ? "none" : "876000h",
      });
      if (authUpdateError) return res.status(400).json({ error: authUpdateError.message });
      const { data: profile, error } = await admin
        .from("profiles")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, profile });
    }

    if (action === "update") {
      const login = cleanLogin(body.login);
      const fullName = String(body.fullName || "").trim();
      const role = String(body.role || "");
      if (!LOGIN_PATTERN.test(login) || !fullName || !ALLOWED_ROLES.has(role)) {
        return res.status(400).json({ error: "Проверьте логин, ФИО и роль." });
      }
      const { data: duplicate } = await admin
        .from("profiles")
        .select("id")
        .eq("login", login)
        .neq("id", userId)
        .maybeSingle();
      if (duplicate) return res.status(409).json({ error: "Этот логин уже используется другим пользователем." });

      const authChanges: any = {
        user_metadata: { full_name: fullName, role, login },
      };
      if (login !== target.login) {
        authChanges.email = internalEmail(login);
        authChanges.email_confirm = true;
      }
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, authChanges);
      if (authUpdateError) return res.status(400).json({ error: authUpdateError.message });

      const { data: profile, error } = await admin
        .from("profiles")
        .update({
          login,
          full_name: fullName,
          role,
          position: String(body.position || "").trim() || null,
          network_scope: String(body.network || "").trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true, profile });
    }

    return res.status(400).json({ error: "Неизвестное действие." });
  } catch (error: any) {
    console.error("Admin user operation failed:", error);
    return res.status(500).json({ error: "Операция с пользователем не выполнена." });
  }
}
