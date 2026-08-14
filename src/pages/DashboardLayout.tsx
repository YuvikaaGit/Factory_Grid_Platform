import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Factory, Package, FileText, Tag, 
  ShoppingBag, Receipt, ShieldAlert, BarChart3, Bell, Settings,
  Search, ChevronDown, Home, Menu, X, Sun, Moon, Sparkles, Command,
  ChevronLeft, PanelLeftClose, PanelLeftOpen, Pin, Clock, Star, LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

import { CommandPalette } from '../components/common/CommandPalette';
import { AICopilotDrawer } from '../components/common/AICopilotDrawer';
import { RoleSwitcherDropdown } from '../components/common/RoleSwitcherDropdown';
import { LogoMark } from '../components/common/LogoMark';

import { Dashboards } from '../components/modules/Dashboards';
import { CustomerModule } from '../components/modules/CustomerModule';
import { ManufacturerModule } from '../components/modules/ManufacturerModule';
import { ProductCatalogModule } from '../components/modules/ProductCatalogModule';
import { RFQModule } from '../components/modules/RFQModule';
import { QuoteModule } from '../components/modules/QuoteModule';
import { OrderModule } from '../components/modules/OrderModule';
import { InvoiceModule } from '../components/modules/InvoiceModule';
import { ComplianceModule } from '../components/modules/ComplianceModule';
import { AnalyticsModule } from '../components/modules/AnalyticsModule';
import { NotificationsModule } from '../components/modules/NotificationsModule';
import { SettingsModule } from '../components/modules/SettingsModule';
import { BuyerOnboardingWizard } from '../components/modules/BuyerOnboardingWizard';
import { ManufacturerOnboardingWizard } from '../components/modules/ManufacturerOnboardingWizard';
import { ShipmentModule } from '../components/modules/ShipmentModule';
import { BuyerOrderTrackingModule } from '../components/modules/BuyerOrderTrackingModule';
import { AccountsModule } from '../components/modules/AccountsModule';
import { ReportsModule } from '../components/modules/ReportsModule';
import { ManufacturerWorkspaceModule } from '../components/modules/ManufacturerWorkspaceModule';
import { SalesQualificationModule } from '../components/modules/SalesQualificationModule';
import { AdminApprovalModule } from '../components/modules/AdminApprovalModule';
import { BuyerWorkspaceModule } from '../components/modules/BuyerWorkspaceModule';
import { ProductionExecutionModule } from '../components/modules/ProductionExecutionModule';
import { CustomerVerificationModule } from '../components/modules/CustomerVerificationModule';
import { ManufacturerDashboardModule } from '../components/modules/ManufacturerDashboardModule';
import { Truck, UserCheck, FileCheck, Landmark, PieChart, Cpu, Key } from 'lucide-react';

