import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { RoleSwitcherDropdown } from '../common/RoleSwitcherDropdown';
import {
  Search, Bell, ShieldCheck, Sparkles
} from 'lucide-react';

export const Header: React.FC = () => {
  const { notifications } = useApp();
  const { theme, toggleTheme } = useTheme();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="ent-topbar">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          FactoryGrid
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
          Enterprise Procurement Platform
        </div>
      </div>

      {/* Global Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 12px', width: 340, transition: 'all 150ms' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
        <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder="Search RFQs, orders, suppliers..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit' }}
        />
        <span style={{ fontSize: 10, color: 'var(--text-quaternary)', fontWeight: 600 }}>⌘K</span>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Compliance Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--c-success-light)', border: '1px solid var(--c-success)', borderRadius: 6 }}>
          <ShieldCheck size={14} style={{ color: 'var(--c-success)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-success)' }}>Compliant</span>
        </div>

        {/* Role Switcher */}
        <RoleSwitcherDropdown />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{ width: 32, height: 32, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', transition: 'all 150ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          {theme === 'dark' ? <Sparkles size={15} /> : <Sparkles size={15} />}
        </button>

        {/* Notifications */}
        <button
          style={{ width: 32, height: 32, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', position: 'relative', transition: 'all 150ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, background: 'var(--c-danger)', borderRadius: '50%' }} />
          )}
        </button>

        {/* User Avatar */}
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, var(--c-primary), var(--c-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#FFFFFF', cursor: 'pointer' }}>
          VS
        </div>
      </div>
    </header>
  );
};
