/**
 * Utility to clean markdown reports from unnecessary LaTeX math symbols ($\rightarrow$),
 * excessive heading markers (####), divider rules (---), and noise formatting.
 */
export function cleanMarkdownReport(markdown: string | null | undefined): string {
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

  // 5. Normalize multiple consecutive blank lines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

export interface ReportMetadataInput {
  brand?: string;
  branch?: string;
  city?: string;
  date?: string;
  time?: string;
  checkType?: string;
  employeeCode?: string;
  inspector?: string;
  category?: string;
  target?: string;
}

/**
 * Replaces or injects Section 1 (Passport Table) in the markdown report with all operator-corrected fields from Step 3.
 */
export function updateReportMetadata(markdown: string | null | undefined, meta: ReportMetadataInput): string {
  if (!markdown) return "";

  let cleaned = cleanMarkdownReport(markdown);

  const dateStr = meta.date || "—";
  const timeStr = meta.time ? ` (${meta.time})` : "";

  const passportBlock = `## 1. ПАСПОРТ ПРОВЕРКИ И МЕТАДАННЫЕ ВИЗИТА

| Параметр | Значение |
|---|---|
| **Дата и время проверки** | ${dateStr}${timeStr} |
| **Формат проверки** | ${meta.checkType || "1. Контрольная закупка"} |
| **Бренд компании** | ${meta.brand || "—"} |
| **Филиал / Подразделение** | ${meta.branch || "—"} |
| **Город / Локация** | ${meta.city || "—"} |
| **Сотрудник (ФИО / Код)** | ${meta.employeeCode || "—"} |
| **Проверяющий / Аудитор** | ${meta.inspector || "—"} |${meta.category ? `\n| **Категория / Товар** | ${meta.category} |` : ""}${meta.target ? `\n| **Цель визита** | ${meta.target} |` : ""}`;

  // Match section 1 in markdown
  const section1Regex = /(?:#|##)\s*1\.\s*ПАСПОРТ[\s\S]*?(?=(?:#|##)\s*2\.|\n\n(?:#|##)\s*2\.|$)/i;

  if (section1Regex.test(cleaned)) {
    return cleaned.replace(section1Regex, passportBlock + "\n\n");
  } else {
    return passportBlock + "\n\n" + cleaned;
  }
}

