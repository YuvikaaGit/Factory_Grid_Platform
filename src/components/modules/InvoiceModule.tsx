import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import {
  Receipt, DollarSign, Download, Printer, CheckCircle2,
  Clock, AlertCircle, X, CreditCard, TrendingUp, ArrowRight, ChevronRight,
  Filter, Search, MoreVertical, Calendar, ArrowUpRight, TrendingDown, Banknote,
  FileText, ShieldCheck, RefreshCw, AlertTriangle, Plus, Check, Landmark, Building2, Upload
} from 'lucide-react';

export const InvoiceModule: React.FC = () => {
  const {
    invoices, recordInvoicePayment, currentRole, addAuditLog,
    orders, manufacturers
  } = useApp();

  const [activeTabLocal, setActiveTabLocal] = useState<'INVOICES_LIST' | 'GENERATE_INVOICE' | 'VERIFICATION' | 'OUTSTANDING' | 'REPORTS'>('INVOICES_LIST');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Payment Entry Modal / Drawer State
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('UTRB-2026-991823');
  const [bankName, setBankName] = useState('HDFC Bank Corporate');
  const [paymentMode, setPaymentMode] = useState('RTGS');

  // Generate Invoice Form State (Manufacturer)
  const [genInvoiceNum] = useState(`INV-2026-${4400 + invoices.length + 1}`);
  const [linkedMasterOrder, setLinkedMasterOrder] = useState('MO-2026-1001');
  const [linkedSubOrder, setLinkedSubOrder] = useState('SO-2026-1001-01');
  const [buyerName, setBuyerName] = useState('Apex Pharma Labs Ltd (BUY-2026-101)');
  const [mfgName, setMfgName] = useState('SunBio LifeSciences Ltd');
  const [invoiceDate, setInvoiceDate] = useState('2026-08-08');
  const [dueDate, setDueDate] = useState('2026-09-22');
  const [hsnSacCode, setHsnSacCode] = useState('30049099');
  const [gstRate, setGstRate] = useState(12);
  const [subtotalAmount, setSubtotalAmount] = useState(2450000);
  const [freightAmount, setFreightAmount] = useState(35000);
  const [otherCharges, setOtherCharges] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Role Checks
  const isManufacturer = currentRole === 'SUPPLIER';
  const isBuyer = currentRole === 'BUYER';
  const isAccounts = currentRole === 'ACCOUNTS_MANAGER' || currentRole === 'ADMIN';

  // Calculated Metrics
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === 'PAID') return inv.balanceAmount === 0;
    if (statusFilter === 'OUTSTANDING') return inv.balanceAmount > 0;
    if (statusFilter === 'OVERDUE') return inv.status === 'OVERDUE';
    return true;
  });

  // Status Chip Generator (Paid: Green, Partial: Blue, Outstanding: Orange, Overdue: Red)
  const renderStatusChip = (inv: Invoice) => {
    if (inv.balanceAmount === 0) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> Paid
        </span>
      );
    }
    if (inv.paidAmount > 0) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} /> Partially Paid
        </span>
      );
    }
    if (inv.status === 'OVERDUE') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> Overdue
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} /> Outstanding
      </span>
    );
  };

  // Handle Generate Invoice Submit (Manufacturer)
  const handleGenerateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gstVal = Math.round(subtotalAmount * (gstRate / 100));
    const grandTot = subtotalAmount + gstVal + freightAmount + otherCharges;

    addAuditLog('Invoice Engine', `Generated Tax Invoice ${genInvoiceNum} for ${buyerName} (Total ₹${grandTot.toLocaleString()})`);
    alert(`✔ Invoice ${genInvoiceNum} Generated Successfully!\n\nGrand Total: ₹${grandTot.toLocaleString()}\nBuyer notification dispatched to Apex Pharma Labs Ltd.`);
    setActiveTabLocal('INVOICES_LIST');
  };

  // Handle Payment Entry (Buyer / Accounts)
  const handleExecutePayment = () => {
    if (!showPaymentModal) return;
    const amount = Number(paymentAmount) || showPaymentModal.balanceAmount;

    recordInvoicePayment(showPaymentModal.id, amount, paymentMode, utrNumber);
    addAuditLog('Treasury Ledger', `Recorded payment of ₹${amount.toLocaleString()} via ${paymentMode} (UTR: ${utrNumber}) for Invoice ${showPaymentModal.invoiceNumber}`);

    alert(`✔ Payment Entry Submitted!\n\nInvoice: ${showPaymentModal.invoiceNumber}\nAmount Paid: ₹${amount.toLocaleString()}\nMode: ${paymentMode}\nUTR Number: ${utrNumber}\n\nAccounts verification triggered. Order status updated to COMPLETED.`);

    setShowPaymentModal(null);
    setPaymentAmount('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── TOP HEADER BAR ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Receipt size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Finance</span>
              <ChevronRight size={12} />
              <span>Treasury Ledger</span>
              <ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Accounts Receivable & Invoices</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Accounts Receivable & Invoice Management
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Manage B2B tax invoices, track credit line utilization, record RTGS remittances, and verify treasury entries.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search invoice#, PO, customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 240, height: 38, paddingLeft: 34, paddingRight: 12, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
            />
          </div>

          {isManufacturer && (
            <button onClick={() => setActiveTabLocal('GENERATE_INVOICE')} style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> + Generate Tax Invoice
            </button>
          )}
        </div>
      </div>

      {/* ── QUICK KPI CARDS ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Outstanding</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#D97706', marginTop: 10, letterSpacing: '-0.02em' }}>₹{totalOutstanding.toLocaleString()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#D97706', fontWeight: 700 }}>● Unsettled</span>
            <span style={{ color: '#64748B' }}>{invoices.filter(i => i.balanceAmount > 0).length} open invoices</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected (YTD)</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16A34A', marginTop: 10, letterSpacing: '-0.02em' }}>₹{totalPaid.toLocaleString()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#16A34A', fontWeight: 700 }}>↑ {collectionRate}%</span>
            <span style={{ color: '#64748B' }}>Collection efficiency</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoices</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 10, letterSpacing: '-0.02em' }}>{invoices.length}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#2563EB', fontWeight: 700 }}>₹{totalInvoiced.toLocaleString()}</span>
            <span style={{ color: '#64748B' }}>B2B Form 27B Tax Invoices</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credit Line Utilization</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 10, letterSpacing: '-0.02em' }}>27.7%</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ Healthy</span>
            <span style={{ color: '#64748B' }}>₹7.22M Available Credit</span>
          </div>
        </div>
      </div>

      {/* ── ACTION TOOLBAR ───────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { id: 'INVOICES_LIST', label: `Invoices List (${invoices.length})` },
            { id: 'OUTSTANDING', label: `Outstanding & Credit` },
            { id: 'REPORTS', label: `AR Reports & Aging` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabLocal(tab.id as any)}
              style={{
                height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12.5, fontWeight: activeTabLocal === tab.id ? 700 : 500,
                background: activeTabLocal === tab.id ? '#2563EB' : 'transparent', color: activeTabLocal === tab.id ? '#FFFFFF' : '#475569',
                border: 'none', cursor: 'pointer', transition: 'all 120ms ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, color: '#334155', outline: 'none' }}>
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid Invoices</option>
            <option value="OUTSTANDING">Outstanding</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <button onClick={() => alert('Ledger Refreshed.')} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => alert('Exporting Invoice Ledger...')} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <Download size={13} /> Export Excel
          </button>
        </div>
      </div>

      {/* ── MAIN DATA TABLE ──────────────────────────────────── */}
      {activeTabLocal === 'INVOICES_LIST' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 20px' }}>Invoice Number</th>
                <th style={{ padding: '14px 16px' }}>Master Order</th>
                <th style={{ padding: '14px 16px' }}>Manufacturer / Seller</th>
                <th style={{ padding: '14px 16px' }}>Buyer Customer</th>
                <th style={{ padding: '14px 16px' }}>Invoice Date</th>
                <th style={{ padding: '14px 16px' }}>Due Date</th>
                <th style={{ padding: '14px 16px' }}>Invoice Amount</th>
                <th style={{ padding: '14px 16px' }}>Balance Payable</th>
                <th style={{ padding: '14px 16px' }}>Payment Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>No invoices found.</td></tr>
              ) : filteredInvoices.map(inv => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 120ms ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                >
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                    {inv.invoiceNumber}
                  </td>

                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#64748B' }}>
                    {inv.orderNumber}
                  </td>

                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                    SunBio LifeSciences Ltd
                  </td>

                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                    {inv.customerName}
                  </td>

                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#334155' }}>
                    {inv.invoiceDate}
                  </td>

                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#334155' }}>
                    {inv.dueDate}
                  </td>

                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                    ₹{inv.totalAmount.toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: inv.balanceAmount > 0 ? '#D97706' : '#16A34A' }}>
                    ₹{inv.balanceAmount.toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    {renderStatusChip(inv)}
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                      >
                        PDF View
                      </button>

                      {inv.balanceAmount > 0 && isAccounts && (
                        <button
                          onClick={() => { setShowPaymentModal(inv); setPaymentAmount(String(inv.balanceAmount)); }}
                          style={{ padding: '5px 12px', borderRadius: 6, background: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Record Payment →
                        </button>
                      )}

                      {inv.balanceAmount > 0 && isBuyer && (
                        <button
                          onClick={() => alert(`Online Payment Gateway:\n\nInitiating secure payment for Invoice ${inv.invoiceNumber}.\nOutstanding Balance: ₹${inv.balanceAmount.toLocaleString()}`)}
                          style={{ padding: '5px 12px', borderRadius: 6, background: '#166534', color: '#FFFFFF', border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Pay Now →
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── GENERATE INVOICE FORM (Manufacturer) ──────────────── */}
      {activeTabLocal === 'GENERATE_INVOICE' && isManufacturer && (
        <form onSubmit={handleGenerateInvoiceSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Generate B2B Tax Invoice (Form 27B Spec)</h3>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>Issue official GST tax invoice for delivered formulation batch</div>
            </div>
            <button type="submit" style={{ padding: '8px 20px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Submit Invoice & Notify Buyer →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Invoice Number (Auto)</label>
              <input type="text" value={genInvoiceNum} readOnly style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Linked Master Order *</label>
              <input type="text" value={linkedMasterOrder} onChange={e => setLinkedMasterOrder(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Linked Sub Order *</label>
              <input type="text" value={linkedSubOrder} onChange={e => setLinkedSubOrder(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Buyer Name (Consignee) *</label>
              <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Manufacturer (Seller) *</label>
              <input type="text" value={mfgName} readOnly style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', fontWeight: 700, fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>HSN / SAC Code *</label>
              <input type="text" value={hsnSacCode} onChange={e => setHsnSacCode(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Invoice Date *</label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Payment Due Date *</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Subtotal Amount (₹) *</label>
              <input type="number" value={subtotalAmount} onChange={e => setSubtotalAmount(Number(e.target.value))} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }} />
            </div>
          </div>
        </form>
      )}

      {/* ── PAYMENT ENTRY MODAL (Finance & Accounts Only) ───────────────────── */}
      {showPaymentModal && isAccounts && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, width: 460, padding: 24, boxShadow: '0 12px 28px rgba(15,23,42,0.15)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Record Payment Entry & Bank Remittance</h3>
            <div style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 16px' }}>
              Invoice: {showPaymentModal.invoiceNumber} · Balance: ₹{showPaymentModal.balanceAmount.toLocaleString()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Payment Amount (₹) *</label>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Payment Mode *</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                  <option value="RTGS">RTGS Real-Time Gross Settlement</option>
                  <option value="NEFT">NEFT National Electronic Funds Transfer</option>
                  <option value="LC">Letter of Credit (LC)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Bank UTR / Ref Number *</label>
                <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Remittance Bank Name *</label>
                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowPaymentModal(null)} style={{ height: 36, padding: '0 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecutePayment} style={{ height: 36, padding: '0 18px', borderRadius: 6, background: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Submit Payment Entry →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RIGHT SLIDE-OVER DRAWER FOR INVOICE PDF PREVIEW ───── */}
      {selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 620, height: '100vh', background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(15,23,42,0.12)' }}>

            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>B2B TAX INVOICE PREVIEW</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{selectedInvoice.invoiceNumber}</h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
              <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: 14, marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>SUNBIO LIFESCIENCES LTD</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>Baddi Industrial Estate, HP · GSTIN: 02SUNBI0001A1Z8</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#2563EB' }}>TAX INVOICE</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{selectedInvoice.invoiceNumber}</div>
                </div>
              </div>

              <div style={{ fontSize: 12.5, color: '#334155', marginBottom: 18 }}>
                <strong>Bill To:</strong> {selectedInvoice.customerName}<br />
                <strong>Invoice Date:</strong> {selectedInvoice.invoiceDate} | <strong>Due Date:</strong> {selectedInvoice.dueDate}<br />
                <strong>Total Amount Payable:</strong> ₹{selectedInvoice.totalAmount.toLocaleString()}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '8px 10px' }}>Line Item</th>
                    <th style={{ padding: '8px 10px' }}>Qty</th>
                    <th style={{ padding: '8px 10px' }}>Unit Price</th>
                    <th style={{ padding: '8px 10px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lines?.map((l: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{l.productName}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{l.quantity}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>₹{l.unitPrice}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700 }}>₹{l.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
