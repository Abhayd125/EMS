import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { apiRequest } from '../utils/api';
import { 
  Users, 
  FolderTree, 
  Wrench, 
  PlusCircle, 
  Briefcase, 
  Sparkles,
  Clock,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, []);

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

      {/* Top Statistic Cards */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        {/* Total Employees */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Users size={32} color="#6366f1" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Employees</span>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.totalEmployees || 0}</h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.05 }}>
            <Users size={120} />
          </div>
        </div>

        {/* Total Departments */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(217,70,239,0.2) 0%, rgba(217,70,239,0.05) 100%)', border: '1px solid rgba(217,70,239,0.15)' }}>
            <FolderTree size={32} color="#d946ef" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departments</span>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.totalDepartments || 0}</h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.05 }}>
            <FolderTree size={120} />
          </div>
        </div>

        {/* Total Skills */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <Wrench size={32} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills Mastered</span>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{stats?.totalSkills || 0}</h3>
          </div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.05 }}>
            <Wrench size={120} />
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
