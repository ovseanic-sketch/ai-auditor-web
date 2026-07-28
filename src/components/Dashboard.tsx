import React, { useState } from "react";
import { getMonthNameFromDate } from "../utils/monthUtils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Award,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Layers,
  Users,
  UserCheck,
  X,
  FileText,
  Mic,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FolderTree,
} from "lucide-react";
import { AuditFormData, UserAccount, AuditRecord } from "../types";
import { exportAuditReportToPdf } from "../utils/pdfExport";
import { isAuditBelongsToManager } from "../utils/brandAccess";

// Initial realistic dataset for the executive OKK dashboard
export const MOCK_AUDIT_HISTORY: AuditRecord[] = [
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
    approvalStatus: "APPROVED",
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
    approvalStatus: "APPROVED_WITH_COMMENTS",
    reportSummary: "Высокое качество презентации и работы с возражениями. Пропуск инициативного Cross-sell аксессуаров до оплаты.",
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
    approvalStatus: "APPROVED",
    reportSummary: "Отличный диалоговый баланс, подробная презентация характеристик товара и предложение сервисных пакетов.",
  },
  {
    id: "AUD-2026-004",
    date: "23.07.2026",
    brand: "Enter",
    branch: "Центр (бул. Штефан чел Маре, 136)",
    city: "Кишинёв",
    group: "Центральный регион",
    checkType: "2. Mystery shopper (без покупки)",
    employeeCode: "Иванов Алексей",
    inspector: "MS-007 (Елена К.)",
    bpvScore: 95.0,
    cashScore: 100,
    speechScore: 96,
    salesDriveScore: 80.0,
    stopFactors: 0,
    approvalStatus: "FINALIZED",
    reportSummary: "Экспертная консультация без покупки. Сотрудник отлично отработал воронку вопросов и выявил скрытые задачи.",
  },
  {
    id: "AUD-2026-005",
    date: "19.07.2026",
    brand: "Darwin",
    branch: "Бельцы (ул. Штефан чел Маре, 57)",
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
    approvalStatus: "REVISION_REQUESTED",
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
    approvalStatus: "APPROVED",
    reportSummary: "Высокая культура обслуживания, грамотная речевая аналитика и соблюдение порядка заполнения документов.",
  },
];

interface DashboardProps {
  recentAudits?: AuditRecord[];
  currentUser?: UserAccount | null;
  onSelectAuditForView?: (audit: AuditRecord) => void;
}

