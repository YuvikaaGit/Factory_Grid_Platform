import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber, UNIFIED_STORAGE_KEY } from './ProductionExecutionModule';
import {
  Truck, Navigation, Thermometer, ShieldCheck, Clock, MapPin,
  CheckCircle2, FileText, Upload, RefreshCw, AlertTriangle, Phone,
  ChevronRight, ArrowRight, Download, RotateCcw, Check, User, Plus, X,
  Layers, Package, AlertCircle, File, MoreVertical, Activity, ArrowLeft, XCircle
} from 'lucide-react';

interface ShipmentModuleProps {
  onNavigateTab?: (tabId: string) => void;
}

export type ShipmentStatus =
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'POD_CONFIRMED'
  | 'CLOSED';

export const ShipmentModule: React.FC<ShipmentModuleProps> = ({ onNavigateTab }) => {
  const { currentRole, addAuditLog, manufacturers } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';

  // Read Unified SubOrders Store
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
        productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
        totalQuantity: 12000,
        orderValue: 195300,
        productionStatus: 'PO_ACCEPTED',
        shipment: null
      }
    };
  });

  // Historical Completed Shipments (Archived in Delivery History)
  const historicalShipments = [
    {
      id: 'SHP-1001-02',
      trackingNumber: 'TRK-CIP-44092',
      subOrderNumber: 'SO-1001-02',
      masterOrderNumber: 'MO-2026-1001',
      poNumber: 'PO-2026-1001-02',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Operations',
      productName: 'Amoxicillin 500mg Tablets',
      totalQuantity: 5000,
      transporterName: 'BlueDart Healthcare Logistics',
      vehicleNumber: 'MH 04 CD 1102',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91 98112 33445',
      dispatchDate: '2026-08-12',
      expectedDeliveryDate: '2026-08-15',
      actualDeliveryDate: '2026-08-15',
      shipmentStatus: 'CLOSED' as ShipmentStatus,
      temperatureStatus: 'Normal / Compliant',
      currentTemp: '4.5°C',
      demoGpsLocation: 'Delivered at Apex Central Warehouse, Naroda',
      podStatus: 'CONFIRMED',
      podReceiverName: 'Dr. Vikas Sharma (Stores In-Charge)',
      podDeliveryDate: '2026-08-15',
      podRemarks: 'Cold chain tamper-evident seal verified unbroken. 100% quantity received.',
      podDocName: 'POD_STAMP_SIGNED_SO-1001-02.pdf',
      activityHistory: [
        { id: 'act_10', timestamp: '12 Aug 09:00 AM', eventTitle: 'Shipment Dispatched', actor: 'Cipla Partner Operations', details: 'Dispatched via BlueDart' },
        { id: 'act_11', timestamp: '12 Aug 11:30 AM', eventTitle: 'Shipment In Transit', actor: 'BlueDart Healthcare Logistics', details: 'Entered transit route' },
        { id: 'act_12', timestamp: '15 Aug 08:30 AM', eventTitle: 'Shipment Out for Delivery', actor: 'BlueDart Healthcare Logistics', details: 'Out for final mile delivery' },
        { id: 'act_13', timestamp: '15 Aug 02:15 PM', eventTitle: 'Shipment Delivered', actor: 'Apex Pharma / Dr. Vikas Sharma', details: 'Delivered to Naroda Warehouse' },
        { id: 'act_14', timestamp: '15 Aug 03:00 PM', eventTitle: 'POD Confirmed', actor: 'Apex Pharma', details: 'Electronic POD stamp verified' },
        { id: 'act_15', timestamp: '15 Aug 03:05 PM', eventTitle: 'Shipment Closed', actor: 'System / Authorized User', details: 'Lifecycle completed and archived' }
      ]
    }
  ];

  // Sync state changes with localStorage & window focus listeners
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed['SO-1001-01']) setSubOrdersStore(parsed);
        }
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
    } catch (e) {
      console.error(e);
    }
  }, [subOrdersStore]);

  const [selectedSubOrderCode, setSelectedSubOrderCode] = useState<string>('SO-1001-01');
  const [activeTabLocal, setActiveTabLocal] = useState<'ACTIVE_SHIPMENTS' | 'CREATE_SHIPMENT' | 'DELIVERY_HISTORY' | 'POD_VIEW'>('ACTIVE_SHIPMENTS');

  // VIEW MODE STATE: 'LIST' | 'DETAIL' | 'NOT_FOUND'
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL' | 'NOT_FOUND'>('LIST');
  const [notFoundTarget, setNotFoundTarget] = useState<string>('');

  // Deep Link Routing Check
  useEffect(() => {
    try {
      const targetTracking = localStorage.getItem('factorygrid_target_tracking');
      if (targetTracking) {
        const match = Object.values(subOrdersStore).find((s: any) => s.shipment && (s.shipment.trackingNumber === targetTracking || s.shipment.id === targetTracking || s.subOrderNumber === targetTracking));
        if (match) {
          setSelectedSubOrderCode(match.subOrderNumber);
          setViewMode('DETAIL');
        }
      }
    } catch (e) { console.error(e); }
  }, [subOrdersStore]);

  // Form States for Create Shipment
  const [transporterSelect, setTransporterSelect] = useState<string>('ColdEx Logistics Telemetry Fleet');
  const [customTransporter, setCustomTransporter] = useState<string>('');
  const [vehicleNo, setVehicleNo] = useState<string>('HP 12 B 9021');
  const [autoTrackingNo, setAutoTrackingNo] = useState<string>(`TRK-COLD-${Math.floor(80000 + Math.random() * 9999)}`);
  const [driverName, setDriverName] = useState<string>('Gurpreet Singh');
  const [driverPhone, setDriverPhone] = useState<string>('+91 98765 00112');
  const todayStr = new Date().toISOString().split('T')[0];
  const [dispDate, setDispDate] = useState<string>(todayStr);

  const calcDeliveryDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    } catch (e) { return dateStr; }
  };
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(calcDeliveryDate(todayStr));

  // Modal Control States
  const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] = useState<boolean>(false);
  const [showPodModal, setShowPodModal] = useState<boolean>(false);
  const [showCloseShipmentModal, setShowCloseShipmentModal] = useState<boolean>(false);

  // Form States for Modals
  const [delivReceiver, setDelivReceiver] = useState('Dr. Vikas Sharma (Stores In-Charge)');
  const [delivDate, setDelivDate] = useState('2026-08-17');
  const [delivRemarks, setDelivRemarks] = useState('Cold chain tamper-evident seal verified unbroken upon arrival.');

  const [podReceiver, setPodReceiver] = useState('Dr. Vikas Sharma (Stores In-Charge)');
  const [podDate, setPodDate] = useState('2026-08-17');
  const [podRemarksText, setPodRemarksText] = useState('Official POD stamp verified. Temperature data log attached.');
  const [podFileName, setPodFileName] = useState('POD_STAMP_SIGNED_SO-1001-01.pdf');

  const activeSubOrder = subOrdersStore[selectedSubOrderCode] || subOrdersStore['SO-1001-01'] || {
    subOrderNumber: 'SO-1001-01',
    poNumber: 'PO-2026-1001-01',
    masterOrderNumber: 'MO-2026-1001',
    customerName: 'Apex Pharma PCD Franchise',
    manufacturerName: myMfgName,
    productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
    totalQuantity: 12000,
    productionStatus: 'PO_ACCEPTED',
    shipment: null
  };
  const activeShipment = activeSubOrder?.shipment;

  // Active Dispatches Queue (ONLY active non-closed shipments)
  const activeDispatchesList = Object.values(subOrdersStore)
    .filter((s: any) => s.shipment && s.shipment.shipmentStatus !== 'CLOSED')
    .map((s: any) => s.shipment);

  // Delivery History Archive (ONLY closed shipments)
  const activeClosedShipments = Object.values(subOrdersStore)
    .filter((s: any) => s.shipment && s.shipment.shipmentStatus === 'CLOSED')
    .map((s: any) => s.shipment);

  const deliveryHistoryList = [...activeClosedShipments, ...historicalShipments];

  // Helper: Format Time String
  const getTimeString = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' (Today)';
  };

  // Sequential Step Index Converter (Strictly 6 Logistics Stages)
  const getShipmentStepIndex = (status: ShipmentStatus) => {
    switch (status) {
      case 'DISPATCHED': return 1;
      case 'IN_TRANSIT': return 2;
      case 'OUT_FOR_DELIVERY': return 3;
      case 'DELIVERED': return 4;
      case 'POD_CONFIRMED': return 5;
      case 'CLOSED': return 6;
      default: return 1;
    }
  };

  const currentStepIdx = activeShipment ? getShipmentStepIndex(activeShipment.shipmentStatus) : 1;

  // Exact Shipment Router Handler
  const handleOpenSpecificShipment = (shipmentId: string, trackingNo: string) => {
    const match = Object.values(subOrdersStore).find((s: any) => s.shipment && (s.shipment.id === shipmentId || s.shipment.trackingNumber === trackingNo || s.subOrderNumber === trackingNo || s.subOrderNumber === shipmentId));
    
    if (match) {
      setSelectedSubOrderCode(match.subOrderNumber);
      try {
        localStorage.setItem('factorygrid_target_tracking', match.shipment.trackingNumber);
      } catch (e) { console.error(e); }
      setViewMode('DETAIL');
    } else {
      const histMatch = historicalShipments.find(s => s.id === shipmentId || s.trackingNumber === trackingNo || s.subOrderNumber === trackingNo);
      if (histMatch) {
        setSelectedSubOrderCode(histMatch.subOrderNumber);
        setViewMode('DETAIL');
      } else {
        setNotFoundTarget(trackingNo || shipmentId);
        setViewMode('NOT_FOUND');
      }
    }
  };

  // CREATE NEW SHIPMENT HANDLER
  const handleCreateShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSubOrder.productionStatus !== 'READY_TO_DISPATCH') {
      alert('⚠ Shipment Cannot Be Created Yet!\n\nReason: Production must reach Ready To Dispatch before a shipment can be created.');
      return;
    }

    if (activeSubOrder.shipment && activeSubOrder.shipment.shipmentStatus !== 'CLOSED') {
      alert(`⚠ Shipment Already Exists!\n\nActive Shipment ${activeSubOrder.shipment.trackingNumber} is already created for Sub-Order ${activeSubOrder.subOrderNumber}.`);
      return;
    }

    const effectiveTransporter = transporterSelect === 'Other' ? customTransporter.trim() : transporterSelect;
    const timeStr = getTimeString();

    const newShipmentObj = {
      id: `SHP-${Date.now().toString().slice(-6)}`,
      trackingNumber: autoTrackingNo,
      subOrderNumber: activeSubOrder.subOrderNumber,
      masterOrderNumber: activeSubOrder.masterOrderNumber,
      poNumber: activeSubOrder.poNumber,
      customerName: activeSubOrder.customerName,
      manufacturerName: myMfgName,
      productName: activeSubOrder.productName,
      totalQuantity: activeSubOrder.totalQuantity,
      transporterName: effectiveTransporter,
      vehicleNumber: vehicleNo,
      driverName,
      driverPhone,
      dispatchDate: dispDate,
      expectedDeliveryDate: expectedDeliveryDate,
      shipmentStatus: 'DISPATCHED' as ShipmentStatus,
      temperatureStatus: 'Normal / Compliant (2°C - 8°C)',
      currentTemp: '4.1°C',
      demoGpsLocation: 'Dispatch Bay — En route to Consignee',
      podStatus: 'PENDING',
      activityHistory: [
        {
          id: `act_${Date.now()}`,
          timestamp: timeStr,
          eventTitle: 'Shipment Dispatched',
          actor: myMfgName,
          details: `Dispatched via ${effectiveTransporter} (Vehicle: ${vehicleNo}, Tracking: ${autoTrackingNo})`
        }
      ]
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        shipment: newShipmentObj
      }
    }));

    try {
      localStorage.setItem('factorygrid_target_tracking', autoTrackingNo);
    } catch (err) { console.error(err); }

    addAuditLog('Dispatch Engine', `Created & Dispatched Shipment ${autoTrackingNo} for ${selectedSubOrderCode}`);
    alert(`✔ Shipment DISPATCHED Successfully!\n\nTracking #: ${autoTrackingNo}\nVehicle #: ${vehicleNo}\nTransporter: ${effectiveTransporter}`);
    setViewMode('DETAIL');
  };

  // LOGISTICS ACTIONS
  const handleStartInTransit = () => {
    if (!activeShipment) return;
    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Entered In Transit',
      actor: activeShipment.transporterName || 'Logistics Partner',
      details: `Shipment ${activeShipment.trackingNumber} entered transit route via vehicle ${activeShipment.vehicleNumber}`
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        shipment: {
          ...activeShipment,
          shipmentStatus: 'IN_TRANSIT',
          activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
        }
      }
    }));

    addAuditLog('Shipment Tracking', `Updated ${activeShipment.trackingNumber} status to IN TRANSIT`);
    alert(`✔ Shipment ${activeShipment.trackingNumber} is now IN TRANSIT.`);
  };

  const handleMarkOutForDelivery = () => {
    if (!activeShipment) return;
    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Out for Delivery',
      actor: activeShipment.transporterName || 'Logistics Partner',
      details: `Shipment ${activeShipment.trackingNumber} is out for final mile delivery today`
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        shipment: {
          ...activeShipment,
          shipmentStatus: 'OUT_FOR_DELIVERY',
          activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
        }
      }
    }));

    addAuditLog('Shipment Tracking', `Updated ${activeShipment.trackingNumber} status to OUT FOR DELIVERY`);
    alert(`✔ Shipment ${activeShipment.trackingNumber} marked OUT FOR DELIVERY.`);
  };

  const handleConfirmDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Delivered',
      actor: `Buyer / ${delivReceiver}`,
      details: `Delivery confirmed at consignee facility. Received by ${delivReceiver}. Remarks: ${delivRemarks}`
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
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

    setShowConfirmDeliveryModal(false);
    addAuditLog('Shipment Tracking', `Confirmed delivery for ${activeShipment.trackingNumber}. Receiver: ${delivReceiver}`);
    alert(`✔ Delivery Confirmed for ${activeShipment.trackingNumber}!\n\nStatus updated to DELIVERED. Proof of Delivery (POD) can now be confirmed.`);
  };

  const handleConfirmPodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Proof of Delivery (POD) Confirmed',
      actor: `Buyer / ${activeShipment.customerName}`,
      details: `Electronic POD stamp & signature verified. Document: ${podFileName}`
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        shipment: {
          ...activeShipment,
          shipmentStatus: 'POD_CONFIRMED',
          podStatus: 'CONFIRMED',
          podReceiverName: podReceiver,
          podDeliveryDate: podDate,
          podRemarks: podRemarksText,
          podDocName: podFileName,
          activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
        }
      }
    }));

    setShowPodModal(false);
    addAuditLog('Shipment Tracking', `Confirmed POD for ${activeShipment.trackingNumber}`);
    alert(`✔ Proof of Delivery (POD) Confirmed for ${activeShipment.trackingNumber}! Shipment can now be closed.`);
  };

  const handleCloseShipmentSubmit = () => {
    if (!activeShipment) return;
    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Closed',
      actor: 'System / Authorized User',
      details: 'Logistics lifecycle completed. Shipment archived to Delivery History.'
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        shipment: {
          ...activeShipment,
          shipmentStatus: 'CLOSED',
          activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
        }
      }
    }));

    setShowCloseShipmentModal(false);
    addAuditLog('Shipment Tracking', `Closed Shipment ${activeShipment.trackingNumber}`);
    alert(`✔ Shipment ${activeShipment.trackingNumber} CLOSED!\n\nMoved from Active Dispatches to Delivery History.`);
    setViewMode('LIST');
    setActiveTabLocal('DELIVERY_HISTORY');
  };

  const isManufacturer = currentRole === 'SUPPLIER';

  // ERROR / NOT FOUND SCREEN
  if (viewMode === 'NOT_FOUND') {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 32, margin: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <AlertTriangle size={48} style={{ color: '#DC2626' }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Shipment Not Found</h2>
        <div style={{ fontSize: 14, color: '#475569', background: '#F8FAFC', padding: '10px 16px', borderRadius: 6, border: '1px solid #E2E8F0', fontFamily: 'monospace' }}>
          Tracking / Shipment ID Parameter: <strong>{notFoundTarget}</strong>
        </div>
        <button
          onClick={() => { setViewMode('LIST'); setActiveTabLocal('ACTIVE_SHIPMENTS'); }}
          style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeft size={16} /> Back to Active Dispatches
        </button>
      </div>
    );
  }

  // DEDICATED FULL SHIPMENT DETAIL PAGE (FULL-PAGE VIEW)
  if (viewMode === 'DETAIL' && activeShipment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>
        
        {/* Top Breadcrumb Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '14px 20px', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748B' }}>
            <button onClick={() => setViewMode('LIST')} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
              <ArrowLeft size={15} /> Back to Active Dispatches
            </button>
            <span>/</span>
            <span style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{activeShipment.trackingNumber}</span>
          </div>

          <span style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 12px', borderRadius: 4, background: activeShipment.shipmentStatus === 'CLOSED' ? '#DCFCE7' : '#FEF3C7', color: activeShipment.shipmentStatus === 'CLOSED' ? '#15803D' : '#B45309', border: '1px solid #CBD5E1' }}>
            STATUS: {activeShipment.shipmentStatus.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Detailed Logistics Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                COLD-CHAIN SHIPMENT INSPECTOR
              </div>
              <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                SHIPMENT TRACKING #{activeShipment.trackingNumber}
              </h1>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                Consignee: <strong style={{ color: '#0F172A' }}>{activeShipment.customerName}</strong> | Dispatcher: <strong style={{ color: '#0F766E' }}>{activeShipment.manufacturerName}</strong>
              </div>
            </div>

            {/* Sequential Logistics Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeShipment.shipmentStatus === 'DISPATCHED' && (
                <button onClick={handleStartInTransit} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Mark In Transit →
                </button>
              )}

              {activeShipment.shipmentStatus === 'IN_TRANSIT' && (
                <button onClick={handleMarkOutForDelivery} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Mark Out For Delivery →
                </button>
              )}

              {activeShipment.shipmentStatus === 'OUT_FOR_DELIVERY' && (
                <button onClick={() => setShowConfirmDeliveryModal(true)} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Confirm Delivery →
                </button>
              )}

              {activeShipment.shipmentStatus === 'DELIVERED' && (
                <button onClick={() => setShowPodModal(true)} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Upload & Confirm POD →
                </button>
              )}

              {activeShipment.shipmentStatus === 'POD_CONFIRMED' && (
                <button onClick={() => setShowCloseShipmentModal(true)} style={{ padding: '10px 22px', borderRadius: 8, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Close Shipment →
                </button>
              )}

              {activeShipment.shipmentStatus === 'CLOSED' && (
                <span style={{ fontSize: 13, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '8px 16px', borderRadius: 8, border: '1px solid #86EFAC' }}>
                  ✓ Shipment Lifecycle Closed
                </span>
              )}
            </div>
          </div>

          {/* Stored Logistics Information Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, fontSize: 13, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Master Order:</span>
              <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>{activeShipment.masterOrderNumber}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Sub-Order:</span>
              <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeShipment.subOrderNumber}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Purchase Order:</span>
              <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeShipment.poNumber}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Order Quantity:</span>
              <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>{formatNumber(activeShipment.totalQuantity)} Units</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Transporter / Logistics:</span>
              <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{activeShipment.transporterName}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Vehicle Number:</span>
              <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeShipment.vehicleNumber}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Driver Details:</span>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{activeShipment.driverName} ({activeShipment.driverPhone})</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Dispatch / Delivery Dates:</span>
              <div style={{ fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>{activeShipment.dispatchDate} → {activeShipment.expectedDeliveryDate}</div>
            </div>
          </div>
        </div>

        {/* LOGISTICS LIFECYCLE STEPPER TIMELINE (6 STEPS) */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 14 }}>
            LOGISTICS LIFECYCLE STAGE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, fontSize: 11.5 }}>
            {[
              { label: 'Dispatched', step: 1 },
              { label: 'In Transit', step: 2 },
              { label: 'Out For Delivery', step: 3 },
              { label: 'Delivered', step: 4 },
              { label: 'POD Confirmed', step: 5 },
              { label: 'Closed', step: 6 }
            ].map(step => {
              const isDone = currentStepIdx >= step.step;
              const isCurrent = currentStepIdx === step.step;
              return (
                <div key={step.step} style={{ background: isCurrent ? '#F0FDFA' : isDone ? '#F8FAFC' : '#F1F5F9', border: isCurrent ? '2px solid #0F766E' : isDone ? '1px solid #86EFAC' : '1px solid #E2E8F0', borderRadius: 8, padding: 10, opacity: isDone ? 1 : 0.4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? '#0F766E' : isDone ? '#16A34A' : '#64748B' }}>STEP 0{step.step}</span>
                    {isDone ? <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span> : <span style={{ color: '#94A3B8' }}>○</span>}
                  </div>
                  <div style={{ fontWeight: isCurrent || isDone ? 800 : 500, color: isCurrent ? '#0F766E' : isDone ? '#0F172A' : '#64748B', marginTop: 4 }}>
                    {step.label} {isCurrent ? '[CURRENT]' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROOF OF DELIVERY CARD (VISIBLE IF DELIVERED, POD_CONFIRMED, OR CLOSED) */}
        {(activeShipment.shipmentStatus === 'DELIVERED' || activeShipment.shipmentStatus === 'POD_CONFIRMED' || activeShipment.shipmentStatus === 'CLOSED') && (
          <div style={{ background: '#FFFFFF', border: '1px solid #99F6E4', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} /> PROOF OF DELIVERY (POD) DOCUMENT & RECEIPT
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12.5, background: '#F0FDFA', padding: 14, borderRadius: 8, border: '1px solid #CCFBF1' }}>
              <div>Received By: <strong style={{ color: '#0F172A' }}>{activeShipment.podReceiverName || 'Dr. Vikas Sharma'}</strong></div>
              <div>Delivery Date: <strong>{activeShipment.actualDeliveryDate || activeShipment.expectedDeliveryDate}</strong></div>
              <div>POD Status: <strong style={{ color: activeShipment.podStatus === 'CONFIRMED' ? '#16A34A' : '#D97706' }}>{activeShipment.podStatus || 'PENDING'}</strong></div>
              <div>POD File: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{activeShipment.podDocName || 'POD_STAMP_SIGNED.pdf'}</strong></div>
            </div>

            {activeShipment.podRemarks && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#334155' }}>
                <strong>Consignee Remarks:</strong> {activeShipment.podRemarks}
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY AUDIT TRAIL */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>
            <Activity size={18} style={{ color: '#0F766E' }} />
            <span>SHIPMENT ACTIVITY AUDIT TRAIL</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeShipment.activityHistory?.map((act: any, idx: number) => (
              <div key={act.id || idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                    ✓ {act.eventTitle}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{act.timestamp}</span>
                </div>
                <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>
                  By: <strong style={{ color: '#1E293B' }}>{act.actor}</strong>
                </div>
                {act.details && (
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{act.details}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modals Container */}
        {showConfirmDeliveryModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowConfirmDeliveryModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Delivery</h3>
                <button onClick={() => setShowConfirmDeliveryModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleConfirmDeliverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  <button type="button" onClick={() => setShowConfirmDeliveryModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm Delivery →</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPodModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowPodModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Proof of Delivery (POD)</h3>
                <button onClick={() => setShowPodModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleConfirmPodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Receiver Name *</label>
                  <input type="text" required value={podReceiver} onChange={e => setPodReceiver(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Date *</label>
                  <input type="date" required value={podDate} onChange={e => setPodDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>POD Document Name</label>
                  <input type="text" value={podFileName} onChange={e => setPodFileName(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Remarks</label>
                  <textarea rows={2} value={podRemarksText} onChange={e => setPodRemarksText(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setShowPodModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm POD →</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCloseShipmentModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCloseShipmentModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Close Shipment?</h3>
                <button onClick={() => setShowCloseShipmentModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
                Delivery and Proof of Delivery (POD) have been confirmed. Closing this shipment will complete the logistics lifecycle and archive the record to Delivery History.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowCloseShipmentModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={handleCloseShipmentSubmit} style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#166534', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Close Shipment →</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // LIST / QUEUE MAIN VIEW
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* TOP COMMAND HEADER */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '18px 24px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pharma Cold-Chain Logistics & Dispatch Control
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
            DISPATCH & TRACKING CONTROL DESK
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Dedicated logistics & shipment management (Starts at Dispatched when production reaches Ready To Dispatch)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '6px 14px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6, fontSize: 12, color: '#0F766E', fontWeight: 700 }}>
            Cold-Chain Telemetry: <strong style={{ color: '#16A34A' }}>2.0°C – 8.0°C Active ✓</strong>
          </div>
          {isManufacturer && (
            <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('CREATE_SHIPMENT'); }} style={{ height: 36, padding: '0 16px', background: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              + Create Dispatch
            </button>
          )}
        </div>
      </div>

      {/* SUB NAVIGATION TABS */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, display: 'flex', borderBottom: 'none', overflow: 'hidden' }}>
        <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('ACTIVE_SHIPMENTS'); }} style={{ padding: '12px 20px', border: 'none', background: activeTabLocal === 'ACTIVE_SHIPMENTS' ? '#0F766E' : 'transparent', color: activeTabLocal === 'ACTIVE_SHIPMENTS' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
          Active Dispatches ({activeDispatchesList.length})
        </button>
        {isManufacturer && (
          <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('CREATE_SHIPMENT'); }} style={{ padding: '12px 20px', border: 'none', background: activeTabLocal === 'CREATE_SHIPMENT' ? '#0F766E' : 'transparent', color: activeTabLocal === 'CREATE_SHIPMENT' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
            + Create Shipment Form
          </button>
        )}
        <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('DELIVERY_HISTORY'); }} style={{ padding: '12px 20px', border: 'none', background: activeTabLocal === 'DELIVERY_HISTORY' ? '#0F766E' : 'transparent', color: activeTabLocal === 'DELIVERY_HISTORY' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
          Delivery History ({deliveryHistoryList.length})
        </button>
        <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('POD_VIEW'); }} style={{ padding: '12px 20px', border: 'none', background: activeTabLocal === 'POD_VIEW' ? '#0F766E' : 'transparent', color: activeTabLocal === 'POD_VIEW' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
          Proof of Delivery (POD)
        </button>
      </div>

      {/* ACTIVE DISPATCHES LIST QUEUE */}
      {activeTabLocal === 'ACTIVE_SHIPMENTS' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
            ACTIVE DISPATCHES QUEUE ({activeDispatchesList.length})
          </div>

          {activeDispatchesList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13.5, color: '#64748B', fontWeight: 600, background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8 }}>
              No active shipments in transit. When a Sub-Order reaches "Ready To Dispatch", click "+ Create Dispatch" to initiate shipment creation.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: 12 }}>TRACKING #</th>
                    <th style={{ padding: 12 }}>SUB-ORDER</th>
                    <th style={{ padding: 12 }}>CUSTOMER</th>
                    <th style={{ padding: 12 }}>TRANSPORTER</th>
                    <th style={{ padding: 12 }}>VEHICLE #</th>
                    <th style={{ padding: 12 }}>DISPATCH DATE</th>
                    <th style={{ padding: 12 }}>EXPECTED DELIVERY</th>
                    <th style={{ padding: 12 }}>STATUS</th>
                    <th style={{ padding: 12, textAlign: 'right', paddingRight: 16 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDispatchesList.map((shp: any) => (
                    <tr
                      key={shp.id}
                      onClick={() => handleOpenSpecificShipment(shp.id, shp.trackingNumber)}
                      style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      <td style={{ padding: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                        {shp.trackingNumber}
                      </td>
                      <td style={{ padding: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                        {shp.subOrderNumber}
                      </td>
                      <td style={{ padding: 12, fontWeight: 700, color: '#0F172A' }}>
                        {shp.customerName}
                      </td>
                      <td style={{ padding: 12, color: '#334155' }}>
                        {shp.transporterName}
                      </td>
                      <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                        {shp.vehicleNumber}
                      </td>
                      <td style={{ padding: 12, color: '#64748B' }}>
                        {shp.dispatchDate}
                      </td>
                      <td style={{ padding: 12, fontWeight: 700, color: '#1D4ED8' }}>
                        {shp.expectedDeliveryDate}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #CBD5E1' }}>
                          {shp.shipmentStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', paddingRight: 16 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSpecificShipment(shp.id, shp.trackingNumber);
                          }}
                          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          View Shipment →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE SHIPMENT FORM */}
      {activeTabLocal === 'CREATE_SHIPMENT' && isManufacturer && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Create Cold-Chain Dispatch Request</h2>

          {/* Validation Check: Must be READY_TO_DISPATCH */}
          {activeSubOrder?.productionStatus !== 'READY_TO_DISPATCH' ? (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: 20, color: '#991B1B' }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={18} color="#DC2626" /> Shipment Cannot Be Created Yet
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <strong>Production must reach Ready To Dispatch before a shipment can be created.</strong>
                <br />
                Sub-Order <strong>{activeSubOrder.subOrderNumber}</strong> is currently at manufacturing stage: <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#991B1B' }}>{(activeSubOrder?.productionStatus || 'PO_ACCEPTED').replace(/_/g, ' ')}</span>.
                <br />
                Please navigate to <strong>Production Planning</strong> to complete production run, quality control inspection, and packaging.
              </div>
            </div>
          ) : activeSubOrder?.shipment && activeSubOrder.shipment.shipmentStatus !== 'CLOSED' ? (
            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={18} color="#D97706" /> Active Shipment Already Created
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
                Sub-Order <strong>{activeSubOrder.subOrderNumber}</strong> already has an active tracking record (Tracking #: <strong style={{ fontFamily: 'monospace' }}>{activeSubOrder.shipment.trackingNumber}</strong>, Status: <strong>{activeSubOrder.shipment.shipmentStatus.replace(/_/g, ' ')}</strong>).
                <br />
                Duplicate shipments cannot be created for the same active sub-order.
              </p>
              <div>
                <button
                  onClick={() => handleOpenSpecificShipment(activeSubOrder.shipment.id, activeSubOrder.shipment.trackingNumber)}
                  style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  View Active Shipment →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateShipmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Order Summary Box */}
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 16, fontSize: 12.5, color: '#0F766E', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>Sub-Order: <strong>{activeSubOrder.subOrderNumber}</strong></div>
                <div>PO Ref: <strong>{activeSubOrder.poNumber}</strong></div>
                <div>Customer: <strong>{activeSubOrder.customerName}</strong></div>
                <div>Manufacturer: <strong>{myMfgName}</strong></div>
                <div>Quantity: <strong>{formatNumber(activeSubOrder.totalQuantity)} Units</strong></div>
                <div>Production Status: <strong style={{ color: '#16A34A' }}>READY TO DISPATCH ✓</strong></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Logistics Transporter *</label>
                  <select
                    value={transporterSelect}
                    onChange={e => setTransporterSelect(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                  >
                    <option value="ColdEx Logistics Telemetry Fleet">ColdEx Logistics Telemetry Fleet</option>
                    <option value="BlueDart Healthcare Logistics">BlueDart Healthcare Logistics</option>
                    <option value="Delhivery Pharma Express">Delhivery Pharma Express</option>
                    <option value="Other">Other Transporter...</option>
                  </select>

                  {transporterSelect === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom transporter name"
                      required
                      value={customTransporter}
                      onChange={e => setCustomTransporter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, marginTop: 8 }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Driver Phone (10-Digit) *</label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Auto-Generated Tracking #</label>
                  <input
                    type="text"
                    readOnly
                    value={autoTrackingNo}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', background: '#F8FAFC', fontWeight: 800, color: '#0F766E' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={dispDate}
                    onChange={e => {
                      setDispDate(e.target.value);
                      setExpectedDeliveryDate(calcDeliveryDate(e.target.value));
                    }}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Expected Delivery Date (Auto-Calculated)</label>
                  <input
                    type="date"
                    readOnly
                    value={expectedDeliveryDate}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#F8FAFC', fontWeight: 700, color: '#1D4ED8' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
                >
                  Mark Dispatched & Create Shipment →
                </button>
              </div>

            </form>
          )}
        </div>
      )}

      {/* DELIVERY HISTORY TAB */}
      {activeTabLocal === 'DELIVERY_HISTORY' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Completed Delivery Records & Logistics Archive</h2>

          {deliveryHistoryList.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13.5, color: '#64748B', fontWeight: 600, background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8 }}>
              No completed deliveries yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: 12 }}>TRACKING #</th>
                    <th style={{ padding: 12 }}>SUB-ORDER</th>
                    <th style={{ padding: 12 }}>CUSTOMER</th>
                    <th style={{ padding: 12 }}>MANUFACTURER</th>
                    <th style={{ padding: 12 }}>DISPATCH DATE</th>
                    <th style={{ padding: 12 }}>DELIVERY DATE</th>
                    <th style={{ padding: 12 }}>FINAL STATUS</th>
                    <th style={{ padding: 12 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryHistoryList.map((shp: any) => (
                    <tr key={shp.id} onClick={() => handleOpenSpecificShipment(shp.id, shp.trackingNumber)} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                      <td style={{ padding: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{shp.trackingNumber}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace' }}>{shp.subOrderNumber}</td>
                      <td style={{ padding: 12, fontWeight: 700, color: '#0F172A' }}>{shp.customerName}</td>
                      <td style={{ padding: 12, color: '#475569' }}>{shp.manufacturerName}</td>
                      <td style={{ padding: 12 }}>{shp.dispatchDate}</td>
                      <td style={{ padding: 12 }}>{shp.actualDeliveryDate || shp.expectedDeliveryDate}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>{shp.shipmentStatus}</span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <button onClick={(e) => { e.stopPropagation(); handleOpenSpecificShipment(shp.id, shp.trackingNumber); }} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 800, borderRadius: 4, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}>
                          View Shipment →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROOF OF DELIVERY (POD) TAB */}
      {activeTabLocal === 'POD_VIEW' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Electronic Proof of Delivery (POD) Records</h2>

          {activeClosedShipments.length === 0 && historicalShipments.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13.5, color: '#64748B', fontWeight: 600, background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8 }}>
              No POD records yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {[...activeClosedShipments, ...historicalShipments].map((shp: any) => (
                <div key={shp.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{shp.trackingNumber}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: shp.podStatus === 'CONFIRMED' ? '#DCFCE7' : '#FEF3C7', color: shp.podStatus === 'CONFIRMED' ? '#15803D' : '#B45309' }}>
                      POD {shp.podStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#0F172A' }}>Sub-Order: <strong>{shp.subOrderNumber}</strong> · Customer: <strong>{shp.customerName}</strong></div>
                  
                  <button onClick={() => handleOpenSpecificShipment(shp.id, shp.trackingNumber)} style={{ padding: '8px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                    View Shipment →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
