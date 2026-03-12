import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../utils/complaintStore';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!user) return;
        // Load notifications immediately
        setNotifications(getNotifications(user.uid));
        // Poll every 5s for new notifications (simulates real-time)
        const interval = setInterval(() => {
            setNotifications(getNotifications(user.uid));
        }, 5000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unread = notifications.filter(n => !n.read).length;

    const handleNotifClick = (notif) => {
        if (!notif.read) {
            markNotificationRead(user.uid, notif.id);
            setNotifications(getNotifications(user.uid));
        }
    };

    const handleMarkAllRead = () => {
        markAllNotificationsRead(user.uid);
        setNotifications(getNotifications(user.uid));
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = Date.now() - date.getTime();
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
                <Bell className="w-5 h-5 text-white" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#f97316] rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse-ring">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 animate-fade-in overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        {unread > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-[#f97316] font-medium hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotifClick(n)}
                                    className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-slate-200' : 'bg-[#f97316]'}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 font-medium leading-tight">{n.message}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{formatTime(n.timestamp)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
