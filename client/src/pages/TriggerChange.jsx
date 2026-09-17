import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Spinner } from '../components/ui';
import ImpactTree from '../components/ImpactTree';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { ArrowLeft, GitPullRequest, AlertCircle } from 'lucide-react';

export default function TriggerChange() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPM, isAdmin } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ taskId: '', description: '' });
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    api.get(`/projects/${id}/tasks`)
      .then(res => setTasks(res.data || []))
      .catch(err => {
        console.error('Failed to load tasks for change request:', err);
        setError('Failed to load project tasks');
      });
  }, [id]);

  const handlePreview = async () => {
    if (!formData.taskId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${id}/impact/tasks/${formData.taskId}`);
      setImpactData(res.data);
    } catch (err) {
      console.error('Failed to preview impact:', err);
      setError('Failed to generate impact preview across dependency graph.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.taskId || !formData.description) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/projects/${id}/changes`, formData);
      navigate(`/projects/${id}`);
    } catch (err) {
      console.error('Failed to submit change:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit change request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fade-up">
      <Link 
        to={`/projects/${id}`} 
        className="text-amber-400 hover:text-amber-300 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Project Workspace
      </Link>

      <Card padding="p-8" className="bg-zinc-900/85 border-zinc-800 shadow-2xl">
        <div className="mb-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Propose Change</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Submit modifications for automated dependency blast radius analysis
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
            {isPM || isAdmin ? 'Direct Commit' : 'Review Gate'}
          </span>
        </div>

        {error && (
          <div className="mb-5 p-3 text-xs text-rose-300 bg-rose-950/50 rounded-xl border border-rose-800/60 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Affected Task <span className="text-rose-400">*</span>
            </label>
            <select 
              className="w-full rounded-xl bg-zinc-950/70 border border-zinc-700/80 p-3 text-xs sm:text-sm text-zinc-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              value={formData.taskId}
              onChange={e => {
                setFormData({ ...formData, taskId: e.target.value });
                setImpactData(null);
              }}
            >
              <option value="" className="bg-zinc-900 text-zinc-400">Select a task in this project...</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id} className="bg-zinc-900 text-zinc-200">
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Change Description <span className="text-rose-400">*</span>
            </label>
            <textarea 
              className="w-full rounded-xl bg-zinc-950/70 border border-zinc-700/80 p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              rows={4}
              placeholder="Describe the reason for delay, material substitution, or specification update..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              variant="secondary" 
              onClick={handlePreview} 
              disabled={!formData.taskId || loading}
              loading={loading}
              className="flex-1"
            >
              Preview Impact
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.taskId || !formData.description || submitting}
              loading={submitting}
              className="flex-1"
            >
              {isPM || isAdmin ? 'Commit Change' : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </Card>

      {impactData && (
        <Card padding="p-6" className="bg-zinc-900/90 border-zinc-800 shadow-xl animate-fade-up">
          <ImpactTree impact={impactData} isPreview={true} />
        </Card>
      )}
    </div>
  );
}
