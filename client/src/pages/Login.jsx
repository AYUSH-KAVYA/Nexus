import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    {
      role: 'Admin / Principal Architect',
      name: 'Sarah Chen',
      email: 'sarah@nexus.dev',
      desc: 'Full workspace configuration, permissions, direct commit power',
      badge: 'admin',
      color: 'border-amber-500/40 bg-amber-950/30 text-amber-200'
    },
    {
      role: 'Project Manager',
      name: 'Mike Rodriguez',
      email: 'mike@nexus.dev',
      desc: 'Task scheduling, dependency control & change approval queue',
      badge: 'pm',
      color: 'border-zinc-500/40 bg-zinc-800/40 text-zinc-200'
    },
    {
      role: 'Client Stakeholder',
      name: 'Priya Patel',
      email: 'priya@nexus.dev',
      desc: 'View status, milestones & submit structured change requests',
      badge: 'client',
      color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
    }
  ];

  const handleSelectDemo = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setIsLoading(true);
    try {
      await login(demoEmail, 'password123');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">System Sign In</h2>
        <p className="text-xs text-zinc-400 mt-1">Authenticate to access coordination workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-300 bg-rose-950/50 rounded-xl border border-rose-800/60 animate-shake">
            {error}
          </div>
        )}
        
        <Input
          label="Work Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@nexus.dev"
          autoComplete="email"
        />
        
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <Button
          type="submit"
          className="w-full mt-2"
          loading={isLoading}
          icon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* Demo Accounts Autofill (without "1 click sign in" text) */}
      <div className="mt-8 pt-6 border-t border-zinc-800/80">
        <div className="mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Demo Accounts
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {demoUsers.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => handleSelectDemo(u.email)}
              disabled={isLoading}
              className="text-left p-3 rounded-xl bg-zinc-950/50 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-150 group cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-zinc-200 group-hover:text-amber-300 transition-colors">
                    {u.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">· {u.role}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${u.color}`}>
                  {u.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-snug line-clamp-1">
                {u.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Need a new workspace?{' '}
        <Link to="/signup" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">
          Register Organization
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
