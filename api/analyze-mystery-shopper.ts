import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 300 };

const MAX_INLINE_AUDIO_BYTES = 14 * 1024 * 1024;

function normalizeMime(value?: string, fileName?: string): string {
  const mime = (value || "").toLowerCase();
  if (mime.includes("m4a") || mime.includes("mp4") || fileName?.toLowerCase().endsWith(".m4a")) {
    return "audio/aac";
  }
  if (mime.startsWith("audio/")) return mime;
  return "audio/mpeg";
}

function safeJson(text: string): any {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function requireUser(req: any) {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!url || !anon || !token) throw new Error("AUTH_REQUIRED");
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("AUTH_REQUIRED");
  return data.user;
}

async function readAudio(body: any): Promise<{ data: string; mimeType: string } | null> {
  if (typeof body.audioBase64 === "string" && body.audioBase64.length > 50) {
    const match = body.audioBase64.match(/^data:([^;]+);base64,(.+)$/s);
    const data = match ? match[2] : body.audioBase64;
    const bytes = Buffer.from(data, "base64");
    if (bytes.length > MAX_INLINE_AUDIO_BYTES) throw new Error("AUDIO_TOO_LARGE");
    return {
      data: bytes.toString("base64"),
      mimeType: normalizeMime(match?.[1] || body.audioMimeType, body.audioFileName),
    };
  }

  if (typeof body.audioUrl === "string" && body.audioUrl.startsWith("https://")) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const allowedHost = supabaseUrl ? new URL(supabaseUrl).host : "";
    const url = new URL(body.audioUrl);
    if (url.host !== allowedHost || !url.pathname.includes("/storage/v1/object/sign/audit-audio/")) {
      throw new Error("INVALID_AUDIO_URL");
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error("AUDIO_DOWNLOAD_FAILED");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_INLINE_AUDIO_BYTES) throw new Error("AUDIO_TOO_LARGE");
    return {
      data: bytes.toString("base64"),
      mimeType: normalizeMime(response.headers.get("content-type") || body.audioMimeType, body.audioFileName),
    };
  }
  return null;
}

function buildPrompt(auditData: any, transcript: string): string {
  const checkType = auditData?.checkType || "Не указан";
  const isMystery = /mystery|без покупки/i.test(checkType);
  return `Ты — ИИ-аудитор качества продаж. Анализируй только переданные данные и аудиодоказательства.
Не придумывай бренд, город, филиал, сотрудника, кассовые действия, цитаты или таймкоды.

БИЗНЕС-ПРАВИЛА:
- Для "Контрольной закупки" оценивается полный BPV, включая cross-sell и кассовую дисциплину.
- Для "Mystery shopping (без покупки)" касса и cross-sell имеют статус N/A и исключаются из BPV.
- Sales Drivers — отдельный индекс и не влияет на BPV.
- Кассовая дисциплина определяется только по ручным данным шоппера. Никогда не делай вывод о кассе из аудио.
- При недостаточном аудиодоказательстве укажи это явно; не подменяй отсутствие доказательства догадкой.
- Цитаты сохраняй на исходном языке.
- Используй только эти id BPV: contact_greeting, needs_discovery, product_presentation,
  handling_objections, closing_conversion, cross_selling_accessories,
  cross_selling_services, farewell_closing, appearance_uniform, store_discipline,
  cash_discipline, commercial_initiative.

ТИП ПРОВЕРКИ: ${checkType}
РЕЖИМ КАССЫ И CROSS-SELL: ${isMystery ? "N/A" : "оценивать по применимым данным; кассу только по ручной анкете"}
ПАСПОРТ И РУЧНЫЕ ДАННЫЕ:
${JSON.stringify(auditData || {}, null, 2)}
${transcript ? `ПЕРЕДАННАЯ СТЕНОГРАММА:\n${transcript}` : ""}

Верни только корректный JSON без markdown-ограждений:
{
  "reportMarkdown": "Полный профессиональный отчёт на русском: паспорт; качество записи; сводные индексы; детальная оценка BPV; стенограмма с ролями и таймкодами; сильные стороны; нарушения; Sales Drivers; спорные моменты; рекомендации. Не повторяй и не теряй ручные комментарии шоппера.",
  "extractedMeta": {
    "brand": "", "branch": "", "city": "", "employeeCode": "", "inspector": "",
    "category": "", "target": "", "result": "", "comment": "", "region": "", "group": ""
  },
  "criteria": [{
    "id": "стабильный_id_критерия",
    "status": "Соблюдено|Частично|Нарушено|Не применимо (N/A)",
    "earnedPoints": 0,
    "explanation": "факт и причина",
    "quote": "цитата или пустая строка",
    "timecode": "ММ:СС или пустая строка",
    "confidence": "высокий|средний|низкий",
    "source": "аудио|анкета шоппера|аудитор"
  }],
  "salesDrivers": [{
    "id": "стабильный_id",
    "status": "Проявлен|Частично|Не проявлен|N/A",
    "points": 0,
    "explanation": "наблюдаемый факт"
  }]
}
criteria должен содержать все применимые критерии переданного чек-листа.`;
}

async function callModel(ai: GoogleGenAI, model: string, parts: any[]) {
  return ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json", temperature: 0.1 },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается." });
  try {
    await requireUser(req);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY не настроен на сервере.", retryable: false });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    const audio = await readAudio(body);
    if (!audio && !transcript) return res.status(400).json({ error: "Нужна аудиозапись или стенограмма." });

    const parts: any[] = [];
    if (audio) parts.push({ inlineData: audio });
    parts.push({ text: buildPrompt(body.auditData, transcript) });

    const ai = new GoogleGenAI({ apiKey });
    let response: any;
    let modelUsed = "gemini-3.5-flash";
    try {
      response = await callModel(ai, modelUsed, parts);
    } catch (firstError: any) {
      const message = String(firstError?.message || firstError);
      if (!/429|503|unavailable|not found|high demand/i.test(message)) throw firstError;
      modelUsed = "gemini-2.5-flash";
      response = await callModel(ai, modelUsed, parts);
    }

    const parsed = safeJson(response.text || "");
    if (!parsed.reportMarkdown || !Array.isArray(parsed.criteria) || parsed.criteria.length === 0) {
      return res.status(502).json({ error: "ИИ вернул неполный структурированный результат. Повторите анализ.", retryable: true });
    }
    return res.status(200).json({
      success: true,
      report: parsed.reportMarkdown,
      extractedMeta: parsed.extractedMeta || {},
      criteria: parsed.criteria,
      salesDrivers: Array.isArray(parsed.salesDrivers) ? parsed.salesDrivers : [],
      modelUsed,
    });
  } catch (error: any) {
    const code = String(error?.message || error);
    const known: Record<string, [number, string]> = {
      AUTH_REQUIRED: [401, "Сессия истекла. Войдите в систему повторно."],
      AUDIO_TOO_LARGE: [413, "Аудиофайл слишком большой для прямого анализа. Сожмите запись или загрузите файл меньшего размера."],
      INVALID_AUDIO_URL: [400, "Недопустимая ссылка на аудиозапись."],
      AUDIO_DOWNLOAD_FAILED: [400, "Не удалось получить аудиозапись из защищённого хранилища. Обновите страницу и повторите."],
    };
    const [status, message] = known[code] || [500, "ИИ-анализ временно недоступен. Данные проверки сохранены; повторите анализ."];
    console.error("AI audit route failed:", error);
    return res.status(status).json({ error: message, retryable: status >= 500 });
  }
}
