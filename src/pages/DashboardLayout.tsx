import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Factory, Package, FileText, Tag, Award,
  ShoppingBag, Receipt, ShieldAlert, BarChart3, Bell, Settings,
  Search, ChevronDown, ChevronRight, Home, Menu, X, Sun, Moon, Sparkles, Command,
  ChevronLeft, PanelLeftClose, PanelLeftOpen, Pin, Clock, Star, LogOut, Cpu, Truck, Landmark, UserCheck, PieChart, FileCheck, Key
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
import { ManufacturerVerificationModule } from '../components/modules/ManufacturerVerificationModule';
import { TrademarkVerificationModule } from '../components/modules/TrademarkVerificationModule';
import { BrandVerificationModule } from '../components/modules/BrandVerificationModule';
import { ManufacturerDashboardModule } from '../components/modules/ManufacturerDashboardModule';
import { ProfileModule } from '../components/modules/ProfileModule';
import { AccountMenuPopover } from '../components/common/AccountMenuPopover';
import { ManufacturerOrderHistoryModule } from '../components/modules/ManufacturerOrderHistoryModule';
import { ManufacturerSettingsModule } from '../components/modules/ManufacturerSettingsModule';

export interface ManufacturerNavGroup {
  key: string;
  label: string;
  defaultExpanded: boolean;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }>;
}

