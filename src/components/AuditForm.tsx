import React, { useState, useEffect } from "react";
import { AuditFormData, PresetAuditSample, UserAccount, AuditRecord } from "../types";
import { AUDIT_PRESETS } from "../data/auditPresets";
import { loadDictionaries, saveDictionaries, Dictionaries } from "../utils/dictionaryStore";
import { getMonthNameFromDate, generateMonthOptions } from "../utils/monthUtils";
import { CardSkeleton } from "./SkeletonLoader";
import { AuditReportView } from "./AuditReportView";
import {
  FileText,
  Building2,
  MapPin,
  UserCheck,
  Tag,
  Target,
  CheckCircle,
  CheckCircle2,
  MessageSquare,
  ClipboardList,
  Upload,
  Mic,
  Sparkles,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Edit3,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  Plus,
  Globe,
  Send,
  FileAudio,
  Volume2,
} from "lucide-react";

interface AuditFormProps {
  auditData: AuditFormData;
  setAuditData: React.Dispatch<React.SetStateAction<AuditFormData>>;
  transcript: string;
  setTranscript: (text: string) => void;
  audioBase64: string | null;
  setAudioBase64: (data: string | null) => void;
  audioFileName: string | null;
  setAudioFileName: (name: string | null) => void;
  currentStep: 1 | 2 | 3 | 4;
  setCurrentStep: (step: 1 | 2 | 3 | 4) => void;
  onStartStep1To2: () => void;
  onGenerateStep3To4: () => void;
  onSubmitAndClose?: () => void;
  onResetWorkflow: () => void;
  isAnalyzing: boolean;
  currentUser?: UserAccount;
  users?: UserAccount[];
  auditReport?: string | null;
  setAuditReport?: (report: string | null) => void;
  originalReport?: string | null;
  auditRecords?: AuditRecord[];
  onLoadVisitRecord?: (record: AuditRecord) => void;
}

const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, "0");
  const m = ((i % 4) * 15).toString().padStart(2, "0");
  return `${h}:${m}`;
});

const CITY_OPTIONS = [
  "Кишинёв",
  "Бельцы",
  "Тирасполь",
  "Комрат",
  "Кагул",
  "Бишкек",
  "Ош",
  "Алматы",
  "Астана",
  "Москва",
  "Санкт-Петербург",
];

const formatTimeSlot = (val?: string) => {
  if (!val) return "10:00";
  const parts = val.trim().split(":");
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    return `${h}:${m}`;
  }
  return val;
};

const generateRecentDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    let label = iso;
    if (i === 0) label = `Сегодня (${iso})`;
    else if (i === 1) label = `Вчера (${iso})`;
    else if (i === 2) label = `Позавчера (${iso})`;
    dates.push({ value: iso, label });
  }
  return dates;
};

