import React, { useState } from 'react';
import Layout from '../components/Layout';
import { messagesAPI, policyAPI } from '../services/api';
import { toast } from 'react-toastify';
import { showToast } from '../lib/toast';
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
        showToast.success('Delivery Success', `Message resent successfully on attempt ${updatedLog.retryCount}.`);
      } else {
        showToast.warning('System Alert', `Retry attempt ${updatedLog.retryCount} failed. ${updatedLog.retryCount >= 3 ? 'Maximum retry threshold reached.' : 'Re-attempting delivery...'}`);
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Failed to retry message';
      toast.error(errorMsg);
    },
    onSettled: () => setRetryingId(null)
  });

  const manualRenewalMutation = useMutation({
    mutationFn: ({ policyId, notes, renewed }: { policyId: number, notes: string, renewed: boolean }) => 
      policyAPI.markAsManuallyRenewed(policyId, notes, renewed),
    onSuccess: (_, variables) => {
      if (variables.renewed) {
        showToast.success('Update Successful', 'Policy has been marked as manually renewed.');
      } else {
        showToast.info('Policy Removed', 'Policy has been deleted as client was not renewed.');
      }
      setShowManualModal(false);
      setManualTarget(null);
      setManualNotes('');
      queryClient.invalidateQueries({ queryKey: ['messageLogs'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Action failed';
      showToast.error('System Error', errorMsg);
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

  const handleManualAction = (renewed: boolean) => {
    if (!manualTarget || !manualNotes.trim()) {
      if (!manualNotes.trim()) showToast.warning('Incomplete Action', 'Please provide notes before submitting.');
      return;
    }
    setSubmittingManual(true);
    manualRenewalMutation.mutate({ 
      policyId: manualTarget.policyId, 
      notes: manualNotes.trim(),
      renewed
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

  const getStatusBadge = (status: string, retryCount: number) => {
    if (status === 'FAILED' && retryCount > 0 && retryCount < 3) {
      return (
        <div className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Retrying</span>
        </div>
      );
    }

    switch (status) {
      case 'SENT':
        return (
          <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Sent</span>
          </div>
        );
      case 'PENDING':
        return (
          <div className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Pending</span>
          </div>
        );
      case 'FAILED':
      default:
        return (
          <div className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">{retryCount >= 3 ? 'Failed (Max)' : 'Failed'}</span>
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
        return "bg-secondary border border-border/30";
      } else if (retryCount === 0) {
        if (status === 'SENT') return "bg-emerald-500/60";
        return "bg-secondary border border-border/30";
      }
      
      switch (status) {
        case "SENT":
          return "bg-emerald-500/60";
        case "PENDING":
          return "bg-amber-500/50";
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 animate-pulse">
            <FaExclamationTriangle className="text-4xl text-amber-500" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
        </div>
        
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">Logs Under Maintenance</h1>
          <p className="text-muted-foreground text-sm font-medium">
            We are currently optimizing the delivery tracking system for better WhatsApp integration. Message history and retry actions will be back online shortly.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <div className="px-4 py-2 rounded-full bg-secondary border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Expected Resolution: 2 Hours
          </div>
          <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
            System Status: Active
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MessageLogs;

