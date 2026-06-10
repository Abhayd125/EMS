import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      setSuccess(data.message);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="glass-panel animate-slide" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          <ShieldCheck size={48} color="#ef4444" />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your new security credentials</p>
        </div>

        {/* Success */}
        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            lineHeight: '1.4'
          }}>
            <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Success!</p>
              <p style={{ color: '#a7f3d0' }}>{success}</p>
              <div style={{ marginTop: '0.75rem' }}>
                <Link to="/login" className="badge badge-success" style={{ textDecoration: 'none' }}>Log In Now</Link>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
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

        {!success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* New Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', height: '46px' }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
