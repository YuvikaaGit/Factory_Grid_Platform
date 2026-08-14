import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, Lock, Users, Key, Database, FileText,
  Activity, Server, Settings, Cpu, HardDrive, AlertTriangle, Check, Search, Plus,
  Shield, Globe, BarChart3, Zap, CheckCircle2, Clock, Eye, Download, MoreHorizontal,
  UserCheck, RefreshCw, Bell, AlertCircle, Building2
} from 'lucide-react';


const masterUsers = [
  { id: 'usr-1', name: 'Dr. Vikram Sethi', email: 'v.sethi@apexpharma.com', role: 'BUYER', roleTitle: 'Buyer', roleDept: 'Procurement', org: 'Apex Pharma Ltd', status: 'ACTIVE', lastLogin: '10 mins ago', location: 'Mumbai, MH', icon: '🛒' },
  { id: 'usr-2', name: 'Rajesh Sharma', email: 'rajesh@sunbiolabs.com', role: 'SUPPLIER', roleTitle: 'Supplier', roleDept: 'Manufacturing', org: 'SunBio Labs Pvt Ltd', status: 'ACTIVE', lastLogin: '1 hour ago', location: 'Hyderabad, TS', icon: '🏭' },
  { id: 'usr-3', name: 'Ananya Verma', email: 'ananya@factorygrid.com', role: 'COMPLIANCE_OFFICER', roleTitle: 'Compliance Officer', roleDept: 'Quality & Regulatory', org: 'FactoryGrid Platform', status: 'ACTIVE', lastLogin: '5 mins ago', location: 'Delhi, DL', icon: '🛡' },
  { id: 'usr-4', name: 'Finance Controller', email: 'finance@factorygrid.com', role: 'ACCOUNTS_MANAGER', roleTitle: 'Accounts Manager', roleDept: 'Finance', org: 'FactoryGrid HQ', status: 'ACTIVE', lastLogin: '30 mins ago', location: 'Pune, MH', icon: '💰' },
  { id: 'usr-5', name: 'Platform Admin', email: 'admin@factorygrid.com', role: 'ADMIN', roleTitle: 'Platform Admin', roleDept: 'Administration', org: 'FactoryGrid HQ', status: 'ACTIVE', lastLogin: 'Just now', location: 'Bangalore, KA', icon: '⚙' },
];

const rbacMatrix = [
  { role: 'BUYER', title: 'Buyer', dept: 'Procurement', desc: 'Pharmaceutical buyer / procurement manager',
    perms: { rfqs: true, quotes: true, orders: true, invoices: true, compliance: false, analytics: false, admin: false, catalog: true }},
  { role: 'SUPPLIER', title: 'Supplier', dept: 'Manufacturing', desc: 'WHO-GMP certified manufacturer / partner',
    perms: { rfqs: true, quotes: true, orders: true, invoices: true, compliance: false, analytics: false, admin: false, catalog: true }},
  { role: 'COMPLIANCE_OFFICER', title: 'Compliance Officer', dept: 'Quality & Compliance', desc: 'Document verification & regulatory oversight',
    perms: { rfqs: false, quotes: false, orders: false, invoices: false, compliance: true, analytics: false, admin: false, catalog: false }},
  { role: 'SALES_MANAGER', title: 'Sales Manager', dept: 'Revenue & CRM', desc: 'B2B customer acquisition & revenue tracking',
    perms: { rfqs: true, quotes: true, orders: true, invoices: false, compliance: false, analytics: true, admin: false, catalog: true }},
  { role: 'ACCOUNTS_MANAGER', title: 'Accounts Manager', dept: 'Finance & Accounts', desc: 'Finance, invoicing & AR reconciliation',
    perms: { rfqs: false, quotes: false, orders: true, invoices: true, compliance: false, analytics: true, admin: false, catalog: false }},
  { role: 'ADMIN', title: 'Platform Admin', dept: 'Administration', desc: 'Full platform access — RBAC & system health',
    perms: { rfqs: true, quotes: true, orders: true, invoices: true, compliance: true, analytics: true, admin: true, catalog: true }},
];

const permColumns = ['rfqs', 'quotes', 'orders', 'invoices', 'compliance', 'analytics', 'admin', 'catalog'];
const permLabels: Record<string, string> = {
  rfqs: 'RFQ Center', quotes: 'Quotes', orders: 'Orders', invoices: 'Finance',
  compliance: 'Compliance', analytics: 'Analytics', admin: 'Admin Console', catalog: 'Catalog'
};

