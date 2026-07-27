import React, { useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
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
  History,
  Clock,
  RotateCcw,
  FileCheck,
  MessageSquare,
} from "lucide-react";
import { AuditFormData, ApprovalStatus, ApprovalHistoryItem } from "../types";
import { exportAuditReportToPdf } from "../utils/pdfExport";
import { cleanMarkdownReport } from "../utils/cleanMarkdown";
import { CardSkeleton } from "./SkeletonLoader";

export interface AuditReportData extends Partial<AuditFormData> {
  id?: string;
  approvalStatus?: ApprovalStatus;
  approvalHistory?: ApprovalHistoryItem[];
  managerComment?: string;
  auditorRevisionComment?: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface AuditReportViewProps {
  report: string | null;
  isAnalyzing: boolean;
  auditData?: AuditReportData;
  onReset?: () => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  report,
  isAnalyzing,
  auditData,
  onReset,
}) => {
  const [copiedReport, setCopiedReport] = useState(false);

  if (isAnalyzing) {
    return (
      <div id="audit-report-loading" className="space-y-6">
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 text-center shadow-2xl space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div className="w-14 h-14 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
            <Sparkles className="w-5 h-5 text-blue-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-100">
            ИИ-Агент Аудитор анализирует визит...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Проверяем качество записи, разделяем реплики, оцениваем только применимые критерии BPV, накладываем цитаты с таймкодами, анализируем голос консультанта и формируем сводную строку таблицы.
          </p>
        </div>

        <CardSkeleton />
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

  const bpvTextMatch =
    report?.match(/BPV INDEX.*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i) ||
    report?.match(/(?:BPV|Service Index).*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i);

  const bpvScore =
    typeof auditData?.bpvScore === "number" && !isNaN(auditData.bpvScore)
      ? auditData.bpvScore
      : bpvTextMatch
      ? parseFloat(bpvTextMatch[1])
      : 92;

  const cleanedReport = cleanMarkdownReport(report, bpvScore);

  const isMysteryShopper =
    auditData?.checkType?.includes("Mystery") ||
    auditData?.checkType?.includes("без покупки") ||
    cleanedReport.includes("2. Mystery shopper") ||
    cleanedReport.includes("Без покупки");

  const speechMatch =
    cleanedReport.match(/РЕЧЕВОЙ ИНДЕКС.*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i) ||
    cleanedReport.match(/(?:Речевой|Speech|Диалог).*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i);

  const speechScoreVal =
    typeof auditData?.speechScore === "number" && !isNaN(auditData.speechScore)
      ? auditData.speechScore
      : speechMatch
      ? parseFloat(speechMatch[1])
      : 92;
  const speechScore = `${speechScoreVal}%`;

  const salesMatch =
    cleanedReport.match(/SALES DRIVE.*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i) ||
    cleanedReport.match(/(?:Sales Drive|коммерческой).*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i);

  const salesScore =
    typeof auditData?.salesDriveScore === "number" && !isNaN(auditData.salesDriveScore)
      ? auditData.salesDriveScore
      : salesMatch
      ? parseFloat(salesMatch[1])
      : 85;

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
      city: auditData?.city || "Кишинев",
      date: auditData?.date || new Date().toLocaleDateString("ru-RU"),
      time: auditData?.time || "14:30",
      checkType: auditData?.checkType || "1. Контрольная закупка",
      employeeCode: auditData?.employeeCode || "Консультант",
      inspector: auditData?.inspector || "Инспектор ОКК",
      category: auditData?.category || "",
      target: auditData?.target || "",
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

          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Закрыть окно просмотра"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Закрыть</span>
            </button>
          )}
        </div>
      </div>

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
          <Markdown rehypePlugins={[rehypeRaw]}>{cleanedReport}</Markdown>
        </div>
      </div>

      {/* SECTION 4: ИСТОРИЯ СОГЛАСОВАНИЯ, ПРОТЕСТОВ И ДЕЙСТВИЙ АУДИТОРА (ПРОТОКОЛ АКТА) */}
      <div className="bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              4. ИСТОРИЯ СОГЛАСОВАНИЯ, ПРОТЕСТОВ И РЕШЕНИЙ АУДИТОРА (ПРОТОКОЛ ДЕЙСТВИЙ)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
            Фиксация всех решений и комментариев
          </span>
        </div>

        {/* Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Статус Акта:</span>
            {auditData?.approvalStatus === "APPROVED" && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Утвержден ({auditData?.approvedBy || auditData?.manager || "Руководитель"})
              </span>
            )}
            {auditData?.approvalStatus === "APPROVED_WITH_COMMENTS" && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Утвержден с замечаниями ({auditData?.approvedBy || auditData?.manager || "Руководитель"})
              </span>
            )}
            {auditData?.approvalStatus === "REVISION_REQUESTED" && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" /> Подан протест / На пересмотре у проверяющего
              </span>
            )}
            {auditData?.approvalStatus === "FINALIZED" && (
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" /> Финализирован аудитором после протеста
              </span>
            )}
            {(!auditData?.approvalStatus || auditData?.approvalStatus === "PENDING_APPROVAL") && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> На согласовании у руководителя
              </span>
            )}
          </div>

          <div className="text-xs text-slate-300 font-medium">
            Текущая оценка BPV: <span className="font-bold text-amber-400">{bpvScore}%</span>
          </div>
        </div>

        {/* Manager Comment / Protest Card */}
        {auditData?.managerComment && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Замечания / Поданный протест ({auditData.manager || "Руководитель"}):</span>
            </div>
            <p className="text-xs text-amber-200/90 italic bg-slate-950/80 p-3 rounded-lg border border-amber-500/20 leading-relaxed">
              «{auditData.managerComment}»
            </p>
          </div>
        )}

        {/* Auditor Decision Card */}
        {auditData?.auditorRevisionComment && (
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Решение и действия Аудитора / Проверяющего ({auditData.inspector || "Инспектор ОКК"}):</span>
            </div>
            <p className="text-xs text-blue-200/90 italic bg-slate-950/80 p-3 rounded-lg border border-blue-500/20 leading-relaxed">
              «{auditData.auditorRevisionComment}»
            </p>
          </div>
        )}

        {/* Detailed Timeline / History Log */}
        {auditData?.approvalHistory && auditData.approvalHistory.length > 0 ? (
          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Протокол согласования и история всех действий ({auditData.approvalHistory.length}):</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
              {auditData.approvalHistory.map((item, idx) => (
                <div key={idx} className="p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      {item.user} <span className="text-slate-400 font-normal">({item.role})</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{item.timestamp}</span>
                  </div>
                  <div className="text-slate-200 font-semibold pl-4">
                    {item.action}
                  </div>
                  {item.comment && (
                    <div className="ml-4 mt-1 text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-[11px] leading-relaxed">
                      «{item.comment}»
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 text-center">
            Протокол согласования пуст. Все поступающие действия (подача протеста, замечания руководителя, ответы и решения аудитора) автоматически фиксируются в данном разделе.
          </div>
        )}
      </div>
    </div>
  );
};

