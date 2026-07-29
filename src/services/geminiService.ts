import { GoogleGenAI } from "@google/genai";
import { cleanMarkdownReport } from "../utils/cleanMarkdown";

export function getStoredApiKey(): string {
  return "";
}

export function setStoredApiKey(_key: string): void {
  throw new Error("API-ключ настраивается только на сервере через GEMINI_API_KEY.");
}

function getGeminiClient(apiKeyInput?: string) {
  const key = apiKeyInput?.trim() || getStoredApiKey();
  if (!key) {
    throw new Error(
      "API ключ Gemini не указан. Пожалуйста, введите ваш GEMINI_API_KEY в настройках вверху экрана для прямой работы из браузера."
    );
  }
  return new GoogleGenAI({
    apiKey: key,
  });
}

export interface AnalyzeParams {
  auditData: any;
  transcript?: string;
  audioBase64?: string;
  audioMimeType?: string;
  customApiKey?: string;
}

export async function analyzeMysteryShopperClient({
  auditData,
  transcript,
  audioBase64,
  audioMimeType,
  customApiKey,
}: AnalyzeParams): Promise<{ success: boolean; report: string; extractedMeta?: any; criteria?: any[]; salesDrivers?: any[]; modelUsed: string }> {
  const activeKey = "";

  // 1. First try server-side route (/api/analyze-mystery-shopper)
  try {
    const res = await fetch("/api/analyze-mystery-shopper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auditData,
        transcript,
        audioBase64,
        audioMimeType,
      }),
    });
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Не удалось разобрать ответ сервера при ИИ-анализе.");
    }
    if (res.ok && data.success) {
      return data;
    }
    if (data?.error) throw new Error(data.error);
  } catch (serverErr: any) {
    console.warn("Server AI analysis route error, checking direct client fallback:", serverErr);
    // If the server returned a valid business or API key error, throw it so user gets actionable feedback
    if (serverErr.message && !serverErr.message.includes("404") && !serverErr.message.includes("Failed to fetch")) {
      throw serverErr;
    }
  }

  if (!activeKey) {
    throw new Error(
      "API ключ Gemini не обнаружен на сервере и в браузере. Пожалуйста, укажите Ваш GEMINI_API_KEY в настройках вверху экрана."
    );
  }

  const ai = getGeminiClient(activeKey);

  // Comprehensive System Prompt incorporating BPV standards & sales speech analytics
  const systemPrompt = `Ты — ведущий эксперт по речевой аналитике, контролю качества обслуживания и аудиту стандартов продаж (Mystery Shopper AI Auditor & Sales Speech Inspector).
Твоя задача — провести глубокий речевой и аудио-анализ диалога, транскрибировать запись с разделением ролей и таймкодами, сопоставить действия консультанта со стандартами BPV (Бизнес-Процесс Продаж) и сформировать исчерпывающий доказательный отчёт.

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

3. **ЕДИНАЯ ТОЧНАЯ ОЦЕНКА BPV INDEX (СОГЛАСОВАННОСТЬ ДАННЫХ):**
   - Высчитай суммарный BPV Index (например, 93.0%). ВСЕ упоминания BPV Index в тексте отчёта ОБЯЗАНЫ содержать в точности это же единое значение (например: "**A. Индекс качества обслуживания BPV (Service Index)**: 93.0%"). Разночтения категорически запрещены.

4. **ОБЯЗАТЕЛЬНОЕ ТРЕБОВАНИЕ К ОПИСАНИЮ СНИЖЕНИЯ ОЦЕНОК (КОНКРЕТНЫЕ ФАКТЫ И ПРИЧИНЫ):**
   - Если по какому-либо критерию оценка ниже максимальной, ты ОБЯЗАН подробнейшим образом расписать конкретную причину с приведением **прямых цитат из речи с таймкодами** или указанием отсутствующих фраз/вопросов.

5. **СОХРАНЕНИЕ ОРИГИНАЛЬНОГО ЯЗЫКА ЦИТАТ И РЕЧЕВЫХ ПРИМЕРОВ:**
   - **Все цитаты речи, прямой диалог, сказанные фразы и речевые примеры из записи/транскрипта ОБЯЗАТЕЛЬНО оставляй на первоначальном языке общения (румынский, русский, английский и т.д.) без перевода!**

6. **ТРЕБОВАНИЯ К ГЛУБОКОМУ РЕЧЕВОМУ АНАЛИЗУ И СТАНДАРТАМ ПРОДАЖ BPV**:
   - **Диалоговая транскрибация речи**:
     Разбей диалог по ролям: \`[Менеджер]\`, \`[Клиент]\`. Укажи таймкоды реплик (\`[00:15]\`, \`[00:42]\`) и добавь цветовые маркеры соблюдения стандартов:
     * 🟢 **Соблюдение стандарта / Отличный речевой модуль** (открытый вопрос, выявление потребности, связка "Характеристика → Выгода").
     * 🟡 **Слабая / неуверенная формулировка** (закрытый вопрос, пассивность, замешательство).
     * 🔴 **Запрещенный речевой маркер / Нарушение** (фразы «Чем помочь?», «Спрашивайте!», «Я не знаю», спор с клиентом).
   - **Анализ воронки вопросов (Sales Question Funnel)**:
     Детально подсчитай количество Открытых (целевая норма: ≥3), Альтернативных и Закрытых вопросов, заданных продавцом.
   - **Акустический и голосовой разбор (Voice Metrics)**:
     Оцени Соотношение речи/слушания (Talk-to-Listen Ratio), Темп речи (слов/мин), Интонационную выразительность, Паузы и Слова-паразиты.
   - **Применение техник продаж**:
     Оцени презентацию по схеме «Характеристика + Связующая фраза + Выгода», техники отработки возражений и призыв к совершению покупки (Closing Techniques).

ФОРМАТ И СТРУКТУРА ИТОГОВОГО ОТЧЁТА:
- Если передан блок «ОПИСАНИЕ ВИЗИТА ТАЙНОГО ПОКУПАТЕЛЯ» (внешний вид консультанта, оценка магазина/витрин, позиционирование в зале, отзывы шоппера), ОБЯЗАТЕЛЬНО полностью сохрани все эти данные в 5-м разделе отчёта.
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать TeX/LaTeX разметку (не используй $\\rightarrow$, $\\Rightarrow$, $\\%$).
- НЕ ИСПОЛЬЗУЙ горизонтальные разделители '---' и мелкие заголовки '####'.

Сформируй отчёт strictly по следующей структуре с использованием Markdown:

1. **Паспорт проверки** (Тип проверки, Дата, Бренд, Филиал, Город, Код сотрудника, Проверяющий, Категория, Цель, Результат).
2. **Анализ качества записи / текста** (Разборчивость, Фоновый шум, Помехи/Обрывы, Вердикт пригодности).
3. **Сводные результаты оценки (Инфографика и ключевые индексы)**:
   - **A. Индекс качества обслуживания BPV (Service Index)**: __%
   - **B. Индекс операционной и кассовой дисциплины (Cash & Operational Index)**: __% (или N/A для "2. Mystery shopper (без покупки)")
   - **C. Индекс коммерческой активности (Sales Drive Index)**: __%
   - **D. Критические нарушения и Стоп-факторы**:
     * Если нарушений нет: "Критических нарушений и стоп-факторов не обнаружено (0) - Все ключевые стандарты соблюдены."
4. **Детальная оценка критериев BPV** (Таблица со столбцами: Критерий | Статус [Соблюдено / Частично / Нарушено / Не применимо] | Балл | Объяснение и Доказательство | Цитата из записи | Таймкод [ММ:СС] | Уровень уверенности).
5. **Детальная речевая транскрибация и экспертный аудит диалога**:
   - Ролевая стенограмма разговорных реплик с таймкодами и маркерами (🟢, 🟡, 🔴).
   - Разбор воронки вопросов (Открытые, Альтернативные, Закрытые вопросы).
   - Метрики голосового баланса (Talk-to-Listen Ratio, темп, интонация, слова-паразиты).
   - Оценка применения техник презентации «Характеристика → Выгода» и алгоритмов закрытия сделки.
6. **Сильные стороны, Нарушения и Упущенные возможности (Sales Drivers)**.
7. **Спорные моменты и ситуации для супервизора**.
8. **Матрица быстрых рекомендаций для Тренера и РОПа (Actionable Feedback)**:
   - Таблица с колонками: Выявленная ошибка/пропуск | Описание факта по записи | Готовый речевой модуль для отработки.

ВАЖНО: В самом тексте отчёта НЕ создавай никакой раздел с CSV строкой и НЕ выводи заголовок с JSON метаданными. Для передачи служебных данных автозаполнения помести исключительно в самый конец ответа технический JSON блок:
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
    "comment": "Краткое примечание",
    "bpvScore": 93.0
  },
  "criteria": [
    {
      "id": "contact_greeting",
      "status": "Соблюдено",
      "earnedPoints": 40,
      "explanation": "Наблюдаемый факт",
      "quote": "Цитата на исходном языке",
      "timecode": "00:15",
      "confidence": "высокий",
      "source": "аудио"
    }
  ],
  "salesDrivers": [
    {
      "id": "depth_of_needs",
      "status": "Проявлен",
      "points": 2,
      "explanation": "Наблюдаемый факт"
    }
  ]
}
\`\`\`

В техническом JSON верни по одному объекту для каждого официального критерия и каждого Sales Driver. Не выставляй соблюдение без доказательства. Если данных недостаточно, используй статус «Не применимо (N/A)» или низкую уверенность. Кассовые ответы разрешено брать только из ручных данных анкеты, но не выводить из аудио.

Выдавай отчёт профессиональным, структурированным, доказательным языком на русском языке.`;

  const contentsParts: any[] = [];
  let hasValidAudio = false;

  if (audioBase64 && typeof audioBase64 === "string" && audioBase64.length > 50) {
    let mimeType = audioMimeType || "audio/mp3";
    let base64Data = audioBase64;
    if (audioBase64.includes(";base64,")) {
      const parts = audioBase64.split(";base64,");
      const mimeMatch = parts[0].match(/data:(.*?)$/);
      if (mimeMatch) mimeType = mimeMatch[1];
      base64Data = parts[1];
    }

    if (!base64Data.startsWith("http") && !base64Data.startsWith("blob:")) {
      contentsParts.push({
        inlineData: {
          data: base64Data,
          mimeType,
        },
      });
      hasValidAudio = true;
    }
  }

  let textPrompt = `${systemPrompt}\n\n`;
  if (transcript && typeof transcript === "string" && transcript.trim()) {
    textPrompt += `Текстовая запись / транскрипция визита:\n\"\"\"\n${transcript}\n\"\"\"\n\n`;
  }
  if (hasValidAudio) {
    textPrompt += `Проанализируй прикрепленную аудиозапись визита и сопоставь с текстом транскрипта (при наличии).`;
  } else if (!transcript || !transcript.trim()) {
    throw new Error("Предоставьте расшифровку (текст) диалога или корректную аудиозапись визита.");
  }

  contentsParts.push({ text: textPrompt });

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: {
      parts: contentsParts,
    },
  });

  const reportText = response.text || "Не удалось сгенерировать отчёт анализа.";

  let extractedMeta: any = null;
  let criteria: any[] | undefined;
  let salesDrivers: any[] | undefined;
  try {
    const jsonMatch = reportText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed && parsed.extractedMeta) {
        extractedMeta = parsed.extractedMeta;
        criteria = Array.isArray(parsed.criteria) ? parsed.criteria : undefined;
        salesDrivers = Array.isArray(parsed.salesDrivers) ? parsed.salesDrivers : undefined;
      }
    }
  } catch (e) {
    console.warn("Could not parse extractedMeta from AI report:", e);
  }

  // Clean CSV lines, JSON metadata and LaTeX formatting from user-facing report
  const cleanedReport = cleanMarkdownReport(reportText, extractedMeta?.bpvScore);

  return {
    success: true,
    report: cleanedReport,
    extractedMeta,
    criteria,
    salesDrivers,
    modelUsed: "gemini-3.6-flash",
  };
}

