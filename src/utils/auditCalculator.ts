import { SalesDriverItem, DisputedPointItem } from "../types";

export interface ChecklistCriterion {
  id: string;
  name: string;
  category: "store" | "consultant" | "cross_sell" | "cashier";
  maxPoints: number;
  status: "Соблюдено" | "Частично" | "Нарушено" | "Не возникло (N/A 10/10)" | "Не применимо (N/A)";
  earnedPoints: number;
  explanation?: string;
  quote?: string;
  timecode?: string;
  confidence?: "высокий" | "средний" | "низкий";
  source?: "аудио" | "анкета шоппера" | "корректировка проверяющего";
}

export interface AuditCalculationResult {
  checkType: string;
  totalEarnedPoints: number;
  maxApplicablePoints: number;
  bpvScore: number; // Percentage rounded to 1 decimal place
  cashIndex: number | "N/A"; // Percentage or N/A
  cashZeroed?: boolean;
  cashZeroReason?: string;
  salesDriveScore: number; // Percentage rounded to 1 decimal place
  criteria: ChecklistCriterion[];
  salesDrivers?: SalesDriverItem[];
  disputedPoints?: DisputedPointItem[];
  calculation?: {
    totalEarnedPoints: number;
    maxApplicablePoints: number;
    bpvScore: number;
    cashIndex: number | "N/A";
    cashZeroed?: boolean;
    cashZeroReason?: string;
  };
}

export interface CriterionSpec {
  id: string;
  name: string;
  category: "store" | "consultant" | "cross_sell" | "cashier";
  maxPointsControl: number; // For Control Purchase
  maxPointsMystery: number; // For Mystery Shopping
}

export const OFFICIAL_CRITERIA_SPECS: CriterionSpec[] = [
  {
    id: "contact_greeting",
    name: "1. Установление контакта и приветствие",
    category: "consultant",
    maxPointsControl: 40,
    maxPointsMystery: 40,
  },
  {
    id: "needs_discovery",
    name: "2. Выявление потребностей (воронка открытых вопросов)",
    category: "consultant",
    maxPointsControl: 35,
    maxPointsMystery: 35,
  },
  {
    id: "product_presentation",
    name: "3. Презентация товара (формула Х-С-В / выгода)",
    category: "consultant",
    maxPointsControl: 40,
    maxPointsMystery: 40,
  },
  {
    id: "handling_objections",
    name: "4. Работа с возражениями (если возникли)",
    category: "consultant",
    maxPointsControl: 10,
    maxPointsMystery: 10,
  },
  {
    id: "closing_conversion",
    name: "5. Конвертирование / Призыв к сделке (техники закрытия)",
    category: "consultant",
    maxPointsControl: 20,
    maxPointsMystery: 20,
  },
  {
    id: "cross_selling_accessories",
    name: "6. Кросс-продажи: Аксессуары к основному товару",
    category: "cross_sell",
    maxPointsControl: 10,
    maxPointsMystery: 0, // N/A in Mystery Shopping
  },
  {
    id: "cross_selling_services",
    name: "7. Кросс-продажи: Услуги, настройки, доп. гарантия",
    category: "cross_sell",
    maxPointsControl: 10,
    maxPointsMystery: 0, // N/A in Mystery Shopping
  },
  {
    id: "farewell_closing",
    name: "8. Завершение контакта и прощание с клиентом",
    category: "consultant",
    maxPointsControl: 30,
    maxPointsMystery: 20,
  },
  {
    id: "appearance_uniform",
    name: "9. Внешний вид, опрятность и бейдж консультанта",
    category: "consultant",
    maxPointsControl: 20,
    maxPointsMystery: 20,
  },
  {
    id: "store_discipline",
    name: "10. Дисциплина магазина и чистота торгового зала",
    category: "store",
    maxPointsControl: 20,
    maxPointsMystery: 20,
  },
  {
    id: "cash_discipline",
    name: "11. Кассовые операции и выдача фискального чека",
    category: "cashier",
    maxPointsControl: 0, // Diagnostic / Stop factor in Control Purchase
    maxPointsMystery: 0, // N/A in Mystery Shopping
  },
];

