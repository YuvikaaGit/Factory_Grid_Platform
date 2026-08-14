import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  FileText, ShieldCheck, Package, AlertTriangle,
  ArrowRight, Plus, Bot, TrendingUp, Check,
  Factory, Clock, Truck, CheckCircle2, Star,
  MapPin, BarChart3, Receipt, RefreshCw,
  ChevronRight, Lock, Zap, Activity, Filter, Eye, Search, Sparkles, Award, UserCheck, Users, Calendar,
  Building2, DollarSign, Bell, Command, Inbox, Target, Layers, MoreHorizontal, Timer, AlertCircle,
  Boxes, Navigation, Flame, TrendingDown, ArrowUpRight, Shield, Key, PieChart, Play, UserPlus, FileCheck,
  ListFilter, MoreVertical, ExternalLink
} from 'lucide-react';

export const Dashboards: React.FC = () => {
  const { currentRole, rfqs, orders, invoices, complianceCases, manufacturers, customers, buyerOnboardings, manufacturerOnboardings, auditLogs, setActiveTab, openCreateRfqDrawer } = useApp();

  const [selectedRfqId, setSelectedRfqId] = useState<string>(rfqs[0]?.id || '');
  const activeRfq = rfqs.find(r => r.id === selectedRfqId) || rfqs[0];

  const totalArBalance = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ── TOP ENTERPRISE WORKSPACE COMMAND BAR ───────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SAP S/4HANA & Oracle Fusion Enterprise Console · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
            Pharmaceutical Procurement Operations Center
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div><span style={{ color: '#64748B' }}>Active RFQs:</span> <strong className="ent-mono">{rfqs.length}</strong></div>
            <div><span style={{ color: '#64748B' }}>Master Orders:</span> <strong className="ent-mono">{orders.length}</strong></div>
            <div><span style={{ color: '#64748B' }}>Treasury Ledger:</span> <strong className="ent-mono">₹{totalRevenue.toLocaleString()}</strong></div>
          </div>
          <button onClick={() => openCreateRfqDrawer()} style={{ height: 34, padding: '0 16px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            + Create RFQ
          </button>
        </div>
      </div>

      {/* ── 4-ZONE FORTUNE 500 WORKSPACE ───────────────────── */}
      <div className="fg-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>

        {/* LEFT ZONE: Today's Work & Quick Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 10 }}>Today's Action Work Queue</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div onClick={() => setActiveTab('quotes')} style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending Quote Reviews</span>
                <span className="ent-mono" style={{ fontWeight: 700, color: '#2563EB' }}>2</span>
              </div>
              <div onClick={() => setActiveTab('compliance')} style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span>Compliance Verification</span>
                <span className="ent-mono" style={{ fontWeight: 700, color: '#D97706' }}>1</span>
              </div>
              <div onClick={() => setActiveTab('orders')} style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span>Production Batch Monitoring</span>
                <span className="ent-mono" style={{ fontWeight: 700, color: '#16A34A' }}>2</span>
              </div>
              <div onClick={() => setActiveTab('invoices')} style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span>Unsettled AR Invoices</span>
                <span className="ent-mono" style={{ fontWeight: 700, color: '#DC2626' }}>1</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 10 }}>Enterprise Quick Nav</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              {[
                { label: 'RFQ Sourcing Matrix', tab: 'rfqs' },
                { label: 'Quote Comparison', tab: 'quotes' },
                { label: 'Master Orders & Splitting', tab: 'orders' },
                { label: 'Cold-Chain Dispatch', tab: 'shipments' },
                { label: 'Invoices & AR Ledger', tab: 'invoices' },
                { label: 'Regulatory Compliance Desk', tab: 'compliance' },
                { label: 'Role Executive Reports', tab: 'reports' }
              ].map((nav, i) => (
                <div key={i} onClick={() => setActiveTab(nav.tab as any)} style={{ padding: '6px 8px', borderRadius: 4, cursor: 'pointer', color: '#334155', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{nav.label}</span>
                  <ChevronRight size={12} style={{ color: '#94A3B8' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE ZONE: RFQ Queue, Orders, Production & Split Panel Tables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Active Sourcing RFQ Data Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Active Sourcing RFQ Queue</div>
              <span className="ent-mono" style={{ fontSize: 11, color: '#64748B' }}>{rfqs.length} Total Records</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>RFQ Number</th>
                  <th style={{ padding: '10px 14px' }}>Buyer Organization</th>
                  <th style={{ padding: '10px 14px' }}>Line Items</th>
                  <th style={{ padding: '10px 14px' }}>Target Price</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map(rfq => (
                  <tr key={rfq.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="ent-mono" style={{ padding: '10px 14px', fontWeight: 700 }}>{rfq.rfqNumber}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{rfq.customerName}</td>
                    <td style={{ padding: '10px 14px' }}>{rfq.lines.length} Line Items</td>
                    <td className="ent-mono" style={{ padding: '10px 14px', fontWeight: 700 }}>₹{rfq.lines.reduce((a, l) => a + l.quantity * (l.targetPrice || 40), 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}><Badge status={rfq.status} /></td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button onClick={() => setActiveTab('quotes')} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 3, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer' }}>
                        View Bids →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Master Orders & Production Line Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Master Orders & Sub-Order Production Status</div>
              <span className="ent-mono" style={{ fontSize: 11, color: '#64748B' }}>{orders.length} Active Master POs</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Master Order</th>
                  <th style={{ padding: '10px 14px' }}>Buyer</th>
                  <th style={{ padding: '10px 14px' }}>Allocated Plants</th>
                  <th style={{ padding: '10px 14px' }}>Master PO Value</th>
                  <th style={{ padding: '10px 14px' }}>Fulfilled %</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td className="ent-mono" style={{ padding: '10px 14px', fontWeight: 700 }}>{ord.orderNumber}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{ord.customerName}</td>
                    <td style={{ padding: '10px 14px' }}>{ord.subOrders.length} WHO-GMP Units</td>
                    <td className="ent-mono" style={{ padding: '10px 14px', fontWeight: 700 }}>₹{ord.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '75%', background: '#16A34A', borderRadius: 2 }} />
                        </div>
                        <span className="ent-mono" style={{ fontSize: 11, fontWeight: 700 }}>75%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button onClick={() => setActiveTab('orders')} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 3, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer' }}>
                        Track Line →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* RIGHT ZONE: Notifications, AI Suggestions & Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* AI Suggestions Box */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} /> FactoryGrid AI Recommendations
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
              • Consolidated customer quotation for <strong>RFQ-2026-1001</strong> yields <strong>₹1,85,000 (7.2%)</strong> commercial savings by splitting lines between SunBio & Cipla.
            </div>
          </div>

          {/* Audit Activity Stream */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 10 }}>Audit Activity Trail</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11.5 }}>
              {auditLogs.slice(0, 5).map((log: any, i: number) => (
                <div key={i} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{log.action}</div>
                  <div style={{ color: '#64748B', fontSize: 11 }}>{log.userName || log.user} · {log.timestamp || log.time}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── BOTTOM ZONE: REVENUE & COMPLIANCE TRENDS ───────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Financial Collections</div>
          <div className="ent-mono" style={{ fontSize: 20, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>₹{totalCollected.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Reconciled RTGS bank entries</div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Outstanding AR Balance</div>
          <div className="ent-mono" style={{ fontSize: 20, fontWeight: 800, color: '#D97706', marginTop: 4 }}>₹{totalArBalance.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Unsettled invoices within credit terms</div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Statutory Compliance Rate</div>
          <div className="ent-mono" style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>100.0% Compliant</div>
          <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>Zero expired WHO-GMP licenses</div>
        </div>
      </div>

    </div>
  );
};
