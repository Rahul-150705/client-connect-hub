import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaFileContract, FaUser, FaClock, FaCheckCircle, FaPlus, FaEnvelope, FaPhone, FaTimes, FaTrash, FaSearch, FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { policyAPI } from '../services/api';
import { toast } from 'react-toastify';
import { showToast } from '../lib/toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import Layout from '../components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, X, UploadCloud, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface Policy {
  policyId: number;
  policyNumber: string;
  policyType: string;
  policyStatus: string;
  startDate: string;
  expiryDate: string;
  premium: number;
  premiumFrequency: string;
  policyDescription?: string;
  clientFullName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  clientWhatsappNumber?: string;
  clientAddress?: string;
  pdfFilePath?: string;
  hasPdf?: boolean;
  renewalStatus: string;
  manualRenewalNotes?: string;
}

const POLICY_TYPES = ['LIFE', 'HEALTH', 'VEHICLE', 'HOME', 'TRAVEL', 'BUSINESS'];
const VEHICLE_TYPES = ['Car', 'Bike', 'Truck', 'Auto', 'Other'];

const ModalInput = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-1.5" style={{ fontFamily: 'DM Mono, monospace' }}>{label}</label>
    <input {...props} className="w-full bg-[#111018] border border-[#1e1c1f] px-3 py-2.5 text-xs text-[#F5F0E8] placeholder:text-[#F5F0E8]/20 focus:outline-none focus:border-amber-500 transition-colors" style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }} />
  </div>
);

