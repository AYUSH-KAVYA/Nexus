import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    globalRole: 'stakeholder'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setIsLoading(true);
    try {
      await signup(formData.name, formData.email, formData.password, formData.globalRole);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Create Organization Account</h2>
        <p className="text-xs text-zinc-400 mt-1">Configure user role for Coordination Intelligence workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-300 bg-rose-950/50 rounded-xl border border-rose-800/60 animate-shake">
            {error}
          </div>
        )}
        
        <Input label="Full Name" name="name" required value={formData.name} onChange={handleChange} placeholder="Sarah Chen" />
        <Input label="Work Email" type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="name@nexus.dev" />
        <Input label="Password" type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" />
        <Input label="Confirm Password" type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />

        <div className="pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Workspace Role</label>
          <div className="space-y-2">
            {[
              { id: 'admin', label: 'Admin / Architect', desc: 'Full workspace configuration & direct commit authority' },
              { id: 'pm', label: 'Project Manager', desc: 'Task scheduling, dependency control & change approval queue' },
              { id: 'stakeholder', label: 'Stakeholder / Client', desc: 'View status, milestones & submit structured change requests' },
            ].map(role => (
              <label 
                key={role.id} 
                className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.globalRole === role.id 
                    ? 'border-amber-500/50 bg-amber-500/10' 
                    : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="globalRole"
                  value={role.id}
                  checked={formData.globalRole === role.id}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-amber-500 focus:ring-amber-500 border-zinc-700 bg-zinc-900"
                />
                <div className="ml-3">
                  <span className="block text-xs font-semibold text-zinc-200">{role.label}</span>
                  <span className="block text-[11px] text-zinc-400 mt-0.5">{role.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" loading={isLoading}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
