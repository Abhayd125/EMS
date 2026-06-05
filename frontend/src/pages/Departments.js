import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment, resetStatus } from '../redux/slices/departmentSlice';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle,
  FileCheck,
  X
} from 'lucide-react';

const Departments = () => {
  const dispatch = useDispatch();
  const { list: departments, loading, error, success } = useSelector((state) => state.departments);

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setName('');
      setDescription('');
      setShowModal(false);
      dispatch(resetStatus());
      dispatch(fetchDepartments());
    }
  }, [success, dispatch]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setIsEditMode(true);
    setEditId(dept.id);
    setName(dept.name);
    setDescription(dept.description || '');
    setShowModal(true);
  };

  const handleDelete = (id, deptName) => {
    if (window.confirm(`Are you sure you want to delete department "${deptName}"?\nThis will remove all associated employee relations!`)) {
      dispatch(deleteDepartment(id)).then(() => {
        dispatch(fetchDepartments());
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditMode) {
      dispatch(updateDepartment({ id: editId, deptData: { name, description } }));
    } else {
      dispatch(createDepartment({ name, description }));
    }
  };

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Departments Master</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Configure and organize company department categories.
          </p>
        </div>
        
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> New Department
        </button>
      </div>

      {/* Error alert */}
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

      {/* Main Grid View */}
      {loading && departments.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-secondary)' }}>
          <p>Loading departments...</p>
        </div>
      ) : departments.length > 0 ? (
        <div className="grid-3">
          {departments.map((dept) => (
            <div key={dept.id} className="glass-panel" style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '180px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              position: 'relative'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{dept.name}</h3>
                  <span className="badge badge-primary" style={{ padding: '0.1rem 0.6rem', fontSize: '0.75rem' }}>
                    {dept._count?.employees || 0} Staff
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                  {dept.description || 'No description provided.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem',
                marginTop: 'auto'
              }}>
                <button
                  onClick={() => handleOpenEdit(dept)}
                  style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Edit Department"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(dept.id, dept.name)}
                  style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Delete Department"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FolderTree size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <p>No departments configured. Click "New Department" to get started.</p>
        </div>
      )}

      {/* Modal Overlay & Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-slide" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {isEditMode ? 'Edit Department details' : 'Add New Department'}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Department Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Engineering, HR, Sales"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Department Description */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Enter details about this department's function..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
