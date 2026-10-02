import React, { useState } from 'react';
import { Bell, Menu, User, LogOut, Building2, HelpCircle } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Retrieve user session or fallback
  const userJson = localStorage.getItem('shadowguard_user');
  const user = userJson
    ? JSON.parse(userJson)
    : { name: 'Sarah Connor', role: 'admin', email: 'sarah.connor@shadowguard.io' };

  const handleLogout = () => {
    localStorage.removeItem('shadowguard_access_token');
    localStorage.removeItem('shadowguard_refresh_token');
    localStorage.removeItem('shadowguard_user');
    window.location.href = '/login';
  };

  const handleOpenGuide = () => {
    window.dispatchEvent(new CustomEvent('open-admin-guide'));
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-6 flex items-center justify-between transition-colors">
      {/* Left section: Mobile menu toggle + Org info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Toggle mobile navigation menu"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Acme Corp</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            LIVE
          </span>
        </div>
      </div>

      {/* Right section: Theme Toggle + Help Guide ? + Alert Bell + User Menu */}
      <div className="flex items-center gap-3">
        {/* Global Light/Dark Theme Switch */}
        <ThemeToggle />

        {/* Admin Guide ? Icon Button */}
        {user.role === 'admin' && (
          <button
            onClick={handleOpenGuide}
            aria-label="How ShadowGuard Works Admin Guide & Tour"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="How ShadowGuard Works (Admin Guide & Tour)"
          >
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </button>
        )}

        {/* Live Alert Bell Badge */}
        <div className="relative">
          <button
            aria-label="View security alert notifications"
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
              3
            </span>
          </button>
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User account menu"
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'SG'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                {user.role}
              </span>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800/80">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile & Security</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

