import React, { useEffect, useState } from 'react';
import { apiRequest, getAccessToken } from '../utils/api';
import { 
  FileSpreadsheet, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  Loader2 
} from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('employees'); // employees, leaves, assets
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [leaveStatus, setLeaveStatus] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [assetType, setAssetType] = useState('');
  const [assetStatus, setAssetStatus] = useState('');

  useEffect(() => {
    // Load departments for filter dropdown
    const loadDepts = async () => {
      try {
        const res = await apiRequest('/departments');
        setDepartments(res.departments || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    loadDepts();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      const params = new URLSearchParams();

      if (activeTab === 'employees') {
        endpoint = '/reports/employees';
        if (search) params.append('search', search);
        if (departmentId) params.append('departmentId', departmentId);
      } else if (activeTab === 'leaves') {
        endpoint = '/reports/leaves';
        if (leaveStatus) params.append('status', leaveStatus);
        if (leaveType) params.append('leaveType', leaveType);
      } else if (activeTab === 'assets') {
        endpoint = '/reports/assets';
        if (assetType) params.append('type', assetType);
        if (assetStatus) params.append('status', assetStatus);
      }

      const res = await apiRequest(`${endpoint}?${params.toString()}`);
      setData(res.data || []);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, departmentId, leaveStatus, leaveType, assetType, assetStatus]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');

      if (activeTab === 'employees') {
        if (search) params.append('search', search);
        if (departmentId) params.append('departmentId', departmentId);
      } else if (activeTab === 'leaves') {
        if (leaveStatus) params.append('status', leaveStatus);
        if (leaveType) params.append('leaveType', leaveType);
      } else if (activeTab === 'assets') {
        if (assetType) params.append('type', assetType);
        if (assetStatus) params.append('status', assetStatus);
      }

      const token = getAccessToken();
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${baseUrl}/reports/${activeTab}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  // SVG Chart Telemetry Calculations
  const getEmployeesChart = () => {
    // Group by department name
    const counts = {};
    data.forEach(emp => {
      const name = emp.department?.name || 'Unassigned';
      counts[name] = (counts[name] || 0) + 1;
    });

    const entries = Object.entries(counts);
    const maxVal = Math.max(...entries.map(e => e[1]), 1);

    return (
      <svg width="100%" height="220" viewBox="0 0 500 220" style={{ background: 'rgba(10, 10, 12, 0.4)', borderRadius: '8px', padding: '10px' }}>
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <text x="10" y="20" fill="#ef4444" fontSize="12" fontWeight="bold" letterSpacing="1">DEPARTMENT DISTRIBUTION</text>
        <line x1="10" y1="28" x2="490" y2="28" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />
        
        {entries.length === 0 ? (
          <text x="250" y="120" fill="var(--text-muted)" fontSize="14" textAnchor="middle">No Telemetry Data Available</text>
        ) : (
          entries.slice(0, 4).map((entry, index) => {
            const [dept, count] = entry;
            const y = 55 + index * 40;
            const barWidth = (count / maxVal) * 300;
            return (
              <g key={dept}>
                <text x="15" y={y + 12} fill="var(--text-secondary)" fontSize="11" fontWeight="600">{dept}</text>
                <rect x="150" y={y} width="300" height="18" fill="rgba(255, 255, 255, 0.02)" rx="2" stroke="rgba(255,255,255,0.05)" />
                <rect 
                  x="150" 
                  y={y} 
                  width={barWidth} 
                  height="18" 
                  fill="url(#red-grad)" 
                  filter="url(#neon-glow)"
                  rx="2" 
                />
                <text x={160 + barWidth} y={y + 13} fill="#ef4444" fontSize="11" fontWeight="bold">{count}</text>
              </g>
            );
          })
        )}

        <defs>
          <linearGradient id="red-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const getLeavesChart = () => {
    // Success rate of approvals
    const total = data.length;
    const approved = data.filter(l => l.status === 'APPROVED').length;
    const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

    // SVG Circular dial
    const radius = 60;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (rate / 100) * circ;

    return (
      <svg width="100%" height="220" viewBox="0 0 500 220" style={{ background: 'rgba(10, 10, 12, 0.4)', borderRadius: '8px', padding: '10px' }}>
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <text x="10" y="20" fill="#ef4444" fontSize="12" fontWeight="bold" letterSpacing="1">LEAVE APPROVAL TELEMETRY</text>
        <line x1="10" y1="28" x2="490" y2="28" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />

        <circle 
          cx="150" 
          cy="120" 
          r={radius} 
          fill="none" 
          stroke="rgba(255,255,255,0.03)" 
          strokeWidth="12" 
        />
        <circle 
          cx="150" 
          cy="120" 
          r={radius} 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="12" 
          strokeDasharray={circ}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 150 120)"
          filter="url(#neon-glow)"
        />
        <text x="150" y="125" fill="#fff" fontSize="20" fontWeight="800" textAnchor="middle">{rate}%</text>
        <text x="150" y="145" fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="middle">APPROVED</text>

        {/* Legend */}
        <g transform="translate(270, 75)">
          <text x="0" y="15" fill="#fff" fontSize="14" fontWeight="700">{approved}</text>
          <text x="0" y="30" fill="var(--text-muted)" fontSize="10" fontWeight="600">APPROVED REQUESTS</text>
          
          <text x="0" y="60" fill="#fff" fontSize="14" fontWeight="700">{total}</text>
          <text x="0" y="75" fill="var(--text-muted)" fontSize="10" fontWeight="600">TOTAL FILED REQUESTS</text>
        </g>
      </svg>
    );
  };

  const getAssetsChart = () => {
    const total = data.length;
    const assigned = data.filter(a => a.status === 'ASSIGNED').length;
    const rate = total > 0 ? Math.round((assigned / total) * 100) : 0;

    return (
      <svg width="100%" height="220" viewBox="0 0 500 220" style={{ background: 'rgba(10, 10, 12, 0.4)', borderRadius: '8px', padding: '10px' }}>
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <text x="10" y="20" fill="#ef4444" fontSize="12" fontWeight="bold" letterSpacing="1">DEVICE ALLOCATION RADAR</text>
        <line x1="10" y1="28" x2="490" y2="28" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />

        {/* Progress Bar dial */}
        <g transform="translate(40, 70)">
          <text x="0" y="20" fill="var(--text-secondary)" fontSize="12" fontWeight="600">Total Devices Checked-In</text>
          <text x="400" y="20" fill="#fff" fontSize="14" fontWeight="800" textAnchor="end">{total}</text>
          
          <rect x="0" y="35" width="420" height="10" fill="rgba(255,255,255,0.03)" rx="5" />
          <rect x="0" y="35" width={(rate / 100) * 420} height="10" fill="#ef4444" rx="5" filter="url(#neon-glow)" />

          <text x="0" y="70" fill="var(--text-muted)" fontSize="11" fontWeight="600">Active Allocations: <span style={{ color: '#fff' }}>{assigned} ({rate}%)</span></text>
          <text x="420" y="70" fill="var(--text-muted)" fontSize="11" fontWeight="600" textAnchor="end">Available: <span style={{ color: '#10b981' }}>{total - assigned}</span></text>
        </g>
      </svg>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 color="var(--primary)" size={32} />
            Corporate Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Generate workforce data metrics and spreadsheet exports</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleExportCSV}
          disabled={data.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileSpreadsheet size={18} /> Export to CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border)',
        marginBottom: '2rem',
        paddingBottom: '1px'
      }}>
        <button 
          onClick={() => { setActiveTab('employees'); setData([]); }}
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'employees' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'employees' ? '#fff' : 'var(--text-secondary)',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}
        >
          Employees List
        </button>
        <button 
          onClick={() => { setActiveTab('leaves'); setData([]); }}
          className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'leaves' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'leaves' ? '#fff' : 'var(--text-secondary)',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}
        >
          Leave History
        </button>
        <button 
          onClick={() => { setActiveTab('assets'); setData([]); }}
          className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'assets' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'assets' ? '#fff' : 'var(--text-secondary)',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}
        >
          Corporate Assets
        </button>
      </div>

      {/* Telemetry charts row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Telemetry Console</span>
          </div>
          {activeTab === 'employees' && getEmployeesChart()}
          {activeTab === 'leaves' && getLeavesChart()}
          {activeTab === 'assets' && getAssetsChart()}
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Filter size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Telemetry & Search Filters</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {activeTab === 'employees' && (
            <>
              <div>
                <label className="form-label">Search Name/Email</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Filter name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeTab === 'leaves' && (
            <>
              <div>
                <label className="form-label">Leave Status</label>
                <select 
                  className="form-select"
                  value={leaveStatus}
                  onChange={(e) => setLeaveStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING_MANAGER">Pending Manager</option>
                  <option value="PENDING_HR">Pending HR</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="form-label">Leave Type</label>
                <select 
                  className="form-select"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">All Types</option>
                  <option value="SICK">Sick</option>
                  <option value="CASUAL">Casual</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'assets' && (
            <>
              <div>
                <label className="form-label">Asset Type</label>
                <select 
                  className="form-select"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">All Types</option>
                  <option value="LAPTOP">Laptop</option>
                  <option value="MONITOR">Monitor</option>
                  <option value="ID_CARD">ID Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={assetStatus}
                  onChange={(e) => setAssetStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="UNDER_REPAIR">Under Repair</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid Results */}
      <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.5rem' }}>
            <Loader2 className="animate-spin" color="var(--primary)" size={24} />
            <span>Fetching Telemetry Records...</span>
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            No records matched the active filters.
          </div>
        ) : (
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            {activeTab === 'employees' && (
              <>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(emp => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.phone}</td>
                      <td>{emp.department?.name || 'Unassigned'}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {emp.skills?.map(s => (
                            <span key={s.id} className="badge badge-secondary">{s.name}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {activeTab === 'leaves' && (
              <>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(leave => (
                    <tr key={leave.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{leave.employee?.name}</td>
                      <td><span className="badge badge-secondary">{leave.leaveType}</span></td>
                      <td>
                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: leave.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: leave.status === 'APPROVED' ? '#10b981' : '#f87171'
                        }}>{leave.status}</span>
                      </td>
                      <td>{leave.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {activeTab === 'assets' && (
              <>
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Serial Number</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(asset => (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{asset.name}</td>
                      <td><code>{asset.serialNumber}</code></td>
                      <td>{asset.type}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: asset.status === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: asset.status === 'AVAILABLE' ? '#10b981' : '#f87171'
                        }}>{asset.status}</span>
                      </td>
                      <td>{asset.assignments?.[0]?.employee?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;
