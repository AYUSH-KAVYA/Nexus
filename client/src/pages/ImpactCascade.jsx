import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Spinner, Button } from '../components/ui';
import ImpactTree from '../components/ImpactTree';
import api from '../api/client';
import { format } from 'date-fns';
import { ArrowLeft, GitPullRequest, Calendar, User, ShieldCheck } from 'lucide-react';

export default function ImpactCascade() {
  const { id, changeId } = useParams();
  const [change, setChange] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCascade = async () => {
      setLoading(true);
      setError(null);
      try {
        const changesRes = await api.get(`/projects/${id}/changes`);
        const foundChange = changesRes.data.find(c => String(c.id) === String(changeId));
        
        if (!foundChange) {
          setError('Change record not found');
          return;
        }

        setChange(foundChange);
        
        const taskId = foundChange.task_id || foundChange.taskId;
        if (taskId) {
          const impactRes = await api.get(`/projects/${id}/impact/tasks/${taskId}`);
          setImpactData(impactRes.data);
        } else {
          setImpactData({
            affectedTasks: [],
            affectedStakeholders: [],
            affectedApprovals: [],
            blastRadiusScore: 0,
            blastRadiusLevel: 'low'
          });
        }
      } catch (err) {
        console.error('Failed to load impact cascade:', err);
        setError('Failed to load impact data');
      } finally {
        setLoading(false);
      }
    };
    fetchCascade();
  }, [id, changeId]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-zinc-400">Computing impact cascade across dependency graph...</p>
      </div>
    );
  }

  if (error || !change) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <Card padding="p-8" className="bg-zinc-900/80 border-zinc-800">
          <GitPullRequest className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-zinc-100">Change Record Not Found</h2>
          <p className="text-xs text-zinc-400 mt-1 mb-6">
            The requested change record or its task impact simulation could not be located.
          </p>
          <Link
            to={`/projects/${id}/history`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold uppercase tracking-wider text-amber-300 border border-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Project Memory
          </Link>
        </Card>
      </div>
    );
  }

  const formattedDate = change.created_at 
    ? (() => {
        try {
          return format(new Date(change.created_at), 'MMM d, yyyy • h:mm a');
        } catch {
          return 'Recent';
        }
      })()
    : 'Recent';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-fade-up">
      <Link 
        to={`/projects/${id}/history`} 
        className="text-amber-400 hover:text-amber-300 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Project Memory
      </Link>
      
      {/* Change Overview Header */}
      <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Impact Cascade Analysis
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mt-1">
              {change.task_title || change.taskName || 'Project Change Request'}
            </h1>
          </div>
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md border uppercase tracking-wider font-semibold ${
            change.status === 'committed' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' :
            change.status === 'proposed' ? 'bg-amber-950/40 text-amber-300 border-amber-800' :
            'bg-rose-950/40 text-rose-300 border-rose-800'
          }`}>
            {change.status}
          </span>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80">
          {change.description}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-zinc-500" />
            <div>
              <span className="block text-zinc-500 text-[10px] uppercase font-semibold">Proposed By</span>
              <span className="font-semibold text-zinc-200">
                {change.proposed_by_name || change.proposedBy?.name || 'Stakeholder'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-zinc-500" />
            <div>
              <span className="block text-zinc-500 text-[10px] uppercase font-semibold">Reviewed By</span>
              <span className="font-semibold text-zinc-200">
                {change.reviewed_by_name || change.approvedBy?.name || 'Pending Review'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <div>
              <span className="block text-zinc-500 text-[10px] uppercase font-semibold">Timestamp</span>
              <span className="font-mono text-zinc-300">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Downstream Impact Tree / Blast Radius */}
      <Card padding="p-6" className="bg-zinc-900/80 border-zinc-800">
        <ImpactTree impact={impactData} isPreview={false} />
      </Card>
    </div>
  );
}
