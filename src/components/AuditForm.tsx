import React, { useState } from "react";
import { AuditFormData, PresetAuditSample } from "../types";
import { AUDIT_PRESETS } from "../data/auditPresets";
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
  onAnalyze: () => void;
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
  onAnalyze,
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
      {/* Top Banner: Load Demo Presets */}
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
                Выберите шаблон
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Нажмите на один из шаблонов ниже для загрузки примера визита
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

      {/* Grid: Audit Metadata Form Fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>1. Метаданные проверки</span>
          </h3>
          <span className="text-xs text-slate-400">Параметры карточки контрольной закупки</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Тип проверки */}
          <div className="bg-yellow-500/10 p-2.5 rounded-xl border-2 border-yellow-500/70 shadow-sm shadow-yellow-500/10">
            <label className="text-xs text-yellow-300 font-bold mb-1 flex items-center justify-between">
              <span>Тип проверки (Шаблон) *</span>
              <span className="text-[10px] bg-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded shadow-sm">
                Выбор шаблона
              </span>
            </label>
            <select
              name="checkType"
              value={auditData.checkType}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border-2 border-yellow-400 text-yellow-200 font-bold focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 rounded-lg px-3 py-1.5 text-xs focus:outline-none shadow-sm"
            >
              <option value="1. Контрольная закупка">
                1. Контрольная закупка (Шаблон с покупкой)
              </option>
              <option value="2. Mystery shopper (без покупки)">
                2. Mystery shopper (Шаблон без покупки)
              </option>
            </select>
          </div>

          {/* Дата */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Дата проверки</label>
            <input
              type="date"
              name="date"
              value={auditData.date}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                placeholder="ТехноМир Pro"
              />
            </div>
          </div>

          {/* Филиал */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Филиал / ТЦ</label>
            <input
              type="text"
              name="branch"
              value={auditData.branch}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              placeholder="ТЦ Центральный, 1 этаж"
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                placeholder="Москва"
              />
            </div>
          </div>

          {/* Сотрудник (обязательное ручное поле) */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/30">
            <label className="text-xs font-semibold text-amber-300 mb-1 flex items-center justify-between">
              <span>Сотрудник (Фамилия Имя) *</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-normal">Ручной ввод</span>
            </label>
            <div className="relative">
              <UserCheck className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="employeeCode"
                required
                value={auditData.employeeCode}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none font-medium"
                placeholder="Иванов Алексей Михайлович"
              />
            </div>
          </div>

          {/* Проверяющий (обязательное ручное поле) */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/30">
            <label className="text-xs font-semibold text-amber-300 mb-1 flex items-center justify-between">
              <span>Проверяющий / Аудитор *</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-normal">Ручной ввод</span>
            </label>
            <div className="relative">
              <UserCheck className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="inspector"
                required
                value={auditData.inspector}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none font-medium"
                placeholder="Кузнецова Елена Сергеевна"
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                placeholder="Смартфоны и гаджеты"
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                placeholder="Консультация и закупка"
              />
            </div>
          </div>

          {/* Результат визита */}
          <div className="md:col-span-2">
            <label className="text-xs text-slate-400 font-medium mb-1 block">Результат визита</label>
            <div className="relative">
              <CheckCircle className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                name="result"
                value={auditData.result}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                placeholder="Покупка аксессуара / Оформление рассрочки"
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
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              placeholder="Введите особенности обстановки в зале, внешние условия..."
            />
          </div>
        </div>
      </div>

      {/* Standards Checklist */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-400" />
          <span>2. Стандарты и Чек-лист оценки проекта</span>
        </label>
        <textarea
          name="standards"
          value={auditData.standards}
          onChange={handleInputChange}
          rows={3}
          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none font-mono resize-y"
          placeholder="Перечислите пункты стандарта..."
        />
      </div>

      {/* Dialog Source: Audio Upload or Transcript Text */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>3. Диалог проверки (Аудиозапись или Стенограмма)</span>
          </h3>
        </div>

        {/* Upload Audio File Option */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/5 flex flex-col justify-between shadow-lg shadow-amber-500/5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    Загрузить Аудиозапись (MP3, WAV, M4A)
                  </span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-500/30">
                  Ручная загрузка
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Загрузите оригинальный аудиофайл с диктофона или записи визита
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-sm transition-all">
                <Upload className="w-3.5 h-3.5 text-amber-300" />
                <span>{audioFileName ? audioFileName : "Выбрать аудиофайл (MP3/WAV)"}</span>
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
                  className="text-[11px] text-red-400 hover:underline px-2 py-1 bg-red-950/40 rounded border border-red-800/40"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {/* Transcript Text Input */}
          <div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              placeholder="Или вставьте расшифровку диалога с таймкодами:&#10;[00:02] Клиент: Здравствуйте...&#10;[00:05] Консультант: Добрый день..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none font-mono resize-y"
            />
          </div>
        </div>
      </div>

      {/* Execute Analysis Action Button */}
      <div className="pt-2 flex justify-end">
        <button
          id="run-audit-analysis-btn"
          onClick={onAnalyze}
          disabled={isAnalyzing || (!transcript.trim() && !audioBase64)}
          className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
            isAnalyzing || (!transcript.trim() && !audioBase64)
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Проводится проверка ИИ-Агентом...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Запустить Полный Анализ Проверки</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
