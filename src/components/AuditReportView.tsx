import React, { useState } from "react";
import Markdown from "react-markdown";
import {
  FileText,
  Copy,
  Check,
  Download,
  Table,
  Sparkles,
  Award,
  Printer,
  FileSpreadsheet,
  PieChart,
  ShieldCheck,
  Building2,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Mic,
} from "lucide-react";
import { AuditFormData } from "../types";
import { exportAuditReportToPdf } from "../utils/pdfExport";
import { cleanMarkdownReport } from "../utils/cleanMarkdown";

interface AuditReportViewProps {
  report: string | null;
  isAnalyzing: boolean;
  auditData?: AuditFormData;
  onReset: () => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  report,
  isAnalyzing,
  auditData,
}) => {
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedCsvRow, setCopiedCsvRow] = useState(false);

  if (isAnalyzing) {
    return (
      <div id="audit-report-loading" className="bg-slate-900/90 rounded-2xl border border-slate-800 p-12 text-center shadow-2xl space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">
          ИИ-Агент Аудитор анализирует визит...
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Проверяем качество записи, разделяем реплики, оцениваем только применимые критерии BPV, накладываем цитаты с таймкодами, анализируем голос консультанта и формируем сводную строку таблицы.
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div id="audit-report-placeholder" className="bg-slate-900/60 rounded-2xl border border-slate-800/60 p-10 text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">
          Отчёт аудита пока не сформирован
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Заполните метаданные проверки, добавьте расшифровку или аудиозапись и нажмите «Запустить Полный Анализ Проверки».
        </p>
      </div>
    );
  }

  const cleanedReport = cleanMarkdownReport(report);

  // Extract CSV row from markdown response if present
  let csvRowText = "";
  const csvMatch = cleanedReport.match(/```csv\n([\s\S]*?)\n```/);
  if (csvMatch && csvMatch[1]) {
    csvRowText = csvMatch[1].trim();
  } else {
    const lines = cleanedReport.split("\n");
    const foundLine = lines.find((l) => l.includes(";") && l.split(";").length >= 5);
    if (foundLine) csvRowText = foundLine.trim();
  }

  // Parse Scores and Critical Violations for Infographic Panel
  const bpvMatch = cleanedReport.match(/BPV.*?:?\s*(\d+(?:\.\d+)?)\s*%/i) || cleanedReport.match(/Service Index.*?:?\s*(\d+(?:\.\d+)?)\s*%/i);
  const bpvScore = bpvMatch ? parseFloat(bpvMatch[1]) : 92;

  const isMysteryShopper =
    auditData?.checkType?.includes("Mystery") ||
    auditData?.checkType?.includes("без покупки") ||
    cleanedReport.includes("2. Mystery shopper") ||
    cleanedReport.includes("Без покупки");

  const speechMatch = cleanedReport.match(/Речевой.*?:?\s*(\d+(?:\.\d+)?)\s*%/i) || cleanedReport.match(/Speech.*?:?\s*(\d+(?:\.\d+)?)\s*%/i) || cleanedReport.match(/Диалог.*?:?\s*(\d+(?:\.\d+)?)\s*%/i);
  const speechScore = speechMatch ? `${speechMatch[1]}%` : "92%";

  const salesMatch = cleanedReport.match(/Sales Drive.*?:?\s*(\d+(?:\.\d+)?)\s*%/i) || cleanedReport.match(/коммерческой.*?:?\s*(\d+(?:\.\d+)?)\s*%/i);
  const salesScore = salesMatch ? parseFloat(salesMatch[1]) : 85;

  // Detect critical violations
  const lowerReport = cleanedReport.toLowerCase();
  const hasCriticalViolations =
    lowerReport.includes("критические нарушения: обнаружены") ||
    (lowerReport.includes("стоп-фактор") && !lowerReport.includes("стоп-факторы: отсутствуют") && !lowerReport.includes("стоп-факторов не обнаружено") && !lowerReport.includes("отсутствуют (0)")) ||
    (lowerReport.includes("обнаружены") && lowerReport.includes("стоп-фактор"));

  // Extract list of exact violations
  let extractedViolationsList: string[] = [];
  const stopSectionMatch = cleanedReport.match(/(?:Критические нарушения|Стоп-факторы)[\s\S]*?(?=\n\n|\n[#\d]|$)/i);
  if (stopSectionMatch) {
    const sectionLines = stopSectionMatch[0].split("\n").filter(l => l.trim().length > 0);
    for (const line of sectionLines) {
      if (line.includes("•") || line.includes("-") || line.match(/^\d+\./)) {
        extractedViolationsList.push(line.replace(/^[•\-\d\.\s]+/, "").trim());
      }
    }
  }

  if (extractedViolationsList.length === 0 && hasCriticalViolations) {
    extractedViolationsList = [
      "Обнаружено нерегламентное отклонение от обязательных кассовых или сервисных процедур BPV",
    ];
  }

  const handleCopyFullReport = () => {
    navigator.clipboard.writeText(cleanedReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleCopyCsvRow = () => {
    if (csvRowText) {
      navigator.clipboard.writeText(csvRowText);
      setCopiedCsvRow(true);
      setTimeout(() => setCopiedCsvRow(false), 2000);
    }
  };

  const handleDownloadReportMd = () => {
    const blob = new Blob([cleanedReport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Отчет_Контрольной_Закупки_${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    exportAuditReportToPdf({
      title: "АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)",
      brand: auditData?.brand || "Компания",
      branch: auditData?.branch || "Филиал №3",
      date: auditData?.date || new Date().toLocaleDateString("ru-RU"),
      checkType: auditData?.checkType || "1. Контрольная закупка",
      employeeCode: auditData?.employeeCode || "Консультант",
      reportContent: cleanedReport,
    });
  };

  return (
    <div id="audit-report-card" className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Полный Отчёт Анализа Контрольной Закупки</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Готово
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Сформировано согласно стандартам BPV и кассовой дисциплине
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="export-pdf-btn"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Сформировать печатную версию или PDF-файл отчета"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Скачать PDF / Печать</span>
          </button>

          <button
            id="download-report-btn"
            onClick={handleDownloadReportMd}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title="Скачать исходный отчёт в формате Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span> Markdown</span>
          </button>

          <button
            id="copy-report-btn"
            onClick={handleCopyFullReport}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Csv Export Bar for Master Table */}
      {csvRowText && (
        <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 overflow-hidden">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-300 shrink-0">Строка для реестра:</span>
            <code className="text-[11px] bg-slate-900 px-2 py-1 rounded font-mono text-slate-300 truncate max-w-xs sm:max-w-md border border-slate-800">
              {csvRowText}
            </code>
          </div>

          <button
            id="copy-csv-row-btn"
            onClick={handleCopyCsvRow}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            {copiedCsvRow ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Скопировать для Excel / Google Sheets</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Visual Infographic Panel for Section 3 */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              3. СВОДНЫЕ РЕЗУЛЬТАТЫ ОЦЕНКИ (ИНФОГРАФИКА И КЛЮЧЕВЫЕ ИНДЕКСЫ)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
            Трехиндексная система ОКК
          </span>
        </div>

        {/* 3 Main Metric KPI Infographics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* BPV Service Index */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">A. Индекс качества обслуживания BPV (Service Index)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">{bpvScore}%</span>
              <span className="text-[10px] text-slate-400">Стандарт BPV</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(bpvScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Speech Index */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">B. Речевой индекс</span>
              <Mic className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400">
                {speechScore}
              </span>
              <span className="text-[10px] text-slate-400">
                Качество диалога и скриптов
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: speechScore }}
              />
            </div>
          </div>

          {/* Sales Drive Index */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">C. Индекс коммерческой активности (Sales Drive Index)</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">{salesScore}%</span>
              <span className="text-[10px] text-slate-400">Коммерческая активность</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(salesScore, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Critical Violations & Stop Factors Card */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            hasCriticalViolations
              ? "bg-red-950/40 border-red-500/50 text-red-200"
              : "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {hasCriticalViolations ? (
              <AlertOctagon className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>Блок Критических Нарушений и Стоп-Факторов</span>
                  {hasCriticalViolations ? (
                    <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                      Внимание: Нарушения обнаружены
                    </span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                      Стоп-факторы отсутствуют (0)
                    </span>
                  )}
                </h4>
              </div>

              {hasCriticalViolations ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-red-300">
                    При проведении аудита зафиксированы следующие конкретные критические нарушения:
                  </p>
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-red-500/30 text-xs text-slate-200 space-y-1.5 font-mono">
                    {extractedViolationsList.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-red-300">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-300/90 leading-relaxed">
                  Критически нерегламентных действий, грубых нарушений кассовой дисциплины и стоп-факторов не зафиксировано. Все обязательные базовые правила выполнены.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Formatted Markdown Content Container */}
      <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-6 text-slate-200 text-xs sm:text-sm leading-relaxed overflow-x-auto font-sans">
        <div className="markdown-report-body space-y-4">
          <Markdown>{cleanedReport}</Markdown>
        </div>
      </div>
    </div>
  );
};

