import React, { useState } from 'react';
import BlastRadiusBadge from './BlastRadiusBadge';
import { Badge } from './ui';
import { Users, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, FileText, Tag } from 'lucide-react';

export default function ImpactTree({ impact }) {
  if (!impact) return null;

  // Extract blast radius metrics supporting both naming conventions
  const score = impact.blastRadiusScore ?? impact.score ?? 0;
  const level = impact.blastRadiusLevel || impact.level || (score > 6 ? 'high' : score >= 3 ? 'medium' : 'low');
  
  // Extract affected tasks (backend returns affectedTasks array with depth)
  const tasks = impact.affectedTasks || (impact.rootTask ? [impact.rootTask] : []);
  
  // Extract stakeholders
  const stakeholders = impact.affectedStakeholders || [];
  
  // Extract approvals
  const approvals = impact.affectedApprovals || impact.approvalGates || [];

  // State to track expanded task descriptions
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());

  const toggleTask = (id) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedTaskIds.size === tasks.length) {
      setExpandedTaskIds(new Set());
    } else {
      setExpandedTaskIds(new Set(tasks.map((t, idx) => t.id || idx)));
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Blast Radius Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Downstream Dependency Impact
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {tasks.length === 0 
              ? 'No downstream tasks affected'
              : `${tasks.length} downstream ${tasks.length === 1 ? 'task' : 'tasks'} in blast radius`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tasks.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              {expandedTaskIds.size === tasks.length ? 'Collapse All' : 'Expand All Details'}
            </button>
          )}
          <BlastRadiusBadge score={score} level={level} size="md" />
        </div>
      </div>

      {/* Downstream Tasks Cascade */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-200">Zero Downstream Blast Radius</p>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto">
              This task is a leaf node in the dependency graph. Modifying it will not propagate delays to other tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task, idx) => {
              const taskId = task.id || idx;
              const depth = task.depth || 1;
              const isDirect = depth === 1;
              const isExpanded = expandedTaskIds.has(taskId);

              return (
                <div
                  key={taskId}
                  className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                    isDirect
                      ? 'border-amber-500/30 bg-amber-950/15'
                      : 'border-zinc-800/90 bg-zinc-900/60'
                  }`}
                  style={{ marginLeft: `${Math.min(depth - 1, 3) * 16}px` }}
                >
                  {/* Task Header Bar - Clickable to toggle full description */}
                  <div
                    onClick={() => toggleTask(taskId)}
                    className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors flex items-start justify-between gap-3 select-none"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase mt-0.5 shrink-0 ${
                        isDirect
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {isDirect ? 'Direct' : `Cascade L${depth}`}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-zinc-100 hover:text-amber-300 transition-colors truncate">
                            {task.title}
                          </h4>
                          <span className="text-[10px] text-amber-400/80 hover:text-amber-300 flex items-center gap-0.5 shrink-0">
                            {isExpanded ? (
                              <>Hide details <ChevronUp className="w-3 h-3" /></>
                            ) : (
                              <>Read full <ChevronDown className="w-3 h-3" /></>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Assigned to: <span className="text-zinc-300 font-medium">{task.owner_name || task.owner?.name || 'Unassigned'}</span>
                          {(task.owner_role || task.owner?.role) && (
                            <span className="text-zinc-500"> ({task.owner_role || task.owner?.role})</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        task.status === 'done' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' :
                        task.status === 'in_progress' ? 'bg-amber-950/40 text-amber-300 border-amber-800' :
                        task.status === 'blocked' ? 'bg-rose-950/40 text-rose-300 border-rose-800' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {task.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Full Task Details & Description */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 bg-zinc-950/40 animate-fade-up space-y-3">
                      <div className="pt-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>Task Scope & Specifications</span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                          {task.description || 'No detailed specifications or descriptions provided for this task.'}
                        </p>
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <Tag className="w-3 h-3 text-zinc-500" />
                          <span className="text-[10px] uppercase font-semibold text-zinc-500">Tags:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {task.tags.map(tag => (
                              <span key={tag} className="text-[10px] bg-zinc-850 text-zinc-300 px-2 py-0.5 rounded border border-zinc-750">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Affected Stakeholders */}
      {stakeholders.length > 0 && (
        <div className="pt-5 border-t border-zinc-800/80">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Affected Stakeholders ({stakeholders.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {stakeholders.map(s => (
              <span
                key={s.id}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-850 border border-zinc-700 text-zinc-200"
              >
                <span className="font-semibold text-amber-300">{s.name}</span>
                {s.role && <span className="text-zinc-400 ml-1 font-normal">({s.role})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Approval Gates Reopened */}
      {approvals.length > 0 && (
        <div className="pt-5 border-t border-zinc-800/80">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Approval Gates Affected ({approvals.length})
            </h4>
          </div>
          <div className="space-y-2">
            {approvals.map((gate, i) => (
              <div
                key={gate.id || i}
                className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-zinc-300 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span className="font-semibold text-zinc-100">{gate.task_title || gate.taskName || 'Milestone Task'}</span>
                  <span className="text-zinc-500">&mdash; Sign-off required from</span>
                  <span className="text-amber-300 font-medium">{gate.stakeholder_name || gate.approverName || 'Approver'}</span>
                </div>
                <span className="text-[10px] uppercase font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                  {gate.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
