import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import store from './redux/store';
import { checkAuthStatus } from './redux/slices/authSlice';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeForm from './pages/EmployeeForm';
import Departments from './pages/Departments';
import Skills from './pages/Skills';
import Profile from './pages/Profile';
import Leaves from './pages/Leaves';
import LeaveApprovals from './pages/LeaveApprovals';
import Assets from './pages/Assets';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';

// App Logic Component
const AppRoutes = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check initial authentication state (fetches user profile if token is alive)
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Unauthorized page */}
      <Route path="/unauthorized" element={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', height: '100vh', background: '#050505', color: '#fff', textAlign: 'center', padding: '1rem' }}>
          <h2 style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You do not have the required administrative or manager roles to view this resource.</p>
          <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Return to Dashboard</a>
        </div>
      } />

      {/* Protected Routes (Authenticated users only) */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/employees" element={
        <ProtectedRoute>
          <Layout>
            <Employees />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin/HR Protected Routes */}
      <Route path="/employees/new" element={
        <ProtectedRoute restrictTo={['ADMIN', 'HR']}>
          <Layout>
            <EmployeeForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/employees/edit/:id" element={
        <ProtectedRoute restrictTo={['ADMIN', 'HR']}>
          <Layout>
            <EmployeeForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/departments" element={
        <ProtectedRoute restrictTo={['ADMIN', 'HR']}>
          <Layout>
            <Departments />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/skills" element={
        <ProtectedRoute restrictTo={['ADMIN', 'HR']}>
          <Layout>
            <Skills />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Leave Management Routes */}
      <Route path="/leaves" element={
        <ProtectedRoute>
          <Layout>
            <Leaves />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/leaves/approvals" element={
        <ProtectedRoute restrictTo={['ADMIN', 'HR', 'MANAGER']}>
          <Layout>
            <LeaveApprovals />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/assets" element={
        <ProtectedRoute>
          <Layout>
            <Assets />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/attendance" element={
        <ProtectedRoute>
          <Layout>
            <Attendance />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/payroll" element={
        <ProtectedRoute>
          <Layout>
            <Payroll />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/performance" element={
        <ProtectedRoute>
          <Layout>
            <Performance />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute restrictTo={['ADMIN']}>
          <Layout>
            <Users />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute restrictTo={['ADMIN', 'HR']}>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App wrapping Provider
function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
