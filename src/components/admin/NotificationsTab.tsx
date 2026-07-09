import React, { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, MessageSquare, AlertCircle, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { dataService } from '../../lib/dataService';

interface NotificationItem {
  id: string;
  message: string;
  target: 'all' | 'transport' | 'hotel';
  timestamp: string;
  sender: string;
}

interface NotificationsTabProps {
  selectedEventId: string;
  confirmedGuestsCount: number;
  hotelGuestsCount: number;
  transportGuestsCount: number;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export default function NotificationsTab({
  selectedEventId,
  confirmedGuestsCount,
  hotelGuestsCount,
  transportGuestsCount,
  showToast
}: NotificationsTabProps) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'transport' | 'hotel'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        if (dataService.isConfigured()) {
          const docSnap = await getDoc(doc(db, 'venue_settings', `notifications_${selectedEventId}`));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.list)) {
              setNotifications(data.list);
            }
          }
        } else {
          const cached = localStorage.getItem(`local_notifications_${selectedEventId}`);
          if (cached) {
            setNotifications(JSON.parse(cached));
          }
        }
      } catch (err) {
        console.warn('Failed loading notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [selectedEventId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const sender = localStorage.getItem('user_email') || 'system-admin';
      const newNotif: NotificationItem = {
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        message: message.trim(),
        target,
        timestamp: new Date().toISOString(),
        sender
      };

      const updatedList = [newNotif, ...notifications];

      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'venue_settings', `notifications_${selectedEventId}`), { list: updatedList });
      } else {
        localStorage.setItem(`local_notifications_${selectedEventId}`, JSON.stringify(updatedList));
      }

      setNotifications(updatedList);
      setMessage('');
      showToast('success', `Broadcast notification dispatched successfully to ${
        target === 'all' ? confirmedGuestsCount : target === 'hotel' ? hotelGuestsCount : transportGuestsCount
      } target guests.`);
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Failed sending broadcast notification.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification record?')) return;
    try {
      const updatedList = notifications.filter(n => n.id !== id);
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'venue_settings', `notifications_${selectedEventId}`), { list: updatedList });
      } else {
        localStorage.setItem(`local_notifications_${selectedEventId}`, JSON.stringify(updatedList));
      }
      setNotifications(updatedList);
      showToast('success', 'Notification deleted.');
    } catch (err) {
      showToast('error', 'Failed deleting notification.');
    }
  };

  const getTargetLabel = (t: 'all' | 'transport' | 'hotel') => {
    switch (t) {
      case 'all': return 'All Confirmed Guests';
      case 'transport': return 'Guests with Transport';
      case 'hotel': return 'Guests with Hotel Booking';
    }
  };

  return (
    <div id="notifications-tab-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Sender Column */}
      <div className="lg:col-span-5 bg-[#121212]/50 border border-white/5 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="text-gold" size={24} />
          <div>
            <h3 className="font-serif text-lg text-cream">Broadcast Center</h3>
            <p className="text-xs text-text-secondary">Dispatch SMS & Email updates to confirmed guests of this event.</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold">Target Audience Group</label>
            <select
              value={target}
              onChange={e => setTarget(e.target.value as any)}
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
            >
              <option value="all">All Confirmed Guests ({confirmedGuestsCount} guests)</option>
              <option value="transport">Transport Opt-ins Only ({transportGuestsCount} guests)</option>
              <option value="hotel">Hotel Booked Guests Only ({hotelGuestsCount} guests)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold">Notification Message</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Wedding dress code has been set to Indian Royal Formal. Also, transport shuttle leaves the Taj Goa lobby at exactly 5:00 PM tomorrow. Please be on time!"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors resize-none leading-relaxed placeholder-white/20"
            />
          </div>

          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="w-full bg-gold hover:brightness-110 text-dark py-3.5 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/10"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Dispatching Broadcast...
              </>
            ) : (
              <>
                <Send size={16} /> Send Broadcast
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Column */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-[#121212]/30 border border-white/5 rounded-xl p-6 sm:p-8">
          <h4 className="font-serif text-sm text-gold mb-6 flex items-center gap-2">
            <Clock size={16} /> Sent Notifications History
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gold" size={24} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
              <ShieldAlert className="mx-auto text-white/20 mb-2" size={24} />
              <p className="text-xs text-text-secondary font-mono">No previous notifications dispatched.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {notifications.map(n => (
                <div key={n.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 relative group">
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="absolute top-4 right-4 p-1 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Record"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex justify-between items-center text-[9px] font-mono text-gold/80">
                    <span className="bg-gold/10 px-1.5 py-0.5 rounded border border-gold/10">
                      {getTargetLabel(n.target)}
                    </span>
                    <span>{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                  
                  <p className="text-xs text-cream/90 leading-relaxed font-sans">{n.message}</p>
                  
                  <div className="text-[9px] font-mono text-white/30 text-right">
                    Sender: {n.sender}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
