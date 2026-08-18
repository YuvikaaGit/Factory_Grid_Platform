import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber, UNIFIED_STORAGE_KEY } from './ProductionExecutionModule';
import { Invoice, InvoiceStatus } from '../../types';
import {
  Truck, Navigation, Thermometer, ShieldCheck, Clock, MapPin,
  CheckCircle2, FileText, Upload, RefreshCw, AlertTriangle, Phone,
  ChevronRight, ArrowRight, Download, RotateCcw, Check, User, Plus, X,
  Layers, Package, AlertCircle, File, MoreVertical, Activity, ArrowLeft, XCircle,
  Receipt, DollarSign, Send, Printer, CreditCard
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
  const { currentRole, addAuditLog, manufacturers, invoices, addInvoice, recordInvoicePayment, updateInvoiceStatus, setActiveTab, orders } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';

  // Dynamic Sub-Orders Store Synced with AppContext Master Orders
  const syncSubOrdersWithContext = (saved: any) => {
    const store: Record<string, any> = { ...(saved || {}) };

    if (!store['SO-1001-01']) {
      store['SO-1001-01'] = {
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
      };
    }

    if (Array.isArray(orders)) {
      orders.forEach(mo => {
        if (Array.isArray(mo.subOrders)) {
          mo.subOrders.forEach(so => {
            const subNum = so.subOrderNumber;
            if (subNum && !store[subNum]) {
              store[subNum] = {
                subOrderNumber: subNum,
                poNumber: `PO-${subNum}`,
                masterOrderNumber: mo.orderNumber,
                customerName: mo.customerName,
                manufacturerName: so.manufacturerName || myMfgName,
                productName: so.lines?.[0]?.productName || 'Pharmaceutical Product',
                totalQuantity: so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 10000,
                orderValue: so.totalAmount || 150000,
                productionStatus: 'PO_ACCEPTED',
                shipment: null,
                invoice: null
              };
            }
          });
        }
      });
    }

    return store;
  };

  const getInitialStore = () => {
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return syncSubOrdersWithContext(parsed);
    } catch (e) {
      console.error('Failed to parse unified suborders store', e);
      return syncSubOrdersWithContext({});
    }
  };

  const [subOrdersStore, setSubOrdersStore] = useState<Record<string, any>>(getInitialStore);

  const [selectedSubOrderCode, setSelectedSubOrderCode] = useState<string>(() => {
    try {
      const target = localStorage.getItem('factorygrid_target_suborder');
      if (target) return target;
    } catch (e) {}
    const keys = Object.keys(getInitialStore());
    return keys[keys.length - 1] || 'SO-1001-01';
  });

  const [activeTabLocal, setActiveTabLocal] = useState<'ACTIVE_SHIPMENTS' | 'CREATE_SHIPMENT' | 'DELIVERY_HISTORY' | 'POD_VIEW'>('ACTIVE_SHIPMENTS');

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
        const parsed = saved ? JSON.parse(saved) : {};
        const merged = syncSubOrdersWithContext(parsed);
        setSubOrdersStore(merged);

        const target = localStorage.getItem('factorygrid_target_suborder');
        if (target && merged[target]) {
          setSelectedSubOrderCode(target);
        } else if (!merged[selectedSubOrderCode]) {
          const keys = Object.keys(merged);
          if (keys.length > 0) setSelectedSubOrderCode(keys[keys.length - 1]);
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
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(subOrdersStore));
    } catch (e) {
      console.error(e);
    }
  }, [subOrdersStore]);

  // VIEW MODE STATE: 'LIST' | 'DETAIL' | 'NOT_FOUND'
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL' | 'NOT_FOUND'>('LIST');
  const [notFoundTarget, setNotFoundTarget] = useState<string>('');

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
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [delivReceiver, setDelivReceiver] = useState('');
  const [delivDate, setDelivDate] = useState(todayDateStr);
  const [delivRemarks, setDelivRemarks] = useState('');

  const [podReceiver, setPodReceiver] = useState('');
  const [podDate, setPodDate] = useState(todayDateStr);
  const [podRemarksText, setPodRemarksText] = useState('');
  const [selectedPodFile, setSelectedPodFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const podFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenConfirmDeliveryModal = () => {
    if (activeShipment) {
      setDelivReceiver(activeShipment.podReceiverName || `${activeShipment.customerName} Receiving Officer`);
      setDelivDate(activeShipment.actualDeliveryDate || todayDateStr);
      setDelivRemarks(activeShipment.podRemarks || '');
    } else {
      setDelivReceiver('');
      setDelivDate(todayDateStr);
      setDelivRemarks('');
    }
    setShowConfirmDeliveryModal(true);
  };

  const handleOpenPodModal = () => {
    if (activeShipment) {
      setPodReceiver(activeShipment.podReceiverName || `${activeShipment.customerName} Receiving Officer`);
      setPodDate(activeShipment.podDeliveryDate || activeShipment.actualDeliveryDate || todayDateStr);
      setPodRemarksText(activeShipment.podRemarks || '');
      if (activeShipment.podDocName) {
        setSelectedPodFile({
          name: activeShipment.podDocName,
          size: activeShipment.podFileSize || '2.4 MB',
          type: activeShipment.podFileType || 'PDF'
        });
      } else {
        setSelectedPodFile(null);
      }
    } else {
      setPodReceiver('');
      setPodDate(todayDateStr);
      setPodRemarksText('');
      setSelectedPodFile(null);
    }
    setShowPodModal(true);
  };

  const handlePodFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('⚠ File Size Exceeds Limit!\n\nMaximum allowed file size for Proof of Delivery is 10 MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      alert('⚠ Invalid File Format!\n\nOnly PDF, JPG, JPEG, and PNG files are supported for Proof of Delivery.');
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setSelectedPodFile({
      name: file.name,
      size: sizeFormatted,
      type: ext.toUpperCase()
    });
  };

  // Robust Sub-Order Record Resolution (NEVER fall back to old completed state for a new order)
  const activeSubOrder = subOrdersStore[selectedSubOrderCode] || {
    subOrderNumber: selectedSubOrderCode,
    poNumber: `PO-${selectedSubOrderCode}`,
    masterOrderNumber: 'MO-2026-1002',
    customerName: 'B2B Client Partner',
    manufacturerName: myMfgName,
    productName: 'Pharmaceutical Products',
    totalQuantity: 10000,
    productionStatus: 'PO_ACCEPTED',
    shipment: null,
    invoice: null
  };
  const activeShipment = activeSubOrder?.shipment;

  const activeInvoice: Invoice | null = activeSubOrder?.invoice || invoices.find((inv: Invoice) => 
    inv.subOrderNumber === activeSubOrder?.subOrderNumber || 
    (inv.orderNumber === activeSubOrder?.masterOrderNumber && inv.subOrderId === activeSubOrder?.id)
  ) || null;

  // Invoice Modal Controls State
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState<boolean>(false);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState<boolean>(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<boolean>(false);
  const [targetInvoiceForModal, setTargetInvoiceForModal] = useState<Invoice | null>(null);

  // Form States for Generate Invoice
  const [genInvNumber, setGenInvNumber] = useState<string>('');
  const [genInvDate, setGenInvDate] = useState<string>('');
  const [genDueDate, setGenDueDate] = useState<string>('');
  const [genMasterOrder, setGenMasterOrder] = useState<string>('');
  const [genSubOrder, setGenSubOrder] = useState<string>('');
  const [genCustomerName, setGenCustomerName] = useState<string>('');
  const [genMfgName, setGenMfgName] = useState<string>('');
  const [genProductName, setGenProductName] = useState<string>('');
  const [genQty, setGenQty] = useState<number>(12000);
  const [genUnitPrice, setGenUnitPrice] = useState<number>(16.28);
  const [genTaxPercent, setGenTaxPercent] = useState<number>(12);
  const [genFreight, setGenFreight] = useState<number>(0);
  const [genHsn, setGenHsn] = useState<string>('30049099');

  // Form States for Record Payment
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentMethodSelect, setPaymentMethodSelect] = useState<string>('RTGS');
  const [paymentRefInput, setPaymentRefInput] = useState<string>('');

  const getEffectiveInvoiceStatus = (inv: Invoice): InvoiceStatus => {
    if (inv.balanceAmount <= 0) return 'PAID';
    if (inv.paidAmount > 0) return 'PARTIAL_PAYMENT';
    const today = new Date().toISOString().split('T')[0];
    if (inv.dueDate && inv.dueDate < today) return 'OVERDUE';
    return inv.status || 'OPEN';
  };

  const renderInvoiceStatusChip = (inv: Invoice | null) => {
    if (!inv) return null;
    const status = getEffectiveInvoiceStatus(inv);
    if (status === 'PAID') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> Paid
        </span>
      );
    }
    if (status === 'PARTIAL_PAYMENT') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} /> Partial Payment
        </span>
      );
    }
    if (status === 'OVERDUE') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> Overdue
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} /> Open
      </span>
    );
  };

  const handleOpenGenerateInvoiceModal = () => {
    if (!activeShipment) {
      alert('⚠ Shipment Required!\n\nPlease dispatch the shipment first before generating an invoice.');
      return;
    }

    const isEligible = ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment.shipmentStatus);
    if (!isEligible) {
      alert('⚠ Shipment Must Be Dispatched or Delivered!\n\nInvoice generation is available after the shipment has reached Dispatched or Delivered stage.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueStr = due.toISOString().split('T')[0];

    const totalQty = activeSubOrder.totalQuantity || 12000;
    const totalVal = activeSubOrder.orderValue || 195300;
    const unitP = Math.round((totalVal / totalQty) * 100) / 100 || 16.28;

    setGenInvNumber(`INV-2026-${Math.floor(4420 + Math.random() * 500)}`);
    setGenInvDate(todayStr);
    setGenDueDate(dueStr);
    setGenMasterOrder(activeSubOrder.masterOrderNumber || 'MO-2026-1001');
    setGenSubOrder(activeSubOrder.subOrderNumber || 'SO-1001-01');
    setGenCustomerName(activeSubOrder.customerName || 'Apex Pharma PCD Franchise');
    setGenMfgName(activeSubOrder.manufacturerName || myMfgName);
    setGenProductName(activeSubOrder.productName || 'Paracetamol 500mg & Azithromycin 500mg Tablets');
    setGenQty(totalQty);
    setGenUnitPrice(unitP);
    setGenTaxPercent(12);
    setGenFreight(0);
    setGenHsn('30049099');

    setShowGenerateInvoiceModal(true);
  };

  const handleGenerateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subtotal = Math.round(genQty * genUnitPrice);
    const taxTotal = Math.round(subtotal * (genTaxPercent / 100));
    const grandTotal = Math.round(subtotal + taxTotal + Number(genFreight || 0));

    const newInvoiceObj: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: genInvNumber,
      masterOrderId: activeSubOrder.masterOrderId || 'mo_1001',
      orderNumber: genMasterOrder,
      subOrderId: activeSubOrder.id || 'so_1001_01',
      subOrderNumber: genSubOrder,
      customerId: activeSubOrder.customerId || 'c1',
      customerName: genCustomerName,
      customerCode: 'CUS000101',
      manufacturerId: myMfg?.id || 'mfg_001',
      manufacturerName: genMfgName,
      invoiceDate: genInvDate,
      dueDate: genDueDate,
      subtotal: subtotal,
      taxTotal: taxTotal,
      totalAmount: grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      status: 'OPEN',
      lines: [
        {
          id: `il_${Date.now()}`,
          productId: 'p1',
          productName: genProductName,
          hsnCode: genHsn,
          quantity: genQty,
          unitPrice: genUnitPrice,
          taxAmount: taxTotal,
          totalAmount: subtotal + taxTotal
        }
      ],
      sentToCustomer: false
    };

    addInvoice(newInvoiceObj);

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        invoice: newInvoiceObj
      }
    }));

    addAuditLog('Invoice Engine', `Generated B2B Tax Invoice ${genInvNumber} for Sub-Order ${genSubOrder} (Total ₹${grandTotal.toLocaleString()})`);

    setShowGenerateInvoiceModal(false);
    setTargetInvoiceForModal(newInvoiceObj);
    setShowViewInvoiceModal(true);

    alert(`✔ B2B Tax Invoice ${genInvNumber} Generated Successfully!\n\nGrand Total: ₹${grandTotal.toLocaleString()}\nAccounts Receivable (AR) record created and linked to Sub-Order ${genSubOrder}.`);
  };

  const handleSendInvoiceToCustomer = (invObj: Invoice) => {
    const updatedInv = {
      ...invObj,
      sentToCustomer: true,
      sentAt: new Date().toLocaleString()
    };

    addInvoice(updatedInv);

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        invoice: updatedInv
      }
    }));

    setTargetInvoiceForModal(updatedInv);

    addAuditLog('Invoice Engine', `Sent Tax Invoice ${invObj.invoiceNumber} to Customer ${invObj.customerName}`);

    alert(`✔ Tax Invoice ${invObj.invoiceNumber} Sent to Customer!\n\nCustomer: ${invObj.customerName}\nNotification & Digital Copy dispatched.`);
  };

  const handleDownloadPdf = (invObj: Invoice) => {
    addAuditLog('Invoice Engine', `Downloaded PDF for Tax Invoice ${invObj.invoiceNumber}`);
    alert(`📄 Downloading B2B Tax Invoice PDF...\n\nFilename: ${invObj.invoiceNumber}.pdf\nOrder Ref: ${invObj.orderNumber} / ${invObj.subOrderNumber || ''}\nTotal Amount: ₹${invObj.totalAmount.toLocaleString()}`);
  };

  const handleOpenRecordPaymentModal = (invObj: Invoice) => {
    setTargetInvoiceForModal(invObj);
    setPaymentAmountInput(invObj.balanceAmount);
    setPaymentMethodSelect('RTGS');
    setPaymentRefInput(`RTGS-HDFC-${Math.floor(100000 + Math.random() * 899999)}`);
    setShowRecordPaymentModal(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForModal) return;

    const amt = Number(paymentAmountInput);
    if (amt <= 0) {
      alert('⚠ Invalid Payment Amount!');
      return;
    }

    recordInvoicePayment(targetInvoiceForModal.id, amt, paymentMethodSelect, paymentRefInput);

    const newPaid = (targetInvoiceForModal.paidAmount || 0) + amt;
    const newBal = targetInvoiceForModal.totalAmount - newPaid;
    const newStatus: InvoiceStatus = newBal <= 0 ? 'PAID' : 'PARTIAL_PAYMENT';

    const updatedInv: Invoice = {
      ...targetInvoiceForModal,
      paidAmount: newPaid,
      balanceAmount: Math.max(0, newBal),
      status: newStatus
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        invoice: updatedInv
      }
    }));

    setTargetInvoiceForModal(updatedInv);
    setShowRecordPaymentModal(false);

    alert(`✔ Payment Entry Submitted!\n\nInvoice: ${targetInvoiceForModal.invoiceNumber}\nAmount Paid: ₹${amt.toLocaleString()}\nMethod: ${paymentMethodSelect}\nUTR / Ref #: ${paymentRefInput}\nNew Status: ${newStatus.replace(/_/g, ' ')}\n\nAccounts Receivable updated successfully.`);
  };

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

  // Synchronous Store Saver & Storage Event Dispatcher
  const saveAndSyncStore = (newStore: Record<string, any>) => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(newStore));
    } catch (e) {
      console.error('Failed to write suborders store to localStorage', e);
    }
    setSubOrdersStore(newStore);
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to dispatch storage event', e);
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

    const updatedStore = {
      ...subOrdersStore,
      [selectedSubOrderCode]: {
        ...subOrdersStore[selectedSubOrderCode],
        shipment: newShipmentObj
      }
    };

    saveAndSyncStore(updatedStore);
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
    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    console.log('[MARK IN TRANSIT] Target code:', targetCode, 'Current status:', activeShipment.shipmentStatus);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Entered In Transit',
      actor: activeShipment.transporterName || 'Logistics Partner',
      details: `Shipment ${activeShipment.trackingNumber} entered transit route via vehicle ${activeShipment.vehicleNumber}`
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'IN_TRANSIT' as ShipmentStatus,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    addAuditLog('Shipment Tracking', `Updated ${activeShipment.trackingNumber} status to IN TRANSIT`);
    alert(`✔ Shipment ${activeShipment.trackingNumber} is now IN TRANSIT.`);
  };

  const handleMarkOutForDelivery = () => {
    if (!activeShipment) return;
    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    console.log('[MARK OUT FOR DELIVERY] Target code:', targetCode, 'Current status:', activeShipment.shipmentStatus);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Out for Delivery',
      actor: activeShipment.transporterName || 'Logistics Partner',
      details: `Shipment ${activeShipment.trackingNumber} is out for final mile delivery today`
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'OUT_FOR_DELIVERY' as ShipmentStatus,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    addAuditLog('Shipment Tracking', `Updated ${activeShipment.trackingNumber} status to OUT FOR DELIVERY`);
    alert(`✔ Shipment ${activeShipment.trackingNumber} marked OUT FOR DELIVERY.`);
  };

  const handleConfirmDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    console.log('[CONFIRM DELIVERY SUBMIT] Target code:', targetCode, 'Current status:', activeShipment.shipmentStatus);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Delivered',
      actor: `Buyer / ${delivReceiver}`,
      details: `Delivery confirmed at consignee facility. Received by ${delivReceiver}. Remarks: ${delivRemarks}`
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'DELIVERED' as ShipmentStatus,
      actualDeliveryDate: delivDate,
      podReceiverName: delivReceiver,
      podDeliveryDate: undefined,
      podRemarks: delivRemarks,
      podStatus: 'PENDING',
      podDocName: undefined,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    setShowConfirmDeliveryModal(false);
    addAuditLog('Shipment Tracking', `Confirmed delivery for ${activeShipment.trackingNumber}. Receiver: ${delivReceiver}`);
    alert(`✔ Delivery Confirmed for ${activeShipment.trackingNumber}!\n\nStatus updated to DELIVERED. Upload & Confirm Proof of Delivery (POD) to proceed.`);
  };

  const handleConfirmPodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    if (!podReceiver.trim()) {
      alert('⚠ Receiver Name is required!');
      return;
    }
    if (!podDate) {
      alert('⚠ Delivery Date is required!');
      return;
    }
    if (!selectedPodFile && !activeShipment.podDocName) {
      alert('⚠ Please upload an actual Proof of Delivery (POD) document!');
      return;
    }

    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    const docName = selectedPodFile?.name || activeShipment.podDocName || `POD_SIGNED_${targetCode}.pdf`;
    const docSize = selectedPodFile?.size || activeShipment.podFileSize || '2.4 MB';
    const docType = selectedPodFile?.type || activeShipment.podFileType || 'PDF';

    console.log('[CONFIRM POD SUBMIT] Target code:', targetCode, 'Document:', docName);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Proof of Delivery (POD) Confirmed',
      actor: `Buyer / ${activeShipment.customerName}`,
      details: `Electronic POD stamp & signature verified. Uploaded Document: ${docName} (${docType} • ${docSize})`
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'POD_CONFIRMED' as ShipmentStatus,
      podStatus: 'CONFIRMED',
      podReceiverName: podReceiver.trim(),
      podDeliveryDate: podDate,
      podRemarks: podRemarksText.trim(),
      podDocName: docName,
      podFileSize: docSize,
      podFileType: docType,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    setShowPodModal(false);
    addAuditLog('Shipment Tracking', `Confirmed POD for ${activeShipment.trackingNumber}. File: ${docName}`);
    alert(`✔ Proof of Delivery (POD) Confirmed for ${activeShipment.trackingNumber}!\n\nUploaded File: ${docName}\nReceiver: ${podReceiver}\nStatus updated to POD CONFIRMED. Shipment can now be closed.`);
  };

  const handleCloseShipmentSubmit = () => {
    if (!activeShipment) return;
    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    console.log('[CLOSE SHIPMENT SUBMIT] Target code:', targetCode, 'Current status:', activeShipment.shipmentStatus);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Closed',
      actor: 'System / Authorized User',
      details: 'Logistics lifecycle completed. Shipment archived to Delivery History.'
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'CLOSED' as ShipmentStatus,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    setShowCloseShipmentModal(false);
    addAuditLog('Shipment Tracking', `Closed Shipment ${activeShipment.trackingNumber}`);
    alert(`✔ Shipment closed successfully after POD confirmation.\n\nShipment ${activeShipment.trackingNumber} archived to Delivery History.`);
    setViewMode('LIST');
    setActiveTabLocal('DELIVERY_HISTORY');
  };

  const isManufacturer = currentRole === 'SUPPLIER';
  const isAccounts = currentRole === 'ACCOUNTS_MANAGER' || currentRole === 'ADMIN';
  const isBuyer = currentRole === 'BUYER';

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
                <button onClick={handleOpenConfirmDeliveryModal} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Confirm Delivery →
                </button>
              )}

              {activeShipment.shipmentStatus === 'DELIVERED' && (
                <button onClick={handleOpenPodModal} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
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

              {/* Quick Invoice Trigger Button */}
              {activeInvoice ? (
                <button
                  onClick={() => { setTargetInvoiceForModal(activeInvoice); setShowViewInvoiceModal(true); }}
                  style={{ padding: '10px 18px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Receipt size={16} /> View Invoice ({activeInvoice.invoiceNumber})
                </button>
              ) : (
                <button
                  onClick={handleOpenGenerateInvoiceModal}
                  disabled={!['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment.shipmentStatus)}
                  style={{
                    padding: '10px 18px', borderRadius: 8,
                    background: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment.shipmentStatus) ? '#2563EB' : '#E2E8F0',
                    color: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment.shipmentStatus) ? '#FFF' : '#94A3B8',
                    border: 'none', fontWeight: 800, fontSize: 13, cursor: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment.shipmentStatus) ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                  title={['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment.shipmentStatus) ? 'Generate B2B Tax Invoice' : 'Invoice generation available after shipment is Dispatched or Delivered'}
                >
                  <Receipt size={16} /> Generate Invoice
                </button>
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
            ].map(st => {
              const isCompleted = currentStepIdx > st.step;
              const isCurrent = currentStepIdx === st.step;
              const isLocked = currentStepIdx < st.step;

              return (
                <div key={st.step} style={{ background: isCurrent ? '#F0FDFA' : isCompleted ? '#F8FAFC' : '#F1F5F9', border: isCurrent ? '2px solid #0F766E' : isCompleted ? '1px solid #86EFAC' : '1px solid #E2E8F0', borderRadius: 8, padding: 10, opacity: isLocked ? 0.55 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? '#0F766E' : isCompleted ? '#16A34A' : '#64748B' }}>STEP 0{st.step}</span>
                    {isCompleted ? <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span> : isCurrent ? <span style={{ color: '#0F766E', fontWeight: 800 }}>●</span> : <span style={{ color: '#94A3B8', fontSize: 10 }}>🔒</span>}
                  </div>
                  <div style={{ fontWeight: isCurrent || isCompleted ? 800 : 500, color: isCurrent ? '#0F766E' : isCompleted ? '#0F172A' : '#64748B', marginTop: 4 }}>
                    {st.label} {isCurrent ? '[CURRENT]' : isLocked ? '[LOCKED]' : ''}
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
              <div>Received By: <strong style={{ color: '#0F172A' }}>{activeShipment.podReceiverName || 'Pending Receiver Confirmation'}</strong></div>
              <div>Delivery Date: <strong>{activeShipment.podDeliveryDate || activeShipment.actualDeliveryDate || 'Pending Delivery'}</strong></div>
              <div>POD Status: <strong style={{ color: activeShipment.podStatus === 'CONFIRMED' ? '#16A34A' : '#D97706' }}>{activeShipment.podStatus === 'CONFIRMED' ? '✓ CONFIRMED' : 'PENDING'}</strong></div>
              <div>POD File: <strong style={{ color: activeShipment.podDocName ? '#0F766E' : '#64748B', fontFamily: 'monospace' }}>{activeShipment.podDocName || 'No Document Uploaded Yet'}</strong></div>
            </div>

            {activeShipment.podRemarks && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#334155' }}>
                <strong>Consignee Remarks:</strong> {activeShipment.podRemarks}
              </div>
            )}

            {/* Stage Action Button inside POD Card */}
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {activeShipment.shipmentStatus === 'DELIVERED' && (
                <button
                  onClick={handleOpenPodModal}
                  style={{ padding: '9px 20px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.2)' }}
                >
                  <FileText size={15} /> Upload & Confirm POD →
                </button>
              )}

              {activeShipment.shipmentStatus === 'POD_CONFIRMED' && (
                <button
                  onClick={() => setShowCloseShipmentModal(true)}
                  style={{ padding: '9px 20px', borderRadius: 8, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(22,101,52,0.2)' }}
                >
                  <CheckCircle2 size={15} /> Close Shipment →
                </button>
              )}

              {activeShipment.shipmentStatus === 'CLOSED' && (
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '6px 14px', borderRadius: 6, border: '1px solid #86EFAC' }}>
                  ✓ Shipment Lifecycle Closed & Archived
                </span>
              )}
            </div>
          </div>
        )}

        {/* BUYER GOODS RECEIPT CONFIRMATION CARD */}
        {activeShipment && (activeShipment.shipmentStatus === 'DELIVERED' || activeShipment.shipmentStatus === 'POD_CONFIRMED' || activeShipment.shipmentStatus === 'CLOSED') && (
          <div style={{ background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#166534', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={16} /> BUYER GOODS RECEIPT CONFIRMATION
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: activeShipment.goodsReceipt ? '#DCFCE7' : '#FEF3C7', color: activeShipment.goodsReceipt ? '#15803D' : '#B45309', border: `1px solid ${activeShipment.goodsReceipt ? '#86EFAC' : '#FDE68A'}` }}>
                {activeShipment.goodsReceipt ? `✓ ${activeShipment.goodsReceipt.status.replace(/_/g, ' ')}` : 'PENDING BUYER CONFIRMATION'}
              </span>
            </div>

            {activeShipment.goodsReceipt ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: 12.5, background: '#F0FDF4', padding: 14, borderRadius: 8, border: '1px solid #BBF7D0' }}>
                  <div>Received Qty: <strong style={{ color: '#166534', fontFamily: 'monospace' }}>{activeShipment.goodsReceipt.receivedQuantity?.toLocaleString()} Units</strong></div>
                  <div>Missing Qty: <strong style={{ color: activeShipment.goodsReceipt.missingQuantity > 0 ? '#DC2626' : '#64748B', fontFamily: 'monospace' }}>{activeShipment.goodsReceipt.missingQuantity?.toLocaleString()} Units</strong></div>
                  <div>Damaged Qty: <strong style={{ color: activeShipment.goodsReceipt.damagedQuantity > 0 ? '#DC2626' : '#64748B', fontFamily: 'monospace' }}>{activeShipment.goodsReceipt.damagedQuantity?.toLocaleString()} Units</strong></div>
                  <div>Condition: <strong>{activeShipment.goodsReceipt.condition}</strong></div>
                  <div>Received Date: <strong>{activeShipment.goodsReceipt.receivedDate}</strong></div>
                  <div>Received By: <strong>{activeShipment.goodsReceipt.receivedBy}</strong></div>
                </div>

                {activeShipment.goodsReceipt.receivingRemarks && (
                  <div style={{ fontSize: 12, color: '#166534', background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #BBF7D0' }}>
                    <strong>Buyer Remarks:</strong> {activeShipment.goodsReceipt.receivingRemarks}
                  </div>
                )}

                {activeShipment.goodsReceipt.grnDocumentName && (
                  <div style={{ fontSize: 12, color: '#0F766E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} /> GRN Document: <strong>{activeShipment.goodsReceipt.grnDocumentName}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#78350F', background: '#FEF3C7', padding: 12, borderRadius: 8, border: '1px solid #FDE68A' }}>
                Goods Receipt is pending buyer physical package verification. {isBuyer ? 'Please navigate to Order Details / Tracking View to confirm Goods Received.' : 'Manufacturer will receive real-time telemetry when Buyer confirms receipt.'}
              </div>
            )}
          </div>
        )}

        {/* FINANCIAL INVOICE & ACCOUNTS RECEIVABLE (AR) CONTROL CARD */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  FINANCIAL INVOICE & ACCOUNTS RECEIVABLE (AR)
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Sub-Order Tax Invoice & Ledger Status
                </h3>
              </div>
            </div>

            {activeInvoice ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {renderInvoiceStatusChip(activeInvoice)}
                <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
                  {activeInvoice.invoiceNumber}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 4, background: '#F1F5F9', color: '#64748B' }}>
                INVOICE NOT GENERATED YET
              </span>
            )}
          </div>

          {activeInvoice ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  Tax Invoice <strong>{activeInvoice.invoiceNumber}</strong> issued on <strong>{activeInvoice.invoiceDate}</strong> (Due: <strong>{activeInvoice.dueDate}</strong>)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setTargetInvoiceForModal(activeInvoice); setShowViewInvoiceModal(true); }}
                    style={{ padding: '8px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <FileText size={14} /> View Invoice
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(activeInvoice)}
                    style={{ padding: '8px 14px', borderRadius: 6, background: '#FFFFFF', color: '#0F766E', border: '1px solid #0F766E', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> Download PDF
                  </button>

                  {isManufacturer && (
                    <button
                      onClick={() => handleSendInvoiceToCustomer(activeInvoice)}
                      style={{ padding: '8px 14px', borderRadius: 6, background: activeInvoice.sentToCustomer ? '#F0FDF4' : '#EFF6FF', color: activeInvoice.sentToCustomer ? '#16A34A' : '#2563EB', border: activeInvoice.sentToCustomer ? '1px solid #BBF7D0' : '1px solid #BFDBFE', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={14} /> {activeInvoice.sentToCustomer ? 'Resend to Customer ✓' : 'Send to Customer'}
                    </button>
                  )}
                </div>
              </div>

              {/* Accounts Receivable (AR) Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Invoice Amount</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{activeInvoice.totalAmount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Received Amount</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{(activeInvoice.paidAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Balance Due</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: activeInvoice.balanceAmount > 0 ? '#D97706' : '#16A34A', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{(activeInvoice.balanceAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Due Date</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>
                    {activeInvoice.dueDate}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Payment Status</span>
                  <div style={{ marginTop: 4 }}>
                    {renderInvoiceStatusChip(activeInvoice)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  {activeInvoice.balanceAmount > 0 ? (
                    isAccounts ? (
                      <button
                        onClick={() => handleOpenRecordPaymentModal(activeInvoice)}
                        style={{ padding: '8px 16px', borderRadius: 6, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={14} /> Record Payment
                      </button>
                    ) : isBuyer ? (
                      <button
                        onClick={() => alert(`Online Payment Gateway:\n\nInitiating secure payment for Invoice ${activeInvoice.invoiceNumber}.\nOutstanding Balance: ₹${activeInvoice.balanceAmount.toLocaleString()}`)}
                        style={{ padding: '8px 16px', borderRadius: 6, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        Pay Now →
                      </button>
                    ) : null
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '6px 12px', borderRadius: 6, border: '1px solid #86EFAC' }}>
                      ✓ Paid in Full
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>No B2B Tax Invoice generated yet for this sub-order.</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  {['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment?.shipmentStatus) ? (
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>Shipment is Dispatched/Delivered. Eligible for instant tax invoice creation.</span>
                  ) : (
                    <span>Invoice generation becomes available after the shipment reaches Dispatched or Delivered stage.</span>
                  )}
                </div>
              </div>

              {isManufacturer && (
                <button
                  onClick={handleOpenGenerateInvoiceModal}
                  disabled={!['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment?.shipmentStatus)}
                  style={{
                    padding: '10px 20px', borderRadius: 8,
                    background: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment?.shipmentStatus) ? '#2563EB' : '#94A3B8',
                    color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment?.shipmentStatus) ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
                  }}
                >
                  <Receipt size={16} /> + Generate Tax Invoice
                </button>
              )}
            </div>
          )}
        </div>

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
        {/* MODAL: GENERATE INVOICE */}
        {showGenerateInvoiceModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowGenerateInvoiceModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={20} style={{ color: '#2563EB' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Generate B2B Tax Invoice</h3>
                </div>
                <button onClick={() => setShowGenerateInvoiceModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleGenerateInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#0F766E', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>Master Order: <strong>{genMasterOrder}</strong></div>
                  <div>Sub-Order: <strong>{genSubOrder}</strong></div>
                  <div>Customer: <strong>{genCustomerName}</strong></div>
                  <div>Manufacturer: <strong>{genMfgName}</strong></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Invoice Number</label>
                    <input type="text" readOnly value={genInvNumber} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: '#2563EB', background: '#F8FAFC' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Invoice Date *</label>
                    <input type="date" required value={genInvDate} onChange={e => setGenInvDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Due Date *</label>
                    <input type="date" required value={genDueDate} onChange={e => setGenDueDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Line Item *</label>
                  <input type="text" required value={genProductName} onChange={e => setGenProductName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>HSN / SAC Code</label>
                    <input type="text" value={genHsn} onChange={e => setGenHsn(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Quantity (Units) *</label>
                    <input type="number" required value={genQty} onChange={e => setGenQty(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Unit Price (₹) *</label>
                    <input type="number" step="0.01" required value={genUnitPrice} onChange={e => setGenUnitPrice(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>GST Rate % *</label>
                    <select value={genTaxPercent} onChange={e => setGenTaxPercent(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}>
                      <option value={12}>12% GST (6% CGST + 6% SGST)</option>
                      <option value={18}>18% GST (9% CGST + 9% SGST)</option>
                      <option value={5}>5% GST</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Subtotal:</span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{Math.round(genQty * genUnitPrice).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>GST ({genTaxPercent}%):</span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{Math.round(genQty * genUnitPrice * (genTaxPercent / 100)).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: 6, marginTop: 2, fontSize: 15, color: '#0F172A' }}>
                    <span>Grand Total:</span>
                    <strong style={{ color: '#2563EB', fontFamily: 'monospace' }}>₹{Math.round((genQty * genUnitPrice * (1 + genTaxPercent / 100)) + Number(genFreight || 0)).toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setShowGenerateInvoiceModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 22px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Generate Tax Invoice & Create AR Record →</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VIEW TAX INVOICE & PDF VIEWER */}
        {showViewInvoiceModal && targetInvoiceForModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowViewInvoiceModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.3)', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '92vh', overflowY: 'auto' }}>
              
              {/* Invoice Toolbar Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={22} style={{ color: '#0F766E' }} />
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      B2B TAX INVOICE — {targetInvoiceForModal.invoiceNumber}
                    </h3>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>Official B2B Pharmaceutical Invoice Document</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleDownloadPdf(targetInvoiceForModal)}
                    style={{ padding: '7px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> Download PDF
                  </button>

                  <button
                    onClick={() => handleSendInvoiceToCustomer(targetInvoiceForModal)}
                    style={{ padding: '7px 14px', borderRadius: 6, background: targetInvoiceForModal.sentToCustomer ? '#F0FDF4' : '#EFF6FF', color: targetInvoiceForModal.sentToCustomer ? '#16A34A' : '#2563EB', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={14} /> {targetInvoiceForModal.sentToCustomer ? 'Sent to Customer ✓' : 'Send to Customer'}
                  </button>

                  <button onClick={() => setShowViewInvoiceModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
              </div>

              {/* Tax Invoice Document Preview Container */}
              <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontSize: 13, color: '#0F172A' }}>
                
                {/* Invoice Letterhead */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F766E', paddingBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0F766E', letterSpacing: '-0.02em' }}>
                      {targetInvoiceForModal.manufacturerName || myMfgName}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                      Plot No. 42-45, EPIP Phase I, Baddi, Himachal Pradesh - 173205
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      GSTIN: <strong>02AAACS1234F1Z9</strong> | Mfg License: <strong>ML-HP-2024-001</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      TAX INVOICE
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: 2 }}>
                      {targetInvoiceForModal.invoiceNumber}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {renderInvoiceStatusChip(targetInvoiceForModal)}
                    </div>
                  </div>
                </div>

                {/* Party Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Billed & Shipped To (Customer)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{targetInvoiceForModal.customerName}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Customer Code: <strong>{targetInvoiceForModal.customerCode || 'CUS000101'}</strong></div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>GSTIN: 27AAACA9876E1Z2 | PAN: AAACA9876E</div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Consignee Facility: Industrial Zone, Phase I, Delhi</div>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Invoice & Order References</div>
                    <div>Master Order #: <strong style={{ fontFamily: 'monospace' }}>{targetInvoiceForModal.orderNumber}</strong></div>
                    <div>Sub-Order #: <strong style={{ fontFamily: 'monospace', color: '#0F766E' }}>{targetInvoiceForModal.subOrderNumber || activeSubOrder.subOrderNumber}</strong></div>
                    <div>Invoice Date: <strong>{targetInvoiceForModal.invoiceDate}</strong></div>
                    <div>Due Date: <strong style={{ color: '#1D4ED8' }}>{targetInvoiceForModal.dueDate}</strong></div>
                    <div>Payment Terms: <strong>Net 30 Days</strong></div>
                  </div>
                </div>

                {/* Line Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: 11 }}>
                      <th style={{ padding: 10 }}>Sl #</th>
                      <th style={{ padding: 10 }}>Product Description</th>
                      <th style={{ padding: 10 }}>HSN / SAC</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Tax (12%)</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetInvoiceForModal.lines?.map((line: any, idx: number) => (
                      <tr key={line.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 10, color: '#64748B' }}>{idx + 1}</td>
                        <td style={{ padding: 10, fontWeight: 700, color: '#0F172A' }}>{line.productName}</td>
                        <td style={{ padding: 10, fontFamily: 'monospace', color: '#64748B' }}>{line.hsnCode || '30049099'}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontFamily: 'monospace' }}>{line.quantity?.toLocaleString()}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontFamily: 'monospace' }}>₹{line.unitPrice?.toFixed(2)}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontFamily: 'monospace' }}>₹{line.taxAmount?.toLocaleString()}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₹{line.totalAmount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Subtotal:</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{targetInvoiceForModal.subtotal?.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>CGST (6%):</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{Math.round(targetInvoiceForModal.taxTotal / 2).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>SGST (6%):</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{Math.round(targetInvoiceForModal.taxTotal / 2).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0F172A', paddingTop: 6, fontSize: 16, color: '#0F172A' }}>
                      <span>Total Amount:</span>
                      <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>₹{targetInvoiceForModal.totalAmount?.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#16A34A' }}>
                      <span>Paid Amount:</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{(targetInvoiceForModal.paidAmount || 0).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: targetInvoiceForModal.balanceAmount > 0 ? '#D97706' : '#16A34A', borderTop: '1px dashed #CBD5E1', paddingTop: 4 }}>
                      <span>Balance Due:</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{(targetInvoiceForModal.balanceAmount || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons in Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {targetInvoiceForModal.sentToCustomer ? (
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ Dispatched to customer on {targetInvoiceForModal.sentAt || 'Today'}</span>
                  ) : (
                    <span>Not sent to customer yet</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {targetInvoiceForModal.balanceAmount > 0 && isAccounts && (
                    <button
                      onClick={() => handleOpenRecordPaymentModal(targetInvoiceForModal)}
                      style={{ padding: '9px 18px', borderRadius: 6, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> Record Payment
                    </button>
                  )}
                  {targetInvoiceForModal.balanceAmount > 0 && isBuyer && (
                    <button
                      onClick={() => alert(`Online Payment Gateway:\n\nInitiating secure payment for Invoice ${targetInvoiceForModal.invoiceNumber}.\nOutstanding Balance: ₹${targetInvoiceForModal.balanceAmount.toLocaleString()}`)}
                      style={{ padding: '9px 18px', borderRadius: 6, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                    >
                      Pay Now →
                    </button>
                  )}
                  <button onClick={() => setShowViewInvoiceModal(false)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: RECORD PAYMENT (Finance & Accounts Only) */}
        {showRecordPaymentModal && targetInvoiceForModal && isAccounts && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRecordPaymentModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Record Invoice Payment</h3>
                <button onClick={() => setShowRecordPaymentModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5 }}>
                  <div>Invoice Ref: <strong>{targetInvoiceForModal.invoiceNumber}</strong></div>
                  <div>Customer: <strong>{targetInvoiceForModal.customerName}</strong></div>
                  <div>Outstanding Balance: <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>₹{targetInvoiceForModal.balanceAmount?.toLocaleString()}</strong></div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    max={targetInvoiceForModal.balanceAmount}
                    value={paymentAmountInput}
                    onChange={e => setPaymentAmountInput(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', fontWeight: 800, color: '#16A34A' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Payment Method *</label>
                  <select
                    value={paymentMethodSelect}
                    onChange={e => setPaymentMethodSelect(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                  >
                    <option value="RTGS">RTGS Bank Remittance</option>
                    <option value="NEFT">NEFT Transfer</option>
                    <option value="UPI">UPI Digital Payment</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                    <option value="CREDIT_LINE">Credit Line Settlement</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Transaction UTR / Reference Number *</label>
                  <input
                    type="text"
                    required
                    value={paymentRefInput}
                    onChange={e => setPaymentRefInput(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setShowRecordPaymentModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Post Payment to Ledger →</button>
                </div>
              </form>
            </div>
          </div>
        )}
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
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Proof of Delivery (POD)</h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Sub-Order: <strong>{activeSubOrder?.subOrderNumber}</strong></div>
                </div>
                <button onClick={() => setShowPodModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleConfirmPodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Receiver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter consignee / receiving officer name"
                    value={podReceiver}
                    onChange={e => setPodReceiver(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={podDate}
                    onChange={e => setPodDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    POD Document * <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>(PDF, JPG, JPEG, PNG • Max 10MB)</span>
                  </label>

                  {!selectedPodFile && !activeShipment?.podDocName ? (
                    <div
                      onClick={() => podFileInputRef.current?.click()}
                      style={{
                        border: '2px dashed #99F6E4',
                        borderRadius: 8,
                        padding: '20px 16px',
                        textAlign: 'center',
                        background: '#F0FDFA',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Upload size={24} style={{ color: '#0F766E', marginBottom: 6 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>
                        Click to upload or drag & drop Proof of Delivery file
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                        Supported: PDF, JPG, JPEG, PNG (Max 10 MB)
                      </div>
                      <input
                        ref={podFileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                        style={{ display: 'none' }}
                        onChange={handlePodFileChange}
                      />
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                            ✓ {selectedPodFile?.name || activeShipment?.podDocName}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                            {selectedPodFile?.type || activeShipment?.podFileType || 'PDF'} • {selectedPodFile?.size || activeShipment?.podFileSize || '2.4 MB'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => podFileInputRef.current?.click()}
                          style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F766E', cursor: 'pointer' }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPodFile(null)}
                          style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                        <input
                          ref={podFileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                          style={{ display: 'none' }}
                          onChange={handlePodFileChange}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Enter any delivery verification remarks or seal checks..."
                    value={podRemarksText}
                    onChange={e => setPodRemarksText(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setShowPodModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button
                    type="submit"
                    disabled={!podReceiver.trim() || !podDate || (!selectedPodFile && !activeShipment?.podDocName)}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 6,
                      border: 'none',
                      background: (!podReceiver.trim() || !podDate || (!selectedPodFile && !activeShipment?.podDocName)) ? '#94A3B8' : '#0F766E',
                      color: '#FFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: (!podReceiver.trim() || !podDate || (!selectedPodFile && !activeShipment?.podDocName)) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Confirm POD →
                  </button>
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
          <select
            value={selectedSubOrderCode}
            onChange={e => {
              setSelectedSubOrderCode(e.target.value);
              try { localStorage.setItem('factorygrid_target_suborder', e.target.value); } catch(err){}
            }}
            style={{ padding: '8px 12px', fontSize: 13, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontWeight: 800, fontFamily: 'monospace', cursor: 'pointer' }}
          >
            {Object.values(subOrdersStore).map((ord: any) => (
              <option key={ord.subOrderNumber} value={ord.subOrderNumber}>
                {ord.subOrderNumber} ({ord.customerName})
              </option>
            ))}
          </select>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* FOCUSED SUB-ORDER LOGISTICS STATUS CARD */}
          <div style={{ background: '#FFFFFF', border: '1px solid #99F6E4', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  FOCUSED SUB-ORDER LOGISTICS STATUS
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>
                  Sub-Order: {activeSubOrder.subOrderNumber} ({activeSubOrder.customerName})
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                  Master Order: {activeSubOrder.masterOrderNumber} | Product: {activeSubOrder.productName}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#DCFCE7' : '#EFF6FF', color: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#15803D' : '#1D4ED8', border: '1px solid #CBD5E1' }}>
                  Production: {activeSubOrder.productionStatus?.replace(/_/g, ' ')}
                </span>

                {activeShipment ? (
                  <button
                    onClick={() => setViewMode('DETAIL')}
                    style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Truck size={14} /> Inspect Active Shipment ({activeShipment.trackingNumber}) →
                  </button>
                ) : activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? (
                  <button
                    onClick={() => setActiveTabLocal('CREATE_SHIPMENT')}
                    style={{ padding: '8px 16px', borderRadius: 6, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Create Dispatch Request →
                  </button>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', background: '#F1F5F9', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    🔒 Shipment Not Created Yet (Awaiting Production)
                  </span>
                )}
              </div>
            </div>

            {!activeShipment && (
              <div style={{ background: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#F0FDFA' : '#F8FAFC', border: `1px dashed ${activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#99F6E4' : '#CBD5E1'}`, borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Package size={20} style={{ color: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#0F766E' : '#64748B' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#0F766E' : '#334155' }}>
                      {activeSubOrder.productionStatus === 'READY_TO_DISPATCH'
                        ? '✔ Manufacturing Completed — Sub-Order is Ready for Dispatch!'
                        : 'No shipment created yet for this sub-order.'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      {activeSubOrder.productionStatus === 'READY_TO_DISPATCH'
                        ? 'Click "Create Dispatch Request" to generate a new shipment record with cold-chain tracking telemetry.'
                        : 'Shipment creation becomes available after manufacturing reaches STEP 06 — Ready To Dispatch.'}
                    </div>
                  </div>
                </div>

                {activeSubOrder.productionStatus === 'READY_TO_DISPATCH' && (
                  <button
                    onClick={() => setActiveTabLocal('CREATE_SHIPMENT')}
                    style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                  >
                    + Create Dispatch Request →
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              ALL ACTIVE DISPATCHES QUEUE ({activeDispatchesList.length})
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
