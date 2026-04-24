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
import { FileText, Plus } from 'lucide-react';

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
}

const POLICY_TYPES = ['LIFE', 'HEALTH', 'VEHICLE', 'HOME', 'TRAVEL', 'BUSINESS'];
const VEHICLE_TYPES = ['Car', 'Bike', 'Truck', 'Auto', 'Other'];

const Policies: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Search & Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    policyType: '',
    minPremium: '',
    maxPremium: '',
    expiryDateFrom: '',
    expiryDateTo: '',
  });

  const [formData, setFormData] = useState({
    clientFullName: '',
    clientEmail: '',
    clientPhoneNumber: '',
    clientWhatsappNumber: '',
    clientAddress: '',
    policyNumber: '',
    policyType: 'VEHICLE',
    vehicleType: 'Car',
    registrationNumber: '',
    insurerName: '',
    startDate: '',
    expiryDate: '',
    premium: '',
    premiumFrequency: 'YEARLY',
    policyDescription: '',
  });

  // Queries
  const policiesQuery = useQuery({
    queryKey: ['policies'],
    queryFn: () => policyAPI.getAllMyPolicies().then(res => 
      res.data.sort((a: Policy, b: Policy) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      )
    ),
  });

  const policies = policiesQuery.data || [];
  const loading = policiesQuery.isLoading;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => policyAPI.createPolicyWithClient(data),
    onSuccess: () => {
      showToast.success('Creation Successful', 'The new policy has been added to your portfolio.');
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'System was unable to create the policy.';
      showToast.error('Creation Failed', errorMessage);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => policyAPI.deletePolicy(id),
    onSuccess: () => {
      showToast.success('Deletion Successful', 'The policy has been removed from your portfolio.');
      setShowDeleteModal(false);
      setPolicyToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'System was unable to delete the policy.';
      showToast.error('Deletion Failed', errorMessage);
    }
  });

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowModal(true);
      setSearchParams({});
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, advancedFilters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // PDF storage disabled — file select/remove handlers commented out
  // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     if (file.type !== 'application/pdf') {
  //       toast.error('Please upload a PDF file');
  //       return;
  //     }
  //     if (file.size > 10 * 1024 * 1024) {
  //       toast.error('File size must be less than 10MB');
  //       return;
  //     }
  //     setUploadedFile(file);
  //   }
  // };

  // const handleRemoveFile = () => {
  //   setUploadedFile(null);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  // };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      premium: parseFloat(formData.premium),
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // setUploadedFile(null);  // PDF storage disabled
    setFormData({
      clientFullName: '',
      clientEmail: '',
      clientPhoneNumber: '',
      clientWhatsappNumber: '',
      clientAddress: '',
      policyNumber: '',
      policyType: 'VEHICLE',
      vehicleType: 'Car',
      registrationNumber: '',
      insurerName: '',
      startDate: '',
      expiryDate: '',
      premium: '',
      premiumFrequency: 'YEARLY',
      policyDescription: '',
    });
  };

  const handleDeleteClick = (policy: Policy) => {
    setPolicyToDelete(policy);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!policyToDelete) return;
    deleteMutation.mutate(policyToDelete.policyId);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPolicyToDelete(null);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      EXPIRED: 'bg-red-500/10 text-red-400 border-red-500/20',
      RENEWED: 'bg-primary/10 text-primary border-primary/20',
      CANCELLED: 'bg-muted/10 text-muted-foreground border-muted/20',
    };
    return colors[status] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter(policy => {
      // Status filter
      if (filter === 'ACTIVE' && policy.policyStatus !== 'ACTIVE') return false;
      if (filter === 'EXPIRING') {
        const daysUntilExpiry = getDaysUntilExpiry(policy.expiryDate);
        if (!(policy.policyStatus === 'ACTIVE' && daysUntilExpiry <= 30 && daysUntilExpiry > 0)) return false;
      }
      if (filter === 'EXPIRED' && policy.policyStatus !== 'EXPIRED') return false;

      // Search query - searches across multiple fields
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          policy.policyNumber,
          policy.clientFullName,
          policy.clientEmail,
          policy.clientPhoneNumber,
          policy.policyType,
          policy.policyDescription || '',
        ].map(f => f.toLowerCase());

        if (!searchableFields.some(field => field.includes(query))) return false;
      }

      // Advanced filters
      if (advancedFilters.policyType && policy.policyType !== advancedFilters.policyType) return false;

      if (advancedFilters.minPremium) {
        const minPremium = parseFloat(advancedFilters.minPremium);
        if (!isNaN(minPremium) && policy.premium < minPremium) return false;
      }

      if (advancedFilters.maxPremium) {
        const maxPremium = parseFloat(advancedFilters.maxPremium);
        if (!isNaN(maxPremium) && policy.premium > maxPremium) return false;
      }

      if (advancedFilters.expiryDateFrom) {
        const fromDate = new Date(advancedFilters.expiryDateFrom);
        if (new Date(policy.expiryDate) < fromDate) return false;
      }

      if (advancedFilters.expiryDateTo) {
        const toDate = new Date(advancedFilters.expiryDateTo);
        if (new Date(policy.expiryDate) > toDate) return false;
      }

      return true;
    });
  }, [policies, filter, searchQuery, advancedFilters]);

  const totalPages = Math.ceil(filteredPolicies.length / pageSize);
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, currentPage]);

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      policyType: '',
      minPremium: '',
      maxPremium: '',
      expiryDateFrom: '',
      expiryDateTo: '',
    });
  };

  const hasActiveAdvancedFilters = Object.values(advancedFilters).some(v => v !== '');

  const stats = {
    total: policies.length,
    active: policies.filter(p => p.policyStatus === 'ACTIVE').length,
    expiring: policies.filter(p => {
      const days = getDaysUntilExpiry(p.expiryDate);
      return p.policyStatus === 'ACTIVE' && days <= 30 && days > 0;
    }).length,
    expired: policies.filter(p => p.policyStatus === 'EXPIRED').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="spinner" />
          <p className="text-muted-foreground">Loading policies...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Asset Management</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">Policies Portfolio</h1>
            <p className="text-muted-foreground mt-2 text-sm">Manage, track and audit your full insurance portfolio in one place.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white
              text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add New Policy
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setFilter('ALL')}
            className={`bg-card rounded-xl border p-4 flex items-center gap-3 transition-all
              ${filter === 'ALL' ? 'border-primary shadow-glow' : 'border-border hover:border-primary/50'}`}
          >
            <FaFileContract className="text-2xl text-primary" />
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`bg-card rounded-xl border p-4 flex items-center gap-3 transition-all
              ${filter === 'ACTIVE' ? 'border-success shadow-lg' : 'border-border hover:border-success/50'}`}
          >
            <FaCheckCircle className="text-2xl text-success" />
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-foreground">{stats.active}</p>
            </div>
          </button>
          <button
            onClick={() => setFilter('EXPIRING')}
            className={`bg-card rounded-xl border p-4 flex items-center gap-3 transition-all
              ${filter === 'EXPIRING' ? 'border-warning shadow-lg' : 'border-border hover:border-warning/50'}`}
          >
            <FaClock className="text-2xl text-warning" />
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Expiring</p>
              <p className="text-xl font-bold text-foreground">{stats.expiring}</p>
            </div>
          </button>
          <button
            onClick={() => setFilter('EXPIRED')}
            className={`bg-card rounded-xl border p-4 flex items-center gap-3 transition-all
              ${filter === 'EXPIRED' ? 'border-destructive shadow-lg' : 'border-border hover:border-destructive/50'}`}
          >
            <FaFileContract className="text-2xl text-destructive" />
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-xl font-bold text-foreground">{stats.expired}</p>
            </div>
          </button>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by policy number, client name, email, phone, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${showAdvancedFilters || hasActiveAdvancedFilters
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              <FaFilter />
              Advanced Filters
              {hasActiveAdvancedFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {Object.values(advancedFilters).filter(v => v !== '').length}
                </span>
              )}
              {showAdvancedFilters ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Policy Type */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Policy Type
                  </label>
                  <select
                    value={advancedFilters.policyType}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, policyType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground
                      focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Types</option>
                    {POLICY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>



                {/* Premium Range */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Premium Range (₹)
                  </label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={advancedFilters.minPremium}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minPremium: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={advancedFilters.maxPremium}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxPremium: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                {/* Expiry Date From */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Expiry Date From
                  </label>
                  <Input
                    type="date"
                    value={advancedFilters.expiryDateFrom}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, expiryDateFrom: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>

                {/* Expiry Date To */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Expiry Date To
                  </label>
                  <Input
                    type="date"
                    value={advancedFilters.expiryDateTo}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, expiryDateTo: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>

                {/* Clear Button */}
                <div className="flex items-end">
                  <button
                    onClick={clearAdvancedFilters}
                    disabled={!hasActiveAdvancedFilters}
                    className="px-4 py-2 rounded-lg font-medium text-sm bg-destructive/10 text-destructive
                      hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="flex gap-2 flex-wrap pt-2">
            {['ALL', 'ACTIVE', 'EXPIRING', 'EXPIRED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                {f === 'ALL' ? `All (${stats.total})` :
                  f === 'ACTIVE' ? `Active (${stats.active})` :
                    f === 'EXPIRING' ? `Expiring Soon (${stats.expiring})` :
                      `Expired (${stats.expired})`}
              </button>
            ))}
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || hasActiveAdvancedFilters) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filteredPolicies.length} of {policies.length} policies</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-foreground">
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Policies Table */}
        {filteredPolicies.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <FaFileContract className="text-5xl text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No policies found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'ALL' ? 'Start by adding your first policy' : `No ${filter.toLowerCase()} policies`}
            </p>
            {filter === 'ALL' && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-white
                  font-medium hover:opacity-90 transition-all duration-200"
              >
                <FaPlus /> Add Policy
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/30">
                  <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40">
                    <th className="px-6 py-4">Policy / ID</th>
                    <th className="px-6 py-4">Client Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Premium</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Days Left</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedPolicies.map((policy) => {
                    const daysUntilExpiry = getDaysUntilExpiry(policy.expiryDate);
                    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

                    return (
                      <tr
                        key={policy.policyId}
                        className={`hover:bg-secondary/30 transition-colors ${isExpiringSoon ? 'bg-warning/5' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm text-foreground">{policy.policyNumber}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-primary" />
                            <span className="font-medium text-foreground">{policy.clientFullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FaEnvelope className="text-xs" />
                              <span>{policy.clientEmail}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FaPhone className="text-xs" />
                              <span>{policy.clientPhoneNumber}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 rounded bg-secondary text-sm text-foreground">
                            {policy.policyType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <span className="font-semibold text-foreground">₹{policy.premium}</span>
                            <span className="text-xs text-muted-foreground ml-1">/{policy.premiumFrequency}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground">
                          {format(new Date(policy.expiryDate), 'dd MMM yyyy')}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(policy.policyStatus)}`}>
                            {policy.policyStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {policy.policyStatus === 'ACTIVE' ? (
                            <span className={`font-medium ${daysUntilExpiry <= 7 ? 'text-destructive' :
                              daysUntilExpiry <= 30 ? 'text-warning' :
                                'text-success'
                              }`}>
                              {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleDeleteClick(policy)}
                            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 
                              transition-all duration-200"
                            title="Delete policy"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border bg-secondary/10 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, filteredPolicies.length)}</span> of <span className="font-medium text-foreground">{filteredPolicies.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <FaChevronDown className="rotate-90" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (
                        totalPages <= 7 ||
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all border
                              ${currentPage === page 
                                ? 'bg-primary border-primary text-white shadow-glow' 
                                : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        (page === 2 && currentPage > 4) ||
                        (page === totalPages - 1 && currentPage < totalPages - 3)
                      ) {
                        return <span key={page} className="px-1 text-muted-foreground">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <FaChevronDown className="-rotate-90" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && policyToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={handleDeleteCancel}
          >
            <div
              className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Delete Policy</h2>
                <button
                  onClick={handleDeleteCancel}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground
                    hover:bg-secondary hover:text-foreground transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10">
                  <FaTrash className="text-2xl text-destructive" />
                  <div>
                    <p className="font-semibold text-foreground">Are you sure?</p>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Policy Number:</strong> {policyToDelete.policyNumber}</p>
                  <p><strong>Client:</strong> {policyToDelete.clientFullName}</p>
                  <p><strong>Type:</strong> {policyToDelete.policyType}</p>
                  <p><strong>Premium:</strong> ₹{policyToDelete.premium}</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleDeleteCancel}
                      disabled={deleteMutation.isPending}
                      className="px-4 py-2 rounded-lg bg-secondary text-foreground font-medium
                        hover:bg-secondary/80 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={deleteMutation.isPending}
                      className="px-4 py-2 rounded-lg bg-destructive text-white font-medium
                        hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete Policy'}
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Policy Modal with ChatGPT AI Upload */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={handleCloseModal}
          >
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Add New Policy</h2>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground
                    hover:bg-secondary hover:text-foreground transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* PDF Upload Section — disabled
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 bg-gradient-to-br from-primary/5 to-purple/5">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Upload Policy PDF (Phase 1)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a PDF policy document manually.
                    </p>
                  </div>
                </div>
                */}

                {/* Client Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                    Client Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Client Full Name *</label>
                      <input
                        type="text"
                        name="clientFullName"
                        value={formData.clientFullName}
                        onChange={handleInputChange}
                        placeholder="Enter client full name"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground placeholder:text-muted-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Client Email *</label>
                      <input
                        type="email"
                        name="clientEmail"
                        value={formData.clientEmail}
                        onChange={handleInputChange}
                        placeholder="client@example.com"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground placeholder:text-muted-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Client Phone Number (SMS) *</label>
                      <input
                        type="tel"
                        name="clientPhoneNumber"
                        value={formData.clientPhoneNumber}
                        onChange={handleInputChange}
                        placeholder="+919876543210"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground placeholder:text-muted-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">WhatsApp Number</label>
                      <input
                        type="tel"
                        name="clientWhatsappNumber"
                        value={formData.clientWhatsappNumber}
                        onChange={handleInputChange}
                        placeholder="+919876543210"
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground placeholder:text-muted-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Client Address</label>
                      <input
                        type="text"
                        name="clientAddress"
                        value={formData.clientAddress}
                        onChange={handleInputChange}
                        placeholder="Full address (optional)"
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground placeholder:text-muted-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Policy Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                    Policy Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Policy Number *</label>
                      <input
                        type="text"
                        name="policyNumber"
                        value={formData.policyNumber}
                        onChange={handleInputChange}
                        placeholder="e.g., POL-2024-001"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground placeholder:text-muted-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Policy Type *</label>
                      <select
                        name="policyType"
                        value={formData.policyType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="VEHICLE">Vehicle Insurance</option>
                        <option value="LIFE">Life Insurance</option>
                        <option value="HEALTH">Health Insurance</option>
                        <option value="HOME">Home Insurance</option>
                        <option value="TRAVEL">Travel Insurance</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Vehicle Type</label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {VEHICLE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Registration Number</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. TN01AB1234"
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Insurance Company</label>
                      <input
                        type="text"
                        name="insurerName"
                        value={formData.insurerName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Start Date *</label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Expiry Date *</label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Premium Amount *</label>
                      <input
                        type="number"
                        name="premium"
                        value={formData.premium}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-input border border-border
                          text-foreground placeholder:text-muted-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                  </div>

                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium text-foreground">Policy Description</label>
                    <textarea
                      name="policyDescription"
                      value={formData.policyDescription}
                      onChange={handleInputChange}
                      placeholder="Additional policy details (optional)"
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-input border border-border
                        text-foreground placeholder:text-muted-foreground resize-none
                        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-lg bg-secondary text-foreground font-medium
                      hover:bg-secondary/80 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-white font-medium
                      hover:opacity-90 transition-all shadow-glow disabled:opacity-50"
                  >
                    <FaFileContract /> {createMutation.isPending ? 'Saving...' : 'Create Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Policies;