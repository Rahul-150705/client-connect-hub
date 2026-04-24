import React, { useState } from 'react';
import Layout from '../components/Layout';
import { messagesAPI, policyAPI } from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { X, RotateCcw } from 'lucide-react';
import {
  FaCheckCircle, FaExclamationCircle, FaClock, FaWhatsapp, FaSms,
  FaPhoneAlt, FaTimes, FaExclamationTriangle
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MessageLog {
// ... existing interface
  id: number;
  customerId: number;
  policyId: number;
  clientName: string;
  policyNumber: string;
  reminderType: string;
  recipientPhone: string;
  messageContent: string;
  status: string;
  channel: string;
  sentAt: string;
  retryCount: number;
  lastAttemptAt: string | null;
  failureReason: string | null;
  canRetry: boolean;
  maxRetriesExhausted: boolean;
}

const MessageLogs: React.FC = () => {
  const queryClient = useQueryClient();
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [hoveredLog, setHoveredLog] = useState<number | null>(null);
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);

  // Queries
  const logsQuery = useQuery({
    queryKey: ['messageLogs'],
    queryFn: () => messagesAPI.getAllLogs().then(res => res.data),
  });

  const logs = logsQuery.data || [];
  const loading = logsQuery.isLoading;

  // Manual renewal modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTarget, setManualTarget] = useState<MessageLog | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();

  // Mutations for Retry and Manual Renewal
  const retryMutation = useMutation({
    mutationFn: (logId: number) => messagesAPI.retryMessage(logId),
    onSuccess: (response) => {
      const updatedLog = response.data;
      queryClient.setQueryData(['messageLogs'], (old: any) => 
        old?.map((log: any) => log.id === updatedLog.id ? updatedLog : log)
      );
      
      if (updatedLog.status === 'SENT') {
        toast.success(`✅ Message resent successfully! (Attempt ${updatedLog.retryCount})`);
      } else {
        toast.warning(`⚠️ Retry attempt ${updatedLog.retryCount} failed. ${updatedLog.retryCount >= 3 ? 'Max retries exhausted.' : 'Try again.'}`);
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Failed to retry message';
      toast.error(errorMsg);
    },
    onSettled: () => setRetryingId(null)
  });

  const manualRenewalMutation = useMutation({
    mutationFn: ({ policyId, notes }: { policyId: number, notes: string }) => 
      policyAPI.markAsManuallyRenewed(policyId, notes),
    onSuccess: () => {
      toast.success('✅ Policy marked as MANUAL_RENEWED');
      setShowManualModal(false);
      setManualTarget(null);
      setManualNotes('');
      queryClient.invalidateQueries({ queryKey: ['messageLogs'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Failed to mark policy as manually renewed';
      toast.error(errorMsg);
    },
    onSettled: () => setSubmittingManual(false)
  });

  const handleRetry = (logId: number) => {
    setRetryingId(logId);
    retryMutation.mutate(logId);
  };

  const openManualModal = (log: MessageLog) => {
    setManualTarget(log);
    setManualNotes('');
    setShowManualModal(true);
  };

  const handleManualRenewal = () => {
    if (!manualTarget || !manualNotes.trim()) {
      if (!manualNotes.trim()) toast.error('Please add notes');
      return;
    }
    setSubmittingManual(true);
    manualRenewalMutation.mutate({ 
      policyId: manualTarget.policyId, 
      notes: manualNotes.trim() 
    });
  };

  // ===== DESIGN HELPERS =====
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "WHATSAPP":
        return (
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center p-1.5 border border-border/30">
            <FaWhatsapp className="text-white text-lg" />
          </div>
        );
      case "SMS":
      default:
        return (
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-1.5 border border-border/30">
            <FaSms className="text-white text-lg" />
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <span className="text-green-400 text-sm font-medium">Sent</span>
          </div>
        );
      case 'PENDING':
        return (
          <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
            <span className="text-yellow-400 text-sm font-medium">Pending</span>
          </div>
        );
      case 'FAILED':
      default:
        return (
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="text-red-400 text-sm font-medium">Failed</span>
          </div>
        );
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'SENT':
        return "from-green-500/10 to-transparent";
      case 'PENDING': 
        return "from-yellow-500/10 to-transparent";
      case 'FAILED':
      default:
        return "from-red-500/10 to-transparent";
    }
  };

  const getRetryBars = (retryCount: number, status: string) => {
    const totalRetries = 3;
    const maxBars = 10;
    const filledBars = Math.round((retryCount / totalRetries) * maxBars);
    
    const getBarColor = (index: number) => {
      if (index >= filledBars && retryCount > 0) {
        return "bg-muted/40 border border-border/30";
      } else if (retryCount === 0) {
        // If 0 retries, show it as an empty bar unless it's just successfully sent on first try
        if (status === 'SENT') return "bg-green-500/60";
        return "bg-muted/40 border border-border/30";
      }
      
      switch (status) {
        case "SENT":
          return "bg-green-500/60";
        case "PENDING":
          return "bg-yellow-500/50";
        case "FAILED":
        default:
          return "bg-red-500/60";
      }
    };
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: maxBars }).map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-5 rounded-full transition-all duration-500 ${getBarColor(index)}`}
            />
          ))}
        </div>
        <span className="text-sm font-mono text-foreground font-medium min-w-[3rem]">
          {retryCount}/3
        </span>
      </div>
    );
  };

  // ===== FILTERING =====
  const filteredLogs = logs.filter(log => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'NEEDS_ACTION') return log.status === 'FAILED';
    return log.status === statusFilter;
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'SENT').length,
    failed: logs.filter(l => l.status === 'FAILED').length,
    pending: logs.filter(l => l.status === 'PENDING').length,
    needsAction: logs.filter(l => l.status === 'FAILED').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Message Logs</h1>
          <p className="text-muted-foreground mt-1">Track all WhatsApp and SMS renewal reminders · Retry failed messages · Mark manual renewals</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`bg-card rounded-xl border p-3 flex items-center gap-3 transition-all text-left
              ${statusFilter === 'ALL' ? 'border-primary shadow-glow' : 'border-border hover:border-primary/50'}`}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FaSms className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('SENT')}
            className={`bg-card rounded-xl border p-3 flex items-center gap-3 transition-all text-left
              ${statusFilter === 'SENT' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-border hover:border-emerald-500/50'}`}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FaCheckCircle className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sent</p>
              <p className="text-lg font-bold text-foreground">{stats.sent}</p>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('FAILED')}
            className={`bg-card rounded-xl border p-3 flex items-center gap-3 transition-all text-left
              ${statusFilter === 'FAILED' ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-border hover:border-red-500/50'}`}
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FaExclamationCircle className="text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-bold text-foreground">{stats.failed}</p>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`bg-card rounded-xl border p-3 flex items-center gap-3 transition-all text-left
              ${statusFilter === 'PENDING' ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-border hover:border-amber-500/50'}`}
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FaClock className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-foreground">{stats.pending}</p>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('NEEDS_ACTION')}
            className={`bg-card rounded-xl border p-3 flex items-center gap-3 transition-all text-left
              ${statusFilter === 'NEEDS_ACTION' ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-border hover:border-orange-500/50'}`}
          >
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FaExclamationTriangle className="text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Needs Action</p>
              <p className="text-lg font-bold text-foreground">{stats.needsAction}</p>
            </div>
          </button>
        </div>

        {/* Animated Message Table */}
        <div className="relative border border-border/30 rounded-2xl p-6 bg-card min-h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-xl font-medium text-foreground">Message Activity</h2>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} logs
              </div>
            </div>
          </div>

          <motion.div
            className="space-y-2"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.1,
                }
              }
            }}
            initial="hidden"
            animate="visible"
          >
            {/* Headers */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">No</div>
              <div className="col-span-3">Client Details</div>
              <div className="col-span-2">Channel</div>
              <div className="col-span-2">Date Sent</div>
              <div className="col-span-2">Retries</div>
              <div className="col-span-2 text-right">Status / Action</div>
            </div>

            {/* Rows */}
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border/50">
                {statusFilter === 'ALL' 
                  ? 'No messages have been sent yet.' 
                  : `No ${statusFilter.toLowerCase().replace('_', ' ')} messages.`}
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  variants={{
                    hidden: { 
                      opacity: 0, 
                      x: -20,
                      scale: 0.98,
                      filter: "blur(2px)" 
                    },
                    visible: {
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      filter: "blur(0px)",
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      },
                    },
                  }}
                  className="relative cursor-pointer group"
                  onMouseEnter={() => setHoveredLog(log.id)}
                  onMouseLeave={() => setHoveredLog(null)}
                  onClick={() => setSelectedLog(log)}
                >
                  <motion.div
                    className="relative bg-muted/50 border border-border/50 rounded-xl p-4 overflow-hidden"
                    whileHover={{
                      y: -1,
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                  >
                    {/* Status gradient overlay */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-l ${getStatusGradient(log.status)} pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      style={{ 
                        backgroundSize: "30% 100%", 
                        backgroundPosition: "right",
                        backgroundRepeat: "no-repeat"
                      }} 
                    />
                    
                    {/* Grid Content */}
                    <div className="relative grid grid-cols-12 gap-4 items-center">
                      {/* Number */}
                      <div className="col-span-1">
                        <span className="text-xl font-bold text-muted-foreground/60">
                          {index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </span>
                      </div>

                      {/* Client Details */}
                      <div className="col-span-3 flex flex-col justify-center gap-0.5">
                        <span className="text-foreground font-medium truncate">
                          {log.clientName || 'Unknown'}
                        </span>
                        <span className="text-muted-foreground text-xs font-mono truncate">
                          Pol: {log.policyNumber || 'N/A'}
                        </span>
                      </div>

                      {/* Channel & Phone */}
                      <div className="col-span-2 flex items-center gap-3">
                        {getChannelIcon(log.channel)}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground text-sm font-medium">{log.channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}</span>
                          <span className="text-muted-foreground text-xs font-mono">{log.recipientPhone}</span>
                        </div>
                      </div>

                      {/* Date Sent */}
                      <div className="col-span-2">
                        <span className="text-foreground text-sm">
                          {new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      {/* Retries */}
                      <div className="col-span-2">
                        {getRetryBars(log.retryCount, log.status)}
                      </div>

                      {/* Status & Action */}
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        {getStatusBadge(log.status)}
                        {log.canRetry && (
                          <button
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors z-10 relative"
                            onClick={(e) => { e.stopPropagation(); handleRetry(log.id); }}
                            title="Retry Message"
                            disabled={retryingId === log.id}
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        {log.maxRetriesExhausted && log.status === 'FAILED' && (
                          <button
                            className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg transition-colors z-10 relative"
                            onClick={(e) => { e.stopPropagation(); openManualModal(log); }}
                            title="Mark Manual"
                          >
                            <FaPhoneAlt className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Overlay Panel inside Card */}
          <AnimatePresence>
            {selectedLog && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col rounded-2xl z-20 overflow-hidden border border-border/50 shadow-2xl"
              >
                {/* Header with Actions */}
                <div className="relative bg-gradient-to-r from-muted/80 to-transparent p-5 border-b border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-muted-foreground/30 px-2">
                      #{selectedLog.id}
                    </div>
                    {getChannelIcon(selectedLog.channel)}
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedLog.clientName || 'Unknown Client'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground font-mono bg-background/50 px-2 py-0.5 rounded">
                          {selectedLog.policyNumber || 'N/A'}
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {selectedLog.recipientPhone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons in Header */}
                  <div className="flex items-center gap-2">
                    {/* Retry */}
                    {selectedLog.canRetry && (
                      <motion.button
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        onClick={() => handleRetry(selectedLog.id)}
                        disabled={retryingId === selectedLog.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${retryingId === selectedLog.id ? 'animate-spin' : ''}`} />
                        {retryingId === selectedLog.id ? 'Retrying...' : 'Retry'}
                      </motion.button>
                    )}

                    {/* Mark Manual */}
                    {selectedLog.maxRetriesExhausted && selectedLog.status === 'FAILED' && (
                      <motion.button
                        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => openManualModal(selectedLog)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaPhoneAlt className="w-3.5 h-3.5" />
                        Mark Manual
                      </motion.button>
                    )}

                    {/* Close Button */}
                    <motion.button
                      className="w-10 h-10 bg-background hover:bg-muted rounded-full flex items-center justify-center border border-border/50 ml-2 shadow-sm"
                      onClick={() => setSelectedLog(null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date Sent */}
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date Sent
                      </label>
                      <div className="text-sm font-medium mt-1.5">
                        {new Date(selectedLog.sentAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Last Attempt */}
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Last Attempt
                      </label>
                      <div className="text-sm font-medium mt-1.5">
                        {selectedLog.lastAttemptAt ? new Date(selectedLog.lastAttemptAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Status
                      </label>
                      <div>
                        {getStatusBadge(selectedLog.status)}
                      </div>
                    </div>
                  </div>

                  {/* Retries & Reason */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                        Retry Progress
                      </label>
                      {getRetryBars(selectedLog.retryCount, selectedLog.status)}
                    </div>

                    {selectedLog.failureReason && (
                      <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
                        <label className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                          <FaExclamationTriangle /> Failure Reason
                        </label>
                        <div className="text-sm text-red-400/90 leading-relaxed">
                          {selectedLog.failureReason}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/30 flex-1 flex flex-col">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                      Message Content
                    </label>
                    <div className="font-mono text-sm leading-relaxed overflow-y-auto bg-background/50 p-4 rounded-lg border border-border/30 text-foreground/80">
                      {selectedLog.messageContent}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== MANUAL RENEWAL MODAL ===== */}
      {showManualModal && manualTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowManualModal(false)}
        >
          <div
            className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <FaPhoneAlt className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Mark as Contacted Manually</h2>
                  <p className="text-xs text-muted-foreground">All automated retries have been exhausted</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground
                  hover:bg-secondary hover:text-foreground transition-all"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Info Card */}
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-medium">
                  <FaExclamationTriangle />
                  <span>3/3 automated retries failed</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please call the customer directly and confirm the renewal, then record your notes below.
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-xl border border-border/30">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium uppercase">Client</label>
                  <p className="text-foreground font-medium">{manualTarget.clientName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium uppercase">Phone</label>
                  <p className="text-foreground font-mono">{manualTarget.recipientPhone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium uppercase">Policy</label>
                  <p className="text-foreground font-mono">{manualTarget.policyNumber}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium uppercase">Channel</label>
                  <div className="pt-1">{getChannelIcon(manualTarget.channel)}</div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contact Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="E.g., Called customer on 21/04/2026. Customer confirmed renewal via phone. Premium payment received."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border
                    text-foreground placeholder:text-muted-foreground resize-none
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  This will mark the policy as MANUAL_RENEWED. This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowManualModal(false)}
                  disabled={submittingManual}
                  className="px-4 py-2 rounded-lg bg-secondary text-foreground font-medium
                    hover:bg-secondary/80 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualRenewal}
                  disabled={submittingManual || !manualNotes.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium
                    bg-gradient-to-r from-orange-500 to-amber-500 text-white
                    hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg shadow-orange-500/20"
                >
                  <FaCheckCircle />
                  {submittingManual ? 'Saving...' : 'Confirm Manual Renewal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MessageLogs;

