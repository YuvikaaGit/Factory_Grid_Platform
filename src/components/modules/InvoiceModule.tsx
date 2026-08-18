import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, PaymentRecord, InvoiceStatus } from '../../types';
import {
  Receipt, DollarSign, Download, Printer, CheckCircle2,
  Clock, AlertCircle, X, CreditCard, TrendingUp, ArrowRight, ChevronRight,
  Filter, Search, MoreVertical, Calendar, ArrowUpRight, TrendingDown, Banknote,
  FileText, ShieldCheck, RefreshCw, AlertTriangle, Plus, Check, Landmark, Building2, Upload,
  Send, Copy, Bell, CheckCircle, PieChart, Layers
} from 'lucide-react';

export const InvoiceModule: React.FC = () => {
  const {
    invoices, recordInvoicePayment, currentRole, addAuditLog,
    addInvoice, updateInvoiceStatus
  } = useApp();

  const [activeTabLocal, setActiveTabLocal] = useState<'INVOICES_LIST' | 'GENERATE_INVOICE' | 'OUTSTANDING' | 'REPORTS'>('INVOICES_LIST');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('GBP');
  const [utrNumber, setUtrNumber] = useState(`UTR-${Date.now().toString().slice(-6)}`);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Generate Invoice Form State
  const [genInvoiceNum] = useState(`INV-2026-${4400 + invoices.length + 1}`);
  const [genCurrency, setGenCurrency] = useState('GBP');
  const [linkedMasterOrder, setLinkedMasterOrder] = useState('MO-2026-1001');
  const [linkedSubOrder, setLinkedSubOrder] = useState('SO-2026-1001-01');
  const [buyerName, setBuyerName] = useState('Apex Pharma PCD Franchise');
  const [mfgName, setMfgName] = useState('SunBio LifeSciences Ltd');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('2026-09-25');
  const [hsnSacCode, setHsnSacCode] = useState('30049099');
  const [subtotalAmount, setSubtotalAmount] = useState(150);
  const [taxRate, setTaxRate] = useState(0);
  const [freightAmount, setFreightAmount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Role Checks
  const isManufacturer = currentRole === 'SUPPLIER';
  const isBuyer = currentRole === 'BUYER';
  const isAccounts = currentRole === 'ACCOUNTS_MANAGER' || currentRole === 'ADMIN';

  // Helper Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Synchronize selectedInvoice when invoices list updates in state
  const activeDetailInvoice = selectedInvoice
    ? (invoices.find(i => i.id === selectedInvoice.id || i.invoiceNumber === selectedInvoice.invoiceNumber) || selectedInvoice)
    : (invoices[0] || null);

  // Calculated Metrics across stored invoices
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const collectionRate = totalInvoiced > 0 ? Math.min(100, Math.round((totalPaid / totalInvoiced) * 100)) : 0;

  const filteredInvoices = invoices.filter(inv => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = q === '' ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.orderNumber.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (statusFilter === 'PAID') return inv.balanceAmount === 0;
    if (statusFilter === 'PARTIALLY_PAID') return inv.paidAmount > 0 && inv.balanceAmount > 0;
    if (statusFilter === 'UNPAID') return inv.paidAmount === 0 && inv.balanceAmount > 0;
    if (statusFilter === 'OVERDUE') return inv.status === 'OVERDUE';
    return true;
  });

  // Currency Symbol Helper
  const getCurrencySymbol = (curr?: string) => {
    if (!curr) return '₹';
    const c = curr.toUpperCase();
    if (c === 'GBP' || c === '£') return '£';
    if (c === 'USD' || c === '$') return '$';
    if (c === 'EUR' || c === '€') return '€';
    return '₹';
  };

  // Status Chip Generator (Unpaid, Partially Paid, Paid, Overdue)
  const renderStatusChip = (inv: Invoice) => {
    if (inv.balanceAmount === 0) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
          <CheckCircle size={13} /> Paid
        </span>
      );
    }
    if (inv.paidAmount > 0) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #93C5FD' }}>
          <Clock size={13} /> Partially Paid
        </span>
      );
    }
    if (inv.status === 'OVERDUE') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}>
          <AlertCircle size={13} /> Overdue
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
        <Clock size={13} /> Unpaid
      </span>
    );
  };

  // Open Record Payment Modal
  const handleOpenRecordPaymentModal = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowPaymentModal(inv);
    setPaymentAmount(String(inv.balanceAmount));
    setPaymentCurrency(inv.currency || 'GBP');
    setUtrNumber(`UTR-${Date.now().toString().slice(-6)}`);
    setPaymentMode('Bank Transfer');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentError(null);
  };

  // Submit Payment Record
  const handleExecutePaymentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!showPaymentModal) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      return;
    }

    if (amt > showPaymentModal.balanceAmount + 0.01) {
      setPaymentError(`Payment amount cannot exceed outstanding balance of ${getCurrencySymbol(paymentCurrency)} ${showPaymentModal.balanceAmount.toLocaleString()}.`);
      return;
    }

    recordInvoicePayment(showPaymentModal.id, amt, paymentMode, utrNumber, paymentCurrency);

    const updatedPaid = showPaymentModal.paidAmount + amt;
    const updatedBal = Math.max(0, showPaymentModal.totalAmount - updatedPaid);

    showToast(`✔ Payment of ${paymentCurrency} ${amt.toLocaleString()} recorded for ${showPaymentModal.invoiceNumber}! Status: ${updatedBal === 0 ? 'PAID' : 'PARTIALLY PAID'}`);

    setShowPaymentModal(null);
    setPaymentAmount('');
    setPaymentError(null);
  };

  // Instant Mark as Paid Handler
  const handleMarkAsPaid = (inv: Invoice) => {
    if (inv.balanceAmount <= 0) return;
    recordInvoicePayment(inv.id, inv.balanceAmount, 'Full Settlement', `SETTLE-${Date.now().toString().slice(-6)}`, inv.currency || 'GBP');
    showToast(`✔ Invoice ${inv.invoiceNumber} marked as fully PAID!`);
  };

  // Remind Client Action
  const handleRemindClient = (inv: Invoice) => {
    addAuditLog('Invoice Engine', `Sent payment reminder to client ${inv.customerName} for Invoice ${inv.invoiceNumber} (Outstanding ${inv.currency || 'GBP'} ${inv.balanceAmount.toLocaleString()})`);
    showToast(`🔔 Payment reminder sent to ${inv.customerName} for ${inv.invoiceNumber}.`);
  };

  // Duplicate Invoice Action
  const handleDuplicateInvoice = (inv: Invoice) => {
    const dupNum = `INV-2026-${Math.floor(5000 + Math.random() * 4000)}`;
    const duplicatedInv: Invoice = {
      ...inv,
      id: 'inv_' + Date.now(),
      invoiceNumber: dupNum,
      invoiceDate: new Date().toISOString().split('T')[0],
      paidAmount: 0,
      balanceAmount: inv.totalAmount,
      status: 'UNPAID',
      payments: []
    };
    addInvoice(duplicatedInv);
    setSelectedInvoice(duplicatedInv);
    showToast(`📋 Invoice duplicated as ${dupNum}!`);
  };

  // Generate Tax Invoice Submit (Manufacturer)
  const handleGenerateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = subtotalAmount + (subtotalAmount * taxRate / 100) + freightAmount;
    const newInv: Invoice = {
      id: 'inv_' + Date.now(),
      invoiceNumber: genInvoiceNum,
      masterOrderId: 'mo1',
      orderNumber: linkedMasterOrder,
      subOrderId: 'so1',
      subOrderNumber: linkedSubOrder,
      customerId: 'c1',
      customerName: buyerName,
      customerCode: 'CUS000101',
      manufacturerId: 'm1',
      manufacturerName: mfgName,
      invoiceDate,
      dueDate,
      subtotal: subtotalAmount,
      taxTotal: (subtotalAmount * taxRate / 100),
      totalAmount: tot,
      paidAmount: 0,
      balanceAmount: tot,
      status: 'UNPAID',
      currency: genCurrency,
      lines: [
        { id: 'il_new', productId: 'p1', productName: 'Pharmaceutical Line Batch', hsnCode: hsnSacCode, quantity: 1, unitPrice: subtotalAmount, taxAmount: 0, totalAmount: subtotalAmount }
      ]
    };

    addInvoice(newInv);
    setSelectedInvoice(newInv);
    showToast(`✔ Invoice ${genInvoiceNum} created successfully as UNPAID (${genCurrency} ${tot.toLocaleString()})!`);
    setActiveTabLocal('INVOICES_LIST');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60, background: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>

      {/* ── TOAST NOTIFICATION ───────────────────────────────── */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 11000, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.2s ease' }}>
          <CheckCircle2 size={18} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP HEADER BAR ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Receipt size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Finance & Accounts</span>
              <ChevronRight size={12} />
              <span>Treasury Ledger</span>
              <ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Payment Lifecycle & Invoices</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Invoice Payment Lifecycle & Settlement Matrix
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Track B2B invoice statuses (Unpaid, Partially Paid, Paid), record RTGS/NEFT payments, and audit settlement timelines.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search invoice#, customer, order..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 230, height: 38, paddingLeft: 34, paddingRight: 12, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
            />
          </div>

          {isManufacturer && (
            <button onClick={() => setActiveTabLocal('GENERATE_INVOICE')} style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> + Generate Tax Invoice
            </button>
          )}
        </div>
      </div>

      {/* ── KPI DASHBOARD METRICS ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoiced</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            ₹{totalInvoiced.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Across {invoices.length} issued invoices</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Received</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', marginTop: 8 }}>
            ₹{totalPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginTop: 4 }}>↑ {collectionRate}% Collection rate</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Outstanding</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', marginTop: 8 }}>
            ₹{totalOutstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#D97706', fontWeight: 600, marginTop: 4 }}>{invoices.filter(i => i.balanceAmount > 0).length} pending settlements</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partially Paid Invoices</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1D4ED8', marginTop: 8 }}>
            {invoices.filter(i => i.paidAmount > 0 && i.balanceAmount > 0).length} Invoices
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Active installment plans</div>
        </div>
      </div>

      {/* ── ACTION TOOLBAR & FILTER TABS ───────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px 18px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { id: 'INVOICES_LIST', label: `Invoices List (${invoices.length})` },
            { id: 'OUTSTANDING', label: `Outstanding Ledger` },
            { id: 'REPORTS', label: `AR Aging & Analytics` },
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
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, color: '#334155', fontWeight: 600, outline: 'none', background: '#FFFFFF' }}>
            <option value="ALL">All Payment Statuses</option>
            <option value="UNPAID">Unpaid / Payment Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid / Fully Settled</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* ── MAIN LAYOUT: TABLE + DEMO INVOICE DETAIL VIEW ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: activeDetailInvoice ? '1.1fr 0.9fr' : '1fr', gap: 20, alignItems: 'start' }}>

        {/* ── INVOICES TABLE ─────────────────────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Invoices Ledger</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Invoice #</th>
                <th style={{ padding: '12px 14px' }}>Client</th>
                <th style={{ padding: '12px 14px' }}>Amount</th>
                <th style={{ padding: '12px 14px' }}>Paid</th>
                <th style={{ padding: '12px 14px' }}>Outstanding</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8' }}>No invoices found matching criteria.</td></tr>
              ) : (
                filteredInvoices.map(inv => {
                  const currSym = getCurrencySymbol(inv.currency);
                  const isSelected = activeDetailInvoice?.id === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      style={{
                        borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        transition: 'background 120ms ease'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#FFFFFF'; }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                        {inv.invoiceNumber}
                        <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 400 }}>Order: {inv.orderNumber}</div>
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inv.customerName}
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                        {currSym} {inv.totalAmount.toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#16A34A' }}>
                        {currSym} {inv.paidAmount.toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: inv.balanceAmount > 0 ? '#D97706' : '#16A34A' }}>
                        {currSym} {inv.balanceAmount.toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {renderStatusChip(inv)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        {inv.balanceAmount > 0 ? (
                          <button
                            onClick={e => handleOpenRecordPaymentModal(inv, e)}
                            style={{ padding: '4px 10px', borderRadius: 6, background: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Record Payment
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            View Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── INVOICE DETAIL PAGE (MATCHING DEMO PAYMENT LIFECYCLE) ───────────── */}
        {activeDetailInvoice && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 2px 8px rgba(15,23,42,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ padding: '18px 22px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>INVOICE PAYMENT LIFECYCLE</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
                  {activeDetailInvoice.invoiceNumber}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {renderStatusChip(activeDetailInvoice)}
              </div>
            </div>

            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Invoice Summary Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Client Name</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{activeDetailInvoice.customerName}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Order Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{activeDetailInvoice.orderNumber}</span></div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Invoice Amount</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 2, letterSpacing: '-0.02em' }}>
                    {activeDetailInvoice.currency || 'GBP'} {activeDetailInvoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* ── VISUAL PAYMENT PROGRESS BAR ── */}
              {(() => {
                const curr = activeDetailInvoice.currency || 'GBP';
                const total = activeDetailInvoice.totalAmount || 1;
                const paid = activeDetailInvoice.paidAmount || 0;
                const balance = activeDetailInvoice.balanceAmount;
                const pct = Math.min(100, Math.round((paid / total) * 100));

                return (
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: '#0F172A' }}>Payment Settlement Progress</span>
                      <span style={{ color: pct === 100 ? '#16A34A' : pct > 0 ? '#1D4ED8' : '#D97706' }}>{pct}% Settled</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 10, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${pct}%`, background: pct === 100 ? '#16A34A' : '#2563EB', transition: 'width 0.3s ease' }} />
                    </div>

                    {/* Metric Breakdown */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: pct === 100 ? '#16A34A' : '#2563EB' }} />
                        <span style={{ color: '#475569', fontWeight: 600 }}>Paid / Settlement in progress:</span>
                        <strong style={{ color: '#0F172A' }}>{curr} {paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706' }} />
                        <span style={{ color: '#475569', fontWeight: 600 }}>Outstanding:</span>
                        <strong style={{ color: balance > 0 ? '#D97706' : '#16A34A' }}>{curr} {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── PAYMENT DETAILS GRID ── */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Invoice Currency</span>
                  <strong style={{ color: '#0F172A' }}>{activeDetailInvoice.currency || 'GBP'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Payment Method</span>
                  <strong style={{ color: '#0F172A' }}>{activeDetailInvoice.paymentMethod || 'Bank Transfer (RTGS/NEFT)'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Invoice Date</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{activeDetailInvoice.invoiceDate}</span>
                </div>

                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Payment Due Date</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{activeDetailInvoice.dueDate}</span>
                </div>

                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Paid Amount</span>
                  <strong style={{ color: '#16A34A' }}>{activeDetailInvoice.currency || 'GBP'} {activeDetailInvoice.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Outstanding Amount</span>
                  <strong style={{ color: activeDetailInvoice.balanceAmount > 0 ? '#D97706' : '#16A34A' }}>{activeDetailInvoice.currency || 'GBP'} {activeDetailInvoice.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* ── ACTION BUTTONS ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {activeDetailInvoice.balanceAmount > 0 ? (
                  <button
                    onClick={() => handleOpenRecordPaymentModal(activeDetailInvoice)}
                    style={{ padding: '10px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <DollarSign size={15} /> Record Payment
                  </button>
                ) : (
                  <button
                    disabled
                    style={{ padding: '10px', borderRadius: 8, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontWeight: 700, fontSize: 12.5, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <CheckCircle size={15} /> Fully Settled
                  </button>
                )}

                {activeDetailInvoice.balanceAmount > 0 && (
                  <button
                    onClick={() => handleMarkAsPaid(activeDetailInvoice)}
                    style={{ padding: '10px', borderRadius: 8, background: '#FFFFFF', color: '#15803D', border: '1px solid #86EFAC', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Check size={15} /> Mark as Paid
                  </button>
                )}

                <button
                  onClick={() => handleRemindClient(activeDetailInvoice)}
                  style={{ padding: '10px', borderRadius: 8, background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Bell size={14} /> Remind Client
                </button>

                <button
                  onClick={() => handleDuplicateInvoice(activeDetailInvoice)}
                  style={{ padding: '10px', borderRadius: 8, background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Copy size={14} /> Duplicate Invoice
                </button>
              </div>

              {/* ── DATA-DRIVEN PAYMENT TIMELINE ── */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} style={{ color: '#2563EB' }} /> Payment & Settlement Timeline
                </div>

                {(() => {
                  const paymentsList = activeDetailInvoice.payments || [];
                  const curr = activeDetailInvoice.currency || 'GBP';
                  const isFullyPaid = activeDetailInvoice.balanceAmount === 0;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', paddingLeft: 10 }}>
                      <div style={{ position: 'absolute', left: 17, top: 12, bottom: 12, width: 2, background: '#E2E8F0' }} />

                      {/* Event 1: Payment Received */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 1 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: activeDetailInvoice.paidAmount > 0 ? '#16A34A' : '#CBD5E1', border: '3px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1', marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: activeDetailInvoice.paidAmount > 0 ? '#0F172A' : '#64748B' }}>
                            {curr} {activeDetailInvoice.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} received in account
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {paymentsList.length > 0 ? `${paymentsList.length} payment record(s) logged` : 'Awaiting client remittance'}
                          </div>
                        </div>
                      </div>

                      {/* Event 2: Send confirmation email */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 1 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: activeDetailInvoice.paidAmount > 0 ? '#16A34A' : '#CBD5E1', border: '3px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1', marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: activeDetailInvoice.paidAmount > 0 ? '#0F172A' : '#64748B' }}>
                            Send confirmation email to client
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {activeDetailInvoice.paidAmount > 0 ? 'Automated receipt dispatched to client' : 'Pending payment confirmation'}
                          </div>
                        </div>
                      </div>

                      {/* Event 3: Transfer initiated */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 1 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: activeDetailInvoice.paidAmount > 0 ? '#2563EB' : '#CBD5E1', border: '3px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1', marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: activeDetailInvoice.paidAmount > 0 ? '#0F172A' : '#64748B' }}>
                            Transfer initiated & verified
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {activeDetailInvoice.paidAmount > 0 ? `Ref/UTR: ${paymentsList[0]?.reference || 'RTGS-VERIFIED'}` : 'Pending bank dispatch'}
                          </div>
                        </div>
                      </div>

                      {/* Event 4: Reached partner bank */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 1 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: isFullyPaid ? '#16A34A' : activeDetailInvoice.paidAmount > 0 ? '#3B82F6' : '#CBD5E1', border: '3px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1', marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: activeDetailInvoice.paidAmount > 0 ? '#0F172A' : '#64748B' }}>
                            Reached partner bank / Treasury clearing
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {isFullyPaid ? 'Cleared by partner bank' : activeDetailInvoice.paidAmount > 0 ? 'Processing partial clearing' : 'Pending clearing'}
                          </div>
                        </div>
                      </div>

                      {/* Event 5: Settlement completed */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 1 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: isFullyPaid ? '#16A34A' : '#CBD5E1', border: '3px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1', marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: isFullyPaid ? '#15803D' : '#64748B' }}>
                            Final Settlement completed
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {isFullyPaid ? '100% Invoice balance settled' : `Outstanding balance: ${curr} ${activeDetailInvoice.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── GENERATE INVOICE FORM (Manufacturer) ──────────────── */}
      {activeTabLocal === 'GENERATE_INVOICE' && isManufacturer && (
        <form onSubmit={handleGenerateInvoiceSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Generate B2B Tax Invoice (Form 27B Spec)</h3>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>Issue official B2B invoice (Created as Unpaid initially)</div>
            </div>
            <button type="submit" style={{ padding: '8px 20px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Create Invoice (Unpaid) →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Invoice Number (Auto)</label>
              <input type="text" value={genInvoiceNum} readOnly style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Currency *</label>
              <select value={genCurrency} onChange={e => setGenCurrency(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Linked Master Order *</label>
              <input type="text" value={linkedMasterOrder} onChange={e => setLinkedMasterOrder(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Buyer / Client Name *</label>
              <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Manufacturer / Seller *</label>
              <input type="text" value={mfgName} readOnly style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', fontWeight: 700, fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Invoice Total Amount *</label>
              <input type="number" value={subtotalAmount} onChange={e => setSubtotalAmount(Number(e.target.value))} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }} />
            </div>
          </div>
        </form>
      )}

      {/* ── RECORD PAYMENT MODAL ─────────────────────────────────────── */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, width: 480, padding: 24, boxShadow: '0 16px 36px rgba(15,23,42,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Record Invoice Payment</h3>
              <button onClick={() => setShowPaymentModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Invoice #:</span>
                <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{showPaymentModal.invoiceNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#64748B' }}>Total Amount:</span>
                <strong style={{ color: '#0F172A' }}>{paymentCurrency} {showPaymentModal.totalAmount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#64748B' }}>Current Outstanding:</span>
                <strong style={{ color: '#D97706' }}>{paymentCurrency} {showPaymentModal.balanceAmount.toLocaleString()}</strong>
              </div>
            </div>

            {paymentError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> {paymentError}
              </div>
            )}

            <form onSubmit={handleExecutePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Payment Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Currency *</label>
                  <select
                    value={paymentCurrency}
                    onChange={e => setPaymentCurrency(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Payment Method *</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                  <option value="Bank Transfer">Bank Transfer (Wire / BACS)</option>
                  <option value="RTGS">RTGS Real-Time Gross Settlement</option>
                  <option value="NEFT">NEFT National Electronic Funds Transfer</option>
                  <option value="Credit Card">Corporate Credit Card</option>
                  <option value="LC">Letter of Credit (LC)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Payment Date *</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Reference / UTR # *</label>
                  <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 12.5 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowPaymentModal(null)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ height: 38, padding: '0 20px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  Record Payment →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
