import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Spinner, Badge } from '../components/ui';
import ImpactTree from '../components/ImpactTree';
import api from '../api/client';
import { CheckCircle2, Clock, GitPullRequest, ShieldAlert } from 'lucide-react';

export default function PendingApprovals() {
  const { id } = useParams();
  
  const [changes, setChanges] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [changesRes, approvalsRes] = await Promise.all([
        api.get(`/projects/${id}/changes/pending`),
        api.get(`/projects/${id}/approvals/pending`)
      ]);
      setChanges(changesRes.data || []);
      setApprovals(approvalsRes.data || []);
    } catch (err) {
      console.error('Failed to load pending reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handlePreview = async (change) => {
    if (previewId === change.id) {
      setPreviewId(null);
      setPreviewData(null);
      return;
    }
    setPreviewId(change.id);
    try {
      const taskId = change.task_id || change.taskId;
      if (!taskId) return;
      const res = await api.get(`/projects/${id}/impact/tasks/${taskId}`);
      setPreviewData(res.data);
    } catch (err) {
      console.error('Failed to preview impact:', err);
    }
  };

  const handleAction = async (changeId, action) => {
    setActionLoading(prev => ({ ...prev, [changeId]: action }));
    try {
      await api.post(`/projects/${id}/changes/${changeId}/${action}`);
      setPreviewId(null);
      setPreviewData(null);
      fetchData();
    } catch (err) {
      console.error(`Failed to ${action} change:`, err);
      alert(`Failed to ${action} change`);
    } finally {
      setActionLoading(prev => ({ ...prev, [changeId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-zinc-400">Loading pending change requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-10 animate-fade-up">
      {/* Pending Change Requests */}
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Pending Change Requests</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Review impact cascade and approve or reject proposed modifications</p>
          </div>
          <span className="text-xs font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold">
            {changes.length} Pending Review
          </span>
        </div>

        {changes.length === 0 ? (
          <Card padding="p-10" className="text-center bg-zinc-900/40 border-zinc-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-zinc-200">All Caught Up</h4>
            <p className="text-xs text-zinc-400 mt-1">
              No pending change requests awaiting review in this project.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {changes.map(change => (
              <Card key={change.id} className="overflow-hidden bg-zinc-900/85 border-zinc-800">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-base text-zinc-100">
                        {change.task_title || change.taskName || 'Project Change Request'}
                      </h3>
                      <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">{change.description}</p>
                      <p className="text-xs text-zinc-400 mt-3 font-mono">
                        Proposed by <span className="font-semibold text-amber-300">{change.proposed_by_name || 'Stakeholder'}</span>
                        {change.proposed_by_role && (
                          <span className="text-zinc-500"> ({change.proposed_by_role})</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handlePreview(change)}
                      >
                        {previewId === change.id ? 'Hide Impact' : 'Preview Impact'}
                      </Button>
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={() => handleAction(change.id, 'approve')}
                        loading={actionLoading[change.id] === 'approve'}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleAction(change.id, 'reject')}
                        loading={actionLoading[change.id] === 'reject'}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  
                  {previewId === change.id && previewData && (
                    <div className="mt-6 pt-6 border-t border-zinc-800 animate-fade-up">
                      <ImpactTree impact={previewData} isPreview={true} />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Task Approvals */}
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-zinc-400" />
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Milestone Approval Gates</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Task milestone sign-offs requiring stakeholder authorization</p>
          </div>
          <span className="text-xs font-mono uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded-full font-semibold">
            {approvals.length} Awaiting Sign-off
          </span>
        </div>

        {approvals.length === 0 ? (
          <Card padding="p-10" className="text-center bg-zinc-900/40 border-zinc-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-zinc-200">No Approvals Needed</h4>
            <p className="text-xs text-zinc-400 mt-1">
              All task milestones and sign-off gates are current.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden bg-zinc-900/85 border-zinc-800">
            <ul className="divide-y divide-zinc-800/80">
              {approvals.map(approval => (
                <li key={approval.id} className="p-4 flex justify-between items-center hover:bg-zinc-850/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-zinc-100">{approval.task_title || 'Milestone Task'}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Required from: <span className="text-amber-300 font-medium">{approval.stakeholder_name}</span>
                    </p>
                  </div>
                  <Badge variant="warning">{approval.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
