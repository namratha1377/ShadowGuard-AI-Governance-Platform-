import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface TourStep {
  targetPath: string;
  name: string;
  title: string;
  description: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    targetPath: '/dashboard',
    name: 'Dashboard',
    title: 'Security Overview & Live Queue',
    description:
      'Real-time metrics, verdict volume breakdown, target LLM rankings, and the Live Review Queue for quarantined prompts.',
  },
  {
    targetPath: '/prompt',
    name: 'Submit Prompt',
    title: 'Employee AI Portal',
    description:
      'Consumer-grade chat interface where employees submit prompts or attach files to test DLP guardrails.',
  },
  {
    targetPath: '/activity',
    name: 'AI Activity',
    title: 'AI Activity Logs',
    description:
      'Searchable, real-time activity feed documenting every prompt submission across the entire organization.',
  },
  {
    targetPath: '/risk',
    name: 'Risk Assessment',
    title: 'Risk Analytics & Scoring',
    description:
      'Detailed numerical risk scoring (0-100), risk tier categorization, and multi-factor contribution breakdown.',
  },
  {
    targetPath: '/data-security',
    name: 'Data Security',
    title: 'DLP Violation Logs',
    description:
      'Deep pattern inspection logs covering PII, Source Code credentials, Financial EBITDA mentions, and Confidential files.',
  },
  {
    targetPath: '/policies',
    name: 'Policies',
    title: 'Policy Governance Manager',
    description:
      'Manage organizational compliance policies, rule counts, violation counts, and toggle enforcement statuses.',
  },
  {
    targetPath: '/harness',
    name: 'Harness Console',
    title: 'Dynamic Agent Harness Console',
    description:
      'Interactive trace viewer visualizing LangGraph core steps and dynamically dispatched specialized agents.',
  },
  {
    targetPath: '/chatbot',
    name: 'Ask ShadowGuard',
    title: 'Ask ShadowGuard Assistant',
    description:
      'Grounded read-only AI security analyst with multi-turn memory, live pending queue context, and trace explanation capability.',
  },
  {
    targetPath: '/audit',
    name: 'Audit Logs',
    title: 'Immutable Audit Ledger',
    description:
      'Tamper-proof administrative security audit log recording manual review decisions, policy changes, and auth events.',
  },
  {
    targetPath: '/settings',
    name: 'Settings',
    title: 'System Settings',
    description:
      'Configure platform security controls, target LLM provider defaults, and system preferences.',
  },
];

interface QuickTourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickTourOverlay: React.FC<QuickTourOverlayProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !step) return;

    // Try finding by navLink href or data-tour attribute
    const selector = `a[href="${step.targetPath}"]`;
    const el = document.querySelector(selector);

    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect);
    }
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen || !step) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-auto font-sans">
        {/* Semi-transparent Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Spotlight Box around target sidebar element */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              top: `${targetRect.top - 4}px`,
              left: `${targetRect.left - 4}px`,
              width: `${targetRect.width + 8}px`,
              height: `${targetRect.height + 8}px`,
            }}
            className="absolute rounded-xl border-2 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.6)] pointer-events-none z-50"
          >
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
          </motion.div>
        )}

        {/* Floating Tooltip Card */}
        <div className="absolute inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl p-6 backdrop-blur-xl space-y-4 pointer-events-auto"
          >
            {/* Tooltip Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Compass className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold block">
                    Admin Guided Tour • Step {currentStep + 1} of {TOUR_STEPS.length}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{step.title}</h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                title="Exit Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Highlight Name Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-xs font-mono text-indigo-300">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Sidebar Link: <strong>{step.name}</strong> ({step.targetPath})</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {step.description}
            </p>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-300 transition font-medium"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
