import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  User,
  Send,
  X,
  Shield,
  Database,
  RotateCcw,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { FormattedMarkdown } from '../ui/FormattedMarkdown';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data_sources_used?: string[];
  suggested_chips?: string[];
  timestamp: string;
}

const DEFAULT_SUGGESTED_CHIPS = [
  "What's waiting for my review right now?",
  'Summarize the riskiest pending request',
  'Which policy has the highest violation count?',
  'Which department has the most restricted requests?',
];

export const AdminChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Hello! I am **Ask ShadowGuard**, your read-only AI security analyst assistant.\n\nAsk me about **live pending reviews**, risk metrics, specific harness traces (e.g. *"why was interaction #482 restricted?"*), or policy violation trends across departments.',
      data_sources_used: ['Live Pending Review Queue', 'Dashboard Metrics', 'Policies Registry'],
      suggested_chips: DEFAULT_SUGGESTED_CHIPS.slice(0, 3),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check user role from localStorage
  const userJson = localStorage.getItem('shadowguard_user');
  const user = userJson ? JSON.parse(userJson) : null;
  const isAdmin = user?.role === 'admin';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  if (!isAdmin) return null;

  const handleSend = async (questionText: string) => {
    const query = questionText.trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    // Build multi-turn session history for context
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome-msg')
      .slice(-10)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    try {
      const res = await apiService.sendChatbotQuery(query, historyPayload);
      if (res.success && res.data) {
        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          text: res.data.answer,
          data_sources_used: res.data.data_sources_used,
          suggested_chips: res.data.suggested_chips,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('Chatbot query failed:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I encountered an error retrieving data context. Please ensure the backend Express API is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Session history cleared. Ask me anything about live pending reviews, policy trends, or specific interaction traces.',
        data_sources_used: ['Dashboard Metrics'],
        suggested_chips: DEFAULT_SUGGESTED_CHIPS.slice(0, 3),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (Bottom-Right Intercom/Crisp Style) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl shadow-xl shadow-indigo-500/25 border border-indigo-400/40 flex items-center gap-2.5 group cursor-pointer"
            title="Open Ask ShadowGuard Administrative Assistant"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-100 group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <span className="text-xs font-bold tracking-tight text-white pr-0.5">
              Ask ShadowGuard
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. EXPANDABLE SLIDE-OUT CHAT PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-[420px] h-[580px] bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden font-sans text-slate-900 dark:text-slate-100"
          >
            {/* Widget Header */}
            <div className="p-3.5 bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      Ask ShadowGuard
                    </h3>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE ASSISTANT
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Read-only AI compliance & trace analyst
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition"
                  title="Clear Session History"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition"
                  title="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isUser ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 border border-slate-700 text-emerald-400'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    {/* Message Content */}
                    <div className={`max-w-[82%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-3 rounded-2xl text-xs ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-950/80 border border-slate-800/90 text-slate-200 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <FormattedMarkdown content={msg.text} />
                        )}

                        {/* Data Sources Badges */}
                        {!isUser && msg.data_sources_used && msg.data_sources_used.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1">
                            <span className="text-[9px] text-slate-400 font-medium flex items-center mr-1">
                              <Database className="w-2.5 h-2.5 mr-0.5 text-indigo-400" />
                              Sources:
                            </span>
                            {msg.data_sources_used.slice(0, 3).map((src, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900 text-slate-300 border border-slate-800"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Suggested Follow-up Chips generated after bot responses */}
                      {!isUser && msg.suggested_chips && msg.suggested_chips.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {msg.suggested_chips.map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(chip)}
                              className="text-[10px] text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-full px-2.5 py-0.5 transition text-left"
                            >
                              + {chip}
                            </button>
                          ))}
                        </div>
                      )}

                      <div
                        className={`text-[9px] text-slate-500 font-mono px-1 ${
                          isUser ? 'text-right' : 'text-left'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Analyzing DB & trace context</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar & Mandatory Disclaimer Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputQuestion);
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Ask about pending reviews, trace #482, metrics..."
                  disabled={isTyping}
                  className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isTyping}
                  className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Clear Read-Only AI Disclaimer Footer */}
              <div className="flex items-center justify-between text-[9.5px] text-slate-500 px-1 border-t border-slate-900 pt-1.5">
                <span className="flex items-center gap-1 text-slate-400 font-mono">
                  <Shield className="w-3 h-3 text-indigo-400" />
                  AI-generated, verify before acting
                </span>
                <span className="text-slate-500">Read-only Advisory</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminChatbotWidget;