interface DashboardLayoutProps {
  onNavigate: (page: string) => void;
}

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Executive Workspace', icon: LayoutDashboard, roles: ['BUYER','COMPLIANCE_OFFICER','ADMIN','SALES_MANAGER','ACCOUNTS_MANAGER'] },
      { id: 'sales-qualification', label: 'Sales Qualification Desk', icon: UserCheck, roles: ['SALES_MANAGER','ADMIN'] },
      { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, roles: ['SUPPLIER'] },
      { id: 'analytics', label: 'Analytics & BI', icon: BarChart3, roles: ['BUYER','ADMIN','SALES_MANAGER','ACCOUNTS_MANAGER'] },
    ],
  },
  {
    label: 'Manufacturing Operations',
    items: [
      { id: 'products', label: 'My Product Catalog', icon: Package, roles: ['SUPPLIER'] },
      { id: 'mfg-workspace', label: 'Manufacturing Workspace', icon: Cpu, roles: ['SUPPLIER'] },
      { id: 'production-planning', label: 'Production Planning', icon: Cpu, roles: ['SUPPLIER'] },
      { id: 'rfqs', label: 'Assigned RFQs', icon: FileText, badge: 'rfq', roles: ['SUPPLIER'] },
      { id: 'quotes', label: 'Quote Submissions', icon: Tag, roles: ['SUPPLIER'] },
      { id: 'orders', label: 'Sub-Order Management', icon: ShoppingBag, badge: 'order', roles: ['SUPPLIER'] },
      { id: 'shipments', label: 'Dispatch & Tracking', icon: Truck, roles: ['SUPPLIER'] },
      { id: 'invoices', label: 'Invoices & Payments', icon: Receipt, roles: ['SUPPLIER'] },
    ],
  },
  {
    label: 'Procurement & Sourcing',
    items: [
      { id: 'rfqs', label: 'RFQ Center', icon: FileText, badge: 'rfq', roles: ['BUYER','SALES_MANAGER','ADMIN'] },
      { id: 'quotes', label: 'Quote Comparison', icon: Tag, roles: ['BUYER','ADMIN'] },
      { id: 'orders', label: 'Master Orders & Splitting', icon: ShoppingBag, badge: 'order', roles: ['BUYER','ADMIN'] },
      { id: 'products', label: 'Product Catalog', icon: Package, roles: ['BUYER','ADMIN'] },
    ],
  },
  {
    label: 'Operations & Directory',
    items: [
      { id: 'customers', label: 'Customer Directory', icon: Users, roles: ['SALES_MANAGER','ACCOUNTS_MANAGER','ADMIN'] },
      { id: 'manufacturers', label: 'Verified Manufacturers', icon: Factory, roles: ['BUYER','SALES_MANAGER','ADMIN'] },
      { id: 'shipments', label: 'Cold-Chain Telemetry', icon: Truck, roles: ['BUYER','ADMIN'] },
      { id: 'buyer-tracking', label: 'Live Order Tracking', icon: FileCheck, roles: ['BUYER'] },
    ],
  },
  {
    label: 'Finance & Compliance',
    items: [
      { id: 'invoices', label: 'Invoices & AR', icon: Receipt, roles: ['BUYER','ACCOUNTS_MANAGER','ADMIN'] },
      { id: 'accounts', label: 'Treasury & Accounts Ledger', icon: Landmark, roles: ['ACCOUNTS_MANAGER','ADMIN'] },
      { id: 'customer-verification', label: 'Customer Verification Desk', icon: UserCheck, badge: 'customer-verification', roles: ['COMPLIANCE_OFFICER','ADMIN','SALES_MANAGER'] },
      { id: 'compliance', label: 'Regulatory Compliance Desk', icon: ShieldAlert, badge: 'compliance', roles: ['COMPLIANCE_OFFICER','ADMIN'] },
      { id: 'reports', label: 'Executive Reports', icon: PieChart, roles: ['BUYER','ADMIN','SALES_MANAGER','ACCOUNTS_MANAGER','COMPLIANCE_OFFICER'] },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { id: 'products', label: 'Product Catalog', icon: Package, roles: ['ADMIN'] },
    ],
  },
  {
    label: 'System Admin',
    items: [
      { id: 'admin-approval', label: 'Platform Admin Approval', icon: Key, roles: ['ADMIN'] },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: 'notif', roles: ['BUYER','SUPPLIER','COMPLIANCE_OFFICER','ADMIN','SALES_MANAGER','ACCOUNTS_MANAGER'] },
      { id: 'settings', label: 'System Control Center', icon: Settings, roles: ['ADMIN'] },
    ],
  },
];

const roleAvatarColors: Record<UserRole, string> = {
  BUYER: '#2563EB',
  SUPPLIER: '#0D9488',
  COMPLIANCE_OFFICER: '#D97706',
  ADMIN: '#4F46E5',
  SALES_MANAGER: '#059669',
  ACCOUNTS_MANAGER: '#B45309',
};

