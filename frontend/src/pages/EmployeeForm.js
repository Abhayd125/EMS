import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchEmployeeById, createEmployee, updateEmployee, resetStatus, clearCurrentEmployee } from '../redux/slices/employeeSlice';
import { fetchDepartments } from '../redux/slices/departmentSlice';
import { fetchSkills } from '../redux/slices/skillSlice';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  FileCheck, 
  AlertCircle,
  Briefcase,
  Wrench,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const EmployeeForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux Selectors
  const { currentEmployee, loading: empLoading, error: empError, success } = useSelector((state) => state.employees);
  const { list: departments, loading: deptLoading } = useSelector((state) => state.departments);
  const { list: skillsList, loading: skillLoading } = useSelector((state) => state.skills);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  // File States
  const [profileImage, setProfileImage] = useState(null);
  const [resume, setResume] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Load departments, skills, and existing employee (if editing)
  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchSkills());
    dispatch(resetStatus());

    if (isEditMode) {
      dispatch(fetchEmployeeById(id));
    } else {
      dispatch(clearCurrentEmployee());
    }

    return () => {
      dispatch(clearCurrentEmployee());
    };
  }, [id, isEditMode, dispatch]);

  // Set form values if editing
  useEffect(() => {
    if (isEditMode && currentEmployee) {
      setName(currentEmployee.name || '');
      setEmail(currentEmployee.email || '');
      setPhone(currentEmployee.phone || '');
      setAddress(currentEmployee.address || '');
      setDepartmentId(currentEmployee.departmentId || '');
      setSelectedSkills(currentEmployee.skills ? currentEmployee.skills.map(s => s.id) : []);
    }
  }, [currentEmployee, isEditMode]);

  // Redirect on successful save
  useEffect(() => {
    if (success) {
      dispatch(resetStatus());
      navigate('/employees');
    }
  }, [success, navigate, dispatch]);

  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId) 
        : [...prev, skillId]
    );
  };

  const handleDocumentsChange = (e) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!departmentId) {
      alert('Please select a department');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('address', address);
    formData.append('departmentId', departmentId);
    formData.append('skills', JSON.stringify(selectedSkills));

    if (profileImage) {
      formData.append('profileImage', profileImage);
    }
    if (resume) {
      formData.append('resume', resume);
    }
    if (documents.length > 0) {
      documents.forEach(doc => {
        formData.append('documents', doc);
      });
    }

    if (isEditMode) {
      dispatch(updateEmployee({ id, formData }));
    } else {
      dispatch(createEmployee(formData));
    }
  };

  if (isEditMode && empLoading && !currentEmployee) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <p>Loading employee profile data...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Back button and title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/employees" style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            {isEditMode ? 'Edit Employee Profile' : 'Register New Employee'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.1rem' }}>
            {isEditMode ? 'Modify employee details, job settings, and attachments.' : 'Create a fresh record in the employee database.'}
          </p>
        </div>
      </div>

      {/* Error alert */}
      {empError && (
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
          <span>{empError}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* SECTION 1: Personal Details */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: '#fff' }}>
            1. Personal Details
          </h3>
          <div className="grid-2">
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="City, State, Country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Work Parameters */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: '#fff' }}>
            2. Department & Skills Configuration
          </h3>
          <div className="grid-2">
            {/* Department */}
            <div className="form-group">
              <label className="form-label">Department</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                <select
                  className="form-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skills checklist */}
            <div className="form-group">
              <label className="form-label">Select Skills</label>
              <div className="glass-panel" style={{
                background: 'rgba(255,255,255,0.01)',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                maxHeight: '140px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {skillsList.length > 0 ? (
                  skillsList.map(skill => (
                    <label key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill.id)}
                        onChange={() => handleSkillToggle(skill.id)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      {skill.name}
                    </label>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                    No skills in database. Please add skills in Skills Master first.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Documents and Files */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: '#fff' }}>
            3. Documents & Attachments Uploads
          </h3>
          <div className="grid-3">
            {/* Profile Image */}
            <div className="form-group">
              <label className="form-label">Profile Image (Image)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profileImage" className="file-upload-zone" style={{ padding: '1rem', minHeight: '120px' }}>
                  <Upload size={20} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {profileImage ? profileImage.name : (isEditMode ? 'Replace Image' : 'Select Image')}
                  </span>
                </label>
              </div>
            </div>

            {/* Resume */}
            <div className="form-group">
              <label className="form-label">Resume Document (PDF/Doc)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="file"
                  id="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="resume" className="file-upload-zone" style={{ padding: '1rem', minHeight: '120px' }}>
                  <Upload size={20} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {resume ? resume.name : (isEditMode ? 'Replace Resume' : 'Select PDF/Word')}
                  </span>
                </label>
              </div>
            </div>

            {/* Other Documents */}
            <div className="form-group">
              <label className="form-label">Verify Docs (Multiple)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="file"
                  id="documents"
                  multiple
                  onChange={handleDocumentsChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="documents" className="file-upload-zone" style={{ padding: '1rem', minHeight: '120px' }}>
                  <Upload size={20} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {documents.length > 0 ? `${documents.length} files selected` : (isEditMode ? 'Replace Documents' : 'Select Files')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          marginTop: '1rem'
        }}>
          <Link to="/employees" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={empLoading || deptLoading || skillLoading}
            style={{ minWidth: '140px' }}
          >
            <Save size={18} /> {empLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