export const AuditForm: React.FC<AuditFormProps> = ({
  auditData,
  setAuditData,
  transcript,
  setTranscript,
  audioBase64,
  setAudioBase64,
  audioFileName,
  setAudioFileName,
  currentStep,
  setCurrentStep,
  onStartStep1To2,
  onGenerateStep3To4,
  onSubmitAndClose,
  onResetWorkflow,
  isAnalyzing,
  currentUser,
  users,
  auditReport,
  setAuditReport,
  originalReport,
  auditRecords = [],
  onLoadVisitRecord,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [dictionaries, setDictionaries] = useState<Dictionaries>(loadDictionaries);

  useEffect(() => {
    setDictionaries(loadDictionaries());
  }, []);

  // Auto-populate Shopper/Inspector name and Manager from system users
  useEffect(() => {
    if (currentUser?.name) {
      setAuditData((prev) => {
        const defaultManager =
          users?.find((u) => u.role === "manager" || u.role === "admin")?.name ||
          "Петров В.В.";
        
        let needsUpdate = false;
        const newInspector = prev.inspector || currentUser.name;
        const newManager = prev.manager || defaultManager;

        if (prev.inspector !== newInspector || prev.manager !== newManager) {
          needsUpdate = true;
        }

        if (needsUpdate) {
          return {
            ...prev,
            inspector: newInspector,
            manager: newManager,
          };
        }
        return prev;
      });
    }
  }, [currentUser, users]);

  const isAdmin = currentUser?.role === "admin";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAuditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBrand = () => {
    const name = prompt("Введите наименование нового бренда:");
    if (name && name.trim()) {
      const clean = name.trim();
      if (!dictionaries.brands.includes(clean)) {
        const updated = { ...dictionaries, brands: [...dictionaries.brands, clean] };
        saveDictionaries(updated);
        setDictionaries(updated);
        setAuditData((prev) => ({ ...prev, brand: clean }));
      }
    }
  };

  const handleAddCity = () => {
    const name = prompt("Введите название нового города:");
    if (name && name.trim()) {
      const clean = name.trim();
      if (!dictionaries.cities.includes(clean)) {
        const updated = { ...dictionaries, cities: [...dictionaries.cities, clean] };
        saveDictionaries(updated);
        setDictionaries(updated);
        setAuditData((prev) => ({ ...prev, city: clean }));
      }
    }
  };

  const handleAddRegion = () => {
    const name = prompt("Введите название нового региона:");
    if (name && name.trim()) {
      const clean = name.trim();
      if (!dictionaries.regions.includes(clean)) {
        const updated = { ...dictionaries, regions: [...dictionaries.regions, clean] };
        saveDictionaries(updated);
        setDictionaries(updated);
        setAuditData((prev) => ({ ...prev, region: clean }));
      }
    }
  };

  const handleLoadPreset = (preset: PresetAuditSample) => {
    setSelectedPresetId(preset.id);
    setAuditData(preset.auditData);
    setTranscript(preset.transcript);
    setAudioBase64(null);
    setAudioFileName(null);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAudioBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div id="audit-form-container" className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-6">
      {/* 4-Step Process Navigation Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>Пошаговое составление Акта оценки ОКК</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Следуйте 4 шагам для проведения ИИ-анализа визита и подгрузки результатов в Реестр проверок
            </p>
          </div>

          {currentStep > 1 && (
            <button
              onClick={onResetWorkflow}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Начать новую проверку</span>
            </button>
          )}
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Step 1 */}
          <button
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className={`p-3 rounded-xl border text-left transition-all ${
              currentStep === 1
                ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                : currentStep > 1
                ? "bg-slate-950 border-emerald-500/40 text-emerald-300 hover:bg-slate-800"
                : "bg-slate-950/60 border-slate-800/80 text-slate-500"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center border ${
                currentStep > 1 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-blue-500/20 text-blue-400 border-blue-500/40"
              }`}>
                {currentStep > 1 ? <Check className="w-3 h-3" /> : "1"}
              </span>
              <span className="text-xs font-bold">Шаг 1: Загрузка</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Аудио / Стенограмма</p>
          </button>

          {/* Step 2 */}
          <button
            disabled={currentStep < 2}
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            className={`p-3 rounded-xl border text-left transition-all ${
              currentStep === 2
                ? "bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30 animate-pulse"
                : currentStep > 2
                ? "bg-slate-950 border-emerald-500/40 text-emerald-300 hover:bg-slate-800"
                : "bg-slate-950/60 border-slate-800/80 text-slate-500 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center border ${
                currentStep > 2 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              }`}>
                {currentStep > 2 ? <Check className="w-3 h-3" /> : "2"}
              </span>
              <span className="text-xs font-bold">Шаг 2: ИИ-Анализ</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Распознавание и автозаполнение</p>
          </button>

          {/* Step 3 */}
          <button
            disabled={currentStep < 3}
            onClick={() => currentStep > 3 && setCurrentStep(3)}
            className={`p-3 rounded-xl border text-left transition-all ${
              currentStep === 3
                ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30"
                : currentStep > 3
                ? "bg-slate-950 border-emerald-500/40 text-emerald-300 hover:bg-slate-800"
                : "bg-slate-950/60 border-slate-800/80 text-slate-500 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-5 h-5 rounded-full font-bold text-xs flex items-center justify-center border ${
                currentStep > 3 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
              }`}>
                {currentStep > 3 ? <Check className="w-3 h-3" /> : "3"}
              </span>
              <span className="text-xs font-bold">Шаг 3: Корректировка</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Ручная проверка оператором</p>
          </button>

          {/* Step 4 */}
          <button
            disabled={currentStep < 4}
            onClick={() => currentStep === 4 && setCurrentStep(4)}
            className={`p-3 rounded-xl border text-left transition-all ${
              currentStep === 4
                ? "bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                : "bg-slate-950/60 border-slate-800/80 text-slate-500 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                4
              </span>
              <span className="text-xs font-bold">Шаг 4: Финальный Акт</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Отчёт & Подгрузка в реестр</p>
          </button>
        </div>
      </div>

      {/* STEP 1: OPERATOR UPLOADS AUDIO OR TEXT & STARTS ANALYSIS */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Incoming Mystery Shopper Visits for Autofill */}
          {(() => {
            const pendingVisits = auditRecords.filter(
              (r) =>
                r.checkType.toLowerCase().includes("mystery") ||
                r.checkType.toLowerCase().includes("тайный") ||
                r.approvalStatus === "PENDING_APPROVAL"
            );
            if (pendingVisits.length === 0) return null;

            return (
              <div className="bg-emerald-950/40 border-2 border-emerald-500/40 p-4 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-xs font-bold text-emerald-200">
                      📥 Поступили визиты от Тайных Покупателей ({pendingVisits.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Готовы к автозаполнению
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Выберите сохраненный отчет шоппера для быстрой подстановки всех метаданных, диалога и прикрепленной аудиозаписи:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {pendingVisits.slice(0, 6).map((visit) => (
                    <button
                      key={visit.id}
                      type="button"
                      onClick={() => onLoadVisitRecord && onLoadVisitRecord(visit)}
                      className="p-3 bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-left transition-all group cursor-pointer shadow-md"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                          {visit.id} • {visit.brand} ({visit.city})
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded">
                          {visit.bpvScore}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        Филиал: {visit.branch} • Консультант: {visit.employeeCode}
                      </p>
                      <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-slate-800/80 text-[10px]">
                        <span className="text-slate-400">Шоппер: {visit.inspector}</span>
                        <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                          <span>Автозаполнить</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Banner if Shopper Visit metadata is loaded */}
          {(auditData.inspector || auditData.brand || auditData.employeeCode) && (
            <div className="bg-emerald-900/30 border border-emerald-500/50 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-200">
                    Подгружены данные визита от Тайного Покупателя
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    Бренд: <strong className="text-white">{auditData.brand || "—"}</strong> | Филиал: <strong className="text-white">{auditData.branch || "—"}</strong> | Город: <strong className="text-white">{auditData.city || "—"}</strong> | Консультант: <strong className="text-white">{auditData.employeeCode || "—"}</strong> | Шоппер: <strong className="text-white">{auditData.inspector || "—"}</strong>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded-lg">
                Готово к анализу
              </span>
            </div>
          )}

          {/* Dialog Source: Audio Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-400" />
                <span>Загрузка аудиозаписи проверки</span>
              </h3>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/40 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    Загрузите аудиофайл контрольной закупки (MP3, WAV, M4A)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Загрузите аудиозапись с диктофона. ИИ автоматически распознает тип проверки, речь и стандарты BPV, а также автозаполнит все метаданные на Шаге 3.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-sm transition-all">
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>{audioFileName ? audioFileName : "Выбрать файл аудио..."}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </label>
                {audioFileName && (
                  <button
                    type="button"
                    onClick={() => {
                      setAudioBase64(null);
                      setAudioFileName(null);
                    }}
                    className="text-xs text-red-400 hover:underline px-2.5 py-2 bg-red-950/40 rounded-lg border border-red-800/40"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>

            {/* Audio Player if Audio file attached */}
            {audioBase64 && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-200">
                  <span className="font-bold flex items-center gap-2 text-amber-300">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Прослушивание записи: {audioFileName || "Запись визита"}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Аудио прикреплено и доступно для воспроизведения</span>
                </div>
                <audio controls src={audioBase64} className="w-full h-10 rounded-lg bg-slate-900 border border-slate-800" />
              </div>
            )}
          </div>

          {/* Action Button: Start Analysis (Step 1 -> Step 2) */}
          <div className="pt-2 flex justify-end">
            <button
              id="start-step1-btn"
              onClick={onStartStep1To2}
              disabled={isAnalyzing || (!audioBase64 && !transcript.trim())}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                isAnalyzing || (!audioBase64 && !transcript.trim())
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Шаг 1 из 4: Запустить ИИ-Анализ записи ➔</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI ANALYZING & AUTOMATIC FIELD FILLING */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="py-8 px-6 bg-slate-950/80 rounded-2xl border border-amber-500/30 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                <Sparkles className="w-7 h-7 animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shadow">
                2
              </div>
            </div>

            <div className="max-w-md space-y-1">
              <h3 className="text-sm font-bold text-white">
                Шаг 2 из 4: ИИ анализирует аудиозапись и извлекает поля...
              </h3>
              <p className="text-[11px] text-slate-300">
                Выполняется распознавание речи, определение бренда, филиала, ФИО сотрудника, проверяющего и первичная оценка соблюдения стандартов BPV.
              </p>
            </div>

            {/* Processing Status Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 w-full max-w-sm text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>1. Аудиозапись / стенограмма принята в обработку</span>
              </div>
              <div className="flex items-center gap-2 text-amber-300 animate-pulse">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
                <span>2. Извлечение метаданных визита и речевых маркеров...</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-800 shrink-0" />
                <span>3. Автозаполнение полей формы для Шага 3</span>
              </div>
            </div>
          </div>

          <CardSkeleton />
        </div>
      )}

      {/* STEP 3: OPERATOR REVIEWS & EDITS EXTRACTED METADATA */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Info Banner */}
          <div className="bg-indigo-950/30 border border-indigo-500/40 p-4 rounded-xl flex items-start gap-3">
            <Edit3 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-indigo-200 block">
                Шаг 3 из 4: Данные автоматически извлечены ИИ. Проверьте и внесите корректировки
              </span>
              <p className="text-slate-300">
                ИИ заполнил поля ниже на основе аудиозаписи. Вы можете отредактировать любое поле вручную (уточнить ФИО сотрудника, филиал, комментарий), прослушать аудио и нажать кнопку генерации финального отчёта.
              </p>
            </div>
          </div>

          {/* Audio Player for Auditor */}
          {audioBase64 && (
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-200">
                <span className="font-bold flex items-center gap-2 text-amber-300">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Прикрепленная аудиозапись: {audioFileName || "Запись визита"}</span>
                </span>
                <span className="text-[10px] text-slate-400">Прослушайте аудиозапись для сверки и ручной корректировки полей</span>
              </div>
              <audio controls src={audioBase64} className="w-full h-10 rounded-lg bg-slate-900 border border-slate-800" />
            </div>
          )}

          {/* Grid: 1. Passport & Location Form Fields (Exact Shopper Form Format with Full Edit Capability) */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">
                  1. Паспорт визита и данные локации
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 w-fit">
                <Edit3 className="w-3 h-3" />
                <span>Данные шоппера (доступны для редактирования аудитором)</span>
              </span>
            </div>

            {/* Row 1: Shopper Info & Time Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ФИО шоппера <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="inspector"
                  value={auditData.inspector}
                  onChange={handleInputChange}
                  placeholder="ФИО шоппера"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Дата визита <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  name="date"
                  value={auditData.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const computedMonth = getMonthNameFromDate(newDate);
                    setAuditData((prev) => ({
                      ...prev,
                      date: newDate,
                      month: computedMonth,
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer scheme-dark font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Время начала <span className="text-red-400">*</span></span>
                </label>
                <select
                  name="startTime"
                  value={formatTimeSlot(auditData.startTime || auditData.time)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAuditData((prev) => ({ ...prev, startTime: val, time: val }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-semibold"
                >
                  {auditData.startTime && !TIME_SLOTS.includes(formatTimeSlot(auditData.startTime)) && (
                    <option value={formatTimeSlot(auditData.startTime)} className="bg-slate-900 text-slate-100 font-medium">
                      {formatTimeSlot(auditData.startTime)}
                    </option>
                  )}
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot} className="bg-slate-900 text-slate-100 font-medium">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Время окончания <span className="text-red-400">*</span></span>
                </label>
                <select
                  name="endTime"
                  value={formatTimeSlot(auditData.endTime || "10:45")}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAuditData((prev) => ({ ...prev, endTime: val }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-semibold"
                >
                  {auditData.endTime && !TIME_SLOTS.includes(formatTimeSlot(auditData.endTime)) && (
                    <option value={formatTimeSlot(auditData.endTime)} className="bg-slate-900 text-slate-100 font-medium">
                      {formatTimeSlot(auditData.endTime)}
                    </option>
                  )}
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot} className="bg-slate-900 text-slate-100 font-medium">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Location, Brand & Consultant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Сеть / Бренд <span className="text-red-400">*</span>
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleAddBrand}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Добавить</span>
                    </button>
                  )}
                </div>
                <select
                  name="brand"
                  value={auditData.brand || dictionaries.brands[0]}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-medium"
                >
                  {dictionaries.brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  {auditData.brand && !dictionaries.brands.includes(auditData.brand) && (
                    <option value={auditData.brand}>{auditData.brand}</option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Город <span className="text-red-400">*</span>
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleAddCity}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Добавить</span>
                    </button>
                  )}
                </div>
                <select
                  name="city"
                  value={auditData.city || dictionaries.cities[0]}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-medium"
                >
                  {Array.from(new Set([...dictionaries.cities, ...CITY_OPTIONS])).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {auditData.city && !dictionaries.cities.includes(auditData.city) && !CITY_OPTIONS.includes(auditData.city) && (
                    <option value={auditData.city}>{auditData.city}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Номер / адрес филиала <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="branch"
                  value={auditData.branch}
                  onChange={handleInputChange}
                  placeholder="Например: Филиал №1 (ЦУМ)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Имя консультанта <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="employeeCode"
                  value={auditData.employeeCode}
                  onChange={handleInputChange}
                  placeholder="ФИО или Имя с бейджа"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Row 3: Additional Auditor Meta (Check Type, Region, Manager, Month) */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Дополнительные параметры Акта ОКК</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Формат / Тип проверки
                  </label>
                  <select
                    name="checkType"
                    value={auditData.checkType || "2. Mystery shopper (без покупки)"}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="1. Контрольная закупка">1. Контрольная закупка (с покупкой и кассой)</option>
                    <option value="2. Mystery shopper (без покупки)">2. Mystery shopper (консультация без покупки)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Месяц проведения
                  </label>
                  <select
                    name="month"
                    value={auditData.month || getMonthNameFromDate(auditData.date)}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                  >
                    {generateMonthOptions(2026).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    {generateMonthOptions(2025).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-400">Регион / Группа</label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleAddRegion}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Добавить</span>
                      </button>
                    )}
                  </div>
                  <select
                    name="region"
                    value={auditData.region || dictionaries.regions[0]}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                  >
                    {dictionaries.regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Руководитель</label>
                  <select
                    name="manager"
                    value={auditData.manager || ""}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="">— Выберите руководителя —</option>
                    {(users?.filter((u) => u.role === "manager") || []).map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} {m.position ? `(${m.position})` : ""}
                      </option>
                    ))}
                    {(users?.filter((u) => u.role === "admin") || []).map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} (Администратор)
                      </option>
                    ))}
                    {(!users || users.filter((u) => u.role === "manager" || u.role === "admin").length === 0) && (
                      <option value="Петров В.В.">Петров В.В. (Руководитель филиала)</option>
                    )}
                  </select>
                </div>

                {/* Категория товара */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Категория товара</label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      name="category"
                      value={auditData.category}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                      placeholder="Категория"
                    />
                  </div>
                </div>

                {/* Цель визита */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Цель визита</label>
                  <div className="relative">
                    <Target className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      name="target"
                      value={auditData.target}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                      placeholder="Цель"
                    />
                  </div>
                </div>

                {/* Результат визита */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Результат визита</label>
                  <div className="relative">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      name="result"
                      value={auditData.result}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                      placeholder="Результат"
                    />
                  </div>
                </div>

                {/* Дополнительный комментарий */}
                <div className="col-span-1 sm:col-span-2 md:col-span-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Дополнительный комментарий проверяющего</label>
                  <input
                    type="text"
                    name="comment"
                    value={auditData.comment}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    placeholder="Заметки проверяющего..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EDITABLE DETAILED EXPERT REPORT BLOCK (STEP 3) */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Подробный экспертный отчёт по результатам проверки (редактируемый фрагмент)</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Ниже представлен подробный экспертный отчёт по результатам проведения проверки методом «Контрольная закупка» (Mystery Shopper с покупкой) на основе аудиозаписи диалога.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("expert-report-textarea") as HTMLTextAreaElement;
                    if (textarea && auditReport && setAuditReport) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      if (start !== end) {
                        const selectedText = auditReport.substring(start, end);
                        const tagged = `<span style="color: #ef4444; font-weight: bold; background-color: rgba(239, 68, 68, 0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.3);">${selectedText} <small style="font-size: 10px; font-weight: normal; color: #f87171;">(внесено вручную проверяющим)</small></span>`;
                        const updated = auditReport.substring(0, start) + tagged + auditReport.substring(end);
                        setAuditReport(updated);
                      } else {
                        alert("Выделите мышью фрагмент текста в поле ниже, который необходимо пометить как ручную правку!");
                      }
                    }
                  }}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Отметить выделенный фрагмент текста красным цветом с пометкой (внесено вручную проверяющим)"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Выделить ручную правку (красный цвет)</span>
                </button>

                {originalReport && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Сбросить внесенные вручную правки в тексте отчёта к исходному варианту ИИ?")) {
                        setAuditReport?.(originalReport);
                      }
                    }}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-200/90 leading-relaxed space-y-1">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>💡 Корректировка отчёта проверяющим на Шаге 3:</span>
              </p>
              <p className="text-slate-300">
                Вы можете вручную внести любые изменения прямо в текст отчёта ниже (включая таблицу паспорта, комментарии, баллы). Все внесённые вами изменения будут учтены при формировании финального Акта и выделены <strong className="text-red-400 font-bold">красным цветом</strong> с пометкой <em className="text-red-300 font-semibold">(внесено вручную проверяющим)</em>.
              </p>
            </div>

            <div className="relative">
              <textarea
                id="expert-report-textarea"
                value={auditReport || ""}
                onChange={(e) => setAuditReport?.(e.target.value)}
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400/80 rounded-xl p-4 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400/20 shadow-inner"
                placeholder="Ниже представлен подробный экспертный отчёт по результатам проведения проверки методом «Контрольная закупка» (Mystery Shopper с покупкой) на основе аудиозаписи диалога.

1. ПАСПОРТ ПРОВЕРКИ И МЕТАДАННЫЕ ВИЗИТА
| Параметр | Значение |
|---|---|
| Дата и время проверки | 2026-07-27 |
| Формат проверки | 1. Контрольная закупка |
| Бренд компании | Orange Moldova |
| Филиал / Подразделение | 18 |
| Город / Локация | Оргеев (Кишинев) |..."
              />
            </div>
          </div>

          {/* Action Button: Generate Final Report (Step 3 -> Step 4) */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-3 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              ← Назад к Шагу 1
            </button>

            <button
              id="generate-step3-btn"
              onClick={onGenerateStep3To4}
              disabled={isAnalyzing}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                isAnalyzing
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Шаг 3 из 4: Сформировать и подгрузить отчёт в Реестр ➔</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: FINAL REPORT DISPLAY & AUTOMATIC REGISTRY SYNC */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Status Notification */}
          <div className="bg-emerald-950/50 border border-emerald-500/60 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-emerald-500/10">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-emerald-200 flex items-center gap-2">
                  <span>Шаг 4: Финальный Акт ОКК сформирован</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Готов к согласованию
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Проверьте итоговый отчет ниже. Все внесенные вручную комментарии и изменения выделены <span className="text-red-400 font-bold">красным цветом</span>. Для отправки руководителю и перехода к новой проверке нажмите кнопку ниже.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-300 hover:text-white px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Редактировать (Шаг 3)</span>
              </button>
            </div>
          </div>

          {/* Prominent Action Bar: "Закрыть и отправить на согласование" */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border-2 border-emerald-500/50 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Получатель отчёта:</span>
                  <strong className="text-emerald-300 font-bold">
                    {auditData.manager || "Петров В.В. (Руководитель)"}
                  </strong>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Завершение проверки и отправка на согласование
                </h4>
                <p className="text-xs text-slate-400">
                  По нажатию отчет отправляется руководителю, добавляется в реестр и закрывается, после чего генерируется чистое поле для новой проверки.
                </p>
              </div>

              <button
                id="submit-and-close-btn"
                type="button"
                onClick={() => {
                  if (onSubmitAndClose) {
                    onSubmitAndClose();
                  } else {
                    onGenerateStep3To4();
                    onResetWorkflow();
                  }
                }}
                className="w-full md:w-auto px-8 py-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40 shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5 text-emerald-100" />
                <span>Закрыть и отправить на согласование</span>
              </button>
            </div>
          </div>

          {/* Full Live Audit Report Preview */}
          <AuditReportView
            report={auditReport}
            isAnalyzing={false}
            auditData={auditData}
            onReset={onResetWorkflow}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  );
};
