import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { apiRequest } from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const doVerification = async () => {
      try {
        const data = await apiRequest(`/auth/verify-email/${token}`, {
          method: 'GET'
        });
        setSuccess(data.message);
      } catch (err) {
        setError(err.message || 'Verification link is invalid or has expired.');
      } finally {
        setVerifying(false);
      }
    };
    
    doVerification();
  }, [token]);

  return (
    <div className="auth-bg">
      <div className="glass-panel animate-slide" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <ShieldCheck size={48} color="#ef4444" />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Account Verification</h2>
        </div>

        {verifying && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
            <Loader size={36} className="animate-spin" color="#6366f1" style={{ animation: 'spin 1.5s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Verifying your email token, please wait...</p>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1rem 0' }}>
            <CheckCircle2 size={48} color="#10b981" />
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Success!</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>{success}</p>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', marginTop: '1rem' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1rem 0' }}>
            <AlertCircle size={48} color="#ef4444" />
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Verification Failed</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>{error}</p>
            </div>
            <Link to="/signup" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none', marginTop: '1rem' }}>
              Create a New Account
            </Link>
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default VerifyEmail;
