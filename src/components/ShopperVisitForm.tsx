import React, { useState, useRef } from "react";
import { UserAccount, AuditRecord, AppNotification } from "../types";
import { ExactTimePicker } from "./ExactTimePicker";
import { loadDictionaries } from "../utils/dictionaryStore";
import {
  ShoppingBag,
  Clock,
  Calendar,
  MapPin,
  Building2,
  UserCheck,
  Sparkles,
  Shirt,
  Star,
  Store,
  Users,
  MessageSquare,
  Upload,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Play,
  Trash2,
  Send,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Info,
  ChevronRight,
  RefreshCw,
  Layers,
  Edit3,
  X,
} from "lucide-react";

interface ShopperVisitFormProps {
  currentUser: UserAccount;
  onSubmitVisit: (record: Omit<AuditRecord, "id"> & { id?: string }) => void;
  onGoToRegistry?: () => void;
  users?: UserAccount[];
  editingRecord?: AuditRecord | null;
  onCancelEdit?: () => void;
}

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

const DATE_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const iso = d.toISOString().split("T")[0];
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  let label = `${day}.${month}.${year}`;
  if (i === 0) label += " (Сегодня)";
  else if (i === 1) label += " (Вчера)";
  return { value: iso, label };
});

export const ShopperVisitForm: React.FC<ShopperVisitFormProps> = ({
  currentUser,
  onSubmitVisit,
  onGoToRegistry,
  users,
  editingRecord,
  onCancelEdit,
}) => {
  const [dictionaries, setDictionaries] = useState(loadDictionaries);
  React.useEffect(() => {
    const refresh = () => setDictionaries(loadDictionaries());
    window.addEventListener("okk-dictionaries-updated", refresh);
    return () => window.removeEventListener("okk-dictionaries-updated", refresh);
  }, []);

  // 1. Basic Visit Info
  const [shopperName, setShopperName] = useState(currentUser?.name || "Тайный Покупатель");
  const [checkType, setCheckType] = useState<string>("2. Mystery shopper (без покупки)");
  const [visitDate, setVisitDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [auditMonth, setAuditMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [startTime, setStartTime] = useState<string>("14:00");
  const [endTime, setEndTime] = useState<string>("14:30");

  // 2. Location & Consultant & Passport Metadata
  const [network, setNetwork] = useState<string>(dictionaries.brands[0] || "");
  const [city, setCity] = useState<string>(dictionaries.cities[0] || "");
  const [branch, setBranch] = useState<string>("Центр (бул. Штефан чел Маре)");
  const [consultantName, setConsultantName] = useState<string>("");
  const [region, setRegion] = useState<string>("Регион Центр");
  const [category, setCategory] = useState<string>("Смартфоны и портативная техника");
  const [target, setTarget] = useState<string>("Консультация по покупке смартфона и сервисных услуг");

  // 3. Audio State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | undefined>(undefined);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);

  // 3. Consultant Appearance
  const [uniformStatus, setUniformStatus] = useState<"standard" | "partial" | "violation">(
    "standard"
  );
  const [neatnessStatus, setNeatnessStatus] = useState<"neat" | "minor_remarks" | "unneat">(
    "neat"
  );
  const [badgeStatus, setBadgeStatus] = useState<"present" | "missing" | "reversed">(
    "present"
  );
  const [appearanceComment, setAppearanceComment] = useState<string>("");

  // 4. Store Rating (1-5 stars & criteria)
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [merchandisingRating, setMerchandisingRating] = useState<number>(5);
  const [assortmentRating, setAssortmentRating] = useState<number>(5);
  const [storeComment, setStoreComment] = useState<string>("");

  // 5. Hall Positioning & Staff Behavior
  const [staffAvailability, setStaffAvailability] = useState<"immediate" | "had_to_search" | "absent">(
    "immediate"
  );
  const [noGroupingStatus, setNoGroupingStatus] = useState<"dispersed" | "grouped" | "smartphones">(
    "dispersed"
  );
  const [hallCleanlinessStatus, setHallCleanlinessStatus] = useState<"clean" | "minor_issues" | "messy">(
    "clean"
  );
  const [hallComment, setHallComment] = useState<string>("");

  // 6. Shopper Comments (Required text fields)
  const [whatLiked, setWhatLiked] = useState<string>("");
  const [whatDisliked, setWhatDisliked] = useState<string>("");
  const [fiscalCheckIssued, setFiscalCheckIssued] = useState<"Да" | "Нет">("Да");
  const [cashDisciplineObserved, setCashDisciplineObserved] = useState<"Да" | "Нет">("Да");
  const [cashComment, setCashComment] = useState("");

  // 7. Audio Upload Reference
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Form Validation & Success State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedRecordId, setSubmittedRecordId] = useState<string | null>(null);

  // Load existing record for editing if provided
  React.useEffect(() => {
    if (editingRecord) {
      setShopperName(editingRecord.inspector || currentUser?.name || "Тайный Покупатель");
      setVisitDate(editingRecord.date || new Date().toISOString().split("T")[0]);
      setAuditMonth(editingRecord.month || (editingRecord.date || new Date().toISOString()).slice(0, 7));
      setStartTime(editingRecord.startTime || "14:00");
      setEndTime(editingRecord.endTime || "14:30");
      setNetwork(editingRecord.brand || dictionaries.brands[0] || "");
      setCity(editingRecord.city || "Кишинёв");
      setBranch(editingRecord.branch || "");
      setConsultantName(editingRecord.employeeCode || "");
      setRegion(editingRecord.region || editingRecord.group || "Регион Центр");
      setCategory(editingRecord.category || "Смартфоны и портативная техника");
      setTarget(editingRecord.target || "Консультация по покупке смартфона и сервисных услуг");
      
      if (editingRecord.comment) {
        const parts = editingRecord.comment.split("Что не понравилось:");
        if (parts.length >= 2) {
          setWhatLiked(parts[0].replace("Что понравилось:", "").trim());
          setWhatDisliked(parts[1].trim());
        } else {
          setWhatLiked(editingRecord.comment);
        }
      }
      
      if (editingRecord.audioFileName) {
        setAudioFileName(editingRecord.audioFileName);
      }
      if (editingRecord.audioUrl) {
        setAudioUrl(editingRecord.audioUrl);
      }
      if (editingRecord.cashData) {
        setFiscalCheckIssued(editingRecord.cashData.fiscalCheckIssued);
        setCashDisciplineObserved(editingRecord.cashData.cashDisciplineObserved);
        setCashComment(editingRecord.cashData.comment || "");
      }
    }
  }, [editingRecord, currentUser, dictionaries.brands]);

  // Handle Audio Upload
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/") && !file.name.match(/\.(mp3|wav|m4a|aac|ogg|flac|m4b)$/i)) {
        alert("Пожалуйста, выберите корректный аудиофайл (MP3, WAV, M4A, OGG).");
        return;
      }
      setAudioFile(file);
      setAudioFileName(file.name);
      setAudioMimeType(file.type || "audio/m4a");

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAudioData(result);
        setAudioUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioUrl(null);
    setAudioData(null);
    setAudioMimeType(undefined);
    setAudioFileName(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!shopperName.trim()) errors.push("Укажите ФИО шоппера");
    if (!consultantName.trim()) errors.push("Укажите имя консультанта");
    if (!branch.trim()) errors.push("Укажите номер или название филиала");
    if (!city.trim()) errors.push("Укажите город");
    if (!auditMonth.trim()) errors.push("Укажите месяц проверки");

    if (!whatLiked.trim()) errors.push("Заполните поле: Что понравилось в визите");
    if (!whatDisliked.trim()) errors.push("Заполните поле: Что не понравилось в визите");

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors([]);

    // Generate comprehensive report summary
    const fullReportText = `
=== ОПИСАНИЕ ВИЗИТА ТАЙНОГО ПОКУПАТЕЛЯ ===
• Шоппер: ${shopperName}
• Дата и время визита: ${visitDate} (${startTime} - ${endTime})
• Сеть: ${network} | Город: ${city} | Филиал: ${branch}
• Консультант: ${consultantName}

1. ВНЕШНИЙ ВИД КОНСУЛЬТАНТА:
- Униформа: ${uniformStatus === "standard" ? "Соответствует стандарту" : uniformStatus === "partial" ? "Частичные нарушения" : "Не соответствует / отсутствует"}
- Опрятность: ${neatnessStatus === "neat" ? "Опрятный" : neatnessStatus === "minor_remarks" ? "Есть замечания" : "Неопрятный"}
- Бейдж: ${badgeStatus === "present" ? "На месте и читаем" : badgeStatus === "missing" ? "Отсутствует" : "Перевернут/нечитаем"}
${appearanceComment ? `- Замечания по внешнему виду: ${appearanceComment}` : ""}

2. ОЦЕНКА МАГАЗИНА:
- Чистота и витрины: ${cleanlinessRating} / 5
- Выкладка товара: ${merchandisingRating} / 5
- Ассортимент товара: ${assortmentRating} / 5
${storeComment ? `- Комментарий по магазину: ${storeComment}` : ""}

3. ПОЗИЦИОНИРОВАНИЕ В ЗАЛЕ:
- Доступность сотрудников: ${staffAvailability === "immediate" ? "Сразу доступны" : staffAvailability === "had_to_search" ? "Пришлось искать" : "Никого не было"}
- Отсутствие кучкования: ${noGroupingStatus === "dispersed" ? "Рассредоточены" : noGroupingStatus === "grouped" ? "Замечено кучкование" : "Замечены личные смартфоны"}
- Порядок в зале: ${hallCleanlinessStatus === "clean" ? "чисто, отсутствует пыль и лишние предметы" : hallCleanlinessStatus === "minor_issues" ? "Есть небольшие замечания к чистоте" : "Грязно, пыль, лишние предметы в зале"}
${hallComment ? `- Комментарий по залу: ${hallComment}` : ""}

4. МНЕНИЕ И ВПЕЧАТЛЕНИЯ ШОППЕРА:
👍 ЧТО ПОНРАВИЛОСЬ:
${whatLiked}

👎 ЧТО НЕ ПОНРАВИЛОСЬ:
${whatDisliked}

${audioFileName ? `🎙 Прикрепленный аудиофайл записи: ${audioFileName}` : "🎙 Аудиозапись не прикреплена."}
`.trim();

    const recordId = editingRecord?.id || `AUD-${Date.now().toString().slice(-4)}`;

    const recordPayload: Omit<AuditRecord, "id"> & { id?: string } = {
      ...(editingRecord?.id ? { id: editingRecord.id } : {}),
      date: visitDate,
      month: auditMonth,
      startTime,
      endTime,
      brand: network,
      city,
      branch,
      group: region || "Регион Центр",
      region: region || "Регион Центр",
      category: category || "Смартфоны и портативная техника",
      target: target || "Консультация по покупке смартфона и сервисных услуг",
      result: "Анкета шоппера отправлена на проверку аудитору",
      comment: `Что понравилось: ${whatLiked}. Что не понравилось: ${whatDisliked}`,
      checkType: checkType || "2. Mystery shopper (без покупки)",
      employeeCode: consultantName,
      inspector: shopperName,
      shopperName: shopperName,
      shopperId: currentUser?.id,
      bpvScore: 0,
      speechScore: 0,
      salesDriveScore: 0,
      stopFactors: 0,
      reportSummary: `Визит Тайного Покупателя (${shopperName}). Консультант: ${consultantName}. Ожидает проверки аудитора.`,
      shopperSubmissionText: fullReportText,
      fullReportText,
      audioFileName: audioFileName || undefined,
      audioUrl: audioData || audioUrl || undefined,
      audioData: audioData || undefined,
      audioMimeType: audioMimeType || undefined,
      cashData:
        checkType === "1. Контрольная закупка"
          ? {
              fiscalCheckIssued,
              cashDisciplineObserved,
              comment: cashComment,
              source: "shopper_manual",
            }
          : undefined,
      shopperData: {
        shopperName,
        visitDate,
        auditMonth,
        startTime,
        endTime,
        network,
        city,
        branch,
        consultantName,
        uniformStatus,
        neatnessStatus,
        badgeStatus,
        appearanceComment,
        cleanlinessRating,
        merchandisingRating,
        assortmentRating,
        storeComment,
        staffAvailability,
        noGroupingStatus,
        hallCleanlinessStatus,
        hallComment,
        whatLiked,
        whatDisliked,
        audioFileName: audioFileName || undefined,
        audioUrl: audioData || audioUrl || undefined,
        cashData:
          checkType === "1. Контрольная закупка"
            ? {
                fiscalCheckIssued,
                cashDisciplineObserved,
                comment: cashComment,
                source: "shopper_manual",
              }
            : undefined,
      },
      approvalStatus: editingRecord?.approvalStatus || "SHOPPER_SUBMITTED",
      managerComment: editingRecord?.managerComment,
    };

    onSubmitVisit(recordPayload);
    setSubmittedRecordId(recordId);
    setIsSubmitted(true);
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setSubmittedRecordId(null);
    setConsultantName("");
    setAppearanceComment("");
    setStoreComment("");
    setHallComment("");
    setWhatLiked("");
    setWhatDisliked("");
    handleRemoveAudio();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Shopper Workspace Top Quick Navigation Switcher */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 px-2">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Рабочее пространство Шоппера
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              if (editingRecord && onCancelEdit) onCancelEdit();
              handleResetForm();
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !editingRecord
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-300" />
            <span>Заполнить проверку</span>
          </button>

          {onGoToRegistry && (
            <button
              type="button"
              onClick={onGoToRegistry}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Зайти в реестр</span>
            </button>
          )}
        </div>
      </div>

      {/* Editing Record Banner if in edit mode */}
      {editingRecord && (
        <div className="bg-amber-950/40 border-2 border-amber-500/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-extrabold text-white text-sm">
                Редактирование проверки: <span className="font-mono text-amber-300">{editingRecord.id}</span>
              </div>
              <div className="text-slate-300 text-[11px] mt-0.5">
                Вы можете изменить анкетные данные и прикрепить новый аудиофайл (доступно до обработки аудитором).
              </div>
            </div>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-700 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>Отменить редактирование</span>
            </button>
          )}
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShoppingBag className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Анкета Mystery shopper
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Mystery Shopper
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Заполните обязательные критерии визита, оцените работу консультанта и прикрепите аудиозапись диалога.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2 shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Шоппер: <strong className="text-white">{shopperName}</strong></span>
          </div>
        </div>
      </div>

      {/* Validation Warning Popup */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500 text-red-200 text-xs space-y-2 animate-shake shadow-xl">
          <div className="flex items-center gap-2 font-bold text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Пожалуйста, заполните обязательные поля перед отправкой:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-2 text-slate-200 font-medium">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Submission Success View */}
      {isSubmitted ? (
        <div className="p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/60 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl font-extrabold text-white">
              Отчет визита успешно сохранен и передан в ОКК!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Визит зарегистрирован в единой системе под кодом{" "}
              <strong className="text-emerald-300 font-mono">{submittedRecordId}</strong>.
              Уведомление отправлено руководителю отдела контроля качества.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Заполнить еще один визит</span>
            </button>

            {onGoToRegistry && (
              <button
                type="button"
                onClick={onGoToRegistry}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Перейти в Реестр проверок</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* FORM INPUT SECTIONS */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Passport & Location Info */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                1. Паспорт визита и данные локации
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Тип проверки <span className="text-red-400">*</span>
                </label>
                <select
                  value={checkType}
                  onChange={(e) => setCheckType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-bold focus:outline-none transition-all cursor-pointer"
                >
                  <option value="1. Контрольная закупка">1. Контрольная закупка</option>
                  <option value="2. Mystery shopper (без покупки)">2. Mystery shopper (без покупки)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ФИО шоппера <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shopperName}
                  onChange={(e) => setShopperName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Дата визита <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer scheme-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Месяц проверки <span className="text-red-400">*</span>
                </label>
                <input
                  type="month"
                  required
                  value={auditMonth}
                  onChange={(e) => setAuditMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer scheme-dark"
                />
              </div>

              <div>
                <ExactTimePicker
                  label="Время начала"
                  value={startTime}
                  onChange={setStartTime}
                  required
                />
              </div>

              <div>
                <ExactTimePicker
                  label="Время окончания"
                  value={endTime}
                  onChange={setEndTime}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Сеть / Бренд <span className="text-red-400">*</span>
                </label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                >
                  {dictionaries.brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Город <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer"
                >
                  {dictionaries.cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Номер / адрес филиала <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Филиал №1 (ЦУМ)"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Имя консультанта <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ФИО или Имя с бейджа"
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Регион / Группа
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                  placeholder="Регион"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Категория товара
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                  placeholder="Категория товара"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Цель визита
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                  placeholder="Цель визита"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Consultant Appearance */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Shirt className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                2. Внешний вид консультанта
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Униформа (соблюдение дресс-кода)
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "standard", label: "Соответствует стандарту" },
                    { id: "partial", label: "Есть частичные нарушения" },
                    { id: "violation", label: "Униформа отсутствует / грубое нарушение" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        uniformStatus === opt.id
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="uniform"
                        checked={uniformStatus === opt.id}
                        onChange={() => setUniformStatus(opt.id as any)}
                        className="accent-emerald-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Опрятность сотрудника
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "neat", label: "Опрятный аккуратный вид" },
                    { id: "minor_remarks", label: "Незначительные замечания" },
                    { id: "unneat", label: "Неопрятный вид" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        neatnessStatus === opt.id
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="neatness"
                        checked={neatnessStatus === opt.id}
                        onChange={() => setNeatnessStatus(opt.id as any)}
                        className="accent-emerald-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Бейдж (наличие и читаемость)
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "present", label: "Бейдж на месте и легко читаем" },
                    { id: "reversed", label: "Бейдж перевернут / нечитаем" },
                    { id: "missing", label: "Бейдж отсутствует" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        badgeStatus === opt.id
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="badge"
                        checked={badgeStatus === opt.id}
                        onChange={() => setBadgeStatus(opt.id as any)}
                        className="accent-emerald-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Замечания или комментарий по внешнему виду
              </label>
              <input
                type="text"
                placeholder="Например: футболка мятая, бейдж отсутствует"
                value={appearanceComment}
                onChange={(e) => setAppearanceComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Section 3: Store Criteria Rating */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Store className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                3. Оценка магазина
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Cleanliness rating */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="block text-xs font-bold text-slate-300">
                  Чистота помещения и витрин
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCleanlinessRating(star)}
                      className={`p-1 rounded-lg transition-transform hover:scale-125 cursor-pointer ${
                        star <= cleanlinessRating ? "text-amber-400" : "text-slate-700"
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-emerald-400 ml-2 font-mono">
                    {cleanlinessRating}/5
                  </span>
                </div>
              </div>

              {/* Merchandising rating */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="block text-xs font-bold text-slate-300">
                  Выкладка товара и ценники
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMerchandisingRating(star)}
                      className={`p-1 rounded-lg transition-transform hover:scale-125 cursor-pointer ${
                        star <= merchandisingRating ? "text-amber-400" : "text-slate-700"
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-emerald-400 ml-2 font-mono">
                    {merchandisingRating}/5
                  </span>
                </div>
              </div>

              {/* Assortment rating */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="block text-xs font-bold text-slate-300">
                  Ассортимент товара
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAssortmentRating(star)}
                      className={`p-1 rounded-lg transition-transform hover:scale-125 cursor-pointer ${
                        star <= assortmentRating ? "text-amber-400" : "text-slate-700"
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-emerald-400 ml-2 font-mono">
                    {assortmentRating}/5
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Комментарий к оценкам магазина
              </label>
              <textarea
                rows={2}
                placeholder="Укажите замечания по ценникам, подсветке витрин или чистоте пола..."
                value={storeComment}
                onChange={(e) => setStoreComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Section 4: Hall Positioning */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                4. Позиционирование персонала в торговом зале
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Доступность сотрудников
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "immediate", label: "Сотрудники сразу доступны и приветливы" },
                    { id: "had_to_search", label: "Пришлось искать консультанта по залу" },
                    { id: "absent", label: "В зале никого не было длительное время" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        staffAvailability === opt.id
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="availability"
                        checked={staffAvailability === opt.id}
                        onChange={() => setStaffAvailability(opt.id as any)}
                        className="accent-emerald-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Отсутствие «кучкования»
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "dispersed", label: "Сотрудники равномерно в зале" },
                    { id: "grouped", label: "Замечено кучкование / личные разговоры" },
                    { id: "smartphones", label: "Сотрудники отвлечены на смартфоны" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        noGroupingStatus === opt.id
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="grouping"
                        checked={noGroupingStatus === opt.id}
                        onChange={() => setNoGroupingStatus(opt.id as any)}
                        className="accent-emerald-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Чистота и порядок в зале
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "clean", label: "чисто, отсутствует пыль и лишние предметы" },
                    { id: "minor_issues", label: "Есть небольшие замечания к чистоте" },
                    { id: "messy", label: "Грязно, пыль, лишние предметы в зале" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        hallCleanlinessStatus === opt.id
                          ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="hallCleanliness"
                        checked={hallCleanlinessStatus === opt.id}
                        onChange={() => setHallCleanlinessStatus(opt.id as any)}
                        className="accent-emerald-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Комментарий по работе в зале
              </label>
              <input
                type="text"
                placeholder="Опишите поведение консультантов при входе покупателя..."
                value={hallComment}
                onChange={(e) => setHallComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {checkType === "1. Контрольная закупка" && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">
                  5. Кассовая дисциплина — данные шоппера
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Эти сведения вводятся вручную. ИИ не определяет выдачу чека по аудиозаписи.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-xs text-slate-300">
                  Выдан фискальный чек
                  <select value={fiscalCheckIssued} onChange={(e) => setFiscalCheckIssued(e.target.value as "Да" | "Нет")} className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white">
                    <option value="Да">Да</option><option value="Нет">Нет</option>
                  </select>
                </label>
                <label className="text-xs text-slate-300">
                  Кассовая дисциплина соблюдена
                  <select value={cashDisciplineObserved} onChange={(e) => setCashDisciplineObserved(e.target.value as "Да" | "Нет")} className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white">
                    <option value="Да">Да</option><option value="Нет">Нет</option>
                  </select>
                </label>
              </div>
              <textarea value={cashComment} onChange={(e) => setCashComment(e.target.value)} rows={2} placeholder="Комментарий по кассовой операции, если необходим" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" />
            </div>
          )}

          {/* Section 5: Shopper Required Comments */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                5. Комментарий шоппера (обязательные текстовые впечатления)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  <span>Что понравилось <span className="text-red-400">*</span></span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Опишите положительные стороны: приветливость, грамотную презентацию, активное предложение сопутствующих товаров..."
                  value={whatLiked}
                  onChange={(e) => setWhatLiked(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-red-300 mb-1.5 flex items-center gap-1.5">
                  <ThumbsDown className="w-4 h-4 text-red-400" />
                  <span>Что НЕ понравилось <span className="text-red-400">*</span></span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Укажите выявленные недостатки: неуверенные ответы, отсутствие выявления потребностей, слабую работу с возражениями..."
                  value={whatDisliked}
                  onChange={(e) => setWhatDisliked(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Audio Upload Section */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileAudio className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">
                  6. Загрузка аудиозаписи диалога
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Форматы: MP3, WAV, M4A, OGG</span>
            </div>

            <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all">
              {audioUrl ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Файл загружен: {audioFileName}</span>
                  </div>

                  <div className="max-w-md mx-auto">
                    <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleRemoveAudio}
                      className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Удалить и прикрепить другой файл</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      Выбрать аудиофайл диктофона
                    </button>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Нажмите кнопку для прикрепления аудиофайла записи разговора с консультантом.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Send className="w-5 h-5" />
              <span>Сохранить и отправить отчет Тайного Покупателя в ОКК</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
