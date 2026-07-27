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

    // Replace "BPV INDEX: XX%"
    cleaned = cleaned.replace(
      /(\*\*BPV\s*INDEX\*\*\s*:\s*)[\d\.,]+%/gi,
      `$1${formattedBpv}`
    );
  }

  // 8. Normalize multiple consecutive blank lines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

export interface ReportMetadataInput {
  brand?: string;
  branch?: string;
  city?: string;
  region?: string;
  date?: string;
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
 * If originalMeta is provided, any values manually modified on Step 3 are highlighted in RED with a comment.
 */
export function updateReportMetadata(
  markdown: string | null | undefined,
  meta: ReportMetadataInput,
  originalMeta?: ReportMetadataInput
): string {
  if (!markdown) return "";

  let cleaned = cleanMarkdownReport(markdown, meta.bpvScore);

  const formatVal = (val: string | undefined, origVal?: string) => {
    if (!val) return "—";
    if (origVal !== undefined && val !== origVal && val.trim() !== origVal.trim()) {
      if (val.includes("внесено вручную") || val.includes("color: #ef4444")) {
        return val;
      }
      return `<span style="color: #ef4444; font-weight: bold;">${val} <small style="font-size: 10px; font-weight: normal; color: #f87171;">(внесено вручную проверяющим)</small></span>`;
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

  const checkTypeVal = formatVal(meta.checkType || "1. Контрольная закупка", originalMeta?.checkType);
  const brandVal = formatVal(meta.brand || "—", originalMeta?.brand);
  const branchVal = formatVal(meta.branch || "—", originalMeta?.branch);
  const cityVal = formatVal(meta.city || "—", originalMeta?.city);
  const regionStr = meta.region ? ` (${formatVal(meta.region, originalMeta?.region)})` : "";
  const managerVal = meta.manager ? formatVal(meta.manager, originalMeta?.manager) : "";
  const employeeVal = formatVal(meta.employeeCode || "—", originalMeta?.employeeCode);
  const inspectorVal = formatVal(meta.inspector || "—", originalMeta?.inspector);

  const passportBlock = `## 1. ПАСПОРТ ПРОВЕРКИ И МЕТАДАННЫЕ ВИЗИТА

| Параметр | Значение |
|---|---|
| **Дата и время проверки** | ${dateStr}${timeStr} |
${meta.startTime ? `| **Время начала проверки** | ${formatVal(meta.startTime, originalMeta?.startTime)} |\n` : ""}${meta.endTime ? `| **Время завершения проверки** | ${formatVal(meta.endTime, originalMeta?.endTime)} |\n` : ""}| **Формат проверки** | ${checkTypeVal} |
| **Бренд компании** | ${brandVal} |
| **Филиал / Подразделение** | ${branchVal} |
| **Город / Локация** | ${cityVal}${regionStr} |
${meta.manager ? `| **Руководитель** | ${managerVal} |\n` : ""}| **Сотрудник (ФИО / Код)** | ${employeeVal} |
| **Проверяющий / Аудитор** | ${inspectorVal} |${meta.category ? `\n| **Категория / Товар** | ${formatVal(meta.category, originalMeta?.category)} |` : ""}${meta.target ? `\n| **Цель визита** | ${formatVal(meta.target, originalMeta?.target)} |` : ""}${meta.result ? `\n| **Результат визита** | ${formatVal(meta.result, originalMeta?.result)} |` : ""}${meta.comment ? `\n\n> <span style="color: #ef4444; font-weight: bold;">Заметки и комментарий проверяющего (внесены вручную на Шаге 3):</span> ${meta.comment}` : ""}`;

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


