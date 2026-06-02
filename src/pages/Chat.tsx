import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Trash2, Loader2, ArrowUp } from 'lucide-react';
import Layout from '../components/Layout';
import { agentAPI } from '../services/api';
import { showToast } from '../lib/toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any[];
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const s = sessionStorage.getItem('renew_ai_chat_history');
      if (!s) return [];
      return JSON.parse(s).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [sessionMemory, setSessionMemory] = useState<any>(() => {
    try { return JSON.parse(sessionStorage.getItem('renew_ai_session_memory') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    sessionStorage.setItem('renew_ai_chat_history', JSON.stringify(messages));
    sessionStorage.setItem('renew_ai_session_memory', JSON.stringify(sessionMemory));
  }, [messages, sessionMemory]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const res = await agentAPI.askQuestion(text, history, sessionMemory);
      const { answer, data, lastTopic, lastCategories, lastResultSummary, lastSql } = res.data;
      setSessionMemory({ lastTopic, lastCategories, lastResultSummary, lastSql });
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: answer || 'Processed.', data, timestamp: new Date(),
      }]);
    } catch {
      showToast.error('Error', 'Failed to get response.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); sendMessage(input); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearChat = () => {
    setMessages([]); setSessionMemory({});
    sessionStorage.removeItem('renew_ai_chat_history');
    sessionStorage.removeItem('renew_ai_session_memory');
    showToast.info('Cleared', 'Conversation reset.');
  };

  const prompts = [
    'Total revenue last month?',
    'Policies expiring this week',
    'My commission this year',
    'Active clients count',
  ];

  const DataTable = ({ data }: { data: any[] }) => {
    if (!data?.length) return null;
    const headers = Object.keys(data[0]);
    return (
      <div className="mt-3 border border-[#1e1c1f] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#0d0c0e]">
              <TableRow className="border-[#1e1c1f]">
                {headers.map(h => (
                  <TableHead key={h} className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 py-2 px-4"
                    style={{ fontFamily: 'DM Mono, monospace' }}>
                    {h.replace(/_/g, ' ')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} className="border-[#1e1c1f] hover:bg-white/[0.02]">
                  {headers.map(h => (
                    <TableCell key={h} className="text-xs text-[#F5F0E8]/70 py-2 px-4"
                      style={{ fontFamily: 'DM Mono, monospace' }}>
                      {row[h]?.toString() || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-5rem)] flex flex-col" style={{ fontFamily: 'Syne, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#1e1c1f] mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-xl font-black text-[#F5F0E8] tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              AI Assistant
            </h1>
          </div>
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className={`p-2 transition-colors border ${
              messages.length === 0
                ? 'text-[#F5F0E8]/15 border-[#1e1c1f]/50 cursor-not-allowed opacity-40'
                : 'text-[#F5F0E8]/30 hover:text-red-400 border-[#1e1c1f] hover:border-red-500/30 cursor-pointer'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide space-y-6 py-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 bg-[#0d0c0e] border border-[#1e1c1f] flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-lg font-black text-[#F5F0E8] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Ask your portfolio anything
              </h2>
              <p className="text-sm text-[#F5F0E8]/40 mb-10 max-w-sm">
                Revenue, renewals, clients — answered in seconds.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {prompts.map(p => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="border border-[#1e1c1f] hover:border-amber-500/40 hover:bg-amber-500/5 px-4 py-3
                      text-xs text-left text-[#F5F0E8]/50 hover:text-[#F5F0E8] transition-all"
                    style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                        ? 'bg-amber-500 text-black font-medium'
                        : 'bg-[#0d0c0e] border border-[#1e1c1f] text-[#F5F0E8]/85'
                      }`} style={{ borderRadius: 0 }}>
                      {msg.content}
                    </div>
                    {msg.data && msg.data.length > 0 && <DataTable data={msg.data} />}
                    <span className="text-[9px] text-[#F5F0E8]/20 mt-1.5 px-1" style={{ fontFamily: 'DM Mono, monospace' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 bg-[#1e1c1f] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-[#F5F0E8]/60" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                  </div>
                  <div className="bg-[#0d0c0e] border border-[#1e1c1f] px-4 py-3 flex items-center gap-1.5">
                    {[0, 100, 200].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="border border-[#1e1c1f] bg-[#0d0c0e] mt-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your portfolio..."
            rows={2}
            className="w-full bg-transparent px-5 pt-4 pb-2 text-sm text-[#F5F0E8] placeholder:text-[#F5F0E8]/20
              focus:outline-none resize-none"
            style={{ fontFamily: 'DM Mono, monospace' }}
          />
          <div className="flex items-center justify-between px-5 pb-3">
            <span className="text-[9px] text-[#F5F0E8]/20 uppercase tracking-[0.2em]" style={{ fontFamily: 'DM Mono, monospace' }}>
              ⏎ Send · Shift+⏎ New line
            </span>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed
                flex items-center justify-center transition-colors"
              style={{ borderRadius: 0 }}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 text-black animate-spin" /> : <ArrowUp className="w-3.5 h-3.5 text-black" />}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;