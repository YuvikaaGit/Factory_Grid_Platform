import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert,
  ShoppingBag, Receipt, Filter, Search, Check, Trash2, Archive, X,
  FileText, Tag, Truck, CreditCard, ShieldCheck, Clock, Download,
  Activity, ArrowRight, UserCheck, Key
} from 'lucide-react';

export const NotificationsModule: React.FC = () => {
  const { notifications, currentRole, auditLogs, setActiveTab } = useApp();

  const [activeTabLocal, setActiveTabLocal] = useState<'NOTIFICATIONS' | 'TIMELINE' | 'AUDIT_LOG'>('NOTIFICATIONS');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterTime, setFilterTime] = useState<'ALL' | 'UNREAD' | 'TODAY' | 'THIS_WEEK'>('ALL');
  const [readItems, setReadItems] = useState<Record<string, boolean>>({});

  const toggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReadItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'COMPLIANCE': return <ShieldCheck size={14} style={{ color: 'var(--text-primary)' }} />;
      case 'RFQ': return <FileText size={14} style={{ color: 'var(--text-primary)' }} />;
      case 'QUOTE': return <Tag size={14} style={{ color: 'var(--text-primary)' }} />;
      case 'ORDER': return <ShoppingBag size={14} style={{ color: 'var(--text-primary)' }} />;
      case 'DISPATCH': return <Truck size={14} style={{ color: 'var(--text-primary)' }} />;
      case 'INVOICE': return <Receipt size={14} style={{ color: 'var(--text-primary)' }} />;
      case 'PAYMENT': return <CreditCard size={14} style={{ color: 'var(--text-primary)' }} />;
      default: return <Bell size={14} style={{ color: 'var(--text-primary)' }} />;
    }
  };

  const filteredNotifs = notifications.filter(item => {
    const isRead = readItems[item.id] || item.read;

    if (filterTime === 'UNREAD' && isRead) return false;
    if (filterCategory !== 'ALL' && item.category !== filterCategory && item.type !== filterCategory) return false;

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Command Bar ───────────────────────────── */}
      <div className="ent-command-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="ent-command-bar-left">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
            <Bell size={20} />
          </div>
          <div>
            <div className="ent-label" style={{ color: 'var(--text-tertiary)' }}>SAP Fiori & ServiceNow Event Engine</div>
            <div className="ent-page-title" style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>
              Global Notification Center & Audit Trail
            </div>
          </div>
        </div>

        <div className="ent-command-bar-right">
          <button
            onClick={() => {
              const allRead: Record<string, boolean> = {};
              notifications.forEach(n => { allRead[n.id] = true; });
              setReadItems(allRead);
            }}
            className="ent-btn-secondary"
            style={{ fontSize: 12 }}
          >
            <Check size={14} /> Mark All Read
          </button>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ────────────────────────────── */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        <button className={`ent-tab ${activeTabLocal === 'NOTIFICATIONS' ? 'active' : ''}`} onClick={() => setActiveTabLocal('NOTIFICATIONS')}>
          <Bell size={14} /> Notifications Inbox ({notifications.length})
        </button>
        <button className={`ent-tab ${activeTabLocal === 'TIMELINE' ? 'active' : ''}`} onClick={() => setActiveTabLocal('TIMELINE')}>
          <Activity size={14} /> End-to-End Activity Timeline
        </button>
        <button className={`ent-tab ${activeTabLocal === 'AUDIT_LOG' ? 'active' : ''}`} onClick={() => setActiveTabLocal('AUDIT_LOG')}>
          <ShieldCheck size={14} /> System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          VIEW 1: NOTIFICATIONS INBOX TABLE
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'NOTIFICATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Filter Bar */}
          <div className="ent-panel" style={{ padding: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Alerts' },
                { id: 'RFQ', label: 'RFQs' },
                { id: 'ORDER', label: 'Orders' },
                { id: 'INVOICE', label: 'Invoices' },
                { id: 'COMPLIANCE', label: 'Compliance' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={filterCategory === cat.id ? 'ent-btn-primary' : 'ent-btn-secondary'}
                  style={{ fontSize: 11.5, padding: '4px 12px' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'UNREAD', 'TODAY', 'THIS_WEEK'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterTime(t as any)}
                  className={filterTime === t ? 'ent-btn-primary' : 'ent-btn-secondary'}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Data Table */}
          <div className="ent-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="ent-panel-header" style={{ padding: '12px 16px' }}>
              <div className="ent-section-title">Centralized Event Feed</div>
              <span className="ent-caption">{filteredNotifs.length} Records</span>
            </div>

            <table className="ent-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Category</th>
                  <th>Title & Notification Message</th>
                  <th>Reference Number</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifs.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-tertiary)' }}>No notifications found matching filter.</td></tr>
                ) : filteredNotifs.map(n => {
                  const isRead = readItems[n.id] || n.read;
                  return (
                    <tr key={n.id} style={{ opacity: isRead ? 0.75 : 1 }}>
                      <td className="ent-mono" style={{ fontSize: 11.5 }}>{n.timestamp}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {getCategoryIcon(n.category)}
                          {n.category || n.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>
                      </td>
                      <td className="ent-mono" style={{ fontWeight: 700, fontSize: 11.5 }}>{n.link ? n.link.toUpperCase() : 'REF-2026'}</td>
                      <td style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>NORMAL</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isRead ? 'var(--text-tertiary)' : 'var(--c-info, #0284C7)' }}>
                          {isRead ? 'READ' : 'UNREAD'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => toggleRead(n.id, e)}
                          className="ent-btn-secondary"
                          style={{ padding: '3px 8px', fontSize: 11 }}
                        >
                          {isRead ? 'Mark Unread' : 'Mark Read'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 2: END-TO-END ACTIVITY TIMELINE
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'TIMELINE' && (
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: 24 }}>
          <div className="ent-section-title" style={{ marginBottom: 16 }}>Complete FactoryGrid B2B End-to-End Workflow Timeline</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { step: '1. Request Enterprise Access', desc: 'Public Demo / Access Request submitted', actor: 'Applicant', time: '07-Aug 10:00' },
              { step: '2. Sales Qualification', desc: 'Lead qualified by Sales Qualification Manager', actor: 'Sales Manager', time: '07-Aug 10:30' },
              { step: '3. Compliance Verification', desc: 'Drug License Form 20B & WHO-GMP verified', actor: 'Compliance Officer', time: '07-Aug 11:15' },
              { step: '4. Platform Admin Approval', desc: 'Enterprise Code BUY-2026-101 allocated & credentials sent', actor: 'Platform Admin', time: '07-Aug 11:45' },
              { step: '5. Buyer Login & Workspace', desc: 'Buyer authenticated into Procurement Command Center', actor: 'Buyer', time: '07-Aug 12:00' },
              { step: '6. Multi-Product RFQ Submission', desc: 'RFQ-2026-1001 created for 75,000 formulation units', actor: 'Buyer', time: '07-Aug 12:30' },
              { step: '7. AI Manufacturer Matching', desc: '10-criteria algorithm matched 3 WHO-GMP facilities', actor: 'FactoryGrid AI', time: '07-Aug 12:31' },
              { step: '8. Manufacturer Bidding & Quote Submission', desc: 'Sealed commercial bids submitted to platform', actor: 'Manufacturer', time: '07-Aug 13:00' },
              { step: '9. Customer Quotation Approval', desc: 'Buyer approved consolidated CQUO-2026-9001 quotation', actor: 'Buyer', time: '07-Aug 13:15' },
              { step: '10. Master Order & AI Order Splitting', desc: 'Master PO MO-2026-1001 split into SO-2026-1001-01..02', actor: 'System Engine', time: '07-Aug 13:20' },
              { step: '11. Manufacturing Execution & QC', desc: 'Tableting completed, QC passed, packaged', actor: 'SunBio Plant', time: '07-Aug 13:40' },
              { step: '12. Cold-Chain Dispatch & Tracking', desc: 'Dispatched via ColdEx Logistics 2°C–8°C telemetry fleet', actor: 'Logistics', time: '07-Aug 13:50' },
              { step: '13. Invoice Generation & AR Ledger', desc: 'B2B Tax Invoice INV-2026-4401 issued', actor: 'Manufacturer', time: '07-Aug 14:00' },
              { step: '14. Payment Verification & Order Closure', desc: 'RTGS remittance verified by Accounts Manager. Master Order COMPLETED.', actor: 'Accounts Manager', time: '07-Aug 14:15' }
            ].map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  ✓
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{node.step}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{node.desc}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>{node.actor}</div>
                  <div className="ent-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{node.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 3: SYSTEM AUDIT TRAIL LOGS
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'AUDIT_LOG' && (
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">System Audit Log Registry</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Tamper-proof record of all user actions, security events, and IP addresses</div>
            </div>
            <button className="ent-btn-secondary" onClick={() => alert('Exporting Audit Log...')} style={{ fontSize: 11.5 }}>
              <Download size={13} /> Export Audit Log
            </button>
          </div>

          <table className="ent-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action Event</th>
                <th>Module</th>
                <th>IP Address</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log: any, i: number) => (
                <tr key={i}>
                  <td className="ent-mono" style={{ fontSize: 11.5 }}>{log.timestamp || log.time}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.userName || log.user}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{log.userRole || log.dept}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</td>
                  <td className="ent-mono" style={{ fontSize: 11 }}>{log.module || log.entity}</td>
                  <td className="ent-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{log.ipAddress || '192.168.1.100'}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-success, #047857)' }}>SUCCESS ✓</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
