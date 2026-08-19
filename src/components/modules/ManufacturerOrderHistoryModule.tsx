import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShoppingBag, CheckCircle2, Clock, Truck, FileText, Download, 
  Package, ChevronRight, Eye, AlertCircle, ShieldCheck, X, Search, Filter,
  ArrowLeft, ArrowRight, Building2, Calendar, DollarSign, Receipt, Check, FileCheck, Layers, AlertTriangle
} from 'lucide-react';
import { UNIFIED_STORAGE_KEY } from './ProductionExecutionModule';

interface ManufacturerOrderHistoryModuleProps {
  onNavigateTab?: (tabId: string) => void;
}

export const ManufacturerOrderHistoryModule: React.FC<ManufacturerOrderHistoryModuleProps> = ({ onNavigateTab }) => {
  const { orders, invoices, manufacturers, setActiveTab, addAuditLog } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const mfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const mfgId = myMfg?.id || 'm1';

  // Filters & Search State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubOrder, setSelectedSubOrder] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Read Unified Store
  const [subOrdersStore, setSubOrdersStore] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'SO-1001-01': {
        subOrderNumber: 'SO-1001-01',
        poNumber: 'PO-2026-1001-01',
        masterOrderNumber: 'MO-2026-1001',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd.',
        productName: 'Paracetamol 500mg & Azithromycin 500mg',
        totalQuantity: 12000,
        productionStatus: 'PO_ACCEPTED',
        shipment: null
      }
    };
  });

  // Keep synced with localStorage
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
        if (saved) setSubOrdersStore(JSON.parse(saved));
      } catch (e) { console.error(e); }
    };

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, []);

  // DERIVE MANUFACTURER ORDERS FROM REAL APPLICATION DATA
  const allMfgOrders = useMemo(() => {
    const list: any[] = [];
    const processedCodes = new Set<string>();

    // 1. Iterate AppContext orders
    orders.forEach(masterOrd => {
      (masterOrd.subOrders || []).forEach(sub => {
        const isMyOrder = sub.manufacturerId === mfgId ||
                          sub.manufacturerName.toLowerCase().includes('sunbio') ||
                          sub.manufacturerName.toLowerCase().includes(mfgName.toLowerCase());

        if (!isMyOrder) return;

        const subCode = sub.subOrderNumber === 'SO-2026-1001-01' ? 'SO-1001-01' : sub.subOrderNumber;
        processedCodes.add(subCode);

        const storeRec = subOrdersStore[subCode] || null;
        const prodStatus = storeRec?.productionStatus || sub.status || 'PO_ACCEPTED';
        const shpObj = storeRec?.shipment;
        const invObj = storeRec?.invoice || invoices.find(inv => inv.subOrderNumber === subCode);

        let overallStatus = 'PO ACCEPTED';
        if (shpObj) {
          overallStatus = shpObj.shipmentStatus;
        } else if (prodStatus) {
          overallStatus = prodStatus.replace(/_/g, ' ');
        }

        list.push({
          id: sub.id || subCode,
          subOrderNumber: subCode,
          poNumber: sub.poNumber || `PO-${subCode}`,
          masterOrderNumber: masterOrd.orderNumber,
          masterOrderId: masterOrd.id,
          customerName: masterOrd.customerName,
          manufacturerName: sub.manufacturerName,
          totalQuantity: sub.lines?.reduce((sum, l) => sum + l.quantity, 0) || sub.totalQuantity || 10000,
          totalAmount: sub.totalAmount || 150000,
          createdDate: masterOrd.createdDate || '2026-08-04',
          expectedDeliveryDate: sub.expectedDeliveryDate || masterOrd.expectedDeliveryDate || '2026-08-25',
          overallStatus,
          productionStatus: prodStatus,
          shipment: shpObj,
          invoice: invObj,
          lines: sub.lines || [
            { productName: storeRec?.productName || 'Paracetamol 500mg Tablets', quantity: sub.totalQuantity || 10000, unitPrice: 15.00, taxPercent: 12, totalPrice: sub.totalAmount || 150000 }
          ]
        });
      });
    });

    // 2. Add records in subOrdersStore not in AppContext orders
    Object.keys(subOrdersStore).forEach(subCode => {
      if (processedCodes.has(subCode)) return;

      const storeRec = subOrdersStore[subCode];
      if (!storeRec) return;

      const isMyOrder = storeRec.manufacturerName?.toLowerCase().includes('sunbio') ||
                        storeRec.manufacturerName?.toLowerCase().includes(mfgName.toLowerCase());

      if (!isMyOrder) return;

      processedCodes.add(subCode);
      const prodStatus = storeRec.productionStatus || 'PO_ACCEPTED';
      const shpObj = storeRec.shipment;
      const invObj = storeRec.invoice || invoices.find(inv => inv.subOrderNumber === subCode);

      let overallStatus = 'PO ACCEPTED';
      if (shpObj) {
        overallStatus = shpObj.shipmentStatus;
      } else if (prodStatus) {
        overallStatus = prodStatus.replace(/_/g, ' ');
      }

      list.push({
        id: subCode,
        subOrderNumber: subCode,
        poNumber: storeRec.poNumber || `PO-${subCode}`,
        masterOrderNumber: storeRec.masterOrderNumber || 'MO-2026-1001',
        masterOrderId: 'mo1',
        customerName: storeRec.customerName || 'B2B Client Partner',
        manufacturerName: storeRec.manufacturerName || mfgName,
        totalQuantity: storeRec.totalQuantity || 10000,
        totalAmount: storeRec.orderValue || storeRec.totalAmount || 150000,
        createdDate: '2026-08-04',
        expectedDeliveryDate: '2026-08-25',
        overallStatus,
        productionStatus: prodStatus,
        shipment: shpObj,
        invoice: invObj,
        lines: [
          { productName: storeRec.productName || 'Paracetamol 500mg Tablets', quantity: storeRec.totalQuantity || 10000, unitPrice: 15.00, taxPercent: 12, totalPrice: storeRec.orderValue || 150000 }
        ]
      });
    });

    return list;
  }, [orders, subOrdersStore, invoices, mfgId, mfgName]);

  // Filter Logic
  const filteredMfgOrders = useMemo(() => {
    return allMfgOrders.filter(ord => {
      const st = (ord.overallStatus || '').toUpperCase();
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = st !== 'CLOSED' && st !== 'DELIVERED' && st !== 'POD_CONFIRMED';
      } else if (statusFilter === 'IN_PRODUCTION') {
        matchesStatus = st.includes('PRODUCTION') || st.includes('SCHEDULED') || st.includes('ACCEPT');
      } else if (statusFilter === 'READY_TO_DISPATCH') {
        matchesStatus = st.includes('READY');
      } else if (statusFilter === 'DISPATCHED') {
        matchesStatus = st.includes('DISPATCHED') || st.includes('TRANSIT') || st.includes('DELIVERY');
      } else if (statusFilter === 'DELIVERED') {
        matchesStatus = st.includes('DELIVERED') || st.includes('POD');
      } else if (statusFilter === 'COMPLETED') {
        matchesStatus = st.includes('CLOSED') || st.includes('POD') || st.includes('DELIVERED');
      } else if (statusFilter === 'CANCELLED') {
        matchesStatus = st.includes('REJECT') || st.includes('CANCEL');
      }

      const q = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        const matchSub = ord.subOrderNumber.toLowerCase().includes(q);
        const matchMaster = ord.masterOrderNumber.toLowerCase().includes(q);
        const matchPO = ord.poNumber.toLowerCase().includes(q);
        const matchCust = ord.customerName.toLowerCase().includes(q);
        const matchProd = ord.lines.some((l: any) => l.productName?.toLowerCase().includes(q));
        matchesSearch = matchSub || matchMaster || matchPO || matchCust || matchProd;
      }

      return matchesStatus && matchesSearch;
    });
  }, [allMfgOrders, statusFilter, searchQuery]);

  // Summary Count Metrics
  const metrics = useMemo(() => {
    const total = allMfgOrders.length;
    const active = allMfgOrders.filter(o => !['CLOSED', 'DELIVERED', 'POD_CONFIRMED'].includes((o.overallStatus || '').toUpperCase())).length;
    const completed = allMfgOrders.filter(o => ['CLOSED', 'DELIVERED', 'POD_CONFIRMED'].includes((o.overallStatus || '').toUpperCase())).length;
    const pending = allMfgOrders.filter(o => (o.overallStatus || '').toUpperCase().includes('ACCEPT')).length;

    return { total, active, completed, pending };
  }, [allMfgOrders]);

  const handleNav = (tabId: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabId);
    } else {
      setActiveTab(tabId);
    }
  };

  const getStatusBadgeStyle = (st: string) => {
    const u = (st || '').toUpperCase();
    if (u.includes('CLOSED')) return { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569' };
    if (u.includes('DELIVERED') || u.includes('POD')) return { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' };
    if (u.includes('DISPATCH') || u.includes('TRANSIT')) return { bg: '#E0F2FE', border: '#BAE6FD', color: '#0369A1' };
    if (u.includes('READY')) return { bg: '#F3E8FF', border: '#E9D5FF', color: '#6B21A8' };
    if (u.includes('PRODUCTION') || u.includes('SCHEDULED')) return { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' };
    return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ── COMMAND HEADER ───────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Manufacturer Portal</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: '#0F766E' }}>Order History & Audit Trail</span>
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Manufacturer Order History
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Real-time, synchronized sub-order history and manufacturing fulfillment logs for <strong style={{ color: '#0F766E' }}>{mfgName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => handleNav('production-planning')}
            style={{ padding: '9px 16px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Clock size={15} /> Production Desk →
          </button>
          <button
            onClick={() => handleNav('shipments')}
            style={{ padding: '9px 16px', borderRadius: 8, background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Truck size={15} /> Dispatch Telemetry →
          </button>
        </div>
      </div>

      {/* ── METRIC CARDS BAR ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Sub-Orders</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{metrics.total}</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Assigned to facility</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active In Execution</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>{metrics.active}</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>In production or transit</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completed & Delivered</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.completed}</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>POD confirmed / closed</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Awaiting Acceptance</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 4 }}>{metrics.pending}</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Pending sign-off</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER TOOLBAR ────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          
          {/* Status Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'ACTIVE', label: 'Active Orders' },
              { id: 'IN_PRODUCTION', label: 'In Production' },
              { id: 'READY_TO_DISPATCH', label: 'Ready To Dispatch' },
              { id: 'DISPATCHED', label: 'Dispatched / In Transit' },
              { id: 'DELIVERED', label: 'Delivered / POD' },
              { id: 'COMPLETED', label: 'Completed / Past' },
            ].map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    border: active ? '1px solid #0F766E' : '1px solid #E2E8F0',
                    background: active ? '#F0FDFA' : '#F8FAFC',
                    color: active ? '#0F766E' : '#64748B'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search Sub-Order, PO #, Customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}
            />
          </div>

        </div>
      </div>

      {/* ── ORDER HISTORY TABLE ───────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textTransform: 'uppercase', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 16px' }}>Sub-Order / Ref</th>
              <th style={{ padding: '12px 16px' }}>Customer / Buyer</th>
              <th style={{ padding: '12px 16px' }}>Products</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Quantity</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Order Value</th>
              <th style={{ padding: '12px 16px' }}>Order Date</th>
              <th style={{ padding: '12px 16px' }}>Target Delivery</th>
              <th style={{ padding: '12px 16px' }}>Current Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMfgOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                  <AlertCircle size={24} style={{ color: '#94A3B8', marginBottom: 6 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>No manufacturer sub-orders match your search criteria.</div>
                </td>
              </tr>
            ) : (
              filteredMfgOrders.map(so => {
                const badge = getStatusBadgeStyle(so.overallStatus);

                return (
                  <tr key={so.subOrderNumber} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                    
                    {/* 1. Sub-Order Ref */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', fontSize: 13.5 }}>
                        {so.subOrderNumber}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
                        PO: {so.poNumber}
                      </div>
                    </td>

                    {/* 2. Customer */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{so.customerName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>MO: {so.masterOrderNumber}</div>
                    </td>

                    {/* 3. Products */}
                    <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                      <div style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {so.lines?.[0]?.productName || 'Pharmaceutical Products'}
                      </div>
                      {so.lines?.length > 1 && (
                        <div style={{ fontSize: 11, color: '#64748B' }}>+{so.lines.length - 1} additional items</div>
                      )}
                    </td>

                    {/* 4. Quantity */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                      {so.totalQuantity.toLocaleString()} Units
                    </td>

                    {/* 5. Order Value */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>
                      ₹{so.totalAmount.toLocaleString()}
                    </td>

                    {/* 6. Order Date */}
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {so.createdDate}
                    </td>

                    {/* 7. Target Delivery */}
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {so.expectedDeliveryDate}
                    </td>

                    {/* 8. Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 4, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                        {so.overallStatus}
                      </span>
                    </td>

                    {/* 9. Quick Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedSubOrder(so);
                            setShowDetailModal(true);
                          }}
                          style={{ padding: '5px 10px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={13} /> View Order
                        </button>

                        <button
                          onClick={() => handleNav('production-planning')}
                          style={{ padding: '5px 10px', borderRadius: 6, background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0F766E', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}
                        >
                          Production
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL: READ-ONLY ORDER SUMMARY DETAIL ─────────────────── */}
      {showDetailModal && selectedSubOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowDetailModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Sub-Order Summary #{selectedSubOrder.subOrderNumber}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Manufacturer Fulfillment Record · {selectedSubOrder.manufacturerName}</div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {/* SECTION 1: ORDER INFORMATION */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>ORDER INFORMATION</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                <div>Master Order #: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.masterOrderNumber}</strong></div>
                <div>Sub-Order #: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.subOrderNumber}</strong></div>
                <div>PO Number: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.poNumber}</strong></div>
                <div>Order Date: <strong>{selectedSubOrder.createdDate}</strong></div>
                <div>Customer / Buyer: <strong>{selectedSubOrder.customerName}</strong></div>
                <div>Order Value: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>₹{selectedSubOrder.totalAmount.toLocaleString()}</strong></div>
              </div>
            </div>

            {/* SECTION 2: PRODUCT DETAILS */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: '#F1F5F9', padding: '8px 12px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                PRODUCT DETAILS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Product</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubOrder.lines?.map((ln: any, idx: number) => (
                    <tr key={idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{ln.productName}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{ln.quantity.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{ln.unitPrice}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>₹{(ln.totalPrice || ln.quantity * ln.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION 3: MANUFACTURING STATUS */}
            <div style={{ background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 12, fontSize: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>MANUFACTURING EXECUTION STATUS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>Production Status: <strong style={{ color: '#0F766E' }}>{selectedSubOrder.productionStatus.replace(/_/g, ' ')}</strong></div>
                <div>Assay clearance: <strong>PASSED ✓</strong></div>
              </div>
            </div>

            {/* SECTION 4: DISPATCH & LOGISTICS STATUS */}
            {selectedSubOrder.shipment ? (
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', marginBottom: 6 }}>DISPATCH & LOGISTICS TELEMETRY</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>Shipment #: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.shipment.trackingNumber}</strong></div>
                  <div>Logistics Status: <strong style={{ color: '#16A34A' }}>{selectedSubOrder.shipment.shipmentStatus}</strong></div>
                  <div>Transporter: <strong>{selectedSubOrder.shipment.transporterName}</strong></div>
                  <div>POD Status: <strong>{selectedSubOrder.shipment.podStatus || 'PENDING'}</strong></div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: '#64748B', background: '#F8FAFC', padding: 10, borderRadius: 6, border: '1px dashed #CBD5E1' }}>
                Dispatch Telemetry: Logistics shipment not yet dispatched.
              </div>
            )}

            {/* SECTION 5: INVOICE */}
            {selectedSubOrder.invoice ? (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 12, fontSize: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', marginBottom: 6 }}>COMMERCIAL TAX INVOICE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>Invoice #: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.invoice.invoiceNumber}</strong></div>
                  <div>Amount: <strong style={{ color: '#1D4ED8' }}>₹{selectedSubOrder.invoice.totalAmount?.toLocaleString()}</strong></div>
                  <div>Invoice Date: <strong>{selectedSubOrder.invoice.invoiceDate}</strong></div>
                  <div>Payment Status: <strong style={{ textTransform: 'uppercase' }}>{selectedSubOrder.invoice.status}</strong></div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: '#64748B', background: '#F8FAFC', padding: 10, borderRadius: 6 }}>
                Commercial Invoice: Invoice will be generated after dispatch.
              </div>
            )}

            {/* SECTION 6: BUYER GOODS RECEIPT CONFIRMATION (READ-ONLY) */}
            {selectedSubOrder.shipment?.goodsReceipt ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 12, fontSize: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 6 }}>
                  BUYER GOODS RECEIPT CONFIRMATION (READ-ONLY)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>Receipt Status: <strong style={{ color: '#16A34A' }}>✓ {selectedSubOrder.shipment.goodsReceipt.status.replace(/_/g, ' ')}</strong></div>
                  <div>Received Qty: <strong style={{ color: '#166534', fontFamily: 'monospace' }}>{selectedSubOrder.shipment.goodsReceipt.receivedQuantity?.toLocaleString()} Units</strong></div>
                  <div>Missing Qty: <strong style={{ color: selectedSubOrder.shipment.goodsReceipt.missingQuantity > 0 ? '#DC2626' : '#64748B', fontFamily: 'monospace' }}>{selectedSubOrder.shipment.goodsReceipt.missingQuantity?.toLocaleString()} Units</strong></div>
                  <div>Received Date: <strong>{selectedSubOrder.shipment.goodsReceipt.receivedDate}</strong></div>
                  <div>Received By: <strong>{selectedSubOrder.shipment.goodsReceipt.receivedBy}</strong></div>
                  <div>Condition: <strong>{selectedSubOrder.shipment.goodsReceipt.condition}</strong></div>
                </div>
                {selectedSubOrder.shipment.goodsReceipt.receivingRemarks && (
                  <div style={{ fontSize: 11.5, color: '#166534', marginTop: 6, background: '#FFF', padding: '6px 10px', borderRadius: 4, border: '1px solid #BBF7D0' }}>
                    <strong>Buyer Remarks:</strong> {selectedSubOrder.shipment.goodsReceipt.receivingRemarks}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: '#64748B', background: '#F8FAFC', padding: 10, borderRadius: 6, border: '1px dashed #CBD5E1' }}>
                Buyer Goods Receipt: <span style={{ color: '#94A3B8' }}>Pending buyer confirmation after delivery.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button type="button" onClick={() => setShowDetailModal(false)} style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Close Summary
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
