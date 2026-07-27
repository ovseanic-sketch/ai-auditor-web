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
 * Проверяет, принадлежит ли проверка бренду текущего руководителя
 */
export function isAuditBelongsToManager(audit: AuditRecord, user?: UserAccount | null): boolean {
  if (!user) return true;
  if (user.role !== "manager" && user.role !== "supervisor") return true;

  // Если руководитель привязан напрямую по имени
  if (audit.manager && user.name && audit.manager.toLowerCase().includes(user.name.toLowerCase())) {
    return true;
  }

  const managerBrand = getManagerBrand(user);
  if (!managerBrand) return true;

  const auditBrandLower = (audit.brand || "").toLowerCase();
  const managerBrandLower = managerBrand.toLowerCase();

  // Совпадение по вхождению названий брендов
  if (auditBrandLower.includes(managerBrandLower) || managerBrandLower.includes(auditBrandLower)) {
    return true;
  }

  return false;
}
