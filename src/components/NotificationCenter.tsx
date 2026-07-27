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
} from "lucide-react";

interface NotificationCenterProps {
  notifications: AppNotification[];
  currentUser?: UserAccount;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectAuditFromNotif: (auditId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectAuditFromNotif,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<AppNotification | null>(null);

  // Filter notifications for current user (or show all if admin/broad match)
  const userNotifications = notifications.filter((n) => {
    if (!currentUser) return true;
    if (currentUser.role === "admin") return true;
    if (n.recipientName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    if (currentUser.role === "manager" && (n.type === "NEW_AUDIT_FOR_APPROVAL" || n.type === "REVISION_SUBMITTED")) return true;
    if (currentUser.role === "inspector" && (n.type === "REVISION_REQUESTED" || n.type === "AUDIT_APPROVED")) return true;
    return true;
  });

  // Only show unread / active (unprocessed) notifications in the list
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
        title="Центр оповещений системы и E-mail"
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
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn backdrop-blur-xl">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white">
                  Оповещения ({unreadCount} новых)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Прочитать все</span>
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

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
              {userNotifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Нет новых оповещений
                </div>
              ) : (
                userNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-all hover:bg-slate-800/50 flex items-start gap-3 ${
                      !notif.read ? "bg-blue-950/20" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-200 truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {notif.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center justify-between gap-2">
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

                        {notif.emailSentSimulation && (
                          <button
                            type="button"
                            onClick={() => {
                              onMarkAsRead(notif.id);
                              setSelectedEmail(notif);
                            }}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Mail className="w-3 h-3 text-amber-400" />
                            <span>E-mail письмо</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* E-mail Simulation Modal */}
      {selectedEmail && selectedEmail.emailSentSimulation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-fadeIn">
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
                    setSelectedEmail(null);
                    setIsOpen(false);
                    onSelectAuditFromNotif(auditId);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Открыть Акт в системе</span>
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
