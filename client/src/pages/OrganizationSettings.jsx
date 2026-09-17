import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Sliders, Building2, CheckCircle2, XCircle, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function OrganizationSettings() {
  const { user, isAdmin, refreshApps } = useAuth();
  const [apps, setApps] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingApp, setTogglingApp] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const orgId = user?.organizationId;

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [appsRes, orgRes] = await Promise.all([
        client.get(`/organizations/${orgId}/apps`),
        client.get(`/organizations/${orgId}`)
      ]);
      setApps(appsRes.data || []);
      setOrg(orgRes.data || null);
    } catch (err) {
      console.error('Failed to load organization settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const handleToggle = async (appName, currentStatus) => {
    if (!isAdmin) {
      alert('Only organization administrators can modify app subscriptions.');
      return;
    }

    const nextStatus = !currentStatus;
    setTogglingApp(appName);
    setFeedback(null);

    try {
      await client.patch(`/organizations/${orgId}/apps/${appName}`, {
        enabled: nextStatus
      });

      // Update local state
      setApps(prev => prev.map(a => 
        a.app_name === appName 
          ? { ...a, enabled: nextStatus, disabled_at: nextStatus ? null : new Date().toISOString() }
          : a
      ));

      // Refresh auth context so nav updates immediately
      await refreshApps();

      setFeedback({
        type: 'success',
        message: `${appName === 'nexus' ? 'Nexus Core Engine' : 'Nexus Signal AI'} ${nextStatus ? 'enabled' : 'disabled'} successfully.`
      });
    } catch (err) {
      console.error('Failed to toggle app entitlement:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to update subscription.'
      });
    } finally {
      setTogglingApp(null);
    }
  };

  const appMetadata = {
    nexus: {
      name: 'Nexus Core Engine',
      description: 'Multi-stakeholder dependency tracking, blast radius impact analysis, and approval gates.',
      category: 'Coordination & Task Scheduling',
      icon: '📐',
      badge: 'Core Platform'
    },
    nexus_signal: {
      name: 'Nexus Signal AI',
      description: 'AI-powered communication intelligence: 2-pass extraction of tasks and decisions from WhatsApp, email, and meeting transcripts.',
      category: 'Autonomous Intelligence',
      icon: '⚡',
      badge: 'Intelligence Module'
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Multi-App SaaS Entitlements
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Organization App Subscriptions
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage modular app entitlements for your organization. Toggle apps on and off in real time.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200'
            : 'bg-rose-950/40 border border-rose-800/60 text-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Organization Card */}
      <Card className="p-6 bg-zinc-900/85 border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{org?.name || user?.organizationName || 'Organization'}</h2>
              <p className="text-xs text-zinc-400 font-mono">Org ID: {orgId}</p>
            </div>
          </div>
          <Badge variant="primary" size="sm">
            {isAdmin ? 'Admin Controlled' : 'View Only'}
          </Badge>
        </div>
      </Card>

      {/* Apps Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Available Modular Apps
        </h3>

        {loading ? (
          <div className="p-12 text-center">
            <Spinner />
            <p className="text-xs text-zinc-500 mt-2">Loading subscriptions...</p>
          </div>
        ) : (
          ['nexus', 'nexus_signal'].map((appKey) => {
            const meta = appMetadata[appKey];
            const appRecord = apps.find(a => a.app_name === appKey);
            const isEnabled = appRecord ? appRecord.enabled : false;
            const isToggling = togglingApp === appKey;

            return (
              <Card 
                key={appKey} 
                className={`p-6 bg-zinc-900/85 border transition-all duration-200 ${
                  isEnabled ? 'border-zinc-700/80 shadow-sm' : 'border-zinc-800/50 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-2xl p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 shrink-0 select-none">
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-white">{meta.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {meta.badge}
                        </span>
                        {isEnabled ? (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Enabled
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                            <XCircle className="w-3.5 h-3.5" />
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                        {meta.description}
                      </p>
                      {appRecord?.disabled_at && (
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                          Disabled on: {new Date(appRecord.disabled_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-medium text-zinc-400">
                      {isEnabled ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      disabled={!isAdmin || isToggling}
                      onClick={() => handleToggle(appKey, isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                        isEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                      } ${(!isAdmin || isToggling) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Architectural Guarantee Card */}
      <Card className="p-5 bg-amber-500/5 border-amber-500/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-amber-200">
              Clean Separation of Responsibilities
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Disabling an app strictly blocks its API routes via Express middleware and hides navigation links.
              Underlying identity, stakeholder registries, and historical domain events remain preserved in the shared platform database.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
