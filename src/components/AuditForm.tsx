import React, { useState } from "react";
import { AuditFormData, PresetAuditSample } from "../types";
import { AUDIT_PRESETS } from "../data/auditPresets";
import { CardSkeleton } from "./SkeletonLoader";
import {
  FileText,
  Building2,
  MapPin,
  UserCheck,
  Tag,
  Target,
  CheckCircle,
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
  onResetWorkflow: () => void;
  isAnalyzing: boolean;
}

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
  onResetWorkflow,
  isAnalyzing,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAuditData((prev) => ({ ...prev, [name]: value }));
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
          {/* Preset Samples */}
          <div className="bg-amber-950/20 p-4 rounded-xl border-2 border-yellow-500/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md shadow-yellow-500/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-500/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-yellow-300">
                    Шаблоны готовых проверок (Mystery Shopper)
                  </h3>
                  <span className="text-[10px] bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    Быстрый выбор
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Нажмите на один из шаблонов для быстрой загрузки готового примера
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {AUDIT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  onClick={() => handleLoadPreset(preset)}
                  className={`text-xs px-3.5 py-2 rounded-xl border-2 font-bold whitespace-nowrap transition-all ${
                    selectedPresetId === preset.id
                      ? "bg-yellow-400 text-slate-950 border-yellow-300 shadow-lg shadow-yellow-500/40 ring-2 ring-yellow-400/50 scale-105"
                      : "bg-slate-950/90 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/20 hover:border-yellow-400"
                  }`}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Dialog Source: Audio Upload or Transcript Text */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Загрузка материалов проверки (Аудиозапись или Стенограмма)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Audio Option */}
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 flex flex-col justify-between shadow-lg shadow-amber-500/5 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">
                        1. Загрузить Аудиозапись (MP3, WAV, M4A)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    Загрузите аудиозапись контрольной закупки с диктофона. ИИ автоматически распознает речь и извлечет поля на Шаге 2.
                  </p>
                </div>

                <div className="flex items-center gap-2">
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
                      className="text-xs text-red-400 hover:underline px-2.5 py-1.5 bg-red-950/40 rounded-lg border border-red-800/40"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              </div>

              {/* Transcript Input Option */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>2. Или вставьте текстовую стенограмму визита:</span>
                  <span className="text-[10px] text-slate-400 font-normal">С таймкодами и спикерами</span>
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={5}
                  placeholder="[00:02] Покупатель: Здравствуйте! Можно посмотреть смартфоны?&#10;[00:05] Консультант: Добрый день! Конечно, подскажите, какие параметры вас интересуют..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none font-mono resize-y"
                />
              </div>
            </div>
          </div>

          {/* Action Button: Start Analysis (Step 1 -> Step 2) */}
          <div className="pt-2 flex justify-end">
            <button
              id="start-step1-btn"
              onClick={onStartStep1To2}
              disabled={isAnalyzing || (!transcript.trim() && !audioBase64)}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                isAnalyzing || (!transcript.trim() && !audioBase64)
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
                ИИ заполнил поля ниже на основе аудиозаписи. Вы можете отредактировать любое поле вручную (уточнить ФИО сотрудника, филиал, комментарий), а затем нажать кнопку генерации финального отчёта.
              </p>
            </div>
          </div>

          {/* Grid: Metadata Form Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Паспорт проверки (Метаданные карточки ОКК)</span>
              </h3>
              <span className="text-xs text-slate-400">Внесите правки при необходимости</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Дата проверки (ВЫДЕЛЕНО ЖЕЛТЫМ С ВЫПАДАЮЩИМ КАЛЕНДАРЕМ) */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border-2 border-amber-400/80 shadow-md shadow-amber-500/10">
                <label className="text-xs text-amber-300 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Дата проверки ★</span>
                  </span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-semibold">Календарь</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={auditData.date}
                  onChange={handleInputChange}
                  onClick={(e) => (e.currentTarget as any).showPicker?.()}
                  className="w-full bg-slate-950/90 border border-amber-400/60 focus:border-amber-300 rounded-lg px-3 py-2 text-xs text-amber-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer"
                />
              </div>

              {/* Время проверки (ВЫДЕЛЕНО ЖЕЛТЫМ С ВЫПАДАЮЩИМ ВЫБОРОМ ЧАСОВ И МИНУТ) */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border-2 border-amber-400/80 shadow-md shadow-amber-500/10">
                <label className="text-xs text-amber-300 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Время проверки (чч:мм) ★</span>
                  </span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-semibold">Часы : Минуты</span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={auditData.time || "14:30"}
                  onChange={handleInputChange}
                  onClick={(e) => (e.currentTarget as any).showPicker?.()}
                  className="w-full bg-slate-950/90 border border-amber-400/60 focus:border-amber-300 rounded-lg px-3 py-2 text-xs text-amber-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer"
                />
              </div>

              {/* Бренд */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Бренд / Компания</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="brand"
                    value={auditData.brand}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none font-semibold text-slate-200"
                    placeholder="Бренд компании"
                  />
                </div>
              </div>

              {/* Филиал */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Филиал / Адрес</label>
                <input
                  type="text"
                  name="branch"
                  value={auditData.branch}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-semibold text-slate-200"
                  placeholder="Филиал или адрес салона"
                />
              </div>

              {/* Город */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Город</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="city"
                    value={auditData.city}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none font-semibold text-slate-200"
                    placeholder="Город"
                  />
                </div>
              </div>

              {/* Сотрудник (ВЫДЕЛЕНО ЖЕЛТЫМ) */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border-2 border-amber-400/80 shadow-md shadow-amber-500/10">
                <label className="text-xs text-amber-300 font-bold mb-1 flex items-center justify-between">
                  <span>Сотрудник (ФИО / Код) ★</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-semibold">Редактируемое</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="employeeCode"
                    value={auditData.employeeCode}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/90 border border-amber-400/60 focus:border-amber-300 rounded-lg pl-9 pr-3 py-2 text-xs text-amber-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    placeholder="Укажите ФИО сотрудника"
                  />
                </div>
              </div>

              {/* Проверяющий (ВЫДЕЛЕНО ЖЕЛТЫМ) */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border-2 border-amber-400/80 shadow-md shadow-amber-500/10">
                <label className="text-xs text-amber-300 font-bold mb-1 flex items-center justify-between">
                  <span>Проверяющий / Аудитор ★</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-semibold">Редактируемое</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="inspector"
                    value={auditData.inspector}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/90 border border-amber-400/60 focus:border-amber-300 rounded-lg pl-9 pr-3 py-2 text-xs text-amber-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    placeholder="ФИО инспектора"
                  />
                </div>
              </div>

              {/* Категория товара */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Категория товара</label>
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
                <label className="text-xs text-slate-400 font-medium mb-1 block">Цель визита</label>
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
                <label className="text-xs text-slate-400 font-medium mb-1 block">Результат визита</label>
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
              <div className="md:col-span-3">
                <label className="text-xs text-slate-400 font-medium mb-1 block">Дополнительный комментарий проверяющего</label>
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
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-xl flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-200 flex items-center gap-2">
                  <span>Шаг 4: Финальный Акт ОКК успешно сформирован и подгружен в Реестр проверок!</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Данные зафиксированы для бренда <strong className="text-emerald-300">{auditData.brand || "Orange"}</strong> ({auditData.branch || "Филиал"}). Акт готов к просмотру и экспорту в PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-300 hover:text-white px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Изменить данные (Шаг 3)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
