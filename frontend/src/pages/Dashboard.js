import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { apiRequest } from '../utils/api';
import { fetchTodayStatus, checkIn, checkOut } from '../redux/slices/attendanceSlice';
import { 
  Users, 
  FolderTree, 
  Wrench, 
  PlusCircle, 
  Briefcase, 
  Sparkles,
  Clock,
  Monitor,
  ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { today, actionLoading } = useSelector((state) => state.attendance);
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest('/stats');
        setStats(data.stats);
      } catch (err) {
        setError('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    dispatch(fetchTodayStatus());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    dispatch(checkIn(notes)).then(() => {
      setNotes('');
    });
  };

  const handleCheckOut = () => {
    dispatch(checkOut(notes)).then(() => {
      setNotes('');
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-secondary)' }}>
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 'var(--radius-sm)' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, background: 'linear-gradient(to right, #fff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            System Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Welcome back, <strong style={{ color: '#fff' }}>{user?.name}</strong>. Here is the operational summary.
          </p>
        </div>
        
        {user?.role === 'ADMIN' && (
          <Link to="/employees/new" className="btn btn-primary">
            <PlusCircle size={18} /> Add Employee
          </Link>
        )}
      </div>

      {/* Attendance Check-in/out Widget */}
      <div className="glass-panel" style={{
        padding: '1.75rem 2rem',
        marginBottom: '2.5rem',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        background: 'linear-gradient(135deg, rgba(13, 13, 16, 0.9) 0%, rgba(239, 68, 68, 0.03) 100%)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem'
      }}>
        {/* Clock & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            padding: '1rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            minWidth: '160px'
          }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px', color: '#fff' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              {!today.checkedIn ? (
                <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>Not Checked In</span>
              ) : !today.checkedOut ? (
                <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>Active Duty (Checked In)</span>
              ) : (
                <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>Shift Completed (Checked Out)</span>
              )}
            </div>
            {today.checkedIn && today.attendance && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Checked in at: {new Date(today.attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                {today.attendance.status === 'LATE' && <span style={{ color: '#ef4444', marginLeft: '0.4rem', fontWeight: 600 }}>(LATE ENTRY)</span>}
              </p>
            )}
            {today.checkedOut && today.attendance?.checkOut && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Checked out at: {new Date(today.attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Notes & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 350px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!today.checkedOut && (
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Optional daily status note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ height: '42px', fontSize: '0.9rem' }}
                disabled={actionLoading}
              />
            </div>
          )}

          {!today.checkedIn ? (
            <button
              onClick={handleCheckIn}
              className="btn btn-primary"
              style={{ height: '42px', minWidth: '140px' }}
              disabled={actionLoading}
            >
              {actionLoading ? 'Working...' : 'Check In'}
            </button>
          ) : !today.checkedOut ? (
            <button
              onClick={handleCheckOut}
              className="btn btn-danger"
              style={{ height: '42px', minWidth: '140px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}
              disabled={actionLoading}
            >
              {actionLoading ? 'Working...' : 'Check Out'}
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              style={{ height: '42px', minWidth: '140px', cursor: 'not-allowed', opacity: 0.6 }}
              disabled
            >
              Completed
            </button>
          )}
        </div>
      </div>

      {/* Top Statistic Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Total Employees */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Users size={28} color="#6366f1" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Employees</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.totalEmployees || 0}</h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
            <Users size={100} />
          </div>
        </div>

        {/* Total Departments */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(217,70,239,0.2) 0%, rgba(217,70,239,0.05) 100%)', border: '1px solid rgba(217,70,239,0.15)' }}>
            <FolderTree size={28} color="#d946ef" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departments</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.totalDepartments || 0}</h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
            <FolderTree size={100} />
          </div>
        </div>

        {/* Total Skills */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <Wrench size={28} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills Mastered</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.totalSkills || 0}</h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
            <Wrench size={100} />
          </div>
        </div>

        {/* Total Assets */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.05) 100%)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <Monitor size={28} color="#ef4444" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Assets</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.totalAssets || 0}</h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
            <Monitor size={100} />
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <ClipboardList size={28} color="#f59e0b" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Leaves</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.pendingLeaves || 0}</h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
            <ClipboardList size={100} />
          </div>
        </div>
      </div>

      {/* Grid: Charts and Recent Listings */}
      <div className="grid-2">
        {/* Department Distribution (Pure CSS indicators) */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={20} color="#6366f1" /> Department Headcount
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stats?.departmentBreakdown && stats.departmentBreakdown.length > 0 ? (
              stats.departmentBreakdown.map((dept) => {
                const maxCount = Math.max(...stats.departmentBreakdown.map(d => d.count), 1);
                const percent = (dept.count / maxCount) * 100;
                return (
                  <div key={dept.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{dept.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{dept.count} {dept.count === 1 ? 'employee' : 'employees'}</span>
                    </div>
                    {/* Progress track */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, #6366f1, #d946ef)',
                        borderRadius: '9999px',
                        transition: 'width 1s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>No department data available</p>
            )}
          </div>
        </div>

        {/* Skills Popularity */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#d946ef" /> Skills Breakdown
          </h4>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {stats?.skillBreakdown && stats.skillBreakdown.length > 0 ? (
              stats.skillBreakdown.map((skill) => (
                <div 
                  key={skill.id} 
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{skill.name}</span>
                  <span className="badge badge-primary" style={{ padding: '0.1rem 0.5rem' }}>{skill.count}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '100%', textAlign: 'center', padding: '1rem 0' }}>No skills data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Employee Additions */}
      <div className="glass-panel animate-slide" style={{ padding: '2rem', marginTop: '2.5rem' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="#10b981" /> Recently Recruited
        </h4>
        
        {stats?.recentEmployees && stats.recentEmployees.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {emp.profileImage ? (
                          <img 
                            src={`http://localhost:5000/${emp.profileImage}`} 
                            alt={emp.name} 
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>
                      <span className="badge badge-primary">{emp.department}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(emp.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>No employees registered yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
