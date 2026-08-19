import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText, CheckCircle2, XCircle, RefreshCw, Download, Printer,
  Building2, ShieldCheck, Clock, Layers, ArrowRight, X, AlertCircle,
  Truck, Receipt, Check, File, ChevronRight, DollarSign, MessageSquare, ShoppingBag
} from 'lucide-react';
import { RFQ } from '../../types';

interface CustomerQuotationModuleProps {
  rfq?: RFQ;
  lineSelections?: Record<string, { mfgId: string; mfgName: string; price: number }>;
  onApproved?: () => void;
}

export const CustomerQuotationModule: React.FC<CustomerQuotationModuleProps> = ({
  rfq,
  lineSelections,
  onApproved
}) => {
  const {
    rfqs, manufacturers, selectQuoteAndCreateOrder, addAuditLog,
    setActiveTab, currentRole
  } = useApp();

  const activeRfq = rfq || rfqs[0];

  // Default Line Selections if not passed in props
  const defaultSelections: Record<string, { mfgId: string; mfgName: string; price: number }> = {};
  if (activeRfq) {
    activeRfq.lines.forEach((line, idx) => {
      const mfg = manufacturers[idx % manufacturers.length] || manufacturers[0];
      defaultSelections[line.id] = {
        mfgId: mfg.id,
        mfgName: mfg.companyName,
        price: line.targetPrice ? line.targetPrice * 0.95 : 38.50
      };
    });
  }

  const selections = lineSelections || defaultSelections;

  // Commercial Calculations
  let subtotal = 0;
  const productSummaryItems = activeRfq?.lines.map(line => {
    const sel = selections[line.id] || { mfgId: 'm1', mfgName: 'SunBio LifeSciences Ltd', price: 38.50 };
    const lineSubtotal = line.quantity * sel.price;
    subtotal += lineSubtotal;
    const discount = lineSubtotal * 0.025; // 2.5% discount
    const gst = (lineSubtotal - discount) * 0.12; // 12% GST
    const netPrice = lineSubtotal - discount + gst;

    return {
      id: line.id,
      productName: line.productName,
      dosageForm: line.dosageForm,
      mfgName: sel.mfgName,
      quantity: line.quantity,
      unitPrice: sel.price,
      discount: Math.round(discount),
      gst: Math.round(gst),
      netPrice: Math.round(netPrice),
      leadTime: '14 Days',
      deliveryDate: line.requiredDate || '2026-09-02'
    };
  }) || [];

  const gstTotal = Math.round(subtotal * 0.12);
  const freightTotal = 35000;
  const otherCharges = 0;
  const grandTotal = Math.round(subtotal + gstTotal + freightTotal + otherCharges);

  // Component Workflow States: PENDING_APPROVAL | APPROVED | REJECTED | ORDER_CREATED
  const [quotationStatus, setQuotationStatus] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ORDER_CREATED'>('PENDING_APPROVAL');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCreateMasterOrderModal, setShowCreateMasterOrderModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Approved Metadata
  const [approvedDetails, setApprovedDetails] = useState<{ approvedDate?: string; approvedBy?: string } | null>(null);

  // Access Check: Buyer / Admin
  const isBuyer = currentRole === 'BUYER' || currentRole === 'ADMIN';

  if (!isBuyer) {
    return (
      <div className="ent-panel" style={{ padding: 48, textAlign: 'center', margin: '40px auto', maxWidth: 600 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={22} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Customer Quotation — Access Restricted
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          This final commercial quotation approval desk is restricted to <strong>Buyer Sourcing Managers</strong>.
        </p>
        <div className="ent-caption">Please switch to <strong>Buyer</strong> role using the role switcher.</div>
      </div>
    );
  }

  // 1. Confirm Customer Quote Approval (Enables Master Order / PO creation)
  const handleConfirmCustomerApproval = () => {
    const formattedDate = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    setQuotationStatus('APPROVED');
    setApprovedDetails({
      approvedDate: formattedDate,
      approvedBy: 'Apex Pharma (Authorized Buyer)'
    });
    addAuditLog('Customer Quotation Desk', `Approved quotation CQUO-2026-9001 for RFQ ${activeRfq?.rfqNumber || 'RFQ-2026-1001'}`);
    setShowApprovalModal(false);
  };

  // 2. Create Master Order / PO (Available ONLY AFTER Approval)
  const handleCreateMasterOrderPO = () => {
    if (quotationStatus !== 'APPROVED') {
      alert('Master Order creation is blocked until Customer Quote Approval.');
      return;
    }

    if (!activeRfq) return;

    // Trigger Master Order generation & splitting
    selectQuoteAndCreateOrder(activeRfq.id, selections);
    setQuotationStatus('ORDER_CREATED');

    addAuditLog('Customer Quotation Desk', `Created Master Order & split Sub-Orders for RFQ ${activeRfq.rfqNumber}`);

    alert(`✔ Master Order Created & Split into Sub-Orders!\n\nMaster Order MO-2026-1001 created.\nSub-orders split across selected manufacturers.\n\nRedirecting to Order Management...`);

    if (onApproved) onApproved();
    else setActiveTab('orders');
  };

  // 4. Handle Reject Quotation
  const handleConfirmRejection = () => {
    setQuotationStatus('REJECTED');
    addAuditLog('Customer Quotation Desk', `Rejected quotation CQUO-2026-9001.`);
    alert(`Quotation CQUO-2026-9001 rejected. Order creation is blocked.`);
    setShowRejectionModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

      {/* ── Enterprise Header Bar ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(15, 118, 110, 0.1)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>CONSOLIDATED CUSTOMER QUOTATION</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              CUSTOMER QUOTATION: CQUO-2026-9001
            </h1>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              RFQ Reference: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{activeRfq?.rfqNumber || 'RFQ-2026-1001'}</strong> · Customer: <strong style={{ color: '#0F172A' }}>{activeRfq?.customerName || 'Apex Pharma PCD Franchise'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quotation Status</div>
            <span style={{
              fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 4, display: 'inline-block', marginTop: 2,
              background: quotationStatus === 'APPROVED' || quotationStatus === 'ORDER_CREATED' ? '#DCFCE7' : quotationStatus === 'REJECTED' ? '#FEE2E2' : '#EFF6FF',
              color: quotationStatus === 'APPROVED' || quotationStatus === 'ORDER_CREATED' ? '#15803D' : quotationStatus === 'REJECTED' ? '#B91C1C' : '#1D4ED8',
              border: quotationStatus === 'APPROVED' || quotationStatus === 'ORDER_CREATED' ? '1px solid #86EFAC' : quotationStatus === 'REJECTED' ? '1px solid #FCA5A5' : '1px solid #BFDBFE'
            }}>
              {quotationStatus === 'PENDING_APPROVAL' ? 'PENDING CUSTOMER APPROVAL' : quotationStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Action Toolbar ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} /> Print Quotation
          </button>
          <button onClick={() => alert('Downloading official quotation PDF...')} style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Download PDF
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {quotationStatus === 'PENDING_APPROVAL' && (
            <>
              <button onClick={() => setShowRejectionModal(true)} style={{ padding: '9px 16px', fontSize: 12.5, fontWeight: 700, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5', borderRadius: 6, cursor: 'pointer' }}>
                Reject Quote
              </button>

              <button onClick={() => setShowApprovalModal(true)} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 800, background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(22,163,74,0.2)' }}>
                <CheckCircle2 size={16} /> Approve Quote
              </button>
            </>
          )}

          {/* CREATE MASTER ORDER / PO BUTTON (Enabled ONLY AFTER Approval) */}
          <button
            disabled={quotationStatus !== 'APPROVED'}
            onClick={handleCreateMasterOrderPO}
            style={{
              padding: '9px 22px', fontSize: 13, fontWeight: 800, borderRadius: 6,
              background: quotationStatus === 'APPROVED' ? '#0F766E' : '#E2E8F0',
              color: quotationStatus === 'APPROVED' ? '#FFFFFF' : '#94A3B8',
              border: 'none', cursor: quotationStatus === 'APPROVED' ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: quotationStatus === 'APPROVED' ? '0 2px 6px rgba(15,118,110,0.25)' : 'none'
            }}
            title={quotationStatus !== 'APPROVED' ? 'Master Order creation is blocked until Customer Quote Approval.' : 'Create Master Order / PO'}
          >
            <ShoppingBag size={16} /> Create Master Order / PO →
          </button>
        </div>
      </div>

      {/* ── Approval Status Notice Box & Master Order CTA ── */}
      {quotationStatus === 'APPROVED' && approvedDetails && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 18, color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} style={{ color: '#16A34A' }} /> Quote Approved
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Quote: <strong style={{ fontFamily: 'monospace' }}>QUOTE-1001</strong> · Customer: <strong>Apex Pharma PCD Franchise</strong> · Status: <strong style={{ color: '#16A34A' }}>Approved</strong>
            </div>
            <div style={{ fontSize: 12.5, color: '#15803D', marginTop: 2 }}>
              Customer quote has been approved. You can now create the Master Order.
            </div>
          </div>

          <button
            onClick={() => setShowCreateMasterOrderModal(true)}
            style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(15,118,110,0.25)' }}
          >
            Create Master Order →
          </button>
        </div>
      )}

      {quotationStatus === 'REJECTED' && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: 16, color: '#991B1B' }}>
          <div style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
            <XCircle size={18} style={{ color: '#DC2626' }} /> Quotation Rejected
          </div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>
            Customer rejected this quotation. Master Order / PO creation is <strong>PERMANENTLY BLOCKED</strong> for this quote.
          </div>
        </div>
      )}

      {/* ── Commercial Summary KPI Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Products</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{productSummaryItems.length} Line Items</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Multi-item consolidated quotation</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Subtotal</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>₹{subtotal.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Excluding GST & Freight</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>GST & Freight</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#475569', fontFamily: 'monospace', marginTop: 4 }}>₹{(gstTotal + freightTotal).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>12% GST + Cold-chain shipping</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #0F766E', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Grand Total Quote Value</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>₹{grandTotal.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>Net payable amount</div>
        </div>
      </div>

      {/* ── Main Split Layout: Table + Right Panel Summary ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* LEFT: Product Summary Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Consolidated Customer Quotation Table</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Itemized breakdown of selected manufacturer allocations and pricing</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Product</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Selected Manufacturer</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Quantity</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Unit Price</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>GST (12%)</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Lead Time</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right' }}>Net Line Price</th>
                </tr>
              </thead>
              <tbody>
                {productSummaryItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{item.productName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Form: {item.dosageForm}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 700, color: '#0F766E' }}>{item.mfgName}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {item.quantity.toLocaleString()} Units
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      ₹{item.gst.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>
                      {item.leadTime}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                      ₹{item.netPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Financial Breakdown & Approval Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
            COMMERCIAL SUMMARY
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Base Subtotal:</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Total GST (12%):</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{gstTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Cold-Chain Shipping:</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{freightTotal.toLocaleString()}</span>
            </div>
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#0F766E' }}>
              <span>Grand Total:</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Decision Container */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>CUSTOMER DECISION</div>

            {quotationStatus === 'PENDING_APPROVAL' && (
              <>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  style={{ width: '100%', padding: '10px', borderRadius: 6, background: '#16A34A', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={16} /> Approve Quote
                </button>
                <button onClick={() => setShowRejectionModal(true)} style={{ width: '100%', padding: '8px', borderRadius: 6, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Reject Quote
                </button>
              </>
            )}

            {quotationStatus === 'APPROVED' && (
              <button
                onClick={handleCreateMasterOrderPO}
                style={{ width: '100%', padding: '11px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.25)' }}
              >
                <ShoppingBag size={16} /> Create Master Order / PO →
              </button>
            )}

            {quotationStatus === 'ORDER_CREATED' && (
              <div style={{ padding: 10, background: '#DCFCE7', borderRadius: 6, color: '#15803D', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                ✓ Master Order & Sub-Orders Issued
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── APPROVAL CONFIRMATION DIALOG MODAL ─────────────────── */}
      {showApprovalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowApprovalModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                  <CheckCircle2 size={20} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Approve Customer Quotation?</h3>
              </div>
              <button onClick={() => setShowApprovalModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              By approving this quotation, the selected manufacturer allocations will be authorized to create the Master Order and split manufacturer sub-orders.
            </p>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 18, fontSize: 12.5 }}>
              <div>Quotation: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>CQUO-2026-9001</strong></div>
              <div>Customer: <strong style={{ color: '#0F172A' }}>Apex Pharma PCD Franchise</strong></div>
              <div>Grand Total: <strong style={{ color: '#0F766E' }}>₹{grandTotal.toLocaleString()}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowApprovalModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmCustomerApproval} style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} /> Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ── REJECTION MODAL ────────────────────────────────────── */}
      {showRejectionModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRejectionModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#B91C1C', margin: 0 }}>Reject Customer Quotation?</h3>
              <button onClick={() => setShowRejectionModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Are you sure you want to reject this quotation? Order creation will be permanently blocked for this quotation.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowRejectionModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmRejection} style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Reject Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MASTER ORDER CONFIRMATION MODAL ────────────────── */}
      {showCreateMasterOrderModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCreateMasterOrderModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Create Master Order?</h3>
              <button onClick={() => setShowCreateMasterOrderModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>Quote Number: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>QUOTE-1001</strong></div>
              <div>Customer: <strong style={{ color: '#0F172A' }}>Apex Pharma PCD Franchise</strong></div>
              <div>Number of Products: <strong style={{ color: '#0F172A' }}>{productSummaryItems.length} Product Lines</strong></div>
              <div>Total Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>17,000 Units</strong></div>
              <div>Total Order Value: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>₹{grandTotal.toLocaleString()}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowCreateMasterOrderModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateMasterOrderModal(false);
                  handleCreateMasterOrderPO();
                }}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Create Master Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
