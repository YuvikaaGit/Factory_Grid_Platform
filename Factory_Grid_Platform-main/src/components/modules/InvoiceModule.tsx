import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceLine, Customer } from '../../types';
import {
  Receipt, CheckCircle2, Clock, AlertCircle, X, Banknote,
  Search, Plus, Check, Upload, FileText, Edit2, Eye,
  Trash2, Image as ImageIcon, ChevronRight, ArrowLeft,
  Printer, Package, ArrowRight, Save, DollarSign, FileCheck,
  Building2, UserCheck, Shield
} from 'lucide-react';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface InitialInvoiceContextData {
  orderNumber?: string;
  subOrderNumber?: string;
  customerName?: string;
  manufacturerName?: string;
  productName?: string;
  totalQuantity?: number;
  orderValue?: number;
  unitPrice?: number;
}

interface EditableInvoiceLine {
  id: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

interface EditFormState {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  orderNumber: string;
  subOrderNumber: string;
  // Supplier Info
  manufacturerName: string;
  manufacturerAddress: string;
  manufacturerCity: string;
  manufacturerState: string;
  manufacturerCountry: string;
  manufacturerPincode: string;
  manufacturerGstin: string;
  manufacturerPan: string;
  manufacturerLicense: string;
  manufacturerPhone: string;
  manufacturerEmail: string;
  manufacturerWebsite: string;
  logoDataUrl: string;
  // Customer Info
  selectedCustomerId: string;
  customerName: string;
  customerCode: string;
  customerAddress: string;
  consigneeAddress: string;
  customerGstin: string;
  customerPan: string;
  customerPhone: string;
  customerEmail: string;
  // Line Items
  lines: EditableInvoiceLine[];
  // Tax & Freight
  taxType: 'CGST_SGST' | 'IGST';
  freightAmount: number;
  currency: string;
  // Upload Mode
  creationMethod: 'TEXT' | 'UPLOAD';
  uploadedFileName: string;
  uploadedFileType: string;
  uploadedFileSize: string;
  uploadedFileUrl: string;
}

interface InvoiceModuleProps {
  initialViewMode?: 'LIST' | 'WORKSPACE' | 'DETAILS';
  initialData?: InitialInvoiceContextData;
  onComplete?: (createdInvoice: Invoice) => void;
  onCancel?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getCurrencySymbol = (curr?: string) => {
  if (!curr) return '₹';
  const c = curr.toUpperCase();
  if (c === 'GBP' || c === '£') return '£';
  if (c === 'USD' || c === '$') return '$';
  if (c === 'EUR' || c === '€') return '€';
  return '₹';
};

const computeLineTotal = (line: EditableInvoiceLine) => {
  const gross = line.quantity * line.unitPrice;
  const discAmt = gross * (line.discountPercent / 100);
  const taxable = gross - discAmt;
  const taxAmt = taxable * (line.taxPercent / 100);
  return { taxable, taxAmt, total: taxable + taxAmt };
};

const computeTotals = (lines: EditableInvoiceLine[], freightAmount: number, taxType: 'CGST_SGST' | 'IGST') => {
  let subtotal = 0;
  let totalTax = 0;
  lines.forEach(l => {
    const { taxable, taxAmt } = computeLineTotal(l);
    subtotal += taxable;
    totalTax += taxAmt;
  });
  const grand = subtotal + totalTax + freightAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    cgst: taxType === 'CGST_SGST' ? Math.round((totalTax / 2) * 100) / 100 : 0,
    sgst: taxType === 'CGST_SGST' ? Math.round((totalTax / 2) * 100) / 100 : 0,
    igst: taxType === 'IGST' ? Math.round(totalTax * 100) / 100 : 0,
    grand: Math.round(grand * 100) / 100,
  };
};

const blankLine = (): EditableInvoiceLine => ({
  id: 'il_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
  productName: '',
  hsnCode: '30049099',
  quantity: 1000,
  unitPrice: 12.00,
  discountPercent: 0,
  taxPercent: 12,
});

const defaultEditForm = (invoiceCount: number, orgProfile?: any, initialData?: InitialInvoiceContextData): EditFormState => {
  const qty = initialData?.totalQuantity || 12000;
  const val = initialData?.orderValue || 195300;
  const unitP = initialData?.unitPrice || (val && qty ? Math.round((val / qty) * 100) / 100 : 16.28);

  return {
    invoiceNumber: `INV-2026-${4400 + invoiceCount + 1}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentTerms: 'Net 30 days from invoice date',
    orderNumber: initialData?.orderNumber || 'MO-2026-1001',
    subOrderNumber: initialData?.subOrderNumber || 'SO-2026-1001-01',
    manufacturerName: initialData?.manufacturerName || orgProfile?.companyName || 'SunBio Labs Pvt Ltd',
    manufacturerAddress: orgProfile?.registeredAddress || 'Plot 42-45, Export Promotion Industrial Park, Phase I',
    manufacturerCity: orgProfile?.city || 'Baddi',
    manufacturerState: orgProfile?.state || 'Himachal Pradesh',
    manufacturerCountry: orgProfile?.country || 'India',
    manufacturerPincode: orgProfile?.pincode || '173205',
    manufacturerGstin: orgProfile?.gstin || '02AAACS1234F1Z9',
    manufacturerPan: orgProfile?.pan || 'AAACS1234F',
    manufacturerLicense: orgProfile?.mfgLicenseNo || 'ML-HP-2024-001',
    manufacturerPhone: orgProfile?.contactPhone || '+91 1795 244100',
    manufacturerEmail: orgProfile?.contactEmail || 'billing@sunbiolabs.com',
    manufacturerWebsite: orgProfile?.website || 'https://www.sunbiolabs.com',
    logoDataUrl: '',
    selectedCustomerId: '',
    customerName: initialData?.customerName || 'Apex Pharma PCD Franchise',
    customerCode: 'CUS-2026-001',
    customerAddress: 'Unit 12, Industrial Estate, Andheri East, Mumbai, MH - 400069',
    consigneeAddress: 'Warehouse 4, EPIP Central Zone, Naroda, Ahmedabad, GJ - 382330',
    customerGstin: '27AAABM1234A1Z5',
    customerPan: 'AAABM1234A',
    customerPhone: '+91 98250 11223',
    customerEmail: 'accounts@apexpharma.com',
    lines: [{
      id: 'il_new_1',
      productName: initialData?.productName || 'Paracetamol 500mg & Azithromycin 500mg Tablets',
      hsnCode: '30049099',
      quantity: qty,
      unitPrice: unitP,
      discountPercent: 0,
      taxPercent: 12,
    }],
    taxType: 'CGST_SGST',
    freightAmount: 0,
    currency: 'INR',
    creationMethod: 'TEXT',
    uploadedFileName: '',
    uploadedFileType: '',
    uploadedFileSize: '',
    uploadedFileUrl: '',
  };
};

const invoiceToEditForm = (inv: Invoice): EditFormState => {
  const lines: EditableInvoiceLine[] = (inv.lines || []).map(l => ({
    id: l.id,
    productName: l.productName,
    hsnCode: l.hsnCode,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    discountPercent: l.discountPercent ?? 0,
    taxPercent: l.taxPercent ?? 12,
  }));
  if (lines.length === 0) lines.push(blankLine());
  return {
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    paymentTerms: inv.paymentTerms || 'Net 30 days from invoice date',
    orderNumber: inv.orderNumber,
    subOrderNumber: inv.subOrderNumber || '',
    manufacturerName: inv.manufacturerName || 'SunBio Labs Pvt Ltd',
    manufacturerAddress: inv.manufacturerAddress || 'Plot 42-45, EPIP Phase I',
    manufacturerCity: 'Baddi',
    manufacturerState: 'Himachal Pradesh',
    manufacturerCountry: 'India',
    manufacturerPincode: '173205',
    manufacturerGstin: inv.manufacturerGstin || '02AAACS1234F1Z9',
    manufacturerPan: inv.manufacturerPan || 'AAACS1234F',
    manufacturerLicense: inv.manufacturerLicense || 'ML-HP-2024-001',
    manufacturerPhone: '+91 1795 244100',
    manufacturerEmail: 'billing@sunbiolabs.com',
    manufacturerWebsite: 'https://www.sunbiolabs.com',
    logoDataUrl: inv.logoDataUrl || '',
    selectedCustomerId: inv.customerId || '',
    customerName: inv.customerName,
    customerCode: inv.customerCode || 'CUS001',
    customerAddress: inv.customerAddress || 'Unit 12, Industrial Estate, Mumbai, MH - 400069',
    consigneeAddress: inv.customerAddress || 'Unit 12, Industrial Estate, Mumbai, MH - 400069',
    customerGstin: inv.customerGstin || '27AAABM1234A1Z5',
    customerPan: inv.customerPan || 'AAABM1234A',
    customerPhone: '+91 98250 11223',
    customerEmail: 'accounts@apexpharma.com',
    lines,
    taxType: (inv.igst && inv.igst > 0) ? 'IGST' : 'CGST_SGST',
    freightAmount: inv.freightAmount || 0,
    currency: inv.currency || 'INR',
    creationMethod: inv.creationMethod || 'TEXT',
    uploadedFileName: inv.uploadedFileName || '',
    uploadedFileType: 'PDF Document',
    uploadedFileSize: '1.2 MB',
    uploadedFileUrl: inv.uploadedFileUrl || '',
  };
};

// ─── Status Chip ──────────────────────────────────────────────────────────────

const StatusChip: React.FC<{ inv: Invoice }> = ({ inv }) => {
  const paid = Math.round((inv.paidAmount || 0) * 100) / 100;
  const total = Math.round((inv.totalAmount || 0) * 100) / 100;
  const bal = typeof inv.balanceAmount === 'number'
    ? Math.round(inv.balanceAmount * 100) / 100
    : Math.max(0, Math.round((total - paid) * 100) / 100);

  if ((bal <= 0 || paid >= total) && total > 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
        <Check size={12} /> ✓ PAID
      </span>
    );
  }
  if (paid > 0 && bal > 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #93C5FD' }}>
        <Clock size={12} /> ↗ PARTIALLY PAID
      </span>
    );
  }
  if (inv.status === 'OVERDUE') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}>
        <AlertCircle size={12} /> OVERDUE
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
      <Clock size={12} /> OPEN / UNPAID
    </span>
  );
};

// ─── Right-Side Live Invoice Preview Document ──────────────────────────────────

const LiveInvoicePreviewDocument: React.FC<{ form: EditFormState; paidAmount?: number }> = ({ form, paidAmount = 0 }) => {
  const totals = computeTotals(form.lines, form.freightAmount, form.taxType);
  const sym = getCurrencySymbol(form.currency);
  const bal = Math.max(0, totals.grand - paidAmount);

  const getStatusLabel = () => {
    if (bal === 0 && totals.grand > 0) return { label: 'PAID', color: '#15803D', bg: '#DCFCE7', border: '#86EFAC' };
    if (paidAmount > 0 && bal > 0) return { label: 'PARTIALLY PAID', color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' };
    return { label: 'UNPAID', color: '#B45309', bg: '#FEF3C7', border: '#FCD34D' };
  };
  const statusInfo = getStatusLabel();

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 24, boxShadow: '0 4px 16px rgba(15,23,42,0.08)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header: Logo + Company Info + Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {form.logoDataUrl ? (
            <img src={form.logoDataUrl} alt="Logo" style={{ height: 50, maxWidth: 110, objectFit: 'contain', borderRadius: 6, border: '1px solid #E2E8F0' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 800, fontSize: 16 }}>
              FG
            </div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>{form.manufacturerName || 'Manufacturer Name'}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
              {[form.manufacturerAddress, form.manufacturerCity, form.manufacturerState, form.manufacturerPincode].filter(Boolean).join(', ')}
            </div>
            <div style={{ fontSize: 10.5, color: '#475569', marginTop: 1 }}>
              GSTIN: <strong>{form.manufacturerGstin || '—'}</strong> | PAN: <strong>{form.manufacturerPan || '—'}</strong>
            </div>
            {form.manufacturerLicense && (
              <div style={{ fontSize: 10.5, color: '#475569' }}>Mfg Lic: <strong>{form.manufacturerLicense}</strong></div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#2563EB', letterSpacing: '-0.02em' }}>TAX INVOICE</div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>{form.invoiceNumber}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* References & Dates Bar */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 11.5, marginBottom: 16 }}>
        <div>
          <span style={{ color: '#64748B', display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Invoice Date</span>
          <strong style={{ color: '#0F172A' }}>{form.invoiceDate || '—'}</strong>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Due Date</span>
          <strong style={{ color: '#DC2626' }}>{form.dueDate || '—'}</strong>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Payment Terms</span>
          <strong style={{ color: '#0F172A' }}>{form.paymentTerms || 'Net 30 Days'}</strong>
        </div>
      </div>

      {/* Bill To & Order Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 11.5 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', marginBottom: 4 }}>Billed & Shipped To</div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>{form.customerName || 'Select Customer'}</div>
          <div style={{ color: '#475569', marginTop: 2, lineHeight: 1.4 }}>{form.customerAddress || '—'}</div>
          <div style={{ color: '#475569', marginTop: 4 }}>GSTIN: <strong>{form.customerGstin || '—'}</strong></div>
          <div style={{ color: '#475569' }}>PAN: <strong>{form.customerPan || '—'}</strong></div>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 11.5 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', marginBottom: 4 }}>Order References</div>
          <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div>Master Order #: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{form.orderNumber || '—'}</strong></div>
            {form.subOrderNumber && <div>Sub-Order #: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{form.subOrderNumber}</strong></div>}
            <div>Customer Code: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{form.customerCode || '—'}</strong></div>
            <div>Currency: <strong>{form.currency} ({sym})</strong></div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#1E293B', color: '#FFFFFF' }}>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>#</th>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Product Description</th>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>HSN/SAC</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Qty</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Unit Price</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Tax%</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {form.lines.map((line, idx) => {
            const { total } = computeLineTotal(line);
            return (
              <tr key={line.id} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                <td style={{ padding: '8px 10px', color: '#64748B' }}>{idx + 1}</td>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>{line.productName || '—'}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#475569' }}>{line.hsnCode || '—'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{line.quantity.toLocaleString('en-IN')}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{sym}{line.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{line.taxPercent}%</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>{sym}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Financial Breakdown Panel */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B' }}>Subtotal (Taxable)</span>
            <strong style={{ fontFamily: 'monospace' }}>{sym}{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          {form.taxType === 'CGST_SGST' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>CGST</span>
                <span style={{ fontFamily: 'monospace' }}>{sym}{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>SGST</span>
                <span style={{ fontFamily: 'monospace' }}>{sym}{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>IGST</span>
              <span style={{ fontFamily: 'monospace' }}>{sym}{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {form.freightAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Freight</span>
              <span style={{ fontFamily: 'monospace' }}>{sym}{form.freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, borderTop: '2px solid #0F172A', paddingTop: 6, marginTop: 3, color: '#0F172A' }}>
            <span>Grand Total</span>
            <span style={{ fontFamily: 'monospace', color: '#0F766E' }}>{sym}{totals.grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontSize: 12 }}>
            <span>Paid Amount</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{sym}{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: bal === 0 ? '#16A34A' : '#DC2626', fontSize: 13, fontWeight: 800 }}>
            <span>Outstanding Amount</span>
            <span style={{ fontFamily: 'monospace' }}>{sym}{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Edit / Workspace Component ───────────────────────────────────────────────

const FullInvoiceCreationWorkspace: React.FC<{
  form: EditFormState;
  onChangeForm: (f: EditFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
  customers: Customer[];
  orgProfile: any;
}> = ({ form, onChangeForm, onSave, onCancel, isNew, customers, orgProfile }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof EditFormState, value: any) =>
    onChangeForm({ ...form, [field]: value });

  const setLine = (id: string, field: keyof EditableInvoiceLine, value: any) => {
    onChangeForm({
      ...form,
      lines: form.lines.map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const addLine = () => onChangeForm({ ...form, lines: [...form.lines, blankLine()] });
  const removeLine = (id: string) => {
    if (form.lines.length <= 1) return;
    onChangeForm({ ...form, lines: form.lines.filter(l => l.id !== id) });
  };

  const handleCustomerSelect = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;
    onChangeForm({
      ...form,
      selectedCustomerId: cust.id,
      customerName: cust.name,
      customerCode: cust.code,
      customerAddress: `${cust.city}, ${cust.state} - Billing Address`,
      consigneeAddress: `${cust.city}, ${cust.state} - Delivery Consignee`,
      customerGstin: cust.gstin || '',
      customerPan: cust.pan || '',
      customerPhone: cust.phone || '',
      customerEmail: cust.email || '',
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Logo file must be under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => set('logoDataUrl', ev.target?.result as string || '');
    reader.readAsDataURL(file);
  };

  const handleInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    onChangeForm({
      ...form,
      uploadedFileName: file.name,
      uploadedFileType: file.type || 'PDF Document',
      uploadedFileSize: sizeMB,
      uploadedFileUrl: url,
      creationMethod: 'UPLOAD'
    });
  };

  const totals = computeTotals(form.lines, form.freightAmount, form.taxType);
  const sym = getCurrencySymbol(form.currency);

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 36, padding: '0 10px', borderRadius: 7,
    border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF', color: '#0F172A'
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Sticky Header Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: 0 }}>
            <ArrowLeft size={15} /> Back
          </button>
          <ChevronRight size={14} style={{ color: '#94A3B8' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{isNew ? 'New B2B Tax Invoice Workspace' : `Edit Invoice — ${form.invoiceNumber}`}</div>
            <div style={{ fontSize: 11.5, color: '#64748B' }}>Create digital tax invoice or upload existing document with live synchronized preview.</div>
          </div>
        </div>

        {/* STEP 1: Top Mode Tabs */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 8, overflow: 'hidden', background: '#F1F5F9', padding: 2 }}>
            <button
              onClick={() => set('creationMethod', 'TEXT')}
              style={{
                height: 34, padding: '0 18px', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                background: form.creationMethod === 'TEXT' ? '#2563EB' : 'transparent',
                color: form.creationMethod === 'TEXT' ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              Text / Digital Invoice
            </button>
            <button
              onClick={() => set('creationMethod', 'UPLOAD')}
              style={{
                height: 34, padding: '0 18px', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                background: form.creationMethod === 'UPLOAD' ? '#2563EB' : 'transparent',
                color: form.creationMethod === 'UPLOAD' ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              Upload Invoice
            </button>
          </div>

          <button onClick={onCancel} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave} style={{ height: 36, padding: '0 20px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Check size={15} /> Finalize Invoice
          </button>
        </div>
      </div>

      {/* Main Split Layout: LEFT = Form, RIGHT = Live Preview Document */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT SIDE: EDITABLE FORM WORKSPACE ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* UPLOAD INVOICE MODE WORKSPACE */}
          {form.creationMethod === 'UPLOAD' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={16} style={{ color: '#2563EB' }} /> UPLOAD INVOICE
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>Upload your existing invoice document</div>

              <div
                onClick={() => uploadInputRef.current?.click()}
                style={{ border: '2px dashed #3B82F6', borderRadius: 10, padding: 30, textAlign: 'center', cursor: 'pointer', background: '#F8FAFF', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFF')}
              >
                <Upload size={36} style={{ color: '#2563EB', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1D4ED8' }}>Drag & Drop Invoice Here</div>
                <div style={{ fontSize: 12, color: '#64748B', margin: '6px 0 10px' }}>or click below</div>
                <button type="button" style={{ height: 32, padding: '0 16px', borderRadius: 6, background: '#2563EB', color: '#FFF', border: 'none', fontSize: 12, fontWeight: 700, pointerEvents: 'none' }}>
                  Upload Invoice
                </button>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 10 }}>Supported formats: PDF, PNG, JPG, JPEG</div>

                {form.uploadedFileName && (
                  <div style={{ marginTop: 14, padding: 12, background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                    <FileCheck size={24} style={{ color: '#10B981' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{form.uploadedFileName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Type: {form.uploadedFileType || 'Document'} | Size: {form.uploadedFileSize || '1.2 MB'}</div>
                      <div style={{ fontSize: 10.5, color: '#16A34A', fontWeight: 700, marginTop: 2 }}>✓ Uploaded & Ready</div>
                    </div>
                  </div>
                )}
              </div>
              <input ref={uploadInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleInvoiceFileUpload} />

              {form.uploadedFileName && (
                <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => uploadInputRef.current?.click()} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Replace File
                  </button>
                  <button type="button" onClick={() => set('uploadedFileName', '')} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#B91C1C', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Remove File
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 1: BILL FROM / MANUFACTURER */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={16} style={{ color: '#0F766E' }} /> Bill From / Manufacturer Details
            </div>

            {/* Editable Company Logo */}
            <div style={{ marginBottom: 16, padding: 14, background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: 10 }}>
              <label style={labelStyle}>Company Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {form.logoDataUrl ? (
                  <img src={form.logoDataUrl} alt="Logo" style={{ height: 50, maxWidth: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', padding: 4 }} />
                ) : (
                  <div style={{ width: 50, height: 50, borderRadius: 8, background: '#EFF6FF', border: '2px dashed #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 800 }}>
                    <ImageIcon size={22} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => logoInputRef.current?.click()} style={{ height: 32, padding: '0 14px', borderRadius: 6, border: '1px solid #0F766E', background: '#FFFFFF', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Upload size={13} /> {form.logoDataUrl ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  {form.logoDataUrl && (
                    <button type="button" onClick={() => set('logoDataUrl', '')} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#B91C1C', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Trash2 size={13} /> Remove Logo
                    </button>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Company / Manufacturer Name *</label>
                <input style={inputStyle} value={form.manufacturerName} onChange={e => set('manufacturerName', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Manufacturing License No.</label>
                <input style={inputStyle} value={form.manufacturerLicense} onChange={e => set('manufacturerLicense', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Registered Address *</label>
                <input style={inputStyle} value={form.manufacturerAddress} onChange={e => set('manufacturerAddress', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={form.manufacturerCity} onChange={e => set('manufacturerCity', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={form.manufacturerState} onChange={e => set('manufacturerState', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input style={inputStyle} value={form.manufacturerPincode} onChange={e => set('manufacturerPincode', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>GSTIN *</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.manufacturerGstin} onChange={e => set('manufacturerGstin', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>PAN</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.manufacturerPan} onChange={e => set('manufacturerPan', e.target.value)} />
              </div>
            </div>
          </div>

          {/* SECTION 2: BILL TO / CUSTOMER */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={16} style={{ color: '#2563EB' }} /> Bill To / Customer Details
            </div>

            {/* Select existing customer dropdown */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Select Customer (Auto-Populate)</label>
              <select
                style={{ ...inputStyle, fontWeight: 600 }}
                value={form.selectedCustomerId}
                onChange={e => handleCustomerSelect(e.target.value)}
              >
                <option value="">-- Select Customer from Directory --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code}) — GST: {c.gstin || 'N/A'}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Customer / Buyer Name *</label>
                <input style={inputStyle} value={form.customerName} onChange={e => set('customerName', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Customer Code</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.customerCode} onChange={e => set('customerCode', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Customer GSTIN</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.customerGstin} onChange={e => set('customerGstin', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Customer PAN</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.customerPan} onChange={e => set('customerPan', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Billing Address *</label>
                <textarea style={{ ...inputStyle, height: 50, resize: 'vertical', paddingTop: 6 }} value={form.customerAddress} onChange={e => set('customerAddress', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Consignee / Delivery Address</label>
                <textarea style={{ ...inputStyle, height: 50, resize: 'vertical', paddingTop: 6 }} value={form.consigneeAddress} onChange={e => set('consigneeAddress', e.target.value)} />
              </div>
            </div>
          </div>

          {/* SECTION 3 & 4: ORDER REFS & INVOICE DETAILS */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} style={{ color: '#7C3AED' }} /> Order References & Invoice Details
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Invoice Number *</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 700 }} value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Invoice Date *</label>
                <input type="date" style={inputStyle} value={form.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Due Date *</label>
                <input type="date" style={inputStyle} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Master Order #</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.orderNumber} onChange={e => set('orderNumber', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Sub-Order #</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.subOrderNumber} onChange={e => set('subOrderNumber', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <select style={inputStyle} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Payment Terms</label>
                <input style={inputStyle} value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} placeholder="e.g. Net 30 days from invoice date" />
              </div>
            </div>
          </div>

          {/* SECTION 5: ITEMS TABLE */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={16} style={{ color: '#D97706' }} /> Product Line Items ({form.lines.length})
              </div>
              <button onClick={addLine} style={{ height: 32, padding: '0 14px', borderRadius: 7, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            {/* GST Rate Switcher */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', alignSelf: 'center' }}>GST Rate Structure:</span>
              {(['CGST_SGST', 'IGST'] as const).map(t => (
                <button key={t} onClick={() => set('taxType', t)} style={{ height: 30, padding: '0 14px', borderRadius: 6, border: `1px solid ${form.taxType === t ? '#0F766E' : '#CBD5E1'}`, background: form.taxType === t ? '#F0FDFA' : '#FFFFFF', color: form.taxType === t ? '#0F766E' : '#64748B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {t === 'CGST_SGST' ? 'CGST (6%) + SGST (6%)' : 'IGST (12%) Inter-State'}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569' }}>SL</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569' }}>Product Description</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569' }}>HSN/SAC</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>Qty</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>Unit Price</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>Tax%</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>Amount</th>
                    <th style={{ padding: '8px 4px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, idx) => {
                    const { total } = computeLineTotal(line);
                    return (
                      <tr key={line.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 8px', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 8px', minWidth: 180 }}>
                          <input style={{ ...inputStyle, fontSize: 12 }} value={line.productName} onChange={e => setLine(line.id, 'productName', e.target.value)} placeholder="Product formulation description" />
                        </td>
                        <td style={{ padding: '8px 8px', minWidth: 90 }}>
                          <input style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }} value={line.hsnCode} onChange={e => setLine(line.id, 'hsnCode', e.target.value)} />
                        </td>
                        <td style={{ padding: '8px 8px', minWidth: 80 }}>
                          <input type="number" style={{ ...inputStyle, textAlign: 'right', fontSize: 12 }} value={line.quantity} onChange={e => setLine(line.id, 'quantity', Number(e.target.value))} min={1} />
                        </td>
                        <td style={{ padding: '8px 8px', minWidth: 90 }}>
                          <input type="number" step="0.01" style={{ ...inputStyle, textAlign: 'right', fontSize: 12 }} value={line.unitPrice} onChange={e => setLine(line.id, 'unitPrice', Number(e.target.value))} min={0} />
                        </td>
                        <td style={{ padding: '8px 8px', minWidth: 70 }}>
                          <input type="number" step="0.5" style={{ ...inputStyle, textAlign: 'right', fontSize: 12 }} value={line.taxPercent} onChange={e => setLine(line.id, 'taxPercent', Number(e.target.value))} min={0} max={100} />
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', minWidth: 90 }}>
                          {sym}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 4px' }}>
                          {form.lines.length > 1 && (
                            <button onClick={() => removeLine(line.id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Freight */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Freight / Shipping Charge ({sym}):</label>
              <input type="number" step="0.01" value={form.freightAmount} onChange={e => set('freightAmount', Number(e.target.value))} min={0} style={{ width: 120, height: 32, padding: '0 10px', borderRadius: 7, border: '1px solid #CBD5E1', fontSize: 12.5, textAlign: 'right', fontFamily: 'monospace' }} />
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE: LIVE SYNCHRONIZED DOCUMENT PREVIEW ─────────────── */}
        <div style={{ position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={15} /> Real-Time Live Tax Invoice Preview
          </div>

          {form.creationMethod === 'UPLOAD' && form.uploadedFileUrl ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 16, boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Uploaded Document Preview: {form.uploadedFileName}</div>
              {form.uploadedFileName?.toLowerCase().match(/\.(png|jpg|jpeg)$/) ? (
                <img src={form.uploadedFileUrl} alt="Uploaded Document Preview" style={{ width: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8, border: '1px solid #E2E8F0' }} />
              ) : (
                <iframe src={form.uploadedFileUrl} title="Uploaded Document Preview" style={{ width: '100%', height: 480, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              )}
            </div>
          ) : (
            <LiveInvoicePreviewDocument form={form} />
          )}

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={onCancel} style={{ flex: 1, height: 42, borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={onSave} style={{ flex: 1.5, height: 42, borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.25)' }}>
              <Check size={16} /> Finalize Invoice →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Main InvoiceModule ───────────────────────────────────────────────────────

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({
  initialViewMode = 'LIST',
  initialData,
  onComplete,
  onCancel
}) => {
  const {
    invoices, recordInvoicePayment, currentRole,
    addInvoice, updateInvoice, orgProfile, customers
  } = useApp();

  // View state: LIST | WORKSPACE | DETAILS
  const [viewState, setViewState] = useState<'LIST' | 'WORKSPACE' | 'DETAILS'>(initialViewMode);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(() => initialViewMode === 'WORKSPACE' ? defaultEditForm(invoices.length, orgProfile, initialData) : null);

  useEffect(() => {
    if (initialViewMode === 'WORKSPACE' && !editForm) {
      setEditForm(defaultEditForm(invoices.length, orgProfile, initialData));
      setViewState('WORKSPACE');
    }
  }, [initialViewMode, initialData]);

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('INR');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isManufacturer = currentRole === 'SUPPLIER';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Synchronize selected invoice for details view if invoices state changes
  const activeDetailInvoice = selectedInvoiceForDetails
    ? (invoices.find(i => i.id === selectedInvoiceForDetails.id || i.invoiceNumber === selectedInvoiceForDetails.invoiceNumber) || selectedInvoiceForDetails)
    : null;

  // Calculated Metrics
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const collectionRate = totalInvoiced > 0 ? Math.min(100, Math.round((totalPaid / totalInvoiced) * 100)) : 0;

  const filteredInvoices = invoices.filter(inv => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = q === '' ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.orderNumber || '').toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (statusFilter === 'PAID') return inv.balanceAmount === 0;
    if (statusFilter === 'PARTIALLY_PAID') return inv.paidAmount > 0 && inv.balanceAmount > 0;
    if (statusFilter === 'UNPAID') return inv.paidAmount === 0 && inv.balanceAmount > 0;
    if (statusFilter === 'OVERDUE') return inv.status === 'OVERDUE';
    return true;
  });

  // Open Record Payment Form Modal
  const handleOpenPaymentModal = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (inv.balanceAmount <= 0) return;
    setShowPaymentModal(inv);
    setPaymentAmount('');
    setPaymentCurrency(inv.currency || 'INR');
    setUtrNumber(`UTR-${Date.now().toString().slice(-6)}`);
    setPaymentMode('Bank Transfer');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRemarks('Payment received');
    setPaymentError(null);
  };

  // Submit Payment Record with Strict Validation
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Payment amount must be greater than ₹0.');
      return;
    }

    if (amt > showPaymentModal.balanceAmount + 0.01) {
      const sym = getCurrencySymbol(paymentCurrency);
      setPaymentError(`Payment amount (${sym}${amt.toLocaleString('en-IN')}) cannot exceed current balance due (${sym}${showPaymentModal.balanceAmount.toLocaleString('en-IN')}).`);
      return;
    }

    recordInvoicePayment(showPaymentModal.id, amt, paymentMode, utrNumber, paymentCurrency, paymentDate);
    const newPaid = (showPaymentModal.paidAmount || 0) + amt;
    const newBal = Math.max(0, showPaymentModal.totalAmount - newPaid);
    const sym = getCurrencySymbol(paymentCurrency);

    showToast(`✔ Payment of ${sym}${amt.toLocaleString('en-IN')} recorded for Invoice ${showPaymentModal.invoiceNumber}! Status: ${newBal === 0 ? 'PAID' : 'PARTIALLY PAID'}`);
    setShowPaymentModal(null);
    setPaymentAmount('');
    setPaymentError(null);
  };

  // Open Creation Workspace
  const handleOpenCreateWorkspace = () => {
    setEditForm(defaultEditForm(invoices.length, orgProfile, initialData));
    setEditingInvoice(null);
    setViewState('WORKSPACE');
  };

  // Open Edit Workspace
  const handleOpenEditWorkspace = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditForm(invoiceToEditForm(inv));
    setEditingInvoice(inv);
    setViewState('WORKSPACE');
  };

  // Save / Finalize Invoice
  const handleSaveInvoice = () => {
    if (!editForm) return;
    const totals = computeTotals(editForm.lines, editForm.freightAmount, editForm.taxType);
    const sym = getCurrencySymbol(editForm.currency);

    const lines: InvoiceLine[] = editForm.lines.map(l => {
      const { taxAmt, total } = computeLineTotal(l);
      return {
        id: l.id,
        productId: 'p_' + l.id,
        productName: l.productName || 'Pharmaceutical Formulation',
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent,
        taxPercent: l.taxPercent,
        taxAmount: taxAmt,
        totalAmount: total,
      };
    });

    if (editingInvoice) {
      const updatedInv = {
        ...editingInvoice,
        invoiceNumber: editForm.invoiceNumber,
        orderNumber: editForm.orderNumber,
        subOrderNumber: editForm.subOrderNumber,
        customerName: editForm.customerName,
        customerAddress: editForm.customerAddress,
        customerGstin: editForm.customerGstin,
        customerPan: editForm.customerPan,
        manufacturerName: editForm.manufacturerName,
        manufacturerAddress: editForm.manufacturerAddress,
        manufacturerGstin: editForm.manufacturerGstin,
        manufacturerPan: editForm.manufacturerPan,
        manufacturerLicense: editForm.manufacturerLicense,
        logoDataUrl: editForm.logoDataUrl,
        invoiceDate: editForm.invoiceDate,
        dueDate: editForm.dueDate,
        paymentTerms: editForm.paymentTerms,
        currency: editForm.currency,
        subtotal: totals.subtotal,
        taxTotal: totals.totalTax,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        freightAmount: editForm.freightAmount,
        totalAmount: totals.grand,
        lines,
        creationMethod: editForm.creationMethod,
        uploadedFileName: editForm.uploadedFileName,
        uploadedFileUrl: editForm.uploadedFileUrl,
      };
      updateInvoice(editingInvoice.id, updatedInv);
      showToast(`✔ Invoice ${editForm.invoiceNumber} updated successfully!`);
      if (onComplete) {
        onComplete(updatedInv);
      } else {
        setSelectedInvoiceForDetails(updatedInv);
        setViewState('DETAILS');
      }
    } else {
      const newInv: Invoice = {
        id: 'inv_' + Date.now(),
        invoiceNumber: editForm.invoiceNumber,
        masterOrderId: 'mo_' + editForm.orderNumber,
        orderNumber: editForm.orderNumber,
        subOrderNumber: editForm.subOrderNumber,
        customerId: editForm.selectedCustomerId || 'cus001',
        customerName: editForm.customerName,
        customerCode: editForm.customerCode || 'CUS001',
        customerAddress: editForm.customerAddress,
        customerGstin: editForm.customerGstin,
        customerPan: editForm.customerPan,
        manufacturerName: editForm.manufacturerName,
        manufacturerAddress: editForm.manufacturerAddress,
        manufacturerGstin: editForm.manufacturerGstin,
        manufacturerPan: editForm.manufacturerPan,
        manufacturerLicense: editForm.manufacturerLicense,
        logoDataUrl: editForm.logoDataUrl,
        invoiceDate: editForm.invoiceDate,
        dueDate: editForm.dueDate,
        paymentTerms: editForm.paymentTerms,
        currency: editForm.currency,
        subtotal: totals.subtotal,
        taxTotal: totals.totalTax,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        freightAmount: editForm.freightAmount,
        totalAmount: totals.grand,
        paidAmount: 0,
        balanceAmount: totals.grand,
        status: 'UNPAID',
        lines,
        payments: [],
        creationMethod: editForm.creationMethod,
        uploadedFileName: editForm.uploadedFileName,
        uploadedFileUrl: editForm.uploadedFileUrl,
      };
      addInvoice(newInv);
      showToast(`✔ Tax Invoice ${editForm.invoiceNumber} finalized successfully (${sym}${totals.grand.toLocaleString('en-IN')})!`);
      if (onComplete) {
        onComplete(newInv);
      } else {
        setSelectedInvoiceForDetails(newInv);
        setViewState('DETAILS');
      }
    }

    setEditForm(null);
    setEditingInvoice(null);
  };

  const handleCancelWorkspace = () => {
    if (onCancel) {
      onCancel();
    } else {
      setViewState('LIST');
      setEditForm(null);
      setEditingInvoice(null);
    }
  };

  // ── WORKSPACE VIEW RENDER ──────────────────────────────────────────────────
  if (viewState === 'WORKSPACE' && currentRole === 'ADMIN') {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', margin: '20px auto', maxWidth: 600 }}>
        <h2 style={{ color: '#DC2626', fontSize: 20, fontWeight: 800 }}>Access Restricted</h2>
        <p style={{ color: '#64748B', fontSize: 14 }}>The Admin role is strictly for monitoring &amp; governance. Tax invoice creation and editing are restricted to Manufacturer partners.</p>
        <button onClick={() => setViewState('LIST')} style={{ padding: '10px 20px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}>
          Return to Invoice Monitor
        </button>
      </div>
    );
  }

  if (viewState === 'WORKSPACE' && editForm) {
    return (
      <div style={{ padding: '0 2px' }}>
        {toastMessage && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 11000, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} style={{ color: '#10B981' }} /> {toastMessage}
          </div>
        )}
        <FullInvoiceCreationWorkspace
          form={editForm}
          onChangeForm={setEditForm}
          onSave={handleSaveInvoice}
          onCancel={handleCancelWorkspace}
          isNew={!editingInvoice}
          customers={customers}
          orgProfile={orgProfile}
        />
      </div>
    );
  }

  // ── FINALIZED INVOICE DETAILS PAGE RENDER ─────────────────────────────────
  if (viewState === 'DETAILS' && activeDetailInvoice) {
    const inv = activeDetailInvoice;
    const sym = getCurrencySymbol(inv.currency);
    const paid = inv.paidAmount || 0;
    const bal = inv.balanceAmount;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>

        {/* Toast */}
        {toastMessage && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 11000, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} style={{ color: '#10B981' }} /> {toastMessage}
          </div>
        )}

        {/* Header Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={handleCancelWorkspace} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: 0 }}>
              <ArrowLeft size={15} /> Back to Invoices Ledger
            </button>
            <ChevronRight size={14} style={{ color: '#94A3B8' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                Invoice {inv.invoiceNumber} <StatusChip inv={inv} />
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>Customer: <strong>{inv.customerName}</strong> | Issued: {inv.invoiceDate}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {bal > 0 && currentRole !== 'ADMIN' && (
              <button onClick={(e) => handleOpenPaymentModal(inv, e)} style={{ height: 36, padding: '0 16px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Banknote size={14} /> Record Payment
              </button>
            )}
            {isManufacturer && (
              <button onClick={(e) => handleOpenEditWorkspace(inv, e)} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#2563EB', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Edit2 size={14} /> Edit Invoice
              </button>
            )}
            <button onClick={() => window.print()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Printer size={14} /> Download / Print
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Invoice Total</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{sym}{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Issued Date: {inv.invoiceDate}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Amount Already Paid</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>{sym}{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>{Math.round((paid / inv.totalAmount) * 100)}% settled</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Outstanding Amount</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: bal === 0 ? '#16A34A' : '#DC2626', fontFamily: 'monospace', marginTop: 4 }}>{sym}{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Due Date: {inv.dueDate}</div>
          </div>
        </div>

        {/* Split Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

          {/* Document View */}
          <LiveInvoicePreviewDocument
            form={invoiceToEditForm(inv)}
            paidAmount={paid}
          />

          {/* Right Panel: Payment History Ledger */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Banknote size={16} style={{ color: '#0F766E' }} /> Payment History & Ledger
            </div>

            {Array.isArray(inv.payments) && inv.payments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {inv.payments.map((p, i) => (
                  <div key={p.id || i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#16A34A', fontSize: 13, fontFamily: 'monospace' }}>
                      <span>+{sym}{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span style={{ fontSize: 10, padding: '2px 6px', background: '#DCFCE7', borderRadius: 4, color: '#15803D' }}>{p.status}</span>
                    </div>
                    <div style={{ color: '#475569', marginTop: 4 }}>Date: <strong>{p.paymentDate}</strong></div>
                    <div style={{ color: '#475569' }}>Method: <strong>{p.paymentMethod}</strong></div>
                    <div style={{ color: '#475569', fontFamily: 'monospace', fontSize: 11 }}>Ref: {p.reference}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: 12 }}>
                No payment transactions recorded yet.
              </div>
            )}

            {bal > 0 && currentRole !== 'ADMIN' && (
              <button onClick={(e) => handleOpenPaymentModal(inv, e)} style={{ width: '100%', height: 38, marginTop: 16, borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Banknote size={14} /> Record Payment Received
              </button>
            )}
          </div>
        </div>

        {/* Record Payment Modal */}
        {showPaymentModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, width: 520, padding: 26, boxShadow: '0 16px 40px rgba(15,23,42,0.22)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Record Payment Received
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Invoice: <strong style={{ fontFamily: 'monospace' }}>{showPaymentModal.invoiceNumber}</strong></div>
                </div>
                <button onClick={() => setShowPaymentModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Payment Summary Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                {[
                  { label: 'Invoice Total Amount', value: `${getCurrencySymbol(paymentCurrency)}${showPaymentModal.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#0F172A' },
                  { label: 'Amount Already Received', value: `${getCurrencySymbol(paymentCurrency)}${(showPaymentModal.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#16A34A' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#64748B' }}>{row.label}:</span>
                    <strong style={{ fontFamily: 'monospace', color: row.color }}>{row.value}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px dashed #CBD5E1', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ color: '#475569' }}>Current Balance Due:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#DC2626' }}>{getCurrencySymbol(paymentCurrency)}{showPaymentModal.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {paymentError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> {paymentError}
                </div>
              )}

              <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Payment Amount Received *
                  </label>
                  <input type="number" step="0.01" placeholder={`Max: ${getCurrencySymbol(paymentCurrency)}${showPaymentModal.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} value={paymentAmount} onChange={e => { setPaymentAmount(e.target.value); setPaymentError(null); }} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontWeight: 700, fontSize: 15, outline: 'none' }} />

                  {/* Quick Pill Buttons */}
                  <div style={{ display: 'flex', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.25 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>25%</button>
                    <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.5 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>50% of Outstanding</button>
                    <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.75 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>75%</button>
                    <button type="button" onClick={() => { setPaymentAmount(String(showPaymentModal.balanceAmount)); setPaymentError(null); }} style={{ height: 26, padding: '0 12px', borderRadius: 5, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Full Outstanding</button>
                  </div>
                </div>

                {/* Live Remaining Balance Preview */}
                {Number(paymentAmount) > 0 && !isNaN(Number(paymentAmount)) && (
                  <div style={{ background: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#86EFAC' : '#93C5FD'}`, borderRadius: 8, padding: '9px 14px', fontSize: 12.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#475569', fontSize: 11.5 }}>Remaining Balance After Payment:</div>
                      <strong style={{ fontFamily: 'monospace', fontSize: 14, color: '#0F172A' }}>{getCurrencySymbol(paymentCurrency)}{Math.max(0, showPaymentModal.balanceAmount - Number(paymentAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#DCFCE7' : '#DBEAFE', color: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#15803D' : '#1D4ED8' }}>
                      {Number(paymentAmount) >= showPaymentModal.balanceAmount ? '✓ STATUS: PAID' : '↗ STATUS: PARTIALLY PAID'}
                    </span>
                  </div>
                )}

                {/* Currency + Method */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Currency *</label>
                    <select value={paymentCurrency} onChange={e => setPaymentCurrency(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                      <option value="INR">INR (₹)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Payment Method *</label>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                      <option value="Bank Transfer">Bank Transfer (Wire / BACS)</option>
                      <option value="RTGS">RTGS – Real-Time Gross Settlement</option>
                      <option value="NEFT">NEFT – National Electronic Funds Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit Card">Corporate Credit Card</option>
                      <option value="LC">Letter of Credit (LC)</option>
                    </select>
                  </div>
                </div>

                {/* Date + Reference / UTR */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Payment Date *</label>
                    <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Transaction / UTR # *</label>
                    <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 12.5 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={() => setShowPaymentModal(null)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ height: 38, padding: '0 22px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Banknote size={14} /> Record Payment Received
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── INVOICES LEDGER LIST VIEW RENDER ───────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>

      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 11000, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.2s ease' }}>
          <CheckCircle2 size={16} style={{ color: '#10B981' }} /> {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Receipt size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <span>FactoryGrid</span><ChevronRight size={12} /><span>{currentRole === 'BUYER' ? 'buyer' : 'supplier'}</span><ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Invoices & Payments</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Manufacturer Tax Invoices Workspace
            </h1>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 1 }}>
              B2B pharmaceutical tax invoice management, partial payments, and treasury settlement ledger.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search invoice#, customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: 220, height: 36, paddingLeft: 30, paddingRight: 10, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF' }} />
          </div>
          {isManufacturer && (
            <button onClick={handleOpenCreateWorkspace} style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(37,99,235,0.2)' }}>
              <Plus size={15} /> Generate Tax Invoice
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Invoiced', value: `₹${totalInvoiced.toLocaleString('en-IN')}`, sub: `${invoices.length} total issued`, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: <Receipt size={16} /> },
          { label: isManufacturer ? 'Payment Received' : 'Amount Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, sub: `↑ ${collectionRate}% collection rate`, color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC', icon: <Check size={16} /> },
          { label: 'Outstanding Balance', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, sub: `${invoices.filter(i => i.balanceAmount > 0).length} pending settlements`, color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: <AlertCircle size={16} /> },
          { label: 'Partially Paid', value: `${invoices.filter(i => i.paidAmount > 0 && i.balanceAmount > 0).length} Invoices`, sub: 'Active installment plans', color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD', icon: <Clock size={16} /> },
        ].map((card, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: card.bg, border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'ALL', label: `All Invoices (${invoices.length})` },
            { id: 'UNPAID', label: `Open / Outstanding (${invoices.filter(i => i.paidAmount === 0 && i.balanceAmount > 0).length})` },
            { id: 'PARTIALLY_PAID', label: `Partially Paid (${invoices.filter(i => i.paidAmount > 0 && i.balanceAmount > 0).length})` },
            { id: 'PAID', label: `Paid (${invoices.filter(i => i.balanceAmount === 0).length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setStatusFilter(tab.id)} style={{ height: 32, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: statusFilter === tab.id ? 700 : 500, background: statusFilter === tab.id ? '#2563EB' : 'transparent', color: statusFilter === tab.id ? '#FFFFFF' : '#475569', border: 'none', cursor: 'pointer', transition: 'all 120ms ease' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Invoices Ledger</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '11px 16px' }}>Invoice #</th>
                <th style={{ padding: '11px 14px' }}>{isManufacturer ? 'Customer / Buyer' : 'Supplier'}</th>
                <th style={{ padding: '11px 14px' }}>Invoice Total</th>
                <th style={{ padding: '11px 14px' }}>Amount Paid</th>
                <th style={{ padding: '11px 14px' }}>Balance Due</th>
                <th style={{ padding: '11px 14px' }}>Due Date</th>
                <th style={{ padding: '11px 14px' }}>Status</th>
                <th style={{ padding: '11px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No invoices found matching criteria.</td></tr>
              ) : (
                filteredInvoices.map(inv => {
                  const sym = getCurrencySymbol(inv.currency);
                  const canPay = inv.balanceAmount > 0;
                  const isPartial = inv.paidAmount > 0 && inv.balanceAmount > 0;
                  const isPaid = inv.balanceAmount === 0;
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.1s' }}
                      onClick={() => { setSelectedInvoiceForDetails(inv); setViewState('DETAILS'); }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', fontSize: 13 }}>{inv.invoiceNumber}</div>
                        <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>Order: {inv.orderNumber}</div>
                      </td>
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{inv.customerName}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{inv.invoiceDate}</div>
                      </td>
                      <td style={{ padding: '14px 14px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                        {sym}{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 14px', fontWeight: 700, fontFamily: 'monospace', color: '#16A34A' }}>
                        {sym}{inv.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace', color: isPaid ? '#16A34A' : '#DC2626' }}>
                          {sym}{inv.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {isPartial && (
                          <div style={{ marginTop: 3 }}>
                            <div style={{ width: 80, height: 4, borderRadius: 2, background: '#E2E8F0', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.round((inv.paidAmount / inv.totalAmount) * 100)}%`, background: '#3B82F6', borderRadius: 2 }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 14px', fontSize: 12.5, color: '#475569' }}>{inv.dueDate}</td>
                      <td style={{ padding: '14px 14px' }}><StatusChip inv={inv} /></td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedInvoiceForDetails(inv); setViewState('DETAILS'); }} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 11.5, fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={12} /> View
                          </button>
                          {isManufacturer && (
                            <button onClick={(e) => handleOpenEditWorkspace(inv, e)} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 11.5, fontWeight: 700, color: '#2563EB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Edit2 size={12} /> Edit
                            </button>
                          )}
                          {canPay && (
                            <button onClick={(e) => handleOpenPaymentModal(inv, e)} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: 'none', background: isPartial ? '#1D4ED8' : '#0F766E', fontSize: 11.5, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Banknote size={12} /> Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, width: 520, padding: 26, boxShadow: '0 16px 40px rgba(15,23,42,0.22)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Record Payment Received
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Invoice: <strong style={{ fontFamily: 'monospace' }}>{showPaymentModal.invoiceNumber}</strong></div>
              </div>
              <button onClick={() => setShowPaymentModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Payment Summary Box */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18 }}>
              {[
                { label: 'Invoice Total Amount', value: `${getCurrencySymbol(paymentCurrency)}${showPaymentModal.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#0F172A' },
                { label: 'Amount Already Received', value: `${getCurrencySymbol(paymentCurrency)}${(showPaymentModal.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#16A34A' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>{row.label}:</span>
                  <strong style={{ fontFamily: 'monospace', color: row.color }}>{row.value}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px dashed #CBD5E1', paddingTop: 8, marginTop: 4 }}>
                <span style={{ color: '#475569' }}>Current Balance Due:</span>
                <strong style={{ fontFamily: 'monospace', color: '#DC2626' }}>{getCurrencySymbol(paymentCurrency)}{showPaymentModal.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            {paymentError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} /> {paymentError}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Payment Amount Received *
                </label>
                <input type="number" step="0.01" placeholder={`Max: ${getCurrencySymbol(paymentCurrency)}${showPaymentModal.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} value={paymentAmount} onChange={e => { setPaymentAmount(e.target.value); setPaymentError(null); }} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontWeight: 700, fontSize: 15, outline: 'none' }} />

                {/* Quick Pill Buttons */}
                <div style={{ display: 'flex', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.25 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>25%</button>
                  <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.5 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>50% of Outstanding</button>
                  <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.75 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>75%</button>
                  <button type="button" onClick={() => { setPaymentAmount(String(showPaymentModal.balanceAmount)); setPaymentError(null); }} style={{ height: 26, padding: '0 12px', borderRadius: 5, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Full Outstanding</button>
                </div>
              </div>

              {/* Live Remaining Balance Preview */}
              {Number(paymentAmount) > 0 && !isNaN(Number(paymentAmount)) && (
                <div style={{ background: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#86EFAC' : '#93C5FD'}`, borderRadius: 8, padding: '9px 14px', fontSize: 12.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#475569', fontSize: 11.5 }}>Remaining Balance After Payment:</div>
                    <strong style={{ fontFamily: 'monospace', fontSize: 14, color: '#0F172A' }}>{getCurrencySymbol(paymentCurrency)}{Math.max(0, showPaymentModal.balanceAmount - Number(paymentAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#DCFCE7' : '#DBEAFE', color: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#15803D' : '#1D4ED8' }}>
                    {Number(paymentAmount) >= showPaymentModal.balanceAmount ? '✓ STATUS: PAID' : '↗ STATUS: PARTIALLY PAID'}
                  </span>
                </div>
              )}

              {/* Currency + Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Currency *</label>
                  <select value={paymentCurrency} onChange={e => setPaymentCurrency(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                    <option value="INR">INR (₹)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Payment Method *</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                    <option value="Bank Transfer">Bank Transfer (Wire / BACS)</option>
                    <option value="RTGS">RTGS – Real-Time Gross Settlement</option>
                    <option value="NEFT">NEFT – National Electronic Funds Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Corporate Credit Card</option>
                    <option value="LC">Letter of Credit (LC)</option>
                  </select>
                </div>
              </div>

              {/* Date + Reference / UTR */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Payment Date *</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Transaction / UTR # *</label>
                  <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 12.5 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowPaymentModal(null)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ height: 38, padding: '0 22px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Banknote size={14} /> Record Payment Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
