import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaveBalance, fetchMyLeaves, applyForLeave, resetLeaveStatus } from '../redux/slices/leaveSlice';
import { 
  FileCheck, 
  PlusCircle, 
  Clock, 
  Calendar, 
  AlertCircle,
  FileText,
  X,
  History,
  CheckCircle2,
  XCircle,
  TrendingRight
} from 'lucide-react';

const Leaves = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const { balance, history, loading, error, success } = useSelector((state) => state.leaves);
  const { user } = useSelector((state) => state.auth);

  // Modal / Form States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState([]);
  
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    dispatch(fetchLeaveBalance());
    dispatch(fetchMyLeaves());
    dispatch(resetLeaveStatus());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setLeaveType('CASUAL');
      setStartDate('');
      setEndDate('');
      setReason('');
      setShowApplyModal(false);
      dispatch(resetLeaveStatus());
      dispatch(fetchLeaveBalance());
      dispatch(fetchMyLeaves());
    }
  }, [success, dispatch]);

  const handleOpenLogs = (logs) => {
    setSelectedLogs(logs || []);
    setShowLogsModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    dispatch(applyForLeave({
      leaveType,
      startDate,
      endDate,
      reason
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_MANAGER':
        return <span className="badge badge-primary" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>Pending Manager</span>;
      case 'PENDING_HR':
        return <span className="badge badge-primary" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>Pending HR</span>;
      case 'APPROVED':
        return <span className="badge badge-success">Approved</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Leave Administration</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Request time-off and track your approval progress timelines.
          </p>
        </div>
        
        <button onClick={() => setShowApplyModal(true)} className="btn btn-primary">
          <PlusCircle size={18} /> Apply for Leave
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#f87171',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Leave Balance Cards */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        {/* Sick Balance */}
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sick Leaves Left</span>
          <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem', color: '#f87171' }}>
            {balance?.sick !== undefined ? balance.sick : '--'} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ 12 days</span>
          </h3>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', marginTop: '0.75rem' }}>
            <div style={{ width: `${(balance?.sick / 12) * 100}%`, height: '100%', background: '#ef4444', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Casual Balance */}
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Casual Leaves Left</span>
          <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem', color: '#f59e0b' }}>
            {balance?.casual !== undefined ? balance.casual : '--'} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ 15 days</span>
          </h3>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', marginTop: '0.75rem' }}>
            <div style={{ width: `${(balance?.casual / 15) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }} />
          </div>
        </div>

        {/* Paid Balance */}
        <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid Leaves Left</span>
          <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem', color: '#10b981' }}>
            {balance?.paid !== undefined ? balance.paid : '--'} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ 20 days</span>
          </h3>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', marginTop: '0.75rem' }}>
            <div style={{ width: `${(balance?.paid / 20) * 100}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} />
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="glass-panel animate-slide" style={{ padding: '2rem' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} color="var(--primary)" /> Leave Request History
        </h4>

        {history.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Review Details</th>
                  <th>Timeline</th>
                </tr>
              </thead>
              <tbody>
                {history.map((leave) => {
                  const start = new Date(leave.startDate);
                  const end = new Date(leave.endDate);
                  const diffTime = Math.abs(end - start);
                  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <tr key={leave.id}>
                      <td>
                        <span className="badge badge-primary">{leave.leaveType}</span>
                      </td>
                      <td>{start.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td>{end.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td style={{ fontWeight: 600 }}>{days} {days === 1 ? 'day' : 'days'}</td>
                      <td>{getStatusBadge(leave.status)}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {leave.status === 'REJECTED' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', color: '#f87171' }}>
                            {leave.managerComment && <span><strong>Manager:</strong> {leave.managerComment}</span>}
                            {leave.hrComment && <span><strong>HR:</strong> {leave.hrComment}</span>}
                          </div>
                        )}
                        {leave.status === 'APPROVED' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', color: '#34d399' }}>
                            {leave.hrComment ? <span><strong>HR approved:</strong> {leave.hrComment}</span> : <span>Approved by HR</span>}
                          </div>
                        )}
                        {leave.status === 'PENDING_HR' && (
                          <span style={{ color: '#a5b4fc' }}>Manager approved: "{leave.managerComment}"</span>
                        )}
                        {leave.status === 'PENDING_MANAGER' && (
                          <span style={{ color: 'var(--text-muted)' }}>Waiting for manager review...</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleOpenLogs(leave.auditLogs)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border)',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
            No leave requests applied yet. Click "Apply for Leave" above.
          </p>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="glass-panel animate-slide" style={{ width: '100%', maxWidth: '500px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Apply for Leave</h3>
              <button onClick={() => setShowApplyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Type */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Leave Type</label>
                <select className="form-select" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ width: '100%' }}>
                  <option value="CASUAL">Casual Leave (Balance: {balance?.casual || 0})</option>
                  <option value="SICK">Sick Leave (Balance: {balance?.sick || 0})</option>
                  <option value="PAID">Paid Leave (Balance: {balance?.paid || 0})</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ width: '100%' }} />
                </div>
              </div>

              {/* Reason */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Reason for Request</label>
                <textarea className="form-input" placeholder="Please explain..." value={reason} onChange={(e) => setReason(e.target.value)} required style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
                  {loading ? 'Submitting...' : 'Apply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Timeline Modal */}
      {showLogsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="glass-panel animate-slide" style={{ width: '100%', maxWidth: '480px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="var(--primary)" /> Approval Timeline Logs
              </h3>
              <button onClick={() => setShowLogsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Timeline element */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              paddingLeft: '1.5rem',
              borderLeft: '2px dashed var(--border)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {selectedLogs.length > 0 ? (
                selectedLogs.map((log) => (
                  <div key={log.id} style={{ position: 'relative' }}>
                    {/* Circle bullet */}
                    <div style={{
                      position: 'absolute',
                      left: '-31px',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: log.action === 'REJECTED' ? 'var(--error)' : (log.action.includes('APPROVED') ? 'var(--success)' : 'var(--primary)'),
                      border: '2px solid var(--bg-secondary)'
                    }} />
                    
                    {/* Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{log.action}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        By <strong>{log.actorName}</strong>
                      </span>
                      {log.comment && (
                        <p style={{
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid var(--border)',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.25rem',
                          fontStyle: 'italic'
                        }}>
                          "{log.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No timeline logged.</p>
              )}
            </div>

            <button className="btn btn-secondary" onClick={() => setShowLogsModal(false)} style={{ width: '100%', marginTop: '1.75rem' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
