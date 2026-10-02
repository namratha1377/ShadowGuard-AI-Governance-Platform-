import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  EyeOff,
  Send,
  Cpu,
  CheckCircle2,
  FileCheck2,
  Activity,
  FileSearch,
  Sparkles,
  Lock,
  UserCheck,
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';

// Motion animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: 'easeOut' as const },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/20 selection:text-indigo-400 font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Subtle Mesh Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10 opacity-40 dark:opacity-30">
        <div className="absolute top-[-10%] left-[20%] w-[550px] h-[450px] bg-indigo-500/15 dark:bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[15%] w-[450px] h-[400px] bg-slate-400/10 dark:bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/60 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-slate-100 dark:via-slate-200 dark:to-indigo-200 bg-clip-text text-transparent">
              ShadowGuard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <span>Let's Go</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl mx-auto space-y-6"
        >
          {/* Subtle Tagline */}
          <motion.div variants={fadeInUp} custom={0} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Next-Generation Enterprise AI Security</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            custom={1}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-slate-950 dark:text-white"
          >
            Adaptive AI governance at enterprise scale.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed"
          >
            Safeguard sensitive proprietary code, confidential financials, and regulated customer PII across every LLM interaction in real-time.
          </motion.p>

          {/* Hero CTA Button */}
          <motion.div variants={fadeInUp} custom={3} className="pt-4 flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all duration-200 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Let's Go</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Minimal Abstract Orchestration Node Graph Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-16 sm:mt-20 max-w-4xl mx-auto p-4 sm:p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-2xl relative"
        >
          <div className="relative w-full h-56 sm:h-72 rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/80">
            {/* Ambient graph grid lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

            {/* SVG Orchestration Flow */}
            <svg className="w-full h-full max-w-xl px-4" viewBox="0 0 600 200" fill="none">
              {/* Connecting Paths with glow */}
              <motion.path
                d="M 80 100 L 220 100"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="6 6"
                animate={{ strokeDashoffset: [0, -24] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 220 100 L 370 65"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="6 6"
                animate={{ strokeDashoffset: [0, -24] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 220 100 L 370 135"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="6 6"
                animate={{ strokeDashoffset: [0, -24] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 370 65 L 510 100"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="6 6"
                animate={{ strokeDashoffset: [0, -24] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 370 135 L 510 100"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="6 6"
                animate={{ strokeDashoffset: [0, -24] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />

              {/* Node 1: Client Ingest */}
              <g transform="translate(80, 100)">
                <circle r="22" className="fill-slate-900 stroke-indigo-500/50" strokeWidth="2" />
                <circle r="6" className="fill-indigo-400" />
                <text y="38" textAnchor="middle" className="fill-slate-400 font-mono text-[10px]">
                  LLM Prompt Ingest
                </text>
              </g>

              {/* Node 2: Multi-Factor DLP & Policy */}
              <g transform="translate(220, 100)">
                <circle r="26" className="fill-slate-900 stroke-indigo-500" strokeWidth="2" />
                <circle r="8" className="fill-indigo-400 animate-pulse" />
                <text y="42" textAnchor="middle" className="fill-slate-300 font-mono text-[10px] font-semibold">
                  Sentinel Scan
                </text>
              </g>

              {/* Node 3A: Gemini Pro Verification */}
              <g transform="translate(370, 65)">
                <circle r="22" className="fill-slate-900 stroke-emerald-500/60" strokeWidth="2" />
                <circle r="6" className="fill-emerald-400" />
                <text y="36" textAnchor="middle" className="fill-emerald-400 font-mono text-[9px]">
                  Allowed / Redacted
                </text>
              </g>

              {/* Node 3B: High-Risk Policy Trip */}
              <g transform="translate(370, 135)">
                <circle r="22" className="fill-slate-900 stroke-rose-500/60" strokeWidth="2" />
                <circle r="6" className="fill-rose-400" />
                <text y="36" textAnchor="middle" className="fill-rose-400 font-mono text-[9px]">
                  Blocked / Isolation
                </text>
              </g>

              {/* Node 4: Immutable Audit Log */}
              <g transform="translate(510, 100)">
                <circle r="22" className="fill-slate-900 stroke-slate-600" strokeWidth="2" />
                <circle r="6" className="fill-slate-300" />
                <text y="38" textAnchor="middle" className="fill-slate-400 font-mono text-[10px]">
                  Audit Log & Trace
                </text>
              </g>
            </svg>
          </div>
        </motion.div>
      </section>

      {/* 2. "The Problem" Section */}
      <section className="py-20 md:py-28 bg-slate-50/60 dark:bg-slate-900/30 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="text-center max-w-2xl mx-auto mb-16 space-y-3"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-semibold">
              The Reality
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Traditional DLP breaks under generative AI.
            </h2>
          </motion.div>

          {/* 3 Short Cards: Icons, not paragraphs */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Card 1: Shadow AI Risk */}
            <motion.div
              variants={fadeInUp}
              custom={0}
              className="p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                Shadow AI Risk
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Employees paste credentials, customer records, and secret roadmaps into untracked external LLMs every day.
              </p>
            </motion.div>

            {/* Card 2: Static Governance Drawbacks */}
            <motion.div
              variants={fadeInUp}
              custom={1}
              className="p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                Rigid Friction
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Binary firewalls indiscriminately block entire tools, paralyzing productivity and motivating employees to bypass controls.
              </p>
            </motion.div>

            {/* Card 3: Blindspot Auditing */}
            <motion.div
              variants={fadeInUp}
              custom={2}
              className="p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                Zero Visibility
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Security and compliance teams have no centralized logs of prompt context, severity tiers, or forensic evidence.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. "How ShadowGuard Works" Section */}
      <section className="py-24 md:py-32 max-w-6xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center max-w-2xl mx-auto mb-20 space-y-3"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-semibold">
            Pipeline Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            How ShadowGuard Works
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sub-millisecond interception and intelligent context-aware mitigation.
          </p>
        </motion.div>

        {/* 4-step visual with connecting indicators */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {/* Step 1 */}
          <motion.div variants={fadeInUp} custom={0} className="relative p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <Send className="w-4 h-4 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Request Ingest</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Interception proxy catches outbound LLM prompts and uploaded documents seamlessly before dispatch.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div variants={fadeInUp} custom={1} className="relative p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Risk Analysis</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              LangGraph nodes calculate sensitivity vectors, regex pattern matches, and departmental risk weights.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div variants={fadeInUp} custom={2} className="relative p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Adaptive Decision</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Dynamically allows safe queries, redacts sensitive tokens in-flight, or blocks severe credential leaks.
            </p>
          </motion.div>

          {/* Step 4 */}
          <motion.div variants={fadeInUp} custom={3} className="relative p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                04
              </div>
              <FileCheck2 className="w-4 h-4 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Forensic Audit</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every verdict produces an immutable audit trace, reasoning path, and optional Gemini Pro verification record.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. "Built For" Feature Grid */}
      <section className="py-20 md:py-28 bg-slate-50/60 dark:bg-slate-900/30 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="text-center max-w-2xl mx-auto mb-16 space-y-3"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-semibold">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Built for security, compliance, and velocity.
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {/* Feature 1 */}
            <motion.div variants={fadeInUp} custom={0} className="p-7 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex gap-4">
              <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0 h-fit">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Real-Time Monitoring</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Live telemetry tracking interaction frequency, department trends, and targeted external LLM endpoints.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={fadeInUp} custom={1} className="p-7 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex gap-4">
              <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0 h-fit">
                <FileSearch className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Explainable Decisions</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Transparent factor breakdowns explaining exactly why a prompt was restricted or redacted.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeInUp} custom={2} className="p-7 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex gap-4">
              <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0 h-fit">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configurable Policies</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tailored scopes for Finance, Engineering, and HR with custom DLP rules and violation thresholds.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={fadeInUp} custom={3} className="p-7 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex gap-4">
              <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0 h-fit">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Human-in-the-Loop Control</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Multi-tier RBAC for administrative oversight and transparent employee submission histories.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5. Final CTA Section */}
      <section className="py-24 md:py-32 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="space-y-6"
        >
          <motion.h2 variants={fadeInUp} custom={0} className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Ready to secure your generative AI workflows?
          </motion.h2>
          <motion.p variants={fadeInUp} custom={1} className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Experience complete control, transparency, and safety across every prompt in your organization.
          </motion.p>
          <motion.div variants={fadeInUp} custom={2} className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all duration-200 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Let's Go</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 6. Minimal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-8 px-6 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-500 font-mono transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">ShadowGuard</span>
            <span>&copy; {new Date().getFullYear()} Acme Security Inc.</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
            <span>v0.1.0-alpha</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
