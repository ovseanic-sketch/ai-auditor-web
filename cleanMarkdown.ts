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
 */
export function updateReportMetadata(
  markdown: string | null | undefined,
  meta: ReportMetadataInput,
  _originalMeta?: ReportMetadataInput
): string {
  if (!markdown) return "";

  let cleaned = cleanMarkdownReport(markdown, meta.bpvScore);

  const formatVal = (val: string | undefined) => {
    if (!val) return "—";
    return val.replace(/<span style="color: #ef4444;[\s\S]*?<\/span>/g, "").replace(/\(внесено вручную.*?\)/g, "").trim() || "—";
  };

  const dateStr = formatVal(meta.date || "—");
  let timeStr = "";
  if (meta.startTime || meta.endTime) {
    const formattedStart = formatVal(meta.startTime || "—");
    const formattedEnd = formatVal(meta.endTime || "—");
    timeStr = ` (${formattedStart} - ${formattedEnd})`;
  } else if (meta.time) {
    timeStr = ` (${formatVal(meta.time)})`;
  }

  const monthVal = meta.month ? formatVal(meta.month) : null;
  const checkTypeVal = formatVal(meta.checkType || "1. Контрольная закупка");
  const brandVal = formatVal(meta.brand || "—");
  const branchVal = formatVal(meta.branch || "—");
  const cityVal = formatVal(meta.city || "—");
  const regionStr = meta.region ? ` (${formatVal(meta.region)})` : "";
  const managerVal = meta.manager ? formatVal(meta.manager) : "";
  const employeeVal = formatVal(meta.employeeCode || "—");
  const inspectorVal = formatVal(meta.inspector || "—");

  const passportBlock = `## 1. ПАСПОРТ ПРОВЕРКИ И МЕТАДАННЫЕ ВИЗИТА

| Параметр | Значение |
|---|---|
| **Дата и время проверки** | ${dateStr}${timeStr} |
${monthVal ? `| **Месяц проведения** | ${monthVal} |\n` : ""}${meta.startTime ? `| **Время начала проверки** | ${formatVal(meta.startTime)} |\n` : ""}${meta.endTime ? `| **Время завершения проверки** | ${formatVal(meta.endTime)} |\n` : ""}| **Формат проверки** | ${checkTypeVal} |
| **Бренд компании** | ${brandVal} |
| **Филиал / Подразделение** | ${branchVal} |
| **Город / Локация** | ${cityVal}${regionStr} |
${meta.manager ? `| **Руководитель** | ${managerVal} |\n` : ""}| **Сотрудник (ФИО / Код)** | ${employeeVal} |
| **Проверяющий / Аудитор** | ${inspectorVal} |${meta.category ? `\n| **Категория / Товар** | ${formatVal(meta.category)} |` : ""}${meta.target ? `\n| **Цель визита** | ${formatVal(meta.target)} |` : ""}${meta.result ? `\n| **Результат визита** | ${formatVal(meta.result)} |` : ""}${meta.comment ? `\n| **Заметки проверяющего** | ${formatVal(meta.comment)} |` : ""}`;

  // Match section 1 in markdown
  const section1Regex = /(?:#|##)\s*1\.\s*ПАСПОРТ[\s\S]*?(?=(?:#|##)\s*2\.|\n\n(?:#|##)\s*2\.|$)/i;

  if (section1Regex.test(cleaned)) {
    return cleaned.replace(section1Regex, passportBlock + "\n\n");
  } else {
    return passportBlock + "\n\n" + cleaned;
  }
}

/**
 * Clean function that returns current text without erroneous red tags.
 */
export function highlightManualEdits(currentText: string, _originalText?: string | null): string {
  if (!currentText) return "";
  return currentText.replace(/<span style="color: #ef4444;[\s\S]*?<\/span>/g, "").replace(/\(внесено вручную.*?\)/g, "");
}



