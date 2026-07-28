import { AuditRecord, UserAccount } from "../types";

/**
 * Извлекает название бренда, привязанного к пользователю-руководителю
 */
export function getManagerBrand(user?: UserAccount | null): string | null {
  if (!user) return null;
  if (user.role !== "manager" && user.role !== "supervisor") return null;
  if (!user.network) return null;
  const net = user.network.trim();
  if (!net) return null;

  // Очистка от служебных префиксов ("Сеть Orange" -> "Orange", "Филиал №1 (Кишинев)" -> "Кишинев" / бренд)
  let clean = net.replace(/^Сеть\s+/i, "").replace(/^Филиал\s+.*?\s*/i, "").trim();
  return clean || null;
}

/**
 * Проверяет, принадлежит ли проверка бренду или назначенному руководителю
 */
export function isAuditBelongsToManager(audit: AuditRecord, user?: UserAccount | null): boolean {
  if (!user) return true;
  if (user.role !== "manager" && user.role !== "supervisor") return true;

  // 1. Проверка по указанному имени ответственного руководителя
  if (audit.manager && user.name) {
    const auditMgr = audit.manager.trim().toLowerCase();
    const userNm = user.name.trim().toLowerCase();

    // Прямое или частичное совпадение
    if (auditMgr.includes(userNm) || userNm.includes(auditMgr)) {
      return true;
    }

    // Совпадение по фамилии
    const auditLastName = auditMgr.split(/\s+/)[0];
    const userLastName = userNm.split(/\s+/)[0];
    if (auditLastName && userLastName && auditLastName.length > 2 && userNm.includes(auditLastName)) {
      return true;
    }

    // Если у проверки назначен совершенно иной менеджер, запрещаем доступ
    if (auditLastName && userLastName && auditLastName.length > 2 && userLastName.length > 2 && auditLastName !== userLastName) {
      return false;
    }
  }

  // 2. Проверка по бренду / филиалу
  const managerBrand = getManagerBrand(user);
  if (managerBrand) {
    const auditBrandLower = (audit.brand || "").toLowerCase();
    const auditBranchLower = (audit.branch || "").toLowerCase();
    const managerBrandLower = managerBrand.toLowerCase();

    if (
      auditBrandLower.includes(managerBrandLower) ||
      managerBrandLower.includes(auditBrandLower) ||
      auditBranchLower.includes(managerBrandLower)
    ) {
      return true;
    }
  }

  // Если имя не совпало и бренд не совпал
  return false;
}
