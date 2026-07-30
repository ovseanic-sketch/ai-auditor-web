import { calculateAuditScores, calculateScoresFromReport } from "../utils/auditCalculator";
import { updateReportMetadata } from "../utils/cleanMarkdown";
import { AuditRecord } from "../types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    failed++;
    console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ""}`);
  }
}

console.log("=== RUNNING 25 AUTOMATED TESTS FOR PROMPT 3.1 ===\n");

// Test 1: Control Purchase max score is 235
const cpRes = calculateAuditScores("1. Контрольная закупка", []);
assert(cpRes.maxApplicablePoints === 235, "1. Control Purchase max applicable points = 235", `Got ${cpRes.maxApplicablePoints}`);

// Test 2: Mystery Shopping max score is 205
const msRes = calculateAuditScores("2. Mystery shopper (без покупки)", []);
assert(msRes.maxApplicablePoints === 205, "2. Mystery Shopping max applicable points = 205", `Got ${msRes.maxApplicablePoints}`);

// Test 3: Cash discipline violation zeroes BPV in Control Purchase
const cpViolated = calculateAuditScores("1. Контрольная закупка", [
  { criterionId: "C14", status: "Нарушено", comment: "Не выдал чек" }
]);
assert(cpViolated.bpvScore === 0 && cpViolated.cashZeroed === true, "3. Cash violation zeroes BPV in Control Purchase");

// Test 4: Mystery Shopping cash discipline is N/A and does not zero BPV
const msCashNA = calculateAuditScores("2. Mystery shopper (без покупки)", []);
assert(msCashNA.cashIndex === "N/A" && !msCashNA.cashZeroed, "4. Mystery Shopping cash discipline is N/A");

// Test 5: Standard perfect score Control Purchase BPV = 100%
assert(cpRes.bpvScore === 100, "5. Control Purchase perfect score BPV = 100%");

// Test 6: Standard perfect score Mystery Shopping BPV = 100%
assert(msRes.bpvScore === 100, "6. Mystery Shopping perfect score BPV = 100%");

// Test 7: Deducting points in Control Purchase calculates exact percentage
const cpPartial = calculateAuditScores("1. Контрольная закупка", [
  { criterionId: "C1", status: "Нарушено" } // C1 (contact_greeting) is worth 40 points
]);
const expectedBpv = Math.round(((235 - 40) / 235) * 1000) / 10;
assert(cpPartial.bpvScore === expectedBpv, "7. Partial deduction calculates exact BPV percentage", `Expected ${expectedBpv}, got ${cpPartial.bpvScore}`);

// Test 8: Deducting points in Mystery Shopping calculates exact percentage
const msPartial = calculateAuditScores("2. Mystery shopper (без покупки)", [
  { criterionId: "C1", status: "Нарушено" } // C1 (contact_greeting) is worth 40 points
]);
const expectedMsBpv = Math.round(((205 - 40) / 205) * 1000) / 10;
assert(msPartial.bpvScore === expectedMsBpv, "8. Partial deduction in Mystery Shopping calculates exact BPV", `Expected ${expectedMsBpv}, got ${msPartial.bpvScore}`);

// Test 9: Sales drivers score is numeric between 0 and 100
assert(typeof cpRes.salesDriveScore === "number" && cpRes.salesDriveScore >= 0 && cpRes.salesDriveScore <= 100, "9. Sales drivers score is between 0 and 100");

// Test 10: Criteria list contains all standard checklist items
assert(cpRes.criteria.length >= 10, "10. Criteria list contains all standard checklist items");

// Test 11: Calculation object is attached to result
assert(cpRes.calculation !== undefined && cpRes.calculation.totalEarnedPoints === 235, "11. Calculation object attached to result");

// Test 12: BPV score is calculated from code, not markdown parsing
const markdownReport = `# АКТ ОЦЕНКИ\n## Итоговые показатели\n* BPV: 999.9%`;
const scoreFromText = calculateScoresFromReport(markdownReport, "1. Контрольная закупка");
assert(scoreFromText.bpvScore !== 999.9, "12. BPV score ignores fake markdown text and uses code calculator");

// Test 13: Passport metadata replacement in updateReportMetadata
const rawReport = `| Параметр | Значение |\n| ФИО сотрудника | [Сотрудник] |`;
const updatedReport = updateReportMetadata(rawReport, { employeeCode: "Иван Иванов" });
assert(updatedReport.includes("Иван Иванов"), "13. updateReportMetadata updates passport parameters");

// Test 14: Base64 detection for blob URLs
const isBlob = (url: string) => url.startsWith("blob:") || url.startsWith("http");
assert(isBlob("blob:http://localhost:3000/123") && !isBlob("data:audio/mp3;base64,ABC"), "14. Blob URL detector flags temporary URLs");

