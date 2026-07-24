import React from "react";
import { Sparkles, Wand2, ShieldCheck, Image as ImageIcon, FileSearch, CheckCircle2, BarChart3, Layers } from "lucide-react";

interface HeaderProps {
  hasApiKey: boolean;
  appMode: "mystery-shopper" | "photo-studio";
  setAppMode: (mode: "mystery-shopper" | "photo-studio") => void;
  auditSubView: "form" | "registry" | "dashboard";
  setAuditSubView: (view: "form" | "registry" | "dashboard") => void;
  activeTab: "edit" | "presets" | "history";
  setActiveTab: (tab: "edit" | "presets" | "history") => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  appMode,
  setAppMode,
  auditSubView,
  setAuditSubView,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header id="studio-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                ИИ-Агент Аудитор Контрольных Закупок
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Mystery Shopper AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Проверка стандартов, разделение реплик, оценка голоса, таймкоды и сводная таблица
            </p>
          </div>
        </div>

        {/* Mode Selector & Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {appMode === "mystery-shopper" && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="audit-subview-form-btn"
                onClick={() => setAuditSubView("form")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  auditSubView === "form"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Новая проверка</span>
              </button>

              <button
                id="audit-subview-registry-btn"
                onClick={() => setAuditSubView("registry")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  auditSubView === "registry"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Реестр проверок</span>
              </button>

              <button
                id="audit-subview-dashboard-btn"
                onClick={() => setAuditSubView("dashboard")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  auditSubView === "dashboard"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Дашборд ОКК</span>
              </button>
            </div>
          )}

          {/* Main App Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="mode-mystery-shopper-btn"
              onClick={() => setAppMode("mystery-shopper")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                appMode === "mystery-shopper"
                  ? "bg-slate-800 text-slate-100 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Аудит BPV</span>
            </button>

            <button
              id="mode-photo-studio-btn"
              onClick={() => setAppMode("photo-studio")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                appMode === "photo-studio"
                  ? "bg-slate-800 text-slate-100 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Обработка Фото</span>
            </button>
          </div>

          {/* API Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gemini AI Готов</span>
          </div>
        </div>
      </div>
    </header>
  );
};
