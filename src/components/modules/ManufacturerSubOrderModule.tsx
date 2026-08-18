import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag, Package, CheckCircle2, Clock, X, Check, AlertCircle,
  Building2, ArrowRight, Eye, AlertTriangle, Send, FileText, ChevronRight, RefreshCw, XCircle
} from 'lucide-react';

export const ManufacturerSubOrderModule: React.FC = () => {
  const { manufacturers, setActiveTab, addAuditLog } = useApp();

  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const myMfgCode = myMfg?.code || 'MFG000401';

  // Sub-Order State for Manufacturers (Keyed by subOrderCode)
  const [subOrdersState, setSubOrdersState] = useState<Record<string, {
    subOrderNumber: string;
    poNumber: string;
    masterOrderNumber: string;
    mfgId: string;
    mfgName: string;
    customerName: string;
    productsCount: number;
    totalQuantity: number;
    orderValue: number;
    leadTimeDays: number;
    status: 'Awaiting Acceptance' | 'Scheduled' | 'Rejected';
    rejectionReason?: string;
    rejectionRemarks?: string;
    acceptedAt?: string;
    lines: {
      productName: string;
      dosageForm: string;
      quantity: number;
      unitPrice: number;
      taxPercent: number;
      discountPercent: number;
      finalPrice: number;
      totalCost: number;
      leadTime: string;
    }[];
  }>>({
    'SO-1001-01': {
      subOrderNumber: 'SO-1001-01',
      poNumber: 'PO-2026-1001-01',
      masterOrderNumber: 'MO-2026-1001',
      mfgId: 'm1',
      mfgName: 'SunBio LifeSciences Ltd.',
      customerName: 'Apex Pharma PCD Franchise',
      productsCount: 2,
      totalQuantity: 12000,
      orderValue: 195300,
      leadTimeDays: 14,
      status: 'Awaiting Acceptance',
      lines: [
        { productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 9.66, taxPercent: 12, discountPercent: 5, finalPrice: 10.28, totalCost: 102800, leadTime: '14 Days' },
        { productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', quantity: 2000, unitPrice: 15.00, taxPercent: 18, discountPercent: 0, finalPrice: 16.80, totalCost: 92500, leadTime: '12 Days' }
      ]
    },
    'SO-1001-02': {
      subOrderNumber: 'SO-1001-02',
      poNumber: 'PO-2026-1001-02',
      masterOrderNumber: 'MO-2026-1001',
      mfgId: 'm2',
      mfgName: 'Cipla Partner Formulations Ltd.',
      customerName: 'Apex Pharma PCD Franchise',
      productsCount: 1,
      totalQuantity: 5000,
      orderValue: 57500,
      leadTimeDays: 10,
      status: 'Awaiting Acceptance',
      lines: [
        { productName: 'Amoxicillin 250mg Tablets', dosageForm: 'Capsule', quantity: 5000, unitPrice: 11.50, taxPercent: 12, discountPercent: 3, finalPrice: 12.40, totalCost: 57500, leadTime: '10 Days' }
      ]
    }
  });

  // Modal Control States
  const [selectedSubOrderCode, setSelectedSubOrderCode] = useState<string | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<boolean>(false);
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [targetActionSubOrderCode, setTargetActionSubOrderCode] = useState<string>('SO-1001-01');

  // Rejection Form State
  const [rejectionReason, setRejectionReason] = useState<string>('Capacity Constraints');
  const [rejectionRemarks, setRejectionRemarks] = useState<string>('');
  const [rejectionFormError, setRejectionFormError] = useState<string | null>(null);

  // Success Banner Notification State
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // STRICT MANUFACTURER FILTERING RULE:
  // SunBio (m1) sees ONLY SO-1001-01.
  // Cipla (m2) sees ONLY SO-1001-02.
  const myAssignedOrders = useMemo(() => {
    return Object.values(subOrdersState).filter(so =>
      so.mfgId === myMfgId || so.mfgName.toLowerCase().includes('sunbio')
    );
  }, [subOrdersState, myMfgId]);

  // Metric Summary Counts
  const metrics = useMemo(() => {
    const open = myAssignedOrders.filter(o => o.status !== 'Rejected').length;
    const awaiting = myAssignedOrders.filter(o => o.status === 'Awaiting Acceptance').length;
    const inProd = myAssignedOrders.filter(o => o.status === 'Scheduled').length;
    const ready = 0;
    const completed = 0;

    return { open, awaiting, inProd, ready, completed };
  }, [myAssignedOrders]);

  // Handle Open Accept Modal
  const handleOpenAcceptModal = (code: string) => {
    setTargetActionSubOrderCode(code);
    setShowAcceptModal(true);
  };

  // Confirm Accept Action
  const handleConfirmAccept = () => {
    const timeStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    setSubOrdersState(prev => ({
      ...prev,
      [targetActionSubOrderCode]: {
        ...prev[targetActionSubOrderCode],
        status: 'Scheduled',
        acceptedAt: timeStr
      }
    }));

    setShowAcceptModal(false);
    setSuccessBanner('Purchase Order accepted successfully.');
    addAuditLog('Sub-Order Engine', `Manufacturer ${myMfgName} ACCEPTED Purchase Order ${subOrdersState[targetActionSubOrderCode].poNumber}.`);
  };

  // Handle Open Reject Modal
  const handleOpenRejectModal = (code: string) => {
    setTargetActionSubOrderCode(code);
    setRejectionReason('Capacity Constraints');
    setRejectionRemarks('');
    setRejectionFormError(null);
    setShowRejectModal(true);
  };

  // Confirm Reject Action
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason || !rejectionReason.trim()) {
      setRejectionFormError('Please select a rejection reason.');
      return;
    }

    setSubOrdersState(prev => ({
      ...prev,
      [targetActionSubOrderCode]: {
        ...prev[targetActionSubOrderCode],
        status: 'Rejected',
        rejectionReason,
        rejectionRemarks
      }
    }));

    setShowRejectModal(false);
    setSuccessBanner(null);
    addAuditLog('Sub-Order Engine', `Manufacturer ${myMfgName} REJECTED Purchase Order ${subOrdersState[targetActionSubOrderCode].poNumber}. Reason: ${rejectionReason}`);
  };

  const activeDetailSubOrder = selectedSubOrderCode ? subOrdersState[selectedSubOrderCode] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>
      
      {/* ── Breadcrumb & Command Header ──────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
            <span>FactoryGrid</span>
            <span>/</span>
            <span>supplier</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: '#0F172A' }}>Order Management</span>
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Order Management
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Manufacturer-specific purchase orders and assigned sub-orders for <strong style={{ color: '#0F766E' }}>{myMfgName}</strong>
          </p>
        </div>
      </div>

      {/* ── Success Notification Banner ──────────────────────────── */}
      {successBanner && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} style={{ color: '#16A34A' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>{successBanner}</div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 1 }}>Facility confirmation recorded. Ready for production execution.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setActiveTab('production-planning')}
              style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Start Production Planning →
            </button>
            <button onClick={() => setSuccessBanner(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Metric Summary Cards Bar ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Open Orders</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{metrics.open}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Active assigned sub-orders</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Awaiting Acceptance</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 4 }}>{metrics.awaiting}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Pending facility sign-off</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>In Production</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>{metrics.inProd}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Scheduled or in batch execution</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Ready to Dispatch</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#7C3AED', fontFamily: 'monospace', marginTop: 4 }}>{metrics.ready}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Packed & QA cleared</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.completed}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Fulfilled & delivered</div>
        </div>
      </div>

      {/* ── Main Section: Orders Assigned to Me ──────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>
          ORDERS ASSIGNED TO ME ({myAssignedOrders.length} Sub-Order)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {myAssignedOrders.map(so => {
            const isAwaiting = so.status === 'Awaiting Acceptance';
            const isScheduled = so.status === 'Scheduled';
            const isRejected = so.status === 'Rejected';

            return (
              <div key={so.subOrderNumber} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 22, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>Sub-Order: {so.subOrderNumber}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: isScheduled ? '#DCFCE7' : isRejected ? '#FEE2E2' : '#FEF3C7', color: isScheduled ? '#15803D' : isRejected ? '#B91C1C' : '#B45309', border: '1px solid #CBD5E1' }}>
                        {isScheduled ? 'Scheduled' : isRejected ? 'Rejected' : 'PO Created / Awaiting Acceptance'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                      Customer: <strong style={{ color: '#0F172A' }}>{so.customerName}</strong> · Master Order Ref: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{so.masterOrderNumber}</strong> · Purchase Order: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{so.poNumber}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setSelectedSubOrderCode(so.subOrderNumber);
                        setViewDetailModal(true);
                      }}
                      style={{ padding: '8px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={14} /> View Order
                    </button>

                    {isAwaiting && (
                      <>
                        <button
                          onClick={() => handleOpenRejectModal(so.subOrderNumber)}
                          style={{ padding: '8px 14px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                        >
                          Reject Order
                        </button>
                        <button
                          onClick={() => handleOpenAcceptModal(so.subOrderNumber)}
                          style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                        >
                          Accept Order
                        </button>
                      </>
                    )}

                    {isScheduled && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setActiveTab('production-planning')}
                          style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          Production Planning →
                        </button>
                        <button
                          onClick={() => setActiveTab('shipments')}
                          style={{ padding: '8px 16px', borderRadius: 6, background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0F766E', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          Dispatch & Tracking →
                        </button>
                        <button
                          onClick={() => setActiveTab('invoices')}
                          style={{ padding: '8px 16px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          Invoices →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Products Cards */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                    Assigned Product Lines ({so.lines.length} Items)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                    {so.lines.map((p, pIdx) => (
                      <div key={pIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5 }}>{p.productName}</div>
                        <div style={{ fontSize: 12.5, color: '#0F766E', fontWeight: 800, fontFamily: 'monospace', marginTop: 2 }}>
                          {p.quantity.toLocaleString()} Units
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          Price: ₹{p.finalPrice.toFixed(2)}/unit · Line Total: ₹{p.totalCost.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-Order Financial & Lead Time Summary */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: 12.5 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Quantity</div>
                    <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{so.totalQuantity.toLocaleString()} Units</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Order Value</div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>₹{so.orderValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Lead Time</div>
                    <div style={{ fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>{so.leadTimeDays} Days</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status</div>
                    <div style={{ fontWeight: 800, color: isScheduled ? '#16A34A' : isRejected ? '#DC2626' : '#B45309', marginTop: 2 }}>
                      {so.status}
                    </div>
                  </div>
                </div>

                {isRejected && so.rejectionReason && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#991B1B' }}>
                    <strong>Order Rejected:</strong> {so.rejectionReason} {so.rejectionRemarks ? `— "${so.rejectionRemarks}"` : ''}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* ── 1. ACCEPT CONFIRMATION MODAL ─────────────────────────── */}
      {showAcceptModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAcceptModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Accept Purchase Order?
              </h3>
              <button onClick={() => setShowAcceptModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
              By accepting this order, you confirm that your facility will fulfill the assigned products and quantities according to the agreed quotation.
            </p>

            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#0F766E' }}>
              <div>Purchase Order: <strong>{subOrdersState[targetActionSubOrderCode]?.poNumber}</strong></div>
              <div>Sub-Order: <strong>{targetActionSubOrderCode}</strong></div>
              <div>Total Quantity: <strong>12,000 Units</strong> · Value: <strong>₹195,300</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowAcceptModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Accept Order
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 2. REJECT REASON MODAL ────────────────────────────────── */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRejectModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#B91C1C', margin: 0 }}>Reject Purchase Order</h3>
              <button onClick={() => setShowRejectModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {rejectionFormError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: 10, fontSize: 12, color: '#B91C1C' }}>
                  {rejectionFormError}
                </div>
              )}

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Rejection Reason *</label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFF' }}
                >
                  <option value="Capacity Constraints">Capacity Constraints / Batch Slot Full</option>
                  <option value="Raw Material Delay">Raw Material / Active Ingredient Shortage</option>
                  <option value="Lead Time Mismatch">Required Lead Time Cannot Be Met</option>
                  <option value="Price Escalation">Price / Tax Structure Revision Required</option>
                  <option value="Facility Under Maintenance">Facility Maintenance / Audit Scheduled</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Additional Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Provide additional details regarding rejection..."
                  value={rejectionRemarks}
                  onChange={e => setRejectionRemarks(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowRejectModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Reject Order
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── 3. VIEW SUB-ORDER DETAIL MODAL ────────────────────────── */}
      {viewDetailModal && activeDetailSubOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewDetailModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Sub-Order Details: {activeDetailSubOrder.subOrderNumber}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Purchase Order: {activeDetailSubOrder.poNumber} · Master Order Ref: {activeDetailSubOrder.masterOrderNumber}
                </div>
              </div>
              <button onClick={() => setViewDetailModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Sub-Order Meta Grid */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12.5 }}>
              <div>Manufacturer: <strong style={{ color: '#0F766E' }}>{activeDetailSubOrder.mfgName}</strong></div>
              <div>Customer: <strong style={{ color: '#0F172A' }}>{activeDetailSubOrder.customerName}</strong></div>
              <div>Sub-Order Status: <strong style={{ color: activeDetailSubOrder.status === 'Scheduled' ? '#16A34A' : '#B45309' }}>{activeDetailSubOrder.status}</strong></div>
              <div>PO Status: <strong style={{ color: activeDetailSubOrder.status === 'Scheduled' ? '#16A34A' : '#B45309' }}>{activeDetailSubOrder.status === 'Scheduled' ? 'Accepted' : 'PO Created'}</strong></div>
            </div>

            {/* Product Lines Table */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                Assigned Product Lines for {myMfgName}
              </div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDetailSubOrder.lines.map((line, lIdx) => (
                      <tr key={lIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                        <td style={{ padding: '10px 12px' }}>₹{line.unitPrice.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, fontFamily: 'monospace' }}>₹{line.totalCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>Total Assigned Quantity: <strong>{activeDetailSubOrder.totalQuantity.toLocaleString()} Units</strong></div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                Total Order Value: ₹{activeDetailSubOrder.orderValue.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setViewDetailModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
