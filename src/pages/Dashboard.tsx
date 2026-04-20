import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaFileContract, FaClock, FaCheckCircle, FaPlus, FaChartLine, FaChartPie, FaChartBar } from 'react-icons/fa';
import { policyAPI, messagesAPI } from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';

interface Policy {
  policyId: number;
  policyStatus: string;
  expiryDate: string;
  vehicleType?: string;
  policyType?: string;
}

interface MessageLog {
  id: number;
  status: string;
  channel: string;
}

// ── Palette ──────────────────────────────────────────────────
const VEHICLE_COLORS = [
  '#f97316', // orange-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#eab308', // yellow-500
  '#6366f1', // indigo-500
];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(20, 14%, 12%)',
  border: '1px solid hsl(20, 14%, 22%)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '13px',
  padding: '10px 14px',
};

// ── Helpers ──────────────────────────────────────────────────
const getMonthLabel = (date: Date) =>
  date.toLocaleString('default', { month: 'short', year: '2-digit' });

// Custom label in the centre of each pie slice
const renderPieLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, name,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null; // hide tiny slices
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
};

// ── Component ────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalPolicies: 0,
    activePolicies: 0,
    expiringPolicies: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [policyRes, msgRes] = await Promise.all([
        policyAPI.getAllMyPolicies(),
        messagesAPI.getAllLogs().catch(() => ({ data: [] })),
      ]);

      const pols: Policy[] = policyRes.data;
      const msgs: MessageLog[] = msgRes.data;

      setPolicies(pols);
      setMessageLogs(msgs);

      const activePolicies = pols.filter(p => p.policyStatus === 'ACTIVE').length;

      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(today.getDate() + 30);

      const expiringPolicies = pols.filter(p => {
        if (p.policyStatus !== 'ACTIVE') return false;
        const expiryDate = new Date(p.expiryDate);
        return expiryDate >= today && expiryDate <= thirtyDaysLater;
      }).length;

      setStats({
        totalPolicies: pols.length,
        activePolicies,
        expiringPolicies,
      });
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived chart data ───────────────────────────────────
  const renewalLineData = useMemo(() => {
    const today = new Date();
    const monthBuckets: Record<string, number> = {};
    // Pre-fill 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      monthBuckets[getMonthLabel(d)] = 0;
    }
    const sixMonthsLater = new Date(today.getFullYear(), today.getMonth() + 6, 0);
    policies.forEach(p => {
      if (p.policyStatus !== 'ACTIVE') return;
      const exp = new Date(p.expiryDate);
      if (exp < today || exp > sixMonthsLater) return;
      const key = getMonthLabel(exp);
      if (key in monthBuckets) monthBuckets[key]++;
    });
    return Object.entries(monthBuckets).map(([month, count]) => ({ month, policies: count }));
  }, [policies]);

  const vehiclePieData = useMemo(() => {
    const counts: Record<string, number> = {};
    policies.forEach(p => {
      const vType = p.vehicleType?.trim() || 'Other';
      counts[vType] = (counts[vType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [policies]);

  const messageBarData = useMemo(() => {
    let sent = 0;
    let failed = 0;
    messageLogs.forEach(m => {
      if (m.status === 'SENT') sent++;
      else if (m.status === 'FAILED') failed++;
    });
    return [
      { name: 'Sent', count: sent, fill: '#22c55e' },
      { name: 'Failed', count: failed, fill: '#ef4444' },
    ];
  }, [messageLogs]);

  // ── Stat cards ───────────────────────────────────────────
  const statCards = [
    {
      title: 'Total Policies',
      value: stats.totalPolicies,
      icon: FaFileContract,
      color: 'bg-primary',
      textColor: 'text-primary',
      link: '/policies',
    },
    {
      title: 'Active Policies',
      value: stats.activePolicies,
      icon: FaCheckCircle,
      color: 'bg-success',
      textColor: 'text-success',
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringPolicies,
      icon: FaClock,
      color: 'bg-warning',
      textColor: 'text-warning',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="spinner" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Overview</p>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome to Renew AI Insurance Management</p>
          </div>
          <Link
            to="/policies?action=add"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white
              font-semibold hover:opacity-90 hover:shadow-glow transition-all duration-300 active:scale-[0.98]"
          >
            <FaPlus /> Add Policy
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const content = (
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl ${card.color}/10 flex items-center justify-center`}>
                  <card.icon className={`text-2xl ${card.textColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-4xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
              </div>
            );

            const className = `bg-card rounded-2xl border border-border p-6 shadow-sm
              transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20
              ${card.link ? 'cursor-pointer' : ''}`;
            
            return card.link ? (
              <Link key={index} to={card.link} className={className}>
                {content}
              </Link>
            ) : (
              <div key={index} className={className}>
                {content}
              </div>
            );
          })}
        </div>

        {/* ───────── Analytics Section ───────── */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <FaChartLine className="text-primary" /> Analytics Overview
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Line Chart – Projected Renewals */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm
              transition-all duration-300 hover:shadow-lg hover:border-primary/20 col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <FaChartLine className="text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Projected Renewals</h3>
                <span className="text-xs text-muted-foreground ml-auto">Next 6 months</span>
              </div>
              {renewalLineData.every(d => d.policies === 0) ? (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                  No upcoming renewals in the next 6 months
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={renewalLineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 14%, 22%)" />
                    <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="policies"
                      name="Renewals Due"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: '#f97316', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 2. Pie Chart – Vehicle Breakdown */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm
              transition-all duration-300 hover:shadow-lg hover:border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <FaChartPie className="text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Vehicle Breakdown</h3>
              </div>
              {vehiclePieData.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                  No policies to display
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={vehiclePieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="value"
                      label={renderPieLabel}
                      labelLine={false}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {vehiclePieData.map((_entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={VEHICLE_COLORS[idx % VEHICLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                      formatter={(value: string) => <span style={{ color: '#d4d4d8' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 3. Bar Chart – Message Success Rates */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm
              transition-all duration-300 hover:shadow-lg hover:border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <FaChartBar className="text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Message Delivery</h3>
              </div>
              {messageLogs.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                  No messages sent yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={messageBarData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 14%, 22%)" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar
                      dataKey="count"
                      name="Messages"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                    >
                      {messageBarData.map((entry, idx) => (
                        <Cell key={`bar-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link
              to="/policies"
              className="bg-card rounded-2xl border border-border p-6 shadow-sm
                transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                hover:border-primary/30 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center
                  group-hover:bg-gradient-primary group-hover:shadow-glow transition-all duration-300">
                  <FaFileContract className="text-2xl text-primary group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                    View All Policies
                  </h3>
                  <p className="text-sm text-muted-foreground">Browse and manage all policies</p>
                </div>
              </div>
            </Link>

            <Link
              to="/policies?action=add"
              className="bg-card rounded-2xl border border-border p-6 shadow-sm
                transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                hover:border-success/30 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center
                  group-hover:bg-gradient-success group-hover:shadow-lg transition-all duration-300">
                  <FaPlus className="text-2xl text-success group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg group-hover:text-success transition-colors">
                    Add New Policy
                  </h3>
                  <p className="text-sm text-muted-foreground">Create a new insurance policy</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FaClock className="text-xl text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Policy Renewals</h3>
              <p className="text-sm text-muted-foreground">
                You have <span className="font-semibold text-warning">{stats.expiringPolicies}</span> policies 
                expiring within the next 30 days
              </p>
            </div>
            <Link
              to="/policies"
              className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;