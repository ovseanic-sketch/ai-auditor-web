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
  email: string,
  password: string
): Promise<{ id: string; email: string; role: string; name: string; status: "active" | "blocked"; position?: string }> {
  if (!client) throw new Error("Supabase не настроен");
  const { data: authData, error: authError } = await client.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) throw new Error(authError?.message || "Не удалось войти");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,login,role,full_name,status,position")
    .eq("id", authData.user.id)
    .single();
  if (profileError || !profile) {
    await client.auth.signOut();
    throw new Error("Профиль пользователя не найден");
  }
  return {
    id: profile.id,
    email: profile.login || authData.user.email || email,
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
    .eq("status", "active");
  if (error) throw new Error(`Не удалось загрузить справочник пользователей: ${error.message}`);
  return data || [];
}


export async function requestPasswordRecovery(email: string): Promise<void> {
  if (!client) throw new Error("Supabase не настроен");
  const redirectTo = `${window.location.origin}/`;
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
}

export async function updateRecoveredPassword(password: string): Promise<void> {
  if (!client) throw new Error("Supabase не настроен");
  const { error } = await client.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function clearRecoverySession(): Promise<void> {
  if (client) await client.auth.signOut();
}

export async function inviteUserByAdmin(input: {
  email: string;
  fullName: string;
  role: "admin" | "auditor" | "manager" | "shopper";
  position?: string;
  network?: string;
}): Promise<{ userId: string }> {
  if (!client) throw new Error("Supabase не настроен");
  const { data: sessionData } = await client.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Сессия истекла. Войдите повторно.");
  const response = await fetch("/api/admin-users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Не удалось пригласить пользователя.");
  }
  return { userId: data.userId };
}