const systemMetrics = [
  { label: 'API Microservices Gateway', status: '99.99% Uptime', detail: '12ms latency · 4,200 req/s', state: 'HEALTHY' },
  { label: 'PostgreSQL DB Cluster', status: 'Healthy', detail: '42 active connections · Replication active', state: 'HEALTHY' },
  { label: 'Cold-Chain IoT Telemetry', status: 'Streaming Active', detail: '4,890 sensor events/min', state: 'HEALTHY' },
  { label: 'CDSCO Compliance Engine', status: 'Operational', detail: 'SHA-256 encrypted · 1.2TB archived', state: 'HEALTHY' },
  { label: 'WHO-GMP Audit Ledger', status: 'Synced', detail: '2,840 verified manufacturers', state: 'HEALTHY' },
  { label: 'Cold Storage Monitoring', status: '14 Active Units', detail: '2°C–8°C compliance: 100%', state: 'HEALTHY' },
];

const auditLogs = [
  { action: 'Compliance Case APPROVED', user: 'Ananya Verma', dept: 'Quality & Compliance', entity: 'BioCure Healthcare Pvt Ltd', time: '5 mins ago', ip: '192.168.1.42' },
  { action: 'New User Invited', user: 'Platform Admin', dept: 'Administration', entity: 'rajesh@sunbiolabs.com (SUPPLIER)', time: '30 mins ago', ip: '10.0.0.1' },
  { action: 'Master Order Created', user: 'Dr. Vikram Sethi', dept: 'Procurement', entity: 'MO-2026-1001 — ₹25,20,000', time: '2 hours ago', ip: '172.16.0.8' },
  { action: 'RFQ Published', user: 'Dr. Vikram Sethi', dept: 'Procurement', entity: 'RFQ-2026-001 — 50,000 boxes', time: '3 hours ago', ip: '172.16.0.8' },
  { action: 'Payment Recorded', user: 'Finance Controller', dept: 'Finance', entity: 'INV-2026-4401 — ₹7,20,000', time: '4 hours ago', ip: '192.168.2.14' },
];

