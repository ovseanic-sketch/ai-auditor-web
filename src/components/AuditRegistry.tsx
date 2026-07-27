import React, { useState, useEffect } from "react";
import { loadDictionaries } from "../utils/dictionaryStore";
import { AuditRecord, UserAccount, ApprovalStatus } from "../types";
import { isAuditBelongsToManager } from "../utils/brandAccess";
import { ApprovalWorkflowPanel } from "./ApprovalWorkflowPanel";
import {
  Folder,
  FolderPlus,
  Move,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  Layers,
  Search,
  Filter,
  Plus,
  Download,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Tag,
  ShieldCheck,
  FileText,
  Mic,
  FileAudio,
  UserCheck,
  Users,
  Eye,
  Volume2,
  Clock,
  CheckCircle,
  RotateCcw,
  FileCheck,
  MessageSquare,
} from "lucide-react";
import { exportAuditReportToPdf } from "../utils/pdfExport";
import { AuditReportView } from "./AuditReportView";
import { ScoreBadge } from "./SkeletonLoader";

export function buildFullReportMarkdown(item: AuditRecord): string {
  const isMysteryShopper = item.checkType.toLowerCase().includes("mystery");
  const checkTypeTitle = isMysteryShopper
    ? "2. Mystery shopper (без покупки)"
    : "1. Контрольная закупка";

  let historyMarkdown = "";
  if (item.approvalHistory && item.approvalHistory.length > 0) {
    historyMarkdown = `\n\n## 10. ИСТОРИЯ СОГЛАСОВАНИЯ, ПРОТЕСТОВ И РЕШЕНИЙ АУДИТОРА\n- **Текущий статус Акта:** ${
      item.approvalStatus === "APPROVED"
        ? "Утвержден руководителем"
        : item.approvalStatus === "APPROVED_WITH_COMMENTS"
        ? "Утвержден руководителем с замечаниями"
        : item.approvalStatus === "REVISION_REQUESTED"
        ? "Подан протест / На пересмотре у проверяющего"
        : item.approvalStatus === "FINALIZED"
        ? "Финализирован аудитором после пересмотра"
        : "На согласовании у руководителя"
    }\n` +
    (item.managerComment ? `- **Замечание / Протест руководителя:** «${item.managerComment}»\n` : "") +
    (item.auditorRevisionComment ? `- **Решение аудитора:** «${item.auditorRevisionComment}»\n` : "") +
    `\n### Хронологический протокол действий:\n` +
    item.approvalHistory.map((h) => `- **[${h.timestamp}] ${h.user} (${h.role}):** ${h.action}${h.comment ? ` — *«${h.comment}»*` : ""}`).join("\n");
  }

  return `# АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)

## 1. ПАСПОРТ ПРОВЕРКИ
- **Компания / Бренд:** ${item.brand}
- **Филиал / Адрес:** ${item.branch}
- **Город:** ${item.city}
- **Сотрудник (ФИО / Код):** ${item.employeeCode}
- **Проверяющий / Инспектор:** ${item.inspector}
- **Формат проверки:** ${checkTypeTitle}
- **Дата и время проведения:** ${item.date}

## 2. СВОДНЫЕ ПОКАЗАТЕЛИ И ИНДЕКСЫ ОКК
- **BPV INDEX (СЕРВИСНЫЕ СТАНДАРТЫ):** ${item.bpvScore}%
- **РЕЧЕВОЙ ИНДЕКС (ДИАЛОГ):** ${item.speechScore ?? 92}%
- **SALES DRIVE (КОММЕРЧЕСКАЯ АКТИВНОСТЬ):** ${isMysteryShopper ? "Не применимо (N/A — Mystery shopper)" : `${item.salesDriveScore}%`}
- **КАССОВЫЙ ИНДЕКС:** ${isMysteryShopper ? "Не применимо (N/A — Mystery shopper)" : `${item.cashScore ?? 100}%`}
- **КРИТИЧЕСКИЕ НАРУШЕНИЯ (СТОП-ФАКТОРЫ):** ${item.stopFactors === 0 ? "Отсутствуют (0)" : item.stopFactors}

## 3. ОБЩЕЕ ЗАКЛЮЧЕНИЕ И КЛЮЧЕВАЯ ВЫГОДА ВИЗИТА
${item.reportSummary}

## 4. КРИТИЧЕСКАЯ ОЦЕНКА (СТОП-ФАКТОРЫ И КАССОВАЯ ДИСЦИПЛИНА)
- **Кассовые операции:** ${isMysteryShopper ? "Не применимо (N/A) — При проверках Mystery shopper кассовые операции и выдача чека не проводятся и не оцениваются." : item.cashScore === 100 ? "Да (100% соблюдение кассового регламента)" : "Нарушение кассовой дисциплины"}
- **Стоп-факторы:** ${item.stopFactors === 0 ? "Критическая грубость, обсчет или нарушение политики компании не зафиксированы." : `Зафиксировано ${item.stopFactors} стоп-фактор(а).`}

## 5. ДЕТАЛИЗИРОВАННЫЙ АНАЛИЗ ЭТАПОВ BPV С ЦИТАТАМИ И ТАЙМКОДАМИ

### ЭТАП 1: Приветствие и Установление Контакта
- **Оценка:** 100% (Выполнено)
- **Цитата с таймкодом:** [00:03] Консультант: «Здравствуйте! Рады видеть вас в нашем салоне ${item.brand}. Меня зовут ${item.employeeCode}. Чем могу вам помочь?»
- **Анализ:** Установление зрительного контакта в первые 5 секунд, доброжелательная интонация, соблюдение открытого положения тела.

### ЭТАП 2: Выявление Потребностей
- **Оценка:** ${item.bpvScore >= 88 ? "100%" : "80% (Частично)"}
- **Цитата с таймкодом:** [00:18] Консультант: «Подскажите, какие функции устройства для вас наиболее приоритетны — камера, игры или автономность?»
- **Причины несоответствия / Анализ:** ${item.bpvScore >= 88 ? "Сотрудник задал цепочку открытых и уточняющих вопросов, выслушал ответ клиента не перебивая." : "Консультант задал только один уточняющий вопрос. Отсутствовала полноценная воронка из 3+ открытых вопросов для полного выяснения сценария использования."}

### ЭТАП 3: Презентация Решения и Свойств Товара
- **Оценка:** ${item.salesDriveScore >= 80 ? "100%" : "85% (Частично)"}
- **Цитата с таймкодом:** [00:45] Консультант: «Эта модель оснащена энергоэффективным процессором и быстрым накопителем, что обеспечивает плавную работу всех приложений.»
- **Причины несоответствия / Анализ:** ${item.salesDriveScore >= 80 ? "Презентация построена по принципу «свойство — выгода». Перечислены ключевые ценности для клиента." : "Сотрудник перечислил технические характеристики без наглядных связок с персональной выгодой для клиента."}

### ЭТАП 4: Работа с Сомнениями и Возражениями
- **Оценка:** 90% (Выполнено)
- **Цитата с таймкодом:** [01:12] Консультант: «Понимаю ваше внимание к стоимости. Обратите внимание, что при покупке сегодня действует рассрочка 0% без комиссии.»
- **Анализ:** Применён алгоритм «присоединение + аргументация + выгода».

### ЭТАП 5: Кросс-сейл и Завершение Сделки
- **Оценка:** ${isMysteryShopper ? "Не применимо (N/A)" : `${item.salesDriveScore}%`}
- **Причины / Анализ:** ${isMysteryShopper ? "При проверках Mystery shopper (без покупки) cross-selling и кассовые операции не оцениваются." : "Инициативное предложение сопутствующих аксессуаров и сервисных услуг до завершения расчёта."}

## 6. РЕЧЕВОЙ АНАЛИЗ И ДИАЛОГОВЫЙ БАЛАНС
- **Баланс речи:** Консультант — 55%, Покупатель — 45%.
- **Слова-паразиты:** Минимальное количество (менее 1%).
- **Профессиональная лексика:** Грамотное использование терминов, адаптированное под уровень понимания покупателя.

## 7. АНАЛИЗ ГОЛОСА И ЭМОЦИОНАЛЬНОГО ТОНА
- **Темп речи:** Умеренный (135 слов/мин), чёткая дикция.
- **Тональность:** Уверенная, доброжелательная, эмпатичная.
- **Интонационный рисунок:** Консультант удерживал заинтересованность клиента на протяжении всей консультации.

## 8. МАТРИЦА РЕКОМЕНДАЦИЙ ДЛЯ ТРЕНЕРА И РОПа
| Выявленная ошибка / пропуск | Описание факта по записи | Готовый речевой модуль для отработки |
|---|---|---|
| Инициативный Cross-sell до оплаты | Аксессуары озвучены без наглядной демонстрации | «Позвольте я сразу примерю этот чехол на выбранную модель — посмотрите, как комфортно он сидит!» |
| Призыв к завершению покупки | Отсутствие прямого побуждающего вопроса в конце | «Давайте прямо сейчас оформим данный комплект на кассе, чтобы зафиксировать скидку!» |
${historyMarkdown}`;
}

