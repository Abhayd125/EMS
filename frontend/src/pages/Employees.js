import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchEmployees, deleteEmployee } from '../redux/slices/employeeSlice';
import { fetchDepartments } from '../redux/slices/departmentSlice';
import { 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit3, 
  FileText, 
  FolderOpen,
  Filter,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const Employees = () => {
  const dispatch = useDispatch();
  const { list: employees, loading, error } = useSelector((state) => state.employees);
  const { list: departments } = useSelector((state) => state.departments);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete employee "${name}"?`)) {
      dispatch(deleteEmployee(id));
    }
  };

  // Filter logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm);
    
    const matchesDept = selectedDept === '' || emp.departmentId === parseInt(selectedDept);
    
    const matchesSkill = selectedSkill === '' || 
      (emp.skills && emp.skills.some(skill => skill.name.toLowerCase().includes(selectedSkill.toLowerCase())));

    return matchesSearch && matchesDept && matchesSkill;
  });

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Employee Registry</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage staff profiles, department groupings, technical skills, and documentation.
          </p>
        </div>
        
        {currentUser?.role === 'ADMIN' && (
          <Link to="/employees/new" className="btn btn-primary">
            <PlusCircle size={18} /> Add Employee
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.75rem', height: '42px' }}
          />
        </div>

        {/* Department Filter */}
        <div style={{ flex: '0 1 200px', position: 'relative' }}>
          <select
            className="form-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ width: '100%', height: '42px', paddingRight: '2rem' }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Skill Filter */}
        <div style={{ flex: '0 1 200px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Filter by skill..."
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            style={{ width: '100%', height: '42px' }}
          />
        </div>
      </div>

      {/* Main Table List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-secondary)' }}>
          <p>Loading employee directory...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 'var(--radius-sm)' }}>
          <p>{error}</p>
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact Details</th>
                  <th>Department</th>
                  <th>Skills</th>
                  <th>Attachments</th>
                  {currentUser?.role === 'ADMIN' && <th style={{ textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    {/* Name / Profile */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {emp.profileImage ? (
                          <img 
                            src={`http://localhost:5000/${emp.profileImage}`} 
                            alt={emp.name} 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} 
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 650, color: '#fff' }}>{emp.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.1rem' }}>
                            <MapPin size={10} /> {emp.address}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email / Phone */}
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <Mail size={12} color="var(--text-muted)" /> {emp.email}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <Phone size={12} color="var(--text-muted)" /> {emp.phone}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <span className="badge badge-primary">
                        {emp.departmentName || (emp.department && emp.department.name) || 'Unassigned'}
                      </span>
                    </td>

                    {/* Skills */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '280px' }}>
                        {emp.skills && emp.skills.length > 0 ? (
                          emp.skills.map((skill) => (
                            <span 
                              key={skill.id} 
                              className="badge" 
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}
                            >
                              {skill.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                        )}
                      </div>
                    </td>

                    {/* Resume / Documents */}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Resume */}
                        {emp.resume ? (
                          <a 
                            href={`http://localhost:5000/${emp.resume}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="badge badge-success"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', cursor: 'pointer' }}
                            title="Download Resume"
                          >
                            <FileText size={12} /> Resume
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No Resume</span>
                        )}

                        {/* Documents */}
                        {emp.documents && emp.documents.length > 0 ? (
                          <button 
                            onClick={() => {
                              const docs = typeof emp.documents === 'string' ? JSON.parse(emp.documents) : emp.documents;
                              if (docs.length === 1) {
                                window.open(`http://localhost:5000/${docs[0]}`, '_blank');
                              } else {
                                alert(`Employee has ${docs.length} documents:\n` + docs.map((d, i) => `${i+1}. http://localhost:5000/${d}`).join('\n'));
                              }
                            }}
                            className="badge badge-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', cursor: 'pointer' }}
                            title="View Documents"
                          >
                            <FolderOpen size={12} /> Docs ({emp.documents.length})
                          </button>
                        ) : null}
                      </div>
                    </td>

                    {/* Actions (Admin Only) */}
                    {currentUser?.role === 'ADMIN' && (
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <Link 
                            to={`/employees/edit/${emp.id}`} 
                            style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex', alignItems: 'center' }}
                            title="Edit Profile"
                          >
                            <Edit3 size={16} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(emp.id, emp.name)}
                            style={{ padding: '0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Delete Employee"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No matching employees found in registry.</p>
        </div>
      )}
    </div>
  );
};

export default Employees;
