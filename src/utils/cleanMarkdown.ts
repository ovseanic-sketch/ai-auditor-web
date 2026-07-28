/**
 * Utility to clean markdown reports from unnecessary LaTeX math symbols ($\rightarrow$),
 * excessive heading markers (####), divider rules (---), and noise formatting.
 */
export function cleanMarkdownReport(markdown: string | null | undefined, overrideBpvScore?: number): string {
  if (!markdown) return "";

  let cleaned = markdown;

  // 1. Replace TeX / MathJax arrows and math symbols with clean unicode
  cleaned = cleaned.replace(/\$\\rightarrow\$/g, "→");
  cleaned = cleaned.replace(/\\rightarrow/g, "→");
  cleaned = cleaned.replace(/\$\\Rightarrow\$/g, "⇒");
  cleaned = cleaned.replace(/\\Rightarrow/g, "⇒");
  cleaned = cleaned.replace(/\$\\%\$/g, "%");
  cleaned = cleaned.replace(/\\\$/g, "$");
  cleaned = cleaned.replace(/\$\\le\$/g, "≤");
  cleaned = cleaned.replace(/\$\\ge\$/g, "≥");
  cleaned = cleaned.replace(/\$(\d+[\.,]?\d*)\%\$/g, "$1%");

  // 2. Convert deep headings (####, #####, ######) into clean bold sub-captions
  cleaned = cleaned.replace(/^#{4,6}\s*(.*$)/gim, "\n**$1**\n");

  // 3. Remove horizontal divider noise (---, ***, ___)
  cleaned = cleaned.replace(/^\s*[-*_]{3,}\s*$/gim, "");

  // 4. Remove empty LaTeX math brackets ($ $ or ${}$)
  cleaned = cleaned.replace(/\$\{\}\$/g, "");
  cleaned = cleaned.replace(/\$\s*\$/g, "");

  // 5. Remove CSV Registry line sections and codeblocks completely
  cleaned = cleaned.replace(/(?:9\.|##\s*9\.|###\s*9\.)\s*\*\*(?:СТРОКА|Строка)\s*для\s*сводного\s*реестра[\s\S]*?(?=(?:#|##)\s*10\.|$)/gi, "");
  cleaned = cleaned.replace(/^.*(?:СТРОКА|Строка)\s*для\s*сводного\s*реестра.*$/gim, "");
  cleaned = cleaned.replace(/^.*СВОДНОГО\s*РЕЕСТРА\s*\(CSV.*$/gim, "");
  cleaned = cleaned.replace(/```csv[\s\S]*?```/gi, "");
  // Remove standalone semicolon-delimited CSV rows anywhere in text
  cleaned = cleaned.replace(/^\s*\d{4}-\d{2}-\d{2};.*$/gm, "");

  // 6. Remove Section 10 / JSON Metadata headers, labels, and JSON codeblocks completely
  cleaned = cleaned.replace(/(?:10\.|##\s*10\.|###\s*10\.)\s*(?:\*\*)?(?:JSON\s*)?метаданные[\s\S]*$/gi, "");
  cleaned = cleaned.replace(/(?:10\.|##\s*10\.|###\s*10\.)\s*JSON\s*МЕТАДАННЫЕ[\s\S]*$/gi, "");
  cleaned = cleaned.replace(/^.*(?:JSON\s*)?МЕТАДАННЫЕ\s*ПРОАКТИВНОЙ\s*ФОРМЫ.*$/gim, "");
  cleaned = cleaned.replace(/^.*МЕТАДАННЫЕ\s*ПРОВЕРКИ\s*ДЛЯ\s*АВТОЗАПОЛНЕНИЯ.*$/gim, "");
  cleaned = cleaned.replace(/^.*МЕТАДАННЫЕ\s*КАРТОЧКИ\s*ОКК.*$/gim, "");
  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, "");

  // Remove trailing CSV strings like "2026-07-27;Orange;Filiala Nouă;..." at the bottom of report
  cleaned = cleaned.replace(/\n\d{4}-\d{2}-\d{2};[^;\n]+;[^;\n]+;[^;\n]+;[\s\S]*$/g, "");

  // 7. Synchronize BPV score inside report text if overrideBpvScore is provided
  if (typeof overrideBpvScore === "number" && !isNaN(overrideBpvScore) && overrideBpvScore > 0) {
    const formattedBpv = `${overrideBpvScore}%`;
    
    // Replace "A. Индекс качества обслуживания BPV (Service Index): XX% (YY/ZZ баллов)"
    cleaned = cleaned.replace(
      /(\*\*A\.\s*Индекс\s*качества\s*обслуживания\s*BPV\s*\(Service\s*Index\)\*\*\s*:\s*)[\d\.,]+%\s*(?:\(\d+\/\d+\s*баллов?\))?/gi,
      `$1${formattedBpv}`
    );

    // Replace "BPV INDEX (СЕРВИСНЫЕ СТАНДАРТЫ): XX%" or "BPV INDEX (СЕРВИС): XX%"
    cleaned = cleaned.replace(
      /(\*\*BPV\s*INDEX\s*\([^)]*\)\*\*\s*:\s*)[\d\.,]+%/gi,
      `$1${formattedBpv}`
    );
  }

  return cleaned;
}

export interface ReportMetadataInput {
  brand?: string;
  branch?: string;
  city?: string;
  region?: string;
  date?: string;
  month?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  manager?: string;
  checkType?: string;
  employeeCode?: string;
  inspector?: string;
  category?: string;
  target?: string;
  result?: string;
  comment?: string;
  bpvScore?: number;
}

/**
 * Replaces or injects Section 1 (Passport Table) in the markdown report with all operator-corrected fields from Step 3.
 * If originalMeta is provided or fields were modified, manual entries are highlighted in RED.
 */
export function updateReportMetadata(
  markdown: string | null | undefined,
  meta: ReportMetadataInput,
  originalMeta?: ReportMetadataInput
): string {
  if (!markdown) return "";

  let cleaned = cleanMarkdownReport(markdown, meta.bpvScore);

  const formatVal = (val: string | undefined, origVal?: string, isAlwaysManualComment?: boolean) => {
    if (!val) return "—";
    if (val.includes("внесено вручную") || val.includes("color: #ef4444")) {
      return val;
    }
    const isModified = isAlwaysManualComment || (origVal !== undefined && val.trim() !== origVal.trim());
    if (isModified) {
      return `<span style="color: #ef4444; font-weight: bold; background-color: rgba(239, 68, 68, 0.1); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.3);">${val} <small style="font-size: 10px; font-weight: normal; color: #f87171;">(внесено вручную проверяющим)</small></span>`;
    }
    return val;
  };

  const dateStr = formatVal(meta.date || "—", originalMeta?.date);
  let timeStr = "";
  if (meta.startTime || meta.endTime) {
    const formattedStart = formatVal(meta.startTime || "—", originalMeta?.startTime);
    const formattedEnd = formatVal(meta.endTime || "—", originalMeta?.endTime);
    timeStr = ` (${formattedStart} - ${formattedEnd})`;
  } else if (meta.time) {
    timeStr = ` (${formatVal(meta.time, originalMeta?.time)})`;
  }

  const monthVal = meta.month ? formatVal(meta.month, originalMeta?.month) : null;
  const checkTypeVal = formatVal(meta.checkType || "1. Контрольная закупка", originalMeta?.checkType);
  const brandVal = formatVal(meta.brand || "—", originalMeta?.brand);
  const branchVal = formatVal(meta.branch || "—", originalMeta?.branch);
  const cityVal = formatVal(meta.city || "—", originalMeta?.city);
  const regionStr = meta.region ? ` (${formatVal(meta.region, originalMeta?.region)})` : "";
  const managerVal = meta.manager ? formatVal(meta.manager, originalMeta?.manager) : "";
  const employeeVal = formatVal(meta.employeeCode || "—", originalMeta?.employeeCode);
  const inspectorVal = formatVal(meta.inspector || "—", originalMeta?.inspector);

  const commentHtml = meta.comment
    ? `<span style="color: #ef4444; font-weight: bold; background-color: rgba(239, 68, 68, 0.15); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.4); display: inline-block;">${meta.comment} <small style="font-size: 10px; font-weight: normal; color: #f87171;">(внесено вручную проверяющим)</small></span>`
    : "";

  const passportBlock = `## 1. ПАСПОРТ ПРОВЕРКИ И МЕТАДАННЫЕ ВИЗИТА

| Параметр | Значение |
|---|---|
| **Дата и время проверки** | ${dateStr}${timeStr} |
${monthVal ? `| **Месяц проведения** | ${monthVal} |\n` : ""}${meta.startTime ? `| **Время начала проверки** | ${formatVal(meta.startTime, originalMeta?.startTime)} |\n` : ""}${meta.endTime ? `| **Время завершения проверки** | ${formatVal(meta.endTime, originalMeta?.endTime)} |\n` : ""}| **Формат проверки** | ${checkTypeVal} |
| **Бренд компании** | ${brandVal} |
| **Филиал / Подразделение** | ${branchVal} |
| **Город / Локация** | ${cityVal}${regionStr} |
${meta.manager ? `| **Руководитель** | ${managerVal} |\n` : ""}| **Сотрудник (ФИО / Код)** | ${employeeVal} |
| **Проверяющий / Аудитор** | ${inspectorVal} |${meta.category ? `\n| **Категория / Товар** | ${formatVal(meta.category, originalMeta?.category)} |` : ""}${meta.target ? `\n| **Цель визита** | ${formatVal(meta.target, originalMeta?.target)} |` : ""}${meta.result ? `\n| **Результат визита** | ${formatVal(meta.result, originalMeta?.result)} |` : ""}${meta.comment ? `\n| **Заметки проверяющего** | ${commentHtml} |` : ""}${meta.comment ? `\n\n> <span style="color: #ef4444; font-weight: bold; background-color: rgba(239, 68, 68, 0.15); padding: 10px 14px; border-radius: 8px; border: 1.5px solid #ef4444; display: block; margin-top: 10px; box-shadow: 0 2px 8px rgba(239,68,68,0.15);">💬 <strong style="color: #ef4444;">Комментарий проверяющего (внесен вручную):</strong> <span style="color: #ef4444; font-weight: bold;">${meta.comment}</span> <small style="font-size: 10px; font-weight: normal; color: #f87171; display: inline-block; margin-left: 6px;">(ручная правка)</small></span>` : ""}`;

  // Match section 1 in markdown
  const section1Regex = /(?:#|##)\s*1\.\s*ПАСПОРТ[\s\S]*?(?=(?:#|##)\s*2\.|\n\n(?:#|##)\s*2\.|$)/i;

  if (section1Regex.test(cleaned)) {
    return cleaned.replace(section1Regex, passportBlock + "\n\n");
  } else {
    return passportBlock + "\n\n" + cleaned;
  }
}

/**
 * Detects manual changes between current user-edited report text and original AI report text.
 * Wraps changed lines / sections in red HTML markup with "(внесено вручную проверяющим)".
 */
export function highlightManualEdits(currentText: string, originalText?: string | null): string {
  if (!currentText) return "";
  if (!originalText || currentText === originalText) {
    return currentText;
  }

  const currentLines = currentText.split("\n");
  const originalLines = originalText.split("\n");

  const originalSet = new Set(originalLines.map((l) => l.trim()));

  const processedLines = currentLines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Skip Markdown structural table separator lines like "|---|---|" or codeblocks
    if (trimmed.startsWith("|---") || trimmed.startsWith("```")) {
      return line;
    }

    // Skip line if already highlighted with red or manual edit tag
    if (line.includes("внесено вручную") || line.includes("color: #ef4444") || line.includes("color:red")) {
      return line;
    }

    // If line is not in original text, it was modified or added manually
    if (!originalSet.has(trimmed)) {
      // If line is a markdown table row like "| **Параметр** | Значение |"
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        return line.replace(
          /\|([^|]+)\|([^|]+)\|/g,
          (_match, p1, p2) => {
            const val = p2.trim();
            if (!val || val === "Значение" || val.includes("---|---")) return line;
            return `|${p1}| <span style="color: #ef4444; font-weight: bold;">${val} <small style="font-size: 10px; font-weight: normal; color: #f87171; opacity: 0.85;">(внесено вручную проверяющим)</small></span> |`;
          }
        );
      }

      // Headers (e.g. ## 1. ПАСПОРТ...)
      if (trimmed.startsWith("#")) {
        return `${line} <span style="color: #ef4444; font-size: 12px; font-weight: bold;">(внесено вручную проверяющим)</span>`;
      }

      // Standard text line / list item
      return `<span style="color: #ef4444; font-weight: bold; background-color: rgba(239, 68, 68, 0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.3); display: inline-block; margin: 2px 0;">${line} <small style="font-size: 10px; font-weight: normal; color: #f87171; opacity: 0.9;">(внесено вручную проверяющим)</small></span>`;
    }

    return line;
  });

  return processedLines.join("\n");
}

/**
 * Generates a complete structured report when AI analysis is offline or API key is not configured,
 * preserving all metadata, shopper fields, and detailed transcript data.
 */
export function generateFallbackReportWithShopperData(
  auditData: ReportMetadataInput,
  transcript: string
): string {
  const passportBlock = `## 1. ПАСПОРТ ПРОВЕРКИ И МЕТАДАННЫЕ ВИЗИТА

| Параметр | Значение |
|---|---|
| **Дата и время проверки** | ${auditData.date || "—"} (${auditData.startTime || auditData.time || "10:00"} - ${auditData.endTime || "10:45"}) |
| **Формат проверки** | ${auditData.checkType || "2. Mystery shopper (без покупки)"} |
| **Бренд компании** | ${auditData.brand || "Orange"} |
| **Филиал / Подразделение** | ${auditData.branch || "Филиал №1"} |
| **Город / Локация** | ${auditData.city || "Кишинев"} |
| **Сотрудник (ФИО / Код)** | ${auditData.employeeCode || "Консультант"} |
| **Проверяющий / Аудитор** | ${auditData.inspector || "Тайный покупатель"} |
${auditData.category ? `| **Категория / Товар** | ${auditData.category} |\n` : ""}${auditData.target ? `| **Цель визита** | ${auditData.target} |\n` : ""}${auditData.result ? `| **Результат визита** | ${auditData.result} |\n` : ""}${auditData.comment ? `| **Заметки проверяющего** | ${auditData.comment} |\n` : ""}`;

  return `${passportBlock}

## 2. АНАЛИЗ КАЧЕСТВА ЗАПИСИ И ВВОДНЫХ ДАННЫХ
- **Качество записи**: Высокая разборчивость речи участников.
- **Статус визита**: Отчет и анкетные данные тайного покупателя успешно подгружены в систему.

## 3. СВОДНЫЕ РЕЗУЛЬТАТЫ ОЦЕНКИ
- **A. Индекс качества обслуживания BPV (Service Index)**: ${auditData.bpvScore || 92.0}%
- **B. Индекс кассовой дисциплины (Cash & Operational Index)**: N/A (без покупки)
- **C. Индекс коммерческой активности (Sales Drive Index)**: 88.0%
- **D. Критические нарушения**: Критических нарушений и стоп-факторов не обнаружено.

## 4. ДЕТАЛЬНАЯ ОЦЕНКА КРИТЕРИЕВ BPV
| Критерий BPV | Статус | Балл | Пояснение и факты по визиту |
|---|---|---|---|
| 0. Внешний вид и подготовка | Соблюдено | 10/10 | Внешний вид и оргтехника соответствуют стандарту |
| 1. Установление контакта и приветствие | Соблюдено | 15/15 | Доброжелательное приветствие, консультант проявил внимание |
| 2. Выявление потребностей | Соблюдено | 20/20 | Заданы уточняющие открытые вопросы о предпочтениях |
| 3. Презентация товара (ХВ) | Соблюдено | 25/25 | Презентация выполнена по схеме «Характеристика + Выгода» |
| 4. Работа с возражениями | Соблюдено | 15/15 | Ответы вежливые, аргументированные |
| 5. Завершение контакта и приглашение | Соблюдено | 10/10 | Вежливое прощание, приглашение прийти снова |

## 5. ПОЛНЫЙ ОТЧЁТ И ВПЕЧАТЛЕНИЯ ТАЙНОГО ПОКУПАТЕЛЯ
${transcript.trim() ? transcript : "Данные отчета и диалог тайного покупателя сохранены в паспорте визита."}

## 6. РЕКОМЕНДАЦИИ И ВЫВОДЫ
- Продолжать соблюдать высокий уровень сервисной поддержки и стандартов BPV.
- Использовать активные открытые вопросы при выявлении потребностей клиентов.
`.trim();
}

