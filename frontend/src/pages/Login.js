import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError, clearSuccessMessage } from '../redux/slices/authSlice';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Building, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, successMessage, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/');
    }
    // Clean states on mount
    dispatch(clearError());
    dispatch(clearSuccessMessage());
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="login-split-container">
      {/* Left Panel: Company Info & Attendance Terms */}
      <div className="login-info-panel">
        <div className="login-info-content">
          {/* Top: Logo & Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                padding: '0.6rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
              }}>
                <Building size={28} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.05em', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  OURA
                </h1>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.1em' }}>ENTERPRISE PORTAL</span>
              </div>
            </div>
            
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2.5rem', lineHeight: '1.3', color: '#fff' }}>
              Employee Management & Operational Alignment System
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '520px' }}>
              Welcome to the Oura unified operations workspace. Our integrated portal serves as the primary system of record for attendance tracking, leaves workflow approvals, payroll computations, and asset allocation clearances.
            </p>
          </div>

          {/* Middle: Attendance Protocol (Terms & Conditions) */}
          <div className="attendance-rule-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
              <Clock size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)', textTransform: 'uppercase' }}>
                Attendance Registry Protocol
              </h3>
            </div>
            
            <div className="rule-item">
              <div className="rule-number">1</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                <strong>Mandatory Check-In:</strong> Once logged into your credentials, navigate directly to the dashboard and perform your daily <strong>Check-In</strong> to record the start of your work shift.
              </p>
            </div>

            <div className="rule-item">
              <div className="rule-number">2</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                <strong>Mandatory Check-Out:</strong> Upon completing your duty hours or leaving the office premises, you must perform your daily <strong>Check-Out</strong> to ensure accurate salary and overtime logging.
              </p>
            </div>

            <div className="rule-item">
              <div className="rule-number">3</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                <strong>Audit Compliance:</strong> Login sessions are audited under secure corporate protocols. Sharing passwords or logging in on behalf of other colleagues is strictly prohibited.
              </p>
            </div>
          </div>

          {/* Bottom: Footer */}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>&copy; {new Date().getFullYear()} OURA Inc. All rights reserved.</span>
            <span>Security Level: Tier-1 Access</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="login-form-panel">
        <div className="glass-panel animate-slide" style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Form Header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem'
          }}>
            <ShieldCheck size={40} color="var(--primary)" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Account Login</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Enter system clearance credentials</p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.75rem', height: '44px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.75rem', paddingRight: '2.75rem', height: '44px' }}
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

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.75rem', height: '46px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
