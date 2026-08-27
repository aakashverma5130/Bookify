import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Settings } from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { notificationApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const TYPE_BADGE = {
  DUE_REMINDER: 'warning',
  OVERDUE:      'overdue',
  RESERVATION:  'issued',
  SEAT:         'info',
  GENERAL:      'neutral',
};

const NotificationsPage = () => {
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifs(res.data.notifications || []);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id) => {
    await notificationApi.markRead(id);
    setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All marked as read');
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <AppShell title="Notifications">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-primary-400" />
            <span className="text-slate-400 text-sm">{unreadCount} unread</span>
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllRead}>
              Mark All Read
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : notifs.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
              <Bell size={48} className="text-slate-600" />
              <p className="text-sm">No notifications yet</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifs.map((n, i) => (
              <motion.div
                key={n.notification_id}
                className={`card cursor-pointer ${n.is_read ? 'opacity-60' : ''}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: n.is_read ? 0.6 : 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => !n.is_read && markRead(n.notification_id)}
              >
                <div className="flex items-start gap-3">
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      <Badge variant={TYPE_BADGE[n.type] || 'neutral'}>{n.type}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{n.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button onClick={(e) => { e.stopPropagation(); markRead(n.notification_id); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-success-400 hover:bg-success-500/10 transition-colors">
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default NotificationsPage;
