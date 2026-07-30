/**
 * Utility for exporting Audit Reports into high-quality corporate PDF documents
 * matching the official "АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)" standard.
 */

import { cleanMarkdownReport, updateReportMetadata } from "./cleanMarkdown";
import { ShopperFormData, DisputedPointItem, InspectorEditHistoryItem } from "../types";

export interface ExportPdfOptions {
  title?: string;
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
  reportContent: string;
  shopperData?: ShopperFormData;
  disputedPoints?: DisputedPointItem[];
  inspectorEdits?: InspectorEditHistoryItem[];
  managerComment?: string;
  bpvScore?: number;
  salesDriveScore?: number;
  cashScore?: number | "N/A";
  criticalViolationsCount?: number;
}

export function exportAuditReportToPdf(options: ExportPdfOptions) {
  const {
    title = "АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)",
    brand = "Компания",
    branch = "Филиал №3",
    city = "Кишинев",
    date = new Date().toLocaleDateString("ru-RU"),
    time = "14:30",
    checkType = "Полная проверка с контрольной закупкой",
    employeeCode = "Консультант",
    inspector = "Инспектор ОКК",
    category,
    target,
    reportContent,
    shopperData,
    disputedPoints,
    inspectorEdits,
    managerComment,
    bpvScore,
    salesDriveScore,
    cashScore,
    criticalViolationsCount,
  } = options;

  // Create a printable HTML document in an isolated frame/window
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Пожалуйста, разрешите всплывающие окна для экспорта PDF!");
    return;
  }

  const isMysteryShopper = checkType.toLowerCase().includes("mystery");
  const badgeText = isMysteryShopper ? "MYSTERY SHOPPER" : "КОНТРОЛЬНАЯ ЗАКУПКА";
  const badgeClass = isMysteryShopper ? "badge-green" : "badge-blue";

  // Ensure Section 1 (Passport) contains all Step 3 corrected fields
  const updatedReportText = updateReportMetadata(reportContent, {
    brand,
    branch,
    city,
    date,
    time,
    checkType,
    employeeCode,
    inspector,
    category,
    target,
  });

  const cleanedContent = cleanMarkdownReport(updatedReportText, bpvScore);

  // Convert markdown to custom HTML with the exact corporate OKK layout
  const formattedBody = formatMarkdownToOkkHtml(cleanedContent, {
    brand,
    branch,
    date,
    checkType,
    employeeCode,
    inspector,
  });

  const shopperSectionHtml = shopperData
    ? `
      <div class="shopper-card" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:16px; margin:20px 0; page-break-inside:avoid;">
        <div style="font-weight:800; font-size:10pt; color:#0f172a; margin-bottom:10px; border-bottom:1px solid #e2e8f0; padding-bottom:6px; text-transform:uppercase;">
          ДАННЫЕ И ВПЕЧАТЛЕНИЯ ТАЙНОГО ПОКУПАТЕЛЯ
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:8.5pt;">
          <div>
            <strong>А. Наблюдаемые данные:</strong>
            <ul style="margin:4px 0 0 16px; padding:0; color:#334155;">
              <li>Униформа: ${shopperData.uniformStatus === "standard" ? "Соответствует" : "Замечания"}</li>
              <li>Бейдж: ${shopperData.badgeStatus === "present" ? "Присутствует" : "Отсутствует"}</li>
              <li>Опрятность: ${shopperData.neatnessStatus === "neat" ? "Опрятный" : "Замечания"}</li>
              <li>Доступность персонала: ${shopperData.staffAvailability === "immediate" ? "Доступен сразу" : "Пришлось искать"}</li>
              <li>Состояние зала: Чистота ${shopperData.cleanlinessRating}/5, Выкладка ${shopperData.merchandisingRating}/5</li>
            </ul>
          </div>
          <div>
            <strong>Б. Впечатления и аудио:</strong>
            <div style="margin-top:4px; color:#334155;">
              <div><strong>Понравилось:</strong> ${shopperData.whatLiked || "Ориентирован на клиента"}</div>
              <div><strong>Замечания:</strong> ${shopperData.whatDisliked || "Без существенных замечаний"}</div>
              <div><strong>Аудиофайл:</strong> ${shopperData.audioFileName || "Прикреплен к карточке"}</div>
            </div>
          </div>
        </div>
        <div style="font-size:7.5pt; color:#64748b; font-style:italic; margin-top:8px;">
          * Субъективные впечатления шоппера приведены для справки и не являются автоматическим нарушением BPV без аудиоподтверждения или решения ОКК.
        </div>
      </div>
    `
    : "";

  const inspectorCommentHtml = managerComment
    ? `
      <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:12px; margin:16px 0; page-break-inside:avoid;">
        <div style="font-weight:800; font-size:8.5pt; color:#0369a1; text-transform:uppercase; margin-bottom:4px;">
          КОММЕНТАРИЙ И ЗАКЛЮЧЕНИЕ ПРОВЕРЯЮЩЕГО ОКК:
        </div>
        <div style="font-size:8.5pt; color:#0c4a6e;">
          ${managerComment}
        </div>
      </div>
    `
    : "";

  const bpvDisplay = bpvScore === undefined ? "N/A" : `${bpvScore}%`;
  const cashDisplay =
    isMysteryShopper || cashScore === "N/A"
      ? "N/A"
      : cashScore === undefined
      ? "N/A"
      : `${cashScore}%`;
  const salesDisplay = salesDriveScore === undefined ? "N/A" : `${salesDriveScore}%`;
  const criticalDisplay =
    criticalViolationsCount === undefined ? "N/A" : String(criticalViolationsCount);
  const kpiSummaryHtml = `
    <h2 class="section-title">Сводные показатели качества</h2>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">BPV Index (сервис)</div><div class="kpi-value">${bpvDisplay}</div><span class="kpi-status-tag ${bpvScore !== undefined && bpvScore >= 85 ? "success" : "warning"}">${bpvScore === undefined ? "НЕТ ДАННЫХ" : bpvScore >= 85 ? "ЦЕЛЬ ≥85%" : "НИЖЕ ЦЕЛИ"}</span></div>
      <div class="kpi-card"><div class="kpi-label">Cash Index (касса)</div><div class="kpi-value">${cashDisplay}</div><span class="kpi-status-tag ${cashDisplay === "100%" ? "success" : "warning"}">${cashDisplay === "N/A" ? "НЕ ПРИМЕНИМО / НЕТ ДАННЫХ" : "ЦЕЛЬ 100%"}</span></div>
      <div class="kpi-card"><div class="kpi-label">Sales Drivers</div><div class="kpi-value">${salesDisplay}</div><span class="kpi-status-tag ${salesDriveScore !== undefined && salesDriveScore >= 70 ? "success" : "warning"}">НЕ ВЛИЯЕТ НА BPV</span></div>
      <div class="kpi-card"><div class="kpi-label">Критич. нарушения</div><div class="kpi-value ${criticalViolationsCount && criticalViolationsCount > 0 ? "danger" : ""}">${criticalDisplay}</div><span class="kpi-status-tag ${criticalViolationsCount === 0 ? "success" : "warning"}">${criticalViolationsCount === undefined ? "НЕТ ДАННЫХ" : criticalViolationsCount === 0 ? "STOP-ФАКТОРОВ НЕТ" : "ЕСТЬ STOP-ФАКТОР"}</span></div>
    </div>
  `;

  const printDocumentHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>АКТ ОКК - ${brand} - ${branch}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }

    /* Print Navigation Bar */
    .print-bar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: white;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1000;
      margin-bottom: 20px;
      font-family: sans-serif;
    }

    .print-bar button {
      background: #10b981;
      color: white;
      border: none;
      padding: 8px 20px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .print-bar button:hover {
      background: #059669;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* Executive OKK Header Card */
    .okk-header {
      background: #0f172a;
      color: #ffffff;
      padding: 20px 24px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .okk-header-title h1 {
      margin: 0 0 4px 0;
      font-size: 15pt;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #ffffff;
    }

    .okk-header-title p {
      margin: 0;
      font-size: 8.5pt;
      color: #94a3b8;
    }

    .badge-green {
      background-color: #059669;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 6px 14px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .badge-blue {
      background-color: #2563eb;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 6px 14px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    /* Section Headings */
    h2.section-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-top: 22px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h2.section-title::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 14px;
      background-color: #2563eb;
      border-radius: 2px;
    }

    /* Passport Table Grid */
    .passport-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 20px;
      background-color: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .passport-table td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    .passport-label {
      font-weight: 700;
      color: #0f172a;
      width: 18%;
    }

    .passport-value {
      color: #334155;
      width: 32%;
    }

    /* KPI Summary Cards Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }

    .kpi-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 4px;
    }

    .kpi-value {
      font-size: 16pt;
      font-weight: 800;
      color: #10b981;
      margin-bottom: 4px;
    }

    .kpi-value.warning {
      color: #f59e0b;
    }

    .kpi-value.danger {
      color: #ef4444;
    }

    .kpi-status-tag {
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
      text-transform: uppercase;
    }

    .kpi-status-tag.success {
      background-color: #d1fae5;
      color: #047857;
    }

    .kpi-status-tag.warning {
      background-color: #fef3c7;
      color: #b45309;
    }

    /* Criteria Cards */
    .block-header {
      font-size: 9pt;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 16px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid #cbd5e1;
    }

    .criterion-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .criterion-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .criterion-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
    }

    .score-badge {
      font-size: 8.5pt;
      font-weight: 800;
      color: #047857;
    }

    .score-badge.fail {
      color: #b91c1c;
    }

    .criterion-desc {
      font-size: 8.5pt;
      color: #334155;
      margin-bottom: 6px;
    }

    .quote-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 8pt;
      color: #475569;
      font-style: italic;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .quote-box .time {
      font-style: normal;
      font-weight: 700;
      color: #64748b;
    }

    /* Structured Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 12px 0 20px 0;
      page-break-inside: auto;
    }

    table.data-table tr {
      page-break-inside: avoid;
    }

    table.data-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
    }

    table.data-table td {
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }

    .script-module {
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 6px;
    }

    /* Registry Box */
    .registry-box {
      background-color: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 10px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.5pt;
      color: #334155;
      margin-bottom: 20px;
      word-break: break-all;
    }

    /* Signatures Block */
    .signatures-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin-top: 24px;
      page-break-inside: avoid;
    }

    .signatures-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .signature-item {
      font-size: 8pt;
      color: #475569;
    }

    .signature-line {
      border-bottom: 1px solid #94a3b8;
      margin-top: 30px;
      margin-bottom: 4px;
    }

    .footer-note {
      text-align: center;
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: 16px;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background-color: #ffffff;
      }
      .container {
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>

  <div class="print-bar no-print">
    <span><strong>Официальный Акт ОКК:</strong> Распечатайте или сохраните в качестве PDF-файла.</span>
    <button onclick="window.print()">Сохранить в PDF / Печать</button>
  </div>

  <div class="container">
    <div class="okk-header">
      <div class="okk-header-title">
        <h1>${title}</h1>
        <p>Отчёт проведения проверки по методу «Контрольная закупка» / Mystery Shopping</p>
      </div>
      <div>
        <span class="${badgeClass}">${badgeText}</span>
      </div>
    </div>

    <div class="report-body">
      ${kpiSummaryHtml}
      ${shopperSectionHtml}
      ${formattedBody}
      ${inspectorCommentHtml}
    </div>

    <div class="signatures-card">
      <div class="signatures-title">Согласование и ознакомление</div>
      <div class="signatures-grid">
        <div class="signature-item">
          <div>Специалист ОКК / Аудитор:</div>
          <div class="signature-line"></div>
          <div>${inspector}</div>
        </div>
        <div class="signature-item">
          <div>Руководитель филиала (РОП):</div>
          <div class="signature-line"></div>
          <div>(Подпись / ФИО)</div>
        </div>
        <div class="signature-item">
          <div>Сотрудник (${employeeCode}):</div>
          <div class="signature-line"></div>
          <div>(Подпись / ФИО)</div>
        </div>
      </div>
    </div>

    <div class="footer-note">
      Акт сформирован автоматически Отделом контроля качества (ОКК). Версия документа: 1.0 (2026)
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(printDocumentHtml);
  printWindow.document.close();
}

interface FormatMeta {
  brand: string;
  branch: string;
  date: string;
  checkType: string;
  employeeCode: string;
  inspector?: string;
}

function formatMarkdownToOkkHtml(markdown: string, meta: FormatMeta): string {
  if (!markdown) return "";

  let html = markdown;

  // Basic HTML Escaping
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Format headers
  html = html.replace(/^### (.*$)/gim, '<h2 class="section-title">$1</h2>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="section-title">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="section-title">$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Code / CSV Block
  html = html.replace(/```(csv|text)?\n([\s\S]*?)\n```/g, '<div class="registry-box">$2</div>');

  // Convert markdown tables into styled HTML tables
  const lines = html.split("\n");
  let inTable = false;
  let tableHtml = "";
  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("|") && line.endsWith("|")) {
      // Check for markdown divider line |---|---|
      if (line.replace(/\|/g, "").replace(/\-/g, "").trim() === "") {
        continue;
      }

      const cells = line.split("|").slice(1, -1).map((c) => c.trim());

      if (!inTable) {
        inTable = true;
        tableHtml = '<table class="data-table"><thead><tr>';
        cells.forEach((cell) => {
          tableHtml += `<th>${cell}</th>`;
        });
        tableHtml += "</tr></thead><tbody>";
      } else {
        tableHtml += "<tr>";
        cells.forEach((cell, idx) => {
          // If it's the last column in recommended script, wrap in green pill
          if (idx === 2 && (cell.includes("«") || cell.includes("Рекомендуем") || cell.includes("К этому"))) {
            tableHtml += `<td><div class="script-module">${cell}</div></td>`;
          } else {
            tableHtml += `<td>${cell}</td>`;
          }
        });
        tableHtml += "</tr>";
      }
    } else {
      if (inTable) {
        inTable = false;
        tableHtml += "</tbody></table>";
        resultLines.push(tableHtml);
        tableHtml = "";
      }

      if (line.startsWith("- ") || line.startsWith("* ")) {
        resultLines.push(`<li>${line.substring(2)}</li>`);
      } else if (line.length > 0) {
        resultLines.push(`<p>${line}</p>`);
      }
    }
  }

  if (inTable) {
    tableHtml += "</tbody></table>";
    resultLines.push(tableHtml);
  }

  return resultLines.join("\n");
}
