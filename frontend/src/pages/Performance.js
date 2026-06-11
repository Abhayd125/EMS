import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPerformances, createPerformance, clearPerformanceStatus } from '../redux/slices/performanceSlice';
import { fetchEmployees } from '../redux/slices/employeeSlice';
import { 
  Award, 
  User, 
  Calendar, 
  MessageSquare, 
  BarChart2, 
  Star,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const Performance = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { list: reviews, loading, error, success } = useSelector((state) => state.performance);
  const { list: employees } = useSelector((state) => state.employees);

  // Form States
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [qualityRating, setQualityRating] = useState('5');
  const [productivity, setProductivity] = useState('5');
  const [communication, setCommunication] = useState('5');
  const [comments, setComments] = useState('');
  const [validationError, setValidationError] = useState('');

  const isAdminOrHR = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  useEffect(() => {
    if (isAdminOrHR) {
      dispatch(fetchEmployees());
      dispatch(fetchPerformances());
    } else if (currentUser?.employeeId) {
      dispatch(fetchPerformances(currentUser.employeeId));
    }
  }, [dispatch, isAdminOrHR, currentUser]);

  useEffect(() => {
    if (success) {
      setSelectedEmpId('');
      setQualityRating('5');
      setProductivity('5');
      setCommunication('5');
      setComments('');
      dispatch(fetchPerformances(isAdminOrHR ? null : currentUser.employeeId));
      const timer = setTimeout(() => dispatch(clearPerformanceStatus()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch, isAdminOrHR, currentUser]);

  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedEmpId && isAdminOrHR) {
      setValidationError('Please select an employee');
      return;
    }

    const payload = {
      qualityRating: parseFloat(qualityRating),
      productivity: parseFloat(productivity),
      communication: parseFloat(communication),
      comments
    };

    const targetEmpId = isAdminOrHR ? selectedEmpId : currentUser.employeeId;

    dispatch(createPerformance({ employeeId: targetEmpId, performanceData: payload }));
  };

  const calculateOverall = () => {
    const q = parseFloat(qualityRating || 0);
    const p = parseFloat(productivity || 0);
    const c = parseFloat(communication || 0);
    return ((q + p + c) / 3).toFixed(2);
  };

  const renderStars = (rating) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={16} 
          fill={i <= floor ? '#eab308' : 'none'} 
          color={i <= floor ? '#eab308' : 'var(--text-muted)'} 
          style={{ marginRight: '2px' }}
        />
      );
    }
    return stars;
  };

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Performance & QA Hub</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {isAdminOrHR 
            ? 'Conduct quality analysis reviews, rate productivity/communication, and provide formal feedback.'
            : 'Track your quality audit rating trends, key corporate metrics, and manager feedback.'}
        </p>
      </div>

      {/* Status Alerts */}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(16, 185, 129, 0.12)', color: '#34d399',
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle size={18} />
          <span>Performance review logged successfully!</span>
        </div>
      )}

      {(validationError || error) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <AlertCircle size={18} />
          <span>{validationError || error}</span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isAdminOrHR ? '1fr 1.5fr' : '1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Admin review posting form */}
        {isAdminOrHR && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="var(--primary)" /> Log Quality Audit
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Employee */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Employee</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <select
                    className="form-select"
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quality Rating */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label className="form-label">Quality Analysis rating</label>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{qualityRating} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  className="form-range"
                  value={qualityRating}
                  onChange={(e) => setQualityRating(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Productivity Rating */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label className="form-label">Productivity Rating</label>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{productivity} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  className="form-range"
                  value={productivity}
                  onChange={(e) => setProductivity(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Communication Rating */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label className="form-label">Corporate Communication</label>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{communication} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  className="form-range"
                  value={communication}
                  onChange={(e) => setCommunication(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Comments */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Performance Comments</label>
                <textarea
                  className="form-input"
                  placeholder="Provide structured feedback..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              {/* Preview */}
              <div className="glass-panel" style={{
                padding: '1rem', background: 'rgba(255,255,255,0.01)',
                border: '1px dashed var(--border)', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calculated Overall Score:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Star size={18} fill="#eab308" color="#eab308" /> {calculateOverall()}
                </span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px', marginTop: '0.5rem' }} disabled={loading}>
                <TrendingUp size={16} /> Log Review Score
              </button>
            </form>
          </div>
        )}

        {/* Right Column: Performance history list */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} color="var(--primary)" /> {isAdminOrHR ? 'Employee Quality Audits List' : 'My Performance Scorecards'}
          </h3>

          {loading && reviews.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading scorecards...</p>
          ) : reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {reviews.map((rev) => (
                <div key={rev.id} className="glass-panel" style={{
                  padding: '1.5rem', background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)', display: 'flex',
                  flexDirection: 'column', gap: '1rem'
                }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={12} />
                        {new Date(rev.evaluationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {isAdminOrHR && rev.employee && (
                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{rev.employee.name}</strong>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {renderStars(rev.overallRating)}
                      <span style={{ fontWeight: 800, color: '#eab308', marginLeft: '0.25rem', fontSize: '0.95rem' }}>
                        ({rev.overallRating})
                      </span>
                    </div>
                  </div>

                  {/* Ratings grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '1rem', background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '4px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Quality Analysis</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{rev.qualityRating} / 5.0</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Productivity</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{rev.productivity} / 5.0</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Communication</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{rev.communication} / 5.0</strong>
                    </div>
                  </div>

                  {/* Feedback comments */}
                  {rev.comments && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <MessageSquare size={14} color="var(--primary)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                      <p style={{ fontStyle: 'italic', margin: 0 }}>"{rev.comments}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Award size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No performance reviews logged yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;