const ModalSelect = ({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <div>
    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-1.5" style={{ fontFamily: 'DM Mono, monospace' }}>{label}</label>
    <select {...props} className="w-full bg-[#111018] border border-[#1e1c1f] px-3 py-2.5 text-xs text-[#F5F0E8] focus:outline-none focus:border-amber-500 transition-colors" style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>
      {children}
    </select>
  </div>
);

const Policies: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ policyType: '', minPremium: '', maxPremium: '', expiryDateFrom: '', expiryDateTo: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [policyToConfirm, setPolicyToConfirm] = useState<Policy | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [confirmFormData, setConfirmFormData] = useState({
    newStartDate: format(new Date(), 'yyyy-MM-dd'),
    newExpiryDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
    newPremium: '', notes: '',
  });
  const [formData, setFormData] = useState({
    clientFullName: '', clientEmail: '', clientPhoneNumber: '', clientWhatsappNumber: '', clientAddress: '',
    policyNumber: '', policyType: 'VEHICLE', vehicleType: 'Car', registrationNumber: '', insurerName: '',
    startDate: '', expiryDate: '', premium: '', premiumFrequency: 'YEARLY', policyDescription: '',
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showToast.error('Invalid file', 'Please upload a PDF document.');
      return;
    }
    
    setIsExtracting(true);
    setExtractionError('');
    try {
      const response = await policyAPI.extractFromPdf(file);
      const data = response.data;
      if (data.success) {
        showToast.success('Extracted', 'Form filled automatically from PDF.');
        let extractedPhone = data.clientPhoneNumber || prev.clientPhoneNumber;
        if (extractedPhone) {
          extractedPhone = extractedPhone.replace(/\D/g, ''); // strip all non-digits
          if (extractedPhone.startsWith('91') && extractedPhone.length > 10) {
            extractedPhone = '+91' + extractedPhone.substring(2);
          } else {
            extractedPhone = '+91' + extractedPhone;
          }
        }
        
        setFormData(prev => ({
          ...prev,
          clientFullName: data.clientFullName || prev.clientFullName,
          clientEmail: data.clientEmail || prev.clientEmail,
          clientPhoneNumber: extractedPhone,
          clientWhatsappNumber: extractedPhone,
          clientAddress: data.clientAddress || prev.clientAddress,
          policyNumber: data.policyNumber || prev.policyNumber,
          policyType: data.policyType || prev.policyType,
          vehicleType: data.vehicleType || prev.vehicleType,
          registrationNumber: data.registrationNumber || prev.registrationNumber,
          insurerName: data.insurerName || prev.insurerName,
          startDate: data.startDate || prev.startDate,
          expiryDate: data.expiryDate || prev.expiryDate,
          premium: data.premium || prev.premium,
          premiumFrequency: data.premiumFrequency || prev.premiumFrequency,
          policyDescription: data.policyDescription || prev.policyDescription,
        }));
      } else {
        const errorMsg = data.message || 'Could not extract data.';
        showToast.error('Extraction Failed', errorMsg);
        setExtractionError(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to process PDF.';
      showToast.error('Error', errorMsg);
      setExtractionError(errorMsg);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const policiesQuery = useQuery({
    queryKey: ['policies'],
    queryFn: () => policyAPI.getAllMyPolicies().then(res =>
      res.data.sort((a: Policy, b: Policy) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    ),
  });
  const policies = policiesQuery.data || [];
  const loading = policiesQuery.isLoading;

  const createMutation = useMutation({
    mutationFn: (data: any) => policyAPI.createPolicyWithClient(data),
    onSuccess: () => { showToast.success('Created', 'Policy added to portfolio.'); handleCloseModal(); queryClient.invalidateQueries({ queryKey: ['policies'] }); queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] }); },
    onError: (e: any) => showToast.error('Failed', e.response?.data?.error || 'Could not create policy'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => policyAPI.deletePolicy(id),
    onSuccess: () => { showToast.success('Deleted', 'Policy removed.'); setShowDeleteModal(false); setPolicyToDelete(null); queryClient.invalidateQueries({ queryKey: ['policies'] }); },
    onError: (e: any) => showToast.error('Failed', e.response?.data?.error || 'Could not delete policy'),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => policyAPI.confirmRenewal(id, data),
    onSuccess: () => { showToast.success('Renewed', 'Policy renewed successfully.'); setShowConfirmModal(false); setPolicyToConfirm(null); queryClient.invalidateQueries({ queryKey: ['policies'] }); },
    onError: (e: any) => showToast.error('Failed', e.response?.data?.error || 'Renewal failed'),
  });

  useEffect(() => {
    const action = searchParams.get('action');
    const filterParam = searchParams.get('filter');
    if (action === 'add') { setShowModal(true); setSearchParams({}); }
    else if (filterParam === 'LOST') setFilter('LOST');
  }, [searchParams]);

  useEffect(() => { setCurrentPage(1); }, [filter, searchQuery, advancedFilters]);

  // Freeze background scrolling when any modal is open
  useEffect(() => {
    if (showModal || showDeleteModal || showConfirmModal || selectedPolicy !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showDeleteModal, showConfirmModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...formData, premium: parseFloat(formData.premium) }); };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ clientFullName: '', clientEmail: '', clientPhoneNumber: '', clientWhatsappNumber: '', clientAddress: '', policyNumber: '', policyType: 'VEHICLE', vehicleType: 'Car', registrationNumber: '', insurerName: '', startDate: '', expiryDate: '', premium: '', premiumFrequency: 'YEARLY', policyDescription: '' });
  };

  const getDaysUntilExpiry = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const filteredPolicies = useMemo(() => {
    return policies.filter((p: Policy) => {
      if (filter === 'ACTIVE' && p.policyStatus !== 'ACTIVE') return false;
      if (filter === 'EXPIRING') { const d = getDaysUntilExpiry(p.expiryDate); if (!(p.policyStatus === 'ACTIVE' && d <= 30 && d > 0)) return false; }
      if (filter === 'EXPIRED' && p.policyStatus !== 'EXPIRED') return false;
      if (filter === 'LOST' && !(p.policyStatus === 'EXPIRED' && p.renewalStatus === 'PENDING')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (![p.policyNumber, p.clientFullName, p.clientEmail, p.clientPhoneNumber, p.policyType, p.policyDescription || ''].some(f => f.toLowerCase().includes(q))) return false;
      }
      if (advancedFilters.policyType && p.policyType !== advancedFilters.policyType) return false;
      if (advancedFilters.minPremium && p.premium < parseFloat(advancedFilters.minPremium)) return false;
      if (advancedFilters.maxPremium && p.premium > parseFloat(advancedFilters.maxPremium)) return false;
      if (advancedFilters.expiryDateFrom && new Date(p.expiryDate) < new Date(advancedFilters.expiryDateFrom)) return false;
      if (advancedFilters.expiryDateTo && new Date(p.expiryDate) > new Date(advancedFilters.expiryDateTo)) return false;
      return true;
    });
  }, [policies, filter, searchQuery, advancedFilters]);

  const totalPages = Math.ceil(filteredPolicies.length / pageSize);
  const paginatedPolicies = useMemo(() => filteredPolicies.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredPolicies, currentPage]);
  const hasActiveAdvancedFilters = Object.values(advancedFilters).some(v => v !== '');

  const stats = {
    total: policies.length,
    active: policies.filter((p: Policy) => p.policyStatus === 'ACTIVE').length,
    expiring: policies.filter((p: Policy) => { const d = getDaysUntilExpiry(p.expiryDate); return p.policyStatus === 'ACTIVE' && d <= 30 && d > 0; }).length,
    expired: policies.filter((p: Policy) => p.policyStatus === 'EXPIRED').length,
    lost: policies.filter((p: Policy) => p.policyStatus === 'EXPIRED' && p.renewalStatus === 'PENDING').length,
  };

  const statusColor = (status: string) => {
    if (status === 'ACTIVE') return 'text-emerald-400';
    if (status === 'EXPIRED') return 'text-red-400';
    if (status === 'RENEWED') return 'text-amber-500';
    return 'text-[#F5F0E8]/40';
  };

  if (loading) return <Layout><div className="flex justify-center items-center min-h-[400px]"><div className="spinner" /></div></Layout>;

  const FILTERS = [
    { id: 'ALL', label: 'All', count: stats.total },
    { id: 'ACTIVE', label: 'Active', count: stats.active },
    { id: 'EXPIRING', label: 'Expiring', count: stats.expiring },
    { id: 'EXPIRED', label: 'Expired', count: stats.expired },
    { id: 'LOST', label: 'Lost', count: stats.lost },
  ];

  return (
    <Layout>
      <div className="space-y-8" style={{ fontFamily: 'Syne, sans-serif' }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1e1c1f]">
          <div>
            <p className="text-[9px] text-amber-500 uppercase tracking-[0.3em] mb-3" style={{ fontFamily: 'DM Mono, monospace' }}>Asset Management</p>
            <h1 className="text-4xl font-black text-[#F5F0E8] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              Policies<br /><span className="text-amber-500 italic">Portfolio</span>
            </h1>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 text-xs font-black uppercase tracking-[0.1em] transition-all self-start md:self-auto"
            style={{ borderRadius: 0 }}>
            <Plus className="w-3.5 h-3.5" /> Add Policy
          </button>
        </div>

        {/* Stat Filters */}
        <div className="grid grid-cols-5 gap-px bg-[#1e1c1f]">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`bg-[#0d0c0e] p-5 text-left transition-all group ${filter === f.id ? 'bg-[#111018]' : 'hover:bg-[#0f0e11]'}`}>
              {filter === f.id && <div className="w-full h-0.5 bg-amber-500 mb-4" />}
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/30 mb-2" style={{ fontFamily: 'DM Mono, monospace' }}>{f.label}</p>
              <p className={`text-2xl font-black ${filter === f.id ? 'text-amber-500' : 'text-[#F5F0E8]'}`}
                style={{ fontFamily: 'Playfair Display, serif' }}>{f.count}</p>
            </button>
          ))}
        </div>

        {/* Search & filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F5F0E8]/20 text-xs" />
              <input
                type="text" placeholder="Search policies, clients, phone..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d0c0e] border border-[#1e1c1f] pl-10 pr-4 py-2.5 text-xs text-[#F5F0E8] placeholder:text-[#F5F0E8]/20 focus:outline-none focus:border-amber-500 transition-colors"
                style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }} />
            </div>
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] border transition-all
                ${showAdvancedFilters || hasActiveAdvancedFilters ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-[#1e1c1f] text-[#F5F0E8]/40 hover:text-[#F5F0E8] hover:border-[#2a2830]'}`}
              style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>
              <FaFilter className="text-[9px]" />
              Filters {hasActiveAdvancedFilters && `(${Object.values(advancedFilters).filter(v => v !== '').length})`}
            </button>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border border-[#1e1c1f] bg-[#0d0c0e] p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ModalSelect label="Policy Type" value={advancedFilters.policyType} onChange={e => setAdvancedFilters(p => ({ ...p, policyType: e.target.value }))}>
                    <option value="">All Types</option>
                    {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </ModalSelect>
                  <ModalInput label="Min Premium (₹)" type="number" placeholder="0" value={advancedFilters.minPremium} onChange={e => setAdvancedFilters(p => ({ ...p, minPremium: e.target.value }))} />
                  <ModalInput label="Max Premium (₹)" type="number" placeholder="999999" value={advancedFilters.maxPremium} onChange={e => setAdvancedFilters(p => ({ ...p, maxPremium: e.target.value }))} />
                  <div className="flex items-end">
                    <button onClick={() => setAdvancedFilters({ policyType: '', minPremium: '', maxPremium: '', expiryDateFrom: '', expiryDateTo: '' })}
                      disabled={!hasActiveAdvancedFilters}
                      className="w-full py-2.5 text-[9px] font-bold uppercase tracking-[0.15em] border border-red-500/30 text-red-400 hover:bg-red-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>
                      Clear All
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        {filteredPolicies.length === 0 ? (
          <div className="border border-[#1e1c1f] bg-[#0d0c0e] p-16 text-center">
            <FileText className="w-8 h-8 text-[#F5F0E8]/10 mx-auto mb-4" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/30" style={{ fontFamily: 'DM Mono, monospace' }}>
              No policies found
            </p>
          </div>
        ) : (
          <div className="border border-[#1e1c1f] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e1c1f] bg-[#0d0c0e]">
                    {['#', 'Policy', 'Client', 'Type', 'Premium', 'Expiry', 'Status', 'Days Left', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[8px] font-black uppercase tracking-[0.2em] text-[#F5F0E8]/25"
                        style={{ fontFamily: 'DM Mono, monospace' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedPolicies.map((policy: Policy, idx: number) => {
                    const daysLeft = getDaysUntilExpiry(policy.expiryDate);
                    return (
                      <tr key={policy.policyId} onClick={() => setSelectedPolicy(policy)} className="border-b border-[#1e1c1f]/50 hover:bg-white/[0.015] transition-colors cursor-pointer">
                        <td className="px-5 py-4 text-[9px] text-[#F5F0E8]/20 tabular-nums" style={{ fontFamily: 'DM Mono, monospace' }}>
                          {String((currentPage - 1) * pageSize + idx + 1).padStart(2, '0')}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-bold text-amber-500" style={{ fontFamily: 'DM Mono, monospace' }}>
                            {policy.policyNumber}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-[#F5F0E8] mb-0.5">{policy.clientFullName}</p>
                          <p className="text-[9px] text-[#F5F0E8]/30" style={{ fontFamily: 'DM Mono, monospace' }}>{policy.clientEmail}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[9px] font-bold px-2 py-0.5 border border-[#1e1c1f] text-[#F5F0E8]/50 uppercase tracking-wider"
                            style={{ fontFamily: 'DM Mono, monospace' }}>
                            {policy.policyType}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-black text-[#F5F0E8]" style={{ fontFamily: 'DM Mono, monospace' }}>₹{policy.premium.toLocaleString()}</p>
                          <p className="text-[9px] text-[#F5F0E8]/25" style={{ fontFamily: 'DM Mono, monospace' }}>/{policy.premiumFrequency}</p>
                        </td>
                        <td className="px-5 py-4 text-[10px] text-[#F5F0E8]/60" style={{ fontFamily: 'DM Mono, monospace' }}>
                          {format(new Date(policy.expiryDate), 'dd MMM yy')}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${statusColor(policy.policyStatus)}`}
                            style={{ fontFamily: 'DM Mono, monospace' }}>
                            {policy.policyStatus}
                          </span>
                          {policy.renewalStatus !== 'PENDING' && (
                            <p className="text-[8px] text-amber-500 mt-0.5 uppercase tracking-wider" style={{ fontFamily: 'DM Mono, monospace' }}>
                              {policy.renewalStatus.replace('_', ' ')}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {policy.policyStatus === 'ACTIVE' ? (
                            <span className={`text-[10px] font-black tabular-nums ${daysLeft <= 7 ? 'text-red-400' : daysLeft <= 30 ? 'text-amber-500' : 'text-emerald-400'}`}
                              style={{ fontFamily: 'DM Mono, monospace' }}>
                              {daysLeft > 0 ? `${daysLeft}d` : 'EXP'}
                            </span>
                          ) : <span className="text-[#F5F0E8]/20">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setPolicyToConfirm(policy); setConfirmFormData({ newStartDate: format(new Date(), 'yyyy-MM-dd'), newExpiryDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'), newPremium: policy.premium.toString(), notes: `Renewed ${policy.policyNumber}` }); setShowConfirmModal(true); }}
                              className="p-1.5 border border-[#1e1c1f] text-[#F5F0E8]/30 hover:text-emerald-400 hover:border-emerald-500/30 transition-all" title="Renew">
                              <FaCheckCircle className="text-xs" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setPolicyToDelete(policy); setShowDeleteModal(true); }}
                              className="p-1.5 border border-[#1e1c1f] text-[#F5F0E8]/30 hover:text-red-400 hover:border-red-500/30 transition-all" title="Delete">
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-[#1e1c1f] flex items-center justify-between bg-[#0d0c0e]">
                <p className="text-[9px] text-[#F5F0E8]/30 uppercase tracking-[0.15em]" style={{ fontFamily: 'DM Mono, monospace' }}>
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredPolicies.length)} of {filteredPolicies.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="w-8 h-8 border border-[#1e1c1f] text-[#F5F0E8]/40 hover:text-[#F5F0E8] disabled:opacity-20 flex items-center justify-center transition-all text-xs"
                    style={{ borderRadius: 0 }}>←</button>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 text-[9px] font-bold border transition-all ${currentPage === p ? 'bg-amber-500 border-amber-500 text-black' : 'border-[#1e1c1f] text-[#F5F0E8]/40 hover:text-[#F5F0E8]'}`}
                      style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>{p}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="w-8 h-8 border border-[#1e1c1f] text-[#F5F0E8]/40 hover:text-[#F5F0E8] disabled:opacity-20 flex items-center justify-center transition-all text-xs"
                    style={{ borderRadius: 0 }}>→</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODALS ── */}
        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && policyToDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => { setShowDeleteModal(false); setPolicyToDelete(null); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm bg-[#0d0c0e] border border-[#1e1c1f] p-6"
                style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-black text-[#F5F0E8] uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>Delete Policy</h2>
                  <button onClick={() => { setShowDeleteModal(false); setPolicyToDelete(null); }} className="text-[#F5F0E8]/30 hover:text-[#F5F0E8]"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2 mb-6 text-[10px] text-[#F5F0E8]/50" style={{ fontFamily: 'DM Mono, monospace' }}>
                  <p>Policy: <span className="text-amber-500 font-bold">{policyToDelete.policyNumber}</span></p>
                  <p>Client: <span className="text-[#F5F0E8]">{policyToDelete.clientFullName}</span></p>
                  <p>Premium: <span className="text-[#F5F0E8]">₹{policyToDelete.premium}</span></p>
                </div>
                <p className="text-[10px] text-red-400 mb-5" style={{ fontFamily: 'DM Mono, monospace' }}>This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => { setShowDeleteModal(false); setPolicyToDelete(null); }} disabled={deleteMutation.isPending}
                    className="flex-1 py-2.5 border border-[#1e1c1f] text-[10px] font-bold uppercase tracking-[0.1em] text-[#F5F0E8]/50 hover:text-[#F5F0E8] transition-all"
                    style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>Cancel</button>
                  <button onClick={() => policyToDelete && deleteMutation.mutate(policyToDelete.policyId)} disabled={deleteMutation.isPending}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-[10px] font-black uppercase tracking-[0.1em] text-white transition-all disabled:opacity-50"
                    style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Renewal Modal */}
        <AnimatePresence>
          {showConfirmModal && policyToConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setShowConfirmModal(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md bg-[#0d0c0e] border border-[#1e1c1f] p-6 max-h-[90vh] overflow-y-auto"
                style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-black text-[#F5F0E8] uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>Confirm Renewal</h2>
                  <button onClick={() => setShowConfirmModal(false)} className="text-[#F5F0E8]/30 hover:text-[#F5F0E8]"><X className="w-4 h-4" /></button>
                </div>
                <div className="mb-5 p-3 border border-amber-500/20 bg-amber-500/5">
                  <p className="text-[10px] text-[#F5F0E8]/50" style={{ fontFamily: 'DM Mono, monospace' }}>
                    Renewing: <span className="text-amber-500 font-bold">{policyToConfirm.policyNumber}</span> · {policyToConfirm.clientFullName}
                  </p>
                </div>
                <form onSubmit={e => { e.preventDefault(); policyToConfirm && confirmMutation.mutate({ id: policyToConfirm.policyId, data: { ...confirmFormData, newPremium: parseFloat(confirmFormData.newPremium), contactMethod: 'MANUAL_DASHBOARD' } }); }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <DateRangePicker 
                      startDate={confirmFormData.newStartDate} 
                      endDate={confirmFormData.newExpiryDate} 
                      onChange={({ startDate, endDate }) => setConfirmFormData(p => ({ ...p, newStartDate: startDate, newExpiryDate: endDate }))} 
                    />
                  </div>
                  <ModalInput label="New Premium (₹)" type="number" required value={confirmFormData.newPremium} onChange={e => setConfirmFormData(p => ({ ...p, newPremium: e.target.value }))} placeholder="0" />
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]/40 mb-1.5" style={{ fontFamily: 'DM Mono, monospace' }}>Notes</label>
                    <textarea rows={2} value={confirmFormData.notes} onChange={e => setConfirmFormData(p => ({ ...p, notes: e.target.value }))}
                      className="w-full bg-[#111018] border border-[#1e1c1f] px-3 py-2 text-xs text-[#F5F0E8] focus:outline-none focus:border-amber-500 resize-none"
                      style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowConfirmModal(false)}
                      className="flex-1 py-2.5 border border-[#1e1c1f] text-[10px] font-bold uppercase tracking-[0.1em] text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-all"
                      style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>Cancel</button>
                    <button type="submit" disabled={confirmMutation.isPending}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50 transition-all"
                      style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>
                      {confirmMutation.isPending ? 'Processing...' : 'Confirm & Renew'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Policy Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[50] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={handleCloseModal}>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-2xl bg-[#0d0c0e] border border-[#1e1c1f] max-h-[92vh] overflow-y-auto scrollbar-hide"
                style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1c1f] sticky top-0 bg-[#0d0c0e] z-10">
                  <h2 className="text-base font-black text-[#F5F0E8] uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>Add New Policy</h2>
                  <button onClick={handleCloseModal} className="text-[#F5F0E8]/30 hover:text-[#F5F0E8] transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-6 pt-5 pb-0">
                  <div className={`border p-4 flex flex-col gap-3 transition-colors ${extractionError ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/20'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-bold flex items-center gap-2 ${extractionError ? 'text-red-400' : 'text-[#F5F0E8]'}`}>
                          <span className={extractionError ? 'text-red-500' : 'text-amber-500'}>⚡</span> AI PDF Extraction
                        </p>
                        <p className="text-[10px] text-[#F5F0E8]/50 mt-1" style={{ fontFamily: 'DM Mono, monospace' }}>
                          Upload a physical PDF to automatically fill this form.
                        </p>
                      </div>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handlePdfUpload} 
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isExtracting}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all disabled:opacity-50 flex items-center gap-2 ${extractionError ? 'bg-red-500 hover:bg-red-400 text-white border-0' : 'bg-amber-500 hover:bg-amber-400 text-black border-0'}`}
                        style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}
                      >
                        {isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                        {isExtracting ? 'Extracting...' : 'Upload PDF'}
                      </button>
                    </div>
                    {extractionError && (
                      <p className="text-[10px] font-bold text-red-500 tracking-wide mt-1" style={{ fontFamily: 'DM Mono, monospace' }}>
                        Error: {extractionError}
                      </p>
                    )}
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-amber-500 mb-4" style={{ fontFamily: 'DM Mono, monospace' }}>Client Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ModalInput label="Full Name *" name="clientFullName" required placeholder="Jane Doe" value={formData.clientFullName} onChange={handleInputChange} />
                      <ModalInput label="Email" name="clientEmail" type="email" placeholder="jane@example.com" value={formData.clientEmail} onChange={handleInputChange} />
                      <ModalInput label="Phone (SMS) *" name="clientPhoneNumber" type="tel" required placeholder="+919876543210" value={formData.clientPhoneNumber} onChange={handleInputChange} />
                      <ModalInput label="WhatsApp" name="clientWhatsappNumber" type="tel" placeholder="+919876543210" value={formData.clientWhatsappNumber} onChange={handleInputChange} />
                      <ModalInput label="Address" name="clientAddress" placeholder="Full address" value={formData.clientAddress} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="border-t border-[#1e1c1f] pt-6">
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-amber-500 mb-4" style={{ fontFamily: 'DM Mono, monospace' }}>Policy Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ModalInput label="Policy Number *" name="policyNumber" required placeholder="POL-2024-001" value={formData.policyNumber} onChange={handleInputChange} />
                      <ModalSelect label="Policy Type *" name="policyType" required value={formData.policyType} onChange={handleInputChange}>
                        <option value="VEHICLE">Vehicle</option>
                        <option value="LIFE">Life</option>
                        <option value="HEALTH">Health</option>
                        <option value="HOME">Home</option>
                        <option value="TRAVEL">Travel</option>
                      </ModalSelect>
                      <ModalSelect label="Vehicle Type" name="vehicleType" value={formData.vehicleType} onChange={handleInputChange}>
                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </ModalSelect>
                      <ModalInput label="Registration No." name="registrationNumber" placeholder="TN01AB1234" value={formData.registrationNumber} onChange={handleInputChange} />
                      <ModalInput label="Insurer Name" name="insurerName" placeholder="Company name" value={formData.insurerName} onChange={handleInputChange} />
                      <div className="col-span-1 md:col-span-2">
                        <DateRangePicker 
                          startDate={formData.startDate} 
                          endDate={formData.expiryDate} 
                          onChange={({ startDate, endDate }) => setFormData(p => ({ ...p, startDate, expiryDate: endDate }))} 
                        />
                      </div>
                      <ModalInput label="Premium (₹) *" name="premium" type="number" step="0.01" min="0" required placeholder="0.00" value={formData.premium} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="flex gap-3 border-t border-[#1e1c1f] pt-5">
                    <button type="button" onClick={handleCloseModal}
                      className="flex-1 py-3 border border-[#1e1c1f] text-[10px] font-bold uppercase tracking-[0.1em] text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-all"
                      style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>Cancel</button>
                    <button type="submit" disabled={createMutation.isPending}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50 transition-all"
                      style={{ borderRadius: 0, fontFamily: 'DM Mono, monospace' }}>
                      {createMutation.isPending ? 'Creating...' : 'Create Policy'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Policy Modal */}
        <AnimatePresence>
          {selectedPolicy && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setSelectedPolicy(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg bg-[#0d0c0e] border border-[#1e1c1f] p-6 max-h-[90vh] overflow-y-auto"
                style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-[#F5F0E8] uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>Policy Details</h2>
                    <p className="text-[10px] text-amber-500 font-bold tracking-wider mt-1" style={{ fontFamily: 'DM Mono, monospace' }}>{selectedPolicy.policyNumber}</p>
                  </div>
                  <button onClick={() => setSelectedPolicy(null)} className="text-[#F5F0E8]/30 hover:text-[#F5F0E8]"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#F5F0E8]/40 mb-3" style={{ fontFamily: 'DM Mono, monospace' }}>Client Information</p>
                    <div className="grid grid-cols-2 gap-4 bg-[#111018] border border-[#1e1c1f] p-4 text-xs" style={{ fontFamily: 'DM Mono, monospace' }}>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Name</p>
                        <p className="text-[#F5F0E8] font-bold">{selectedPolicy.clientFullName}</p>
                      </div>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Email</p>
                        <p className="text-[#F5F0E8]">{selectedPolicy.clientEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Phone</p>
                        <p className="text-[#F5F0E8]">{selectedPolicy.clientPhoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">WhatsApp</p>
                        <p className="text-[#F5F0E8]">{selectedPolicy.clientWhatsappNumber || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[#F5F0E8]/40 mb-1">Address</p>
                        <p className="text-[#F5F0E8] whitespace-pre-wrap">{selectedPolicy.clientAddress || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#F5F0E8]/40 mb-3" style={{ fontFamily: 'DM Mono, monospace' }}>Policy Information</p>
                    <div className="grid grid-cols-2 gap-4 bg-[#111018] border border-[#1e1c1f] p-4 text-xs" style={{ fontFamily: 'DM Mono, monospace' }}>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Type</p>
                        <p className="text-[#F5F0E8] font-bold">{selectedPolicy.policyType}</p>
                      </div>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Status</p>
                        <p className={`font-bold ${statusColor(selectedPolicy.policyStatus)}`}>{selectedPolicy.policyStatus}</p>
                      </div>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Start Date</p>
                        <p className="text-[#F5F0E8]">{format(new Date(selectedPolicy.startDate), 'dd MMM yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Expiry Date</p>
                        <p className="text-[#F5F0E8]">{format(new Date(selectedPolicy.expiryDate), 'dd MMM yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Premium</p>
                        <p className="text-[#F5F0E8] font-bold">₹{selectedPolicy.premium.toLocaleString()} <span className="text-[#F5F0E8]/40">/{selectedPolicy.premiumFrequency}</span></p>
                      </div>
                      <div>
                        <p className="text-[#F5F0E8]/40 mb-1">Renewal Status</p>
                        <p className="text-amber-500">{selectedPolicy.renewalStatus.replace('_', ' ')}</p>
                      </div>
                      {selectedPolicy.policyDescription && (
                        <div className="col-span-2">
                          <p className="text-[#F5F0E8]/40 mb-1">Description</p>
                          <p className="text-[#F5F0E8] whitespace-pre-wrap">{selectedPolicy.policyDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Policies;