import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { notificationService } from '../../services/notification.service';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import type { Notification } from '../../types';

const TYPE_ICONS: Record<string, string> = {
  new_inquiry: '💬',
  new_reply: '↩️',
  listing_approved: '✅',
  listing_rejected: '❌',
  premium_activated: '⭐',
  listing_flagged: '🚩',
  property_rented: '🔑',
  rental_agreement_created: '📝',
  broker_application_received: '💼',
  broker_approved: '🎉',
  broker_rejected: '⚠️',
  payment_confirmed: '💳',
  new_owner_submission: '🏠',
  owner_submission_accepted: '🤝',
  owner_submission_rejected: '❌',
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ limit: 20 }),
    enabled: !!user,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const notifications: Notification[] = data?.data?.notifications || [];
  const unreadCount: number = data?.data?.unreadCount || 0;

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket) return;
    socket.on('notification', (notif: any) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (notif?.message) {
        toast.info(notif.message, { duration: 6000 });
      }
    });
    return () => { socket.off('notification'); };
  }, [socket, queryClient]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => notificationService.markAsRead(n._id)));
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
            style={{ background: '#0D1422', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/40">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n._id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      !n.read ? 'bg-amber-500/5' : ''
                    }`}>
                    <span className="text-lg shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${n.read ? 'text-white/60' : 'text-white'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-white/30 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
                        <button onClick={() => markRead.mutate(n._id)}
                          className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500/30">
                          <CheckCheck className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => deleteNotif.mutate(n._id)}
                        className="w-6 h-6 rounded-lg bg-white/5 text-white/40 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
