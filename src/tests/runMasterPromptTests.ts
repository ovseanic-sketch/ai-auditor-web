import {
  calculateAuditScores,
  getKpiCoefficient,
  isMysteryShopperWithoutPurchase,
} from "../utils/auditCalculator";
import {
  canTransition,
  isFinalStatus,
  AuditStatus,
} from "../services/auditStateMachine";

export interface TestResultItem {
  name: string;
  passed: boolean;
  message: string;
}

export function runMasterPromptTestSuite(): TestResultItem[] {
  const results: TestResultItem[] = [];

  const test = (name: string, assertion: boolean, message: string) => {
    results.push({ name, passed: assertion, message });
  };

  // 1. KPI Coefficient Boundary Tests
  test("KPI Boundary 84.99% => 0.6", getKpiCoefficient(84.99) === 0.6, "Expected 0.6 for 84.99%");
  test("KPI Boundary 85.00% => 0.8", getKpiCoefficient(85.0) === 0.8, "Expected 0.8 for 85.0%");
  test("KPI Boundary 89.99% => 0.8", getKpiCoefficient(89.99) === 0.8, "Expected 0.8 for 89.99%");
  test("KPI Boundary 90.00% => 1.0", getKpiCoefficient(90.0) === 1.0, "Expected 1.0 for 90.0%");
  test("KPI Boundary 94.99% => 1.0", getKpiCoefficient(94.99) === 1.0, "Expected 1.0 for 94.99%");
  test("KPI Boundary 95.00% => 1.2", getKpiCoefficient(95.0) === 1.2, "Expected 1.2 for 95.0%");
  test("KPI Boundary 100.0% => 1.2", getKpiCoefficient(100.0) === 1.2, "Expected 1.2 for 100.0%");

  // 2. Mystery Shopper Exclusions
  test(
    "Mystery Shopper Detection",
    isMysteryShopperWithoutPurchase("2. Mystery shopper (без покупки)") === true,
    "Expected true for Mystery Shopper check type"
  );
  test(
    "Control Purchase Detection",
    isMysteryShopperWithoutPurchase("1. Контрольная закупка") === false,
    "Expected false for Control Purchase check type"
  );

  const mysteryCalc = calculateAuditScores("2. Mystery shopper (без покупки)", []);
  test("Mystery Shopper Cash Index is N/A", mysteryCalc.cashIndex === "N/A", "Mystery Cash Index must be N/A");

  // 3. Control Purchase Cash Zeroing (Stop factor)
  const cashViolatedCalc = calculateAuditScores("1. Контрольная закупка", [], true);
  test(
    "Cash violation zeros out BPV score",
    cashViolatedCalc.bpvScore === 0 && cashViolatedCalc.cashZeroed === true,
    "Control purchase cash violation must set BPV to 0%"
  );
  test(
    "Missing evidence is never treated as compliance",
    calculateAuditScores("1. Контрольная закупка", []).maxApplicablePoints === 0,
    "Criteria without evidence must be N/A and excluded"
  );

  // 4. State Machine Transition Rules
  const validShopperSubmit = canTransition("DRAFT", "SHOPPER_SUBMITTED", "shopper");
  test("Shopper can submit DRAFT -> SHOPPER_SUBMITTED", validShopperSubmit.success, validShopperSubmit.error || "");

  const invalidManagerSubmit = canTransition("DRAFT", "SHOPPER_SUBMITTED", "manager");
  test("Manager cannot submit DRAFT -> SHOPPER_SUBMITTED", !invalidManagerSubmit.success, "Manager should be forbidden from submitting draft");

  const pendingWithoutComment = canTransition("PENDING_APPROVAL", "APPROVED_WITH_COMMENT", "manager", "");
  test(
    "APPROVED_WITH_COMMENT requires non-empty comment",
    !pendingWithoutComment.success,
    "Should reject empty comment for APPROVED_WITH_COMMENT"
  );

  test(
    "Manager can request revision only with comment",
    !canTransition("PENDING_APPROVAL", "REVISION_REQUESTED", "manager").success &&
      canTransition("PENDING_APPROVAL", "REVISION_REQUESTED", "manager", "Не согласен с критерием 3").success,
    "Revision must require a manager comment"
  );
  test(
    "Auditor final decision requires rationale",
    !canTransition("REVISION_REQUESTED", "FINALIZED_NO_SCORE_CHANGE", "auditor").success &&
      canTransition("REVISION_REQUESTED", "FINALIZED_NO_SCORE_CHANGE", "auditor", "Аудио подтверждает исходную оценку").success,
    "Final decision must require auditor rationale"
  );
  test(
    "Shopper clarification cycle is role protected",
    canTransition("SHOPPER_CLARIFICATION_REQUESTED", "SHOPPER_RESUBMITTED", "shopper", "Уточнение внесено").success &&
      !canTransition("SHOPPER_CLARIFICATION_REQUESTED", "SHOPPER_RESUBMITTED", "manager", "Попытка").success,
    "Only shopper may resubmit clarification"
  );

  const pendingWithComment = canTransition("PENDING_APPROVAL", "APPROVED_WITH_COMMENT", "manager", "Согласовано с замечанием по оформлению чека");
  test(
    "APPROVED_WITH_COMMENT passes with valid comment",
    pendingWithComment.success,
    pendingWithComment.error || ""
  );

  // 5. Final status checks
  test("APPROVED is final status", isFinalStatus("APPROVED"), "APPROVED must be final");
  test("FINALIZED_WITH_SCORE_CHANGE is final status", isFinalStatus("FINALIZED_WITH_SCORE_CHANGE"), "FINALIZED_WITH_SCORE_CHANGE must be final");
  test("PENDING_APPROVAL is not final status", !isFinalStatus("PENDING_APPROVAL"), "PENDING_APPROVAL must not be final");

  return results;
}

if (typeof process !== "undefined" && process.argv && process.argv[1]?.includes("runMasterPromptTests")) {
  console.log("=== RUNNING MASTER PROMPT TEST SUITE ===");
  const suite = runMasterPromptTestSuite();
  let passedCount = 0;
  suite.forEach((item, idx) => {
    if (item.passed) {
      passedCount++;
      console.log(`✅ [PASS ${idx + 1}/${suite.length}] ${item.name}`);
    } else {
      console.error(`❌ [FAIL ${idx + 1}/${suite.length}] ${item.name}: ${item.message}`);
    }
  });
  console.log(`=== TEST SUMMARY: ${passedCount}/${suite.length} PASSED ===`);
  if (passedCount < suite.length) {
    process.exit(1);
  }
}
