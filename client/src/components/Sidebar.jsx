import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Bell, MessageSquare, Sliders, Activity, LogOut, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import Badge from './ui/Badge';

const Sidebar = ({ onClose }) => {
  const { user, logout, hasApp, isAdmin } = useAuth();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await client.get('/projects');
        setProjects(data || []);
      } catch (err) {
        console.error('Failed to load projects for sidebar', err);
      }
    };
    fetchProjects();
  }, [user]);

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutGrid },
    { name: 'My Alerts', path: '/alerts', icon: Bell },
  ];

  // AS-06: Entitlement-aware Signal module link
  if (hasApp('nexus_signal')) {
    navItems.push({
      name: 'Signal AI Capture',
      path: '/signal',
      icon: MessageSquare,
      badge: 'PRO'
    });
  }

  // Admin platform management
  const adminNavItems = [];
  if (isAdmin) {
    adminNavItems.push({
      name: 'Organization Apps',
      path: '/settings/organization',
      icon: Sliders
    });
    adminNavItems.push({
      name: 'Domain Events',
      path: '/events',
      icon: Activity
    });
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900/95 text-zinc-200 border-r border-zinc-800/80 select-none">
      {/* Brand Header — Glowing Text Only, No Diamond Logo, No Animations */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/80">
        <Link to="/" className="flex items-center group cursor-pointer focus:outline-none">
          <span className="text-lg font-black tracking-[0.25em] text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.65)] font-mono">
            NEXUS
          </span>
        </Link>
        <button className="lg:hidden text-zinc-400 hover:text-white" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {/* Core Apps Navigation */}
        <div>
          <div className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Apps & Workspaces
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Projects list */}
        <div>
          <h3 className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Active Projects ({projects.length})
          </h3>
          <nav className="space-y-1">
            {projects.length === 0 ? (
              <p className="px-3 text-xs text-zinc-600 italic">No projects</p>
            ) : (
              projects.map((project) => {
                const isActive = location.pathname.includes(`/projects/${project.id}`);
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    onClick={onClose}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-3 shrink-0 ${isActive ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-zinc-600'}`} />
                    <span className="truncate">{project.name}</span>
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        {/* Platform Settings (Admin only) */}
        {adminNavItems.length > 0 && (
          <div>
            <h3 className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Platform Admin
            </h3>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs mr-3 shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="primary" size="sm">
                {user?.globalRole}
              </Badge>
              {user?.organizationName && (
                <span className="text-[10px] text-zinc-400 truncate">
                  {user.organizationName}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center px-3 py-2 text-xs font-medium text-zinc-400 rounded-lg hover:bg-zinc-800 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut className="mr-2.5 h-4 w-4 text-zinc-400" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
