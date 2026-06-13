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
  const [basicPay, setBasicPay] = useState('');
  const [pf, setPf] = useState('');
  const [gis, setGis] = useState('');
  const [recovery, setRecovery] = useState('');
  const [advance, setAdvance] = useState('');
  const [tax, setTax] = useState('');
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
      setBasicPay('');
      setPf('');
      setGis('');
      setRecovery('');
      setAdvance('');
      setTax('');
      setPayMonth('');
      setSelectedEmpId('');
      dispatch(fetchPayrolls(isAdminOrHR ? null : currentUser.employeeId));
      const timer = setTimeout(() => dispatch(clearPayrollStatus()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch, isAdminOrHR, currentUser]);

  useEffect(() => {
    if (basicPay) {
      const basic = parseFloat(basicPay || 0);
      const allowance = basic * 0.50;
      const computedPf = ((basic + allowance) * 0.10).toFixed(2);
      setPf(computedPf);
    } else {
      setPf('');
    }
  }, [basicPay]);

  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedEmpId && isAdminOrHR) {
      setValidationError('Please select an employee');
      return;
    }

    if (!basicPay || parseFloat(basicPay) <= 0) {
      setValidationError('Basic pay must be a positive number');
      return;
    }

    if (!payMonth) {
      setValidationError('Please select a payment month');
      return;
    }

    const basicVal = parseFloat(basicPay);
    const allowanceVal = basicVal * 0.50;
    const calculatedPf = parseFloat(((basicVal + allowanceVal) * 0.10).toFixed(2));

    const payload = {
      basicPay: basicVal,
      pf: calculatedPf,
      gis: parseFloat(gis || 0),
      recovery: parseFloat(recovery || 0),
      advance: parseFloat(advance || 0),
      tax: parseFloat(tax || 0),
      payMonth,
      status: 'PAID'
    };

    const targetEmpId = isAdminOrHR ? selectedEmpId : currentUser.employeeId;

    dispatch(updatePayroll({ employeeId: targetEmpId, payrollData: payload }));
  };

  const calculateNet = () => {
    const basic = parseFloat(basicPay || 0);
    const allow = basic * 0.50;
    const hra = basic * 0.05;
    const pfDeduct = parseFloat(((basic + allow) * 0.10).toFixed(2));
    const gisDeduct = parseFloat(gis || 0);
    const recDeduct = parseFloat(recovery || 0);
    const advDeduct = parseFloat(advance || 0);
    const taxDeduct = parseFloat(tax || 0);

    const additions = basic + allow + hra;
    const deductions = pfDeduct + gisDeduct + recDeduct + advDeduct + taxDeduct;

    return Math.max(0, additions - deductions).toFixed(2);
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
                {/* Basic Pay */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Basic Pay (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Basic Pay Amount"
                    value={basicPay}
                    onChange={(e) => setBasicPay(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                {/* Auto Allowance */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Allowance (50% - Auto)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={basicPay ? `₹${(parseFloat(basicPay) * 0.5).toFixed(2)}` : '₹0.00'}
                    disabled
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Auto HRA */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">HRA (5% - Auto)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={basicPay ? `₹${(parseFloat(basicPay) * 0.05).toFixed(2)}` : '₹0.00'}
                    disabled
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', cursor: 'not-allowed' }}
                  />
                </div>

                {/* PF */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PF Deduction (10% - Auto)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pf ? `₹${parseFloat(pf).toFixed(2)}` : '₹0.00'}
                    disabled
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* GIS */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">GIS Deduction (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Group Insurance"
                    value={gis}
                    onChange={(e) => setGis(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Recovery */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Recovery (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Recovery Amount"
                    value={recovery}
                    onChange={(e) => setRecovery(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Advance */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Advance (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Salary Advance"
                    value={advance}
                    onChange={(e) => setAdvance(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Tax */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tax / TDS (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Income Tax"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
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
                  flexDirection: 'column', gap: '1rem'
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem' }}>
                        {pay.payMonth}
                      </span>
                      {isAdminOrHR && pay.employee && (
                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{pay.employee.name}</strong>
                      )}
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

                  {/* Additions and Deductions Columns */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1.5rem', 
                    fontSize: '0.85rem', 
                    background: 'rgba(255,255,255,0.01)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    {/* Additions Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#60a5fa', borderBottom: '1px solid rgba(96,165,250,0.2)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>Additions</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Basic Pay:</span>
                        <strong>₹{pay.basicPay}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Allowance (50%):</span>
                        <strong>₹{pay.allowance}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>HRA (5%):</span>
                        <strong>₹{pay.hra}</strong>
                      </div>
                    </div>

                    {/* Deductions Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#f87171', borderBottom: '1px solid rgba(248,113,113,0.2)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>Deductions</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>PF:</span>
                        <strong>-₹{pay.pf}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>GIS:</span>
                        <strong>-₹{pay.gis}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Recovery:</span>
                        <strong>-₹{pay.recovery}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Advance:</span>
                        <strong>-₹{pay.advance}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Tax:</span>
                        <strong>-₹{pay.tax}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Net Disbursed summary row */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center', 
                    paddingTop: '0.5rem', 
                    borderTop: '1px dashed rgba(255,255,255,0.05)',
                    width: '100%'
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Net Disbursed</span>
                      <strong style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: 800 }}>₹{pay.netSalary}</strong>
                    </div>
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