export interface EditImageParams {
  image: string;
  prompt: string;
  modelQuality?: string;
  aspectRatio?: string;
  customApiKey?: string;
}

export async function editProductPhotoClient({
  image,
  prompt,
  modelQuality = "high",
  aspectRatio = "1:1",
  customApiKey,
}: EditImageParams): Promise<{ success: boolean; imageUrl: string; description: string; modelUsed: string }> {
  const activeKey = customApiKey?.trim() || getStoredApiKey();

  if (!activeKey) {
    try {
      const res = await fetch("/api/edit-product-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, prompt, modelQuality, aspectRatio }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Не удалось разобрать ответ сервера. Укажите Ваш API ключ Gemini.");
      }
      if (res.ok && data.success) {
        return data;
      }
      if (data?.error) throw new Error(data.error);
    } catch (serverErr: any) {
      if (serverErr.message && !serverErr.message.includes("404")) {
        // throw serverErr;
      }
    }
    throw new Error(
      "Для прямой работы из браузера без сервера укажите Ваш API ключ Gemini в верхнем поле настройки ключа."
    );
  }

  const ai = getGeminiClient(activeKey);

  let mimeType = "image/png";
  let base64Data = image;

  if (image.includes(";base64,")) {
    const parts = image.split(";base64,");
    const mimeMatch = parts[0].match(/data:(.*?)$/);
    if (mimeMatch) mimeType = mimeMatch[1];
    base64Data = parts[1];
  }

  const modelName = modelQuality === "lite" ? "gemini-3.1-flash-lite-image" : "gemini-3.1-flash-image";

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
    throw new Error("Модель обработала запрос, но не вернула новое изображение. Уточните ваш промпт.");
  }

  return {
    success: true,
    imageUrl: resultImageUrl,
    description: descriptionText.trim(),
    modelUsed: modelName,
  };
}