export const MANUFACTURER_NAV_GROUPS: ManufacturerNavGroup[] = [
  {
    key: 'WORKSPACE',
    label: 'WORKSPACE',
    defaultExpanded: true,
    items: [
      { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
      { id: 'products', label: 'My Product Catalog', icon: Package },
      { id: 'mfg-workspace', label: 'Manufacturing Workspace', icon: Cpu },
    ],
  },
  {
    key: 'PROCUREMENT',
    label: 'PROCUREMENT',
    defaultExpanded: true,
    items: [
      { id: 'rfqs', label: 'Assigned RFQs', icon: FileText, badge: 'rfq' },
      { id: 'quotes', label: 'Quote Submissions', icon: Tag },
    ],
  },
  {
    key: 'ORDERS',
    label: 'ORDERS',
    defaultExpanded: true,
    items: [
      { id: 'orders', label: 'Order Management', icon: ShoppingBag, badge: 'order' },
      { id: 'mfg-order-history', label: 'Order History', icon: Clock },
    ],
  },
  {
    key: 'FULFILLMENT',
    label: 'FULFILLMENT',
    defaultExpanded: true,
    items: [
      { id: 'production-planning', label: 'Production Planning', icon: Cpu },
      { id: 'shipments', label: 'Dispatch & Tracking', icon: Truck },
      { id: 'goods-received', label: 'Goods Received', icon: FileCheck },
    ],
  },
  {
    key: 'FINANCE',
    label: 'FINANCE',
    defaultExpanded: false,
    items: [
      { id: 'invoices', label: 'Invoices & Payments', icon: Receipt },
    ],
  },
  {
    key: 'ACCOUNT',
    label: 'ACCOUNT',
    defaultExpanded: false,
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: 'notif' },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export interface BuyerNavGroup {
  key: string;
  label: string;
  defaultExpanded: boolean;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }>;
}

export const BUYER_NAV_GROUPS: BuyerNavGroup[] = [
  {
    key: 'WORKSPACE',
    label: 'WORKSPACE',
    defaultExpanded: true,
    items: [
      { id: 'dashboard', label: 'Executive Workspace', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics & BI', icon: BarChart3 },
    ],
  },
  {
    key: 'PROCUREMENT',
    label: 'PROCUREMENT',
    defaultExpanded: true,
    items: [
      { id: 'my-orders', label: 'My Orders & History', icon: ShoppingBag, badge: 'order' },
      { id: 'rfqs', label: 'RFQ Center', icon: FileText, badge: 'rfq' },
      { id: 'quotes', label: 'Quote Comparison', icon: Tag },
    ],
  },
  {
    key: 'ORDER_MANAGEMENT',
    label: 'ORDER MANAGEMENT',
    defaultExpanded: true,
    items: [
      { id: 'orders', label: 'Master Order & PO Splitting', icon: ShoppingBag, badge: 'order' },
      { id: 'products', label: 'Product Catalog', icon: Package },
    ],
  },
  {
    key: 'OPERATIONS_DIRECTORY',
    label: 'OPERATIONS & DIRECTORY',
    defaultExpanded: false,
    items: [
      { id: 'manufacturers', label: 'Verified Manufacturers', icon: Factory },
      { id: 'shipments', label: 'Cold-Chain Telemetry', icon: Truck },
      { id: 'buyer-tracking', label: 'Live Order Tracking', icon: FileCheck },
    ],
  },
  {
    key: 'FINANCE',
    label: 'FINANCE',
    defaultExpanded: false,
    items: [
      { id: 'invoices', label: 'Invoices & AR', icon: Receipt },
    ],
  },
  {
    key: 'ACCOUNT',
    label: 'ACCOUNT',
    defaultExpanded: false,
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: 'notif' },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Executive Workspace', icon: LayoutDashboard, roles: ['BUYER', 'COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER'] },
      { id: 'sales-qualification', label: 'Sales Qualification Desk', icon: UserCheck, roles: ['SALES_MANAGER', 'ADMIN'] },
      { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, roles: ['SUPPLIER'] },
      { id: 'analytics', label: 'Analytics & BI', icon: BarChart3, roles: ['BUYER', 'ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER'] },
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
      { id: 'orders', label: 'Order Management', icon: ShoppingBag, badge: 'order', roles: ['SUPPLIER'] },
      { id: 'mfg-order-history', label: 'Order History', icon: Clock, roles: ['SUPPLIER'] },
      { id: 'shipments', label: 'Dispatch & Tracking', icon: Truck, roles: ['SUPPLIER'] },
      { id: 'invoices', label: 'Invoices & Payments', icon: Receipt, roles: ['SUPPLIER'] },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: 'notif', roles: ['SUPPLIER'] },
      { id: 'settings', label: 'Settings', icon: Settings, roles: ['SUPPLIER'] },
    ],
  },
  {
    label: 'Procurement & Sourcing',
    items: [
      { id: 'my-orders', label: 'My Orders & History', icon: ShoppingBag, badge: 'order', roles: ['BUYER'] },
      { id: 'rfqs', label: 'RFQ Center', icon: FileText, badge: 'rfq', roles: ['BUYER', 'SALES_MANAGER', 'ADMIN'] },
      { id: 'quotes', label: 'Quote Comparison', icon: Tag, roles: ['BUYER', 'ADMIN'] },
      { id: 'orders', label: 'Master Order & PO Splitting', icon: ShoppingBag, badge: 'order', roles: ['BUYER', 'ADMIN'] },
      { id: 'products', label: 'Product Catalog', icon: Package, roles: ['BUYER', 'ADMIN'] },
    ],
  },
  {
    label: 'Operations & Directory',
    items: [
      { id: 'customers', label: 'Customer Directory', icon: Users, roles: ['SALES_MANAGER', 'ACCOUNTS_MANAGER', 'ADMIN'] },
      { id: 'manufacturers', label: 'Verified Manufacturers', icon: Factory, roles: ['BUYER', 'SALES_MANAGER', 'ADMIN'] },
      { id: 'shipments', label: 'Cold-Chain Telemetry', icon: Truck, roles: ['BUYER', 'ADMIN'] },
      { id: 'buyer-tracking', label: 'Live Order Tracking', icon: FileCheck, roles: ['BUYER'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'invoices', label: 'Invoices & AR', icon: Receipt, roles: ['BUYER', 'ACCOUNTS_MANAGER', 'ADMIN'] },
      { id: 'accounts', label: 'Treasury & Accounts Ledger', icon: Landmark, roles: ['ACCOUNTS_MANAGER', 'ADMIN'] },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { id: 'customer-verification', label: 'Customer Verification', icon: UserCheck, badge: 'customer-verification', roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'BUYER'] },
      { id: 'manufacturer-verification', label: 'Manufacturer Verification', icon: Factory, badge: 'manufacturer-verification', roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'BUYER'] },
      { id: 'trademark-verification', label: 'Trademark Verification', icon: Tag, roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'BUYER'] },
      { id: 'brand-verification', label: 'Brand Verification', icon: Award, roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'BUYER'] },
      { id: 'compliance', label: 'Compliance Verification', icon: ShieldAlert, badge: 'compliance', roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'BUYER'] },
      { id: 'reports', label: 'Executive Reports', icon: PieChart, roles: ['BUYER', 'ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER', 'COMPLIANCE_OFFICER'] },
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
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: 'notif', roles: ['BUYER', 'SUPPLIER', 'COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER'] },
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
  const { currentRole, setCurrentRole, activeTab, setActiveTab, complianceCases, rfqs, orders, notifications, isCreateRfqDrawerOpen, customerVerifications, logout, userProfile, orgProfile } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if ((path === '/buyer' || path.startsWith('/buyer')) && currentRole !== 'BUYER') {
        setCurrentRole('BUYER');
      } else if ((path === '/supplier' || path.startsWith('/supplier')) && currentRole !== 'SUPPLIER') {
        setCurrentRole('SUPPLIER');
      } else if ((path === '/compliance' || path.startsWith('/compliance')) && currentRole !== 'COMPLIANCE_OFFICER') {
        setCurrentRole('COMPLIANCE_OFFICER');
      } else if ((path === '/sales' || path.startsWith('/sales')) && currentRole !== 'SALES_MANAGER') {
        setCurrentRole('SALES_MANAGER');
      } else if ((path === '/accounts' || path.startsWith('/accounts')) && currentRole !== 'ACCOUNTS_MANAGER') {
        setCurrentRole('ACCOUNTS_MANAGER');
      } else if ((path === '/admin' || path.startsWith('/admin')) && currentRole !== 'ADMIN') {
        setCurrentRole('ADMIN');
      }
    }
  }, []);

  const pendingCompliance = (complianceCases || []).filter(c => c && c.status === 'UNDER_REVIEW').length;
  const pendingCustomerVerifications = (customerVerifications || []).filter(c => c && (c.verificationStatus === 'Under Review' || c.verificationStatus === 'Pending')).length;
  const activeRfqs = (rfqs || []).filter(r => r && (r.status === 'PRICING_IN_PROGRESS' || r.status === 'Pricing In Progress' || r.status === 'SUBMITTED')).length;
  const activeOrders = (orders || []).filter(o => o && (o.status === 'IN_PRODUCTION' || o.status === 'OPEN' || o.status === 'APPROVED')).length;
  const unreadNotifs = (notifications || []).filter(n => n && !n.read).length;

  const getBadgeCount = (badge: string | undefined) => {
    if (badge === 'rfq') return activeRfqs;
    if (badge === 'compliance') return pendingCompliance;
    if (badge === 'customer-verification') return pendingCustomerVerifications;
    if (badge === 'order') return activeOrders;
    if (badge === 'notif') return unreadNotifs;
    return 0;
  };

  // Manufacturer Section Group Expansion State
  const [mfgGroupExpanded, setMfgGroupExpanded] = useState<Record<string, boolean>>({
    WORKSPACE: true,
    PROCUREMENT: true,
    ORDERS: true,
    FULFILLMENT: true,
    FINANCE: false,
    ACCOUNT: false
  });

  // Auto-expand group containing activeTab if currently collapsed
  useEffect(() => {
    if (currentRole === 'SUPPLIER' && activeTab) {
      const parentGroup = MANUFACTURER_NAV_GROUPS.find(group =>
        group.items.some(item => item.id === activeTab)
      );
      if (parentGroup && !mfgGroupExpanded[parentGroup.key]) {
        setMfgGroupExpanded(prev => ({
          ...prev,
          [parentGroup.key]: true
        }));
      }
    }
  }, [activeTab, currentRole]);

  const toggleMfgGroup = (groupKey: string) => {
    setMfgGroupExpanded(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Buyer Section Group Expansion State
  const [buyerGroupExpanded, setBuyerGroupExpanded] = useState<Record<string, boolean>>({
    WORKSPACE: true,
    PROCUREMENT: true,
    ORDER_MANAGEMENT: true,
    OPERATIONS_DIRECTORY: false,
    FINANCE: false,
    ACCOUNT: false
  });

  // Auto-expand buyer group containing activeTab if currently collapsed
  useEffect(() => {
    if (currentRole === 'BUYER' && activeTab) {
      const parentGroup = BUYER_NAV_GROUPS.find(group =>
        group.items.some(item => item.id === activeTab)
      );
      if (parentGroup && !buyerGroupExpanded[parentGroup.key]) {
        setBuyerGroupExpanded(prev => ({
          ...prev,
          [parentGroup.key]: true
        }));
      }
    }
  }, [activeTab, currentRole]);

  const toggleBuyerGroup = (groupKey: string) => {
    setBuyerGroupExpanded(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return currentRole === 'BUYER' ? <BuyerWorkspaceModule /> : currentRole === 'SUPPLIER' ? <ManufacturerDashboardModule /> : currentRole === 'COMPLIANCE_OFFICER' ? <CustomerVerificationModule /> : <Dashboards />;
      case 'profile': return <ProfileModule />;
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
      case 'mfg-order-history': return <ManufacturerOrderHistoryModule onNavigateTab={handleTabClick} />;
      case 'my-orders': return <BuyerOrderTrackingModule initialViewMode="ORDERS_LIST" />;
      case 'shipments': return <ShipmentModule onNavigateTab={handleTabClick} />;
      case 'goods-received': return currentRole === 'SUPPLIER' ? <ShipmentModule onNavigateTab={handleTabClick} /> : <BuyerOrderTrackingModule initialViewMode="ORDERS_LIST" />;
      case 'buyer-tracking': return <BuyerOrderTrackingModule initialViewMode="TRACKING_DETAIL" />;
      case 'invoices': return <InvoiceModule />;
      case 'accounts': return <AccountsModule />;
      case 'customer-verification': return <CustomerVerificationModule />;
      case 'manufacturer-verification': return <ManufacturerVerificationModule />;
      case 'trademark-verification': return <TrademarkVerificationModule />;
      case 'brand-verification': return <BrandVerificationModule />;
      case 'compliance': return <ComplianceModule />;
      case 'reports': return <ReportsModule />;
      case 'analytics': return <AnalyticsModule />;
      case 'notifications': return <NotificationsModule />;
      case 'settings':
        if (currentRole === 'SUPPLIER') {
          return <ManufacturerSettingsModule />;
        }
        return <SettingsModule />;
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
          {currentRole === 'SUPPLIER' ? (
            MANUFACTURER_NAV_GROUPS.map(group => {
              const isExpanded = mfgGroupExpanded[group.key] ?? group.defaultExpanded;
              const hasActiveChild = group.items.some(item => item.id === activeTab);
              const hasPendingBadge = group.items.some(item => getBadgeCount(item.badge) > 0);

              return (
                <div key={group.key} style={{ marginBottom: 12 }}>
                  {/* Section Group Header */}
                  {(!sidebarCollapsed || isMobile) ? (
                    <div
                      onClick={() => toggleMfgGroup(group.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '6px 12px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: hasActiveChild ? '#14B8A6' : 'rgba(255,255,255,0.45)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderRadius: 4,
                        transition: 'all 120ms ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                      onMouseLeave={e => e.currentTarget.style.color = hasActiveChild ? '#14B8A6' : 'rgba(255,255,255,0.45)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{group.label}</span>
                        {!isExpanded && hasPendingBadge && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#14B8A6' }} />
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  ) : (
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
                  )}

                  {/* Group Nav Items (shown when group is expanded OR sidebar is in collapsed icon mode) */}
                  {(isExpanded || (sidebarCollapsed && !isMobile)) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const count = getBadgeCount(item.badge);
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
                              padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px 8px 16px',
                              justify: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                              borderRadius: '0 6px 6px 0',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 120ms ease',
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
                  )}
                </div>
              );
            })
          ) : currentRole === 'BUYER' ? (
            BUYER_NAV_GROUPS.map(group => {
              const isExpanded = buyerGroupExpanded[group.key] ?? group.defaultExpanded;
              const hasActiveChild = group.items.some(item => item.id === activeTab);
              const hasPendingBadge = group.items.some(item => getBadgeCount(item.badge) > 0);

              return (
                <div key={group.key} style={{ marginBottom: 12 }}>
                  {/* Section Group Header */}
                  {(!sidebarCollapsed || isMobile) ? (
                    <div
                      onClick={() => toggleBuyerGroup(group.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '6px 12px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: hasActiveChild ? '#14B8A6' : 'rgba(255,255,255,0.45)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderRadius: 4,
                        transition: 'all 120ms ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                      onMouseLeave={e => e.currentTarget.style.color = hasActiveChild ? '#14B8A6' : 'rgba(255,255,255,0.45)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{group.label}</span>
                        {!isExpanded && hasPendingBadge && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#14B8A6' }} />
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  ) : (
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
                  )}

                  {/* Group Nav Items */}
                  {(isExpanded || (sidebarCollapsed && !isMobile)) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const count = getBadgeCount(item.badge);
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
                              padding: (sidebarCollapsed && !isMobile) ? '10px' : '8px 12px 8px 16px',
                              justify: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                              borderRadius: '0 6px 6px 0',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 120ms ease',
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
                  )}
                </div>
              );
            })
          ) : (
            navGroups.map(group => {
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
            })
          )}
        </nav>

        {/* Sidebar User Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          {/* Account Menu Popover */}
          <AccountMenuPopover
            isOpen={accountMenuOpen}
            onClose={() => setAccountMenuOpen(false)}
            anchorPosition="bottom-left"
          />

          <div
            onClick={(e) => {
              e.stopPropagation();
              setAccountMenuOpen(!accountMenuOpen);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              background: accountMenuOpen ? 'rgba(20, 184, 166, 0.18)' : 'rgba(255,255,255,0.05)',
              border: accountMenuOpen ? '1px solid rgba(20, 184, 166, 0.4)' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
              transition: 'all 150ms ease'
            }}
            title="Click to open Account Menu"
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: roleAvatarColors[currentRole] || '#0D9488',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {userProfile.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : currentRole.slice(0, 2)}
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {orgProfile.companyName || userProfile.fullName || 'Executive User'}
                </div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{currentRole.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 8, color: '#14B8A6' }}>▲ Menu</span>
                </div>
              </div>
            )}
            {(!sidebarCollapsed || isMobile) && <ChevronDown size={14} style={{ color: accountMenuOpen ? '#14B8A6' : 'rgba(255,255,255,0.4)', transition: 'transform 200ms ease', transform: accountMenuOpen ? 'rotate(180deg)' : 'none' }} />}
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
                  {activeTab === 'customer-verification' ? 'Customer Verification' :
                    activeTab === 'manufacturer-verification' ? 'Manufacturer Verification' :
                      activeTab === 'trademark-verification' ? 'Trademark Verification' :
                        activeTab === 'brand-verification' ? 'Brand Verification' :
                          activeTab === 'compliance' ? 'Compliance Verification' :
                            activeTab === 'reports' ? 'Executive Reports' :
                              activeTab.replace(/-/g, ' ')}
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