export const SettingsModule: React.FC = () => {
  const { 
    auditLogs: contextAuditLogs, buyerOnboardings, manufacturerOnboardings,
    approveBuyerOnboarding, approveManufacturerOnboarding, addAuditLog 
  } = useApp();
  const [activeTab, setActiveTab] = useState<'USERS' | 'RBAC' | 'SYSTEM' | 'AUDIT' | 'ORGANIZATIONS' | 'API_HEALTH'>('USERS');

  const tabs = [
    { id: 'USERS', label: 'User Directory', icon: Users },
    { id: 'ORGANIZATIONS', label: 'Organizations', icon: Building2 },
    { id: 'RBAC', label: 'RBAC Permissions', icon: Shield },
    { id: 'SYSTEM', label: 'System Health', icon: Server },
    { id: 'API_HEALTH', label: 'API Health', icon: Activity },
    { id: 'AUDIT', label: 'Audit Trail', icon: FileText },
  ] as const;

  const combinedAuditLogs = [...auditLogs, ...contextAuditLogs.slice(0, 10)];

  const orgBuyers = [
    { name: 'Apex Pharma Labs Ltd', code: 'BUY-2026-001', type: 'Buyer', city: 'Hyderabad', status: 'ACTIVE', users: 3, gstin: '36APXPH0001A1Z5', joinedDate: '2026-01-15' },
    { name: 'MedLife Hospital Chain', code: 'BUY-2026-002', type: 'Buyer', city: 'Delhi', status: 'ACTIVE', users: 2, gstin: '07MEDLF0002B1Z6', joinedDate: '2026-02-01' },
    { name: 'BioCure Healthcare', code: 'BUY-2026-003', type: 'Buyer', city: 'Mumbai', status: 'PENDING', users: 1, gstin: '27BIOCR0003C1Z7', joinedDate: '2026-03-10' },
  ];

  const orgManufacturers = [
    { name: 'SunBio Labs Pvt Ltd', code: 'MFG-2026-001', type: 'Manufacturer', city: 'Baddi', status: 'ACTIVE', users: 4, license: 'ML-HP-2024-001', joinedDate: '2025-11-01' },
    { name: 'CiplaFormulations', code: 'MFG-2026-002', type: 'Manufacturer', city: 'Pune', status: 'ACTIVE', users: 2, license: 'ML-MH-2023-099', joinedDate: '2025-10-15' },
    { name: 'LupinLabs Unit IV', code: 'MFG-2026-003', type: 'Manufacturer', city: 'Vapi', status: 'REVIEW', users: 1, license: 'ML-GJ-2024-055', joinedDate: '2026-04-20' },
  ];

  const apiEndpoints = [
    { name: 'RFQ Procurement Gateway', endpoint: 'POST /api/v2/rfqs', latency: '12ms', uptime: '99.99%', rpm: '4,200', status: 'OPERATIONAL' },
    { name: 'Manufacturer Matching AI', endpoint: 'GET /api/v2/ai/match', latency: '48ms', uptime: '99.95%', rpm: '890', status: 'OPERATIONAL' },
    { name: 'Quote Submission Engine', endpoint: 'POST /api/v2/quotes', latency: '18ms', uptime: '100%', rpm: '1,200', status: 'OPERATIONAL' },
    { name: 'Cold-Chain IoT Telemetry', endpoint: 'WS /api/v2/telemetry', latency: '8ms', uptime: '99.98%', rpm: '24,000', status: 'OPERATIONAL' },
    { name: 'CDSCO Compliance Engine', endpoint: 'GET /api/v2/compliance', latency: '32ms', uptime: '99.97%', rpm: '340', status: 'OPERATIONAL' },
    { name: 'Invoice & Payment Gateway', endpoint: 'POST /api/v2/invoices', latency: '22ms', uptime: '99.99%', rpm: '600', status: 'OPERATIONAL' },
    { name: 'Authentication Service', endpoint: 'POST /api/v2/auth/login', latency: '6ms', uptime: '100%', rpm: '2,800', status: 'OPERATIONAL' },
    { name: 'Audit Log Service', endpoint: 'POST /api/v2/audit', latency: '4ms', uptime: '100%', rpm: '12,000', status: 'OPERATIONAL' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Command Bar Header ───────────────── */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Dashboard / Admin Console</div>
            <div className="ent-page-title" style={{ margin: 0 }}>System Control Center</div>
          </div>
        </div>
        <div className="ent-command-bar-right">
          <button className="ent-btn-secondary">
            <Download size={14} /> Export Audit Log
          </button>
          <button className="ent-btn-primary" onClick={() => alert('User invitation sent.')}>
            <Plus size={14} /> Provision User
          </button>
        </div>
      </div>

      {/* ── COMPACT HORIZONTAL SYSTEM METRICS STRIP ─────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#16A34A', fontSize: 14, fontWeight: 800 }}>●</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>All Platform Systems Operational</div>
            <div className="ent-caption">CDSCO & WHO-GMP Verified Nodes</div>
          </div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

        <div>
          <div className="ent-label">API Gateway</div>
          <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>99.99% Uptime (12ms)</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

        <div>
          <div className="ent-label">Active Sessions</div>
          <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>247 Verified Users</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

        <div>
          <div className="ent-label">DB Cluster</div>
          <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>42 Primary Connections</div>
        </div>
      </div>

      {/* ── Workspace Tabs (Azure Admin Center style) ─────── */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`ent-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── ORGANIZATIONS TAB ────────────────────────────── */}
      {activeTab === 'ORGANIZATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Pending Internal Organization Approvals Queue */}
          <div className="ent-panel" style={{ border: '1px solid rgba(37,99,235,0.3)', background: 'var(--bg-surface)' }}>
            <div className="ent-panel-header" style={{ background: 'rgba(37,99,235,0.05)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} style={{ color: '#2563EB' }} />
                  <div className="ent-section-title">Pending Enterprise Approvals & Code Generation</div>
                </div>
                <div className="ent-caption" style={{ marginTop: 2 }}>
                  Internal Platform Admin approval pipeline. Approving generates official Buyer/Manufacturer Code & dispatches invitation email.
                </div>
              </div>
              <span className="ent-chip-primary">
                {buyerOnboardings.filter(b => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').length +
                 manufacturerOnboardings.filter(m => m.status === 'PENDING' || m.status === 'UNDER_REVIEW').length} Pending Review
              </span>
            </div>

            <table className="ent-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Type</th>
                  <th>Contact Person</th>
                  <th>Corporate Email</th>
                  <th>Statutory ID</th>
                  <th>Submitted Date</th>
                  <th style={{ textAlign: 'right' }}>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {buyerOnboardings.filter(b => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.companyName}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: 4 }}>BUYER</span></td>
                    <td className="ent-body">{b.contactPerson}</td>
                    <td className="ent-mono" style={{ fontSize: 12 }}>{b.email}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{b.gstin}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{b.submittedDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="ent-btn-primary"
                        style={{ height: 30, padding: '0 12px', fontSize: 11.5 }}
                        onClick={() => {
                          const generatedCode = `BUY-2026-${Math.floor(100 + Math.random() * 900)}`;
                          approveBuyerOnboarding(b.id);
                          addAuditLog('Platform Admin', `Approved Buyer Organization ${b.companyName}. Generated Code: ${generatedCode}. Dispatched invitation email to ${b.email}.`);
                          alert(`✔ Account Approved & Provisioned!\n\nGenerated Enterprise Buyer Code: ${generatedCode}\nInvitation email with workstation login credentials dispatched to: ${b.email}`);
                        }}
                      >
                        Approve & Allocate Code →
                      </button>
                    </td>
                  </tr>
                ))}

                {manufacturerOnboardings.filter(m => m.status === 'PENDING' || m.status === 'UNDER_REVIEW').map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.companyName}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', background: 'rgba(20,184,166,0.1)', padding: '2px 8px', borderRadius: 4 }}>MANUFACTURER</span></td>
                    <td className="ent-body">{m.contactPerson}</td>
                    <td className="ent-mono" style={{ fontSize: 12 }}>{m.email}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{m.mfgLicenseNo || m.whoGmpNo}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{m.submittedDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="ent-btn-primary"
                        style={{ height: 30, padding: '0 12px', fontSize: 11.5, background: '#14B8A6', borderColor: '#0F766E' }}
                        onClick={() => {
                          const generatedCode = `MFG-2026-${Math.floor(100 + Math.random() * 900)}`;
                          approveManufacturerOnboarding(m.id);
                          addAuditLog('Platform Admin', `Approved Manufacturer Organization ${m.companyName}. Generated Code: ${generatedCode}. Dispatched invitation email to ${m.email}.`);
                          alert(`✔ Account Approved & Provisioned!\n\nGenerated Enterprise Manufacturer Code: ${generatedCode}\nInvitation email with workstation login credentials dispatched to: ${m.email}`);
                        }}
                      >
                        Approve & Allocate Code →
                      </button>
                    </td>
                  </tr>
                ))}

                {buyerOnboardings.filter(b => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').length === 0 &&
                 manufacturerOnboardings.filter(m => m.status === 'PENDING' || m.status === 'UNDER_REVIEW').length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                      All organization access requests are fully processed & provisioned. No pending approvals in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Buyer Organizations</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Pharmaceutical buyers & procurement companies on the platform</div>
              </div>
              <span className="ent-chip-primary">{orgBuyers.length} Registered</span>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  {['Organization', 'Buyer Code', 'City', 'GSTIN', 'Users', 'Joined', 'Status'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {orgBuyers.map(org => (
                  <tr key={org.code}>
                    <td style={{ fontWeight: 700 }}>{org.name}</td>
                    <td className="ent-mono">{org.code}</td>
                    <td className="ent-body">{org.city}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{org.gstin}</td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>{org.users} users</td>
                    <td className="ent-mono">{org.joinedDate}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: org.status === 'ACTIVE' ? '#047857' : '#B45309' }} />
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Manufacturer Organizations</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>WHO-GMP certified manufacturing partners on the platform</div>
              </div>
              <span className="ent-chip-primary">{orgManufacturers.length} Registered</span>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  {['Organization', 'Mfg Code', 'City', 'Mfg License', 'Users', 'Joined', 'Status'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {orgManufacturers.map(org => (
                  <tr key={org.code}>
                    <td style={{ fontWeight: 700 }}>{org.name}</td>
                    <td className="ent-mono">{org.code}</td>
                    <td className="ent-body">{org.city}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{org.license}</td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>{org.users} users</td>
                    <td className="ent-mono">{org.joinedDate}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: org.status === 'ACTIVE' ? '#047857' : '#B45309' }} />
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── API HEALTH TAB ────────────────────────────────── */}
      {activeTab === 'API_HEALTH' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ent-kpi-strip">
            <div className="ent-kpi-strip-item">
              <div className="kpi-label">API Endpoints</div>
              <div className="kpi-value">{apiEndpoints.length}</div>
              <div className="kpi-sub">All operational</div>
            </div>
            <div className="ent-kpi-strip-item">
              <div className="kpi-label">Avg Latency</div>
              <div className="kpi-value">18ms</div>
              <div className="kpi-sub">P99: 42ms</div>
            </div>
            <div className="ent-kpi-strip-item">
              <div className="kpi-label">Platform Uptime</div>
              <div className="kpi-value" style={{ color: '#047857' }}>99.98%</div>
              <div className="kpi-sub">30-day rolling</div>
            </div>
            <div className="ent-kpi-strip-item">
              <div className="kpi-label">Total RPM</div>
              <div className="kpi-value ent-mono">46,030</div>
              <div className="kpi-sub">Requests per minute</div>
            </div>
          </div>

          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">API Endpoint Health Monitor</div>
              <span className="ent-caption">Real-time status of all platform microservices</span>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  {['Service Name', 'Endpoint', 'Latency', 'Uptime', 'RPM', 'Status'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map(ep => (
                  <tr key={ep.endpoint}>
                    <td style={{ fontWeight: 700 }}>{ep.name}</td>
                    <td className="ent-mono" style={{ fontSize: 11, color: 'var(--c-secondary)' }}>{ep.endpoint}</td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>{ep.latency}</td>
                    <td className="ent-mono" style={{ fontWeight: 700, color: '#047857' }}>{ep.uptime}</td>
                    <td className="ent-mono">{ep.rpm}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} />
                        {ep.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── USER DIRECTORY TAB ───────────────────────────── */}
      {activeTab === 'USERS' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Platform User Registry</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Provisioned accounts & RBAC credentials — Azure AD style</div>
            </div>
            <span className="ent-caption" style={{ fontWeight: 600 }}>{masterUsers.length} Account Records</span>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                {['User Identity', 'Corporate Email', 'Role & Department', 'Organization', 'Last Active', 'Location', 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {masterUsers.map(usr => (
                <tr key={usr.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--c-secondary-soft)', border: '1px solid var(--c-secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--c-secondary)' }}>
                        {usr.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="ent-subheading">{usr.name}</div>
                    </div>
                  </td>
                  <td className="ent-mono" style={{ fontSize: 12 }}>{usr.email}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{usr.roleTitle}</div>
                    <div className="ent-caption">{usr.roleDept}</div>
                  </td>
                  <td className="ent-body">{usr.org}</td>
                  <td className="ent-mono">{usr.lastLogin}</td>
                  <td className="ent-caption">{usr.location}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── RBAC PERMISSIONS MATRIX TAB ─────────────────── */}
      {activeTab === 'RBAC' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Role-Based Access Control (RBAC) Matrix</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Enforced endpoint & module authorization rules</div>
            </div>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Role & Scope</th>
                {permColumns.map(p => (
                  <th key={p} style={{ textAlign: 'center' }}>{permLabels[p]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rbacMatrix.map(role => (
                <tr key={role.role}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{role.title}</div>
                    <div className="ent-caption">{role.dept}</div>
                  </td>
                  {permColumns.map(p => {
                    const allowed = role.perms[p as keyof typeof role.perms];
                    return (
                      <td key={p} style={{ textAlign: 'center' }}>
                        {allowed ? (
                          <span style={{ color: '#047857', fontWeight: 800, fontSize: 14 }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--border-strong)', fontSize: 13 }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SYSTEM CONTROL TAB ──────────────────────────── */}
      {activeTab === 'SYSTEM' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div className="ent-section-title">Platform Microservices Health</div>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th>Service Gateway</th>
                <th>Health Status</th>
                <th>Telemetry & Latency</th>
                <th>System State</th>
              </tr>
            </thead>
            <tbody>
              {systemMetrics.map(srv => (
                <tr key={srv.label}>
                  <td style={{ fontWeight: 600 }}>{srv.label}</td>
                  <td style={{ fontWeight: 600 }}>{srv.status}</td>
                  <td className="ent-mono">{srv.detail}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} /> Healthy
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AUDIT TRAIL TAB ──────────────────────────────── */}
      {activeTab === 'AUDIT' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Platform Security Audit Log</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Tamper-proof event trail for CDSCO regulatory compliance</div>
            </div>
            <button className="ent-btn-secondary" style={{ fontSize: 11, height: 32, padding: '0 12px' }}>
              <Download size={13} /> Export Audit Log
            </button>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th>Audit Action Event</th>
                <th>Actor / User</th>
                <th>Department</th>
                <th>Target Object / Value</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {[...auditLogs, ...contextAuditLogs.slice(0, 5)].map((log: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1E40AF', display: 'inline-block', marginRight: 8 }} />
                    {log.action}
                  </td>
                  <td>{log.user || log.userName}</td>
                  <td className="ent-caption">{log.dept || log.userRole}</td>
                  <td className="ent-mono" style={{ fontSize: 12 }}>{log.entity || log.module}</td>
                  <td className="ent-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{log.ip || log.ipAddress}</td>
                  <td className="ent-mono" style={{ fontSize: 11 }}>{log.time || log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
