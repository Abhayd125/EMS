import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSkills, createSkill, updateSkill, deleteSkill, resetStatus } from '../redux/slices/skillSlice';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle,
  X
} from 'lucide-react';

const Skills = () => {
  const dispatch = useDispatch();
  const { list: skills, loading, error, success } = useSelector((state) => state.skills);

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [name, setName] = useState('');

  useEffect(() => {
    dispatch(fetchSkills());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setName('');
      setShowModal(false);
      dispatch(resetStatus());
      dispatch(fetchSkills());
    }
  }, [success, dispatch]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setName('');
    setShowModal(true);
  };

  const handleOpenEdit = (skill) => {
    setIsEditMode(true);
    setEditId(skill.id);
    setName(skill.name);
    setShowModal(true);
  };

  const handleDelete = (id, skillName) => {
    if (window.confirm(`Are you sure you want to delete skill "${skillName}"?`)) {
      dispatch(deleteSkill(id)).then(() => {
        dispatch(fetchSkills());
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditMode) {
      dispatch(updateSkill({ id: editId, skillData: { name } }));
    } else {
      dispatch(createSkill({ name }));
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
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Skills Master</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Maintain a global registry of technical and professional skills.
          </p>
        </div>
        
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> New Skill
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

      {/* Skills Table List */}
      {loading && skills.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-secondary)' }}>
          <p>Loading skills database...</p>
        </div>
      ) : skills.length > 0 ? (
        <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Skill ID</th>
                  <th>Skill Label</th>
                  <th>Associated Employees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id}>
                    <td style={{ color: 'var(--text-muted)', width: '100px' }}>#{skill.id}</td>
                    <td>
                      <span className="badge badge-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.9rem' }}>
                        {skill.name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{skill._count?.employees || 0}</span> employees
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEdit(skill)}
                          style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Edit Skill"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(skill.id, skill.name)}
                          style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Delete Skill"
                        >
                          <Trash2 size={16} />
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
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Wrench size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <p>No skills configured in system. Click "New Skill" to add one.</p>
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
            maxWidth: '460px',
            padding: '2rem',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {isEditMode ? 'Edit Skill details' : 'Add New Skill'}
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
              {/* Skill Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Skill Label</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, Node.js, Project Management"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
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

export default Skills;
