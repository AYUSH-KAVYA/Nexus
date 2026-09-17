import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import client from '../api/client';
import { Link } from 'react-router-dom';

const AlertBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await client.get('/alerts');
        setAlerts(data.alerts || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      }
    };
    fetchAlerts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await client.patch(`/alerts/${id}/read`);
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert read', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800 ring-1 ring-black/40 focus:outline-none z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-800/60">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                No new notifications
              </div>
            ) : (
              alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => !alert.is_read && markAsRead(alert.id)}
                  className={`p-3.5 hover:bg-zinc-800/60 cursor-pointer transition-colors ${
                    !alert.is_read ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <p className={`text-xs ${!alert.is_read ? 'font-medium text-zinc-100' : 'text-zinc-400'}`}>
                    {alert.message}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
          
          <Link
            to="/alerts"
            onClick={() => setIsOpen(false)}
            className="block w-full text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-amber-400 hover:text-amber-300 hover:bg-zinc-800/60 border-t border-zinc-800 transition-colors"
          >
            View all alerts
          </Link>
        </div>
      )}
    </div>
  );
};

export default AlertBell;
