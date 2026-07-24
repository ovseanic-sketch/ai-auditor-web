import React, { useState } from "react";
import { UserAccount, UserRole } from "../types";
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  UserCheck,
  Search,
  Lock,
  Unlock,
  Key,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  AlertCircle,
  UserX,
} from "lucide-react";

interface UserManagementProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (user: Omit<UserAccount, "id" | "createdAt">) => void;
  onUpdateUserStatus: (id: string, status: "active" | "blocked") => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
  onDeleteUser: (id: string) => void;
  onResetPassword: (id: string, newPass: string) => void;
  onUpdateUserInfo?: (
    id: string,
    updatedData: { name?: string; login?: string; password?: string; role?: UserRole }
  ) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUserStatus,
  onUpdateUserRole,
  onDeleteUser,
  onResetPassword,
  onUpdateUserInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");

  // Edit User State
  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogin, setEditLogin] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("admin");
  const [editError, setEditError] = useState<string | null>(null);

  // New User Form State
  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("inspector");
  const [formError, setFormError] = useState<string | null>(null);

  const openEditModal = (user: UserAccount) => {
    setEditUser(user);
    setEditName(user.name);
    setEditLogin(user.login);
    setEditPassword(user.password || "admin123");
    setEditRole(user.role);
    setEditError(null);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditError(null);

    if (!editName.trim() || !editLogin.trim() || !editPassword.trim()) {
      setEditError("Заполните все поля (ФИО, Логин, Пароль)");
      return;
    }

    // Check duplicate logins
    const isDuplicate = users.some(
      (u) => u.id !== editUser.id && u.login.toLowerCase() === editLogin.trim().toLowerCase()
    );
    if (isDuplicate) {
      setEditError("Пользователь с таким логином уже существует");
      return;
    }

    if (onUpdateUserInfo) {
      onUpdateUserInfo(editUser.id, {
        name: editName.trim(),
        login: editLogin.trim(),
        password: editPassword.trim(),
        role: editRole,
      });
    }

    setEditUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.login.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newLogin.trim() || !newPassword.trim() || !newName.trim()) {
      setFormError("Заполните все обязательные поля (Логин, Пароль, ФИО)");
      return;
    }

    if (users.some((u) => u.login.toLowerCase() === newLogin.trim().toLowerCase())) {
      setFormError("Пользователь с таким логином уже существует в системе");
      return;
    }

    onAddUser({
      login: newLogin.trim(),
      password: newPassword.trim(),
      name: newName.trim(),
      role: newRole,
      status: "active",
    });

    setNewLogin("");
    setNewPassword("");
    setNewName("");
    setNewRole("inspector");
    setShowAddModal(false);
  };

  const handleConfirmResetPassword = (userId: string) => {
    if (!newPasswordVal.trim()) return;
    onResetPassword(userId, newPasswordVal.trim());
    setResetModalUserId(null);
    setNewPasswordVal("");
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Администратор</span>
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Crown className="w-3 h-3 text-indigo-400" />
            <span>Руководитель ОКК</span>
          </span>
        );
      case "inspector":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
            <UserCheck className="w-3 h-3 text-blue-400" />
            <span>Проверяющий</span>
          </span>
        );
    }
  };

  return (
    <div id="user-management-container" className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Панель администрирования</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Admin Zone
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Управление именами, логинами и паролями администраторов и проверяющих, назначение ролей и блокировка доступа
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Edit Administrator Name Button */}
          {currentUser.role === "admin" && (
            <button
              type="button"
              onClick={() => openEditModal(currentUser)}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
              <span>Изменить имя админа ({currentUser.name})</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Создать пользователя</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Profile Highlight Card */}
      {currentUser.role === "admin" && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Текущее имя администратора: <strong className="text-blue-400">{currentUser.name}</strong></span>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full font-mono border border-blue-500/20">@{currentUser.login}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Пароль администратора: <span className="font-mono text-slate-300">••••••••</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => openEditModal(currentUser)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Редактировать ФИО и пароль</span>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Поиск по ФИО или логину..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none transition-all placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium shrink-0">Фильтр по роли:</span>
          {["all", "admin", "manager", "inspector"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === role
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {role === "all"
                ? "Все роли"
                : role === "admin"
                ? "Администраторы"
                : role === "manager"
                ? "Руководители"
                : "Проверяющие"}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-4 px-4">Сотрудник / Логин</th>
                <th className="py-4 px-4">Роль доступа</th>
                <th className="py-4 px-4">Статус</th>
                <th className="py-4 px-4">Дата создания</th>
                <th className="py-4 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Пользователи по заданным критериям не найдены.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      user.status === "blocked" ? "opacity-60 bg-red-950/10" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-slate-200 shadow-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{user.name}</span>
                            {user.id === currentUser.id && (
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                                Это вы (Админ)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            @{user.login}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        {/* Role Switcher Select */}
                        {user.id !== currentUser.id && (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              onUpdateUserRole(user.id, e.target.value as UserRole)
                            }
                            className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                          >
                            <option value="admin">Администратор</option>
                            <option value="manager">Руководитель</option>
                            <option value="inspector">Проверяющий</option>
                          </select>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {user.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Активен</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                          <UserX className="w-3 h-3" />
                          <span>Заблокирован</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-400 font-mono">
                      {user.createdAt}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit User Button (Change Name, Login, Password) */}
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-all"
                          title="Изменить имя, логин и пароль"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => setResetModalUserId(user.id)}
                          className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-all"
                          title="Сбросить пароль"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {/* Block / Unblock Toggle */}
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() =>
                              onUpdateUserStatus(
                                user.id,
                                user.status === "active" ? "blocked" : "active"
                              )
                            }
                            className={`p-2 rounded-xl transition-all ${
                              user.status === "active"
                                ? "text-slate-400 hover:text-red-400 hover:bg-slate-800"
                                : "text-emerald-400 hover:bg-emerald-950/40"
                            }`}
                            title={
                              user.status === "active"
                                ? "Заблокировать пользователя"
                                : "Разблокировать пользователя"
                            }
                          >
                            {user.status === "active" ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Delete User Button */}
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => onDeleteUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all"
                            title="Удалить аккаунт"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT USER / ADMINISTRATOR MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <span>Редактирование профиля: {editUser.name}</span>
              </h3>
              <button
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ФИО / Имя администратора или пользователя:
                </label>
                <input
                  type="text"
                  placeholder="Имя администратора"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Логин для входа в систему:
                </label>
                <input
                  type="text"
                  placeholder="admin"
                  value={editLogin}
                  onChange={(e) => setEditLogin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Пароль доступа:
                </label>
                <input
                  type="text"
                  placeholder="••••••••"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Роль пользователя:
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none transition-all"
                >
                  <option value="admin">Администратор (Полный доступ)</option>
                  <option value="manager">Руководитель (ОКК / Аналитика)</option>
                  <option value="inspector">Проверяющий (Mystery Shopper)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>Создание новой учетной записи</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ФИО пользователя:
                </label>
                <input
                  type="text"
                  placeholder="Иван Иванов"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Логин для входа:
                </label>
                <input
                  type="text"
                  placeholder="ivan_manager"
                  value={newLogin}
                  onChange={(e) => setNewLogin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Временный пароль:
                </label>
                <input
                  type="text"
                  placeholder="Pass1234!"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Роль доступа:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-semibold"
                >
                  <option value="inspector">Проверяющий (Аудитор / Mystery Shopper)</option>
                  <option value="manager">Руководитель (ОКК / Дирекция)</option>
                  <option value="admin">Администратор (Полный доступ)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
                >
                  Создать пользователя
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              <span>Сброс пароля пользователя</span>
            </h3>

            <p className="text-xs text-slate-400">
              Укажите новый пароль для учетной записи:
            </p>

            <input
              type="text"
              placeholder="Новый пароль..."
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetModalUserId(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
              >
                Отмена
              </button>
              <button
                onClick={() => handleConfirmResetPassword(resetModalUserId)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
              >
                Сохранить новый пароль
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
