import { getSupabase } from "./supabaseClient";

export function getStoredApiKey(): string {
  return "";
}

export function setStoredApiKey(_key: string): void {
  throw new Error("API-ключ настраивается только на сервере через GEMINI_API_KEY.");
}

export interface AnalyzeParams {
  auditData: any;
  transcript?: string;
  audioBase64?: string;
  audioMimeType?: string;
  customApiKey?: string;
}

export interface AnalyzeResult {
  success: boolean;
  report: string;
  extractedMeta?: any;
  criteria?: any[];
  salesDrivers?: any[];
  modelUsed: string;
}

export async function analyzeMysteryShopperClient({
  auditData,
  transcript,
  audioBase64,
  audioMimeType,
}: AnalyzeParams): Promise<AnalyzeResult> {
  const sessionResult = await getSupabase()?.auth.getSession();
  const token = sessionResult?.data.session?.access_token;
  if (!token) throw new Error("Сессия истекла. Войдите в систему повторно.");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 240_000);
  try {
    const isRemoteAudio = Boolean(audioBase64 && /^https:\/\//i.test(audioBase64));
    const response = await fetch("/api/analyze-mystery-shopper", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        auditData,
        transcript,
        audioUrl: isRemoteAudio ? audioBase64 : undefined,
        audioBase64: isRemoteAudio ? undefined : audioBase64,
        audioMimeType,
        audioFileName: auditData?.audioFileName,
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Сервер анализа настроен некорректно: API-маршрут недоступен.");
    }
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data?.error || "ИИ-анализ не выполнен.");
    }
    return data as AnalyzeResult;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Анализ превысил допустимое время. Данные сохранены — запустите анализ повторно.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
