import { AuditRecord, AuditFormData } from "../types";

/**
 * Single centralized mapper for transferring Shopper submission records
 * into Auditor Form Data without losing fields or adding hallucinated defaults.
 */
export function mapShopperRecordToAuditorForm(record: AuditRecord): AuditFormData {
  const sData = record.shopperData;

  const dateVal = record.date || sData?.visitDate || new Date().toLocaleDateString("ru-RU");
  const startTimeVal = record.startTime || sData?.startTime || "";
  const endTimeVal = record.endTime || sData?.endTime || "";
  const brandVal = record.brand || sData?.network || "";
  const cityVal = record.city || sData?.city || "";
  const regionVal = record.region || record.group || "";
  const branchVal = record.branch || sData?.branch || "";
  const consultantVal = record.employeeCode || sData?.consultantName || "";
  const shopperNameVal = record.shopperName || sData?.shopperName || record.inspector || "";

  return {
    id: record.id,
    checkType: record.checkType || "2. Mystery shopper (без покупки)",
    date: dateVal,
    month: record.month || "",
    startTime: startTimeVal,
    endTime: endTimeVal,
    brand: brandVal,
    city: cityVal,
    region: regionVal,
    group: regionVal,
    branch: branchVal,
    employeeCode: consultantVal,
    inspector: shopperNameVal,
    shopperName: shopperNameVal,
    shopperId: record.shopperId || "",
    auditorName: record.auditorName || "",
    auditorId: record.auditorId || "",
    manager: record.manager || "",
    primaryApproverId: record.primaryApproverId || "",
    category: record.category || sData?.category || "",
    target: record.target || sData?.target || "",
    result: record.result || (sData ? `Что понравилось: ${sData.whatLiked || ""}. Что не понравилось: ${sData.whatDisliked || ""}` : ""),
    comment: record.comment || sData?.overallComment || "",
    standards: "Стандарты обслуживания и продаж BPV",
    bpvScore: record.bpvScore,
    speechScore: record.speechScore,
    salesDriveScore: record.salesDriveScore,
    shopperSubmissionText: record.shopperSubmissionText || (sData ? JSON.stringify(sData, null, 2) : ""),
    shopperData: sData,
    machineTranscript: record.machineTranscript,
    auditorTranscript: record.auditorTranscript,
    aiAnalysisText: record.aiAnalysisText,
    auditorFinalReport: record.auditorFinalReport || record.fullReportText,
    salesDrivers: record.salesDrivers,
    disputedPoints: record.disputedPoints,
    sourceAuditId: record.id,
    cashData: record.cashData || sData?.cashData,
  };
}