export const DEFAULT_SALES_DRIVERS: Omit<SalesDriverItem, "status" | "points" | "explanation">[] = [
  { id: "depth_of_needs", name: "1. Глубина выявления потребности", maxPoints: 2 },
  { id: "hidden_needs", name: "2. Выявление скрытой потребности", maxPoints: 2 },
  { id: "purchase_motive", name: "3. Понимание мотива покупки", maxPoints: 2 },
  { id: "personalization", name: "4. Персонализация решения", maxPoints: 2 },
  { id: "benefit_presentation", name: "5. Презентация через выгоду (Х+В)", maxPoints: 2 },
  { id: "model_comparison", name: "6. Сравнение вариантов и аргументация", maxPoints: 2 },
  { id: "argumentation_quality", name: "7. Качество и весомость аргументов", maxPoints: 2 },
  { id: "readiness_signals", name: "8. Работа с сигналами готовности", maxPoints: 2 },
  { id: "closing_technique_fit", name: "9. Уместность техники закрытия / призыва", maxPoints: 2 },
  { id: "next_step_offer", name: "10. Предложение следующего шага", maxPoints: 2 },
  { id: "retention_after_refusal", name: "11. Сохранение контакта/клиента при сомнениях", maxPoints: 2 },
  { id: "commercial_initiative", name: "12. Релевантная коммерческая инициатива", maxPoints: 2 },
];

/**
 * KPI Coefficient Calculation according to official specification:
 * - 95–100% → 1.2
 * - 90–94.99% → 1.0
 * - 85–89.99% → 0.8
 * - 0–84.99% → 0.6
 */
export function getKpiCoefficient(bpvScore: number): number {
  if (bpvScore >= 95) return 1.2;
  if (bpvScore >= 90) return 1.0;
  if (bpvScore >= 85) return 0.8;
  return 0.6;
}

export function isMysteryShopperWithoutPurchase(checkType?: string): boolean {
  if (!checkType) return true;
  const lower = checkType.toLowerCase();
  return lower.includes("mystery") || lower.includes("без покупки") || lower.includes("2.");
}

export function calculateSalesDriversIndex(
  driversInput?: Partial<SalesDriverItem>[],
  isMysteryShopper = true
): { score: number; totalPoints: number; maxPoints: number; items: SalesDriverItem[] } {
  let totalEarned = 0;
  let maxApplicable = 0;

  const items: SalesDriverItem[] = DEFAULT_SALES_DRIVERS.map((spec) => {
    const override = driversInput?.find((d) => d.id === spec.id || (d.name && d.name.includes(spec.name)));
    let status: "Проявлен" | "Частично" | "Не проявлен" | "N/A" = override?.status || "Не проявлен";

    if (isMysteryShopper && spec.id === "commercial_initiative" && override?.status === "N/A") {
      status = "N/A";
    }

    let pts = 0;
    if (status === "Проявлен") pts = 2;
    else if (status === "Частично") pts = 1;
    else pts = 0;

    if (status !== "N/A") {
      totalEarned += pts;
      maxApplicable += spec.maxPoints;
    }

    return {
      id: spec.id,
      name: spec.name,
      status,
      points: pts,
      maxPoints: spec.maxPoints,
      explanation: override?.explanation || (status === "Проявлен" ? "Подтверждено фактическими фактами из аудиозаписи" : status === "Частично" ? "Проявлено частично (зона роста)" : "Не зафиксировано в поведении консультанта"),
    };
  });

  const score = maxApplicable > 0 ? Math.round((totalEarned / maxApplicable) * 1000) / 10 : 0;

  return {
    score,
    totalPoints: totalEarned,
    maxPoints: maxApplicable,
    items,
  };
}

const ID_ALIAS_MAP: Record<string, string> = {
  "C1": "contact_greeting",
  "C2": "needs_discovery",
  "C3": "product_presentation",
  "C4": "handling_objections",
  "C5": "closing_conversion",
  "C6": "cross_selling_accessories",
  "C7": "cross_selling_services",
  "C8": "farewell_closing",
  "C9": "appearance_uniform",
  "C10": "store_discipline",
  "C11": "cash_discipline",
  "C14": "cash_discipline",
};

