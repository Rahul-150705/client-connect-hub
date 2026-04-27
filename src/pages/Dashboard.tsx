import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldCheck, FileText, Clock, MessageSquare, 
  AlertTriangle, TrendingUp, TrendingDown, Plus, ChevronRight,
  Filter, MoreHorizontal, Download, Calendar, ArrowRight
} from 'lucide-react';
import { policyAPI, messagesAPI, dashboardAPI } from '../services/api';
import Layout from '../components/Layout';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { Sparkline } from '../components/premium/Sparkline';
import { GlassTooltip } from '../components/premium/GlassTooltip';

import { DashboardSkeleton } from '../components/premium/ShimmerSkeleton';

// ── Professional Palette ──────────────────────────────────────
const DONUT_COLORS = ['#3b82f6', '#6366f1', '#94a3b8', '#475569', '#1e293b', '#0f172a'];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
  padding: '12px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
};

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState(30);
  const navigate = useNavigate();


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

  const commStatsQuery = useQuery({
    queryKey: ['communicationStats'],
    queryFn: () => dashboardAPI.getCommunicationStats().then(res => res.data),
  });

  const aiInsightsQuery = useQuery({
    queryKey: ['aiInsights'],
    queryFn: () => dashboardAPI.getAiInsights().then(res => res.data),
  });

  const projectedRenewalsQuery = useQuery({
    queryKey: ['projectedRenewals', period],
    queryFn: () => dashboardAPI.getProjectedRenewals(period).then(res => res.data),
  });
  
  const revenueTrendsQuery = useQuery({
    queryKey: ['revenueTrends'],
    queryFn: () => dashboardAPI.getRevenueTrends().then(res => res.data),
  });

  const loading = policiesQuery.isLoading || messageLogsQuery.isLoading || summaryQuery.isLoading || projectedRenewalsQuery.isLoading;

  const policies = policiesQuery.data || [];
  const messageLogs = messageLogsQuery.data || [];
  const summary = summaryQuery.data;
  const donutData = distributionQuery.data || [];
  const commStats = commStatsQuery.data;
  const aiInsights = aiInsightsQuery.data || [];
  const projectedRenewals = projectedRenewalsQuery.data || [];
  const revenueTrends = revenueTrendsQuery.data || [];
  
  const stats = {
    total: summary?.totalPolicies || 0,
    expiring: summary?.expiringSoonCount || 0,
    renewalRate: summary?.renewalRate || 0,
    failedCount: summary?.failedMessagesCount || 0,
    activePremium: summary?.annualPremium || 0,
    growth: summary?.policiesGrowthPercentage || 0,
    renewedThisMonth: summary?.renewedThisMonth || 0
  };

  const failedMessages = useMemo(() => messageLogs.filter(m => m.status === 'FAILED'), [messageLogs]);

  const areaChartData = useMemo(() => {
    if (projectedRenewals.length > 0) {
      return projectedRenewals.map(item => ({
        label: new Date(item.name).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        policies: item.value
      }));
    }
    // Fallback labels if no data
    const labels = period === 7 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : 
                  period === 30 ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return labels.map(label => ({
      label,
      policies: 0
    }));
  }, [projectedRenewals, period]);

  const revenueChartData = useMemo(() => {
    return revenueTrends.map(item => ({
      month: item.name,
      amount: item.value
    }));
  }, [revenueTrends]);

  const recentMessages = useMemo(() => {
    return [...messageLogs]
      .sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime())
      .slice(0, 5);
  }, [messageLogs]);

  const containerVariants: Variants = { 
    hidden: { opacity: 0 }, 
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } } 
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const sparkData = [10, 15, 8, 12, 18, 14, 20, 18, 25];

  if (loading) return <Layout><DashboardSkeleton /></Layout>;

  return (
    <Layout>
      <div className="relative min-h-screen text-foreground bg-background">
        <motion.div 
          className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10" 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
        >
          {/* ═══ HEADER ═══ */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/50">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Enterprise Dashboard</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Portfolio Performance
              </h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-lg">
                Overview of your insurance portfolio, renewal tracking, and automated communication performance.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
                  <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50">
                {[7, 30, 90].map(p => (
                  <button 
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${period === p ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                  >
                    {p}D
                  </button>
                ))}
              </div>
              <button 
                onClick={() => navigate('/policies?action=add')}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
              >
                <Plus className="w-4 h-4" /> New Policy
              </button>
            </div>
          </motion.div>

          {/* ═══ MASTER METRICS (High Priority) ═══ */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Policies Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/60 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/40 transition-all shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Portfolio</p>
                      <h2 className="text-4xl font-black text-white">{stats.total}</h2>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Assets Managed</span>
                    <div className="h-1.5 w-48 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-full shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Lost Clients Card (Clickable) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => navigate('/policies?filter=LOST')}
                className="bg-card border border-border/60 rounded-3xl p-8 relative overflow-hidden group hover:border-rose-500/40 transition-all shadow-2xl cursor-pointer"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                  <AlertTriangle className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Lost Clients</p>
                        <h2 className="text-4xl font-black text-white">{summary?.lostClientsCount || 0}</h2>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">Action Required</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Unconfirmed Renewals</span>
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest group-hover:gap-3 transition-all">
                      Click to view <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ═══ STATS GRID (Secondary Metrics) ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Expiring Premium', value: `₹${(stats.activePremium || 0).toLocaleString()}`, icon: FileText, color: 'text-emerald-400', sparkColor: '#10b981', trend: `${(summary?.revenueGrowthPercentage || 0) >= 0 ? '+' : ''}${(summary?.revenueGrowthPercentage || 0).toFixed(1)}%` },
              { label: 'Expiring Soon', value: stats.expiring, icon: Clock, color: 'text-warning', sparkColor: '#f59e0b', trend: stats.expiring > 10 ? 'Critical' : 'Stable' },
              { label: 'Renewed This Month', value: stats.renewedThisMonth, icon: TrendingUp, color: 'text-indigo-400', sparkColor: '#6366f1', trend: 'Monthly Target' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="bg-card border border-border/40 rounded-xl p-6 transition-all hover:border-border/80"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-secondary border border-border/50 ${stat.trend.includes('+') ? 'text-emerald-400' : 'text-warning'}`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <h2 className="text-3xl font-bold text-white mt-1">{stat.value}</h2>
                <div className="mt-6">
                  <Sparkline data={sparkData} color={stat.sparkColor} width={140} height={20} fill={false} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ═══ CONVERSION & CHANNEL HEALTH ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div variants={itemVariants} className="bg-card border border-border/40 rounded-xl p-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Monthly Conversion</h3>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-40 h-40">
                   <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-secondary"
                    />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={440}
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (440 * (summary?.conversionRate || 0)) / 100 }}
                      className="text-primary"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{(summary?.conversionRate || 0).toFixed(1)}%</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Expiring → Renewed</span>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-6 leading-relaxed">
                  Percentage of policies expiring this period that have been successfully renewed.
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-card border border-border/40 rounded-xl p-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8">Channel Delivery Health</h3>
              <div className="space-y-10 py-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">WhatsApp Success</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-400">{(summary?.whatsappSuccessRate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${summary?.whatsappSuccessRate || 0}%` }}
                      className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-card border border-border/40 rounded-xl p-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 text-rose-400">Action Required</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl group hover:bg-rose-500/10 transition-all cursor-pointer" onClick={() => navigate('/messages?status=FAILED')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Critical Retries</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Max attempts exhausted (3/3)</p>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-rose-400">{summary?.exhaustedRetriesCount || 0}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl group hover:bg-orange-500/10 transition-all cursor-pointer" onClick={() => navigate('/policies?status=EXPIRED')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Lost Clients</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Expired without renewal</p>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-orange-400">{summary?.lostClientsCount || 0}</div>
                </div>
                
                <button 
                  onClick={() => navigate('/messages')}
                  className="w-full mt-2 py-3 bg-secondary/50 text-white text-[11px] font-bold rounded-xl border border-border/50 hover:bg-secondary transition-all"
                >
                  Manage All Alerts
                </button>
              </div>
            </motion.div>
          </div>

          {/* ═══ MAIN ANALYTICS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-card border border-border/40 rounded-xl p-8">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-lg font-bold text-white">Projected Renewals</h3>
                  <p className="text-xs text-muted-foreground mt-1">Expected policy expirations for the selected period</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/50" />
                    <span className="text-[11px] font-bold text-muted-foreground">Expiring</span>
                  </div>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                      dy={15} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                    />
                    <Tooltip 
                      contentStyle={CHART_TOOLTIP_STYLE}
                      cursor={{ stroke: 'rgba(255, 255, 255, 0.05)', strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="policies" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#chartGrad)" 
                      activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-card border border-border/40 rounded-xl p-8 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">Portfolio Mix</h3>
              <p className="text-xs text-muted-foreground mb-10">Breakdown by asset category</p>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="h-[220px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((_e, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-white">{stats.total}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Assets</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-10">
                  {donutData.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="text-[11px] font-bold text-muted-foreground uppercase truncate">{item.name}</span>
                      </div>
                      <span className="text-lg font-bold text-white ml-3.5">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ═══ REVENUE TREND ═══ */}
          <motion.div variants={itemVariants} className="bg-card border border-border/40 rounded-xl p-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-bold text-white">Annual Revenue Trend</h3>
                <p className="text-xs text-muted-foreground mt-1">Monthly breakdown of gross premiums for the current year</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Live Analytics</span>
              </div>
            </div>
            
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                  />
                  <Tooltip 
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  >
                    {revenueChartData.map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === new Date().getMonth() ? '#6366f1' : '#3b82f6'} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ═══ ACTIVITY & ALERTS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-card border border-border/40 rounded-xl overflow-hidden">
              <div className="px-8 py-6 border-b border-border/40 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground">
                    <Filter className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate('/messages')} className="text-xs font-bold text-primary hover:underline">View All</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 bg-secondary/20">
                      <th className="px-8 py-4">Client</th>
                      <th className="px-8 py-4">Policy</th>
                      <th className="px-8 py-4">Channel</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {recentMessages.map((msg, i) => (
                      <tr key={i} className="hover:bg-secondary/10 transition-all group">
                        <td className="px-8 py-4 text-sm font-bold text-white">{msg.clientName || 'N/A'}</td>
                        <td className="px-8 py-4 text-[11px] font-mono text-muted-foreground">POL-{msg.policyNumber || '0000'}</td>
                        <td className="px-8 py-4">
                          <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded border border-border/50 uppercase">{msg.channel}</span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${msg.status === 'SENT' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]'}`} />
                            <span className={`text-[11px] font-bold ${msg.status === 'SENT' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {msg.status === 'SENT' ? 'Delivered' : 'Failed'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right text-xs text-muted-foreground font-medium">
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              {/* Communication Performance */}
              <div className="bg-card border border-border/40 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Comm. Performance</h3>
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">WhatsApp Success</span>
                      <span className="text-emerald-400">{(commStats?.whatsappSuccessRate || 0).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${commStats?.whatsappSuccessRate || 0}%` }}
                        className="h-full bg-emerald-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 col-span-2 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Messages Sent ({period}D)</p>
                      <p className="text-lg font-bold text-white">{commStats?.messagesSentToday || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">AI Insights</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Predictive Analytics</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {aiInsights.map((insight, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-default group">
                      <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{insight.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                    </div>
                  ))}
                  {aiInsights.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 italic">No insights available yet.</p>
                  )}
                </div>
              </div>

              {/* Critical Alerts */}
              <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">System Alerts</h3>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Manual Action Required</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {failedMessages.length > 0 ? (
                    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs font-bold text-white mb-2">Automated Failure</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {failedMessages.length} renewals failed communication. System has exhausted 3 retries for these clients.
                      </p>
                      <button 
                        onClick={() => navigate('/messages?status=FAILED')}
                        className="w-full mt-5 py-2.5 bg-red-500 text-white text-[11px] font-bold rounded-lg shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                      >
                        Resolve Critical Failures
                      </button>
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <ShieldCheck className="w-10 h-10 text-emerald-400/30 mx-auto mb-3" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">System Optimal</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance / Info */}
              <div className="bg-card border border-border/40 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">System Status</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Operational
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-[11px] font-medium border-b border-border/20 pb-3">
                    <span className="text-muted-foreground">WhatsApp API</span>
                    <span className="text-white">Active</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span className="text-white">Just now</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;