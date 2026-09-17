import React, { useState } from 'react';
import { Badge } from './ui';
import { Clock, AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, Link2, FileText } from 'lucide-react';

export default function TaskBoard({ tasks = [], projectId, onTaskClick }) {
  const [activeStatus, setActiveStatus] = useState('pending');
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());

  const columns = [
    { 
      id: 'pending', 
      title: 'Pending', 
      icon: Clock,
      color: 'text-zinc-300',
      activeBorder: 'border-zinc-400/50 bg-zinc-900/90 ring-1 ring-zinc-500/30',
      badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700'
    },
    { 
      id: 'in_progress', 
      title: 'In Progress', 
      icon: Clock,
      color: 'text-amber-400',
      activeBorder: 'border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/30',
      badgeClass: 'bg-amber-950/40 text-amber-300 border-amber-800/60'
    },
    { 
      id: 'blocked', 
      title: 'Blocked', 
      icon: AlertOctagon,
      color: 'text-rose-400',
      activeBorder: 'border-rose-500/50 bg-rose-950/20 ring-1 ring-rose-500/30',
      badgeClass: 'bg-rose-950/40 text-rose-300 border-rose-800/60'
    },
    { 
      id: 'done', 
      title: 'Done', 
      icon: CheckCircle2,
      color: 'text-emerald-400',
      activeBorder: 'border-emerald-500/50 bg-emerald-950/20 ring-1 ring-emerald-500/30',
      badgeClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
    }
  ];

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);
  const activeCol = columns.find(c => c.id === activeStatus) || columns[0];
  const activeTasks = getTasksByStatus(activeStatus);

  const toggleTaskExpand = (taskId) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 4 Interactive Status Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {columns.map(col => {
          const count = getTasksByStatus(col.id).length;
          const isActive = activeStatus === col.id;
          const Icon = col.icon;

          return (
            <button
              key={col.id}
              onClick={() => setActiveStatus(col.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer focus:outline-none ${
                isActive
                  ? `${col.activeBorder} shadow-lg shadow-black/30`
                  : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850/60 hover:border-zinc-700/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {col.title}
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${col.badgeClass}`}>
                  {count}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${col.color}`}>
                  {count}
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">tasks</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Horizontal List for Selected Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              {activeCol.title} Tasks
            </span>
            <span className="text-xs text-zinc-500">
              ({activeTasks.length})
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Click any task to toggle description
          </span>
        </div>

        {activeTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-500">
            No tasks currently in {activeCol.title} status.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeTasks.map(task => {
              const isExpanded = expandedTaskIds.has(task.id);
              const incomingDeps = task.dependencies?.incoming?.length || task.dependencyCount || 0;

              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/85 hover:border-zinc-700/80 transition-all duration-150 overflow-hidden"
                >
                  {/* Main Task Horizontal Strip */}
                  <div
                    onClick={() => {
                      toggleTaskExpand(task.id);
                      if (onTaskClick) onTaskClick(task);
                    }}
                    className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none hover:bg-zinc-850/40"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-zinc-100 hover:text-amber-300 transition-colors truncate">
                          {task.title}
                        </h4>
                        <span className="text-zinc-500 hover:text-zinc-300 shrink-0">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Assigned to: <span className="text-zinc-300 font-medium">{task.owner_name || task.ownerName || 'Unassigned'}</span>
                        {(task.owner_role || task.ownerRole) && (
                          <span className="text-zinc-500"> ({task.owner_role || task.ownerRole})</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 shrink-0">
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {task.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-750 px-2 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {incomingDeps > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> {incomingDeps} upstream
                        </span>
                      )}

                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border ${activeCol.badgeClass}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Task Details / Description */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 bg-zinc-950/40 animate-fade-up">
                      <div className="pt-2 flex items-start gap-2 text-xs text-zinc-300">
                        <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          {task.description || 'No detailed scope or specifications provided.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
