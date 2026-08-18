import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText, Plus, Search, Filter, Calendar, Clock, CheckCircle2, AlertCircle,
  X, Building2, Package, Layers, ArrowRight, Eye, RefreshCw, Trash2,
  Upload, SlidersHorizontal, Bell, ShoppingBag, Receipt, Truck, Bot,
  Award, ShieldCheck, Check, Sparkles, AlertTriangle, File
} from 'lucide-react';
import { RFQ, RFQLine } from '../../types';
import { AIMatchingModule } from './AIMatchingModule';

export const BuyerWorkspaceModule: React.FC = () => {
  const {
    currentRole, rfqs, addRFQ, orders, invoices, complianceCases,
    manufacturers, products, notifications, setActiveTab, addAuditLog, openCreateRfqDrawer,
    navigateWithFilter
  } = useApp();

  const [activeTabLocal, setActiveTabLocal] = useState<'DASHBOARD' | 'RFQ_CENTER' | 'AI_MATCHING'>('DASHBOARD');
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);

  // ── Create RFQ State ─────────────────────────────────────
  const [rfqNumber] = useState(`RFQ-2026-${1000 + rfqs.length + 1}`);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('2026-09-15');
  const [deliveryLocation, setDeliveryLocation] = useState('Plot 45, GIDC Industrial Estate, Naroda, Ahmedabad, Gujarat');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [remarks, setRemarks] = useState('WHO-GMP certified facility with cold-chain dispatch capability mandatory.');

  // Product Table Rows
  const [productRows, setProductRows] = useState<{
    id: string;
    productName: string;
    category: string;
    strength: string;
    dosageForm: string;
    packaging: string;
    quantity: number;
    unit: string;
    targetPrice: number;
    remarks: string;
  }[]>([
    {
      id: 'row-1',
      productName: 'Paracetamol 650mg Tablets',
      category: 'Analgesic',
      strength: '650mg',
      dosageForm: 'Tablet',
      packaging: '10x15 Strip',
      quantity: 50000,
      unit: 'Boxes',
      targetPrice: 12.50,
      remarks: 'Fast delivery required.'
    },
    {
      id: 'row-2',
      productName: 'Amoxicillin 500mg + Clavulanate 125mg',
      category: 'Antibiotics',
      strength: '625mg',
      dosageForm: 'Tablet',
      packaging: '10x10 Alu-Alu Strip',
      quantity: 25000,
      unit: 'Boxes',
      targetPrice: 42.00,
      remarks: 'WHO-GMP certified unit mandatory.'
    }
  ]);

  // RFQ Settings
  const [allowPartialAward, setAllowPartialAward] = useState(true);
  const [allowMultipleMfg, setAllowMultipleMfg] = useState(true);
  const [quotationDueDate, setQuotationDueDate] = useState('2026-08-25');
  const [deliveryTerms, setDeliveryTerms] = useState('CIF Destination');
  const [paymentTerms, setPaymentTerms] = useState('45 Days Credit');

  // Attachments State
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: string }[]>([
    { name: 'Paracetamol_650_COA_Specification.pdf', type: 'Specification', size: '1.2 MB' },
    { name: 'Blister_Artwork_v2.ai', type: 'Artwork', size: '4.5 MB' }
  ]);

  // AI Matching Screen State
  const [createdRfqResult, setCreatedRfqResult] = useState<RFQ | null>(null);
  const [matchingStep, setMatchingStep] = useState<1 | 2 | 3 | 4>(1);

  // Access Restriction Check
  const isBuyer = currentRole === 'BUYER' || currentRole === 'ADMIN';

  if (!isBuyer) {
    return (
      <div className="ent-panel" style={{ padding: 48, textAlign: 'center', margin: '40px auto', maxWidth: 600 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={22} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Buyer Workspace — Access Restricted
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          This workspace is configured for <strong>Pharmaceutical Buyer Accounts</strong> to manage RFQs, quotes, orders, and invoices.
        </p>
        <div className="ent-caption">Please switch to <strong>Buyer</strong> role using the role switcher.</div>
      </div>
    );
  }

  // Dashboard KPI Counts
  const openRfqsCount = rfqs.filter(r => r.status === 'PRICING_IN_PROGRESS' || r.status === 'SUBMITTED').length;
  const quotesReceivedCount = rfqs.filter(r => r.status === 'QUOTED' || r.status === 'CUSTOMER_REVIEW').length;
  const ordersInProgressCount = orders.filter(o => o.status === 'IN_PRODUCTION' || o.status === 'OPEN').length;
  const pendingApprovalCount = rfqs.filter(r => r.status === 'CUSTOMER_REVIEW').length;
  const invoicesPendingCount = invoices.filter(i => i.status === 'OPEN' || i.status === 'OVERDUE').length;

  // Add Product Row
  const handleAddProductRow = () => {
    const newId = `row-${Date.now()}`;
    setProductRows(prev => [
      ...prev,
      {
        id: newId,
        productName: 'Azithromycin 500mg Tablets',
        category: 'Antibiotics',
        strength: '500mg',
        dosageForm: 'Tablet',
        packaging: '10x3 Strip',
        quantity: 20000,
        unit: 'Boxes',
        targetPrice: 65.00,
        remarks: 'Export quality packaging'
      }
    ]);
  };

  // Remove Product Row
  const handleRemoveProductRow = (id: string) => {
    if (productRows.length === 1) return;
    setProductRows(prev => prev.filter(r => r.id !== id));
  };

  // Update Product Row
  const handleUpdateProductRow = (id: string, field: string, value: any) => {
    setProductRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Submit RFQ Action
  const handleSubmitRFQ = () => {
    const lines: RFQLine[] = productRows.map((r, idx) => ({
      id: `line_${Date.now()}_${idx}`,
      productId: `p_${idx + 1}`,
      productName: r.productName,
      dosageForm: r.dosageForm,
      packSize: r.packaging,
      quantity: r.quantity,
      targetPrice: r.targetPrice,
      requiredDate: expectedDeliveryDate,
      remarks: r.remarks,
      eligibleManufacturersCount: manufacturers.length
    }));

    const newRfq: RFQ = {
      id: `rfq_${Date.now()}`,
      rfqNumber,
      customerId: 'c1',
      customerName: 'Apex Pharma PCD Franchise',
      customerCode: 'CUS000101',
      createdDate: new Date().toISOString().split('T')[0],
      deadlineDate: quotationDueDate,
      status: 'PRICING_IN_PROGRESS',
      lines
    };

    addRFQ(newRfq);
    addAuditLog('RFQ Center', `Submitted RFQ ${rfqNumber} with ${lines.length} products`);
    setCreatedRfqResult(newRfq);

    // Redirect automatically to AI Matching Screen
    setActiveTabLocal('AI_MATCHING');
    setMatchingStep(1);

    setTimeout(() => setMatchingStep(2), 800);
    setTimeout(() => setMatchingStep(3), 1600);
    setTimeout(() => setMatchingStep(4), 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── SAP / Oracle Command Header ────────────────────── */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Apex Pharma Corporate Portal / Buyer Workspace</div>
            <div className="ent-page-title" style={{ margin: 0 }}>Pharmaceutical Sourcing & Procurement</div>
          </div>
        </div>
        <div className="ent-command-bar-right">
          <button
            onClick={() => openCreateRfqDrawer()}
            className="ent-btn-primary"
            style={{ padding: '10px 20px', fontSize: 13.5 }}
          >
            <Plus size={16} /> + Create New RFQ
          </button>
        </div>
      </div>

      {/* ── Sub Tabs Navigation ────────────────────────────── */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        <button
          className={`ent-tab ${activeTabLocal === 'DASHBOARD' ? 'active' : ''}`}
          onClick={() => setActiveTabLocal('DASHBOARD')}
        >
          <FileText size={14} /> Buyer Dashboard
        </button>
        <button
          className={`ent-tab`}
          onClick={() => setActiveTab('rfqs')}
        >
          <Layers size={14} /> RFQ Center ({rfqs.length})
        </button>
        <button
          className={`ent-tab`}
          onClick={() => openCreateRfqDrawer()}
        >
          <Plus size={14} /> + Create Master RFQ
        </button>
        {createdRfqResult && (
          <button
            className={`ent-tab ${activeTabLocal === 'AI_MATCHING' ? 'active' : ''}`}
            onClick={() => setActiveTabLocal('AI_MATCHING')}
          >
            <Bot size={14} /> AI Manufacturer Matching
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          VIEW 1: BUYER DASHBOARD (Top KPIs + Quick Actions)
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Top KPI Cards (Simple enterprise cards) */}
          <div className="ent-kpi-strip">
            <div className="ent-kpi-strip-item" onClick={() => navigateWithFilter('rfqs', 'PRICING_IN_PROGRESS')} style={{ cursor: 'pointer' }} title="View Active RFQs">
              <div className="kpi-label">Open RFQs</div>
              <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>{openRfqsCount}</div>
              <div className="kpi-sub">Active in sourcing cycle</div>
            </div>

            <div className="ent-kpi-strip-item" onClick={() => navigateWithFilter('quotes', 'SUBMITTED')} style={{ cursor: 'pointer' }} title="View Submitted Quotes">
              <div className="kpi-label">Quotes Received</div>
              <div className="kpi-value" style={{ color: 'var(--c-info, #0284C7)' }}>{quotesReceivedCount}</div>
              <div className="kpi-sub">Sealed manufacturer bids</div>
            </div>

            <div className="ent-kpi-strip-item" onClick={() => navigateWithFilter('orders', 'IN_PRODUCTION')} style={{ cursor: 'pointer' }} title="View Orders In Production">
              <div className="kpi-label">Orders In Progress</div>
              <div className="kpi-value" style={{ color: 'var(--c-success, #047857)' }}>{ordersInProgressCount}</div>
              <div className="kpi-sub">Under production at plant</div>
            </div>

            <div className="ent-kpi-strip-item" onClick={() => navigateWithFilter('quotes', 'PENDING')} style={{ cursor: 'pointer' }} title="View Pending Approval Quotes">
              <div className="kpi-label">Pending Approval</div>
              <div className="kpi-value" style={{ color: 'var(--c-warning, #B45309)' }}>{pendingApprovalCount}</div>
              <div className="kpi-sub">Bids awaiting Buyer PO</div>
            </div>

            <div className="ent-kpi-strip-item" onClick={() => navigateWithFilter('invoices', 'OPEN')} style={{ cursor: 'pointer' }} title="View Pending Invoices">
              <div className="kpi-label">Invoices Pending</div>
              <div className="kpi-value" style={{ color: 'var(--text-secondary)' }}>{invoicesPendingCount}</div>
              <div className="kpi-sub">Accounts payable balance</div>
            </div>
          </div>

          {/* Primary Action Hero Banner */}
          <div className="ent-panel" style={{ padding: 24, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                Ready to Initiate New Pharmaceutical Procurement?
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 640 }}>
                Define target formulation specifications, quantities, and delivery terms. FactoryGrid AI automatically matches your requirement against verified WHO-GMP & CDSCO facilities.
              </div>
            </div>
            <button
              onClick={() => setActiveTabLocal('CREATE_RFQ')}
              className="ent-btn-primary"
              style={{ padding: '12px 24px', fontSize: 14 }}
            >
              <Plus size={16} /> + Create New RFQ
            </button>
          </div>

          {/* Active Sourcing Pipeline Table */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Active Sourcing RFQs</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Current RFQs submitted to platform AI matching engine</div>
              </div>
              <button onClick={() => setActiveTab('rfqs')} className="ent-btn-ghost">View All ({rfqs.length}) →</button>
            </div>

            <table className="ent-table">
              <thead>
                <tr>
                  <th>RFQ Reference</th>
                  <th>Products Specified</th>
                  <th>Submitted Date</th>
                  <th>Quotation Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.slice(0, 5).map(rfq => (
                  <tr key={rfq.id}>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>{rfq.rfqNumber}</td>
                    <td className="ent-body" style={{ fontWeight: 600 }}>
                      {rfq.lines.map(l => l.productName).join(', ')}
                    </td>
                    <td className="ent-mono">{rfq.createdDate}</td>
                    <td className="ent-mono">{rfq.deadlineDate}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: rfq.status === 'PRICING_IN_PROGRESS' ? '#0284C7' : '#047857' }} />
                        {rfq.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => setActiveTab('quotes')} className="ent-btn-secondary" style={{ padding: '4px 10px', fontSize: 11.5 }}>
                        Track Quotes →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notifications Panel */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} />
                <div className="ent-section-title">Recent Sourcing Notifications</div>
              </div>
            </div>
            <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.slice(0, 4).map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-primary)', marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>
                  </div>
                  <div className="ent-caption" style={{ whiteSpace: 'nowrap' }}>{n.timestamp}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 2: RFQ CENTER
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'RFQ_CENTER' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div className="ent-section-title">All RFQ Requests</div>
            <button onClick={() => openCreateRfqDrawer()} className="ent-btn-primary">
              <Plus size={14} /> + Create Master RFQ
            </button>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th>RFQ Reference</th>
                <th>Buyer Company</th>
                <th>Products Specified</th>
                <th>Target Delivery Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq.id}>
                  <td className="ent-mono" style={{ fontWeight: 700 }}>{rfq.rfqNumber}</td>
                  <td className="ent-body">{rfq.customerName}</td>
                  <td className="ent-body" style={{ fontWeight: 600 }}>
                    {rfq.lines.map(l => l.productName).join(', ')}
                  </td>
                  <td className="ent-mono">{rfq.deadlineDate}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284C7' }} />
                      {rfq.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setActiveTab('quotes')} className="ent-btn-secondary" style={{ padding: '4px 10px', fontSize: 11.5 }}>
                      View Quotes →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 3: CREATE RFQ FORM (Enterprise Form Spec)
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'CREATE_RFQ' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Form Header */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Create Pharmaceutical RFQ Sourcing Request</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Define formulation specifications, target pricing, and compliance requirements</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => alert('RFQ Draft Saved.')} className="ent-btn-secondary">
                  Save Draft
                </button>
                <button onClick={handleSubmitRFQ} className="ent-btn-primary">
                  Submit RFQ & Run AI Match →
                </button>
              </div>
            </div>

            {/* General Information Grid */}
            <div className="ent-panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>RFQ Number (Auto Generated)</label>
                <input type="text" value={rfqNumber} readOnly className="ent-input ent-mono" style={{ background: 'var(--bg-subtle)', fontWeight: 700 }} />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Buyer Name (Readonly)</label>
                <input type="text" value="Dr. Vikram Sethi (Procurement Head)" readOnly className="ent-input" style={{ background: 'var(--bg-subtle)' }} />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Company (Readonly)</label>
                <input type="text" value="Apex Pharma Labs Ltd (BUY-2026-101)" readOnly className="ent-input" style={{ background: 'var(--bg-subtle)', fontWeight: 700 }} />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Expected Delivery Date *</label>
                <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="ent-input ent-mono" />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Priority *</label>
                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="ent-input">
                  <option value="NORMAL">NORMAL (Standard Lead Time)</option>
                  <option value="HIGH">HIGH (Expedited Audit)</option>
                  <option value="URGENT">URGENT (Critical Stockout)</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="ent-label" style={{ marginBottom: 6 }}>Delivery Location *</label>
                <input type="text" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} className="ent-input" />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="ent-label" style={{ marginBottom: 6 }}>Remarks & Compliance Instructions</label>
                <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="ent-input" style={{ resize: 'none' }} />
              </div>
            </div>
          </div>

          {/* Product Specifications Table */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Product Line Items ({productRows.length})</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Specify dosage forms, strength, packaging, and target target price</div>
              </div>
              <button onClick={handleAddProductRow} className="ent-btn-secondary">
                <Plus size={14} /> + Add Product Row
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ent-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Strength</th>
                    <th>Dosage Form</th>
                    <th>Packaging</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Target Price (₹)</th>
                    <th>Remarks</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          value={row.productName}
                          onChange={e => handleUpdateProductRow(row.id, 'productName', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.category}
                          onChange={e => handleUpdateProductRow(row.id, 'category', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.strength}
                          onChange={e => handleUpdateProductRow(row.id, 'strength', e.target.value)}
                          className="ent-input ent-mono"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <select
                          value={row.dosageForm}
                          onChange={e => handleUpdateProductRow(row.id, 'dosageForm', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        >
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Injectable">Injectable</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Ointment">Ointment</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.packaging}
                          onChange={e => handleUpdateProductRow(row.id, 'packaging', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={e => handleUpdateProductRow(row.id, 'quantity', Number(e.target.value))}
                          className="ent-input ent-mono"
                          style={{ padding: '4px 8px', fontSize: 12, fontWeight: 700 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.unit}
                          onChange={e => handleUpdateProductRow(row.id, 'unit', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.targetPrice}
                          onChange={e => handleUpdateProductRow(row.id, 'targetPrice', Number(e.target.value))}
                          className="ent-input ent-mono"
                          style={{ padding: '4px 8px', fontSize: 12, fontWeight: 700 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={e => handleUpdateProductRow(row.id, 'remarks', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemoveProductRow(row.id)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RFQ Settings & Terms */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">RFQ Sourcing Settings & Terms</div>
            </div>
            <div className="ent-panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Quotation Due Date *</label>
                <input type="date" value={quotationDueDate} onChange={e => setQuotationDueDate(e.target.value)} className="ent-input ent-mono" />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Delivery Terms *</label>
                <select value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} className="ent-input">
                  <option value="CIF Destination">CIF Destination (Included Freight & Insurance)</option>
                  <option value="FOB Plant">FOB Plant (Buyer Freight Pickup)</option>
                  <option value="Ex-Works">Ex-Works Factory Door</option>
                </select>
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Payment Terms *</label>
                <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="ent-input">
                  <option value="45 Days Credit">45 Days Corporate Credit Line</option>
                  <option value="30% Advance + 70% LC">30% Advance + 70% Irrevocable LC</option>
                  <option value="100% Advance">100% Advance RTGS</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={allowPartialAward} onChange={e => setAllowPartialAward(e.target.checked)} style={{ accentColor: 'var(--c-primary)' }} />
                  <strong>Allow Partial Award</strong> (Split quantities across multiple manufacturers)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={allowMultipleMfg} onChange={e => setAllowMultipleMfg(e.target.checked)} style={{ accentColor: 'var(--c-primary)' }} />
                  <strong>Allow Multiple Manufacturers</strong> (Broadcast sealed bids to all matched units)
                </label>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">Mandatory Technical Attachments</div>
            </div>
            <div className="ent-panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {[
                { title: 'Upload Specification', icon: FileText },
                { title: 'Upload Artwork', icon: Upload },
                { title: 'Upload Quality Docs', icon: ShieldCheck },
                { title: 'Upload BOQ', icon: Layers },
              ].map((att, i) => {
                const Icon = att.icon;
                return (
                  <div key={i} style={{ border: '1px dashed var(--border-subtle)', borderRadius: 8, padding: 16, textAlign: 'center', background: 'var(--bg-subtle)' }}>
                    <Icon size={20} style={{ color: 'var(--text-tertiary)', marginBottom: 6 }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{att.title}</div>
                    <button
                      onClick={() => {
                        const fileName = `${att.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
                        setAttachments(prev => [...prev, { name: fileName, type: att.title, size: '1.8 MB' }]);
                        alert(`Attached ${fileName}`);
                      }}
                      className="ent-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      Choose File
                    </button>
                  </div>
                );
              })}
            </div>

            {attachments.length > 0 && (
              <div style={{ padding: '0 20px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {attachments.map((a, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <File size={12} /> {a.name} ({a.size})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setActiveTabLocal('DASHBOARD')} className="ent-btn-secondary">
              Cancel
            </button>
            <button onClick={() => alert('RFQ Draft Saved.')} className="ent-btn-secondary">
              Save Draft
            </button>
            <button onClick={handleSubmitRFQ} className="ent-btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
              Submit RFQ & Run AI Match →
            </button>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 4: AUTOMATED AI MANUFACTURER MATCHING MODULE
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'AI_MATCHING' && createdRfqResult && (
        <AIMatchingModule
          rfq={createdRfqResult}
          onNavigateToQuotes={() => setActiveTab('quotes')}
          onNavigateToDashboard={() => setActiveTabLocal('DASHBOARD')}
        />
      )}

    </div>
  );
};