export function calculateAuditScores(
  checkType: string,
  criteriaInput?: Partial<ChecklistCriterion | any>[],
  isCashViolated = false
): AuditCalculationResult {
  const isMystery = isMysteryShopperWithoutPurchase(checkType);

  // Cash discipline is a manual shopper/auditor fact. AI criteria must never
  // infer a stop-factor from audio.
  const cashViolatedFinal = isCashViolated;

  const processedCriteria: ChecklistCriterion[] = OFFICIAL_CRITERIA_SPECS.map((spec) => {
    const override = criteriaInput?.find((c: any) => {
      if (spec.category === "cashier" && c.source === "аудио") return false;
      if (c.id === spec.id || c.criterionId === spec.id) return true;
      if (c.id && ID_ALIAS_MAP[c.id] === spec.id) return true;
      if (c.criterionId && ID_ALIAS_MAP[c.criterionId] === spec.id) return true;
      if (c.name && c.name.includes(spec.name)) return true;
      return false;
    });

    const maxPts = isMystery ? spec.maxPointsMystery : spec.maxPointsControl;

    let status: "Соблюдено" | "Частично" | "Нарушено" | "Не возникло (N/A 10/10)" | "Не применимо (N/A)" = override?.status || "Не применимо (N/A)";

    // Mystery Shopping specific exclusions
    if (isMystery && (spec.category === "cross_sell" || spec.category === "cashier" || maxPts === 0)) {
      status = "Не применимо (N/A)";
    }

    // Special rule for objections: If objection didn't arise, N/A with 10/10 preserved
    if (spec.id === "handling_objections" && status === "Не возникло (N/A 10/10)") {
      return {
        id: spec.id,
        name: spec.name,
        category: spec.category,
        maxPoints: 10,
        status: "Не возникло (N/A 10/10)",
        earnedPoints: 10,
        explanation: override?.explanation || "Возражение в ходе визита не возникло; критерий не мог быть продемонстрирован.",
      };
    }

    let earned = 0;
    if (status === "Соблюдено") {
      earned = maxPts;
    } else if (status === "Частично") {
      earned = Math.round(maxPts * 0.5);
    } else if (status === "Нарушено") {
      earned = 0;
    } else {
      earned = 0;
    }

    return {
      id: spec.id,
      name: spec.name,
      category: spec.category,
      maxPoints: maxPts,
      status,
      earnedPoints: earned,
      explanation: override?.explanation || "",
    };
  });

  let totalEarned = 0;
  let maxApplicable = 0;

  processedCriteria.forEach((item) => {
    if (item.status !== "Не применимо (N/A)") {
      totalEarned += item.earnedPoints;
      maxApplicable += item.maxPoints;
    }
  });

  // Calculate base BPV score
  let bpvScore = maxApplicable > 0 ? Math.round((totalEarned / maxApplicable) * 1000) / 10 : 0;
  let cashZeroed = false;
  let cashZeroReason: string | undefined = undefined;

  // Stop-factor: If cash discipline violated in Control Purchase, zero out BPV
  if (!isMystery && cashViolatedFinal) {
    bpvScore = 0;
    cashZeroed = true;
    cashZeroReason = "Кассовая дисциплина: невыдача чека / нарушение правил расчета. Общий итог BPV обнулен (0%).";
  }

  const cashIndex: number | "N/A" = isMystery ? "N/A" : (cashViolatedFinal ? 0 : 100);

  // Sales drivers index calculation
  const salesDriveObj = calculateSalesDriversIndex([], isMystery);

  const calculationObj = {
    totalEarnedPoints: totalEarned,
    maxApplicablePoints: maxApplicable,
    bpvScore,
    cashIndex,
    cashZeroed,
    cashZeroReason,
  };

  return {
    checkType: isMystery ? "2. Mystery shopper (без покупки)" : "1. Контрольная закупка",
    totalEarnedPoints: totalEarned,
    maxApplicablePoints: maxApplicable,
    bpvScore,
    cashIndex,
    cashZeroed,
    cashZeroReason,
    salesDriveScore: salesDriveObj.score,
    criteria: processedCriteria,
    salesDrivers: salesDriveObj.items,
    calculation: calculationObj,
  };
}

/**
 * Parses criteria from structured array or legacy markdown report safely.
 */
export function calculateScoresFromReport(reportText: string, checkType: string): AuditCalculationResult {
  if (!reportText) {
    return calculateAuditScores(checkType, []);
  }

  const criteriaOverrides: Partial<ChecklistCriterion>[] = [];
  let isCashViolated = false;

  if (reportText.includes("НЕВЫДАЧА ЧЕКА") || reportText.includes("Чек не выдан") || reportText.includes("кассовое нарушение")) {
    isCashViolated = true;
  }

  // Match rows in report tables
  const rowRegex = /\|\s*([^|]+?)\s*\|\s*(Соблюдено|Частично|Нарушено|Не возникло|Не применимо \(N\/A\)|N\/A)\s*\|\s*(\d+)\/(\d+)\s*\|/gi;
  let match;

  while ((match = rowRegex.exec(reportText)) !== null) {
    const rawName = match[1].trim();
    const rawStatus = match[2].trim();

    let status: "Соблюдено" | "Частично" | "Нарушено" | "Не возникло (N/A 10/10)" | "Не применимо (N/A)" = "Соблюдено";
    if (rawStatus.includes("Частично")) status = "Частично";
    else if (rawStatus.includes("Нарушено")) status = "Нарушено";
    else if (rawStatus.includes("Не возникло")) status = "Не возникло (N/A 10/10)";
    else if (rawStatus.includes("N/A") || rawStatus.includes("Не применимо")) status = "Не применимо (N/A)";

    criteriaOverrides.push({
      name: rawName,
      status,
    });
  }

  return calculateAuditScores(checkType, criteriaOverrides, isCashViolated);
}
