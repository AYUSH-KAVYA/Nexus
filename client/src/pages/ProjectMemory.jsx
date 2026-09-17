import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Input, Badge, Spinner } from '../components/ui';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../api/client';
import { History, ArrowRight, Search } from 'lucide-react';

export default function ProjectMemory() {
  const { id } = useParams();
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get(`/projects/${id}/changes`)
      .then(res => setChanges(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = changes.filter(c => {
    const desc = (c.description || '').toLowerCase();
    const task = (c.task_title || c.taskName || '').toLowerCase();
    const proposer = (c.proposed_by_name || c.proposedBy?.name || '').toLowerCase();
    const q = filter.toLowerCase();
    return desc.includes(q) || task.includes(q) || proposer.includes(q);
  });

  const getStatusVariant = (status) => {
    switch (status) {
      case 'committed': return 'success';
      case 'proposed': return 'warning';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Project Memory</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable chronological ledger of task decisions and scope changes
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input 
            placeholder="Search changes or tasks..." 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            icon={<Search className="w-4 h-4 text-zinc-500" />}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card padding="p-12" className="text-center bg-zinc-900/40 border-zinc-800">
          <p className="text-xs text-zinc-400">No project change records match your search.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(change => {
            const proposerName = change.proposed_by_name || change.proposedBy?.name || 'Stakeholder';
            const proposerRole = change.proposed_by_role || change.proposedBy?.role || 'Team';
            const taskTitle = change.task_title || change.taskName || 'Project Task';
            
            let timeAgo = 'Recently';
            let formattedFullDate = '';
            if (change.created_at) {
              try {
                timeAgo = formatDistanceToNow(new Date(change.created_at), { addSuffix: true });
                formattedFullDate = format(new Date(change.created_at), 'PPpp');
              } catch {
                timeAgo = 'Recently';
              }
            }

            return (
              <Card key={change.id} className="overflow-hidden bg-zinc-900/85 border-zinc-800 hover:border-zinc-750 transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-xs uppercase">
                        {proposerName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-100">
                          {proposerName} <span className="text-zinc-500 font-normal text-xs">({proposerRole})</span>
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 font-mono" title={formattedFullDate}>
                          {timeAgo}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(change.status)}>{change.status}</Badge>
                  </div>
                  
                  <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed mb-5 pl-12">
                    {change.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Affected Task:</span>
                      <span className="text-xs font-semibold text-zinc-200 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                        {taskTitle}
                      </span>
                    </div>
                    <Link 
                      to={`/projects/${id}/changes/${change.id}/impact`}
                      className="text-amber-400 hover:text-amber-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      View Impact Analysis <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
