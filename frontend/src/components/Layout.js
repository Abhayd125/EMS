import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/slices/authSlice';
import { 
  LayoutDashboard, 
  Users, 
  FolderTree, 
  Wrench, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  FileCheck,
  ClipboardList
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Departments', path: '/departments', icon: FolderTree, roles: ['ADMIN', 'HR'] },
    { name: 'Skills Master', path: '/skills', icon: Wrench, roles: ['ADMIN', 'HR'] },
    { name: 'Leaves', path: '/leaves', icon: FileCheck, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Approvals', path: '/leaves/approvals', icon: ClipboardList, roles: ['ADMIN', 'HR', 'MANAGER'] },
    { name: 'My Profile', path: '/profile', icon: UserCircle, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="app-container">
      {/* Mobile Top Bar */}
      <div className="mobile-header" style={{
        display: 'none',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck color="#ef4444" size={24} />
          <span style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(to right, #ef4444, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>i-EMS</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`glass-panel sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: '260px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem 1.5rem',
        borderRadius: 0,
        borderRight: '1px solid var(--border)',
        zIndex: 40,
        transition: 'var(--transition)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem' }}>
            <ShieldCheck color="#ef4444" size={28} />
            <span style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ef4444, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              i-SOFTZONE
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                               (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 500,
                    background: isActive ? 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.04) 100%)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'var(--transition)',
                  }}
                  className="nav-link-hover"
                >
                  <Icon size={20} color={isActive ? '#ef4444' : 'currentColor'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 0.5rem',
              borderTop: '1px solid var(--border)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
                <span className="badge badge-primary" style={{ alignSelf: 'flex-start', marginTop: '0.2rem', padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
              padding: '0.85rem 1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Main Content Container */}
      <main className="main-content" style={{ marginTop: sidebarOpen ? '60px' : '0' }}>
        {children}
      </main>

      {/* Sidebar CSS injection since we are using CSS variables and modular Layout styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .sidebar {
            position: fixed !important;
            top: 60px;
            bottom: 0;
            left: -260px;
            height: calc(100vh - 60px) !important;
            background: var(--bg-primary) !important;
          }
          .sidebar.open { left: 0 !important; }
          .main-content {
            padding-top: 5rem !important;
          }
        }
        .nav-link-hover:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.02) !important;
        }
      `}</style>
    </div>
  );
};

export default Layout;