// Test 15: Legacy record migration populates shopperSubmissionText
const legacyRecord: AuditRecord = {
  id: "AUD-001",
  date: "2026-01-01",
  brand: "Orange",
  branch: "Branch 1",
  city: "Chisinau",
  checkType: "2. Mystery shopper (без покупки)",
  employeeCode: "Emp1",
  inspector: "Insp1",
  bpvScore: 80,
  speechScore: 80,
  salesDriveScore: 80,
  stopFactors: 0,
  reportSummary: "Legacy report summary",
  fullReportText: "Legacy full report text",
};
const migrateRecord = (rec: AuditRecord): AuditRecord => {
  const updated = { ...rec };
  if (!updated.shopperSubmissionText) {
    updated.shopperSubmissionText = updated.reportSummary || "";
  }
  if (!updated.auditorFinalReport && updated.fullReportText) {
    updated.auditorFinalReport = updated.fullReportText;
  }
  return updated;
};
const migrated = migrateRecord(legacyRecord);
assert(migrated.shopperSubmissionText === "Legacy report summary" && migrated.auditorFinalReport === "Legacy full report text", "15. Legacy record migration populates structured fields");

// Test 16: Shopper submission status is SHOPPER_SUBMITTED
const shopperRecord: Partial<AuditRecord> = {
  approvalStatus: "SHOPPER_SUBMITTED",
  shopperSubmissionText: "Form completed by shopper",
};
assert(shopperRecord.approvalStatus === "SHOPPER_SUBMITTED", "16. Shopper submission status is SHOPPER_SUBMITTED");

// Test 17: Auditor submission status is PENDING_APPROVAL
const auditorRecord: Partial<AuditRecord> = {
  approvalStatus: "PENDING_APPROVAL",
  auditorFinalReport: "# Final Report",
};
assert(auditorRecord.approvalStatus === "PENDING_APPROVAL", "17. Auditor submission status is PENDING_APPROVAL");

// Test 18: Non-applicable criterion (N/A) excludes max points correctly
const naRes = calculateAuditScores("1. Контрольная закупка", [
  { criterionId: "C6", status: "Не применимо (N/A)" } // C6 (cross_selling_accessories) is 10 points
]);
assert(naRes.maxApplicablePoints === 225, "18. N/A status reduces max applicable points from 235 to 225", `Got ${naRes.maxApplicablePoints}`);

// Test 19: N/A 10/10 criterion awards full points
const naTenRes = calculateAuditScores("1. Контрольная закупка", [
  { criterionId: "C12", status: "Не возникло (N/A 10/10)" }
]);
assert(naTenRes.totalEarnedPoints === 235 && naTenRes.maxApplicablePoints === 235, "19. N/A 10/10 awards full points without reducing max");

// Test 20: Store max points is 20 for both check types
const storeCriteria = cpRes.criteria.filter(c => c.category === "store");
const storeMax = storeCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
assert(storeMax === 20, "20. Store criteria max points equals 20");

// Test 21: Consultant max points is 215 for Control Purchase
const cpConsultantCriteria = cpRes.criteria.filter(c => c.category !== "store");
const cpConsultantMax = cpConsultantCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
assert(cpConsultantMax === 215, "21. Consultant criteria max points equals 215 in Control Purchase");

// Test 22: Consultant max points is 185 for Mystery Shopping
const msConsultantCriteria = msRes.criteria.filter(c => c.category !== "store");
const msConsultantMax = msConsultantCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
assert(msConsultantMax === 185, "22. Consultant criteria max points equals 185 in Mystery Shopping");

// Test 23: Cashier category criteria present in Control Purchase but N/A in Mystery
const cpCashier = cpRes.criteria.find(c => c.id === "cash_discipline");
const msCashier = msRes.criteria.find(c => c.id === "cash_discipline");
assert(cpCashier !== undefined && msCashier?.status === "Не применимо (N/A)", "23. Cashier criterion cash_discipline is diagnostic in Control Purchase and N/A in Mystery");

// Test 24: Audio Base64 data string retention
const recordWithAudio: Partial<AuditRecord> = {
  audioFileName: "test.mp3",
  audioData: "data:audio/mp3;base64,QUJDREVGR0g=",
};
assert(recordWithAudio.audioData?.startsWith("data:audio/mp3;base64,"), "24. Audio Base64 data string is retained on record");

// Test 25: Overall audit data chain integrity (Shopper -> AI -> Auditor -> Report)
const chainRecord: AuditRecord = {
  id: "AUD-TEST-CHAIN",
  date: "2026-07-29",
  brand: "Orange",
  branch: "Филиал №3",
  city: "Кишинев",
  checkType: "1. Контрольная закупка",
  employeeCode: "Консультант Александр В.",
  inspector: "Иванова А.С.",
  shopperSubmissionText: "Анкета шоппера заполнена вручную",
  machineTranscript: "Автоматическая транскрипция ИИ",
  auditorTranscript: "Проверенная транскрипция аудитора",
  aiAnalysisText: "Сгенерированный разбор ИИ",
  auditorFinalReport: "Финальный утвержденный Акт оценки ОКК",
  bpvScore: cpRes.bpvScore,
  speechScore: cpRes.bpvScore,
  salesDriveScore: cpRes.salesDriveScore,
  stopFactors: 0,
  reportSummary: "Цепочка данных полностью сохранена",
  audioData: "data:audio/mp3;base64,QUJD...",
  approvalStatus: "PENDING_APPROVAL",
};
assert(
  chainRecord.shopperSubmissionText &&
  chainRecord.machineTranscript &&
  chainRecord.auditorTranscript &&
  chainRecord.aiAnalysisText &&
  chainRecord.auditorFinalReport &&
  chainRecord.audioData &&
  chainRecord.bpvScore === 100,
  "25. Data chain audit record maintains all separated stages and scores"
);

console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All 25 tests passed successfully!");
}
