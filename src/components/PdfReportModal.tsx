import React from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { X, Printer, Download, FileText, Award } from "lucide-react";
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
  };
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  reportContent,
  metadata,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportAuditReportToPdf({
      title: "АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)",
      brand: metadata?.brand || "Компания",
      branch: metadata?.branch || "Филиал №3",
      city: metadata?.city || "Кишинев",
      date: metadata?.date || new Date().toLocaleDateString("ru-RU"),
      time: metadata?.time || "14:30",
      checkType: metadata?.checkType || "1. Контрольная закупка",
      employeeCode: metadata?.employeeCode || "Консультант",
      inspector: metadata?.inspector || "Инспектор ОКК",
      reportContent: reportContent,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Toolbar Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
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
                Предпросмотр финального акта ОКК без скачивания на ПК
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Распечатать или сохранить в PDF"
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
              title="Закрыть окно просмотра"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable PDF Document Body (Paper Sheet Style) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center scrollbar-thin">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-xl p-8 shadow-2xl space-y-6 font-sans text-xs leading-relaxed border border-slate-200">
            {/* PDF Paper Header Banner */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  ОТДЕЛ КОНТРОЛЯ КАЧЕСТВАОБСЛУЖИВАНИЯ (ОКК)
                </div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ V-3.5
                </h1>
              </div>
              <div className="text-right space-y-1">
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg inline-block">
                  BPV INDEX: {metadata?.bpvScore ?? 92}%
                </div>
                <div className="text-[10px] text-slate-500">
                  Дата: {metadata?.date || new Date().toLocaleDateString("ru-RU")}
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="pdf-markdown-body text-slate-900 space-y-4">
              <Markdown rehypePlugins={[rehypeRaw]}>{reportContent}</Markdown>
            </div>

            {/* Footer Signatures */}
            <div className="pt-8 mt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] text-slate-700">
              <div className="space-y-2">
                <p className="font-bold text-slate-900">Инспектор ОКК (Аудитор):</p>
                <div className="border-b border-slate-400 pb-1 italic font-medium">
                  {metadata?.inspector || "Инспектор ОКК"}
                </div>
                <p className="text-[10px] text-slate-400">Подпись / Подтверждено в ЭС</p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-900">Руководитель филиала / Группы:</p>
                <div className="border-b border-slate-400 pb-1 italic font-medium">
                  Согласовано
                </div>
                <p className="text-[10px] text-slate-400">Статус: На согласовании</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
