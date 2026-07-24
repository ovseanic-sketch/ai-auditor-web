import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = "user_gemini_api_key";

export function getStoredApiKey(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || "";
  }
  return import.meta.env.VITE_GEMINI_API_KEY || "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window !== "undefined") {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
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
}: AnalyzeParams): Promise<{ success: boolean; report: string; extractedMeta?: any; modelUsed: string }> {
  // 1. First try direct client-side call if API key exists or provided
  const activeKey = customApiKey?.trim() || getStoredApiKey();

  if (!activeKey) {
    // If no client key is available, try server fallback if running fullstack
    try {
      const res = await fetch("/api/analyze-mystery-shopper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditData, transcript, audioBase64, audioMimeType }),
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
     * ВАЖНО: Если обнаружены критические нарушения/стоп-факторы, ОБЯЗАТЕЛЬНО подробно распиши, ЧТО ИМЕННО было нарушено.
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

  const contentsParts: any[] = [];

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
    console.warn("Could not parse extractedMeta from AI report:", e);
  }

  return {
    success: true,
    report: reportText,
    extractedMeta,
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
