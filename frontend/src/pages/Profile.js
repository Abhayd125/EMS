import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, clearError, clearSuccessMessage } from '../redux/slices/authSlice';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Save
} from 'lucide-react';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error, successMessage } = useSelector((state) => state.auth);

  // States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    dispatch(clearError());
    dispatch(clearSuccessMessage());
  }, [user, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (password) {
      if (password !== confirmPassword) {
        setValidationError('New passwords do not match');
        return;
      }
      if (password.length < 6) {
        setValidationError('New password must be at least 6 characters');
        return;
      }
    }

    const updateData = { name, email };
    if (password) {
      updateData.password = password;
    }

    dispatch(updateProfile(updateData)).then(() => {
      setPassword('');
      setConfirmPassword('');
    });
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Account Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Configure your personal login credentials and administrative roles.
        </p>
      </div>

      {/* Alerts */}
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
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {(validationError || error) && (
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
          <span>{validationError || error}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Profile Avatar Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #d946ef)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.4rem',
            color: '#fff',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{user?.name}</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span className="badge badge-primary">{user?.role} Account</span>
              {user?.isVerified ? (
                <span className="badge badge-success">Email Verified</span>
              ) : (
                <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <ShieldAlert size={10} /> Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div style={{ position: 'relative' }}>
            <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {/* Change Password fields */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Change Password
          </h4>
          
          <div className="grid-2">
            {/* New Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ alignSelf: 'flex-end', marginTop: '1rem', minWidth: '150px' }}
        >
          <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
        </button>

      </form>
    </div>
  );
};

export default Profile;
