import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Check, ShoppingBag, Factory, ShieldAlert,
  Receipt, TrendingUp, Settings, Search, Command, Activity, Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface RoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeColor: string;
  iconBg: string;
  defaultTab: string;
  permissions: string[];
  shortcut: string;
  preview: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'BUYER',
    title: 'Procurement Console',
    subtitle: 'Apex Pharma Buyer Workspace',
    icon: ShoppingBag,
    badgeColor: '#0F766E',
    iconBg: '#CCFBF1',
    defaultTab: 'dashboard',
    permissions: ['Create RFQ', 'Approve Quotes', 'Issue Master PO'],
    shortcut: '⌘1',
    preview: 'Active Sourcing & Live Delivery Timeline'
  },
  {
    role: 'SUPPLIER',
    title: 'Operations Control Room',
    subtitle: 'SunBio Labs Manufacturing',
    icon: Factory,
    badgeColor: '#0284C7',
    iconBg: '#E0F2FE',
    defaultTab: 'dashboard',
    permissions: ['Submit Bids', 'Production Lane', 'Cold-Chain Dispatch'],
    shortcut: '⌘2',
    preview: 'Live Plant Queue & Active Production'
  },
  {
    role: 'SALES_MANAGER',
    title: 'Sales Qualification Desk',
    subtitle: 'Enterprise Demo & Lead Qualification',
    icon: TrendingUp,
    badgeColor: '#4338CA',
    iconBg: '#EEF2FF',
    defaultTab: 'sales-qualification',
    permissions: ['Lead Qualification', 'Schedule Demo', 'Forward to Compliance'],
    shortcut: '⌘3',
    preview: 'Incoming Demo Requests & Outreach Log'
  },
  {
    role: 'ACCOUNTS_MANAGER',
    title: 'Finance & Accounts',
    subtitle: 'GST Invoicing & Collection',
    icon: Receipt,
    badgeColor: '#B45309',
    iconBg: '#FEF3C7',
    defaultTab: 'invoices',
    permissions: ['AR Aging', 'GST Reconcile', 'Payment Entry'],
    shortcut: '⌘4',
    preview: 'AR Aging Heatmap & Cash Summary'
  },
  {
    role: 'COMPLIANCE_OFFICER',
    title: 'Compliance Desk',
    subtitle: 'Regulatory Approval & KYC',
    icon: ShieldAlert,
    badgeColor: '#6D28D9',
    iconBg: '#EDE9FE',
    defaultTab: 'compliance',
    permissions: ['WHO-GMP Audit', 'GSTIN Verify', 'Document Review'],
    shortcut: '⌘5',
    preview: 'Verification Queue & Expiry Alerts'
  },
  {
    role: 'ADMIN',
    title: 'Platform Admin',
    subtitle: 'System Health & Audit Logs',
    icon: Settings,
    badgeColor: '#0F172A',
    iconBg: '#F1F5F9',
    defaultTab: 'settings',
    permissions: ['RBAC Roles', 'API Health', 'System Audit'],
    shortcut: '⌘6',
    preview: 'Platform Health & User Activity'
  },
];

export const RoleSwitcherDropdown: React.FC = () => {
  const { currentRole, setCurrentRole, setActiveTab } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = roleOptions.find(o => o.role === currentRole) || roleOptions[0];
  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (opt: RoleOption) => {
    setCurrentRole(opt.role);
    setActiveTab(opt.defaultTab);
    setIsOpen(false);
  };

  const filteredOptions = roleOptions.filter(o =>
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Enterprise Workspace Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '5px 12px 5px 8px',
          cursor: 'pointer',
          boxShadow: isOpen ? 'var(--shadow-elevated)' : 'var(--shadow-subtle)',
          transition: 'all 140ms ease-out',
          outline: 'none',
        }}
      >
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ActiveIcon size={15} style={{ color: 'var(--text-primary)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 120 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {activeOption.title}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {activeOption.subtitle}
          </span>
        </div>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-tertiary)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: 4
          }}
        />
      </button>

      {/* Enterprise Switcher Drawer / Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 360,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 12,
              boxShadow: 'var(--shadow-floating)',
              zIndex: 1000,
            }}
          >
            {/* Header & Search Bar */}
            <div style={{ paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Workspace Switcher
                </span>
                <span className="ent-mono" style={{ fontSize: 10, color: 'var(--text-quaternary)' }}>
                  6 Active Roles
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Filter workspace by role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="ent-input"
                  style={{ paddingLeft: 30, height: 32, fontSize: 12 }}
                  autoFocus
                />
              </div>
            </div>

            {/* Role Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {filteredOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = currentRole === opt.role;

                return (
                  <button
                    key={opt.role}
                    onClick={() => handleSelectRole(opt)}
                    style={{
                      border: isSelected ? `1px solid ${opt.badgeColor}` : '1px solid var(--border-subtle)',
                      background: isSelected ? opt.iconBg : 'transparent',
                      borderRadius: 8,
                      padding: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 120ms ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: opt.iconBg,
                      border: `1px solid ${opt.badgeColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <Icon size={16} style={{ color: opt.badgeColor }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: isSelected ? 800 : 600, color: 'var(--text-primary)' }}>
                          {opt.title}
                        </span>
                        <kbd className="ent-mono" style={{ fontSize: 10, color: 'var(--text-quaternary)', border: '1px solid var(--border-default)', padding: '1px 4px', borderRadius: 4 }}>
                          {opt.shortcut}
                        </kbd>
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {opt.subtitle}
                      </div>

                      {/* Permissions tags */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                        {opt.permissions.map(perm => (
                          <span key={perm} style={{ fontSize: 9.5, color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1px 6px', borderRadius: 4 }}>
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: opt.badgeColor,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 4
                      }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

