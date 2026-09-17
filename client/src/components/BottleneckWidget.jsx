import React, { useEffect, useState } from 'react';
import { Card, Spinner } from './ui';
import { AlertTriangle } from 'lucide-react';
import api from '../api/client';

export default function BottleneckWidget({ projectId }) {
  const [bottlenecks, setBottlenecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    api.get(`/projects/${projectId}/bottleneck`)
      .then(res => setBottlenecks(res.data.slice(0, 3))) // top 3
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <Card padding>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-zinc-100">Critical Path Owners</h3>
        </div>
        <div className="flex justify-center p-6"><Spinner /></div>
      </Card>
    );
  }

  return (
    <Card padding>
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-zinc-100">Critical Path Owners</h3>
      </div>
      
      {bottlenecks.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No bottlenecks detected.</p>
      ) : (
        <div className="space-y-4">
          {bottlenecks.map(b => {
            const count = b.downstreamTaskCount ?? b.downstreamCount ?? 0;
            const stakeholder = b.stakeholder || b;
            const maxCount = Math.max(...bottlenecks.map(x => x.downstreamTaskCount ?? x.downstreamCount ?? 0), 1);
            const percent = Math.round((count / maxCount) * 100);
            
            return (
              <div key={stakeholder.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="font-semibold text-xs text-slate-200">{stakeholder.name}</p>
                    <p className="text-[11px] text-slate-400">{stakeholder.role}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-400">{count}</span>
                    <span className="text-[11px] text-slate-400 ml-1">blocked downstream</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
