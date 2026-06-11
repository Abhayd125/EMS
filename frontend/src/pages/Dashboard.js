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

  const renderAttendanceColumns = () => {
    const data = stats?.attendanceToday || { present: 0, late: 0, onLeave: 0, absent: 0 };
    const categories = [
      { label: 'Present', value: data.present, color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
      { label: 'Late', value: data.late, color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
      { label: 'On Leave', value: data.onLeave, color: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
      { label: 'Absent', value: data.absent, color: '#ef4444', glow: 'rgba(239,68,68,0.2)' }
    ];

    const maxVal = Math.max(...categories.map(c => c.value), 4);
    const chartHeight = 160;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: `${chartHeight}px`, padding: '0 0.5rem', borderBottom: '1px solid var(--border)' }}>
          {categories.map((cat, index) => {
            const barHeight = (cat.value / maxVal) * (chartHeight - 40);
            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '60px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{cat.value}</span>
                <div style={{
                  width: '24px',
                  height: `${Math.max(barHeight, 4)}px`,
                  background: cat.color,
                  borderRadius: '4px 4px 0 0',
                  boxShadow: `0 0 10px ${cat.glow}`,
                  transition: 'height 0.8s ease'
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {categories.map((cat, index) => (
            <span key={index} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '60px', textAlign: 'center' }}>
              {cat.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderDepartmentDonut = () => {
    const depts = stats?.departmentBreakdown || [];
    const total = depts.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)' }}>
          <p>No department data available</p>
        </div>
      );
    }

    let cumulativePercent = 0;
    const colors = ['#6366f1', '#d946ef', '#ef4444', '#10b981', '#f59e0b', '#3b82f6'];

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', height: '100%' }}>
        <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="150" height="150" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="10" />
            {depts.map((dept, index) => {
              const percent = dept.count / total;
              const strokeLength = percent * 314.16;
              const strokeOffset = 314.16 - (cumulativePercent * 314.16);
              cumulativePercent += percent;
              const strokeColor = colors[index % colors.length];
              return (
                <circle
                  key={dept.id}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke={strokeColor}
                  strokeWidth="10"
                  strokeDasharray={`${strokeLength} 314.16`}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{total}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Staff</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {depts.map((dept, index) => {
            const percent = ((dept.count / total) * 100).toFixed(0);
            const color = colors[index % colors.length];
            return (
              <div key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                <span style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }} title={dept.name}>{dept.name}</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto', fontWeight: 500 }}>{dept.count} ({percent}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSkillsBarChart = () => {
    const skills = stats?.skillBreakdown || [];
    if (skills.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)' }}>
          <p>No skills data available</p>
        </div>
      );
    }

    const sortedSkills = [...skills].sort((a, b) => b.count - a.count).slice(0, 5);
    const maxCount = Math.max(...sortedSkills.map(s => s.count), 1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        {sortedSkills.map((skill) => {
          const widthPercent = (skill.count / maxCount) * 100;
          return (
            <div key={skill.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>{skill.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{skill.count}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${widthPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(to right, #d946ef, #ef4444)',
                  borderRadius: '4px',
                  transition: 'width 0.8s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
      {user?.role !== 'ADMIN' && (
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
      )}

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

        {/* Average QA Score */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <Sparkles size={28} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average QA Score</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>
              {stats?.avgPerformanceRating ? `${stats.avgPerformanceRating.toFixed(1)} / 5.0` : '0.0 / 5.0'}
            </h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
            <Sparkles size={100} />
          </div>
        </div>
      </div>

      {/* Grid: Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Attendance overview */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Clock size={18} color="var(--primary)" /> Attendance Today
          </h4>
          {renderAttendanceColumns()}
        </div>

        {/* Department distribution */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Briefcase size={18} color="#6366f1" /> Department Headcount
          </h4>
          {renderDepartmentDonut()}
        </div>

        {/* Skills Popularity */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Sparkles size={18} color="#d946ef" /> Top Skills
          </h4>
          {renderSkillsBarChart()}
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
