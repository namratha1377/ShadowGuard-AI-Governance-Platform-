import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Shield, Database } from 'lucide-react';
import { apiService } from '../services/api';
import { Card } from '../components/ui/Card';
import { FormattedMarkdown } from '../components/ui/FormattedMarkdown';
import { usePageTitle } from '../hooks/usePageTitle';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data_sources_used?: string[];
  suggested_chips?: string[];
  timestamp: string;
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  "What's waiting for my review right now?",
  'Summarize the riskiest pending request',
  "What's our current risk exposure?",
  'Which policy has the highest violation count?',
];

export const ChatbotPage: React.FC = () => {
  usePageTitle('Ask ShadowGuard');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Hello! I am **Ask ShadowGuard**, your read-only AI security analyst assistant.\n\nAsk me anything about **live pending reviews**, current risk exposure, policy violation trends, department activity, or specific pipeline traces (e.g. *"why was interaction #482 restricted?"*).',
      data_sources_used: ['Live Pending Review Queue', 'Dashboard Metrics', 'Policies Registry'],
      suggested_chips: DEFAULT_SUGGESTED_QUESTIONS.slice(0, 3),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
        text: 'I encountered an error retrieving data context. Please ensure the backend API is active.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-6xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Ask ShadowGuard</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Read-Only Administrative Assistant
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Grounded AI security assistant querying live pending reviews, metrics & pipeline traces.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Read-Only Advisory</span>
        </div>
      </div>

      {/* Main Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 border-slate-800">
        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-emerald-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-2xl space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-slate-100 rounded-tr-none'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <FormattedMarkdown content={msg.text} />
                    )}

                    {/* Data Sources Badges */}
                    {!isUser && msg.data_sources_used && msg.data_sources_used.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center mr-1">
                          <Database className="w-3 h-3 mr-1 text-indigo-400" />
                          Context Sources:
                        </span>
                        {msg.data_sources_used.map((src, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-950 text-slate-300 border border-slate-800"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Follow-Up Chips */}
                  {!isUser && msg.suggested_chips && msg.suggested_chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggested_chips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip)}
                          className="text-xs text-indigo-300 hover:text-white bg-indigo-950/50 hover:bg-indigo-900/70 border border-indigo-800/60 rounded-full px-3 py-1 transition text-left"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[10px] text-slate-500 px-1 ${
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
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">
                  Analyzing DB & trace context
                </span>
                <div className="flex items-center space-x-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer & Input Section */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
          {/* Default Suggested Question Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-slate-400 font-medium flex-shrink-0">Suggested:</span>
            {DEFAULT_SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="flex-shrink-0 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 rounded-full transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
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
              placeholder="Ask ShadowGuard about pending reviews, trace #482, risk metrics, or policy violations..."
              disabled={isTyping}
              className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputQuestion.trim() || isTyping}
              className="absolute right-2.5 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Disclaimer Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 text-slate-400 font-mono">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              AI-generated, verify before acting
            </span>
            <span className="text-slate-500">Read-Only Advisory</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatbotPage;
