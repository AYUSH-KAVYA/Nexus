import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Users, CheckSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const Home = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await client.get('/projects');
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-5 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Active Workspaces</h1>
          <p className="text-xs text-zinc-400 mt-1">Multi-stakeholder dependency projects under active coordination</p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/projects/new')}>
            + New Project
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-48 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12 bg-zinc-900/50 border-zinc-800">
          <EmptyState
            icon={FolderPlus}
            title="No projects yet"
            description="Create your first project to get started"
            action={isAdmin ? <Button onClick={() => navigate('/projects/new')}>Create Project</Button> : null}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card
              key={project.id}
              hover
              onClick={() => navigate(`/projects/${project.id}`)}
              className="flex flex-col h-full group bg-zinc-900/85 border-zinc-800 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                  {project.name}
                </h3>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6 line-clamp-2 flex-1">
                {project.description || 'No description provided.'}
              </p>
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-zinc-300 font-medium">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> 
                    {project.stakeholder_count || project.stakeholderCount || 0}
                  </span>
                  <span className="flex items-center text-zinc-300 font-medium">
                    <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> 
                    {project.task_count || project.taskCount || 0}
                  </span>
                </div>
                <div className="flex items-center text-zinc-500 font-mono text-[11px]">
                  <Clock className="w-3 h-3 mr-1" />
                  {project.last_activity || project.created_at ? formatDistanceToNow(new Date(project.last_activity || project.created_at)) : 'New'}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
