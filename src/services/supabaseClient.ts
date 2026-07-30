import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true" || (!supabaseUrl || !supabaseAnonKey);

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Could not initialize Supabase client:", e);
  }
}

export function getSupabase(): SupabaseClient | null {
  return client;
}

export function checkSupabaseConnection(): boolean {
  return client !== null && !isDemoMode;
}

export async function signInWithSupabase(
  login: string,
  password: string
): Promise<{ id: string; email: string; role: string; name: string; status: "active" | "blocked"; position?: string }> {
  if (!client) throw new Error("Supabase не настроен");
  const response = await fetch("/api/auth-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: login.trim().toLowerCase(), password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.error || "Не удалось войти.");
  const { error: sessionError } = await client.auth.setSession({
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
  });
  if (sessionError) throw new Error("Не удалось открыть защищённую сессию.");
  const profile = data.profile;
  return {
    id: profile.id,
    email: profile.login,
    role: profile.role,
    name: profile.full_name,
    status: profile.status === "blocked" ? "blocked" : "active",
    position: profile.position,
  };
}

export async function signOutFromSupabase(): Promise<void> {
  if (client) await client.auth.signOut();
}

export async function loadActiveProfiles(): Promise<any[]> {
  if (!client) return [];
  const { data, error } = await client
    .from("profiles")
    .select("id,login,role,full_name,status,position,network_scope,created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Не удалось загрузить справочник пользователей: ${error.message}`);
  return data || [];
}


async function adminUserRequest(method: "POST" | "PATCH" | "DELETE", input: Record<string, unknown>): Promise<any> {
  if (!client) throw new Error("Supabase не настроен");
  const { data: sessionData } = await client.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Сессия истекла. Войдите повторно.");
  const response = await fetch("/api/admin-users", {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.error || "Операция с пользователем не выполнена.");
  return data;
}

export async function createUserByAdmin(input: {
  login: string;
  password: string;
  fullName: string;
  role: "admin" | "auditor" | "manager" | "shopper";
  position?: string;
  network?: string;
}): Promise<any> {
  return adminUserRequest("POST", { action: "create", ...input });
}

export async function updateUserByAdmin(input: Record<string, unknown>): Promise<any> {
  return adminUserRequest("PATCH", { action: "update", ...input });
}

export async function setUserPasswordByAdmin(userId: string, password: string): Promise<void> {
  await adminUserRequest("PATCH", { action: "set_password", userId, password });
}

export async function setUserStatusByAdmin(
  userId: string,
  status: "active" | "blocked" | "archived"
): Promise<any> {
  return adminUserRequest("PATCH", { action: "set_status", userId, status });
}

export async function requestAdminPasswordChange(login: string, comment?: string): Promise<string> {
  const response = await fetch("/api/password-reset-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: login.trim().toLowerCase(), comment }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.error || "Не удалось зарегистрировать запрос.");
  return data.message;
}
