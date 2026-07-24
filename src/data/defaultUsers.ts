import { UserAccount } from "../types";

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "usr-001",
    login: "admin",
    password: "admin123",
    name: "Екатерина Администратор",
    role: "admin",
    status: "active",
    createdAt: "2026-01-15",
  },
  {
    id: "usr-002",
    login: "manager",
    password: "manager123",
    name: "Иван Руководитель ОКК",
    role: "manager",
    status: "active",
    createdAt: "2026-02-01",
  },
  {
    id: "usr-003",
    login: "auditor",
    password: "auditor123",
    name: "Алексей Инспектор",
    role: "inspector",
    status: "active",
    createdAt: "2026-02-10",
  },
];