export const INITIAL_AUDIT_RECORDS: AuditRecord[] = [
  {
    id: "AUD-2026-001",
    date: "13.06.2026",
    brand: "Orange",
    branch: "Rîșcani (Филиал №17)",
    city: "Кишинев",
    group: "Центральный регион",
    checkType: "1. Контрольная закупка",
    employeeCode: "Sorbalov Dorina",
    inspector: "Аудитор №17",
    manager: "Петров В.В.",
    bpvScore: 100,
    cashScore: 100,
    speechScore: 98,
    salesDriveScore: 100,
    stopFactors: 0,
    approvalStatus: "APPROVED",
    approvedAt: "13.06.2026, 16:30",
    approvedBy: "Петров В.В. (Руководитель)",
    reportSummary: "Идеальное выполнение стандартов BPV, безупречный диалог с клиентом и эффективный Cross-sell сопутствующих товаров.",
    approvalHistory: [
      {
        timestamp: "13.06.2026, 14:15",
        user: "Аудитор №17",
        role: "Проверяющий",
        action: "Сформировал Акт оценки ОКК и направил на согласование руководителю",
      },
      {
        timestamp: "13.06.2026, 16:30",
        user: "Петров В.В.",
        role: "Руководитель",
        action: "Утвердил результаты Акта оценки ОКК (без замечаний)",
      },
    ],
  },
  {
    id: "AUD-2026-002",
    date: "22.07.2026",
    brand: "Orange",
    branch: "Дечебал (Филиал №3)",
    city: "Кишинев",
    group: "Центральный регион",
    checkType: "1. Контрольная закупка",
    employeeCode: "Sau Daniel",
    inspector: "Инкогнито (Аудитор №03)",
    manager: "Петров В.В.",
    bpvScore: 88.5,
    cashScore: 100,
    speechScore: 85,
    salesDriveScore: 25.0,
    stopFactors: 0,
    approvalStatus: "APPROVED_WITH_COMMENTS",
    approvedAt: "22.07.2026, 18:10",
    approvedBy: "Петров В.В. (Руководитель)",
    managerComment: "Результаты утверждены. Руководителю филиала провести инструктаж с консультантом по более активной презентации сопутствующих аксессуаров до пробития чека.",
    reportSummary: "Высокое качество презентации и работы с сомнениями. Пропуск инициативного Cross-sell аксессуаров до оплаты.",
    approvalHistory: [
      {
        timestamp: "22.07.2026, 15:40",
        user: "Инкогнито (Аудитор №03)",
        role: "Проверяющий",
        action: "Сформировал Акт оценки ОКК и направил на согласование руководителю",
      },
      {
        timestamp: "22.07.2026, 18:10",
        user: "Петров В.В.",
        role: "Руководитель",
        action: "Утвердил Акт оценки ОКК с замечаниями",
        comment: "Результаты утверждены. Руководителю филиала провести инструктаж с консультантом по более активной презентации сопутствующих аксессуаров до пробития чека.",
      },
    ],
  },
  {
    id: "AUD-2026-003",
    date: "08.06.2026",
    brand: "Orange",
    branch: "Căușeni (Филиал №9)",
    city: "Каушаны",
    group: "Южный регион",
    checkType: "1. Контрольная закупка",
    employeeCode: "Anton Cristina",
    inspector: "Аудитор №09",
    manager: "Петров В.В.",
    bpvScore: 91.5,
    cashScore: 100,
    speechScore: 92,
    salesDriveScore: 100,
    stopFactors: 0,
    approvalStatus: "APPROVED",
    approvedAt: "08.06.2026, 17:00",
    approvedBy: "Петров В.В. (Руководитель)",
    reportSummary: "Отличный диалоговый баланс, подробная презентация характеристик товара и предложение сервисных пакетов.",
    approvalHistory: [
      {
        timestamp: "08.06.2026, 12:00",
        user: "Аудитор №09",
        role: "Проверяющий",
        action: "Сформировал Акт оценки ОКК и направил на согласование руководителю",
      },
      {
        timestamp: "08.06.2026, 17:00",
        user: "Петров В.В.",
        role: "Руководитель",
        action: "Утвердил результаты Акта оценки ОКК (без замечаний)",
      },
    ],
  },
  {
    id: "AUD-2026-004",
    date: "23.07.2026",
    brand: "ТехноМир Pro",
    branch: "Филиал Центральный",
    city: "Москва",
    group: "Северный регион",
    checkType: "2. Mystery shopper (без покупки)",
    employeeCode: "Алексей С.",
    inspector: "MS-007",
    manager: "Иванов И.И.",
    bpvScore: 95.0,
    cashScore: 100,
    speechScore: 96,
    salesDriveScore: 80.0,
    stopFactors: 0,
    approvalStatus: "FINALIZED",
    reportSummary: "Экспертная консультация без покупки. Сотрудник отлично отработал воронку вопросов и выявил скрытые задачи.",
    managerComment: "Подал протест: Прошу пересмотреть балл за Sales Drive, так как консультант активно предлагал дополнительную гарантию.",
    auditorRevisionComment: "Проведена повторная проверка тайминга аудиозаписи. Балл за Sales Drive скорректирован с 70% на 80%.",
    approvalHistory: [
      {
        timestamp: "23.07.2026, 10:00",
        user: "MS-007",
        role: "Проверяющий",
        action: "Сформировал Акт оценки ОКК и направил на согласование руководителю",
      },
      {
        timestamp: "23.07.2026, 11:30",
        user: "Иванов И.И.",
        role: "Руководитель",
        action: "Подал протест / отправил Акт на пересмотр",
        comment: "Подал протест: Прошу пересмотреть балл за Sales Drive, так как консультант активно предлагал дополнительную гарантию.",
      },
      {
        timestamp: "23.07.2026, 14:20",
        user: "MS-007",
        role: "Проверяющий",
        action: "Скоректировал балл BPV с 90% на 95%",
        comment: "Проведена повторная проверка тайминга аудиозаписи. Балл за Sales Drive скорректирован с 70% на 80%.",
      },
    ],
  },
  {
    id: "AUD-2026-005",
    date: "19.07.2026",
    brand: "ТехноМир Pro",
    branch: "Филиал Северный",
    city: "Бельцы",
    group: "Северный регион",
    checkType: "2. Mystery shopper (без покупки)",
    employeeCode: "Петров Михаил",
    inspector: "MS-012",
    manager: "Иванов И.И.",
    bpvScore: 78.0,
    cashScore: 100,
    speechScore: 74,
    salesDriveScore: 50.0,
    stopFactors: 1,
    approvalStatus: "REVISION_REQUESTED",
    managerComment: "Подаю протест: Не согласен со стоп-фактором. Прошу переслушать фрагмент диалога 04:12.",
    reportSummary: "Зафиксировано использование закрытых вопросов и отсутствие выявления потребностей в начале разговора.",
    approvalHistory: [
      {
        timestamp: "19.07.2026, 14:00",
        user: "MS-012",
        role: "Проверяющий",
        action: "Сформировал Акт оценки ОКК и направил на согласование руководителю",
      },
      {
        timestamp: "19.07.2026, 16:45",
        user: "Иванов И.И.",
        role: "Руководитель",
        action: "Подал протест / отправил Акт на пересмотр",
        comment: "Подаю протест: Не согласен со стоп-фактором. Прошу переслушать фрагмент диалога 04:12.",
      },
    ],
  },
  {
    id: "AUD-2026-006",
    date: "15.07.2026",
    brand: "Orange",
    branch: "Ботаника (Филиал №12)",
    city: "Кишинев",
    group: "Центральный регион",
    checkType: "1. Контрольная закупка",
    employeeCode: "Cojocaru Elena",
    inspector: "Аудитор №05",
    manager: "Петров В.В.",
    bpvScore: 92.0,
    cashScore: 100,
    speechScore: 90,
    salesDriveScore: 85.0,
    stopFactors: 0,
    approvalStatus: "APPROVED",
    approvedAt: "15.07.2026, 18:00",
    approvedBy: "Петров В.В.",
    reportSummary: "Высокая культура обслуживания, грамотная речевая аналитика и соблюдение порядка заполнения документов.",
    approvalHistory: [
      {
        timestamp: "15.07.2026, 11:20",
        user: "Аудитор №05",
        role: "Проверяющий",
        action: "Сформировал Акт оценки ОКК и направил на согласование руководителю",
      },
      {
        timestamp: "15.07.2026, 18:00",
        user: "Петров В.В.",
        role: "Руководитель",
        action: "Утвердил результаты Акта оценки ОКК (без замечаний)",
      },
    ],
  },
  {
    id: "AUD-2026-013",
    date: "25.07.2026",
    brand: "Orange",
    branch: "Буюканы (Филиал №5)",
    city: "Кишинев",
    group: "Центральный регион",
    checkType: "1. Контрольная закупка",
    employeeCode: "Gutu Marian",
    inspector: "Инспектор ОКК",
    manager: "Петров В.В.",
    bpvScore: 93.0,
    cashScore: 100,
    speechScore: 90,
    salesDriveScore: 85.0,
    stopFactors: 0,
    approvalStatus: "PENDING_APPROVAL",
    reportSummary: "Акт оценки ОКК направлен на согласование руководителю. Высокое качество соблюдения сервисного стандарта BPV (93.0%). На основе анализа аудиозаписи консультации зафиксировано строгое соблюдение речевых стандартов и воронки вопросов.",
    approvalHistory: [
      {
        timestamp: "25.07.2026, 09:30",
        user: "Инспектор ОКК",
        role: "Проверяющий",
        action: "Сформировал Акт оценки ОКК и направил на согласование руководителю (Петров В.В.)",
      },
    ],
  },
];

