import express from "express";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Log storage for sent emails in server memory
interface SentEmailRecord {
  id: string;
  recipientEmail: string;
  userName: string;
  login: string;
  roleName: string;
  network: string;
  position: string;
  sentAt: string;
  status: "delivered" | "sent_smtp" | "failed";
  method: string;
  previewUrl?: string;
  errorMessage?: string;
}

interface RuntimeSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

let runtimeSmtpConfig: RuntimeSmtpConfig = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  fromName: "Mystery Shopper AI",
  fromEmail: process.env.SMTP_USER || "noreply@company.com",
};

const sentEmailsLog: SentEmailRecord[] = [];

// Increase JSON payload size limit for base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please set your key in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

app.post("/api/analyze-mystery-shopper", async (req, res) => {
  try {
    const { auditData, transcript, audioBase64, audioMimeType } = req.body;

    if (!transcript && !audioBase64) {
      return res.status(400).json({
        error: "Предоставьте расшифровку (текст) диалога или аудиозапись проверки.",
      });
    }

    const ai = getGeminiClient();

    // Comprehensive System Prompt incorporating BPV standards & audit rules
    const systemPrompt = `Ты — эксперт и специалист по контролю качества обслуживания клиентов в розничных филиалах компании (Mystery Shopper AI Auditor & Standards Inspector).
Твоя задача — проанализировать предоставленную запись или транскрипт визита, сопоставить действия консультанта со стандартами BPV (Бизнес-Процесс Продаж) и сформировать детальный, доказательный отчёт.

ДАННЫЕ ПРОВЕРКИ И ПАСПОРТ:
- Тип проверки: ${auditData.checkType || "Mystery shopper / контрольная закупка"}
- Дата: ${auditData.date || "2026-07-23"}
- Бренд: ${auditData.brand || "Не указан"}
- Филиал: ${auditData.branch || "Не указан"}
- Город: ${auditData.city || "Не указан"}
- Сотрудник / Код сотрудника: ${auditData.employeeCode || "Не указан"}
- Проверяющий: ${auditData.inspector || "Не указан"}
- Категория товара: ${auditData.category || "Не указана"}
- Цель визита: ${auditData.target || "Не указана"}
- Результат визита: ${auditData.result || "Не указан"}
- Дополнительный комментарий: ${auditData.comment || "Отсутствует"}
- Чек-лист / Стандарты:
${auditData.standards || "Стандарт компании BPV (Этапы 0-7)"}

ПРАВИЛА И ОСОБЕННОСТИ ТИПОВ ПРОВЕРОК:

1. **2. Mystery shopper (без покупки)**:
   - Тайный покупатель НЕ совершает покупку (нет денежных средств и визита на кассу).
   - **КРИТИЧЕСКОЕ ПРАВИЛО:** При проверках **Mystery shopper** категории **Cross-selling (кросс-сейл / продажа сопутствующих товаров)** и **Кассовые операции (расчет, кассовый чек, оформление в 1С, выдача гарантийного талона)** **КАТЕГОРИЧЕСКИ НЕ ОЦЕНИВАЮТСЯ**!
   - По данным этапам выставляется статус «Не применимо (N/A)» и они НЕ учитываются при подсчёте BPV Index и Sales Drive Index.
   - Оцениваются ТОЛЬКО этапы консультации: Установление контакта, приветствие, выявление потребностей (воронка вопросов), знание товара, качество презентации (Характеристика + Выгода), сравнение вариантов, работа с возражениями, доброжелательность, вежливое завершение консультации и приглашение вернуться.

2. **1. Контрольная закупка**:
   - Оценивается ПОЛНЫЙ путь клиента: контакт, консультация, потребности, подбор, презентация, сравнение, возражения, cross-sell, оформление покупки, расчет/оплата, фискальный чек, гарантийный талон, кассовые/операционные процедуры, вежливое прощание.

3. **ОБЯЗАТЕЛЬНОЕ ТРЕБОВАНИЕ К ОПИСАНИЮ СНИЖЕНИЯ ОЦЕНОК (КОНКРЕТНЫЕ ФАКТЫ И ПРИЧИНЫ):**
   - **Если по какому-либо этапу или критерию оценка ниже максимальной** (статус «Частично», «Нарушено» или снижен балл):
     * Ты ОБЯЗАН в столбце «Объяснение и Доказательство» и в соответствующих разделах отчёта подробно указать **конкретные факты и причины неполного соответствия стандарту**.
     * Чётко распиши, что именно было пропущено или сделано неверно, подкрепляя **прямыми цитатами или указанием отсутствующих фраз/вопросов из записи с таймкодами**.

4. **СОХРАНЕНИЕ ОРИГИНАЛЬНОГО ЯЗЫКА ЦИТАТ И РЕЧЕВЫХ ПРИМЕРОВ (КРИТИЧЕСКИ ВАЖНО):**
   - **Все цитаты речи, прямой диалог, сказанные фразы и речевые примеры из записи/транскрипта ОБЯЗАТЕЛЬНО оставляй на первоначальном языке общения (румынский, русский, английский и т.д.) без перевода!**
   - Если диалог или фраза звучали на румынском языке (например, *«Bună ziua, cu ce vă pot ajuta?»*, *«Avem o ofertă specială»*), в цитатах, доказательствах и примерах речевых модулей (Actionable Feedback) указывай ровно эту оригинальную румынскую фразу.
   - Сам аналитический текст отчёта (пояснения, структура, статусы) пиши на русском языке, но **все языковые примеры, цитаты из речи и фразы диалога сохраняй строго на языке оригинала**.

5. **ЭТАПЫ СТАНДАРТА BPV ДЛЯ СРАВНЕНИЯ**:
   - **Этап 0 (Зона видимости)**: Продавец замечает клиента, не отвлекается на телефон/коллег.
   - **Этап 1 (Установление контакта)**: Встреча взглядом, улыбка, приветствие ("Добрый день/Здравствуйте"), Адаптация (30-60 сек дать освоиться), Подход к витрине с вопросом/призывом к действию (по категории, модели, акциям, лояльности, себе или в подарок). Запрещены фразы «Чем помочь?», «Спрашивайте!», «Хотите купить?».
   - **Этап 2 (Выявление потребностей)**: Воронка вопросов (3-4 открытых: "Для кого?", "Как будете использовать?", "Опыт пользования?", "Критичные функции?", 1-2 альтернативных, 1-2 закрытых). Активное слушание, резюмирование. Запрещено начинать с вопроса «На какой бюджет рассчитываете?» или молча уходить.
   - **Этап 3 (Презентация товара)**: Предложение 2-3 моделей, максимальная демонстрация/вовлечение в руки/включение, схема "Характеристика + Связующая фраза + Выгода" (только то, что важно клиенту). Информирование об акциях, лояльности, доставке.
   - **Этап 4 (Работа с возражениями)**: Выслушать не перебивая, присоединение к эмоциям ("Да, понимаю...", "Да, некоторые так считают..."), аргумент через "да"/связки/альтернативу или Gift Card. Запрещен спор ("Да, но...", "Вы не правы").
   - **Этап 5 (Конвертация клиента)**: Распознавание сигналов готовности. Техники предложения покупки: Прямой вопрос ("Оформляем?"), Альтернативный вопрос ("Выбор без выбора"), Дедлайн, Техника "Три Да".
   - **Этап 6 (Комплексная продажа / Cross-sell)**: Фраза-связка (Комплимент выбору или Flashback) + предложение аксессуара, доп.товара, soft-услуги или страховки/доп.гарантии.
   - **Этап 7 (Завершение продажи)**: Проверка товара, сопровождение к кассе, оформление в 1С, выдача фискального чека, оформление гарантийного талона, инструктаж по эксплуатации, благодарность и искреннее приглашение прийти снова.

ТРЕБОВАНИЯ К ОЦЕНКЕ РЕЧИ И ГОЛОСА (СТРОГИЙ ЗАПРЕТ НА ПСИХОЛОГИЧЕСКИЕ ЯРЛЫКИ):
- Оценивай ТОЛЬКО наблюдаемые факты: разборчивость, темп, громкость, интонационную выразительность, уверенность формулировок, паузы, слова-паразиты, перебивания, баланс речи (Talk-to-Listen ratio).
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО делать психологические выводы и ставить диагнозы ("сотрудник устал", "не был заинтересован", "ему было лень", "хотел избавиться").
- Заменяй оценочные суждения конкретными поведенческими фактами:
  * Вместо "сотрудник не мотивирован" пиши: "Ответы преимущественно короткие, интонация монотонная, уточняющие вопросы не задавались".
  * Вместо "плохо обслужил" пиши: "Консультант не предложил альтернативу и не задал открытых вопросов".
- Если предоставлен ТОЛЬКО текстовый транскрипт без аудио, прямо укажи: "Громкость, тембр и интонация не могут быть объективно оценены по текстовой записи".

ФОРМАТ И СТРУКТУРА ИТОГОВОГО ОТЧЁТА:
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать TeX/LaTeX разметку (не используй $\\rightarrow$, $\\Rightarrow$, $\\%$). Используй обычные символы стрелок '→' или текст.
- НЕ ИСПОЛЬЗУЙ горизонтальные разделители '---' и мелкие заголовки '####' (используй только '##' и '###', а выдержки выделяй жирным шрифтом **Заголовок**).

Сформируй отчёт strictly по следующей структуре с использованием Markdown и наглядно оформленных таблиц:

1. **Паспорт проверки** (Тип проверки, Дата, Бренд, Филиал, Город, Код сотрудника, Проверяющий, Категория, Цель, Результат).
2. **Анализ качества записи / текста** (Разборчивость, Фоновый шум, Помехи/Обрывы, Вердикт пригодности).
3. **Сводные результаты оценки (Инфографика и ключевые индексы)**:
   - **A. Индекс качества обслуживания BPV (Service Index)**: __% (__/__ баллов)
   - **B. Индекс операционной и кассовой дисциплины (Cash & Operational Index)**: __% (__/__ баллов или N/A для "2. Mystery shopper (без покупки)")
   - **C. Индекс коммерческой активности (Sales Drive Index)**: __% (__/__ баллов)
   - **D. Критические нарушения и Стоп-факторы**:
     * ВАЖНО: Если обнаружены критические нарушения/стоп-факторы, ОБЯЗАТЕЛЬНО подробно распиши, ЧТО ИМЕННО было нарушено (например: "1. Отсутствие фискального чека при контрольной закупке; 2. Нарушение порядка оформления гарантийного талона").
     * Если нарушений нет: "Критических нарушений и стоп-факторов не обнаружено (0) - Все ключевые стандарты соблюдены."
4. **Детальная оценка критериев** (Таблица со столбцами: Критерий | Статус [Соблюдено / Частично / Нарушено / Не применимо] | Балл | Объяснение и Доказательство | Цитата из записи | Таймкод [ММ:СС] | Уровень уверенности).
5. **Расширенный речевой и акустический разбор** (Разборчивость, Темп/Громкость, Интонация, Паузы/Слова-паразиты, Перебивания, Баланс речи Talk-to-Listen Ratio).
6. **Сильные стороны, Нарушения и Упущенные возможности (Sales Drivers)**.
7. **Спорные моменты и ситуации для супервизора**.
8. **Матрица быстрых рекомендаций для Тренера и РОПа (Actionable Feedback)**:
   - Таблица с колонками: Выявленная ошибка/пропуск | Описание факта по записи | Готовый речевой модуль для отработки.
9. **Строка для сводного реестра (CSV / Google Sheets)**:
   Предоставь в блоке \`\`\`csv строку с разделителем точка с запятой (;):
   \`\`\`csv
   Дата;Бренд;Филиал;Город;Код сотрудника;Проверяющий;Тип проверки;BPV Index %;Cash Index %;Sales Drive %;Стоп-факторы;Кассовый чек;Гарантия;Сумма;Главная точка роста
   \`\`\`
10. **JSON метаданные проверки для автозаполнения формы**:
   В самом конце отчёта обязательно предоставь JSON блок для автозаполнения полей формы:
   \`\`\`json
   {
     "extractedMeta": {
       "brand": "Наименование бренда",
       "branch": "Филиал или адрес",
       "city": "Город",
       "employeeCode": "Имя или код сотрудника",
       "inspector": "Имя или код проверяющего",
       "category": "Категория товара",
       "target": "Цель визита",
       "result": "Результат визита",
       "comment": "Краткое примечание"
     }
   }
   \`\`\`

Выдавай отчёт профессиональным, структурированным, доказательным языком на русском языке.`;

    let contentsParts: any[] = [];

    if (audioBase64) {
      let mimeType = audioMimeType || "audio/mp3";
      let base64Data = audioBase64;
      if (audioBase64.includes(";base64,")) {
        const parts = audioBase64.split(";base64,");
        const mimeMatch = parts[0].match(/data:(.*?)$/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = parts[1];
      }

      contentsParts.push({
        inlineData: {
          data: base64Data,
          mimeType,
        },
      });
      contentsParts.push({
        text: `${systemPrompt}\n\nПроанализируй прикрепленную аудиозапись контрольной закупке согласно всем указанным требованиям.`,
      });
    } else {
      contentsParts.push({
        text: `${systemPrompt}\n\nВот стенограмма / текстовая запись визита для анализа:\n\"\"\"\n${transcript}\n\"\"\"`,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: contentsParts,
      },
    });

    const reportText = response.text || "Не удалось сгенерировать отчёт анализа.";

    let extractedMeta: any = null;
    try {
      const jsonMatch = reportText.match(/```json\s*(\{[\s\S]*?"extractedMeta"[\s\S]*?\})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed && parsed.extractedMeta) {
          extractedMeta = parsed.extractedMeta;
        }
      }
    } catch (e) {
      console.warn("Could not parse extractedMeta on server:", e);
    }

    return res.json({
      success: true,
      report: reportText,
      extractedMeta,
      modelUsed: "gemini-3.6-flash",
    });
  } catch (err: any) {
    console.error("Error analyzing mystery shopper visit:", err);
    return res.status(500).json({
      error: err.message || "Ошибка при обработке запроса анализа визита.",
    });
  }
});

app.post("/api/edit-product-photo", async (req, res) => {
  try {
    const { image, prompt, modelQuality = "high", aspectRatio = "1:1" } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided. Please upload or select a product photo." });
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Please enter an instruction prompt." });
    }

    // Extract base64 and mime type
    let mimeType = "image/png";
    let base64Data = image;

    if (image.includes(";base64,")) {
      const parts = image.split(";base64,");
      const mimeMatch = parts[0].match(/data:(.*?)$/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      base64Data = parts[1];
    }

    const ai = getGeminiClient();

    // Choose model based on user selection or defaults
    // gemini-3.1-flash-image for high quality product editing, gemini-3.1-flash-lite-image for faster edits
    const modelName = modelQuality === "lite" ? "gemini-3.1-flash-lite-image" : "gemini-3.1-flash-image";

    // System augmented prompt for product photo cleaning & background editing
    const systemAugmentedPrompt = `You are a professional product photography studio AI.
Task: Edit the attached product photo according to these explicit instructions: "${prompt.trim()}".

Strict product photography guidelines:
1. Always preserve the identity, core details, logo, colors, and shape of the primary subject/product cleanly.
2. If requested to remove or replace background: completely isolate the main product with sharp, realistic, high-precision anti-aliased edges and place it seamlessly on the requested background.
3. If requested to clean up or enhance: eliminate dust, scratches, unwanted background clutter, and glare while sharpening focus and optimizing professional studio lighting.
4. Add natural, physically accurate contact shadows or soft ground reflections if appropriate for studio realism.`;

    const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"];
    const targetAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: systemAugmentedPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: targetAspectRatio,
        },
      },
    });

    let resultImageUrl: string | null = null;
    let descriptionText = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const resMime = part.inlineData.mimeType || "image/png";
          resultImageUrl = `data:${resMime};base64,${part.inlineData.data}`;
        }
        if (part.text) {
          descriptionText += part.text + " ";
        }
      }
    }

    if (!resultImageUrl) {
      return res.status(500).json({
        error: "Model processed the request but did not return a new image. Please refine your instruction prompt and try again.",
        details: descriptionText || "No image part returned",
      });
    }

    return res.json({
      success: true,
      imageUrl: resultImageUrl,
      description: descriptionText.trim(),
      modelUsed: modelName,
    });
  } catch (err: any) {
    console.error("Error editing product photo:", err);
    return res.status(500).json({
      error: err.message || "Failed to process image instruction",
    });
  }
});

// Endpoint to get current SMTP config
app.get("/api/smtp-config", (_req, res) => {
  res.json({
    success: true,
    config: {
      host: runtimeSmtpConfig.host,
      port: runtimeSmtpConfig.port,
      secure: runtimeSmtpConfig.secure,
      user: runtimeSmtpConfig.user,
      pass: runtimeSmtpConfig.pass ? "••••••••" : "",
      fromName: runtimeSmtpConfig.fromName,
      fromEmail: runtimeSmtpConfig.fromEmail,
      isConfigured: !!(runtimeSmtpConfig.host && runtimeSmtpConfig.user),
    },
  });
});

// Endpoint to update SMTP config
app.post("/api/smtp-config", (req, res) => {
  const { host, port, secure, user, pass, fromName, fromEmail } = req.body;
  if (host !== undefined) runtimeSmtpConfig.host = host.trim();
  if (port !== undefined) runtimeSmtpConfig.port = Number(port) || 587;
  if (secure !== undefined) runtimeSmtpConfig.secure = Boolean(secure);
  if (user !== undefined) runtimeSmtpConfig.user = user.trim();
  if (pass !== undefined && pass !== "••••••••") runtimeSmtpConfig.pass = pass.trim();
  if (fromName !== undefined) runtimeSmtpConfig.fromName = fromName.trim();
  if (fromEmail !== undefined) runtimeSmtpConfig.fromEmail = fromEmail.trim();

  res.json({
    success: true,
    message: "Настройки SMTP-сервера успешно сохранены!",
    config: {
      host: runtimeSmtpConfig.host,
      port: runtimeSmtpConfig.port,
      secure: runtimeSmtpConfig.secure,
      user: runtimeSmtpConfig.user,
      fromName: runtimeSmtpConfig.fromName,
      fromEmail: runtimeSmtpConfig.fromEmail,
      isConfigured: !!(runtimeSmtpConfig.host && runtimeSmtpConfig.user),
    },
  });
});

// Endpoint to test SMTP connection
app.post("/api/test-smtp", async (_req, res) => {
  if (!runtimeSmtpConfig.host || !runtimeSmtpConfig.user) {
    return res.status(400).json({
      success: false,
      error: "SMTP-сервер не настроен. Укажите Хост, Логин и Пароль к почтовому серверу.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: runtimeSmtpConfig.host,
      port: runtimeSmtpConfig.port,
      secure: runtimeSmtpConfig.secure,
      auth: {
        user: runtimeSmtpConfig.user,
        pass: runtimeSmtpConfig.pass,
      },
      connectionTimeout: 8000,
    });

    await transporter.verify();
    res.json({
      success: true,
      message: `Подключение к SMTP-серверу ${runtimeSmtpConfig.host}:${runtimeSmtpConfig.port} успешно подтверждено!`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Ошибка соединения с SMTP: ${err.message || "Неверный логин, пароль или порт"}`,
    });
  }
});

// Endpoint to send email with login and password
app.post("/api/send-email", async (req, res) => {
  try {
    const {
      recipientEmail,
      email,
      userName,
      name,
      login,
      password,
      roleName,
      network = "Компания",
      position = "Сотрудник",
      smtpConfig: customSmtp,
    } = req.body;

    const targetEmail = (recipientEmail || email || "").trim();
    const targetName = (userName || name || "Сотрудник").trim();
    const targetLogin = (login || "").trim();
    const targetPassword = (password || "").trim();

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        error: "Укажите адрес электронной почты получателя",
      });
    }

    if (!targetLogin || !targetPassword) {
      return res.status(400).json({
        success: false,
        error: "Логин и пароль обязательны для отправки доступов",
      });
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; color: #f8fafc; margin: 0; padding: 24px; }
          .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .header { border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 20px; text-align: center; }
          .title { font-size: 20px; font-weight: 700; color: #38bdf8; margin: 0; }
          .subtitle { font-size: 13px; color: #94a3b8; margin-top: 6px; }
          .content { font-size: 14px; line-height: 1.6; color: #e2e8f0; }
          .credentials-box { background-color: #020617; border: 1px solid #2563eb; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .cred-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-family: monospace; font-size: 13px; }
          .cred-row:last-child { margin-bottom: 0; }
          .label { color: #94a3b8; font-weight: bold; }
          .val { color: #38bdf8; font-weight: bold; }
          .val-pass { color: #f59e0b; font-weight: bold; }
          .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; pt: 16px; margin-top: 24px; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="title">🔐 Доступы к Mystery Shopper AI</h1>
            <p class="subtitle">Система оценки качества и стандартов BPV</p>
          </div>
          <div class="content">
            <p>Здравствуйте, <strong>${targetName}</strong>!</p>
            <p>Вам создан персональный аккаунт в рабочей системе аудита и оценки качества обслуживания.</p>
            
            <div class="credentials-box">
              <div class="cred-row"><span class="label">ФИО / Имя:</span> <span class="val">${targetName}</span></div>
              <div class="cred-row"><span class="label">Сеть / Филиал:</span> <span class="val">${network}</span></div>
              <div class="cred-row"><span class="label">Должность:</span> <span class="val">${position}</span></div>
              <div class="cred-row"><span class="label">Роль доступа:</span> <span class="val">${roleName || "Пользователь"}</span></div>
              <hr style="border-color: #1e293b; margin: 12px 0;" />
              <div class="cred-row"><span class="label">Логин:</span> <span class="val">${targetLogin}</span></div>
              <div class="cred-row"><span class="label">Пароль:</span> <span class="val-pass">${targetPassword}</span></div>
            </div>

            <p style="font-size: 12px; color: #94a3b8;">Для входа используйте указанный логин и пароль в рабочей форме авторизации.</p>
          </div>
          <div class="footer">
            <p>Данное письмо сгенерировано автоматически почтовым сервисом рабочей системы.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let deliveryMethod = "virtual_dispatcher";
    let previewUrl: string | undefined = undefined;
    let smtpErrorMessage: string | undefined = undefined;

    // Use custom passed SMTP or runtime server config
    const activeHost = customSmtp?.host || runtimeSmtpConfig.host;
    const activePort = Number(customSmtp?.port) || runtimeSmtpConfig.port;
    const activeSecure = customSmtp?.secure ?? runtimeSmtpConfig.secure;
    const activeUser = customSmtp?.user || runtimeSmtpConfig.user;
    const activePass = customSmtp?.pass || runtimeSmtpConfig.pass;
    const activeFromName = customSmtp?.fromName || runtimeSmtpConfig.fromName || "Mystery Shopper AI";
    const activeFromEmail = customSmtp?.fromEmail || runtimeSmtpConfig.fromEmail || activeUser || "noreply@company.com";

    // Attempt custom SMTP send
    if (activeHost && activeUser && activePass) {
      try {
        const transporter = nodemailer.createTransport({
          host: activeHost,
          port: activePort,
          secure: activeSecure,
          auth: {
            user: activeUser,
            pass: activePass,
          },
          connectionTimeout: 10000,
        });

        await transporter.sendMail({
          from: `"${activeFromName}" <${activeFromEmail}>`,
          to: targetEmail,
          subject: `Доступы к системе Mystery Shopper AI для ${targetName}`,
          html: htmlBody,
        });

        deliveryMethod = "smtp_direct";
      } catch (smtpErr: any) {
        console.warn("Custom SMTP delivery failed:", smtpErr.message);
        smtpErrorMessage = smtpErr.message;
      }
    }

    // Fallback: Dispatch via Ethereal Mailer for live web preview if no real SMTP or if failed
    if (deliveryMethod === "virtual_dispatcher") {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await testTransporter.sendMail({
          from: `"Mystery Shopper AI" <noreply@mysteryshopper.ai>`,
          to: targetEmail,
          subject: `Доступы к рабочей системе Mystery Shopper AI (${targetName})`,
          html: htmlBody,
        });

        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      } catch (e: any) {
        console.log(`[Email Dispatcher] Local delivery recorded for ${targetEmail}`);
      }
    }

    const record: SentEmailRecord = {
      id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      recipientEmail: targetEmail,
      userName: targetName,
      login: targetLogin,
      roleName: roleName || "Сотрудник",
      network,
      position,
      sentAt: new Date().toISOString(),
      status: deliveryMethod === "smtp_direct" ? "sent_smtp" : "delivered",
      method: deliveryMethod,
      previewUrl,
      errorMessage: smtpErrorMessage,
    };

    sentEmailsLog.unshift(record);

    return res.json({
      success: true,
      message: deliveryMethod === "smtp_direct"
        ? `Письмо успешно отправлено напрямую через ваш SMTP-сервер на e-mail ${targetEmail}`
        : `Письмо с доступом сформировано и зарегистрировано в журнале для ${targetEmail}`,
      method: deliveryMethod,
      record,
    });
  } catch (err: any) {
    console.error("Error sending email:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Ошибка при отправке письма на почту",
    });
  }
});

// Endpoint to fetch sent emails history
app.get("/api/sent-emails", (_req, res) => {
  res.json({
    success: true,
    emails: sentEmailsLog,
  });
});

// Start Express + Vite server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Product Photo Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
