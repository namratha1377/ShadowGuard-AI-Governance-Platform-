import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Paperclip,
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Activity,
  ArrowUp,
  LayoutDashboard,
  Radio,
  Clock,
} from 'lucide-react';
import api from '../services/api';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useSocket } from '../context/SocketContext';

interface ChatMessage {
  id: string | number;
  interaction_id?: number;
  isUser: boolean;
  text: string;
  targetApp?: string;
  fileName?: string | null;
  timestamp: string;
  status?: 'analyzing' | 'pending_review' | 'allowed' | 'restricted' | 'blocked' | 'rejected';
  decision?: string;
  risk_score?: number;
  risk_tier?: string;
  explanation?: string;
}

export const PromptPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  // User session
  const userJson = localStorage.getItem('shadowguard_user');
  const user = userJson
    ? JSON.parse(userJson)
    : { id: 1, name: 'Employee User', role: 'user', department: 'Engineering' };

  // Chat & input states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [targetApp, setTargetApp] = useState<'ChatGPT' | 'Claude' | 'Gemini' | 'Copilot' | 'Perplexity'>('Gemini');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerCollapsed, setBannerCollapsed] = useState(false);
  const [debugLog, setDebugLog] = useState<string | null>(null);

  const [stats, setStats] = useState({
    todayCount: 142,
    autoApprovedPct: 96.4,
    threatsBlocked: 8,
  });

  // Debug testing modal / status state (temporary verification)

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing personal submissions on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/ai-interactions', { params: { limit: 15 } });
        if (res.data?.success && Array.isArray(res.data.data?.interactions)) {
          const loaded: ChatMessage[] = [];
          res.data.data.interactions.reverse().forEach((item: any) => {
            // User bubble
            loaded.push({
              id: `user-${item.id}`,
              interaction_id: item.id,
              isUser: true,
              text: item.prompt_summary,
              targetApp: item.target_app,
              fileName: item.file_name,
              timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
            // Employee history contains only the employee's submitted prompt.
            // Governance verdicts, scores, explanations and review metadata are
            // intentionally omitted from the employee-facing API and UI.
            if (user.role === 'admin') {
              loaded.push({
                id: `sys-${item.id}`,
                interaction_id: item.id,
                isUser: false,
                text: item.prompt_summary,
                targetApp: item.target_app,
                status: item.status || item.decision,
                decision: item.decision,
                risk_tier: item.risk_tier,
                explanation: item.review_note
                  ? `Admin Review Note: ${item.review_note}`
                  : item.explanation || `Governed by ShadowGuard DLP & Adaptive Security. Decision: ${item.decision?.toUpperCase()}.`,
                timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              });
            }
          });
          setMessages(loaded);
        }
      } catch (err) {
        console.warn('Could not load user interaction history:', err);
      }
    };

    loadHistory();
  }, []);

  // Real-time socket subscription for live status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (update: any) => {
      console.log('[PromptPage] Received real-time "interaction-status-update".');
      if (user.role === 'admin') {
        setDebugLog(`Status Update: ${update.status?.toUpperCase() || update.decision?.toUpperCase()} (ID: ${update.interaction_id})`);
        setTimeout(() => setDebugLog(null), 4000);
      }

      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.isUser) {
            const matchesId = msg.interaction_id && msg.interaction_id === update.interaction_id;
            if (matchesId) {
              if (user.role !== 'admin') {
                return {
                  ...msg,
                  interaction_id: update.interaction_id,
                  status: undefined,
                  decision: undefined,
                  risk_score: undefined,
                  risk_tier: undefined,
                  explanation: undefined,
                  text: update.response || 'In Review',
                };
              }

              return {
                ...msg,
                interaction_id: update.interaction_id,
                status: update.status || update.decision,
                decision: update.decision || update.status,
                risk_score: update.risk_score ?? msg.risk_score,
                risk_tier: update.risk_tier ?? msg.risk_tier,
                explanation: update.explanation || msg.explanation || 'Status updated live via ShadowGuard.',
              };
            }
          }
          return msg;
        })
      );
    };

    socket.on('interaction-status-update', handleStatusUpdate);

    return () => {
      socket.off('interaction-status-update', handleStatusUpdate);
    };
  }, [socket]);

  // Handle auto-expanding textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. File Type Validation (.txt, .pdf, .png, .jpg, .jpeg, .docx)
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowed = ['.txt', '.pdf', '.png', '.jpg', '.jpeg', '.docx'];

    if (!allowed.includes(ext)) {
      setUploadError(`Unsupported file format (${ext}). Supported types: .txt, .pdf, .png, .jpg, .docx`);
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. File Size Validation (25MB Max)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File exceeds maximum size limit of 25MB (${(file.size / (1024 * 1024)).toFixed(1)} MB selected).`);
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAttachedFile(file);
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!prompt.trim() && !attachedFile) || isSubmitting) return;

    const currentPrompt = prompt.trim();
    const currentFile = attachedFile;
    const currentApp = targetApp;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = Date.now();

    // 1. Immediately append user bubble
    const userMsg: ChatMessage = {
      id: `user-${tempId}`,
      isUser: true,
      text: currentPrompt || `[Attached: ${currentFile?.name}]`,
      targetApp: currentApp,
      fileName: currentFile?.name,
      timestamp,
    };

    // 2. Immediately append system "Analyzing..." bubble with loader
    const systemAnalyzingMsg: ChatMessage = {
      id: `sys-${tempId}`,
      isUser: false,
      text: '',
      status: 'analyzing',
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg, systemAnalyzingMsg]);
    setPrompt('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('prompt', currentPrompt);
      formData.append('targetApp', currentApp);
      formData.append('category', 'General Assistant');
      if (currentFile) {
        formData.append('file', currentFile);
        setUploadProgress(10);
      }

      const res = await api.post('/ai-interactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        },
      });

      /*
       * =========================================================================
       * NOTE FOR PHASE 24:
       * In Phase 24, this synchronous evaluation response update will be replaced
       * with a real-time push update (via Socket.IO 'interaction-status-update' event)
       * once the asynchronous Harness pipeline finishes.
       * For now, we synchronously update the 'Analyzing...' status bubble with the
       * immediate verdict returned by the Phase 2/Harness stub.
       * =========================================================================
       */
      if (res.data?.success) {
        const created = res.data.data;
        const evalRes = res.data.eval_result;
        const employeeResponse = res.data.employee_response?.response;

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== `sys-${tempId}`) return msg;

            if (user.role !== 'admin') {
              return {
                ...msg,
                interaction_id: created?.id,
                status: undefined,
                decision: undefined,
                risk_score: undefined,
                risk_tier: undefined,
                explanation: undefined,
                text: employeeResponse || 'In Review',
              };
            }

            const isPending = created?.status === 'pending_review' || evalRes?.requires_human_review;
            return {
              ...msg,
              interaction_id: created?.id,
              status: (msg.status && msg.status !== 'analyzing') ? msg.status : (isPending ? 'pending_review' : (created?.status || evalRes?.decision || 'allowed')),
              decision: (msg.decision && msg.decision !== 'pending') ? msg.decision : (created?.decision || (isPending ? 'pending' : 'allowed')),
              risk_score: evalRes?.risk_score,
              risk_tier: evalRes?.risk_tier || created?.risk_tier,
              explanation: msg.explanation || (evalRes?.explanation || 'Evaluated by ShadowGuard Adaptive Governance.'),
              text: res.data.ai_response || '',
            };
          })
        );

        setStats((prev) => ({
          ...prev,
          todayCount: prev.todayCount + 1,
        }));
      }
    } catch (err: any) {
      console.error('Failed to submit prompt:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === `sys-${tempId}`
            ? {
                ...msg,
                status: undefined,
                decision: undefined,
                risk_tier: undefined,
                explanation: undefined,
                text: err?.response?.data?.error || 'AI generation is currently unavailable. Please try again.',
              }
            : msg
        )
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('shadowguard_token');
    localStorage.removeItem('shadowguard_user');
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. SLIM TOP AREA (Consumer ChatGPT/Claude-style header, no admin sidebar) */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight">ShadowGuard</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              Employee AI Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin console link if admin role */}
          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition"
              title="Return to administrative governance dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium truncate max-w-[120px]">{user.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {user.department || 'Staff'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. COMPACT HIGHLIGHTS STRIP (1-row glanceable banner, collapsible/dismissible) */}
      {!bannerDismissed && (
        <div className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/50 px-4 sm:px-6 py-2 transition-all flex-shrink-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Adaptive Security Active
                </span>
              </div>
            </div>

            {!bannerCollapsed ? (
              <div className="hidden md:flex items-center gap-6 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {stats.todayCount}
                    </strong>{' '}
                    requests processed today
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {stats.autoApprovedPct}%
                    </strong>{' '}
                    auto-approved
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {stats.threatsBlocked}
                    </strong>{' '}
                    DLP leaks prevented
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              <button
                onClick={() => setBannerCollapsed(!bannerCollapsed)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
                title={bannerCollapsed ? 'Expand highlights' : 'Collapse highlights'}
              >
                {bannerCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Socket connection indicator & debug notice if active */}
      {debugLog && (
        <div className="bg-indigo-50 dark:bg-indigo-950/80 border-b border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs px-4 py-1.5 text-center flex items-center justify-center gap-2">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{debugLog}</span>
        </div>
      )}

      {/* 3. MAIN AREA: CHAT-STYLE INTERFACE */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                How can ShadowGuard assist you today?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit your AI prompts or attach internal documents. ShadowGuard transparently analyzes compliance, prevents accidental leaks, and safeguards your workflow.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full pt-2">
              {[
                { label: 'Draft product roadmap overview', app: 'ChatGPT' },
                { label: 'Review customer interview summary', app: 'Claude' },
                { label: 'Draft marketing copy for new feature', app: 'Gemini' },
                { label: 'Summarize quarterly growth metrics', app: 'Copilot' },
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(sample.label);
                    setTargetApp(sample.app as any);
                  }}
                  className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900/70 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition text-xs space-y-1 group"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 block truncate">
                    "{sample.label}"
                  </span>
                  <span className="text-[10px] text-slate-400">Target: {sample.app}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Header meta */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 px-1">
                {msg.isUser ? (
                  <>
                    <span>You</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{msg.targetApp}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 text-indigo-500" />
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      ShadowGuard Gateway
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              {msg.isUser ? (
                <div className="max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm space-y-2">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {msg.fileName && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-700/60 border border-indigo-500/40 text-xs text-indigo-100 font-mono">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{msg.fileName}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm space-y-2.5">
                  {user.role !== 'admin' ? (
                    <div className="space-y-2 py-0.5">
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {msg.status === 'analyzing' ? 'Processing your request...' : (msg.text || 'Your request was processed.')}
                      </p>
                      {msg.status === 'analyzing' && (
                        <div className="flex space-x-1.5 items-center">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                        </div>
                      )}
                    </div>
                  ) : msg.status === 'analyzing' ? (
                    /* State 1: Analyzing... with animated pulse loader */
                    <div className="flex items-center gap-3 py-1 text-slate-600 dark:text-slate-300">
                      <div className="flex space-x-1.5 items-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                      </div>
                      <span className="text-xs font-medium">
                        Analyzing prompt against active DLP & compliance policies...
                      </span>
                    </div>
                  ) : msg.status === 'pending_review' ? (
                    /* State 2: Under Security Review... (waiting for admin human sign-off) */
                    <div className="space-y-2 py-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60">
                          <Clock className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          Under Security Review...
                        </span>
                        {user.role === 'admin' && msg.risk_tier && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                            Tier: {msg.risk_tier}
                          </span>
                        )} 
                        {user.role === 'admin' && msg.risk_score !== undefined && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Score: {msg.risk_score}/100
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        This prompt contains sensitive or elevated risk elements and has been routed to human compliance for sign-off. This bubble will update automatically as soon as an administrator takes action.
                      </p>
                    </div>
                  ) : msg.status === 'rejected' || msg.decision === 'rejected' ? (
                    /* State 3: Rejected — non-punitive warning card */
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>Request Cannot Be Processed</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {msg.explanation?.startsWith('This request cannot be processed')
                          ? msg.explanation
                          : `This request cannot be processed — it violates ${msg.explanation || 'security policy'}. Contact your administrator if you believe this is an error.`}
                      </p>
                    </div>
                  ) : (
                    /* State 4: Allowed (Success-styled bubble + actual AI Response) */
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved / Allowed
                        </span>

                        {user.role === 'admin' && msg.risk_tier && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Tier: {msg.risk_tier}
                          </span>
                        )}
                        {user.role === 'admin' && msg.risk_score !== undefined && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Score: {msg.risk_score}/100
                          </span>
                        )}
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {msg.explanation}
                      </p>

                      {/* Actual AI Generation Result */}
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{msg.targetApp || 'AI Assistant'} Output</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                          {msg.text || 'No AI response was generated.'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. INPUT BAR AT THE BOTTOM */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 backdrop-blur-md p-4 sm:px-6 flex-shrink-0 z-20">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Target App selection pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Target AI:</span>
              {(['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity'] as const).map((app) => (
                <button
                  key={app}
                  onClick={() => setTargetApp(app)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition ${
                    targetApp === app
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {app}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-slate-400 font-mono">
              Realtime Socket {isConnected ? '● Connected' : '○ Offline'}
            </span>
          </div>

          {/* Upload Error Alert Chip */}
          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
                <button
                  onClick={() => setUploadError(null)}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded transition"
                  title="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attached file preview chip & Upload Progress Bar */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium truncate max-w-[220px]">{attachedFile.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({(attachedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {!isSubmitting && (
                    <button
                      onClick={removeAttachedFile}
                      className="p-1 hover:bg-indigo-200/60 dark:hover:bg-indigo-900 rounded transition text-indigo-500"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload Progress Bar when uploading */}
                {uploadProgress !== null && (
                  <div className="w-full space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      <span>Uploading document & analyzing DLP...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-indigo-600"
                        initial={{ width: '0%' }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Growing textarea + Attach & Send buttons */}
          <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition shadow-sm">
            {/* Hidden file input: accepts .txt, .pdf, .png, .jpg, .docx */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".txt,.pdf,.png,.jpg,.docx"
              className="hidden"
            />

            {/* Paperclip attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition flex-shrink-0"
              title="Attach document or image (.txt, .pdf, .png, .jpg, .docx)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask an AI prompt or attach a document for compliance analysis..."
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none outline-none py-1.5 px-1 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 max-h-48 min-h-[36px]"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={(!prompt.trim() && !attachedFile) || isSubmitting}
              className={`p-2 rounded-xl transition flex-shrink-0 flex items-center justify-center ${
                prompt.trim() || attachedFile
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              title="Send prompt"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Enter to send, Shift+Enter for new line</span>
            <span>All submissions inspected by ShadowGuard AI Governance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptPage;
