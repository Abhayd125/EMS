import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAssets, 
  createAsset, 
  deleteAsset, 
  assignAsset, 
  returnAsset, 
  resetStatus 
} from '../redux/slices/assetSlice';
import { fetchEmployees } from '../redux/slices/employeeSlice';
import { 
  Search, 
  Plus, 
  RotateCcw, 
  Trash2, 
  UserPlus, 
  Monitor, 
  AlertTriangle,
  X 
} from 'lucide-react';

const Assets = () => {
  const dispatch = useDispatch();
  const { list: assets, total, limit, loading, error, success } = useSelector((state) => state.assets);
  const { list: employees } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';

  // Search/Filter State
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(1);

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Form State
  const [assetForm, setAssetForm] = useState({ name: '', serialNumber: '', type: 'LAPTOP' });
  const [assignForm, setAssignForm] = useState({ employeeId: '', notes: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    dispatch(fetchAssets({ page: pageNumber, limit, search, type, status }));
  }, [dispatch, pageNumber, limit, search, type, status]);

  useEffect(() => {
    if (isAdminOrHR) {
      dispatch(fetchEmployees());
    }
  }, [dispatch, isAdminOrHR]);

  useEffect(() => {
    if (success) {
      setAddModalOpen(false);
      setAssignModalOpen(false);
      setSelectedAsset(null);
      setAssetForm({ name: '', serialNumber: '', type: 'LAPTOP' });
      setAssignForm({ employeeId: '', notes: '' });
      dispatch(fetchAssets({ page: pageNumber, limit, search, type, status }));
      dispatch(resetStatus());
    }
  }, [success, dispatch, pageNumber, limit, search, type, status]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!assetForm.name || !assetForm.serialNumber || !assetForm.type) {
      setFormError('All fields are required');
      return;
    }
    dispatch(createAsset(assetForm));
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!assignForm.employeeId) {
      setFormError('Please select an employee');
      return;
    }
    dispatch(assignAsset({ 
      id: selectedAsset.id, 
      employeeId: parseInt(assignForm.employeeId), 
      notes: assignForm.notes 
    }));
  };

  const handleReturnAsset = (asset) => {
    // Find active assignment
    const activeAssignment = asset.assignments?.find(a => a.status === 'ACTIVE');
    if (activeAssignment) {
      if (window.confirm(`Are you sure you want to mark ${asset.name} as returned?`)) {
        dispatch(returnAsset({ assignmentId: activeAssignment.id, notes: 'Returned via asset panel' }));
      }
    }
  };

  const handleDeleteAsset = (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      dispatch(deleteAsset(id));
    }
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
            <Monitor color="var(--primary)" size={32} />
            Asset Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track and manage enterprise corporate devices</p>
        </div>
        {isAdminOrHR && (
          <button 
            className="btn btn-primary" 
            onClick={() => setAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Add Asset
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        alignItems: 'end'
      }}>
        <div>
          <label className="form-label">Search Asset</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Name or serial number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Type</label>
          <select 
            className="form-select" 
            value={type} 
            onChange={(e) => { setType(e.target.value); setPageNumber(1); }}
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
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
            style={{ width: '100%' }}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REPAIR">Under Repair</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
        {error && (
          <div style={{ padding: '1rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            {error}
          </div>
        )}
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Asset Info</th>
              <th>Serial Number</th>
              <th>Type</th>
              <th>Status</th>
              <th>Current Assignment</th>
              {isAdminOrHR && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdminOrHR ? 6 : 5} style={{ textAlign: 'center', padding: '3rem' }}>
                  Loading assets dataset...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={isAdminOrHR ? 6 : 5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No assets found.
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const activeAssignment = asset.assignments?.find(a => a.status === 'ACTIVE');
                return (
                  <tr key={asset.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{asset.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {asset.id}</div>
                    </td>
                    <td><code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{asset.serialNumber}</code></td>
                    <td>
                      <span className={`badge ${asset.type === 'LAPTOP' ? 'badge-primary' : 'badge-secondary'}`}>
                        {asset.type}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: asset.status === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: asset.status === 'AVAILABLE' ? '#10b981' : '#f87171',
                        border: asset.status === 'AVAILABLE' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)'
                      }}>
                        {asset.status}
                      </span>
                    </td>
                    <td>
                      {activeAssignment ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{activeAssignment.employee?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Assigned: {new Date(activeAssignment.assignedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    {isAdminOrHR && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {asset.status === 'AVAILABLE' ? (
                            <button 
                              onClick={() => { setSelectedAsset(asset); setAssignModalOpen(true); }}
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <UserPlus size={14} /> Assign
                            </button>
                          ) : asset.status === 'ASSIGNED' ? (
                            <button 
                              onClick={() => handleReturnAsset(asset)}
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}
                            >
                              <RotateCcw size={14} /> Return
                            </button>
                          ) : null}
                          <button 
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="btn btn-danger" 
                            style={{ padding: '0.25rem' }}
                            disabled={asset.status === 'ASSIGNED'}
                            title={asset.status === 'ASSIGNED' ? 'Return asset before deleting' : 'Delete asset'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > limit && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {assets.length} of {total} assets
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                disabled={pageNumber === 1}
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button 
                className="btn btn-secondary" 
                disabled={pageNumber * limit >= total}
                onClick={() => setPageNumber(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {addModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add New corporate Asset</h3>
              <button onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            {formError && <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.85rem' }}>{formError}</div>}
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Asset Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="e.g. MacBook Pro 16"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Serial Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. C02XL123NHD2"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Asset Type</label>
                <select 
                  className="form-select" 
                  value={assetForm.type}
                  onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="LAPTOP">Laptop</option>
                  <option value="MONITOR">Monitor</option>
                  <option value="ID_CARD">ID Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Asset Modal */}
      {assignModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Assign Asset</h3>
              <button onClick={() => setAssignModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            {selectedAsset && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: 600 }}>{selectedAsset.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Serial: {selectedAsset.serialNumber}</div>
              </div>
            )}
            {formError && <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.85rem' }}>{formError}</div>}
            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Employee</label>
                <select 
                  className="form-select" 
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notes (Optional)</label>
                <textarea 
                  className="form-input" 
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="e.g. Shipped to remote address"
                  rows={3}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
