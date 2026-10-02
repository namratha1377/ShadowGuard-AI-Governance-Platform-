import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Lock,
  FileText,
  Terminal,
  Bot,
  History,
  Settings,
  ShieldCheck,
  X,
  Send, 
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const userJson = localStorage.getItem('shadowguard_user');
  const user = userJson ? JSON.parse(userJson) : { role: 'admin' };
  const isAdmin = user.role === 'admin';

  const navItems = isAdmin
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Submit Prompt', path: '/prompt', icon: Send }, 
        { name: 'AI Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'AI Activity', path: '/activity', icon: Activity },
        { name: 'Risk Assessment', path: '/risk', icon: ShieldAlert },
        { name: 'Data Security', path: '/data-security', icon: Lock },
        { name: 'Policies', path: '/policies', icon: FileText },
        { name: 'Harness Console', path: '/harness', icon: Terminal },
        { name: 'Ask ShadowGuard', path: '/chatbot', icon: Bot },
        { name: 'Audit Logs', path: '/audit', icon: History },
        { name: 'Settings', path: '/settings', icon: Settings },
      ]
    : [
        { name: 'Submit Prompt', path: '/prompt', icon: Send },
        { name: 'My Submissions', path: '/activity', icon: Activity },
      ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-slate-100 dark:via-slate-200 dark:to-indigo-200 bg-clip-text text-transparent block">
                ShadowGuard
              </span>
              <span className="text-[10px] font-mono text-indigo-600/80 dark:text-indigo-400/80 uppercase tracking-wider block">
                Enterprise SaaS
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center justify-between">
            <span>Status: Operational</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-600">v0.1.0-alpha</div>
        </div>
      </aside>
    </>
  );
};

