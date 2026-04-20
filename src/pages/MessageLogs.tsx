import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { messagesAPI, policyAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  FaCheckCircle, FaExclamationCircle, FaClock, FaWhatsapp, FaSms,
  FaRedo, FaPhoneAlt, FaTimes, FaInfoCircle, FaExclamationTriangle
} from 'react-icons/fa';

interface MessageLog {
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
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Manual renewal modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTarget, setManualTarget] = useState<MessageLog | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Detail panel state
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await messagesAPI.getAllLogs();
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load message logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== RETRY LOGIC =====
  const handleRetry = async (logId: number) => {
    setRetryingId(logId);
    try {
      const response = await messagesAPI.retryMessage(logId);
      const updatedLog = response.data;

      // Update the log in state
      setLogs(prev =>
        prev.map(log => (log.id === logId ? updatedLog : log))
      );

      if (updatedLog.status === 'SENT') {
        toast.success(`✅ Message resent successfully! (Attempt ${updatedLog.retryCount})`);
      } else {
        toast.warning(`⚠️ Retry attempt ${updatedLog.retryCount} failed. ${updatedLog.retryCount >= 3 ? 'Max retries exhausted.' : 'Try again.'}`);
      }

      // Update selected log if it's the same one
      if (selectedLog?.id === logId) {
        setSelectedLog(updatedLog);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to retry message';
      toast.error(errorMsg);
    } finally {
      setRetryingId(null);
    }
  };

  // ===== MANUAL RENEWAL LOGIC =====
  const openManualModal = (log: MessageLog) => {
    setManualTarget(log);
    setManualNotes('');
    setShowManualModal(true);
  };

  const handleManualRenewal = async () => {
    if (!manualTarget) return;

    if (!manualNotes.trim()) {
      toast.error('Please add notes about the manual contact');
      return;
    }

    setSubmittingManual(true);
    try {
      await policyAPI.markAsManuallyRenewed(manualTarget.policyId, manualNotes.trim());
      toast.success(`✅ Policy ${manualTarget.policyNumber} marked as MANUAL_RENEWED`);
      setShowManualModal(false);
      setManualTarget(null);
      setManualNotes('');
      // Refresh logs to get updated state
      fetchLogs();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to mark policy as manually renewed';
      toast.error(errorMsg);
    } finally {
      setSubmittingManual(false);
    }
  };

  // ===== STATUS BADGES =====
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-full font-medium">
            <FaCheckCircle /> Sent
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-red-500/15 text-red-400 rounded-full font-medium">
            <FaExclamationCircle /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-500/15 text-amber-400 rounded-full font-medium">
            <FaClock /> Pending
          </span>
        );
    }
  };

  const getChannelBadge = (channel: string) => {
    return channel === 'WHATSAPP' ? (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
        <FaWhatsapp className="text-sm" /> WhatsApp
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
        <FaSms className="text-sm" /> SMS
      </span>
    );
  };

  const getRetryBadge = (log: MessageLog) => {
    if (log.retryCount === 0) return null;
    const color = log.retryCount >= 3 ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
        {log.retryCount}/3 retries
      </span>
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

        {/* Message Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="p-4">Date Sent</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Message</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Retries</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      {statusFilter === 'ALL' 
                        ? 'No messages have been sent yet.' 
                        : `No ${statusFilter.toLowerCase().replace('_', ' ')} messages.`}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-secondary/20 transition-colors cursor-pointer
                        ${log.status === 'FAILED' && log.maxRetriesExhausted ? 'bg-red-500/5' : ''}
                        ${selectedLog?.id === log.id ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    >
                      <td className="p-4 whitespace-nowrap text-foreground font-medium">
                        {new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{log.clientName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">Pol: {log.policyNumber || 'N/A'}</div>
                      </td>
                      <td className="p-4">{getChannelBadge(log.channel)}</td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{log.recipientPhone}</td>
                      <td className="p-4 max-w-[200px]">
                        <p className="text-xs text-muted-foreground line-clamp-2" title={log.messageContent}>
                          {log.messageContent}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(log.status)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {getRetryBadge(log)}
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          {/* RETRY BUTTON: shown when status=FAILED and retryCount < 3 */}
                          {log.canRetry && (
                            <button
                              onClick={() => handleRetry(log.id)}
                              disabled={retryingId === log.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20
                                hover:border-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={`Retry sending (attempt ${log.retryCount + 1}/3)`}
                            >
                              <FaRedo className={`text-[10px] ${retryingId === log.id ? 'animate-spin' : ''}`} />
                              {retryingId === log.id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}

                          {/* MARK MANUAL BUTTON: shown when retryCount >= 3 */}
                          {log.maxRetriesExhausted && log.status === 'FAILED' && (
                            <button
                              onClick={() => openManualModal(log)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20
                                hover:border-orange-500/40 transition-all duration-200"
                              title="Call customer and mark as manually renewed"
                            >
                              <FaPhoneAlt className="text-[10px]" />
                              Mark Manual
                            </button>
                          )}

                          {/* INFO BUTTON: always shown */}
                          <button
                            onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                              hover:bg-secondary transition-all duration-200"
                            title="View details"
                          >
                            <FaInfoCircle className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel - shown when a log is selected */}
        {selectedLog && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Message Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Client</label>
                <p className="text-foreground font-medium">{selectedLog.clientName || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Policy Number</label>
                <p className="text-foreground font-mono">{selectedLog.policyNumber || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Channel</label>
                <div>{getChannelBadge(selectedLog.channel)}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</label>
                <div>{getStatusBadge(selectedLog.status)}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Retry Count</label>
                <p className="text-foreground">{selectedLog.retryCount} / 3</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last Attempt</label>
                <p className="text-foreground">
                  {selectedLog.lastAttemptAt
                    ? new Date(selectedLog.lastAttemptAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {selectedLog.failureReason && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">Failure Reason</p>
                <p className="text-sm text-red-300">{selectedLog.failureReason}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Full Message</label>
              <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">{selectedLog.messageContent}</p>
            </div>

            {/* Action buttons in detail panel */}
            <div className="flex gap-3 pt-2">
              {selectedLog.canRetry && (
                <button
                  onClick={() => handleRetry(selectedLog.id)}
                  disabled={retryingId === selectedLog.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                    bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20
                    hover:border-blue-500/40 transition-all duration-200 disabled:opacity-50"
                >
                  <FaRedo className={retryingId === selectedLog.id ? 'animate-spin' : ''} />
                  {retryingId === selectedLog.id ? 'Retrying...' : `Retry (Attempt ${selectedLog.retryCount + 1}/3)`}
                </button>
              )}

              {selectedLog.maxRetriesExhausted && selectedLog.status === 'FAILED' && (
                <button
                  onClick={() => openManualModal(selectedLog)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                    bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20
                    hover:border-orange-500/40 transition-all duration-200"
                >
                  <FaPhoneAlt />
                  Mark as Contacted Manually
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== MANUAL RENEWAL MODAL ===== */}
      {showManualModal && manualTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Client</label>
                  <p className="text-foreground font-medium">{manualTarget.clientName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Phone</label>
                  <p className="text-foreground font-mono">{manualTarget.recipientPhone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Policy</label>
                  <p className="text-foreground font-mono">{manualTarget.policyNumber}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Channel</label>
                  <div>{getChannelBadge(manualTarget.channel)}</div>
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
