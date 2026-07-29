import React, { useState } from "react";
import { AuditRecord } from "../types";
import { getKpiCoefficient } from "../utils/auditCalculator";
import { X, Download, FileText, Calendar, Building2, BarChart2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface MonthlySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  audits: AuditRecord[];
  auditorName: string;
}

export const MonthlySummaryModal: React.FC<MonthlySummaryModalProps> = ({
  isOpen,
  onClose,
  audits,
  auditorName,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  if (!isOpen) return null;

  // Filter audits for the month
  const monthAudits = audits.filter((a) => {
    const aMonth = a.month || (a.date ? a.date.slice(0, 7) : "");
    return aMonth === selectedMonth;
  });

  const finalValidAudits = monthAudits.filter((a) =>
    a.approvalStatus === "APPROVED" ||
    a.approvalStatus === "APPROVED_WITH_COMMENT" ||
    a.approvalStatus === "FINALIZED_NO_SCORE_CHANGE" ||
    a.approvalStatus === "FINALIZED_WITH_SCORE_CHANGE"
  );

  const invalidAudits = monthAudits.filter((a) => a.approvalStatus as any === "INVALID");

  const filteredAudits = selectedBrand === "all"
    ? finalValidAudits
    : finalValidAudits.filter((a) => a.brand === selectedBrand);

  // Group by brand
  const brandStats: Record<string, { count: number; totalBpv: number; totalCash: number; cashCount: number; totalSales: number; criticalCount: number }> = {};
  filteredAudits.forEach((a) => {
    const b = a.brand || "Другие";
    if (!brandStats[b]) {
      brandStats[b] = { count: 0, totalBpv: 0, totalCash: 0, cashCount: 0, totalSales: 0, criticalCount: 0 };
    }
    brandStats[b].count += 1;
    brandStats[b].totalBpv += a.bpvScore || 0;
    if (typeof a.cashScore === "number") {
      brandStats[b].totalCash += a.cashScore;
      brandStats[b].cashCount += 1;
    }
    brandStats[b].totalSales += a.salesDriveScore || 0;
    brandStats[b].criticalCount += a.stopFactors || 0;
  });

  const avgBpv = filteredAudits.length > 0
    ? Math.round((filteredAudits.reduce((acc, curr) => acc + (curr.bpvScore || 0), 0) / filteredAudits.length) * 10) / 10
    : 0;

  const kpiCoef = getKpiCoefficient(avgBpv);

  const handleExportCsv = () => {
    const headers = ["ID", "Номер", "Дата", "Месяц", "Бренд", "Город", "Филиал", "Консультант", "BPV %", "Cash %", "Sales Drivers %", "Критич. нарушения", "Статус", "KPI Коэф"];
    const rows = filteredAudits.map((a) => [
      a.id,
      a.sourceAuditId || a.id,
      a.date,
      a.month || selectedMonth,
      `"${a.brand}"`,
      `"${a.city}"`,
      `"${a.branch}"`,
      `"${a.employeeCode}"`,
      a.bpvScore,
      a.cashScore !== undefined ? a.cashScore : "N/A",
      a.salesDriveScore,
      a.stopFactors || 0,
      a.approvalStatus,
      getKpiCoefficient(a.bpvScore),
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Monthly_Summary_OKK_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Ежемесячный сводный отчёт ОКК</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedMonth}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Формирование официального отчёта за месяц для руководства компании
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать CSV / Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Month Selector & Controls */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-300">Месяц проверки:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">
              Валидных проверок: <strong className="text-white">{finalValidAudits.length}</strong>
            </span>
            <span className="text-slate-400">
              Аннулировано (INVALID): <strong className="text-red-400">{invalidAudits.length}</strong>
            </span>
            <span className="text-slate-400">
              Сформировал: <strong className="text-indigo-400">{auditorName}</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">СРЕДНИЙ BPV (СЕРВИС)</div>
              <div className="text-2xl font-black text-white my-1">{avgBpv}%</div>
              <div className="text-[10px] text-slate-400">Целевой показатель ≥85%</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">КОЭФФИЦИЕНТ KPI</div>
              <div className="text-2xl font-black text-indigo-400 my-1">{kpiCoef}</div>
              <div className="text-[10px] text-slate-400">Диапазон 0.6 – 1.2</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">ВСЕГО ПРОВЕРОК</div>
              <div className="text-2xl font-black text-emerald-400 my-1">{filteredAudits.length}</div>
              <div className="text-[10px] text-slate-400">Принято в итоговый свод</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">СТОП-ФАКТОРЫ (0%)</div>
              <div className="text-2xl font-black text-red-400 my-1">
                {filteredAudits.filter((a) => (a.stopFactors || 0) > 0 || a.bpvScore === 0).length}
              </div>
              <div className="text-[10px] text-slate-400">Критические нарушения</div>
            </div>
          </div>

          {/* Breakdown By Brand */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Сводные показатели по брендам ({Object.keys(brandStats).length})</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Бренд</th>
                    <th className="p-2.5 text-center">Проверок</th>
                    <th className="p-2.5 text-center">Средний BPV</th>
                    <th className="p-2.5 text-center">CASH Index</th>
                    <th className="p-2.5 text-center">Sales Drivers</th>
                    <th className="p-2.5 text-center">Крит. Нарушения</th>
                    <th className="p-2.5 text-center">KPI Коэф</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.entries(brandStats).map(([brandName, stats]) => {
                    const bBpv = stats.count > 0 ? Math.round((stats.totalBpv / stats.count) * 10) / 10 : 0;
                    const bCash = stats.cashCount > 0 ? `${Math.round(stats.totalCash / stats.cashCount)}%` : "N/A";
                    const bSales = stats.count > 0 ? Math.round((stats.totalSales / stats.count) * 10) / 10 : 0;
                    const bKpi = getKpiCoefficient(bBpv);

                    return (
                      <tr key={brandName} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-2.5 font-bold text-white">{brandName}</td>
                        <td className="p-2.5 text-center">{stats.count}</td>
                        <td className="p-2.5 text-center font-semibold text-emerald-400">{bBpv}%</td>
                        <td className="p-2.5 text-center font-medium">{bCash}</td>
                        <td className="p-2.5 text-center text-blue-400">{bSales}%</td>
                        <td className="p-2.5 text-center font-semibold text-red-400">{stats.criticalCount}</td>
                        <td className="p-2.5 text-center font-bold text-indigo-400">{bKpi}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