// React Error Boundary Class Component for Workspace Safety
class WorkspaceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WorkspaceErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 32, margin: '20px auto', maxWidth: 600, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={24} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Something went wrong while loading the manufacturer workspace.
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, maxWidth: 450 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred in this module.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            Reload Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onNavigate }) => {
  const { currentRole, setCurrentRole, activeTab, setActiveTab, complianceCases, rfqs, orders, notifications, isCreateRfqDrawerOpen, customerVerifications, logout } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pendingCompliance = complianceCases.filter(c => c.status === 'UNDER_REVIEW').length;
  const pendingCustomerVerifications = customerVerifications.filter(c => c.verificationStatus === 'Under Review' || c.verificationStatus === 'Pending').length;
  const activeRfqs = rfqs.filter(r => r.status === 'PRICING_IN_PROGRESS').length;
  const activeOrders = orders.filter(o => o.status === 'IN_PRODUCTION').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const getBadgeCount = (badge: string | undefined) => {
    if (badge === 'rfq') return activeRfqs;
    if (badge === 'compliance') return pendingCompliance;
    if (badge === 'customer-verification') return pendingCustomerVerifications;
    if (badge === 'order') return activeOrders;
    if (badge === 'notif') return unreadNotifs;
    return 0;
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return currentRole === 'BUYER' ? <BuyerWorkspaceModule /> : currentRole === 'SUPPLIER' ? <ManufacturerDashboardModule /> : <Dashboards />;
      case 'buyer-workspace': return <BuyerWorkspaceModule />;
      case 'buyer-onboarding': return <BuyerOnboardingWizard />;
      case 'mfg-onboarding': return <ManufacturerOnboardingWizard />;
      case 'mfg-workspace': return <ManufacturerWorkspaceModule />;
      case 'production-planning': return <ProductionExecutionModule onNavigateTab={handleTabClick} />;
      case 'sales-qualification': return <SalesQualificationModule />;
      case 'customers': return <CustomerModule />;
      case 'manufacturers': return <ManufacturerModule />;
      case 'products': return <ProductCatalogModule />;
      case 'rfqs': return <RFQModule />;
      case 'quotes': return <QuoteModule />;
      case 'orders': return <OrderModule />;
      case 'sub-orders': return <OrderModule />;
      case 'shipments': return <ShipmentModule />;
      case 'buyer-tracking': return <BuyerOrderTrackingModule />;
      case 'invoices': return <InvoiceModule />;
      case 'accounts': return <AccountsModule />;
      case 'customer-verification': return <CustomerVerificationModule />;
      case 'compliance': return <ComplianceModule />;
      case 'reports': return <ReportsModule />;
      case 'analytics': return <AnalyticsModule />;
      case 'notifications': return <NotificationsModule />;
      case 'settings': return <SettingsModule />;
      case 'admin-approval': return <AdminApprovalModule />;
      default: return <Dashboards />;
    }
  };

  return (
    <div style={{
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
      gridTemplateColumns: isMobile ? undefined : (sidebarCollapsed ? '72px 1fr' : '260px 1fr'),
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-app)',
      transition: 'grid-template-columns 200ms ease'
    }}>
      {/* Command Palette Modal */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onSelectAction={tab => handleTabClick(tab)} />

      {/* AI Copilot Side Drawer */}
      <AICopilotDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Mobile Backdrop Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)'
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        transition: 'transform 250ms ease, width 200ms ease',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: isMobile ? 999 : 1,
        width: isMobile ? '280px' : undefined,
        transform: isMobile ? (mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        boxShadow: isMobile && mobileMenuOpen ? '8px 0 24px rgba(0,0,0,0.3)' : 'none'
      }}>
        {/* Sidebar Brand Header */}
        <div style={{ padding: (sidebarCollapsed && !isMobile) ? '16px 12px' : '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => onNavigate('landing')}>
            <div style={{ padding: 4, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogoMark size={24} color="#FFFFFF" />
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>FactoryGrid</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Enterprise B2B</div>
              </div>
            )}
          </div>
          {isMobile ? (
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
            >
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4 }}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>

        {/* Sidebar Navigation Items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navGroups.map(group => {
            const visibleItems = group.items.filter(item => item.roles.includes(currentRole));
            if (!visibleItems.length) return null;
            return (
              <div key={group.label} style={{ marginBottom: 16 }}>
                {!sidebarCollapsed && (
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '4px 12px 6px' }}>
                    {group.label}
                  </div>
                )}
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const count = getBadgeCount((item as any).badge);
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      title={(sidebarCollapsed && !isMobile) ? item.label : undefined}
                      style={{
                        border: 'none',
                        width: '100%',
                        background: isActive ? 'rgba(20, 184, 166, 0.12)' : 'transparent',
                        borderLeft: isActive ? '3px solid #14B8A6' : '3px solid transparent',
                        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px',
                        justify: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                        borderRadius: '0 6px 6px 0',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 120ms ease',
                        marginBottom: 2,
                        position: 'relative'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Icon size={16} style={{ flexShrink: 0, color: isActive ? '#14B8A6' : 'rgba(255,255,255,0.5)' }} />
                      {(!sidebarCollapsed || isMobile) && <span style={{ flex: 1 }}>{item.label}</span>}
                      {count > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          color: '#FFFFFF', background: '#14B8A6',
                          padding: '1px 6px', borderRadius: 999,
                          position: (sidebarCollapsed && !isMobile) ? 'absolute' : 'static',
                          top: (sidebarCollapsed && !isMobile) ? 4 : undefined,
                          right: (sidebarCollapsed && !isMobile) ? 4 : undefined
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar User Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            onClick={() => onNavigate('landing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              cursor: 'pointer',
              justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start'
            }}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: roleAvatarColors[currentRole],
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {currentRole.slice(0, 2)}
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentRole === 'BUYER' ? 'Apex Pharma' : currentRole === 'SUPPLIER' ? 'SunBio Labs' : 'Executive User'}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{currentRole.replace(/_/g, ' ')}</div>
              </div>
            )}
            {(!sidebarCollapsed || isMobile) && <Home size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
          </div>

          <button
            onClick={() => {
              logout();
              onNavigate('landing');
            }}
            style={{
              width: '100%',
              padding: '7px 12px',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#EF4444',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
              gap: 8
            }}
          >
            <LogOut size={13} />
            {(!sidebarCollapsed || isMobile) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)', width: '100%' }}>
        {/* Enterprise Topbar */}
        <header style={{
          height: 56,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: isMobile ? '0 12px' : '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxShadow: 'var(--shadow-subtle)',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, minWidth: 0 }}>
            {/* Mobile Hamburger Toggle Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Menu size={18} />
              </button>
            )}

            {/* Breadcrumb Path */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>FactoryGrid</span>
                <span>/</span>
                <span style={{ color: 'var(--text-secondary)' }}>{currentRole.replace(/_/g, ' ').toLowerCase()}</span>
                <span>/</span>
                <span style={{ color: 'var(--c-primary)', fontWeight: 700, textTransform: 'capitalize' }}>
                  {activeTab.replace('-', ' ')}
                </span>
              </div>
            )}

            {/* Global Search Bar Trigger */}
            <div
              onClick={() => setCmdOpen(true)}
              style={{
                cursor: 'pointer',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: isMobile ? '6px 10px' : '6px 14px',
                width: isMobile ? 'auto' : 320,
                maxWidth: 320,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              {!isMobile && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Search RFQs, products, manufacturers...</span>}
              {!isMobile && <kbd className="ent-mono" style={{ fontSize: 10, color: 'var(--text-quaternary)', border: '1px solid var(--border-default)', padding: '1px 5px', borderRadius: 4, background: 'var(--bg-surface)' }}>⌘K</kbd>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, flexShrink: 0 }}>
            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 140ms ease'
              }}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} style={{ color: '#F59E0B' }} />}
            </button>

            {/* AI Copilot Button */}
            <button
              onClick={() => setAiOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                padding: isMobile ? '4px 8px' : '4px 12px 4px 6px',
                borderRadius: 999,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 140ms ease'
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0F766E, #0284C7)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={12} />
              </div>
              {!isMobile && <span>AI Copilot</span>}
            </button>

            {/* Enterprise Role Switcher */}
            <RoleSwitcherDropdown />

            {/* Notification Bell */}
            <button
              onClick={() => handleTabClick('notifications')}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Bell size={15} />
              {unreadNotifs > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--c-danger)' }} />
              )}
            </button>
          </div>
        </header>

        {/* Workspace Dynamic Content Container */}
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 24, background: 'var(--bg-app)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <WorkspaceErrorBoundary>
                {renderContent()}
              </WorkspaceErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── SLIDE-OVER AI COPILOT ASSISTANT DRAWER ───────────── */}
      {aiOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: isMobile ? '100vw' : 440, maxWidth: '100vw', height: '100vh', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(15,23,42,0.12)' }}>
            
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>FactoryGrid AI Copilot</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>Contextual B2B Sourcing & Regulatory Assistant</div>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Suggested Contextual Actions</div>

              {[
                { title: 'Analyze Sealed RFQ Bids', desc: 'Compare pricing, lead times & WHO-GMP compliance across manufacturers', icon: '📊' },
                { title: 'Check Regulatory Compliance Risks', desc: 'Audit Drug Licenses & WHO-GMP expiry timelines', icon: '🛡' },
                { title: 'Calculate Procurement Savings', desc: 'Estimate multi-plant order allocation savings', icon: '💰' },
                { title: 'Draft Formulation Specification', desc: 'Auto-generate standard B2B pharma RFQ line specs', icon: '📑' },
              ].map((act, i) => (
                <div
                  key={i}
                  onClick={() => alert(`AI Copilot Executed Action: ${act.title}\n\nGenerating contextual analysis...`)}
                  style={{ padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', transition: 'all 150ms ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    <span>{act.icon}</span>
                    <span>{act.title}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>{act.desc}</div>
                </div>
              ))}

              <div style={{ marginTop: 'auto', borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Ask AI Assistant</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Ask about RFQs, orders, suppliers..."
                    style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }}
                  />
                  <button onClick={() => alert('AI query processed.')} style={{ height: 38, padding: '0 14px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
                    Send
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

