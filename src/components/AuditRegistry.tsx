import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { exportAuditReportToPdf } from "../utils/pdfExport";

export interface AuditRecord {
  id: string;
  date: string;
  brand: string;
  branch: string;
  city: string;
  group?: string; // e.g. "Филиалы Кишинева", "Северный регион", "VIP Клиенты"
  checkType: "1. Контрольная закупка" | "2. Mystery shopper (без покупки)" | string;
  employeeCode: string;
  inspector: string;
  bpvScore: number;
  cashScore?: number;
  speechScore: number;
  salesDriveScore: number;
  stopFactors: number;
  reportSummary: string;
  fullReportText?: string;
  audioFileName?: string;
  audioUrl?: string;
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
    bpvScore: 100,
    cashScore: 100,
    speechScore: 98,
    salesDriveScore: 100,
    stopFactors: 0,
    reportSummary: "Идеальное выполнение стандартов BPV, безупречный диалог с клиентом и эффективный Cross-sell сопутствующих товаров.",
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
    bpvScore: 88.5,
    cashScore: 100,
    speechScore: 85,
    salesDriveScore: 25.0,
    stopFactors: 0,
    reportSummary: "Высокое качество презентации и работы с сомнениями. Пропуск инициативного Cross-sell аксессуаров до оплаты.",
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
    bpvScore: 91.5,
    cashScore: 100,
    speechScore: 92,
    salesDriveScore: 100,
    stopFactors: 0,
    reportSummary: "Отличный диалоговый баланс, подробная презентация характеристик товара и предложение сервисных пакетов.",
  },
  {
    id: "AUD-2026-004",
    date: "23.07.2026",
    brand: "ТехноМир Pro",
    branch: "ТЦ Центральный, 1 эт.",
    city: "Москва",
    group: "Северный регион",
    checkType: "2. Mystery shopper (без покупки)",
    employeeCode: "Иванов Алексей",
    inspector: "MS-007 (Елена К.)",
    bpvScore: 95.0,
    cashScore: 100,
    speechScore: 96,
    salesDriveScore: 80.0,
    stopFactors: 0,
    reportSummary: "Экспертная консультация без покупки. Сотрудник отлично отработал воронку вопросов и выявил скрытые задачи.",
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
    bpvScore: 78.0,
    cashScore: 100,
    speechScore: 74,
    salesDriveScore: 50.0,
    stopFactors: 1,
    reportSummary: "Зафиксировано использование закрытых вопросов и отсутствие выявления потребностей в начале разговора.",
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
    bpvScore: 92.0,
    cashScore: 100,
    speechScore: 90,
    salesDriveScore: 85.0,
    stopFactors: 0,
    reportSummary: "Высокая культура обслуживания, грамотная речевая аналитика и соблюдение порядка заполнения документов.",
  },
];

interface AuditRegistryProps {
  records: AuditRecord[];
  onUpdateRecords: (records: AuditRecord[]) => void;
  onViewRecordDetail?: (record: AuditRecord) => void;
}

export function AuditRegistry({
  records,
  onUpdateRecords,
  onViewRecordDetail,
}: AuditRegistryProps) {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheckType, setSelectedCheckType] = useState<string>("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL"); // "ALL" | "TODAY" | "THIS_MONTH" | "CUSTOM"
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [groupBy, setGroupBy] = useState<"none" | "group" | "brand" | "checkType" | "city" | "date" | "employee" | "inspector">("group");

  // Helper to download report as PDF document matching official audit act
  const downloadReportPdf = (item: AuditRecord) => {
    const reportContent =
      item.fullReportText ||
      `# АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)\n\n## 1. ПАСПОРТ ПРОВЕРКИ\n- **Компания / Филиал:** ${item.brand} | ${item.branch}\n- **Сотрудник:** ${item.employeeCode}\n- **Группа:** ${item.group || "Стандарт"}\n- **Аудитор:** ${item.inspector}\n- **Формат проверки:** ${item.checkType}\n\n## 2. СВОДНЫЕ ПОКАЗАТЕЛИ\n- **BPV INDEX (СЕРВИС):** ${item.bpvScore}%\n- **РЕЧЕВОЙ ИНДЕКС:** ${item.speechScore ?? 90}%\n- **SALES DRIVE (ПРОДАЖИ):** ${item.salesDriveScore}%\n- **КРИТИЧЕСКИЕ НАРУШЕНИЯ:** ${item.stopFactors}\n\n## 3. ЗАКЛЮЧЕНИЕ И АНАЛИЗ ПРОВЕРКИ\n${item.reportSummary}`;

    exportAuditReportToPdf({
      title: "АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)",
      brand: item.brand,
      branch: item.branch,
      date: item.date,
      checkType: item.checkType,
      employeeCode: item.employeeCode,
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

  // Available unique groups for dropdowns
  const existingGroups = Array.from(
    new Set(records.map((r) => r.group || "Без группы"))
  );

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

  // Filter records by search, checkType, and date
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.date && rec.date.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.group && rec.group.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      selectedCheckType === "ALL" || rec.checkType === selectedCheckType;

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

    return matchesSearch && matchesType && matchesDate;
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

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCheckType}
              onChange={(e) => setSelectedCheckType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Все типы проверок</option>
              <option value="1. Контрольная закупка">
                1. Контрольная закупка
              </option>
              <option value="2. Mystery shopper (без покупки)">
                2. Mystery shopper (без покупки)
              </option>
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
              onClick={() => setGroupBy("group")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                groupBy === "group"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Группам/Регионам
            </button>
            <button
              onClick={() => setGroupBy("date")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                groupBy === "date"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Дате
            </button>
            <button
              onClick={() => setGroupBy("employee")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                groupBy === "employee"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3 h-3" />
              Сотрудникам
            </button>
            <button
              onClick={() => setGroupBy("inspector")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                groupBy === "inspector"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserCheck className="w-3 h-3" />
              Проверяющим
            </button>
            <button
              onClick={() => setGroupBy("brand")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                groupBy === "brand"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Брендам
            </button>
            <button
              onClick={() => setGroupBy("checkType")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                groupBy === "checkType"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Типу
            </button>
            <button
              onClick={() => setGroupBy("city")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                groupBy === "city"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Городам
            </button>
            <button
              onClick={() => setGroupBy("none")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                groupBy === "none"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Без группировки
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

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-800/40 transition-colors ${
                                isSelected ? "bg-blue-500/10" : ""
                              }`}
                            >
                              <td className="py-3 px-4 text-center">
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

                              <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                                <div className="font-semibold text-slate-200">
                                  {item.id}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {item.date}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-semibold text-white">
                                  {item.branch}
                                </div>
                                <div className="text-slate-400 text-[11px]">
                                  {item.brand} ({item.city})
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-medium text-slate-200">
                                  {item.employeeCode}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <UserCheck className="w-3 h-3 text-blue-400" />
                                  <span>{item.inspector}</span>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-md border border-slate-700">
                                  <Tag className="w-3 h-3 text-amber-400" />
                                  {item.group || "Без группы"}
                                </span>
                              </td>

                              <td className="py-3 px-3">
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

                              <td className="py-3 px-3 text-center font-bold">
                                <span
                                  className={
                                    item.bpvScore >= 85
                                      ? "text-emerald-400"
                                      : "text-amber-400"
                                  }
                                >
                                  {item.bpvScore}%
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center font-bold">
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

                              <td className="py-3 px-3 text-center font-bold">
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
                              <td className="py-3 px-3">
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
    </div>
  );
}
