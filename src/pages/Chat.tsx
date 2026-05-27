import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Sparkles, Trash2, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { agentAPI } from '../services/api';
import { showToast } from '../lib/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
    // Load from localStorage on initial render
    const saved = localStorage.getItem('renew_ai_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert string timestamps back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sessionMemory, setSessionMemory] = useState<any>(() => {
    const saved = localStorage.getItem('renew_ai_session_memory');
    return saved ? JSON.parse(saved) : {};
  });

  // Save to repositories whenever they change
  useEffect(() => {
    localStorage.setItem('renew_ai_chat_history', JSON.stringify(messages));
    localStorage.setItem('renew_ai_session_memory', JSON.stringify(sessionMemory));
  }, [messages, sessionMemory]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send the last 4 messages as context
      const historyContext = messages.slice(-4).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await agentAPI.askQuestion(input, historyContext, sessionMemory);
      const { answer, data, lastTopic, lastCategories, lastResultSummary, lastSql } = response.data;

      // Update session memory for the next turn
      setSessionMemory({
        lastTopic,
        lastCategories,
        lastResultSummary,
        lastSql
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer || "I've processed your request.",
        data: data,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      showToast.error('AI Assistant Error', 'Failed to get a response. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionMemory({});
    localStorage.removeItem('renew_ai_chat_history');
    localStorage.removeItem('renew_ai_session_memory');
    showToast.info('Chat Cleared', 'Conversation history has been reset.');
  };

  const DataTable: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    const headers = Object.keys(data[0]);
    
    return (
      <div className="mt-4 rounded-xl border border-border/50 overflow-hidden bg-black/20">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="text-[10px] font-black uppercase tracking-widest text-primary py-3">
                    {header.replace(/_/g, ' ')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} className="hover:bg-white/5 transition-colors border-border/30">
                  {headers.map((header) => (
                    <TableCell key={header} className="text-xs font-medium text-muted-foreground py-3">
                      {row[header]?.toString() || '-'}
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
      <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-5 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">AI Assistant</h1>
            <p className="text-xs text-white/40 mt-0.5">Ask anything about your portfolio</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-[10px] font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
              <Sparkles className="w-3 h-3" /> Neural Engine
            </span>
            <button
              onClick={clearChat}
              className="p-2 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-5 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Ask me anything about your portfolio</h2>
              <p className="text-sm text-white/40 mt-1 mb-8">Insights, trends, renewals — instantly.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  'Total revenue last month?',
                  'Policies expiring this week',
                  'My commission this year',
                  'Active clients count',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); setTimeout(() => handleSend(), 0); }}
                    className="border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 rounded-xl px-4 py-3 text-sm text-left text-white/70 hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user' ? 'bg-white/10' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {message.role === 'user' ? <User className="w-4 h-4 text-white/70" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`text-sm leading-relaxed px-4 py-3 ${message.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm'
                        : 'bg-[#111118] border border-white/5 text-white/90 rounded-2xl rounded-bl-sm'}`}
                      >
                        {message.content}
                      </div>
                      <span className="text-[10px] text-white/30 mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="bg-[#111118] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-3">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="bg-white/5 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm w-full text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 rounded-xl p-2.5 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <div className="flex items-center justify-between px-2 pt-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">System Ready</span>
            </div>
            <span className="text-[10px] text-violet-300/60 uppercase tracking-[0.2em]">Renew Intelligence</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
