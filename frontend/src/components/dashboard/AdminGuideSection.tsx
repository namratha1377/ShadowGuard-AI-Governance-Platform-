import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  X,
  Sparkles,
  LayoutDashboard,
  Terminal,
  FileText,
  Bot,
  Lock,
  History,
  ChevronRight,
} from 'lucide-react';
import {
  HarnessNodeDiagram,
  QuarantineFunnelDiagram,
  PolicyShieldDiagram,
  ChatbotSparklesDiagram,
  DlpScannerDiagram,
  AuditLedgerDiagram,
} from './MiniDiagrams';

interface AdminGuideSectionProps {
  onStartTour: () => void;
}

export interface FeatureGuideItem {
  id: string;
  name: string;
  icon: any;
  summary: string;
  diagram: React.ReactNode;
  badge: string;
}

export const GUIDE_FEATURES: FeatureGuideItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard & Live Review Queue',
    icon: LayoutDashboard,
    summary:
      'Real-time risk exposure monitoring, verdict volume trends, target app rankings, and a human-in-the-loop quarantine queue with 3-second undo safety timers.',
    diagram: <QuarantineFunnelDiagram />,
    badge: 'Real-time Stream',
  },
  {
    id: 'harness',
    name: 'Dynamic Harness Console',
    icon: Terminal,
    summary:
      'Multi-agent execution pipeline dynamically routing prompts based on risk tier and entity sensitivity (Context → Sensitivity → Risk → Policy → Dynamic Agents → Decision).',
    diagram: <HarnessNodeDiagram />,
    badge: 'LangGraph Engine',
  },
  {
    id: 'policies',
    name: 'Policy Governance Engine',
    icon: FileText,
    summary:
      'Configurable security rules controlling PII, source code, financial data, and endpoint trust thresholds across departments.',
    diagram: <PolicyShieldDiagram />,
    badge: 'Rule Engine',
  },
  {
    id: 'chatbot',
    name: 'Ask ShadowGuard Assistant',
    icon: Bot,
    summary:
      'Grounded administrative assistant for instant metric analysis, live queue summaries, and plain-English trace explanations.',
    diagram: <ChatbotSparklesDiagram />,
    badge: 'Grounded Assistant',
  },
  {
    id: 'data-security',
    name: 'Data Security & DLP Auditing',
    icon: Lock,
    summary:
      'Deep pattern inspection detecting credit cards, API keys, EBITDA mentions, and confidential project names across prompts.',
    diagram: <DlpScannerDiagram />,
    badge: 'DLP Scanner',
  },
  {
    id: 'audit',
    name: 'Immutable Audit Ledger',
    icon: History,
    summary:
      'Tamper-proof security ledger tracking all user submissions, policy enforcement events, and administrative review decisions.',
    diagram: <AuditLedgerDiagram />,
    badge: 'Audit Trail',
  },
];

export const AdminGuideSection: React.FC<AdminGuideSectionProps> = ({ onStartTour }) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('shadowguard_admin_guide_dismissed') === 'true';
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Listen for window event triggered by Topbar ? Help button
  useEffect(() => {
    const handleOpenGuide = () => {
      setIsDismissed(false);
      localStorage.removeItem('shadowguard_admin_guide_dismissed');
      // Scroll smoothly to section
      document.getElementById('admin-guide-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    window.addEventListener('open-admin-guide', handleOpenGuide);
    return () => window.removeEventListener('open-admin-guide', handleOpenGuide);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('shadowguard_admin_guide_dismissed', 'true');
  };

  if (isDismissed) return null;

  const currentFeature = GUIDE_FEATURES.find((f) => f.id === activeTab) || GUIDE_FEATURES[0];

  return (
    <motion.div
      id="admin-guide-section"
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-indigo-50/90 via-white to-slate-100 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-indigo-500/5 space-y-4 font-sans text-slate-900 dark:text-slate-100"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                How ShadowGuard Works
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">
                Interactive Admin Guide
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Explore how ShadowGuard intercepts, evaluates, and governs AI prompts across your organization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Tour Button */}
          <button
            onClick={onStartTour}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Take a quick tour</span>
          </button>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 rounded-xl transition"
            title="Dismiss Guide (re-open anytime via '?' in Topbar)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Interactive Step-Carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
        {/* Left Feature Tabs Selection */}
        <div className="lg:col-span-4 space-y-1.5">
          {GUIDE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            const isActive = feat.id === activeTab;
            return (
              <button
                key={feat.id}
                onClick={() => setActiveTab(feat.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-300 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-300 shadow-sm'
                    : 'bg-white dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{feat.name}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isActive ? 'translate-x-0.5 text-indigo-600 dark:text-indigo-400' : 'opacity-40'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Active Display Card with Mini Animated Diagram */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{currentFeature.name}</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                {currentFeature.badge}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {currentFeature.summary}
            </p>
          </div>

          {/* Mini Animated Visual Diagram */}
          <div className="pt-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {currentFeature.diagram}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
