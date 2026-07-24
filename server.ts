import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

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
   - Тайный покупатель НЕ совершает покупку (нет денежных средств).
   - НЕЛЬЗЯ снижать оценку за отсутствие оплаты, кассового чека, оформления в 1С, выдачи товара, гарантийных документов и кассовых процедур! Эти критерии маркируются исключительно как «Не применимо (N/A)».
   - Оцениваются: Установление контакта, приветствие, инициатива, выявление потребности, воронка вопросов, знание товара, качество презентации (Характеристика + Выгода + демонстрация), сравнение 2-3 вариантов, аргументация, работа с возражениями, комплексные продажи (Cross-sell: аксессуары, услуги, Gift card), доброжелательность, завершение консультации, приглашение вернуться.

2. **1. Контрольная закупка**:
   - Оценивается ПОЛНЫЙ путь клиента: контакт, консультация, потребности, подбор, презентация, сравнение, возражения, cross-sell, оформление покупки, расчет/оплата, фискальный чек, гарантийный талон, кассовые/операционные процедуры, вежливое прощание.

3. **ЭТАПЫ СТАНДАРТА BPV ДЛЯ СРАВНЕНИЯ**:
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

    return res.json({
      success: true,
      report: reportText,
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
