import React, { useState } from "react";
import { AppNotification, UserAccount } from "../types";
import {
  Bell,
  Mail,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Clock,
  ExternalLink,
  CheckCheck,
  Send,
  Check,
  Sparkles,
  Key,
  Trash2,
} from "lucide-react";

interface NotificationCenterProps {
  notifications: AppNotification[];
  currentUser?: UserAccount;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectAuditFromNotif: (auditId: string) => void;
  onApproveDeleteAudit?: (auditId: string, notifId: string) => void;
  onRejectDeleteAudit?: (notifId: string, auditId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectAuditFromNotif,
  onApproveDeleteAudit,
  onRejectDeleteAudit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<AppNotification | null>(null);

  if (currentUser?.role === "shopper") {
    return null;
  }

  // Filter notifications for current user
  const userNotifications = notifications.filter((n) => {
    if (!currentUser) return true;
    if (currentUser.role === "admin") return true;
    if (n.recipientName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    if (currentUser.role === "manager" && (n.type === "NEW_AUDIT_FOR_APPROVAL" || n.type === "REVISION_SUBMITTED")) return true;
    if (currentUser.role === "inspector" && (n.type === "REVISION_REQUESTED" || n.type === "AUDIT_APPROVED" || n.type === "NEW_AUDIT_FOR_APPROVAL")) return true;
    return true;
  });

  // STRICT REQUIREMENT: Only active (unread / unprocessed) notifications in the dropdown list
  const activeNotifications = userNotifications.filter((n) => !n.read);
  const unreadCount = activeNotifications.length;

  const getNotifIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "NEW_AUDIT_FOR_APPROVAL":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "AUDIT_APPROVED":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "REVISION_REQUESTED":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "REVISION_SUBMITTED":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "PASSWORD_RESET_REQUEST":
        return <Key className="w-4 h-4 text-amber-400" />;
      case "AUDIT_DELETE_REQUEST":
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        title="Центр активных оповещений"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse border-2 border-slate-950 shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn backdrop-blur-xl">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Активные оповещения</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-mono border border-red-500/30">
                      {unreadCount}
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkAllAsRead();
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Отметить все как прочитанные"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Очистить все</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List - ONLY Active (Unread) Items */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
              {activeNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Sparkles className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="font-semibold text-slate-300">Нет активных оповещений</p>
                  <p className="text-[11px] text-slate-500">Все поступившие отчеты и уведомления обработаны.</p>
                </div>
              ) : (
                activeNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3.5 transition-all hover:bg-slate-800/60 bg-blue-950/20 flex items-start gap-3 relative group"
                  >
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-white truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                          {notif.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2">
                        {notif.message}
                      </p>

                      {/* Delete Request Admin Approval Action Buttons */}
                      {notif.type === "AUDIT_DELETE_REQUEST" && currentUser?.role === "admin" && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-red-950/40 border border-red-500/30 rounded-xl">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onApproveDeleteAudit) {
                                onApproveDeleteAudit(notif.auditId, notif.id);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                            title="Подтвердить удаление утвержденной проверки"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Подтвердить удаление</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onRejectDeleteAudit) {
                                onRejectDeleteAudit(notif.id, notif.auditId);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="Отклонить запрос на удаление"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Отклонить</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        {notif.auditId ? (
                          <button
                            type="button"
                            onClick={() => {
                              onMarkAsRead(notif.id);
                              onSelectAuditFromNotif(notif.auditId);
                              setIsOpen(false);
                            }}
                            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Перейти к Акту ({notif.auditId})</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            Запрос сброса пароля
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {notif.emailSentSimulation && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmail(notif);
                              }}
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Mail className="w-3 h-3 text-amber-400" />
                              <span>E-mail</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onMarkAsRead(notif.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Отметить как прочитанное (скрыть из активных)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sub-Footer */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              Отображаются только нерассмотренные (активные) уведомления
            </div>
          </div>
        </>
      )}

      {/* E-mail Simulation Modal */}
      {selectedEmail && selectedEmail.emailSentSimulation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Mail className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">
                  Симуляция отправленного E-mail уведомления
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Header Info */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">От кого:</span>
                <span className="text-slate-200 font-semibold">Система ОКК &lt;noreply-okk@company.com&gt;</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">Кому (Руководителю/Аудитору):</span>
                <span className="text-blue-400 font-bold">
                  {selectedEmail.emailSentSimulation.toName} &lt;{selectedEmail.emailSentSimulation.toEmail}&gt;
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Тема письма:</span>
                <span className="text-amber-300 font-bold">{selectedEmail.emailSentSimulation.subject}</span>
              </div>
            </div>

            {/* Email Body */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans font-medium max-h-60 overflow-y-auto">
              {selectedEmail.emailSentSimulation.bodyText}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <Send className="w-3.5 h-3.5" />
                <span>Письмо успешно доставлено по SMTP протоколу</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const auditId = selectedEmail.auditId;
                    onMarkAsRead(selectedEmail.id);
                    setSelectedEmail(null);
                    setIsOpen(false);
                    onSelectAuditFromNotif(auditId);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Перейти к Акту и закрыть</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
