import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Card, Spinner } from '../components/ui';
import TaskBoard from '../components/TaskBoard';
import BottleneckWidget from '../components/BottleneckWidget';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { GitPullRequest, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isPM } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'my-tasks'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, tasksRes, alertsRes, stakeholdersRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/tasks`),
          api.get('/alerts'),
          api.get(`/projects/${id}/stakeholders`)
        ]);
        setProject(projRes.data);
        setTasks(tasksRes.data);
        setAlerts((alertsRes.data.alerts || []).slice(0, 5));
        setStakeholders(stakeholdersRes.data || []);
        
        if (isAdmin || isPM) {
          const pendingRes = await api.get(`/projects/${id}/changes/pending`);
          setPendingChanges(pendingRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAdmin, isPM]);

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Loading Workspace Coordinates...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-16 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 mb-4">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Project Not Found</h2>
        <p className="text-xs text-zinc-400 mt-2 mb-6">This workspace either doesn't exist or you don't have authorization.</p>
        <Button onClick={() => navigate('/')}>Return to Workspaces</Button>
      </div>
    );
  }

  const hasManagerAccess = isAdmin || isPM;

  // Identify current user's stakeholder identity in this project
  const currentStakeholder = stakeholders.find(s => s.user_id === user?.id || s.email === user?.email);
  const myTasks = tasks.filter(t => 
    (currentStakeholder && t.owner_id === currentStakeholder.id) || 
    (t.owner_name && user?.name && t.owner_name.toLowerCase() === user.name.toLowerCase())
  );

  // Compute tasks blocking my tasks
  const myTaskUpstreamIds = new Set(
    myTasks.flatMap(t => t.dependencies?.incoming?.map(d => d.from_task_id) || [])
  );
  const blockingTasks = tasks.filter(t => myTaskUpstreamIds.has(t.id) && t.status !== 'done');

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-fade-up">
      {/* Workspace Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-zinc-800/90">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              {project.name}
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/80 text-amber-300 font-semibold">
              {hasManagerAccess ? (isAdmin ? 'Admin Console' : 'PM Console') : 'Stakeholder View'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {project.description || 'Active coordination environment.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            to={`/projects/${id}/history`} 
            className="text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-amber-400 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            Project Memory
          </Link>
          <Link 
            to={`/projects/${id}/approvals`} 
            className="text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-amber-400 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Approvals</span>
            {pendingChanges.length > 0 && (
              <span className="h-4 w-4 rounded-full bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center">
                {pendingChanges.length}
              </span>
            )}
          </Link>

          <Button 
            onClick={() => navigate(`/projects/${id}/changes/new`)}
            icon={<GitPullRequest className="w-3.5 h-3.5" />}
          >
            Propose Change
          </Button>
        </div>
      </div>

      {/* Primary Work Area */}
      {hasManagerAccess ? (
        /* Manager / Admin View: Full Dependency TaskBoard + Bottlenecks */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Status</h2>
              </div>
              <Button size="sm" onClick={() => navigate(`/projects/${id}/tasks/new`)}>
                + New Task
              </Button>
            </div>

            <TaskBoard tasks={tasks} projectId={id} />
          </div>

          <div className="space-y-6">
            <BottleneckWidget projectId={id} />
            
            {pendingChanges.length > 0 && (
              <Card padding="p-5" className="bg-amber-950/20 border-amber-800/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Pending Changes ({pendingChanges.length})
                    </h3>
                    <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                      Stakeholder changes are awaiting impact preview and approval.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-xs" 
                    onClick={() => navigate(`/projects/${id}/approvals`)}
                  >
                    Review Queue
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Stakeholder View: My Tasks + Blocking Me + Full Graph Toggle */
        <div className="space-y-8">
          {/* Tab Selection */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'board'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              Project Overview ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'my-tasks'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              Assigned to Me ({myTasks.length})
            </button>
          </div>

          {activeTab === 'board' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Status</h2>
              </div>
              <TaskBoard tasks={tasks} projectId={id} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* My Tasks */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wider text-xs">
                    My Assigned Deliverables ({myTasks.length})
                  </h2>
                </div>

                {myTasks.length === 0 ? (
                  <Card padding="p-8" className="text-center bg-zinc-900/40 border-zinc-800/80">
                    <CheckCircle2 className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-zinc-300">No Direct Tasks Assigned</h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      You are an active stakeholder in this project. Use the "Project Overview" tab to review the full dependency schedule.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myTasks.map(task => (
                      <Card key={task.id} padding="p-5" className="bg-zinc-900/80 border-zinc-800">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-zinc-100 leading-snug">{task.title}</h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                            task.status === 'done' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' :
                            task.status === 'in_progress' ? 'bg-amber-950/40 text-amber-300 border-amber-800/60' :
                            task.status === 'blocked' ? 'bg-rose-950/40 text-rose-300 border-rose-800/60' :
                            'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
                          {task.description || 'No detailed specifications.'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-zinc-800/80">
                          {task.tags && task.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
              
              {/* Blocking Me */}
              <section className="pt-6 border-t border-zinc-800/80">
                <div className="mb-4">
                  <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4" />
                    Upstream Tasks Blocking Your Work ({blockingTasks.length})
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Tasks that your deliverables depend on which are not yet marked as done.
                  </p>
                </div>

                {blockingTasks.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400">
                    ✓ Clear path: None of your assigned tasks are currently held up by incomplete dependencies.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {blockingTasks.map(t => (
                      <div key={t.id} className="p-3.5 rounded-xl bg-rose-950/15 border border-rose-900/40 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">{t.title}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">Assigned to: {t.owner_name || 'Unassigned'}</p>
                        </div>
                        <span className="text-[10px] font-mono uppercase text-rose-300 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {/* Project Alerts Feed */}
      {alerts.length > 0 && (
        <section className="pt-8 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Recent Coordination Signals
            </h2>
            <Link to="/alerts" className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map(alert => (
              <div key={alert.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all">
                <p className="text-xs text-zinc-200 leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
