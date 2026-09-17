import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../api/client';
import { Card, Button, Spinner, Badge } from '../components/ui';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.alerts || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/alerts/read-all');
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Coordination Alerts</h1>
            {unreadCount > 0 ? (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {unreadCount} unread
              </span>
            ) : (
              <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                All caught up
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time notifications triggered by dependency graph shifts and change approvals
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            loading={markingAll}
            icon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Content */}
      {alerts.length === 0 ? (
        <Card padding="p-12" className="text-center bg-zinc-900/50 border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-200">No New Updates</h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            You're all caught up! There are no pending coordination alerts or change notifications for your account at this time.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => !alert.is_read && handleMarkAsRead(alert.id)}
              className={`p-5 rounded-2xl border transition-all duration-150 ${
                !alert.is_read
                  ? 'bg-zinc-900/90 border-amber-500/40 hover:border-amber-500/60 shadow-lg shadow-black/20 cursor-pointer'
                  : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      !alert.is_read ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-zinc-700'
                    }`}
                  />
                  <div>
                    <p className={`text-sm leading-relaxed ${!alert.is_read ? 'font-medium text-zinc-100' : 'text-zinc-400'}`}>
                      {alert.message}
                    </p>
                    {alert.change_description && (
                      <p className="text-xs text-zinc-500 mt-1 italic">
                        Context: {alert.change_description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.created_at ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }) : 'Recently'}
                      </span>
                      {alert.created_at && (
                        <span>• {format(new Date(alert.created_at), 'MMM d, h:mm a')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {!alert.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(alert.id);
                    }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
