import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, FileText, Clock, MessageSquare,
  AlertTriangle, TrendingUp, Plus, ArrowRight, Download
} from 'lucide-react';
import { policyAPI, messagesAPI, dashboardAPI } from '../services/api';
import Layout from '../components/Layout';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const DONUT_COLORS = ['#F5A623', '#E8954A', '#D4804F', '#B86940', '#8C5030', '#5C3320'];

const TOOLTIP_STYLE = {
  backgroundColor: '#0d0c0e',
  border: '1px solid #1e1c1f',
  borderRadius: '0px',
  color: '#F5F0E8',
  fontSize: '11px',
  fontFamily: 'DM Mono, monospace',
  padding: '8px 12px',
};

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState(30);
  const navigate = useNavigate();
  const { user } = useAuth();

  const policiesQuery = useQuery({ queryKey: ['policies'], queryFn: () => policyAPI.getAllMyPolicies().then(r => r.data) });
  const messageLogsQuery = useQuery({ queryKey: ['messageLogs'], queryFn: () => messagesAPI.getAllLogs().then(r => r.data) });
  const summaryQuery = useQuery({ queryKey: ['dashboardSummary', period], queryFn: () => dashboardAPI.getSummary(period).then(r => r.data) });
  const distributionQuery = useQuery({ queryKey: ['distribution'], queryFn: () => dashboardAPI.getClaimsDistribution().then(r => r.data) });
  const aiInsightsQuery = useQuery({ queryKey: ['aiInsights'], queryFn: () => dashboardAPI.getAiInsights().then(r => r.data) });
  const projectedRenewalsQuery = useQuery({ queryKey: ['projectedRenewals', period], queryFn: () => dashboardAPI.getProjectedRenewals(period).then(r => r.data) });
  const revenueTrendsQuery = useQuery({ queryKey: ['revenueTrends'], queryFn: () => dashboardAPI.getRevenueTrends().then(r => r.data) });

  const loading = policiesQuery.isLoading || summaryQuery.isLoading;
  const isFetching = policiesQuery.isFetching || summaryQuery.isFetching || distributionQuery.isFetching;

  const policies = policiesQuery.data || [];
  const messageLogs = messageLogsQuery.data || [];
  const summary = summaryQuery.data;
  const donutData = distributionQuery.data || [];
  const aiInsights = aiInsightsQuery.data || [];
  const projectedRenewals = projectedRenewalsQuery.data || [];
  const revenueTrends = revenueTrendsQuery.data || [];

  const stats = {
    total: summary?.totalPolicies || 0,
    expiring: summary?.expiringSoonCount || 0,
    renewalRate: summary?.renewalRate || 0,
    activePremium: summary?.annualPremium || 0,
    renewedThisMonth: summary?.renewedThisMonth || 0,
    lost: summary?.lostClientsCount || 0,
  };

  const areaChartData = useMemo(() => {
    if (projectedRenewals.length > 0) {
      return projectedRenewals.map((item: any) => ({
        label: new Date(item.name).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        policies: item.value
      }));
    }
    return [];
  }, [projectedRenewals]);

  const revenueChartData = useMemo(() =>
    revenueTrends.map((item: any) => ({ month: item.name, amount: item.value })),
    [revenueTrends]);

  const recentMessages = useMemo(() =>
    [...messageLogs].sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime()).slice(0, 5),
    [messageLogs]);

  const failedMessages = useMemo(() => messageLogs.filter((m: any) => m.status === 'FAILED'), [messageLogs]);

  const containerV: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const itemV: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  // Only show full-page spinner on very first load (no cached data at all)
  if (loading && !policies.length && !summary) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    </Layout>
  );

  const KpiCard = ({ label, value, sub, color, onClick, num }: {
    label: string; value: number | string; sub?: string; color: string; onClick?: () => void; num: string;
  }) => (
    <motion.div variants={itemV} onClick={onClick}
      className={`bg-[#0d0c0e] border border-[#1e1c1f] p-6 relative overflow-hidden transition-all group
        ${onClick ? 'cursor-pointer hover:border-amber-500/30' : ''}`}>
      <span className="absolute top-4 right-4 text-[9px] text-[#F5F0E8]/15" style={{ fontFamily: 'DM Mono, monospace' }}>{num}</span>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-4" style={{ fontFamily: 'DM Mono, monospace' }}>{label}</p>
      <p className={`text-4xl font-black leading-none ${color}`} style={{ fontFamily: 'Playfair Display, serif' }}>{value}</p>
      {sub && <p className="text-[10px] text-[#F5F0E8]/30 mt-2" style={{ fontFamily: 'DM Mono, monospace' }}>{sub}</p>}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/30 transition-all" />
    </motion.div>
  );

  return (
    <Layout>
      {/* Thin top bar shows on background refetch — not a full page block */}
      {isFetching && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-amber-500/20">
          <div className="h-full bg-amber-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
      <motion.div variants={containerV} initial="hidden" animate="visible"
        className="space-y-8 max-w-[1600px]" style={{ fontFamily: 'Syne, sans-serif' }}>

        {/* ── HEADER ── */}
        <motion.div variants={itemV} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1e1c1f]">
          <div>
            <p className="text-[9px] text-amber-500 uppercase tracking-[0.3em] mb-3" style={{ fontFamily: 'DM Mono, monospace' }}>
              Portfolio Overview
            </p>
            <h1 className="text-4xl font-black text-[#F5F0E8] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              {user?.fullName ? `${user.fullName.split(' ')[0]}'s` : 'Your'}<br />
              <span className="text-amber-500 italic">Dashboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#0d0c0e] border border-[#1e1c1f] p-0.5">
              {[7, 30, 90].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all
                    ${period === p ? 'bg-amber-500 text-black' : 'text-[#F5F0E8]/40 hover:text-[#F5F0E8]'}`}
                  style={{ fontFamily: 'DM Mono, monospace', borderRadius: 0 }}>
                  {p}D
                </button>
              ))}
            </div>
            <button onClick={() => navigate('/policies?action=add')}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 text-xs font-black uppercase tracking-[0.1em] transition-all"
              style={{ borderRadius: 0 }}>
              <Plus className="w-3.5 h-3.5" /> New Policy
            </button>
          </div>
        </motion.div>

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1e1c1f]">
          <KpiCard num="01" label="Total Policies" value={stats.total} color="text-[#F5F0E8]" />
          <KpiCard num="02" label="Expiring Soon" value={stats.expiring} color="text-amber-500"
            sub="within 30 days" onClick={() => navigate('/policies?status=EXPIRING')} />
          <KpiCard num="03" label="Lost Clients" value={stats.lost} color="text-red-400"
            sub="no renewal" onClick={() => navigate('/policies?filter=LOST')} />
          <KpiCard num="04" label="Renewed This Month" value={stats.renewedThisMonth} color="text-emerald-400" />
        </div>

        {/* ── CONVERSION + CHANNEL ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1e1c1f]">
          {/* Conversion ring */}
          <motion.div variants={itemV} className="bg-[#0d0c0e] p-8 md:col-span-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-6" style={{ fontFamily: 'DM Mono, monospace' }}>
              Monthly Conversion
            </p>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#1e1c1f" strokeWidth="6" fill="none" />
                  <motion.circle cx="56" cy="56" r="48" stroke="#F5A623" strokeWidth="6" fill="none"
                    strokeLinecap="square"
                    strokeDasharray={301.6}
                    initial={{ strokeDashoffset: 301.6 }}
                    animate={{ strokeDashoffset: 301.6 - (301.6 * (summary?.conversionRate || 0)) / 100 }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-amber-500" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {(summary?.conversionRate || 0).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-[#F5F0E8] mb-1">Expiring → Renewed</p>
                <p className="text-[10px] text-[#F5F0E8]/40 leading-relaxed max-w-[140px]" style={{ fontFamily: 'DM Mono, monospace' }}>
                  Policies expiring this period that have been renewed
                </p>
              </div>
            </div>
          </motion.div>

          {/* WhatsApp health */}
          <motion.div variants={itemV} className="bg-[#0d0c0e] p-8">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-6" style={{ fontFamily: 'DM Mono, monospace' }}>
              Delivery Health
            </p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#F5F0E8] uppercase tracking-wider">WhatsApp</span>
                  <span className="text-sm font-black text-emerald-400" style={{ fontFamily: 'DM Mono, monospace' }}>
                    {(summary?.whatsappSuccessRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1 w-full bg-[#1e1c1f]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${summary?.whatsappSuccessRate || 0}%` }}
                    className="h-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action required */}
          <motion.div variants={itemV} className="bg-[#0d0c0e] p-8">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-400 mb-6" style={{ fontFamily: 'DM Mono, monospace' }}>
              Action Required
            </p>
            <div className="space-y-3">
              <div onClick={() => navigate('/messages?status=FAILED')}
                className="flex items-center justify-between p-3 border border-red-500/15 hover:border-red-500/30 cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs font-bold text-[#F5F0E8] uppercase tracking-wide">Critical Retries</p>
                    <p className="text-[9px] text-[#F5F0E8]/30 mt-0.5" style={{ fontFamily: 'DM Mono, monospace' }}>Max attempts (3/3)</p>
                  </div>
                </div>
                <span className="text-xl font-black text-red-400" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {summary?.exhaustedRetriesCount || 0}
                </span>
              </div>
              <div onClick={() => navigate('/policies?status=EXPIRED')}
                className="flex items-center justify-between p-3 border border-[#1e1c1f] hover:border-amber-500/20 cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-[#F5F0E8] uppercase tracking-wide">Lost Clients</p>
                    <p className="text-[9px] text-[#F5F0E8]/30 mt-0.5" style={{ fontFamily: 'DM Mono, monospace' }}>Expired without renewal</p>
                  </div>
                </div>
                <span className="text-xl font-black text-amber-500" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {summary?.lostClientsCount || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── MAIN CHARTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#1e1c1f]">
          <motion.div variants={itemV} className="lg:col-span-2 bg-[#0d0c0e] p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-1" style={{ fontFamily: 'DM Mono, monospace' }}>Projected</p>
                <h3 className="text-lg font-black text-[#F5F0E8]" style={{ fontFamily: 'Playfair Display, serif' }}>Renewal Pipeline</h3>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#4a4850', fontSize: 9, fontFamily: 'DM Mono' }} dy={12} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4a4850', fontSize: 9, fontFamily: 'DM Mono' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(245,166,35,0.1)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="policies" stroke="#F5A623" strokeWidth={1.5}
                    fillOpacity={1} fill="url(#areaGrad)"
                    activeDot={{ r: 3, fill: '#F5A623', stroke: '#09080A', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemV} className="bg-[#0d0c0e] p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-1" style={{ fontFamily: 'DM Mono, monospace' }}>Breakdown</p>
              <h3 className="text-lg font-black text-[#F5F0E8]" style={{ fontFamily: 'Playfair Display, serif' }}>Portfolio Mix</h3>
            </div>
            <div className="h-[160px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                    {donutData.map((_: any, i: number) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-amber-500" style={{ fontFamily: 'Playfair Display, serif' }}>{stats.total}</span>
                <span className="text-[8px] text-[#F5F0E8]/30 uppercase tracking-[0.15em]" style={{ fontFamily: 'DM Mono, monospace' }}>Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-6">
              {donutData.slice(0, 4).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <div>
                    <p className="text-[9px] text-amber-500/70 uppercase tracking-wider truncate" style={{ fontFamily: 'DM Mono, monospace' }}>{item.name}</p>
                    <p className="text-sm font-black text-amber-400" style={{ fontFamily: 'Playfair Display, serif' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── REVENUE BAR ── */}
        <motion.div variants={itemV} className="bg-[#0d0c0e] border border-[#1e1c1f] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-1" style={{ fontFamily: 'DM Mono, monospace' }}>Annual</p>
              <h3 className="text-lg font-black text-[#F5F0E8]" style={{ fontFamily: 'Playfair Display, serif' }}>Revenue Trend</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/30" style={{ fontFamily: 'DM Mono, monospace' }}>Live</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#4a4850', fontSize: 9, fontFamily: 'DM Mono' }} dy={12} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4a4850', fontSize: 9, fontFamily: 'DM Mono' }}
                  tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(245,166,35,0.05)' }}
                  formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="amount" fill="#F5A623" fillOpacity={0.8} radius={[2, 2, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── ACTIVITY + AI INSIGHTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#1e1c1f]">
          {/* Recent Activity */}
          <motion.div variants={itemV} className="lg:col-span-2 bg-[#0d0c0e] overflow-hidden">
            <div className="px-8 py-5 border-b border-[#1e1c1f] flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40" style={{ fontFamily: 'DM Mono, monospace' }}>Recent</p>
                <h3 className="text-base font-black text-[#F5F0E8]" style={{ fontFamily: 'Playfair Display, serif' }}>Activity Feed</h3>
              </div>
              <button onClick={() => navigate('/messages')}
                className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                style={{ fontFamily: 'DM Mono, monospace' }}>
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1c1f]">
                  {['Client', 'Policy', 'Channel', 'Status', 'Time'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[8px] font-black uppercase tracking-[0.2em] text-[#F5F0E8]/25"
                      style={{ fontFamily: 'DM Mono, monospace' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMessages.map((msg: any, i: number) => (
                  <tr key={i} className="border-b border-[#1e1c1f]/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3.5 text-xs font-bold text-[#F5F0E8]">{msg.clientName || '—'}</td>
                    <td className="px-6 py-3.5 text-[10px] text-[#F5F0E8]/40" style={{ fontFamily: 'DM Mono, monospace' }}>
                      {msg.policyNumber || '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 border border-[#1e1c1f] text-[#F5F0E8]/50 uppercase tracking-wider"
                        style={{ fontFamily: 'DM Mono, monospace' }}>
                        {msg.channel}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 ${msg.status === 'SENT' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${msg.status === 'SENT' ? 'text-emerald-400' : 'text-red-400'}`}
                          style={{ fontFamily: 'DM Mono, monospace' }}>
                          {msg.status === 'SENT' ? 'Sent' : 'Failed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[10px] text-[#F5F0E8]/30" style={{ fontFamily: 'DM Mono, monospace' }}>
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* AI Insights + Alerts */}
          <motion.div variants={itemV} className="bg-[#0d0c0e] flex flex-col">
            <div className="p-6 border-b border-[#1e1c1f]">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40" style={{ fontFamily: 'DM Mono, monospace' }}>Predictive</p>
                  <h3 className="text-base font-black text-[#F5F0E8]" style={{ fontFamily: 'Playfair Display, serif' }}>AI Insights</h3>
                </div>
              </div>
              <div className="space-y-2">
                {aiInsights.map((ins: any, i: number) => (
                  <div key={i} className="p-3 border border-[#1e1c1f] hover:border-amber-500/20 transition-all">
                    <p className="text-xs font-bold text-[#F5F0E8] mb-1 uppercase tracking-wide">{ins.title}</p>
                    <p className="text-[10px] text-[#F5F0E8]/40 leading-relaxed" style={{ fontFamily: 'DM Mono, monospace' }}>{ins.description}</p>
                  </div>
                ))}
                {aiInsights.length === 0 && (
                  <p className="text-[10px] text-[#F5F0E8]/25 italic text-center py-4" style={{ fontFamily: 'DM Mono, monospace' }}>
                    No insights yet
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400" style={{ fontFamily: 'DM Mono, monospace' }}>
                  {failedMessages.length > 0 ? 'Action needed' : 'System optimal'}
                </p>
              </div>
              {failedMessages.length > 0 ? (
                <div>
                  <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-4" style={{ fontFamily: 'DM Mono, monospace' }}>
                    {failedMessages.length} messages exhausted retry attempts
                  </p>
                  <button onClick={() => navigate('/messages?status=FAILED')}
                    className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                    style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>
                    Resolve Failures
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-400/30" />
                  <p className="text-[10px] text-[#F5F0E8]/30 leading-relaxed" style={{ fontFamily: 'DM Mono, monospace' }}>
                    All channels operational. No critical alerts.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;