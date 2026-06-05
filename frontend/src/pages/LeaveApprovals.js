import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPendingApprovals, submitManagerReview, submitHRReview, resetLeaveStatus } from '../redux/slices/leaveSlice';
import { 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  User,
  Calendar,
  Layers,
  X
} from 'lucide-react';

const LeaveApprovals = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const { approvals, loading, error, success } = useSelector((state) => state.leaves);
  const { user } = useSelector((state) => state.auth);

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // APPROVED or REJECTED
  const [comment, setComment] = useState('');

  useEffect(() => {
    dispatch(fetchPendingApprovals());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setComment('');
      setSelectedRequest(null);
      setShowReviewModal(false);
      dispatch(resetLeaveStatus());
      dispatch(fetchPendingApprovals());
    }
  }, [success, dispatch]);

  const handleOpenReview = (request, action) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const id = selectedRequest.id;
    const reviewData = {
      status: reviewAction,
      comment
    };

    if (user.role === 'MANAGER') {
      dispatch(submitManagerReview({ id, reviewData }));
    } else if (user.role === 'HR' || user.role === 'ADMIN') {
      dispatch(submitHRReview({ id, reviewData }));
    }
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e - s);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Approval Workflow</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Review pending employee leave requests for department manager or HR clearances.
        </p>
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

      {/* Pending list */}
      {loading && approvals.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-secondary)' }}>
          <p>Loading pending workflow tasks...</p>
        </div>
      ) : approvals.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {approvals.map((req) => {
            const days = calculateDays(req.startDate, req.endDate);
            const employeeName = req.employee?.name || 'Unknown';
            const deptName = req.employee?.department?.name || 'Unassigned';
            const balance = req.employee?.leaveBalance || { sick: 12, casual: 15, paid: 20 };
            
            // Determine active balance type
            const activeBalance = req.leaveType === 'SICK' ? balance.sick : (req.leaveType === 'CASUAL' ? balance.casual : balance.paid);

            return (
              <div key={req.id} className="glass-panel animate-slide" style={{
                padding: '2rem',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '2rem',
                alignItems: 'flex-start'
              }}>
                {/* Details Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 400px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff'
                    }}>
                      {employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{employeeName}</h3>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>{deptName}</span>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={16} color="var(--primary)" />
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#fff' }}>
                      <Clock size={16} color="var(--primary)" />
                      {days} {days === 1 ? 'Day' : 'Days'} ({req.leaveType})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Layers size={16} color="var(--primary)" />
                      Remaining: {activeBalance} days
                    </span>
                  </div>

                  {/* Reason box */}
                  <div style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Reason:</strong> "{req.reason}"
                  </div>

                  {/* Workflow state timeline */}
                  {req.auditLogs && req.auditLogs.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>Timeline:</strong> {req.auditLogs.map(log => `${log.action} by ${log.actorName}`).join(' ➔ ')}
                    </div>
                  )}
                </div>

                {/* Actions Column */}
                <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'center', flexShrink: 0 }}>
                  <button 
                    onClick={() => handleOpenReview(req, 'REJECTED')}
                    className="btn btn-secondary" 
                    style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)' }}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button 
                    onClick={() => handleOpenReview(req, 'APPROVED')}
                    className="btn btn-primary"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <p>No pending leave requests found for review.</p>
        </div>
      )}

      {/* Review Dialog overlay */}
      {showReviewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="glass-panel animate-slide" style={{ width: '100%', maxWidth: '480px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {reviewAction === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                You are about to {reviewAction.toLowerCase()} the request for <strong>{selectedRequest?.employee?.name}</strong>. Please write an optional review comment below.
              </p>

              {/* Comment text area */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Review Comment</label>
                <textarea 
                  className="form-input" 
                  placeholder={reviewAction === 'APPROVED' ? "Approved for project schedule..." : "Reason for rejection..."}
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`btn ${reviewAction === 'APPROVED' ? 'btn-primary' : 'btn-danger'}`}
                  disabled={loading} 
                  style={{ minWidth: '120px' }}
                >
                  {loading ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApprovals;
