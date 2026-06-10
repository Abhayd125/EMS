import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from '../redux/slices/notificationSlice';
import { Bell, X, Check, Trash2, Calendar, ShieldCheck, Mail, Info } from 'lucide-react';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { list: notifications, loading } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleDelete = (id) => {
    dispatch(deleteNotification(id));
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'LEAVE': return <Calendar size={18} color="#ef4444" />;
      case 'ASSET': return <Mail size={18} color="#f43f5e" />;
      default: return <Info size={18} color="#9ca3af" />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      maxWidth: '400px',
      height: '100vh',
      background: 'rgba(10, 10, 12, 0.95)',
      backdropFilter: 'blur(20px)',
      boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
      borderLeft: '1px solid rgba(239, 68, 68, 0.2)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      animation: 'slideIn 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bell size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Notifications</h3>
          {unreadCount > 0 && (
            <span className="badge badge-primary">{unreadCount} new</span>
          )}
        </div>
        <button 
          onClick={onClose} 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          <X size={18} />
        </button>
      </div>

      {/* Action Bar */}
      {unreadCount > 0 && (
        <div style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(239, 68, 68, 0.02)'
        }}>
          <button 
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Check size={14} /> Mark all read
          </button>
        </div>
      )}

      {/* List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <ShieldCheck size={36} color="var(--text-muted)" />
            <p style={{ fontSize: '0.9rem' }}>You're all caught up! No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => (
              <div 
                key={n.id} 
                style={{
                  background: n.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(239, 68, 68, 0.04)',
                  border: n.isRead ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  gap: '0.75rem',
                  position: 'relative',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ marginTop: '0.2rem' }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1, paddingRight: '2rem' }}>
                  <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: n.isRead ? 600 : 700,
                    color: n.isRead ? 'var(--text-secondary)' : '#fff',
                    marginBottom: '0.25rem'
                  }}>{n.title}</h4>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4',
                    marginBottom: '0.5rem'
                  }}>{n.message}</p>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.3)' }}>
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {!n.isRead && (
                    <button 
                      onClick={() => handleMarkRead(n.id)}
                      title="Mark as read"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: 'none',
                        color: '#10b981',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={12} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(n.id)}
                    title="Delete"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: '#ef4444',
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPanel;
