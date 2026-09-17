import React, { useState } from 'react';
import { Button, Input } from './ui';
import { Plus } from 'lucide-react';

const PREDEFINED_ROLES = [
  'Client', 'Lead Architect', 'Interior Designer', 'PM', 'Site Supervisor', 
  'Structural Consultant', 'MEP Consultant', 'Electrician', 'Plumber', 
  'Flooring Contractor', 'Furniture Vendor', 'Lighting Vendor', 'Compliance Officer'
];

export default function StakeholderWizard({ stakeholders, setStakeholders, projectId }) {
  const [customRole, setCustomRole] = useState('');
  
  const handleToggleRole = (role) => {
    const exists = stakeholders.find(s => s.role === role);
    if (exists) {
      setStakeholders(stakeholders.filter(s => s.role !== role));
    } else {
      setStakeholders([...stakeholders, { 
        role, 
        name: '', 
        email: '', 
        accessLevel: role === 'PM' ? 'pm' : 'view_only' 
      }]);
    }
  };

  const handleUpdate = (role, field, value) => {
    setStakeholders(stakeholders.map(s => 
      s.role === role ? { ...s, [field]: value } : s
    ));
  };

  const addCustomRole = () => {
    if (!customRole.trim()) return;
    if (stakeholders.find(s => s.role === customRole)) return;
    
    setStakeholders([...stakeholders, {
      role: customRole,
      name: '',
      email: '',
      accessLevel: 'view_only'
    }]);
    setCustomRole('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PREDEFINED_ROLES.map(role => {
          const stakeholder = stakeholders.find(s => s.role === role);
          const isChecked = !!stakeholder;
          
          return (
            <div key={role} className={`p-4 rounded-xl border transition-all ${isChecked ? 'border-amber-500/50 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900/60'}`}>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={() => handleToggleRole(role)}
                  className="w-4 h-4 text-amber-500 rounded border-zinc-700 bg-zinc-950 focus:ring-amber-500"
                />
                <span className="font-semibold text-xs text-zinc-100 uppercase tracking-wider">{role}</span>
              </label>
              
              {isChecked && (
                <div className="space-y-3 pl-7 mt-2">
                  <Input 
                    placeholder="Name" 
                    value={stakeholder.name}
                    onChange={(e) => handleUpdate(role, 'name', e.target.value)}
                  />
                  <Input 
                    placeholder="Email" 
                    type="email"
                    value={stakeholder.email}
                    onChange={(e) => handleUpdate(role, 'email', e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-4">Add Custom Stakeholder</h4>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input 
              placeholder="e.g. Acoustic Consultant or Structural Engineer"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomRole()}
            />
          </div>
          <Button onClick={addCustomRole} type="button" icon={<Plus className="w-4 h-4" />}>
            Add Role
          </Button>
        </div>
        
        {stakeholders.filter(s => !PREDEFINED_ROLES.includes(s.role)).map(s => (
          <div key={s.role} className="mt-4 p-4 rounded-xl border border-amber-500/50 bg-amber-950/20">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-xs text-amber-300 uppercase tracking-wider">{s.role} (Custom)</span>
              <button 
                onClick={() => handleToggleRole(s.role)}
                className="text-rose-400 text-xs hover:text-rose-300 hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="space-y-3">
              <Input 
                placeholder="Name" 
                value={s.name}
                onChange={(e) => handleUpdate(s.role, 'name', e.target.value)}
              />
              <Input 
                placeholder="Email" 
                type="email"
                value={s.email}
                onChange={(e) => handleUpdate(s.role, 'email', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