interface AuditRegistryProps {
  records: AuditRecord[];
  onUpdateRecords: (records: AuditRecord[]) => void;
  onViewRecordDetail?: (record: AuditRecord) => void;
  currentUser?: UserAccount;
  onNotificationCreated?: () => void;
  selectedRecordIdForModal?: string | null;
  onClearSelectedModalId?: () => void;
}

export function AuditRegistry({
  records,
  onUpdateRecords,
  onViewRecordDetail,
  currentUser,
  onNotificationCreated,
  selectedRecordIdForModal,
  onClearSelectedModalId,
}: AuditRegistryProps) {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("ALL");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("ALL");
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>("ALL");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("ALL");
  const [selectedCheckType, setSelectedCheckType] = useState<string>("ALL");
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState<string>("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL"); // "ALL" | "TODAY" | "THIS_MONTH" | "CUSTOM"
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [groupBy, setGroupBy] = useState<"none" | "group" | "brand" | "checkType" | "city" | "date" | "employee" | "inspector">("none");
  const [tableDensity, setTableDensity] = useState<"comfortable" | "compact">("comfortable");

  // Modal for Viewing Full Audit Report
  const [viewingRecord, setViewingRecord] = useState<AuditRecord | null>(null);
  const [showFullReportInModal, setShowFullReportInModal] = useState<boolean>(false);

  const handleCloseModal = () => {
    setViewingRecord(null);
    setShowFullReportInModal(false);
    if (onClearSelectedModalId) {
      onClearSelectedModalId();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewingRecord) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingRecord]);

  // Auto open modal if requested from notification
  useEffect(() => {
    if (selectedRecordIdForModal) {
      const targetRec = records.find((r) => r.id === selectedRecordIdForModal);
      if (targetRec) {
        setViewingRecord(targetRec);
      }
      if (onClearSelectedModalId) {
        onClearSelectedModalId();
      }
    }
  }, [selectedRecordIdForModal, records]);

  // Helper to update a record
  const handleUpdateRecordInRegistry = (updated: AuditRecord) => {
    const updatedList = records.map((r) => (r.id === updated.id ? updated : r));
    onUpdateRecords(updatedList);
    setViewingRecord(updated);
  };

  // Helper to download report as PDF document matching official audit act
  const downloadReportPdf = (item: AuditRecord) => {
    let reportContent = item.fullReportText || buildFullReportMarkdown(item);

    // If fullReportText was pre-stored without history section, append history section
    if (item.approvalHistory && item.approvalHistory.length > 0 && !reportContent.includes("ИСТОРИЯ СОГЛАСОВАНИЯ")) {
      const historyBlock = `\n\n## 10. ИСТОРИЯ СОГЛАСОВАНИЯ, ПРОТЕСТОВ И РЕШЕНИЙ АУДИТОРА\n- **Текущий статус Акта:** ${
        item.approvalStatus === "APPROVED"
          ? "Утвержден руководителем"
          : item.approvalStatus === "REVISION_REQUESTED"
          ? "Подан протест / На пересмотре у проверяющего"
          : item.approvalStatus === "FINALIZED"
          ? "Финализирован аудитором после пересмотра"
          : "На согласовании у руководителя"
      }\n` +
      (item.managerComment ? `- **Замечание / Протест руководителя:** «${item.managerComment}»\n` : "") +
      (item.auditorRevisionComment ? `- **Решение аудитора:** «${item.auditorRevisionComment}»\n` : "") +
      `\n### Хронологический протокол действий:\n` +
      item.approvalHistory.map((h) => `- **[${h.timestamp}] ${h.user} (${h.role}):** ${h.action}${h.comment ? ` — *«${h.comment}»*` : ""}`).join("\n");

      reportContent += historyBlock;
    }

    exportAuditReportToPdf({
      title: "АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)",
      brand: item.brand,
      branch: item.branch,
      city: item.city,
      date: item.date,
      checkType: item.checkType,
      employeeCode: item.employeeCode,
      inspector: item.inspector,
      reportContent,
    });
  };

  // Helper to download audio file
  const downloadAudioFile = (item: AuditRecord) => {
    if (item.audioUrl) {
      const a = document.createElement("a");
      a.href = item.audioUrl;
      a.download = item.audioFileName || `Аудиозапись_${item.id}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const audioMockText = `================================================\nАУДИОПРОТОКОЛ И ЗАПИСЬ ПРОВЕРКИ ${item.id}\nДата: ${item.date} | Филиал: ${item.branch}\nСотрудник: ${item.employeeCode} | Проверяющий: ${item.inspector}\n================================================\n\n[00:00] Консультант (${item.employeeCode}): Здравствуйте! Рады приветствовать вас в нашем салоне.\n[00:08] Клиент (Тайный покупатель): Здравствуйте, консультируюсь по выбору смартфона и подключению пакета.\n[00:15] Консультант (${item.employeeCode}): С удовольствием помогу! Какими основными функциями вы чаще всего пользуетесь?\n[00:28] Клиент: Камера, мессенджеры и автономность аккумулятора.\n[00:40] Консультант: Отлично! Рекомендую рассмотреть флагманскую модель...\n\n(Запись успешно выгружена из реестра проверок ОКК)`;

    const blob = new Blob([audioMockText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.audioFileName || `Аудиозапись_проверки_${item.id}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export records to CSV for Excel analysis
  const exportToCsv = () => {
    const dataToExport = filteredRecords.length > 0 ? filteredRecords : records;

    const headers = [
      "ID проверки",
      "Дата",
      "Бренд",
      "Филиал",
      "Город",
      "Группа / Регион",
      "Формат проверки",
      "Сотрудник",
      "Проверяющий",
      "BPV Index (%)",
      "Речевой индекс (%)",
      "Sales Drive (%)",
      "Стоп-факторы",
      "Заключение / Резюме",
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = dataToExport.map((item) => [
      escapeCsv(item.id),
      escapeCsv(item.date),
      escapeCsv(item.brand),
      escapeCsv(item.branch),
      escapeCsv(item.city),
      escapeCsv(item.group || "—"),
      escapeCsv(item.checkType),
      escapeCsv(item.employeeCode),
      escapeCsv(item.inspector),
      escapeCsv(item.bpvScore),
      escapeCsv(item.speechScore ?? 90),
      escapeCsv(item.salesDriveScore),
      escapeCsv(item.stopFactors),
      escapeCsv(item.reportSummary ? item.reportSummary.replace(/[\r\n]+/g, " ") : ""),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.map(escapeCsv).join(";"), ...rows.map((r) => r.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `Реестр_проверок_ОКК_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Selection state for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Expanded groups in accordions
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Центральный регион": true,
    "Южный регион": true,
    "Северный регион": true,
    "Без группы": true,
    "Orange": true,
    "ТехноМир Pro": true,
    "Полная проверка с контрольной закупкой": true,
    "Mystery shopper / Оценка BPV (Без покупки)": true,
  });

  // Modal Delete Confirmation State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: "single" | "bulk";
    id?: string;
  }>({ isOpen: false, type: "single" });

  // Modal Editing State
  const [editingRecord, setEditingRecord] = useState<AuditRecord | null>(null);

  // Modal Moving State
  const [movingModalOpen, setMovingModalOpen] = useState(false);
  const [targetGroupForMove, setTargetGroupForMove] = useState("");
  const [customNewGroup, setCustomNewGroup] = useState("");

  // Modal New Record State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newRecordData, setNewRecordData] = useState<Partial<AuditRecord>>({
    id: `AUD-2026-00${records.length + 1}`,
    date: new Date().toLocaleDateString("ru-RU"),
    brand: "Orange",
    branch: "Филиал №1",
    city: "Кишинев",
    group: "Центральный регион",
    checkType: "1. Контрольная закупка",
    employeeCode: "Сотрудник",
    inspector: "Аудитор №01",
    bpvScore: 90,
    cashScore: 100,
    salesDriveScore: 80,
    stopFactors: 0,
    reportSummary: "Новая проверка внесена в реестр.",
  });

  // Accessible records according to manager's brand isolation
  const accessibleRecords = records.filter((r) => isAuditBelongsToManager(r, currentUser));

  // Available unique values for dropdowns
  const uniqueBrands = Array.from(new Set(accessibleRecords.map((r) => r.brand).filter(Boolean)));
  const uniqueRegions = Array.from(new Set(accessibleRecords.map((r) => r.group || (r as any).region).filter(Boolean)));
  const uniqueManagers = Array.from(new Set(accessibleRecords.map((r) => r.manager).filter(Boolean)));
  const uniqueCities = Array.from(new Set(accessibleRecords.map((r) => r.city).filter(Boolean)));
  const existingGroups = Array.from(new Set(accessibleRecords.map((r) => r.group || "Без группы")));

  // Date parser helper
  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const clean = dateStr.trim();
    if (clean.includes(".")) {
      const parts = clean.split(".");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    if (clean.includes("-")) {
      const parts = clean.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  };

  // Filter records by search, brand, region, manager, city, checkType, and date
  const filteredRecords = accessibleRecords.filter((rec) => {
    const matchesBrand = selectedBrandFilter === "ALL" || rec.brand === selectedBrandFilter;
    const matchesRegion = selectedRegionFilter === "ALL" || (rec.group || (rec as any).region) === selectedRegionFilter;
    const matchesManager = selectedManagerFilter === "ALL" || rec.manager === selectedManagerFilter;
    const matchesCity = selectedCityFilter === "ALL" || rec.city === selectedCityFilter;

    const matchesSearch =
      rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.manager && rec.manager.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.city && rec.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.date && rec.date.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.group && rec.group.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      selectedCheckType === "ALL" ||
      rec.checkType === selectedCheckType ||
      (rec.checkType && rec.checkType.toLowerCase().includes(selectedCheckType.toLowerCase())) ||
      (rec.checkType && selectedCheckType.toLowerCase().includes(rec.checkType.toLowerCase()));

    // Date filtering
    let matchesDate = true;
    const recDate = parseDateString(rec.date);

    if (selectedDateFilter === "TODAY") {
      if (recDate) {
        const today = new Date();
        matchesDate =
          recDate.getDate() === today.getDate() &&
          recDate.getMonth() === today.getMonth() &&
          recDate.getFullYear() === today.getFullYear();
      } else {
        matchesDate = false;
      }
    } else if (selectedDateFilter === "THIS_MONTH") {
      if (recDate) {
        const today = new Date();
        matchesDate =
          recDate.getMonth() === today.getMonth() &&
          recDate.getFullYear() === today.getFullYear();
      } else {
        matchesDate = false;
      }
    } else if (selectedDateFilter === "CUSTOM") {
      if (recDate) {
        if (startDate) {
          const start = parseDateString(startDate);
          if (start && recDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = parseDateString(endDate);
          if (end) {
            const endOfDay = new Date(end);
            endOfDay.setHours(23, 59, 59, 999);
            if (recDate > endOfDay) matchesDate = false;
          }
        }
      } else if (startDate || endDate) {
        matchesDate = false;
      }
    }

    let matchesApproval = true;
    if (selectedApprovalFilter !== "ALL") {
      const recStatus = rec.approvalStatus || "PENDING_APPROVAL";
      matchesApproval = recStatus === selectedApprovalFilter;
    }

    return matchesBrand && matchesRegion && matchesManager && matchesCity && matchesSearch && matchesType && matchesDate && matchesApproval;
  });

  // Group records by chosen key
  const groupedData: Record<string, AuditRecord[]> = {};

  if (groupBy === "none") {
    groupedData["Все записи"] = filteredRecords;
  } else {
    filteredRecords.forEach((rec) => {
      let key = "Без группы";
      if (groupBy === "group") key = rec.group || "Без группы";
      if (groupBy === "brand") key = rec.brand || "Не указан";
      if (groupBy === "checkType") key = rec.checkType || "Другое";
      if (groupBy === "city") key = rec.city || "Не указан";
      if (groupBy === "date") key = rec.date || "Без даты";
      if (groupBy === "employee") key = rec.employeeCode ? `Сотрудник: ${rec.employeeCode}` : "Сотрудник не указан";
      if (groupBy === "inspector") key = rec.inspector ? `Проверяющий: ${rec.inspector}` : "Проверяющий не указан";

      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(rec);
    });
  }

  // Toggle group collapse
  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Toggle selection of a single item
  const toggleSelectRecord = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select/Unselect All
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  // Delete single record
  const handleDeleteSingle = (id: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      type: "single",
      id,
    });
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    setDeleteConfirmModal({
      isOpen: true,
      type: "bulk",
    });
  };

  // Confirm delete action
  const confirmDelete = () => {
    if (deleteConfirmModal.type === "single" && deleteConfirmModal.id) {
      const targetId = deleteConfirmModal.id;
      const updated = records.filter((r) => r.id !== targetId);
      onUpdateRecords(updated);
      setSelectedIds((prev) => prev.filter((i) => i !== targetId));
    } else if (deleteConfirmModal.type === "bulk") {
      const updated = records.filter((r) => !selectedIds.includes(r.id));
      onUpdateRecords(updated);
      setSelectedIds([]);
    }
    setDeleteConfirmModal({ isOpen: false, type: "single" });
  };

  // Move Selected Records to a Group
  const handleMoveSelectedToGroup = () => {
    const finalGroupName =
      targetGroupForMove === "__NEW__"
        ? customNewGroup.trim() || "Без группы"
        : targetGroupForMove;

    if (!finalGroupName) return;

    const updated = records.map((r) => {
      if (selectedIds.includes(r.id)) {
        return { ...r, group: finalGroupName };
      }
      return r;
    });

    onUpdateRecords(updated);
    setMovingModalOpen(false);
    setSelectedIds([]);
    setCustomNewGroup("");
  };

  // Save Edit Modal
  const handleSaveEdit = () => {
    if (!editingRecord) return;

    const updated = records.map((r) =>
      r.id === editingRecord.id ? editingRecord : r
    );
    onUpdateRecords(updated);
    setEditingRecord(null);
  };

  // Create New Record
  const handleCreateNewRecord = () => {
    if (!newRecordData.id || !newRecordData.branch) {
      alert("Заполните базовые поля ID и Филиал");
      return;
    }

    const fullRecord: AuditRecord = {
      id: newRecordData.id,
      date: newRecordData.date || new Date().toLocaleDateString("ru-RU"),
      brand: newRecordData.brand || "Orange",
      branch: newRecordData.branch || "Филиал",
      city: newRecordData.city || "Кишинев",
      group: newRecordData.group || "Центральный регион",
      checkType:
        (newRecordData.checkType as any) ||
        "Полная проверка с контрольной закупкой",
      employeeCode: newRecordData.employeeCode || "Сотрудник",
      inspector: newRecordData.inspector || "Аудитор",
      bpvScore: Number(newRecordData.bpvScore) || 90,
      speechScore: Number(newRecordData.speechScore) || 90,
      salesDriveScore: Number(newRecordData.salesDriveScore) || 80,
      stopFactors: Number(newRecordData.stopFactors) || 0,
      reportSummary: newRecordData.reportSummary || "Добавлена ручная запись.",
    };

    onUpdateRecords([fullRecord, ...records]);
    setIsCreatingNew(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-500/20 uppercase tracking-wider">
              Консоль управления
            </span>
            <span className="text-slate-500 text-xs">
              Всего проверок: {records.length}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Реестр проверок и акты ОКК
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setTableDensity((prev) => (prev === "comfortable" ? "compact" : "comfortable"))}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
            title="Переключить плотность отображения строк таблицы"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Режим: {tableDensity === "comfortable" ? "Стандартный" : "Компактный"}</span>
          </button>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
            title="Экспортировать все отфильтрованные данные реестра в CSV для Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Экспортировать в CSV</span>
          </button>

          <button
            onClick={() => setIsCreatingNew(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить запись</span>
          </button>

          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => setMovingModalOpen(true)}
                className="flex items-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold text-xs px-3 py-2 rounded-xl transition-all"
              >
                <Move className="w-4 h-4" />
                <span>Переместить ({selectedIds.length})</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-xs px-3 py-2 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить ({selectedIds.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Grouping Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по номеру, сотруднику, филиалу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="ALL">Все бренды</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Region Filter */}
          <select
            value={selectedRegionFilter}
            onChange={(e) => setSelectedRegionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="ALL">Все регионы</option>
            {uniqueRegions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Manager Filter */}
          <select
            value={selectedManagerFilter}
            onChange={(e) => setSelectedManagerFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="ALL">Все руководители</option>
            {uniqueManagers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="ALL">Все города</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Approval Status Filter */}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedApprovalFilter}
              onChange={(e) => setSelectedApprovalFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="ALL">Все статусы согласования</option>
              <option value="PENDING_APPROVAL">🟡 На согласовании</option>
              <option value="APPROVED_WITH_COMMENTS">🟠 Утвержден с замечаниями</option>
              <option value="APPROVED">🟢 Утверждены</option>
              <option value="REVISION_REQUESTED">🔴 На пересмотре</option>
              <option value="FINALIZED">🔵 Финализированы</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCheckType}
              onChange={(e) => setSelectedCheckType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="ALL">Все типы проверок</option>
              {Array.from(
                new Set([
                  "1. Контрольная закупка",
                  "2. Mystery shopper (без покупки)",
                  "3. Оценка звонка / Сообщений",
                  ...records.map((r) => r.checkType).filter(Boolean),
                ])
              ).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Все даты</option>
              <option value="TODAY">За сегодня</option>
              <option value="THIS_MONTH">За этот месяц</option>
              <option value="CUSTOM">Указать период (С - По)</option>
            </select>

            {selectedDateFilter === "CUSTOM" && (
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs px-2 py-1 focus:outline-none"
                  placeholder="С"
                />
                <span className="text-slate-500 text-xs">—</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs px-2 py-1 focus:outline-none"
                  placeholder="По"
                />
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="text-slate-400 hover:text-slate-200 p-1"
                    title="Сбросить даты"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grouping Selector */}
        <div className="flex items-center gap-2 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            Группировать по:
          </span>
          <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5">
            <button
              onClick={() => setGroupBy("none")}
              className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                groupBy === "none"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Без группировки (по умолчанию)
            </button>
            <button
              onClick={() => setGroupBy("date")}
              className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                groupBy === "date"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Дата
            </button>
            <button
              onClick={() => setGroupBy("brand")}
              className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                groupBy === "brand"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Бренды
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Records View */}
      <div className="space-y-4">
        {Object.keys(groupedData).length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Проверки не найдены</h3>
            <p className="text-xs text-slate-400">
              Попробуйте изменить параметры поиска или сбросить фильтры.
            </p>
          </div>
        ) : (
          Object.entries(groupedData).map(([groupName, groupItems]) => {
            const isExpanded = expandedGroups[groupName] ?? true;
            const avgGroupBpv = (
              groupItems.reduce((acc, curr) => acc + curr.bpvScore, 0) /
              (groupItems.length || 1)
            ).toFixed(1);

            return (
              <div
                key={groupName}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                {/* Accordion Group Header */}
                <div
                  onClick={() => toggleGroup(groupName)}
                  className="bg-slate-950/80 hover:bg-slate-950 px-5 py-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800 select-none"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-blue-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}

                    <Folder className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">
                      {groupName}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                      {groupItems.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-slate-400">Ср. BPV:</span>
                      <span className="font-bold text-emerald-400">{avgGroupBpv}%</span>
                    </div>
                  </div>
                </div>

                {/* Group Content Table */}
                {isExpanded && (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/40 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800/80">
                          <th className="py-2.5 px-4 w-10 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectAll();
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              {selectedIds.length === filteredRecords.length &&
                              filteredRecords.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">Номер / Дата</th>
                          <th className="py-2.5 px-3">Филиал и Бренд</th>
                          <th className="py-2.5 px-3">Сотрудник / Аудитор</th>
                          <th className="py-2.5 px-3">Группа/Регион</th>
                          <th className="py-2.5 px-3">Тип проверки</th>
                          <th className="py-2.5 px-3">Согласование</th>
                          <th className="py-2.5 px-3 text-center">BPV Index</th>
                          <th className="py-2.5 px-3 text-center">Речевой индекс</th>
                          <th className="py-2.5 px-3 text-center">Sales Drive</th>
                          <th className="py-2.5 px-3">Файлы</th>
                          <th className="py-2.5 px-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        {groupItems.map((item) => {
                          const isSelected = selectedIds.includes(item.id);
                          const cellPad = tableDensity === "compact" ? "py-1.5 px-3" : "py-3 px-3";

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-800/40 transition-colors ${
                                isSelected ? "bg-blue-500/10" : ""
                              }`}
                            >
                              <td className={`${cellPad} text-center`}>
                                <button
                                  onClick={() => toggleSelectRecord(item.id)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-blue-400" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>

                              <td className={`${cellPad} font-mono text-slate-400 whitespace-nowrap`}>
                                <div className="font-semibold text-slate-200">
                                  {item.id}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {item.date}
                                </div>
                              </td>

                              <td className={cellPad}>
                                <div className="font-semibold text-white">
                                  {item.branch}
                                </div>
                                <div className="text-slate-400 text-[11px]">
                                  {item.brand} ({item.city})
                                </div>
                              </td>

                              <td className={cellPad}>
                                <div className="font-medium text-slate-200">
                                  {item.employeeCode}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <UserCheck className="w-3 h-3 text-blue-400" />
                                  <span>{item.inspector}</span>
                                </div>
                              </td>

                              <td className={cellPad}>
                                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-md border border-slate-700">
                                  <Tag className="w-3 h-3 text-amber-400" />
                                  {item.group || "Без группы"}
                                </span>
                              </td>

                              <td className={cellPad}>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    item.checkType.includes("покупкой")
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  }`}
                                >
                                  {item.checkType.includes("покупкой")
                                    ? "1. Закупка"
                                    : "2. Mystery Shopper"}
                                </span>
                              </td>

                              <td className={cellPad}>
                                {(!item.approvalStatus || item.approvalStatus === "PENDING_APPROVAL") && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingRecord(item);
                                    }}
                                    title="Нажмите, чтобы посмотреть цепочку действий и историю согласования"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs"
                                  >
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>На согласовании</span>
                                  </button>
                                )}
                                {item.approvalStatus === "APPROVED_WITH_COMMENTS" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingRecord(item);
                                    }}
                                    title="Нажмите, чтобы посмотреть цепочку действий, замечания и историю согласования"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer shadow-xs"
                                  >
                                    <MessageSquare className="w-3 h-3 text-amber-400" />
                                    <span>Утвержден с замечаниями</span>
                                  </button>
                                )}
                                {item.approvalStatus === "APPROVED" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingRecord(item);
                                    }}
                                    title="Нажмите, чтобы посмотреть цепочку действий и историю согласования"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs"
                                  >
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    <span>Утвержден</span>
                                  </button>
                                )}
                                {item.approvalStatus === "REVISION_REQUESTED" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingRecord(item);
                                    }}
                                    title="Нажмите, чтобы посмотреть цепочку действий и замечания руководителя"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 hover:border-red-500/60 transition-all cursor-pointer shadow-xs"
                                  >
                                    <RotateCcw className="w-3 h-3 text-red-400" />
                                    <span>На пересмотре</span>
                                  </button>
                                )}
                                {item.approvalStatus === "FINALIZED" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingRecord(item);
                                    }}
                                    title="Нажмите, чтобы посмотреть цепочку действий и финальное решение"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer shadow-xs"
                                  >
                                    <FileCheck className="w-3 h-3 text-blue-400" />
                                    <span>Финализирован</span>
                                  </button>
                                )}
                              </td>

                              <td className={`${cellPad} text-center font-bold`}>
                                <ScoreBadge score={item.bpvScore} />
                              </td>

                              <td className={`${cellPad} text-center font-bold`}>
                                <span
                                  className={
                                    (item.speechScore ?? 90) >= 85
                                      ? "text-emerald-400"
                                      : "text-amber-400"
                                  }
                                >
                                  {item.speechScore ?? 90}%
                                </span>
                              </td>

                              <td className={`${cellPad} text-center font-bold`}>
                                <span
                                  className={
                                    item.salesDriveScore >= 70
                                      ? "text-emerald-400"
                                      : "text-amber-400"
                                  }
                                >
                                  {item.salesDriveScore}%
                                </span>
                              </td>

                              {/* Файлы отчета и аудиозаписи */}
                              <td className={cellPad}>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => downloadReportPdf(item)}
                                    className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-blue-400 hover:text-blue-300 text-[10px] font-medium px-2 py-1 rounded-lg border border-slate-800 transition-all shadow-sm"
                                    title={`Скачать актовый отчет по проверке ${item.id} (PDF)`}
                                  >
                                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Отчет (PDF)</span>
                                  </button>

                                  <button
                                    onClick={() => downloadAudioFile(item)}
                                    className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 text-[10px] font-medium px-2 py-1 rounded-lg border border-slate-800 transition-all shadow-sm"
                                    title={item.audioFileName ? `Скачать ${item.audioFileName}` : `Скачать аудиозапись проверки ${item.id}`}
                                  >
                                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Аудио</span>
                                  </button>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* View Full Report Button */}
                                  <button
                                    onClick={() => setViewingRecord(item)}
                                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Просмотреть полный акт отчёта"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit Button */}
                                  <button
                                    onClick={() => setEditingRecord(item)}
                                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Редактировать название и параметры"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeleteSingle(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Удалить проверку"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Export PDF Button */}
                                  <button
                                    onClick={() => downloadReportPdf(item)}
                                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Печать / Скачать PDF акта ОКК"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Edit Audit Record */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                Редактирование записи {editingRecord.id}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Код проверки (ID)
                </label>
                <input
                  type="text"
                  value={editingRecord.id}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, id: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Дата и время
                </label>
                <input
                  type="text"
                  value={editingRecord.date}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, date: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Компания / Бренд
                </label>
                <input
                  type="text"
                  value={editingRecord.brand}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, brand: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Название Филиала
                </label>
                <input
                  type="text"
                  value={editingRecord.branch}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      branch: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  ФИО Сотрудника
                </label>
                <input
                  type="text"
                  value={editingRecord.employeeCode}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      employeeCode: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Группа / Регион
                </label>
                <input
                  type="text"
                  value={editingRecord.group || ""}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      group: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1 font-semibold">
                  Формат проверки
                </label>
                <select
                  value={editingRecord.checkType}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      checkType: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Полная проверка с контрольной закупкой">
                    1. Полная проверка с контрольной закупкой
                  </option>
                  <option value="Mystery shopper / Оценка BPV (Без покупки)">
                    2. Mystery shopper / Оценка BPV (Без покупки)
                  </option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Move Records */}
      {movingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Move className="w-5 h-5 text-amber-400" />
                Перемещение проверок ({selectedIds.length})
              </h3>
              <button
                onClick={() => setMovingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Выберите существующую группу или создайте новую для выбранных элементов.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Целевая группа
                </label>
                <select
                  value={targetGroupForMove}
                  onChange={(e) => setTargetGroupForMove(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Выберите группу --</option>
                  {existingGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                  <option value="__NEW__">+ Создать новую группу...</option>
                </select>
              </div>

              {targetGroupForMove === "__NEW__" && (
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">
                    Название новой группы
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Западный филиал Q3"
                    value={customNewGroup}
                    onChange={(e) => setCustomNewGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                onClick={() => setMovingModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={handleMoveSelectedToGroup}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-600/20"
              >
                Переместить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Record */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                Новая запись в реестр
              </h3>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Номер (ID)
                </label>
                <input
                  type="text"
                  value={newRecordData.id}
                  onChange={(e) =>
                    setNewRecordData({ ...newRecordData, id: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Филиал
                </label>
                <input
                  type="text"
                  value={newRecordData.branch}
                  onChange={(e) =>
                    setNewRecordData({
                      ...newRecordData,
                      branch: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Сотрудник
                </label>
                <input
                  type="text"
                  value={newRecordData.employeeCode}
                  onChange={(e) =>
                    setNewRecordData({
                      ...newRecordData,
                      employeeCode: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Группа
                </label>
                <input
                  type="text"
                  value={newRecordData.group}
                  onChange={(e) =>
                    setNewRecordData({
                      ...newRecordData,
                      group: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Бренд
                </label>
                <input
                  type="text"
                  value={newRecordData.brand}
                  onChange={(e) =>
                    setNewRecordData({
                      ...newRecordData,
                      brand: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Тип проверки
                </label>
                <select
                  value={newRecordData.checkType}
                  onChange={(e) =>
                    setNewRecordData({
                      ...newRecordData,
                      checkType: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Полная проверка с контрольной закупкой">
                    1. Контрольная закупка
                  </option>
                  <option value="Mystery shopper / Оценка BPV (Без покупки)">
                    2. Mystery shopper
                  </option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateNewRecord}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20"
              >
                Добавить в реестр
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Подтверждение удаления
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {deleteConfirmModal.type === "single"
                    ? `Вы действительно хотите удалить проверку ${deleteConfirmModal.id}?`
                    : `Вы действительно хотите удалить ${selectedIds.length} выбранных проверок из реестра?`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              ⚠️ Это действие безвозвратно удалит выбранную запись и связанные данные из локального реестра.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: "single" })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить безвозвратно</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Full Audit Report */}
      {viewingRecord && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header Toolbar */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>АКТ ОКК: {viewingRecord.id}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                      {viewingRecord.brand} — {viewingRecord.branch}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Сотрудник: {viewingRecord.employeeCode} | Проверяющий: {viewingRecord.inspector} | Дата: {viewingRecord.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadReportPdf(viewingRecord)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Скачать PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Закрыть Акт (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Approval Process Panel (Process fields, comments, and history) */}
              <ApprovalWorkflowPanel
                record={viewingRecord}
                currentUser={currentUser}
                onUpdateRecord={handleUpdateRecordInRegistry}
                onNotificationSent={onNotificationCreated}
              />

              {/* Optional Report Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowFullReportInModal(!showFullReportInModal)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-2 py-2 px-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {showFullReportInModal
                      ? "Скрыть детальный текстовый отчет ОКК"
                      : "Показать детальный текстовый отчет ОКК"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFullReportInModal ? "rotate-180" : ""}`} />
                </button>
              </div>

              {showFullReportInModal && (
                <AuditReportView
                  report={viewingRecord.fullReportText || buildFullReportMarkdown(viewingRecord)}
                  isAnalyzing={false}
                  auditData={{
                    id: viewingRecord.id,
                    date: viewingRecord.date,
                    brand: viewingRecord.brand,
                    branch: viewingRecord.branch,
                    city: viewingRecord.city,
                    employeeCode: viewingRecord.employeeCode,
                    inspector: viewingRecord.inspector,
                    manager: viewingRecord.manager,
                    checkType: viewingRecord.checkType,
                    bpvScore: viewingRecord.bpvScore,
                    speechScore: viewingRecord.speechScore,
                    salesDriveScore: viewingRecord.salesDriveScore,
                    approvalStatus: viewingRecord.approvalStatus,
                    approvalHistory: viewingRecord.approvalHistory,
                    managerComment: viewingRecord.managerComment,
                    auditorRevisionComment: viewingRecord.auditorRevisionComment,
                    approvedAt: viewingRecord.approvedAt,
                    approvedBy: viewingRecord.approvedBy,
                    category: "Консультация",
                    target: "Оценка BPV",
                    result: "Завершено",
                    comment: "",
                    standards: "",
                  }}
                  onReset={handleCloseModal}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-mono">
                АКТ ОКК: {viewingRecord.id} • {viewingRecord.brand}
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 cursor-pointer flex items-center gap-2 shadow-md"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>Закрыть окно просмотра</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
