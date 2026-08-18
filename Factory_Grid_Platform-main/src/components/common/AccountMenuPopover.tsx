import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Building2, FileCheck, KeyRound, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';

interface AccountMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPosition?: 'bottom-left' | 'top-right';
}

export const AccountMenuPopover: React.FC<AccountMenuPopoverProps> = ({
  isOpen,
  onClose,
  anchorPosition = 'bottom-left'
}) => {
  const { userProfile, orgProfile, currentRole, openProfileTab, logout } = useApp();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectOption = (subTab: 'personal' | 'organization' | 'documents' | 'security') => {
    openProfileTab(subTab);
    onClose();
  };

  const handleSignOut = () => {
    onClose();
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
  };

  const roleColors: Record<string, string> = {
    BUYER: '#2563EB',
    SUPPLIER: '#0D9488',
    COMPLIANCE_OFFICER: '#D97706',
    ADMIN: '#4F46E5',
    SALES_MANAGER: '#059669',
    ACCOUNTS_MANAGER: '#B45309',
  };

  const roleColor = roleColors[currentRole] || '#0D9488';

  const menuItems = [
    {
      id: 'personal',
      label: 'My Profile',
      sublabel: 'Personal details & credentials',
      icon: User,
      action: () => handleSelectOption('personal'),
    },
    {
      id: 'organization',
      label: 'Organization Profile',
      sublabel: 'Company info, address & tax IDs',
      icon: Building2,
      action: () => handleSelectOption('organization'),
    },
    {
      id: 'documents',
      label: 'Documents & Verification',
      sublabel: 'Licenses, GST & regulatory docs',
      icon: FileCheck,
      action: () => handleSelectOption('documents'),
    },
    {
      id: 'security',
      label: 'Change Password',
      sublabel: 'Security & login credentials',
      icon: KeyRound,
      action: () => handleSelectOption('security'),
    },
  ];

  const positionStyles: React.CSSProperties = anchorPosition === 'bottom-left'
    ? {
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: 12,
        zIndex: 9999,
      }
    : {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 12,
        zIndex: 9999,
      };

  return (
    <div
      ref={popoverRef}
      style={{
        ...positionStyles,
        width: 280,
        background: '#0F172A',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        color: '#FFFFFF',
        fontFamily: 'inherit',
      }}
    >
      {/* Header Profile Identity */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: roleColor,
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.2)',
            flexShrink: 0
          }}>
            {userProfile.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : currentRole.slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userProfile.fullName || 'User Profile'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
              {orgProfile.companyName || 'FactoryGrid Partner'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: roleColor }}>
              <ShieldCheck size={10} />
              {currentRole.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Options List */}
      <div style={{ padding: '6px' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: '#E2E8F0',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#E2E8F0';
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#14B8A6',
                flexShrink: 0
              }}>
                <Icon size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{item.label}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.sublabel}</div>
              </div>
              <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      {/* Sign Out Option */}
      <div style={{ padding: '6px 6px 8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#FCA5A5',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 120ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#FCA5A5';
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