export function Dashboard({ recentAudits = MOCK_AUDIT_HISTORY, currentUser, onSelectAuditForView }: DashboardProps) {
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("ALL");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("ALL");
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>("ALL");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("ALL");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("ALL");
  const [selectedCheckTypeFilter, setSelectedCheckTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Date filters
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Metrics filters
  const [bpvFilter, setBpvFilter] = useState<string>("ALL"); // "ALL" | "PASS" | "FAIL"
  const [speechFilter, setSpeechFilter] = useState<string>("ALL"); // "ALL" | "PASS" | "FAIL"
  const [salesDriveFilter, setSalesDriveFilter] = useState<string>("ALL"); // "ALL" | "PASS" | "FAIL"
  const [stopFactorsFilter, setStopFactorsFilter] = useState<string>("ALL"); // "ALL" | "NONE" | "HAS_STOP"

  // Stop factors modal state
  const [isStopFactorsModalOpen, setIsStopFactorsModalOpen] = useState(false);
  const [selectedStopAudit, setSelectedStopAudit] = useState<AuditRecord | null>(null);

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

  // Base user-accessible audits:
  // REQUIREMENT: In dashboards, ONLY data of audits that passed the full approval cycle must be displayed!
  // (Passed full approval cycle = approvalStatus is "APPROVED", "APPROVED_WITH_COMMENTS", or "FINALIZED")
  const userAccessibleAudits = recentAudits.filter((a) => {
    const isApproved =
      a.approvalStatus === "APPROVED" ||
      a.approvalStatus === "APPROVED_WITH_COMMENTS" ||
      a.approvalStatus === "FINALIZED";
    return isApproved && isAuditBelongsToManager(a, currentUser);
  });

  // Get unique filter values from accessible audits
  const uniqueBrands = Array.from(new Set(userAccessibleAudits.map((a) => a.brand).filter(Boolean)));
  const uniqueRegions = Array.from(new Set(userAccessibleAudits.map((a) => a.group || (a as any).region).filter(Boolean)));
  const uniqueManagers = Array.from(new Set(userAccessibleAudits.map((a) => a.manager).filter(Boolean)));
  const uniqueCities = Array.from(new Set(userAccessibleAudits.map((a) => a.city).filter(Boolean)));
  const uniqueMonths = Array.from(
    new Set(
      userAccessibleAudits
        .map((a) => a.month || getMonthNameFromDate(a.date))
        .filter(Boolean)
    )
  );

  // Filtered audits list
  const filteredAudits = userAccessibleAudits.filter((item) => {
    const matchesBrand = selectedBrandFilter === "ALL" || item.brand === selectedBrandFilter;
    const matchesRegion = selectedRegionFilter === "ALL" || (item.group || (item as any).region) === selectedRegionFilter;
    const matchesManager = selectedManagerFilter === "ALL" || item.manager === selectedManagerFilter;
    const matchesCity = selectedCityFilter === "ALL" || item.city === selectedCityFilter;
    const itemMonth = item.month || getMonthNameFromDate(item.date);
    const matchesMonth = selectedMonthFilter === "ALL" || itemMonth === selectedMonthFilter;
    
    // Check type matching flexible
    let matchesCheckType = true;
    if (selectedCheckTypeFilter !== "ALL") {
      matchesCheckType = item.checkType.toLowerCase().includes(selectedCheckTypeFilter.toLowerCase());
    }

    const matchesSearch =
      item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.inspector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.manager && item.manager.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.group && item.group.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.date && item.date.toLowerCase().includes(searchQuery.toLowerCase()));

    // Date filtering
    let matchesDate = true;
    const recDate = parseDateString(item.date);

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

    // Metrics filtering
    let matchesMetrics = true;

    if (bpvFilter === "PASS" && item.bpvScore < 90) matchesMetrics = false;
    if (bpvFilter === "FAIL" && item.bpvScore >= 90) matchesMetrics = false;

    if (speechFilter === "PASS" && (item.speechScore ?? 90) < 90) matchesMetrics = false;
    if (speechFilter === "FAIL" && (item.speechScore ?? 90) >= 90) matchesMetrics = false;

    if (salesDriveFilter === "PASS" && item.salesDriveScore < 90) matchesMetrics = false;
    if (salesDriveFilter === "FAIL" && item.salesDriveScore >= 90) matchesMetrics = false;

    if (stopFactorsFilter === "NONE" && item.stopFactors > 0) matchesMetrics = false;
    if (stopFactorsFilter === "HAS_STOP" && item.stopFactors === 0) matchesMetrics = false;

    return matchesBrand && matchesRegion && matchesManager && matchesCity && matchesMonth && matchesCheckType && matchesSearch && matchesDate && matchesMetrics;
  });

  // Calculate Average Metrics
  const totalAudits = filteredAudits.length;
  const avgBpv = totalAudits > 0 ? (filteredAudits.reduce((acc, curr) => acc + curr.bpvScore, 0) / totalAudits).toFixed(1) : "0.0";
  const avgSpeech = totalAudits > 0 ? (filteredAudits.reduce((acc, curr) => acc + (curr.speechScore ?? 90), 0) / totalAudits).toFixed(1) : "0.0";
  const avgSalesDrive = totalAudits > 0 ? (filteredAudits.reduce((acc, curr) => acc + curr.salesDriveScore, 0) / totalAudits).toFixed(1) : "0.0";
  const totalStopFactors = filteredAudits.reduce((acc, curr) => acc + curr.stopFactors, 0);

  // Distribution of Check Types for Donut Chart
  const fullPurchaseCount = filteredAudits.filter((a) => a.checkType.toLowerCase().includes("закупка") || a.checkType.toLowerCase().includes("1")).length;
  const mysteryShopperCount = filteredAudits.filter((a) => a.checkType.toLowerCase().includes("mystery") || a.checkType.toLowerCase().includes("2")).length;

  const pieData = [
    { name: "Контрольная закупка", value: fullPurchaseCount, color: "#10b981" },
    { name: "Mystery Shopper (без покупки)", value: mysteryShopperCount, color: "#3b82f6" },
  ];

  // Performance Trend Data by Date / Audit ID
  const trendChartData = filteredAudits.map((a) => ({
    name: `${a.date ? a.date.split(".")[0] + "." + (a.date.split(".")[1] || "") : a.id} ${a.branch.split(" ")[0]}`,
    "BPV Index (Сервис)": a.bpvScore,
    "Речевой индекс": a.speechScore ?? 90,
    "Sales Drive (Продажи)": a.salesDriveScore,
  }));

  // Funnel Standards Compliance (Calculated dynamically; returns 0% when no audits exist)
  const baseBpvScore = totalAudits > 0 ? Number(avgBpv) : 0;
  const standardsBreakdownData = [
    { stage: "1. Контакт", weight: 1.02 },
    { stage: "2. Потребности", weight: 0.96 },
    { stage: "3. Презентация", weight: 0.99 },
    { stage: "4. Возражения", weight: 0.94 },
    { stage: "5. Диалог/Скрипт", weight: 1.00 },
    { stage: "6. Cross-sell", weight: 0.82 },
    { stage: "7. Завершение", weight: 1.03 },
  ].map((st) => ({
    stage: st.stage,
    score: totalAudits === 0 ? 0 : Math.min(100, Math.max(0, Math.round(baseBpvScore * st.weight))),
  }));

  const handleExportQuickPdf = (item: AuditRecord) => {
    exportAuditReportToPdf({
      title: "АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)",
      brand: item.brand,
      branch: item.branch,
      date: item.date,
      checkType: item.checkType,
      employeeCode: item.employeeCode,
      reportContent: `# АКТ ОЦЕНКИ КАЧЕСТВА ОБСЛУЖИВАНИЯ (ОКК)\n\n## 1. ПАСПОРТ ПРОВЕРКИ\n- **Компания / Филиал:** ${item.brand} | ${item.branch}\n- **Сотрудник:** ${item.employeeCode}\n- **Аудитор:** ${item.inspector}\n- **Формат проверки:** ${item.checkType}\n\n## 2. СВОДНЫЕ ПОКАЗАТЕЛИ\n- **BPV INDEX (СЕРВИС):** ${item.bpvScore}%\n- **РЕЧЕВОЙ ИНДЕКС:** ${item.speechScore ?? 90}%\n- **SALES DRIVE (ПРОДАЖИ):** ${item.salesDriveScore}%\n- **КРИТИЧЕСКИЕ НАРУШЕНИЯ:** ${item.stopFactors}\n\n## 3. ЗАКЛЮЧЕНИЕ ПРОВЕРКИ\n${item.reportSummary}`,
    });
  };

  return (
    <div id="okk-executive-dashboard" className="space-y-6 animate-fadeIn">
      {/* Top Banner & Main Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-500/20 uppercase tracking-wider">
                Панель аналитики ОКК
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Отображаются только полностью утвержденные анкеты
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Сводный дашборд стандартов BPV и Контрольных Закупок
            </h2>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по филиалу, сотруднику, проверяющему..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-80"
            />
          </div>
        </div>

        {/* Filter Controls Bar: Brands, Regions, Managers, Cities, Check Types, Date, Metrics */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              Фильтры:
            </span>

            {/* Brand Filter */}
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
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
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
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
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
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
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Все города</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-slate-950 border border-indigo-500/30 text-indigo-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="ALL">Все месяцы</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Check Type Filter */}
            <select
              value={selectedCheckTypeFilter}
              onChange={(e) => setSelectedCheckTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Все типы проверок</option>
              <option value="Контрольная закупка">1. Контрольная закупка</option>
              <option value="Mystery shopper">2. Mystery Shopper (без покупки)</option>
            </select>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400 ml-1" />
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Все даты</option>
                <option value="TODAY">За сегодня</option>
                <option value="THIS_MONTH">За этот месяц</option>
                <option value="CUSTOM">Период (С - По)</option>
              </select>

              {selectedDateFilter === "CUSTOM" && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs px-1.5 py-0.5 focus:outline-none"
                  />
                  <span className="text-slate-500 text-xs">—</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs px-1.5 py-0.5 focus:outline-none"
                  />
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="text-slate-400 hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metric Filters: BPV, Cash, Sales Drive, Stop Factors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Итоговые показатели:
            </span>

            {/* BPV Filter */}
            <select
              value={bpvFilter}
              onChange={(e) => setBpvFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">BPV Index: Все</option>
              <option value="PASS">BPV ≥ 90% (Высокий)</option>
              <option value="FAIL">BPV &lt; 90% (Низкий)</option>
            </select>

            {/* Speech Filter */}
            <select
              value={speechFilter}
              onChange={(e) => setSpeechFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Речевой индекс: Все</option>
              <option value="PASS">Речевой ≥ 90% (Высокий)</option>
              <option value="FAIL">Речевой &lt; 90% (Низкий)</option>
            </select>

            {/* Sales Drive Filter */}
            <select
              value={salesDriveFilter}
              onChange={(e) => setSalesDriveFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Sales Drive: Все</option>
              <option value="PASS">Sales Drive ≥ 90%</option>
              <option value="FAIL">Sales Drive &lt; 90%</option>
            </select>

            {/* Stop Factors Filter */}
            <select
              value={stopFactorsFilter}
              onChange={(e) => setStopFactorsFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Стоп-факторы: Все</option>
              <option value="NONE">Без нарушений (0)</option>
              <option value="HAS_STOP">Есть нарушения (&gt;0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Primary Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: BPV Index */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              BPV Index (Сервис)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{avgBpv}%</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Number(avgBpv) >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400"}`}>
              Цель ≥90%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Средняя соблюдаемость стандартов продаж</p>
        </div>

        {/* Metric 2: Speech Index */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Речевой индекс
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Mic className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">{avgSpeech}%</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Цель ≥90%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Качество диалога, скриптов и речи</p>
        </div>

        {/* Metric 3: Sales Drive */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sales Drive (Продажи)
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{avgSalesDrive}%</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Number(avgSalesDrive) >= 90 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
              Цель ≥90%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Допродажи (Cross-sell) и услуги</p>
        </div>

        {/* Metric 4: Stop Factors */}
        <div
          onClick={() => setIsStopFactorsModalOpen(true)}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/60 transition-all cursor-pointer shadow-lg hover:shadow-red-950/20"
          title="Нажмите, чтобы посмотреть подробности по зафиксированным стоп-факторам"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Стоп-факторы
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${totalStopFactors === 0 ? "text-slate-200" : "text-red-400"}`}>
              {totalStopFactors}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${totalStopFactors === 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400 animate-pulse"}`}>
              {totalStopFactors === 0 ? "Нарушений нет" : "Требует внимания"}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60">
            <p className="text-[11px] text-slate-500">Критически нерегламентные действия</p>
            <span className="text-[11px] text-red-400 font-semibold underline flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
              Детали ➔
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart: Performance Dynamics by Branch */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Динамика индексов ОКК по филиалам (%)
              </h3>
            </div>
            <span className="text-xs text-slate-500">Показатели BPV, Речевого индекса и Sales Drive</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                  formatter={(value: any) => [`${value}%`]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="BPV Index (Сервис)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Речевой индекс" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sales Drive (Продажи)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Distribution of Check Types */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Типы проверок
              </h3>
            </div>
            <span className="text-xs text-slate-500">{totalAudits} проверок</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300 font-medium truncate max-w-[170px]">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value} шт.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage-by-Stage Standards Compliance Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Средний процент соблюдения стандартов BPV по этапам
            </h3>
            <p className="text-xs text-slate-400">Глубокий анализ выполнения воронки консультации и обслуживания</p>
          </div>
          <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-lg">
            7 этапов BPV
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
          {standardsBreakdownData.map((st, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block truncate">{st.stage}</span>
              <div className="relative inline-flex items-center justify-center">
                <span className={`text-lg font-black ${st.score >= 90 ? "text-emerald-400" : st.score >= 80 ? "text-amber-400" : "text-red-400"}`}>
                  {st.score}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${st.score >= 90 ? "bg-emerald-500" : st.score >= 80 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${st.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Реестр проверок ОКК</span>
            </h3>
            <p className="text-xs text-slate-400">История зафиксированных протоколов с аналитикой показателей</p>
          </div>
          <span className="text-xs text-slate-500">Найдено: {filteredAudits.length} из {userAccessibleAudits.length}</span>
        </div>

        {filteredAudits.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-800">
            Нет проверок, соответствующих выбранным критериям фильтрации
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                  <th className="py-3 px-3">Код / Дата</th>
                  <th className="py-3 px-3">Бренд и Филиал</th>
                  <th className="py-3 px-3">Сотрудник / Аудитор</th>
                  <th className="py-3 px-3">Тип проверки</th>
                  <th className="py-3 px-3 text-center">BPV Index</th>
                  <th className="py-3 px-3 text-center">Речевой индекс</th>
                  <th className="py-3 px-3 text-center">Sales Drive</th>
                  <th className="py-3 px-3 text-center">Стоп-факторы</th>
                  <th className="py-3 px-3 text-right">Экспорт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredAudits.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{item.id}</div>
                      <div className="text-[10px] text-slate-500">{item.date}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{item.brand}</div>
                      <div className="text-slate-400 text-[11px]">{item.branch} ({item.city})</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{item.employeeCode}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-blue-400" />
                        <span>{item.inspector}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.checkType.toLowerCase().includes("закупка") || item.checkType.includes("1")
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {item.checkType.toLowerCase().includes("закупка") || item.checkType.includes("1") ? "Контрольная закупка" : "Mystery Shopper"}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold">
                      <span className={item.bpvScore >= 90 ? "text-emerald-400" : "text-amber-400"}>
                        {item.bpvScore}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold">
                      <span className={(item.speechScore ?? 90) >= 90 ? "text-emerald-400" : "text-amber-400"}>
                        {item.speechScore ?? 90}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold">
                      <span className={item.salesDriveScore >= 90 ? "text-emerald-400" : "text-amber-400"}>
                        {item.salesDriveScore}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {item.stopFactors > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedStopAudit(item)}
                          className="inline-flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                          title="Нажмите, чтобы посмотреть подробное описание стоп-факторов"
                        >
                          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                          <span>{item.stopFactors}</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px] font-mono">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleExportQuickPdf(item)}
                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                        title="Скачать официальный PDF-акт"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Stop-Factors breakdown */}
      {(isStopFactorsModalOpen || selectedStopAudit) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedStopAudit
                      ? `Стоп-факторы проверки ${selectedStopAudit.id}`
                      : "Зафиксированные стоп-факторы и критические нарушения"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedStopAudit
                      ? `${selectedStopAudit.brand} • ${selectedStopAudit.branch} • Сотрудник: ${selectedStopAudit.employeeCode}`
                      : `Всего выявлено стоп-факторов: ${totalStopFactors}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsStopFactorsModalOpen(false);
                  setSelectedStopAudit(null);
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedStopAudit ? (
              /* Single audit detail view */
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{selectedStopAudit.branch}</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                      Стоп-факторы: {selectedStopAudit.stopFactors}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-500">Компания/Бренд:</span>{" "}
                      <span className="text-slate-200 font-medium">{selectedStopAudit.brand} ({selectedStopAudit.city})</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Дата проверки:</span>{" "}
                      <span className="text-slate-200 font-medium">{selectedStopAudit.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Сотрудник:</span>{" "}
                      <span className="text-slate-200 font-medium">{selectedStopAudit.employeeCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Аудитор:</span>{" "}
                      <span className="text-slate-200 font-medium">{selectedStopAudit.inspector}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Описание нерегламентного нарушения / заключения</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {selectedStopAudit.reportSummary || "Нарушение регламента обслуживания или правил BPV зафиксировано проверяющим."}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStopAudit(null)}
                    className="text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                  >
                    ← Ко всем стоп-факторам
                  </button>

                  <div className="flex gap-2">
                    {onSelectAuditForView && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAuditForView(selectedStopAudit);
                          setSelectedStopAudit(null);
                          setIsStopFactorsModalOpen(false);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl cursor-pointer transition-all"
                      >
                        Открыть полный акт
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStopAudit(null);
                        setIsStopFactorsModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* List of all stop factors */
              <div className="space-y-3">
                {userAccessibleAudits.filter((a) => a.stopFactors > 0).length === 0 ? (
                  <div className="text-center py-8 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs space-y-1">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-bold">Критически нерегламентных нарушений не зафиксировано (0 стоп-факторов)</p>
                    <p className="text-slate-400">Все проведенные проверки прошли без стоп-факторов.</p>
                  </div>
                ) : (
                  userAccessibleAudits
                    .filter((a) => a.stopFactors > 0)
                    .map((audit) => (
                      <div
                        key={audit.id}
                        onClick={() => setSelectedStopAudit(audit)}
                        className="bg-slate-950 hover:bg-slate-800/60 border border-red-500/30 rounded-xl p-3.5 space-y-2 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 font-bold">{audit.id}</span>
                            <span className="text-slate-200 font-semibold">{audit.branch}</span>
                            <span className="text-slate-500 text-[11px]">({audit.date})</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/40">
                            {audit.stopFactors} стоп-фактор(а)
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 flex items-center justify-between">
                          <span>Сотрудник: <strong className="text-white">{audit.employeeCode}</strong></span>
                          <span className="text-blue-400 group-hover:underline font-medium">Подробнее ➔</span>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          {audit.reportSummary || "Зафиксировано нерегламентное действие."}
                        </p>
                      </div>
                    ))
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsStopFactorsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

