import React, { useState, useRef } from "react";
import { UserAccount, AuditRecord, AppNotification } from "../types";
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

// Helper constants for selects
const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, "0");
  const m = ((i % 4) * 15).toString().padStart(2, "0");
  return `${h}:${m}`;
});

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

const CITY_OPTIONS = [
  "Кишинёв",
  "Бельцы",
  "Бендеры",
  "Тирасполь",
  "Кагул",
  "Комрат",
  "Орхей",
  "Унгены",
  "Сороки",
  "Дубоссары",
  "Чадыр-Лунга",
  "Единец",
  "Каушаны",
  "Хынчешты",
  "Фалешты",
  "Рышканы",
  "Дрокия",
  "Окница",
];

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
  const defaultManager =
    users?.find((u) => u.role === "manager" || u.role === "admin")?.name ||
    "Петров В.В.";

  // 1. Basic Visit Info
  const [shopperName, setShopperName] = useState(currentUser?.name || "Тайный Покупатель");
  const [visitDate, setVisitDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState<string>("14:00");
  const [endTime, setEndTime] = useState<string>("14:30");

  // 2. Location & Consultant & Passport Metadata
  const [network, setNetwork] = useState<string>("Orange");
  const [city, setCity] = useState<string>("Кишинёв");
  const [branch, setBranch] = useState<string>("Центр (бул. Штефан чел Маре)");
  const [consultantName, setConsultantName] = useState<string>("");
  const [region, setRegion] = useState<string>("Регион Центр");
  const [manager, setManager] = useState<string>(defaultManager);
  const [category, setCategory] = useState<string>("Смартфоны и портативная техника");
  const [target, setTarget] = useState<string>("Консультация по покупке смартфона и сервисных услуг");

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

  // 7. Audio Upload State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
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
      setStartTime(editingRecord.startTime || "14:00");
      setEndTime(editingRecord.endTime || "14:30");
      setNetwork(editingRecord.brand || "Orange");
      setCity(editingRecord.city || "Кишинёв");
      setBranch(editingRecord.branch || "");
      setConsultantName(editingRecord.employeeCode || "");
      setRegion(editingRecord.region || editingRecord.group || "Регион Центр");
      setManager(editingRecord.manager || defaultManager);
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
    }
  }, [editingRecord, currentUser, defaultManager]);

  // Handle Audio Upload
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        alert("Пожалуйста, выберите аудиофайл (MP3, WAV, M4A, OGG).");
        return;
      }
      setAudioFile(file);
      setAudioFileName(file.name);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioUrl(null);
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

    if (!whatLiked.trim()) errors.push("Заполните поле: Что понравилось в визите");
    if (!whatDisliked.trim()) errors.push("Заполните поле: Что не понравилось в визите");

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors([]);

    // Calculate aggregated score for BPV / Mystery Shopper (0-100)
    let score = 100;
    if (uniformStatus === "partial") score -= 10;
    if (uniformStatus === "violation") score -= 25;
    if (neatnessStatus === "minor_remarks") score -= 10;
    if (neatnessStatus === "unneat") score -= 20;
    if (badgeStatus !== "present") score -= 10;

    if (staffAvailability === "had_to_search") score -= 15;
    if (staffAvailability === "absent") score -= 30;
    if (noGroupingStatus !== "dispersed") score -= 15;
    if (hallCleanlinessStatus !== "clean") score -= 10;

    const avgStoreRating = Math.round(
      ((cleanlinessRating + merchandisingRating + assortmentRating) / 15) * 100
    );

    const finalBpvScore = Math.max(20, Math.round((score * 0.6) + (avgStoreRating * 0.4)));

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
      startTime,
      endTime,
      brand: network,
      city,
      branch,
      group: region || "Регион Центр",
      region: region || "Регион Центр",
      manager: manager || defaultManager,
      category: category || "Смартфоны и портативная техника",
      target: target || "Консультация по покупке смартфона и сервисных услуг",
      result: `Оценка визита шоппера: ${finalBpvScore}%`,
      comment: `Что понравилось: ${whatLiked}. Что не понравилось: ${whatDisliked}`,
      checkType: "2. Mystery shopper (без покупки)",
      employeeCode: consultantName,
      inspector: shopperName,
      bpvScore: finalBpvScore,
      speechScore: Math.round(avgStoreRating),
      salesDriveScore: score,
      stopFactors: (uniformStatus === "violation" || staffAvailability === "absent") ? 1 : 0,
      reportSummary: `Визит Тайного Покупателя (${shopperName}). Консультант: ${consultantName}. Оценка визита: ${finalBpvScore}%.`,
      fullReportText,
      audioFileName: audioFileName || undefined,
      audioUrl: audioUrl || undefined,
      approvalStatus: editingRecord?.approvalStatus || "PENDING_APPROVAL",
      managerComment: editingRecord?.managerComment || "Отчет тайного покупателя передан на рассмотрение руководителю ОКК.",
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Время начала <span className="text-red-400">*</span></span>
                </label>
                <select
                  value={formatTimeSlot(startTime)}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-semibold"
                >
                  {startTime && !TIME_SLOTS.includes(formatTimeSlot(startTime)) && (
                    <option value={formatTimeSlot(startTime)} className="bg-slate-900 text-slate-100 font-medium">
                      {formatTimeSlot(startTime)}
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
                  value={formatTimeSlot(endTime)}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-semibold"
                >
                  {endTime && !TIME_SLOTS.includes(formatTimeSlot(endTime)) && (
                    <option value={formatTimeSlot(endTime)} className="bg-slate-900 text-slate-100 font-medium">
                      {formatTimeSlot(endTime)}
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
                  <option value="Orange">Orange</option>
                  <option value="Apple Store">Apple Store</option>
                  <option value="Samsung">Samsung</option>
                  <option value="М.Видео">М.Видео</option>
                  <option value="DNS">DNS</option>
                  <option value="O!Store">O!Store</option>
                  <option value="Beeline">Beeline</option>
                  <option value="MegaCom">MegaCom</option>
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
                  {CITY_OPTIONS.map((c) => (
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
                  Руководитель филиала
                </label>
                <input
                  type="text"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                  placeholder="ФИО руководителя"
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
