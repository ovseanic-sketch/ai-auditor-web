import React, { useEffect } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { X, Printer, Download, FileText } from "lucide-react";
import { exportAuditReportToPdf } from "../utils/pdfExport";

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string;
  metadata?: {
    brand?: string;
    branch?: string;
    city?: string;
    date?: string;
    time?: string;
    checkType?: string;
    employeeCode?: string;
    inspector?: string;
    bpvScore?: number;
    salesDriveScore?: number;
    cashScore?: number | "N/A";
    criticalViolationsCount?: number;
  };
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  reportContent,
  metadata,
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportAuditReportToPdf({
      title: "АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)",
      brand: metadata?.brand || "Компания",
      branch: metadata?.branch || "Филиал",
      city: metadata?.city || "Кишинев",
      date: metadata?.date || new Date().toLocaleDateString("ru-RU"),
      time: metadata?.time || "14:30",
      checkType: metadata?.checkType || "1. Контрольная закупка",
      employeeCode: metadata?.employeeCode || "Консультант",
      inspector: metadata?.inspector || "Инспектор ОКК",
      reportContent: reportContent,
      bpvScore: metadata?.bpvScore,
      salesDriveScore: metadata?.salesDriveScore,
      cashScore: metadata?.cashScore,
      criticalViolationsCount: metadata?.criticalViolationsCount,
    });
  };

  const isMysteryShopper = metadata?.checkType?.toLowerCase().includes("mystery") || metadata?.checkType?.toLowerCase().includes("без покупки");
  const bpvVal = metadata?.bpvScore;
  const bpvDisplay = bpvVal === undefined ? "N/A" : `${bpvVal}%`;
  const bpvPassed = bpvVal !== undefined && bpvVal >= 85;

  const cashVal = isMysteryShopper ? "N/A" : (metadata?.cashScore !== undefined ? `${metadata.cashScore}%` : "N/A");
  const cashPassed = cashVal === "100%";

  const salesVal = metadata?.salesDriveScore;
  const salesDisplay = salesVal === undefined ? "N/A" : `${salesVal}%`;
  const salesPassed = salesVal !== undefined && salesVal >= 70;

  const critCount = metadata?.criticalViolationsCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[94vw] h-[94vh] max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header Toolbar */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Просмотр PDF-отчета в системе</span>
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-mono uppercase">
                  PDF Preview
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Полный предпросмотр финального акта ОКК без скачивания
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Распечатать отчёт"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Печать</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-2"
              title="Закрыть окно (Escape)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center scrollbar-thin">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-xl p-6 sm:p-10 shadow-2xl space-y-6 font-sans text-xs leading-relaxed border border-slate-200 self-start">
            
            {/* Header Title */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  ОТДЕЛ КОНТРОЛЯ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)
                </div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ
                </h1>
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg inline-block">
                  BPV INDEX: {bpvDisplay}
                </div>
                <div className="text-[10px] text-slate-500">
                  Дата: {metadata?.date || new Date().toLocaleDateString("ru-RU")}
                </div>
              </div>
            </div>

            {/* Requirement 7: Four Compact Cards in One Row (СВОДНЫЕ ПОКАЗАТЕЛИ КАЧЕСТВА) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2">
                Сводные показатели качества
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {/* Card 1: BPV INDEX */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-center shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">BPV INDEX (СЕРВИС)</div>
                  <div className="text-xl font-black text-slate-900 my-1">{bpvDisplay}</div>
                  <div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${bpvPassed ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
                      {bpvPassed ? "ПРОЙДЕНО (Цель ≥85%)" : "НЕ ПРОЙДЕНО"}
                    </span>
                  </div>
                </div>

                {/* Card 2: CASH INDEX */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-center shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">CASH INDEX (КАССА)</div>
                  <div className="text-xl font-black text-slate-900 my-1">{cashVal}</div>
                  <div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isMysteryShopper ? "bg-slate-100 text-slate-600 border border-slate-200" : (cashPassed ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-red-100 text-red-800 border border-red-300")}`}>
                      {isMysteryShopper ? "НЕ ПРИМЕНИМО" : "ПРОЙДЕНО (Цель 100%)"}
                    </span>
                  </div>
                </div>

                {/* Card 3: SALES DRIVERS */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-center shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">SALES DRIVERS</div>
                  <div className="text-xl font-black text-slate-900 my-1">{salesDisplay}</div>
                  <div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${salesPassed ? "bg-blue-100 text-blue-800 border border-blue-300" : "bg-amber-100 text-amber-800 border border-amber-300"}`}>
                      {salesPassed ? "ПРОЙДЕНО (Цель ≥70%)" : "НИЖЕ ЦЕЛИ"}
                    </span>
                    <div className="text-[8px] text-slate-400 mt-0.5">Не влияет на BPV и KPI</div>
                  </div>
                </div>

                {/* Card 4: CRITICAL VIOLATIONS */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-center shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">КРИТИЧ. НАРУШЕНИЯ</div>
                  <div className={`text-xl font-black my-1 ${critCount !== undefined && critCount > 0 ? "text-red-600" : "text-emerald-700"}`}>{critCount ?? "N/A"}</div>
                  <div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${critCount === 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-red-100 text-red-800 border border-red-300 animate-pulse"}`}>
                      {critCount === undefined ? "НЕТ ДАННЫХ" : critCount === 0 ? "STOP-FACTORS НЕТ" : "ВЫЯВЛЕН СТОП-ФАКТОР"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="pdf-markdown-body text-slate-900 space-y-4 font-sans">
              <Markdown rehypePlugins={[rehypeRaw]}>{reportContent}</Markdown>
            </div>

            {/* Footer Signatures */}
            <div className="pt-8 mt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] text-slate-700">
              <div className="space-y-2">
                <p className="font-bold text-slate-900">Инспектор ОКК (Аудитор):</p>
                <div className="border-b border-slate-400 pb-1 italic font-medium">
                  {metadata?.inspector || "Инспектор ОКК"}
                </div>
                <p className="text-[10px] text-slate-400">Электронная фиксация в системе</p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-900">Руководитель филиала / Группы:</p>
                <div className="border-b border-slate-400 pb-1 italic font-medium">
                  Согласовано в ЭС
                </div>
                <p className="text-[10px] text-slate-400">Статус: В реестре проверок</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
