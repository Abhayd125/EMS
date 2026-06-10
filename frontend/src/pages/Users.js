import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser, clearUserStatus } from '../redux/slices/userSlice';
import { 
  Search, 
  Edit3, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  ShieldAlert,
  UserCog
} from 'lucide-react';

const Users = () => {
  const dispatch = useDispatch();
  const { list: users, loading, error, success } = useSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setIsModalOpen(false);
      resetForm();
      dispatch(fetchUsers()); // Refresh registry
      // Clear status after 3 seconds
      const timer = setTimeout(() => {
        dispatch(clearUserStatus());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const resetForm = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setRole('');
    setPassword('');
    setShowPassword(false);
    setValidationError('');
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setShowPassword(false);
    setValidationError('');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Name is required');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setValidationError('A valid email address is required');
      return;
    }

    const userData = {
      name,
      email,
      role
    };

    if (password) {
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters long');
        return;
      }
      userData.password = password;
    }

    dispatch(updateUser({ id: selectedUser.id, userData }));
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === '' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>User Accounts Registry</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Manage login credentials, verification state, and system security access clearance.
        </p>
      </div>

      {/* Action Status Feedback */}
      {success && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          fontWeight: 500
        }}>
          User account updated successfully!
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.75rem', height: '42px' }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ flex: '0 1 200px' }}>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '100%', height: '42px' }}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-secondary)' }}>
          <p>Loading accounts registry...</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th>Email Status</th>
                  <th>Registered On</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    {/* User Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: u.role === 'ADMIN' 
                            ? 'linear-gradient(135deg, #ef4444, #b91c1c)' 
                            : u.role === 'HR' 
                              ? 'linear-gradient(135deg, #ec4899, #be185d)' 
                              : 'linear-gradient(135deg, #374151, #1f2937)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{u.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {u.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td>{u.email}</td>

                    {/* Role Badge */}
                    <td>
                      <span className={`badge ${
                        u.role === 'ADMIN' ? 'badge-danger' : 
                        u.role === 'HR' ? 'badge-primary' : 
                        u.role === 'MANAGER' ? 'badge-success' : 'badge-secondary'
                      }`} style={u.role === 'HR' ? { background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' } : {}}>
                        {u.role}
                      </span>
                    </td>

                    {/* Verification Badge */}
                    <td>
                      {u.isVerified ? (
                        <span className="badge badge-success">Verified</span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>Pending</span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    {/* Edit button */}
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditClick(u)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                          title="Modify Account"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No matching users found in registry.</p>
        </div>
      )}

      {/* Edit Modal Dialog */}
      {isModalOpen && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-slide" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative'
          }}>
            {/* Close */}
            <button
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <UserCog color="var(--primary)" size={24} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Edit User Account</h3>
            </div>

            {validationError && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                fontWeight: 500
              }}>
                {validationError}
              </div>
            )}

            {/* Warning Alert for Swapping Admin */}
            {role === 'ADMIN' && selectedUser.role !== 'ADMIN' && (
              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                display: 'flex',
                gap: '0.5rem',
                lineHeight: '1.4'
              }}>
                <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>
                  <strong>CRITICAL WARNING:</strong> Promoting this user to ADMIN will demote your current account to <strong>EMPLOYEE</strong>. You will lose Administrator system privileges.
                </span>
              </div>
            )}

            {/* Warning Alert for Swapping HR */}
            {role === 'HR' && selectedUser.role !== 'HR' && (
              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                color: '#fde047',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                display: 'flex',
                gap: '0.5rem',
                lineHeight: '1.4'
              }}>
                <ShieldAlert size={18} color="#eab308" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Notice:</strong> Promoting this user to HR will demote the current HR account to <strong>EMPLOYEE</strong>.
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', height: '42px' }}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', height: '42px' }}
                    required
                  />
                </div>
              </div>

              {/* Change Password */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Change Password (leave blank to keep current)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    placeholder="New password (min 6 characters)"
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', height: '42px', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Access Role */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Clearance Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                  <option value="HR">HR (Human Resources Manager)</option>
                  <option value="MANAGER">MANAGER (Department Head)</option>
                  <option value="EMPLOYEE">EMPLOYEE (Staff Member)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="btn btn-secondary"
                  style={{ height: '42px', minWidth: '100px' }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: '42px', minWidth: '120px' }}
                  disabled={loading}
                >
                  <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
