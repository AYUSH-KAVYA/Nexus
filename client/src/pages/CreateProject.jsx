import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import StakeholderWizard from '../components/StakeholderWizard';
import api from '../api/client';

export default function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState({ name: '', description: '' });
  const [stakeholders, setStakeholders] = useState([]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const projRes = await api.post('/projects', projectData);
      const projectId = projRes.data.id;
      if (stakeholders.length > 0) {
        await api.post(`/projects/${projectId}/stakeholders/bulk`, { stakeholders });
      }
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create project.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
        {[1, 2, 3].map(s => (
          <div 
            key={s} 
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${s <= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'} z-10 shadow-sm`}
          >
            {s}
          </div>
        ))}
      </div>

      <Card padding="p-8" className="bg-zinc-900/85 border-zinc-800 shadow-2xl">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Project Details</h2>
              <p className="text-xs text-zinc-400 mt-1">Define project scope and architectural baseline</p>
            </div>
            <Input 
              label="Project Name" 
              value={projectData.name}
              onChange={e => setProjectData({...projectData, name: e.target.value})}
              required
              placeholder="e.g. Modernist Residence Renovation"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Description (Optional)</label>
              <textarea 
                className="w-full rounded-xl bg-zinc-950/70 border border-zinc-700/80 p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                rows={4}
                value={projectData.description}
                onChange={e => setProjectData({...projectData, description: e.target.value})}
                placeholder="High-level project scope, architectural blueprints, or client priorities..."
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <Button onClick={() => setStep(2)} disabled={!projectData.name.trim()}>Next Step</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Add Stakeholders</h2>
              <p className="text-xs text-zinc-400 mt-1">Configure project teams, trade contractors, and client liaisons</p>
            </div>
            <StakeholderWizard stakeholders={stakeholders} setStakeholders={setStakeholders} />
            <div className="flex justify-between mt-8 pt-6 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Review & Create</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Review & Create</h2>
              <p className="text-xs text-zinc-400 mt-1">Confirm configuration prior to generating dependency graph</p>
            </div>
            
            <div className="bg-zinc-950/60 border border-zinc-800 p-6 rounded-2xl space-y-4">
              <div>
                <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Project</h4>
                <p className="text-base font-semibold text-zinc-100 mt-0.5">{projectData.name}</p>
                {projectData.description && <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{projectData.description}</p>}
              </div>
              
              <div className="pt-4 border-t border-zinc-800/80">
                <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Stakeholders ({stakeholders.length})</h4>
                <ul className="space-y-2">
                  {stakeholders.map((s, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                      <span className="font-semibold text-amber-300">{s.role}</span>
                      <span className="text-zinc-400">{s.name || 'Pending Name'} ({s.email || 'No email'})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setStep(2)} disabled={loading}>Back</Button>
              <Button onClick={handleSubmit} loading={loading}>Create Project</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
