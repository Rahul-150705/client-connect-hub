import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, Calendar, Search, Filter, 
  TrendingUp, ArrowRight, User, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { policyAPI } from '../services/api';
import Layout from '../components/Layout';
import { format, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';

const Renewals: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policyAPI.getAllMyPolicies().then(res => res.data),
  });

  const renewedPolicies = useMemo(() => {
    return policies.filter((p: any) => p.renewalStatus === 'RENEWED');
  }, [policies]);

  const filteredRenewals = useMemo(() => {
    return renewedPolicies.filter((p: any) => {
      const matchesSearch = searchQuery.trim() === '' || 
        p.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientFullName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = !selectedDate || isSameDay(new Date(p.createdAt), new Date(selectedDate));
      
      return matchesSearch && matchesDate;
    });
  }, [renewedPolicies, searchQuery, selectedDate]);

  const totalPages = Math.ceil(filteredRenewals.length / pageSize);
  const paginatedRenewals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRenewals.slice(start, start + pageSize);
  }, [filteredRenewals, currentPage]);

  const stats = {
    total: renewedPolicies.length,
    today: renewedPolicies.filter((p: any) => isSameDay(new Date(p.createdAt), new Date())).length,
    revenue: renewedPolicies.reduce((sum: number, p: any) => sum + p.premium, 0)
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Renewal Management</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Successful Renewals
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Track and audit all policies successfully renewed through the automated or manual workflow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* ═══ QUICK STATS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Renewed</p>
            <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-[10px] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Cumulative Success</span>
            </div>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Renewed Today</p>
            <h3 className="text-2xl font-bold text-white">{stats.today}</h3>
            <div className="mt-4 flex items-center gap-2 text-indigo-400 text-[10px] font-bold">
              <ArrowRight className="w-3 h-3" />
              <span>Live Updates</span>
            </div>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Renewal Revenue</p>
            <h3 className="text-2xl font-bold text-white">₹{stats.revenue.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-[10px] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Total Book Value</span>
            </div>
          </div>
        </div>

        {/* ═══ TABLE ═══ */}
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary/10">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search policy or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
               <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-[11px] font-bold text-muted-foreground hover:text-white hover:border-border/80 transition-all">
                <Filter className="w-3.5 h-3.5" />
                Filter View
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-secondary/5">
                  <th className="px-8 py-5">Policy Number</th>
                  <th className="px-8 py-5">Client</th>
                  <th className="px-8 py-5">Premium</th>
                  <th className="px-8 py-5">Renewal Date</th>
                  <th className="px-8 py-5">Notes</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-muted-foreground text-xs italic">
                      Loading successful renewals...
                    </td>
                  </tr>
                ) : paginatedRenewals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No renewals found for this date</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRenewals.map((policy: any, i: number) => (
                    <motion.tr 
                      key={policy.policyId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-indigo-500/[0.02] transition-all group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-all">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-mono font-bold text-white">{policy.policyNumber}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-bold text-white">{policy.clientFullName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-emerald-400">₹{policy.premium.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs text-muted-foreground font-medium">
                          {format(new Date(policy.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">
                          {policy.manualRenewalNotes || 'Automated system renewal'}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-all">
                          View PDF
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-8 py-5 border-t border-border/40 bg-secondary/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-white transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-white transition-all disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Renewals;
