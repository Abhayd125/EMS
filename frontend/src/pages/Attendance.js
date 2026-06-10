import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyAttendanceLogs, fetchAttendanceRegistry } from '../redux/slices/attendanceSlice';
import { 
  Calendar, 
  Search, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

const Attendance = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { myLogs, registry } = useSelector((state) => state.attendance);

  const isHRorAdmin = user?.role === 'ADMIN' || user?.role === 'HR';
  const [activeTab, setActiveTab] = useState(isHRorAdmin ? 'registry' : 'personal');

  // Search & Filter state for global registry
  const [searchName, setSearchName] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (activeTab === 'personal') {
      dispatch(fetchMyAttendanceLogs());
    } else if (activeTab === 'registry') {
      dispatch(fetchAttendanceRegistry({ search: searchName, date: filterDate }));
    }
  }, [dispatch, activeTab, searchName, filterDate]);

  const getDuration = (checkIn, checkOut) => {
    if (!checkOut) return 'On duty';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    if (isNaN(diffMs) || diffMs < 0) return '-';
    
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> Present</span>;
      case 'LATE':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={12} /> Late</span>;
      default:
        return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={12} /> Absent</span>;
    }
  };

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Attendance System</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Monitor work shift timings, daily logs, punctuality metrics, and employee status.
        </p>
      </div>

      {/* Tabs (if Admin/HR) */}
      {isHRorAdmin && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '2rem',
          paddingBottom: '0.5rem'
        }}>
          <button
            onClick={() => setActiveTab('registry')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              color: activeTab === 'registry' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'registry' ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'var(--transition)'
            }}
          >
            Company Attendance Registry
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              color: activeTab === 'personal' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'personal' ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'var(--transition)'
            }}
          >
            My Attendance History
          </button>
        </div>
      )}

      {/* REGISTRY TAB (HR/ADMIN REVIEW SECTION) */}
      {activeTab === 'registry' && isHRorAdmin && (
        <>
          {/* Registry Filters */}
          <div className="glass-panel" style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {/* Search Name */}
            <div style={{ flex: '1 1 250px', position: 'relative' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search employee by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.75rem', height: '42px' }}
              />
            </div>

            {/* Filter Date */}
            <div style={{ flex: '0 1 200px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <input
                type="date"
                className="form-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ width: '100%', height: '42px' }}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Registry Table */}
          {registry.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-secondary)' }}>
              <p>Loading attendance logs...</p>
            </div>
          ) : registry.error ? (
            <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 'var(--radius-sm)' }}>
              <p>{registry.error}</p>
            </div>
          ) : registry.list.length > 0 ? (
            <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Daily Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registry.list.map((log) => (
                      <tr key={log.id}>
                        {/* Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                              {log.employee?.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#fff' }}>{log.employee?.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {log.employee?.department?.name || 'No Dept'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ fontSize: '0.9rem' }}>{log.date}</td>

                        {/* Check In */}
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* Check Out */}
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {log.checkOut 
                            ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : <span style={{ color: 'var(--success)', fontWeight: 500 }}>Active</span>
                          }
                        </td>

                        {/* Duration */}
                        <td style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>
                          {getDuration(log.checkIn, log.checkOut)}
                        </td>

                        {/* Status */}
                        <td>{getStatusBadge(log.status)}</td>

                        {/* Note */}
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.notes}>
                          {log.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No attendance records registered for the current filters.</p>
            </div>
          )}
        </>
      )}

      {/* PERSONAL HISTORY TAB */}
      {activeTab === 'personal' && (
        <>
          {myLogs.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-secondary)' }}>
              <p>Loading your logs...</p>
            </div>
          ) : myLogs.error ? (
            <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 'var(--radius-sm)' }}>
              <p>{myLogs.error}</p>
            </div>
          ) : myLogs.list.length > 0 ? (
            <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Work Duration</th>
                      <th>Punctuality Status</th>
                      <th>Daily Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLogs.list.map((log) => (
                      <tr key={log.id}>
                        {/* Date */}
                        <td style={{ fontWeight: 600, color: '#fff' }}>
                          {new Date(log.checkIn).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>

                        {/* Check In */}
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* Check Out */}
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {log.checkOut 
                            ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active</span>
                          }
                        </td>

                        {/* Duration */}
                        <td style={{ fontWeight: 500, color: '#fff' }}>
                          {getDuration(log.checkIn, log.checkOut)}
                        </td>

                        {/* Status */}
                        <td>{getStatusBadge(log.status)}</td>

                        {/* Note */}
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {log.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>You have not logged any attendance shifts yet. Go to the Dashboard to Check In.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Attendance;
