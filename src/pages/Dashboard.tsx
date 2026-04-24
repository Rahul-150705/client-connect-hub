import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaBell, FaCalendarAlt, FaEllipsisH, FaCarAlt, FaHome, 
  FaHeartbeat, FaShieldAlt, FaWhatsapp, FaArrowUp, FaArrowDown, 
  FaExclamationCircle, FaRobot, FaPlus, FaPaperPlane, FaSyncAlt, FaSms
} from 'react-icons/fa';
import { policyAPI, messagesAPI, dashboardAPI } from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

interface Policy {
  policyId: number;
  policyNumber?: string;
  policyStatus: string;
  policyType?: string;
  expiryDate: string;
  startDate?: string;
  premium?: number;
  vehicleType?: string;
  client?: { fullName?: string; phone?: string; };
}

interface MessageLog {
  id: number;
  clientName?: string;
  recipientPhone?: string;
  messageContent?: string;
  status: string;
  channel: string;
  sentAt?: string;
}

interface DashboardSummary {
  totalPolicies: number;
  policiesGrowthPercentage: number;
  expiringSoonCount: number;
  renewalRate: number;
  failedMessagesCount: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface CommunicationStats {
  messagesSentToday: number;
  whatsappSuccessRate: number;
  smsFallbackCount: number;
  overallFailureRate: number;
}

interface AiInsight {
  title: string;
  description: string;
}

// ── Cyber Palette ─────────────────────────────────────────────
const DONUT_COLORS = ['#2BC8B7', '#9B99FE', '#FF6B35', '#FF5E7E', '#F59E0B', '#10B981'];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(10, 10, 10, 0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(155, 153, 254, 0.3)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '13px',
  padding: '10px 14px',
  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
};

const getMonthLabel = (date: Date) =>
  date.toLocaleString('default', { month: 'short', year: '2-digit' });

const getTypeIcon = (type?: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('auto') || t.includes('vehicle') || t.includes('car') || t.includes('motor')) return <FaCarAlt className="text-blue-400" />;
  if (t.includes('home') || t.includes('property')) return <FaHome className="text-orange-400" />;
  if (t.includes('life') || t.includes('health')) return <FaHeartbeat className="text-pink-400" />;
  return <FaShieldAlt className="text-primary" />;
};

const getStatusBadge = (status: string) => {
  if (status === 'ACTIVE') return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Active</span></span>;
  if (status === 'EXPIRED') return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Expired</span></span>;
  return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Pending</span></span>;
};

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

const formatCurrency = (n?: number) => {
  if (!n && n !== 0) return '—';
  return `$${n.toLocaleString()}`;
};

