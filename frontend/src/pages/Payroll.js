import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPayrolls, updatePayroll, clearPayrollStatus } from '../redux/slices/payrollSlice';
import { fetchEmployees } from '../redux/slices/employeeSlice';
import { 
  CreditCard, 
  DollarSign, 
  User, 
  Calendar, 
  Calculator, 
  Save, 
  FileText, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Payroll = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { list: payrolls, loading, error, success } = useSelector((state) => state.payroll);
  const { list: employees } = useSelector((state) => state.employees);

  // Admin Setup States
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [allowance, setAllowance] = useState('');
  const [pf, setPf] = useState('');
  const [tds, setTds] = useState('');
  const [payMonth, setPayMonth] = useState('');
  const [validationError, setValidationError] = useState('');

  const isAdminOrHR = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  useEffect(() => {
    if (isAdminOrHR) {
      dispatch(fetchEmployees());
      dispatch(fetchPayrolls());
    } else if (currentUser?.employeeId) {
      dispatch(fetchPayrolls(currentUser.employeeId));
    }
  }, [dispatch, isAdminOrHR, currentUser]);

  useEffect(() => {
    if (success) {
      setBaseSalary('');
      setAllowance('');
      setPf('');
      setTds('');
      setPayMonth('');
      setSelectedEmpId('');
      dispatch(fetchPayrolls(isAdminOrHR ? null : currentUser.employeeId));
      const timer = setTimeout(() => dispatch(clearPayrollStatus()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch, isAdminOrHR, currentUser]);

  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedEmpId && isAdminOrHR) {
      setValidationError('Please select an employee');
      return;
    }

    if (!baseSalary || parseFloat(baseSalary) <= 0) {
      setValidationError('Base salary must be a positive number');
      return;
    }

    if (!payMonth) {
      setValidationError('Please select a payment month');
      return;
    }

    const payload = {
      baseSalary: parseFloat(baseSalary),
      allowance: parseFloat(allowance || 0),
      pf: parseFloat(pf || 0),
      tds: parseFloat(tds || 0),
      payMonth,
      status: 'PAID'
    };

    const targetEmpId = isAdminOrHR ? selectedEmpId : currentUser.employeeId;

    dispatch(updatePayroll({ employeeId: targetEmpId, payrollData: payload }));
  };

  const calculateNet = () => {
    const base = parseFloat(baseSalary || 0);
    const allow = parseFloat(allowance || 0);
    const pfDeduct = parseFloat(pf || 0);
    const tdsDeduct = parseFloat(tds || 0);
    return Math.max(0, base + allow - pfDeduct - tdsDeduct).toFixed(2);
  };

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Payroll & Salary Hub</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {isAdminOrHR 
            ? 'Adjust employee salaries, manage deductions (TDS, PF), and release monthly pay summaries.'
            : 'Access your secure monthly salary payslips, deductions overview, and bank statements.'}
        </p>
      </div>

      {/* Status Alerts */}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(16, 185, 129, 0.12)', color: '#34d399',
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle size={18} />
          <span>Payroll record released successfully!</span>
        </div>
      )}

      {(validationError || error) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <AlertCircle size={18} />
          <span>{validationError || error}</span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isAdminOrHR ? '1fr 1.5fr' : '1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Admin release form */}
        {isAdminOrHR && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={18} color="var(--primary)" /> release Salary Slips
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Employee */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Employee</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <select
                    className="form-select"
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Month */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Month</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="month"
                    className="form-input"
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Base Salary */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Base Salary</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Base Amount"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                {/* Allowance */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Allowance</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Allowances"
                    value={allowance}
                    onChange={(e) => setAllowance(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* PF */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PF Deduction</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Provident Fund"
                    value={pf}
                    onChange={(e) => setPf(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* TDS */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">TDS Tax</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Tax Deduct"
                    value={tds}
                    onChange={(e) => setTds(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Net Salary Preview */}
              <div className="glass-panel" style={{
                padding: '1rem', background: 'rgba(255,255,255,0.01)',
                border: '1px dashed var(--border)', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calculated Net Salary:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{calculateNet()}
                </span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px', marginTop: '0.5rem' }} disabled={loading}>
                <Save size={16} /> {loading ? 'Saving...' : 'Release Payroll Slip'}
              </button>
            </form>
          </div>
        )}

        {/* Right Column: Payslip history list */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--primary)" /> {isAdminOrHR ? 'Company Payroll History Registry' : 'My Salary Slips'}
          </h3>

          {loading && payrolls.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading payslips...</p>
          ) : payrolls.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {payrolls.map((pay) => (
                <div key={pay.id} className="glass-panel" style={{
                  padding: '1.5rem', background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
                }}>
                  {/* Left info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem' }}>
                        {pay.payMonth}
                      </span>
                      {isAdminOrHR && pay.employee && (
                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{pay.employee.name}</strong>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>Base: ₹{pay.baseSalary}</span>
                      <span>Allow: ₹{pay.allowance}</span>
                      <span>PF: -₹{pay.pf}</span>
                      <span>TDS: -₹{pay.tds}</span>
                    </div>
                  </div>

                  {/* Right Net salary info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Net Disbursed</span>
                      <strong style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: 800 }}>₹{pay.netSalary}</strong>
                    </div>

                    <button 
                      onClick={() => {
                        window.print();
                      }}
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Print Payslip Document"
                    >
                      <FileText size={14} /> Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <DollarSign size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No monthly salary slips released yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payroll;
