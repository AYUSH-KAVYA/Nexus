import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Activity, RefreshCw, Layers, ArrowRight, CheckCircle2, Zap, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function EventLog() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const orgId = user?.organizationId;

  const fetchEvents = async () => {
    if (!orgId) return;
    try {
      const { data } = await client.get(`/organizations/${orgId}/events?limit=50`);
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load domain events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [orgId]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchEvents();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, orgId]);

  const getSourceBadge = (sourceApp) => {
    switch (sourceApp) {
      case 'nexus':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
            Nexus Core
          </span>
        );
      case 'nexus_signal':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
            Nexus Signal
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-700/50 text-zinc-300 border border-zinc-600 uppercase">
            Platform
          </span>
        );
    }
  };

  const getEventTypeIcon = (eventType) => {
    switch (eventType) {
      case 'CONVERSATION_ITEM_CONFIRMED':
        return <Zap className="w-4 h-4 text-indigo-400" />;
      case 'IMPACT_ENGINE_TRIGGERED':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'CHANGE_COMMITTED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Layers className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Cross-App Event Bus
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Domain Events & System Activity
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit trail of asynchronous domain events emitted across Nexus, Nexus Signal, and shared platform services.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-900"
            />
            <span>Live Stream (4s)</span>
          </label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchEvents}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Events Feed */}
      {loading && events.length === 0 ? (
        <div className="p-12 text-center">
          <Spinner />
          <p className="text-xs text-zinc-500 mt-2">Loading domain events...</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="p-12 text-center bg-zinc-900/50 border-zinc-800">
          <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">No domain events recorded yet</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Perform an action like confirming a conversation item in Signal or committing a change in Nexus.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

            return (
              <Card 
                key={event.id}
                className="p-4 bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-all font-sans"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
                      {getEventTypeIcon(event.event_type)}
                    </div>
                    <span className="font-mono text-xs font-bold text-white">
                      {event.event_type}
                    </span>
                    {getSourceBadge(event.source_app)}
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Payload details */}
                <div className="mt-2 text-xs bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/60 font-mono text-zinc-300 space-y-1 overflow-x-auto">
                  {event.event_type === 'CONVERSATION_ITEM_CONFIRMED' && (
                    <div className="space-y-0.5">
                      <div className="text-amber-400 font-semibold">{payload.description}</div>
                      <div className="text-[11px] text-zinc-400">
                        Type: <span className="text-zinc-200">{payload.item_type}</span> · 
                        Task ID: <span className="text-zinc-200">{payload.resolved_task_id}</span>
                      </div>
                    </div>
                  )}

                  {event.event_type === 'IMPACT_ENGINE_TRIGGERED' && (
                    <div className="flex items-center gap-4 text-[11px]">
                      <div>Blast Radius: <span className={`font-bold ${payload.blast_radius_level === 'high' ? 'text-rose-400' : payload.blast_radius_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{payload.blast_radius_level?.toUpperCase()} ({payload.blast_radius_score})</span></div>
                      <div>Affected Tasks: <span className="text-white font-bold">{payload.affected_tasks_count}</span></div>
                      <div>Gates Reopened: <span className="text-white font-bold">{payload.approval_gates_reopened}</span></div>
                    </div>
                  )}

                  {event.event_type === 'CHANGE_COMMITTED' && (
                    <div className="space-y-0.5 text-[11px]">
                      <div className="text-emerald-400 font-semibold">{payload.description}</div>
                      <div className="text-zinc-400">
                        Task: <span className="text-zinc-200">{payload.task_id}</span> · 
                        Blast Radius: <span className="text-zinc-200">{payload.blast_radius_score} ({payload.blast_radius_level})</span>
                      </div>
                    </div>
                  )}

                  {(event.event_type === 'APP_ENABLED' || event.event_type === 'APP_DISABLED') && (
                    <div className="text-[11px] text-zinc-400">
                      App: <span className="text-amber-300 font-semibold">{payload.app_name}</span> · 
                      Toggled by: <span className="text-white">{payload.toggled_by}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
