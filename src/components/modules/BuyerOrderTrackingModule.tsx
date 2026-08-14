import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShoppingBag, CheckCircle2, Clock, Truck, FileText, Download, 
  Package, ChevronRight, Eye, AlertCircle, ShieldCheck, X
} from 'lucide-react';
import { MasterOrder } from '../../types';

export const BuyerOrderTrackingModule: React.FC = () => {
  const { orders, addAuditLog } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(orders[0] || null);

  const UNIFIED_STORAGE_KEY = 'factorygrid_unified_suborders_v9';

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

  useEffect(() => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(subOrdersStore));
    } catch (e) { console.error(e); }
  }, [subOrdersStore]);

  // Modal Controls
  const [showBuyerConfirmDeliveryModal, setShowBuyerConfirmDeliveryModal] = useState<boolean>(false);
  const [showBuyerPodModal, setShowBuyerPodModal] = useState<boolean>(false);
  const [showBuyerCloseModal, setShowBuyerCloseModal] = useState<boolean>(false);
  const [activeSubOrderCode, setActiveSubOrderCode] = useState<string>('SO-1001-01');

  // Form Inputs
  const [delivReceiver, setDelivReceiver] = useState('Dr. Vikas Sharma (Stores In-Charge)');
  const [delivDate, setDelivDate] = useState('2026-08-17');
  const [delivRemarks, setDelivRemarks] = useState('Cold chain tamper-evident seal verified unbroken upon arrival.');

  const [podReceiver, setPodReceiver] = useState('Dr. Vikas Sharma (Stores In-Charge)');
  const [podDate, setPodDate] = useState('2026-08-17');
  const [podRemarksText, setPodRemarksText] = useState('Official POD stamp verified. Temperature data log attached.');

  const activeMasterOrder = selectedOrder || orders[0];
  const activeSubRec = subOrdersStore[activeSubOrderCode] || subOrdersStore['SO-1001-01'];
  const activeShipment = activeSubRec?.shipment;

  // Timeline calculation for shipment
  const getShipmentTimelineSteps = (status?: string) => {
    if (!status) return [];
    const isDispatched = true;
    const isInTransit = status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' || status === 'POD_CONFIRMED' || status === 'CLOSED';
    const isOutForDelivery = status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' || status === 'POD_CONFIRMED' || status === 'CLOSED';
    const isDelivered = status === 'DELIVERED' || status === 'POD_CONFIRMED' || status === 'CLOSED';

    return [
      { label: 'Dispatched', done: isDispatched, isCurrent: status === 'DISPATCHED', step: 1 },
      { label: 'In Transit', done: isInTransit, isCurrent: status === 'IN_TRANSIT', step: 2 },
      { label: 'Out For Delivery', done: isOutForDelivery, isCurrent: status === 'OUT_FOR_DELIVERY', step: 3 },
      { label: 'Delivered', done: isDelivered, isCurrent: status === 'DELIVERED' || status === 'POD_CONFIRMED' || status === 'CLOSED', step: 4 }
    ];
  };

  // Buyer Action: Confirm Delivery Submit -> DELIVERED
  const handleBuyerConfirmDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' (Today)';
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Delivered',
      actor: `Buyer / ${delivReceiver}`,
      details: `Delivery confirmed at consignee facility. Received by ${delivReceiver}. Remarks: ${delivRemarks}`
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [activeSubOrderCode]: {
        ...prev[activeSubOrderCode],
        shipment: {
          ...activeShipment,
          shipmentStatus: 'DELIVERED',
          actualDeliveryDate: delivDate,
          podReceiverName: delivReceiver,
          podDeliveryDate: delivDate,
          podRemarks: delivRemarks,
          activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
        }
      }
    }));

    setShowBuyerConfirmDeliveryModal(false);
    addAuditLog('Buyer Order Tracking', `Confirmed delivery for ${activeShipment.trackingNumber}. Receiver: ${delivReceiver}`);
    alert(`✔ Delivery Confirmed for ${activeShipment.trackingNumber}!\n\nStatus updated to DELIVERED.`);
  };

  // Buyer Action: Confirm POD Submit -> POD_CONFIRMED
  const handleBuyerConfirmPodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' (Today)';
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Proof of Delivery (POD) Confirmed',
      actor: 'Buyer / Apex Pharma',
      details: `Electronic POD stamp & signature verified. Receiver: ${podReceiver}`
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [activeSubOrderCode]: {
        ...prev[activeSubOrderCode],
        shipment: {
          ...activeShipment,
          shipmentStatus: 'POD_CONFIRMED',
          podStatus: 'CONFIRMED',
          podReceiverName: podReceiver,
          podDeliveryDate: podDate,
          podRemarks: podRemarksText,
          activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
        }
      }
    }));

    setShowBuyerPodModal(false);
    addAuditLog('Buyer Order Tracking', `Confirmed POD for ${activeShipment.trackingNumber}`);
    alert(`✔ Proof of Delivery (POD) Confirmed for ${activeShipment.trackingNumber}!\n\nEligible for shipment closure.`);
  };

  // Buyer Action: Close Shipment -> CLOSED
  const handleBuyerCloseShipmentSubmit = () => {
    if (!activeShipment) return;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' (Today)';
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Closed',
      actor: 'System / Authorized Buyer',
      details: 'Logistics lifecycle completed. Shipment archived to Delivery History.'
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [activeSubOrderCode]: {
        ...prev[activeSubOrderCode],
        shipment: {
          ...activeShipment,
          shipmentStatus: 'CLOSED',
          activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
        }
      }
    }));

    setShowBuyerCloseModal(false);
    addAuditLog('Buyer Order Tracking', `Closed Shipment ${activeShipment.trackingNumber}`);
    alert(`✔ Shipment ${activeShipment.trackingNumber} CLOSED!\n\nArchived to Delivery History.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F012A' }}>

      {/* Command Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Buyer Portal / Order Fulfillment & Tracking
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
            Master Order Lifecycle & Sub-Order Tracking
          </h1>
        </div>
      </div>

      {/* Main Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>

        {/* LEFT: Master Orders List */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0', fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', background: '#F8FAFC' }}>
            Master Orders ({orders.length})
          </div>

          {orders.map(ord => {
            const isSelected = activeMasterOrder?.id === ord.id;
            return (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  background: isSelected ? '#F0FDFA' : '#FFFFFF',
                  borderLeft: `4px solid ${isSelected ? '#0F766E' : 'transparent'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#0F766E', fontFamily: 'monospace' }}>{ord.orderNumber}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>{ord.status}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{ord.customerName}</div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{ord.subOrders.length} Sub-Orders Split</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', marginTop: 4 }}>
                  ₹{ord.totalAmount.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Master Order Breakdown */}
        {activeMasterOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Master Order Header Box */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order Reference</span>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{activeMasterOrder.orderNumber}</h2>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Delivery Address: {activeMasterOrder.shippingAddress}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Order Value</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{activeMasterOrder.totalAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Sub-Orders Breakdown with Separated Production and Logistics Views */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>
                Sub-Orders Status Breakdown ({activeMasterOrder.subOrders.length} Split Orders)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeMasterOrder.subOrders.map(sub => {
                  const subCode = sub.subOrderNumber === 'SO-2026-1001-01' ? 'SO-1001-01' : sub.subOrderNumber;
                  const storeRec = subOrdersStore[subCode] || subOrdersStore['SO-1001-01'];
                  const prodStatus = storeRec?.productionStatus || 'PO_ACCEPTED';
                  const shpObj = storeRec?.shipment;

                  return (
                    <div key={sub.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{subCode}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                              PRODUCTION: {prodStatus.replace(/_/g, ' ')}
                            </span>
                            {shpObj && (
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                                SHIPMENT: {shpObj.shipmentStatus.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Manufacturer: {sub.manufacturerName}</div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{sub.totalAmount.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>Expected Delivery: {sub.expectedDeliveryDate}</div>
                        </div>
                      </div>

                      {/* Production Status Box */}
                      <div style={{ background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 12, fontSize: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                        <div>Order Status: <strong>PO Accepted</strong></div>
                        <div>Production Status: <strong style={{ color: '#0F766E' }}>{prodStatus.replace(/_/g, ' ')}</strong></div>
                        <div>Batch #: <strong style={{ fontFamily: 'monospace' }}>{storeRec?.batchNumber || 'BATCH-2026-8801'}</strong></div>
                        <div>QC Assay: <strong>{storeRec?.qcInspectionResult === 'PASS' ? 'PASSED ✓' : 'In Progress'}</strong></div>
                      </div>

                      {/* Connected Shipment Telemetry & Action Panel */}
                      {shpObj ? (
                        <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Shipment Tracking Number</div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{shpObj.trackingNumber}</div>
                            </div>

                            {/* Buyer Action Buttons */}
                            <div>
                              {shpObj.shipmentStatus === 'OUT_FOR_DELIVERY' && (
                                <button
                                  onClick={() => { setActiveSubOrderCode(subCode); setShowBuyerConfirmDeliveryModal(true); }}
                                  style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                                >
                                  Confirm Delivery →
                                </button>
                              )}

                              {shpObj.shipmentStatus === 'DELIVERED' && (
                                <button
                                  onClick={() => { setActiveSubOrderCode(subCode); setShowBuyerPodModal(true); }}
                                  style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                                >
                                  Upload / Confirm POD →
                                </button>
                              )}

                              {shpObj.shipmentStatus === 'POD_CONFIRMED' && (
                                <button
                                  onClick={() => { setActiveSubOrderCode(subCode); setShowBuyerCloseModal(true); }}
                                  style={{ padding: '8px 18px', borderRadius: 6, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                                >
                                  Close Shipment →
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Logistics Info Row */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, fontSize: 12, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 6, padding: 10 }}>
                            <div>Transporter: <strong>{shpObj.transporterName}</strong></div>
                            <div>Vehicle #: <strong style={{ fontFamily: 'monospace' }}>{shpObj.vehicleNumber}</strong></div>
                            <div>Driver: <strong>{shpObj.driverName} ({shpObj.driverPhone})</strong></div>
                            <div>Dispatch Date: <strong>{shpObj.dispatchDate}</strong></div>
                          </div>

                          {/* Connected Timeline Bar */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, fontSize: 11 }}>
                            {getShipmentTimelineSteps(shpObj.shipmentStatus).map(st => (
                              <div key={st.step} style={{ background: st.isCurrent ? '#F0FDFA' : st.done ? '#FFF' : '#F1F5F9', border: st.isCurrent ? '2px solid #0F766E' : st.done ? '1px solid #86EFAC' : '1px solid #CBD5E1', borderRadius: 6, padding: 8, textAlign: 'center', opacity: st.done ? 1 : 0.5 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: st.isCurrent ? '#0F766E' : st.done ? '#16A34A' : '#64748B' }}>
                                  {st.done ? '✓' : st.step}
                                </div>
                                <div style={{ fontWeight: st.isCurrent || st.done ? 800 : 500, color: st.isCurrent ? '#0F766E' : st.done ? '#0F172A' : '#64748B', marginTop: 2 }}>
                                  {st.label} {st.isCurrent ? '[CURRENT]' : ''}
                                </div>
                              </div>
                            ))}
                          </div>

                        </div>
                      ) : (
                        <div style={{ fontSize: 11.5, color: '#64748B', background: '#FFF', border: '1px dashed #CBD5E1', padding: 10, borderRadius: 6 }}>
                          Logistics shipment has not been created yet. Order is currently in manufacturing execution.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : null}
      </div>

      {/* MODAL 1: BUYER CONFIRM DELIVERY */}
      {showBuyerConfirmDeliveryModal && activeShipment && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowBuyerConfirmDeliveryModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Delivery</h3>
              <button onClick={() => setShowBuyerConfirmDeliveryModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handleBuyerConfirmDeliverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Received By *</label>
                <input type="text" required value={delivReceiver} onChange={e => setDelivReceiver(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Date *</label>
                <input type="date" required value={delivDate} onChange={e => setDelivDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Remarks</label>
                <textarea rows={2} value={delivRemarks} onChange={e => setDelivRemarks(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowBuyerConfirmDeliveryModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm Delivery →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BUYER CONFIRM POD */}
      {showBuyerPodModal && activeShipment && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowBuyerPodModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Proof of Delivery (POD)</h3>
              <button onClick={() => setShowBuyerPodModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handleBuyerConfirmPodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Receiver Name *</label>
                <input type="text" required value={podReceiver} onChange={e => setPodReceiver(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Date *</label>
                <input type="date" required value={podDate} onChange={e => setPodDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Remarks</label>
                <textarea rows={2} value={podRemarksText} onChange={e => setPodRemarksText(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowBuyerPodModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm POD →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BUYER CLOSE SHIPMENT */}
      {showBuyerCloseModal && activeShipment && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowBuyerCloseModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Close Shipment?</h3>
              <button onClick={() => setShowBuyerCloseModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
              Delivery and Proof of Delivery have been confirmed. Closing this shipment will complete the logistics lifecycle.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button type="button" onClick={() => setShowBuyerCloseModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleBuyerCloseShipmentSubmit} style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#166534', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Close Shipment →</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
