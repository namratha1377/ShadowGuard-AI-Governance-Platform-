import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AdminChatbotWidget } from '../components/admin/AdminChatbotWidget';

export const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Container Offset by Sidebar width on desktop */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Topbar Header */}
        <Topbar onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />

        {/* Dynamic Page Content Rendered via Outlet */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto relative">
          {/* Subtle Background Glow */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-indigo-600/5 blur-3xl pointer-events-none rounded-full" />

          {/* Smooth Fade Transition on Route Change */}
          <div key={location.pathname} className="animate-fadeIn transition-opacity duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Persistent Floating Administrative Assistant Widget (Slide-out panel) */}
      <AdminChatbotWidget />
    </div>
  );
};
