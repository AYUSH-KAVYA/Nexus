import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Card, Badge } from '../components/ui';
import api from '../api/client';

export default function TaskCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ownerId: '',
    tags: [],
    dependsOn: [],
    requiresApprovalFrom: ''
  });
  const [tagInput, setTagInput] = useState('');
  
  const [stakeholders, setStakeholders] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}/stakeholders`),
      api.get(`/projects/${id}/tasks`)
    ]).then(([stRes, tasksRes]) => {
      setStakeholders(stRes.data);
      setAllTasks(tasksRes.data);
    }).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (formData.tags.length > 0) {
      const suggested = allTasks.filter(t => 
        !formData.dependsOn.includes(t.id) && 
        t.tags?.some(tag => formData.tags.includes(tag))
      );
      setSuggestions(suggested);
    } else {
      setSuggestions([]);
    }
  }, [formData.tags, formData.dependsOn, allTasks]);

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !formData.tags.includes(val)) {
        setFormData({ ...formData, tags: [...formData.tags, val] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/projects/${id}/tasks`, formData);
      navigate(`/projects/${id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-up">
      <Card padding="p-8" className="bg-zinc-900/85 border-zinc-800 shadow-2xl">
        <div className="mb-6 pb-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Create New Task</h2>
          <p className="text-xs text-zinc-400 mt-1">Add task deliverables, dependencies, and sign-off requirements</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Title" 
            required 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            placeholder="e.g. Master Suite Millwork Installation"
          />
          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Description</label>
            <textarea 
              className="w-full rounded-xl bg-zinc-950/70 border border-zinc-700/80 p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              rows={3}
              placeholder="Provide scope specifications, vendor references, or delivery standards..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Owner</label>
              <select 
                className="w-full rounded-xl bg-zinc-950/70 border border-zinc-700/80 p-2.5 text-xs sm:text-sm text-zinc-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                value={formData.ownerId}
                onChange={e => setFormData({...formData, ownerId: e.target.value})}
              >
                <option value="" className="bg-zinc-900 text-zinc-400">Select Owner</option>
                {stakeholders.map(s => (
                  <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Requires Approval From (Optional)</label>
              <select 
                className="w-full rounded-xl bg-zinc-950/70 border border-zinc-700/80 p-2.5 text-xs sm:text-sm text-zinc-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                value={formData.requiresApprovalFrom}
                onChange={e => setFormData({...formData, requiresApprovalFrom: e.target.value})}
              >
                <option value="" className="bg-zinc-900 text-zinc-400">None</option>
                {stakeholders.map(s => (
                  <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 text-zinc-200 rounded-lg text-xs border border-zinc-700">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-zinc-400 hover:text-rose-300 font-bold">&times;</button>
                </span>
              ))}
            </div>
            <Input 
              placeholder="Type tag name and press Enter" 
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>

          {suggestions.length > 0 && (
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Smart Tag Link Suggestions</p>
              {suggestions.map(task => {
                const sharedTags = task.tags.filter(t => formData.tags.includes(t));
                return (
                  <div key={task.id} className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                    <p className="text-xs text-zinc-300">
                      Task <span className="font-semibold text-zinc-100">"{task.title}"</span> shares: {sharedTags.join(', ')}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        type="button" 
                        onClick={() => setFormData({...formData, dependsOn: [...formData.dependsOn, task.id]})}
                      >
                        Link Dependency
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate(`/projects/${id}`)} type="button">Cancel</Button>
            <Button type="submit" loading={loading} disabled={!formData.title}>Create Task</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
