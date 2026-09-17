import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AlertBell from './AlertBell';

const formatBreadcrumb = (segment, index, array) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || (segment.length >= 24 && !isNaN(parseInt(segment[0], 16)));
  if (isUUID) {
    if (array[index - 1] === 'projects') return 'Project Workspace';
    if (array[index - 1] === 'tasks') return 'Task Details';
    return 'Details';
  }
  const labels = {
    projects: 'Projects',
    tasks: 'Tasks',
    new: 'Create',
    changes: 'Change Control',
    approvals: 'Approvals Queue',
    history: 'Project Memory',
    impact: 'Blast Radius',
    alerts: 'Notifications'
  };
  return labels[segment.toLowerCase()] || segment.replace(/[-_]/g, ' ');
};

const Navbar = ({ onMenuClick }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <header className="sticky top-0 z-30 bg-zinc-900/85 backdrop-blur-xl border-b border-zinc-800/80 h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="mr-3 text-zinc-400 hover:text-white lg:hidden focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-1.5 hover:bg-zinc-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <nav className="hidden sm:flex min-w-0" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <li>
              <Link to="/" className="hover:text-amber-400 transition-colors">
                Nexus
              </Link>
            </li>
            {pathnames.map((value, index) => {
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              const formatted = formatBreadcrumb(value, index, pathnames);
              return (
                <li key={to} className="flex items-center space-x-2 truncate">
                  <span className="text-zinc-600">/</span>
                  {isLast ? (
                    <span className="text-zinc-200 font-bold truncate">
                      {formatted}
                    </span>
                  ) : (
                    <Link to={to} className="hover:text-amber-400 transition-colors truncate">
                      {formatted}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      
      <div className="flex items-center space-x-4">
        <AlertBell />
      </div>
    </header>
  );
};

export default Navbar;
