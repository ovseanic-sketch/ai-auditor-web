import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Ban,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { UserAccount, UserRole } from "../types";
import {
  createUserByAdmin,
  setUserPasswordByAdmin,
  setUserStatusByAdmin,
  updateUserByAdmin,
} from "../services/supabaseClient";
import {
  Dictionaries,
  loadDictionaries,
  saveDictionaries,
} from "../utils/dictionaryStore";

interface UserManagementProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (user: Omit<UserAccount, "id" | "createdAt">) => void;
  onUpdateUserStatus: (id: string, status: "active" | "blocked") => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUserInfo?: (
    id: string,
    updatedData: {
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      network?: string;
      position?: string;
      login?: string;
      role?: UserRole;
    }
  ) => void;
  onRefreshUsers: () => Promise<void>;
}

type Notice = { type: "success" | "error"; text: string } | null;

const roleLabel: Record<UserRole, string> = {
  admin: "Администратор",
  auditor: "Аудитор",
  manager: "Руководитель",
  supervisor: "Руководитель",
  operator: "Оператор",
  inspector: "Проверяющий",
  shopper: "Шоппер",
};

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onRefreshUsers,
}) => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [notice, setNotice] = useState<Notice>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    login: "",
    password: "",
    role: "shopper" as "admin" | "auditor" | "manager" | "shopper",
    position: "",
    network: "",
  });
  const [dictionaries, setDictionaries] = useState<Dictionaries>(() => loadDictionaries());
  const [newBrand, setNewBrand] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newCity, setNewCity] = useState("");

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const haystack = [
        user.name,
        user.login,
        user.email,
        user.network,
        user.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesRole && (!needle || haystack.includes(needle));
    });
  }, [query, roleFilter, users]);

  const changeStatus = async (user: UserAccount, status: "active" | "blocked" | "archived") => {
    if (user.id === currentUser.id && status !== "active") {
      setNotice({ type: "error", text: "Нельзя заблокировать или архивировать собственную активную сессию." });
      return;
    }
    setBusyUserId(user.id);
    setNotice(null);
    try {
      await setUserStatusByAdmin(user.id, status);
      await onRefreshUsers();
      setNotice({
        type: "success",
        text:
          status === "active"
            ? `Доступ пользователя ${user.name} восстановлен.`
            : status === "blocked"
            ? `Пользователь ${user.name} заблокирован.`
            : `Пользователь ${user.name} перемещён в архив. История и проверки сохранены.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Не удалось изменить статус пользователя.",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingUser(true);
    setNotice(null);
    try {
      await createUserByAdmin(newUser);
      await onRefreshUsers();
      setNotice({
        type: "success",
        text: `Пользователь ${newUser.fullName.trim()} создан. Вход доступен по установленным администратором логину и паролю.`,
      });
      setShowAddUserModal(false);
      setNewUser({ fullName: "", login: "", password: "", role: "shopper", position: "", network: "" });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Не удалось создать пользователя.",
      });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    setIsSavingUser(true);
    setNotice(null);
    try {
      await updateUserByAdmin({
        userId: editingUser.id,
        login: editingUser.login,
        fullName: editingUser.name,
        role: editingUser.role === "inspector" ? "auditor" : editingUser.role,
        network: editingUser.network || "",
        position: editingUser.position || "",
      });
      await onRefreshUsers();
      setEditingUser(null);
      setNotice({ type: "success", text: "Данные пользователя сохранены в базе." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Не удалось сохранить пользователя." });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleSetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordUser) return;
    setIsSavingUser(true);
    setNotice(null);
    try {
      await setUserPasswordByAdmin(passwordUser.id, newPassword);
      setPasswordUser(null);
      setNewPassword("");
      setNotice({ type: "success", text: `Пароль пользователя ${passwordUser.name} изменён.` });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Не удалось изменить пароль." });
    } finally {
      setIsSavingUser(false);
    }
  };

  const updateDictionaries = (next: Dictionaries) => {
    setDictionaries(next);
    saveDictionaries(next);
  };

  const addDictionaryValue = (
    key: keyof Dictionaries,
    value: string,
    clear: () => void
  ) => {
    const clean = value.trim();
    if (!clean) return;
    const existing = dictionaries[key] as string[];
    if (existing.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setNotice({ type: "error", text: `Значение «${clean}» уже есть в справочнике.` });
      return;
    }
    updateDictionaries({ ...dictionaries, [key]: [...existing, clean] });
    clear();
  };

  const removeDictionaryValue = (key: keyof Dictionaries, value: string) => {
    const existing = dictionaries[key] as string[];
    updateDictionaries({
      ...dictionaries,
      [key]: existing.filter((item) => item !== value),
    });
  };

  const dictionaryColumn = (
    title: string,
    key: keyof Dictionaries,
    value: string,
    setValue: (value: string) => void
  ) => (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-bold text-slate-200">
        {title} ({(dictionaries[key] as string[]).length})
      </h4>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
          placeholder={`Добавить: ${title.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={() => addDictionaryValue(key, value, () => setValue(""))}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          aria-label={`Добавить ${title.toLowerCase()}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {(dictionaries[key] as string[]).map((item) => (
          <div
            key={item}
            className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-300"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => removeDictionaryValue(key, item)}
              className="text-slate-500 hover:text-red-400"
              aria-label={`Удалить ${item}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Пользователи и доступы</h2>
              <p className="text-xs text-slate-400 mt-1">
                Пользователи хранятся в Supabase. Создание и управление доступом выполняют только администраторы.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить пользователя
            </button>
            <button
              type="button"
              onClick={() => setShowDictionaryModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-white flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              Справочники
            </button>
          </div>
        </div>
      </section>

      <section className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-100 leading-relaxed">
          <strong>Модель доступа:</strong> администратор создаёт логин и пароль, изменяет данные, роль и доступ.
          Пароль передаётся пользователю вне системы и никогда не отображается после сохранения.
        </div>
      </section>

      {notice && (
        <div
          className={`rounded-xl border p-3 flex items-center gap-2 text-xs ${
            notice.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
              : "bg-red-950/40 border-red-500/30 text-red-200"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3">
          <label className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по имени, логину, сети или должности"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white"
            />
          </label>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
          >
            <option value="all">Все роли</option>
            <option value="admin">Администраторы</option>
            <option value="manager">Руководители</option>
            <option value="inspector">Проверяющие</option>
            <option value="shopper">Шопперы</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3">Сотрудник</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Сеть / должность</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Доступ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="text-slate-200">
                  <td className="px-4 py-4">
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="text-slate-400 mt-1">{user.login}</div>
                  </td>
                  <td className="px-4 py-4">{roleLabel[user.role]}</td>
                  <td className="px-4 py-4">
                    <div>{user.network || "—"}</div>
                    <div className="text-slate-500 mt-1">{user.position || "—"}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full font-semibold ${
                        user.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : user.status === "archived"
                          ? "bg-slate-500/10 text-slate-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {user.status === "active" ? "Активен" : user.status === "archived" ? "В архиве" : "Заблокирован"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => setEditingUser(user)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300" title="Изменить данные">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => { setPasswordUser(user); setNewPassword(""); }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300" title="Изменить пароль">
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      {user.status === "active" ? (
                        <>
                          <button type="button" disabled={busyUserId === user.id || user.id === currentUser.id}
                            onClick={() => changeStatus(user, "blocked")}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-red-300" title="Заблокировать">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" disabled={busyUserId === user.id || user.id === currentUser.id}
                            onClick={() => window.confirm(`Переместить ${user.name} в архив? Проверки и история сохранятся.`) && changeStatus(user, "archived")}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300" title="Удалить из активных пользователей">
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button type="button" disabled={busyUserId === user.id}
                          onClick={() => changeStatus(user, "active")}
                          className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white" title="Восстановить доступ">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500">
          Все пользователи создаются администраторами и постоянно хранятся в базе. Архивирование не удаляет проверки и историю.
        </div>
      </section>

      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-white">Добавить пользователя</h3>
                <p className="text-xs text-slate-400 mt-1">Администратор самостоятельно устанавливает логин и пароль.</p>
              </div>
              <button type="button" onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block text-xs text-slate-300">
              ФИО *
              <input required value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
            </label>
            <label className="block text-xs text-slate-300">
              Логин *
              <input required minLength={3} value={newUser.login} onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
            </label>
            <label className="block text-xs text-slate-300">
              Пароль *
              <div className="relative mt-1.5">
                <input required minLength={8} type={showPassword ? "text" : "password"} value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-white" />
                <button type="button" onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <label className="block text-xs text-slate-300">
              Роль *
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as typeof newUser.role })}
                className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white">
                <option value="shopper">Шоппер</option>
                <option value="auditor">Аудитор</option>
                <option value="manager">Руководитель бренда</option>
                <option value="admin">Администратор</option>
              </select>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-xs text-slate-300">
                Сеть / бренд
                <input value={newUser.network} onChange={(e) => setNewUser({ ...newUser, network: e.target.value })}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
              </label>
              <label className="block text-xs text-slate-300">
                Должность
                <input value={newUser.position} onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200">Отмена</button>
              <button type="submit" disabled={isSavingUser}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold">
                {isSavingUser ? "Сохранение…" : "Создать пользователя"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleUpdateUser} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white">Изменить пользователя</h3>
              <button type="button" onClick={() => setEditingUser(null)}><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-xs text-slate-300">ФИО *
              <input required value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
            </label>
            <label className="block text-xs text-slate-300">Логин *
              <input required minLength={3} value={editingUser.login} onChange={(e) => setEditingUser({ ...editingUser, login: e.target.value })}
                className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
            </label>
            <label className="block text-xs text-slate-300">Роль *
              <select value={editingUser.role === "inspector" ? "auditor" : editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white">
                <option value="shopper">Шоппер</option>
                <option value="auditor">Аудитор</option>
                <option value="manager">Руководитель бренда</option>
                <option value="admin">Администратор</option>
              </select>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-xs text-slate-300">Сеть / бренд
                <input value={editingUser.network || ""} onChange={(e) => setEditingUser({ ...editingUser, network: e.target.value })}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
              </label>
              <label className="block text-xs text-slate-300">Должность
                <input value={editingUser.position || ""} onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white" />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2.5 rounded-xl bg-slate-800">Отмена</button>
              <button type="submit" disabled={isSavingUser} className="px-4 py-2.5 rounded-xl bg-blue-600 disabled:opacity-50">
                {isSavingUser ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSetPassword} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-white">Изменить пароль</h3>
                <p className="text-xs text-slate-400 mt-1">{passwordUser.name} · {passwordUser.login}</p>
              </div>
              <button type="button" onClick={() => setPasswordUser(null)}><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-xs text-slate-300">Новый пароль *
              <div className="relative mt-1.5">
                <input required minLength={8} type={showPassword ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-white" />
                <button type="button" onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPasswordUser(null)} className="px-4 py-2.5 rounded-xl bg-slate-800">Отмена</button>
              <button type="submit" disabled={isSavingUser} className="px-4 py-2.5 rounded-xl bg-amber-600 disabled:opacity-50">
                {isSavingUser ? "Сохранение…" : "Изменить пароль"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDictionaryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-white">Справочники системы</h3>
                  <p className="text-xs text-slate-400">Бренды, регионы и города Республики Молдова</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDictionaryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {dictionaryColumn("Бренды", "brands", newBrand, setNewBrand)}
              {dictionaryColumn("Регионы", "regions", newRegion, setNewRegion)}
              {dictionaryColumn("Города", "cities", newCity, setNewCity)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
