import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

function NotificationBell() {
  const { user } = useAuth();
  const { t } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    // Load initial historical notifications from the database
    API.get(`/notifications/${user.id}`)
      .then((res) => {
        setNotifications(res.data.map((n) => ({
          id: n.id,
          type: n.type || 'general',
          subject: n.subject || 'TableReserve Notification',
          message: n.message || '',
          email: n.email,
          phone: n.phone,
          sent_via_smtp: n.sent_via_smtp,
          sent_via_sms: n.sent_via_sms,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(n.created_at).toLocaleDateString(),
        })));
      })
      .catch((err) => console.error('Failed to load notifications:', err));

    const socket = io();
    socket.emit('joinUser', user.id);

    socket.on('notification', (payload) => {
      const newNotif = {
        id: Date.now(),
        type: payload.type || 'general',
        subject: payload.subject || 'TableReserve Notification',
        message: payload.message || '',
        email: user.email,
        phone: user.phone,
        sent_via_smtp: false,
        sent_via_sms: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket.disconnect();
  }, [user?.id, user?.email, user?.phone]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) {
            setUnreadCount(0);
          }
        }}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {Math.min(unreadCount, 9)}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-2 w-80 ${t.card} rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto`}>
          <div className={`p-3 border-b font-semibold text-sm ${t.text} flex justify-between items-center`}>
            <span>Notifications Log</span>
            <span className="text-[10px] font-normal opacity-70">Click to preview simulation</span>
          </div>
          {notifications.length === 0 ? (
            <p className={`p-4 text-sm ${t.muted} text-center`}>No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setSelectedNotification(n);
                  setOpen(false);
                }}
                className={`w-full text-left p-3 border-b text-sm ${t.text} hover:bg-violet-500/10 transition-colors flex flex-col`}
              >
                <div className="flex justify-between items-center w-full">
                  <p className="font-semibold capitalize flex items-center gap-1.5">
                    <span>{n.type === 'reminder' ? '⏰' : n.type.includes('payment') ? '💳' : '🎉'}</span>
                    {n.type?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] opacity-50">{n.time}</p>
                </div>
                <p className={`${t.muted} text-xs mt-1 truncate w-full`}>{n.message}</p>
              </button>
            ))
          )}
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`${t.card} w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden`}>
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold">Simulated Delivery Channel</h4>
                <p className="text-xs opacity-80">Interactive email and SMS simulator</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="text-white text-2xl hover:opacity-70 transition-opacity font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Channel Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-xl p-4 flex flex-col justify-between h-28 bg-blue-500/5 border-blue-200">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className={`text-sm font-bold ${t.text}`}>Email Channel</p>
                    <p className={`text-xs ${t.muted}`}>
                      {selectedNotification.sent_via_smtp ? '🟢 Sent via SMTP' : '🟡 Simulated Offline'}
                    </p>
                  </div>
                </div>

                <div className="border rounded-xl p-4 flex flex-col justify-between h-28 bg-emerald-500/5 border-emerald-200">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className={`text-sm font-bold ${t.text}`}>SMS Channel</p>
                    <p className={`text-xs ${t.muted}`}>
                      {selectedNotification.sent_via_sms ? '🟢 Sent via Twilio' : '🟡 Simulated Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Client Layout */}
              <div className="border rounded-xl shadow-md overflow-hidden bg-white text-slate-800 text-left">
                <div className="bg-slate-100 p-3 border-b text-xs space-y-1 text-slate-600 font-mono">
                  <p><span className="font-bold text-slate-800">From:</span> TableReserve &lt;noreply@tablereserve.com&gt;</p>
                  <p><span className="font-bold text-slate-800">To:</span> {selectedNotification.email || user.email}</p>
                  <p><span className="font-bold text-slate-800">Subject:</span> {selectedNotification.subject}</p>
                  <p><span className="font-bold text-slate-800">Date:</span> {selectedNotification.date} at {selectedNotification.time}</p>
                </div>
                <div className="p-4 text-sm font-sans leading-relaxed whitespace-pre-wrap select-text text-slate-800 bg-slate-50 min-h-36">
                  {selectedNotification.message}
                </div>
              </div>

              {/* Twilio SMS Layout */}
              <div className="border rounded-2xl shadow-lg bg-slate-900 text-white max-w-sm mx-auto overflow-hidden">
                <div className="bg-slate-800 p-3 text-center text-xs font-bold tracking-wider text-slate-300 border-b border-slate-700">
                  💬 TableReserve SMS (Twilio Sandbox)
                </div>
                <div className="p-4 space-y-3 bg-slate-950 min-h-28">
                  <div className="bg-slate-800 text-white p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-[85%] select-text font-mono">
                    {selectedNotification.subject}
                    <hr className="my-2 border-slate-700" />
                    {selectedNotification.message}
                  </div>
                  <p className="text-[9px] text-slate-500 text-right font-mono">Delivered to: {selectedNotification.phone || user.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Helpful instructions */}
              <div className="bg-amber-500/10 border border-amber-300/50 rounded-xl p-4 text-xs">
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">💡 Real SMTP & SMS Configuration Tip:</p>
                <p className={`${t.muted} leading-relaxed`}>
                  To enable real mail and SMS sending, configure <code className="bg-amber-500/20 px-1 rounded">EMAIL_USER</code> and <code className="bg-amber-500/20 px-1 rounded">EMAIL_PASS</code> (or Twilio credentials) in your environment variables. Without them, TableReserve operates in <strong>Simulated delivery mode</strong>, preserving booking records and displaying notifications here!
                </p>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md transition-colors"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
