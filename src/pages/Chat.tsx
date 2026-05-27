import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Trash2, ArrowDownCircle, Loader2 } from 'lucide-react';
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
      <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">AI Data Assistant</h1>
            </div>
            <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              Interact with your insurance database using natural language
            </p>
          </div>
          
          <button 
            onClick={clearChat}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-wider"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-h-0 bg-card/40 backdrop-blur-sm border border-border/60 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-black/20">
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20 px-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative w-20 h-20 rounded-3xl bg-secondary border border-border flex items-center justify-center animate-pulse">
                    <Bot className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <div className="space-y-2 max-w-md">
                  <h2 className="text-lg font-bold text-white">How can I help you today?</h2>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    "Ask me about your total revenue last month, expiring policies, or policy distribution."
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    "Total revenue last month?",
                    "Policies expiring this week",
                    "My commission this year",
                    "Active clients count"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        // Using setTimeout to ensure state is updated before sending
                        setTimeout(() => handleSend(), 0);
                      }}
                      className="px-4 py-3 rounded-xl bg-white/[0.03] border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-semibold text-left text-muted-foreground hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border 
                        ${message.role === 'user' 
                          ? 'bg-secondary border-border text-muted-foreground' 
                          : 'bg-primary/20 border-primary/30 text-primary'}`}
                      >
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      
                      <div className={`space-y-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed
                          ${message.role === 'user' 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-secondary/80 border border-border/50 text-white shadow-xl'}`}
                        >
                          {message.content}
                          {message.role === 'assistant' && message.data && (
                            <DataTable data={message.data} />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-tight opacity-50 px-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3 items-center bg-secondary/50 border border-border/50 px-5 py-3 rounded-2xl">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Assistant is thinking...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-secondary/30 border-t border-border/40 backdrop-blur-xl">
            <form onSubmit={handleSend} className="relative flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your data anything..."
                className="flex-1 bg-black/20 border border-border/60 rounded-2xl pl-6 pr-14 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Ready</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Powered by Llama 3 & Groq</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