const getDaysLeft = (expiryDate: string) => {
  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = Math.max(0, exp.getTime() - today.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDaysLeftColor = (days: number) => {
  if (days <= 3) return 'text-red-500 font-bold';
  if (days <= 14) return 'text-amber-500 font-semibold';
  return 'text-emerald-500';
};



// ... interfaces

// ── Component ────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [chartFilter, setChartFilter] = useState('30d');
  const navigate = useNavigate();
  const period = parseInt(chartFilter.replace('d', ''));

  // Use queries for each data requirement
  const policiesQuery = useQuery({
    queryKey: ['policies'],
    queryFn: () => policyAPI.getAllMyPolicies().then(res => res.data),
  });

  const messageLogsQuery = useQuery({
    queryKey: ['messageLogs'],
    queryFn: () => messagesAPI.getAllLogs().then(res => res.data),
  });

  const summaryQuery = useQuery({
    queryKey: ['dashboardSummary', period],
    queryFn: () => dashboardAPI.getSummary(period).then(res => res.data),
  });

  const distributionQuery = useQuery({
    queryKey: ['distribution'],
    queryFn: () => dashboardAPI.getClaimsDistribution().then(res => res.data),
  });

  const statsQuery = useQuery({
    queryKey: ['commStats'],
    queryFn: () => dashboardAPI.getCommunicationStats().then(res => res.data),
  });

  const insightsQuery = useQuery({
    queryKey: ['aiInsights'],
    queryFn: () => dashboardAPI.getAiInsights().then(res => res.data),
  });

  const loading = policiesQuery.isLoading || messageLogsQuery.isLoading || summaryQuery.isLoading;

  const policies = policiesQuery.data || [];
  const messageLogs = messageLogsQuery.data || [];
  const summary = summaryQuery.data;
  const donutData = distributionQuery.data || [];
  const commStats = statsQuery.data;
  const insights = insightsQuery.data || [];

  const activePolicies = useMemo(() => policies.filter(p => p.policyStatus === 'ACTIVE'), [policies]);
  
  const expiringSoon = useMemo(() => policies.filter(p => {
    if (p.policyStatus !== 'ACTIVE') return false;
    const daysLeft = getDaysLeft(p.expiryDate);
    return daysLeft <= 14;
  }), [policies]);

  const urgentExpiring = useMemo(() => policies.filter(p => {
    if (p.policyStatus !== 'ACTIVE') return false;
    const daysLeft = getDaysLeft(p.expiryDate);
    return daysLeft <= 3;
  }), [policies]);

  const failedMessages = useMemo(() => messageLogs.filter(m => m.status === 'FAILED'), [messageLogs]);

  // Area chart data
  const areaChartData = useMemo(() => {
    const today = new Date();
    const buckets: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      buckets[getMonthLabel(d)] = 0;
    }
    const sixMonths = new Date(today.getFullYear(), today.getMonth() + 6, 0);
    policies.forEach(p => {
      if (p.policyStatus !== 'ACTIVE') return;
      const exp = new Date(p.expiryDate);
      if (exp < today || exp > sixMonths) return;
      const key = getMonthLabel(exp);
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([month, count]) => ({ month, policies: count }));
  }, [policies]);

  // Recent messages (last 6)
  const recentMessages = useMemo(() => {
    return [...messageLogs]
      .sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime())
      .slice(0, 6);
  }, [messageLogs]);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-[400px] h-[400px] bg-primary rounded-full blur-[120px] animate-pulse"></div>
          </div>
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin shadow-glow"></div>
          <p className="text-primary font-medium tracking-widest uppercase text-sm animate-pulse">Initializing Dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative min-h-screen text-foreground overflow-x-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
        </div>

        <motion.div className="max-w-[1600px] mx-auto space-y-8 relative z-10 p-4 lg:p-8" variants={containerVariants} initial="hidden" animate="visible">
          
          {/* ═══ TOP HEADER & QUICK ACTIONS ═══ */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Dashboard</h1>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live System
                </span>
                <span className="text-muted-foreground font-medium">{todayStr}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative mr-2 hidden lg:block">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                <input type="text" placeholder="Search policies..." className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-64 transition-all" />
              </div>
              <button 
                onClick={() => navigate('/policies')}
                className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg"
              >
                <FaPlus className="text-primary text-xs" /> Add Policy
              </button>
              <button 
                onClick={() => navigate('/messages')}
                className="flex items-center gap-2 bg-gradient-primary text-white shadow-glow text-sm font-bold px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all"
              >
                <FaPaperPlane className="text-xs" /> Bulk Reminder
              </button>
            </div>
          </motion.div>

          {/* ═══ 1. SMART KPI ROW ═══ */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Policies */}
            <div className="group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 hover:border-primary/50 hover:bg-white/[0.08] transition-all duration-500 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Policies</p>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FaShieldAlt className="text-lg" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-white">{summary?.totalPolicies || 0}</h3>
                <div className={`flex items-center gap-1 ${summary?.policiesGrowthPercentage && summary.policiesGrowthPercentage >= 0 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'} px-2.5 py-1 rounded-full border text-[10px] font-bold`}>
                  {summary?.policiesGrowthPercentage && summary.policiesGrowthPercentage >= 0 ? <FaArrowUp /> : <FaArrowDown />} 
                  {Math.abs(summary?.policiesGrowthPercentage || 0).toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Expiring Soon */}
            <div className={`group bg-white/5 backdrop-blur-2xl border ${summary?.expiringSoonCount && summary.expiringSoonCount > 10 ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'} rounded-2xl p-6 hover:border-red-500/50 hover:bg-white/[0.08] transition-all duration-500 shadow-xl`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Expiring Soon</p>
                <div className={`p-2 rounded-lg ${summary?.expiringSoonCount && summary.expiringSoonCount > 10 ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <FaCalendarAlt className="text-lg" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-white">{summary?.expiringSoonCount || 0}</h3>
                {summary?.expiringSoonCount && summary.expiringSoonCount > 10 ? (
                  <div className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20 text-[10px] font-bold animate-pulse">
                    🔴 HIGH RISK
                  </div>
                ) : (
                  <div className="text-muted-foreground text-[10px] font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase">Manageable</div>
                )}
              </div>
            </div>

            {/* Renewal Rate */}
            <div className="group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 hover:border-accent/50 hover:bg-white/[0.08] transition-all duration-500 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Renewal Rate</p>
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <FaSyncAlt className="text-lg" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-white">{(summary?.renewalRate || 0).toFixed(0)}<span className="text-2xl text-white/40">%</span></h3>
                <div className="flex items-center gap-1.5 text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 text-[10px] font-bold">
                   OPTIMIZED
                </div>
              </div>
            </div>

            {/* Failed Messages */}
            <div className={`group bg-white/5 backdrop-blur-2xl border ${summary?.failedMessagesCount && summary.failedMessagesCount > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'} rounded-2xl p-6 hover:border-amber-500/50 hover:bg-white/[0.08] transition-all duration-500 shadow-xl`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Failed Delivery</p>
                <div className={`p-2 rounded-lg ${summary?.failedMessagesCount && summary.failedMessagesCount > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  <FaExclamationCircle className="text-lg" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-white">{summary?.failedMessagesCount || 0}</h3>
                {summary?.failedMessagesCount && summary.failedMessagesCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 text-[10px] font-bold animate-bounce">
                    ATTENTION
                  </div>
                ) : (
                  <div className="text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 text-[10px] font-bold uppercase">All Clear</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ═══ 2. ATTENTION REQUIRED & AI INSIGHTS ═══ */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Attention Required */}
            <div className="bg-red-950/20 backdrop-blur-xl border border-red-900/50 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center">
                  <FaExclamationCircle />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Attention Required</h3>
              </div>
              
              <div className="space-y-3">
                {urgentExpiring.length > 0 ? (
                  urgentExpiring.slice(0, 3).map(p => (
                    <div key={p.policyId} className="flex items-center justify-between bg-black/40 border border-red-900/30 p-3 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-white">Policy <span className="font-mono text-xs">{p.policyNumber || p.policyId}</span> expiring in {getDaysLeft(p.expiryDate)} days</p>
                        <p className="text-xs text-muted-foreground">{p.client?.fullName} • {p.client?.phone || 'No phone'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate('/policies')} className="px-3 py-1.5 bg-card/60 hover:bg-card border border-border text-xs font-medium rounded-lg transition-colors text-white">View</button>
                        <button onClick={() => navigate('/messages')} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 text-xs font-medium rounded-lg transition-colors">Contact Now</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-black/40 border border-border/30 p-4 rounded-xl text-center">
                    <p className="text-sm text-emerald-400 font-medium">No urgent expirations in the next 3 days. Good job!</p>
                  </div>
                )}
                {failedMessages.length > 0 && (
                  <div className="flex items-center justify-between bg-black/40 border border-amber-900/30 p-3 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-white">{failedMessages.length} message deliveries failed</p>
                      <p className="text-xs text-muted-foreground">Manual intervention required</p>
                    </div>
                    <button onClick={() => navigate('/messages')} className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20 text-xs font-medium rounded-lg transition-colors">Review Logs</button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights Panel */}
            <div className="bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <FaRobot />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">AI Insights</h3>
              </div>
              
              <ul className="space-y-4">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-white mb-0.5">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  </li>
                ))}
                {insights.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No insights available yet.</p>
                )}
              </ul>
            </div>
            
          </motion.div>

          {/* ═══ 3. POLICY ANALYTICS ═══ */}
          <motion.div variants={itemVariants} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Policy Analytics</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-red-400 flex items-center gap-1"><FaArrowDown className="text-[10px]"/> 12%</span>
                  <span className="text-xs text-muted-foreground">drop in renewals this week</span>
                </div>
              </div>
              <div className="flex bg-black/40 border border-border/50 rounded-lg p-1">
                {['7d', '30d', '90d'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setChartFilter(f)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartFilter === f ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white'}`}
                  >
                    Last {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="policyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2BC8B7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2BC8B7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="policies" name="Active Policies" stroke="#2BC8B7" strokeWidth={3} fillOpacity={1} fill="url(#policyGrad)" activeDot={{ r: 6, fill: '#fff', stroke: '#2BC8B7', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ═══ 5. ACTIVE POLICIES TABLE ═══ */}
          <motion.div variants={itemVariants} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">Active Policies</h3>
              <button onClick={() => navigate('/policies')} className="text-xs text-primary hover:text-primary/80 font-medium">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    <th className="px-5 py-3 font-semibold">Policy Name/ID</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Expiry Date</th>
                    <th className="px-5 py-3 font-semibold">Days Left</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {policies.slice(0, 5).map(pol => {
                    const daysLeft = getDaysLeft(pol.expiryDate);
                    return (
                      <tr key={pol.policyId} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-xs">
                              {getTypeIcon(pol.policyType || pol.vehicleType)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{pol.policyType || pol.vehicleType || 'General'}</p>
                              <p className="text-xs font-mono text-muted-foreground">{pol.policyNumber || `P${String(pol.policyId).padStart(4, '0')}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-foreground">{pol.client?.fullName || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm text-foreground">{formatDate(pol.expiryDate)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className={`text-sm ${getDaysLeftColor(daysLeft)}`}>
                            {daysLeft} days
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          {getStatusBadge(pol.policyStatus)}
                        </td>
                      </tr>
                    );
                  })}
                  {policies.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">No active policies found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ═══ BOTTOM ROW ═══ */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 6. Claims / Policy Distribution */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white tracking-tight mb-6">Policy Distribution</h3>
              <div className="flex items-center justify-center mb-6">
                {donutData.length === 0 ? (
                  <span className="text-muted-foreground/60 text-sm py-10">No data available.</span>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                        {donutData.map((_e, idx) => (
                          <Cell key={`c-${idx}`} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div className="space-y-3">
                {donutData.slice(0, 4).map((d, i) => {
                  const total = donutData.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}></span>
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold text-white">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. Communication Analytics */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white tracking-tight mb-6">Comm Analytics</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Messages Sent Today</span>
                    <span className="font-bold text-white">{commStats?.messagesSentToday || 0}</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, (commStats?.messagesSentToday || 0) * 10)}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 border border-border/50 p-4 rounded-xl">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1">WhatsApp Success</p>
                    <p className="text-2xl font-bold text-emerald-400">{(commStats?.whatsappSuccessRate || 0).toFixed(0)}%</p>
                  </div>
                  <div className="bg-black/30 border border-border/50 p-4 rounded-xl">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight mb-1">SMS Fallback</p>
                    <p className="text-2xl font-bold text-amber-400">{commStats?.smsFallbackCount || 0}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 ${commStats?.overallFailureRate && commStats.overallFailureRate > 10 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-xl text-sm`}>
                  <div className={commStats?.overallFailureRate && commStats.overallFailureRate > 10 ? 'text-red-500' : 'text-emerald-500'}><FaExclamationCircle /></div>
                  <div>
                    <span className={commStats?.overallFailureRate && commStats.overallFailureRate > 10 ? 'text-red-400 font-semibold block' : 'text-emerald-400 font-semibold block'}>
                      Failure Rate: {(commStats?.overallFailureRate || 0).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {commStats?.overallFailureRate && commStats.overallFailureRate > 10 ? 'Slightly above average today' : 'System performing optimally'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Recent Activity Feed */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white tracking-tight mb-6">Recent Activity</h3>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3.5 top-2 bottom-2 w-[1px] bg-border/50"></div>
                
                <div className="space-y-6">
                  {/* Activity Item 1 */}
                  <div className="relative flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 z-10 shrink-0">
                      <FaWhatsapp className="text-[10px]" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground"><span className="font-semibold">Reminder sent</span> to Rahul</p>
                      <p className="text-xs text-muted-foreground mt-0.5">2 min ago via WhatsApp</p>
                    </div>
                  </div>

                  {/* Activity Item 2 */}
                  <div className="relative flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary z-10 shrink-0">
                      <FaShieldAlt className="text-[10px]" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground"><span className="font-semibold">Policy renewed</span> (ID: 1234)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">15 min ago • Auto policy</p>
                    </div>
                  </div>

                  {/* Activity Item 3 */}
                  <div className="relative flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 z-10 shrink-0">
                      <FaSyncAlt className="text-[10px]" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground"><span className="font-semibold">Retry failed</span> for customer X</p>
                      <p className="text-xs text-muted-foreground mt-0.5">1 hr ago • Exhausted 3 retries</p>
                    </div>
                  </div>
                  
                  {/* Activity Item 4 */}
                  <div className="relative flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 z-10 shrink-0">
                      <FaSms className="text-[10px]" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground"><span className="font-semibold">SMS Fallback</span> triggered</p>
                      <p className="text-xs text-muted-foreground mt-0.5">2 hrs ago • Customer Y</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;