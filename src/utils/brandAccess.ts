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
  return Boolean(audit.primaryApproverId && user.id && audit.primaryApproverId === user.id);
}
