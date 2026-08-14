import React, { createContext, useContext, useState } from 'react';
import { 
  UserRole, Customer, Manufacturer, Product, RFQ, 
  ManufacturerQuote, MasterOrder, Invoice, ComplianceCase, 
  NotificationItem, SubOrderStatus, ManufacturerProductMapping,
  BuyerOnboarding, ManufacturerOnboarding, Shipment, CRMLead,
  PaymentTransaction, AuditLog, CustomerVerificationRequest,
  CustomerVerificationStatus, CustomerVerificationDocument
} from '../types';
import { 
  mockCustomers, mockManufacturers, mockProducts, mockRFQs, 
  mockQuotes, mockMasterOrders, mockInvoices, mockComplianceCases, 
  mockNotifications, mockManufacturerProductMappings,
  mockBuyerOnboardings, mockManufacturerOnboardings, mockShipments,
  mockCRMLeads, mockPaymentTransactions, mockAuditLogs,
  mockCustomerVerifications
} from '../data/mockData';

interface AppContextType {
  isAuthenticated: boolean;
  login: (role?: UserRole) => void;
  logout: () => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customers: Customer[];
  manufacturers: Manufacturer[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProductMaster: (newProduct: Product) => void;
  updateProductMaster: (productId: string, updatedFields: Partial<Product>) => void;
  toggleProductMasterStatus: (productId: string) => void;
  mappings: ManufacturerProductMapping[];
  setMappings: React.Dispatch<React.SetStateAction<ManufacturerProductMapping[]>>;
  addMapping: (mapping: ManufacturerProductMapping) => void;
  updateMapping: (productId: string, manufacturerId: string, updatedFields: Partial<ManufacturerProductMapping>) => void;
  removeMapping: (productId: string, manufacturerId: string) => void;
  rfqs: RFQ[];
  quotes: ManufacturerQuote[];
  orders: MasterOrder[];
  invoices: Invoice[];
  complianceCases: ComplianceCase[];
  notifications: NotificationItem[];
  buyerOnboardings: BuyerOnboarding[];
  manufacturerOnboardings: ManufacturerOnboarding[];
  shipments: Shipment[];
  crmLeads: CRMLead[];
  paymentTransactions: PaymentTransaction[];
  auditLogs: AuditLog[];
  customerVerifications: CustomerVerificationRequest[];
  
  // Manufacturer Profile Navigation Context
  selectedMfgIdForProfile: string | null;
  setSelectedMfgIdForProfile: (id: string | null) => void;
  mfgProfileProductContext: { productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null;
  setMfgProfileProductContext: (ctx: { productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null) => void;
  
  // Unified RFQ Creation Drawer State
  isCreateRfqDrawerOpen: boolean;
  setIsCreateRfqDrawerOpen: (open: boolean) => void;
  openCreateRfqDrawer: () => void;
  
  // Declined RFQ tracking
  declinedRfqs: Record<string, { rfqId: string; manufacturerId: string; manufacturerName: string; declineReason: string; declineRemarks?: string; declinedAt: string }[]>;
  declineRFQ: (rfqId: string, manufacturerId: string, manufacturerName: string, reason: string, remarks?: string) => void;

  // Buyer <-> Manufacturer Negotiation & Revised Quotes
  negotiationThreads: Record<string, { id: string; threadKey: string; senderRole: 'BUYER' | 'SUPPLIER'; senderName: string; timestamp: string; text: string }[]>;
  sendNegotiationMessage: (threadKey: string, text: string, senderRole: 'BUYER' | 'SUPPLIER', senderName: string) => void;
  revisedQuotes: Record<string, { unitPrice: number; taxPercent: number; discountPercent: number; finalPrice: number; leadTimeDays: number; moq: number; remarks?: string; revisedAt: string }>;
  submitRevisedQuote: (threadKey: string, data: { unitPrice: number; taxPercent: number; discountPercent: number; leadTimeDays: number; moq: number; remarks?: string }) => void;
  
  // Action Handlers
  addRFQ: (newRfq: RFQ) => void;
  submitQuote: (quote: ManufacturerQuote) => void;
  selectQuoteAndCreateOrder: (rfqId: string, selections: Record<string, { mfgId: string; mfgName: string; price: number }>) => void;
  updateSubOrderStatus: (subOrderId: string, status: SubOrderStatus) => void;
  verifyComplianceDocument: (caseId: string, docName: string, passed: boolean) => void;
  approveComplianceCase: (caseId: string) => void;
  recordInvoicePayment: (invoiceId: string, amount: number, method?: string, ref?: string) => void;
  submitBuyerOnboarding: (data: Omit<BuyerOnboarding, 'id' | 'status' | 'submittedDate'>) => void;
  submitManufacturerOnboarding: (data: Omit<ManufacturerOnboarding, 'id' | 'status' | 'submittedDate'>) => void;
  approveBuyerOnboarding: (id: string) => void;
  approveManufacturerOnboarding: (id: string) => void;
  updateShipmentStatus: (shipmentId: string, status: Shipment['status']) => void;
  addCRMInteraction: (leadId: string, summary: string, type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE') => void;
  addAuditLog: (module: string, action: string) => void;

  // Customer Verification Workflow Handlers
  submitCustomerVerificationRequest: (reqData: Partial<CustomerVerificationRequest>) => void;
  assignComplianceOfficer: (requestId: string, officerName: string) => void;
  approveCustomerVerification: (requestId: string) => void;
  rejectCustomerVerification: (requestId: string, reason: string) => void;
  requestMoreCustomerDocs: (requestId: string, notes: string[]) => void;
  resubmitCustomerDocs: (requestId: string, docs: CustomerVerificationDocument[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fg_auth') === 'true';
    }
    return false;
  });
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('fg_role') as UserRole;
      if (savedRole) return savedRole;
    }
    return 'BUYER';
  });

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fg_role', role);
    }
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const login = (role?: UserRole) => {
    const effectiveRole = role || currentRole || 'BUYER';
    setCurrentRole(effectiveRole);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fg_auth', 'true');
      localStorage.setItem('fg_role', effectiveRole);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fg_auth');
      localStorage.removeItem('fg_role');
    }
  };
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(mockManufacturers);
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const addProductMaster = (newProduct: Product) => {
    setProducts(prev => {
      const exists = prev.some(p => p.code.toLowerCase().trim() === newProduct.code.toLowerCase().trim());
      if (exists) return prev;
      return [newProduct, ...prev];
    });
  };

  const updateProductMaster = (productId: string, updatedFields: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updatedFields } : p));
  };

  const toggleProductMasterStatus = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: p.status === 'Inactive' ? 'Active' : 'Inactive' } : p));
  };
  const [mappings, setMappings] = useState<ManufacturerProductMapping[]>(mockManufacturerProductMappings);

  const addMapping = (newMapping: ManufacturerProductMapping) => {
    setMappings(prev => {
      // Check duplicate
      const exists = prev.some(m => m.productId === newMapping.productId && m.manufacturerId === newMapping.manufacturerId);
      if (exists) return prev;
      return [newMapping, ...prev];
    });
  };

  const updateMapping = (productId: string, manufacturerId: string, updatedFields: Partial<ManufacturerProductMapping>) => {
    setMappings(prev => prev.map(m => (m.productId === productId && m.manufacturerId === manufacturerId) ? { ...m, ...updatedFields } : m));
  };

  const removeMapping = (productId: string, manufacturerId: string) => {
    setMappings(prev => prev.filter(m => !(m.productId === productId && m.manufacturerId === manufacturerId)));
  };
  const [rfqs, setRfqs] = useState<RFQ[]>(mockRFQs);
  const [quotes, setQuotes] = useState<ManufacturerQuote[]>(mockQuotes);

  // Declined RFQs state
  const [declinedRfqs, setDeclinedRfqs] = useState<Record<string, { rfqId: string; manufacturerId: string; manufacturerName: string; declineReason: string; declineRemarks?: string; declinedAt: string }[]>>({});

  const declineRFQ = (rfqId: string, manufacturerId: string, manufacturerName: string, reason: string, remarks?: string) => {
    const formattedDate = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    const record = {
      rfqId,
      manufacturerId,
      manufacturerName,
      declineReason: reason,
      declineRemarks: remarks,
      declinedAt: formattedDate
    };
    setDeclinedRfqs(prev => {
      const existingList = prev[rfqId] || [];
      const filtered = existingList.filter(d => d.manufacturerId !== manufacturerId);
      return { ...prev, [rfqId]: [...filtered, record] };
    });

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `RFQ Declined`,
      message: `RFQ ${rfqId} was declined by ${manufacturerName}. Reason: ${reason}`,
      timestamp: 'Just now',
      type: 'WARNING',
      category: 'RFQ',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // Audit Log
    addAuditLog('DECLINE_RFQ', `Manufacturer ${manufacturerName} declined ${rfqId}. Reason: ${reason}`);
  };

  // Negotiation Threads & Revised Quotes State
  const [negotiationThreads, setNegotiationThreads] = useState<Record<string, { id: string; threadKey: string; senderRole: 'BUYER' | 'SUPPLIER'; senderName: string; timestamp: string; text: string }[]>>({});
  const [revisedQuotes, setRevisedQuotes] = useState<Record<string, { unitPrice: number; taxPercent: number; discountPercent: number; finalPrice: number; leadTimeDays: number; moq: number; remarks?: string; revisedAt: string }>>({});

  const sendNegotiationMessage = (threadKey: string, text: string, senderRole: 'BUYER' | 'SUPPLIER', senderName: string) => {
    const timeStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = {
      id: 'msg_' + Date.now(),
      threadKey,
      senderRole,
      senderName,
      timestamp: timeStr,
      text
    };
    setNegotiationThreads(prev => ({
      ...prev,
      [threadKey]: [...(prev[threadKey] || []), msg]
    }));
    addAuditLog('NEGOTIATION', `${senderName} sent message on thread ${threadKey}`);
  };

  const submitRevisedQuote = (threadKey: string, data: { unitPrice: number; taxPercent: number; discountPercent: number; leadTimeDays: number; moq: number; remarks?: string }) => {
    const taxAmt = data.unitPrice * (data.taxPercent / 100);
    const discAmt = (data.unitPrice + taxAmt) * (data.discountPercent / 100);
    const finalPrice = Math.round((data.unitPrice + taxAmt - discAmt) * 100) / 100;
    const timeStr = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });

    const revRecord = {
      unitPrice: data.unitPrice,
      taxPercent: data.taxPercent,
      discountPercent: data.discountPercent,
      finalPrice,
      leadTimeDays: data.leadTimeDays,
      moq: data.moq,
      remarks: data.remarks,
      revisedAt: timeStr
    };

    setRevisedQuotes(prev => ({
      ...prev,
      [threadKey]: revRecord
    }));

    // Auto add a system/supplier message to the thread
    sendNegotiationMessage(threadKey, `✔ Submitted Revised Quote: Unit Price ₹${data.unitPrice.toFixed(2)}, Tax ${data.taxPercent}%, Discount ${data.discountPercent}%, Final Price ₹${finalPrice.toFixed(2)}, Lead Time ${data.leadTimeDays} Days, MOQ ${data.moq.toLocaleString()} Units. Remarks: ${data.remarks || 'None'}`, 'SUPPLIER', 'Supplier Sales Team');

    addAuditLog('REVISED_QUOTE', `Submitted revised quote for ${threadKey}: Final Price ₹${finalPrice}`);
  };
  const [orders, setOrders] = useState<MasterOrder[]>(mockMasterOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [complianceCases, setComplianceCases] = useState<ComplianceCase[]>(mockComplianceCases);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [buyerOnboardings, setBuyerOnboardings] = useState<BuyerOnboarding[]>(mockBuyerOnboardings);
  const [manufacturerOnboardings, setManufacturerOnboardings] = useState<ManufacturerOnboarding[]>(mockManufacturerOnboardings);
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(mockCRMLeads);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(mockPaymentTransactions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [customerVerifications, setCustomerVerifications] = useState<CustomerVerificationRequest[]>(mockCustomerVerifications);

  // Profile Navigation State
  const [selectedMfgIdForProfile, setSelectedMfgIdForProfile] = useState<string | null>(null);
  const [mfgProfileProductContext, setMfgProfileProductContext] = useState<{ productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null>(null);

  // Unified RFQ Creation Drawer State
  const [isCreateRfqDrawerOpen, setIsCreateRfqDrawerOpen] = useState<boolean>(false);
  const openCreateRfqDrawer = () => {
    setIsCreateRfqDrawerOpen(true);
    setActiveTab('rfqs');
  };

  const addAuditLog = (module: string, action: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userName: currentRole === 'BUYER' ? 'Apex Pharma (Buyer)' : currentRole === 'SUPPLIER' ? 'SunBio Labs (Supplier)' : 'Executive User',
      userRole: currentRole,
      module,
      action,
      ipAddress: '192.168.1.100'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addRFQ = (newRfq: RFQ) => {
    setRfqs(prev => [newRfq, ...prev]);
    addAuditLog('RFQ Center', `Created RFQ ${newRfq.rfqNumber} with ${newRfq.lines.length} lines`);
    // Notify suppliers
    const newNotif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `New RFQ ${newRfq.rfqNumber} Distributed`,
      message: `Customer ${newRfq.customerName} submitted RFQ with ${newRfq.lines.length} lines.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'RFQ',
      read: false,
      link: 'quotes'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const submitQuote = (newQuote: ManufacturerQuote) => {
    setQuotes(prev => [newQuote, ...prev]);
    setRfqs(prev => prev.map(r => r.id === newQuote.rfqId ? { ...r, status: 'QUOTED' } : r));
    addAuditLog('Quote Matrix', `Submitted sealed quote ${newQuote.id} for RFQ ${newQuote.rfqNumber}`);
  };

  const selectQuoteAndCreateOrder = (rfqId: string, selections: Record<string, { mfgId: string; mfgName: string; price: number }>) => {
    const rfq = rfqs.find(r => r.id === rfqId);
    if (!rfq) return;

    // Build master order with sub-orders grouped by manufacturer
    const subOrderMap: Record<string, any[]> = {};
    let totalMasterAmount = 0;

    rfq.lines.forEach(line => {
      const selection = selections[line.id];
      if (selection) {
        if (!subOrderMap[selection.mfgId]) {
          subOrderMap[selection.mfgId] = [];
        }
        const lineTotal = line.quantity * selection.price * 1.12; // with tax estimate
        totalMasterAmount += lineTotal;
        subOrderMap[selection.mfgId].push({
          id: 'sol_' + line.id,
          productId: line.productId,
          productName: line.productName,
          dosageForm: line.dosageForm,
          quantity: line.quantity,
          unitPrice: selection.price,
          taxPercent: 12,
          discountPercent: 0,
          totalPrice: lineTotal
        });
      }
    });

    const masterOrdNum = `MO-2026-${1000 + orders.length + 1}`;
    const subOrders = Object.keys(subOrderMap).map((mfgId, idx) => {
      const mfg = manufacturers.find(m => m.id === mfgId);
      const items = subOrderMap[mfgId];
      const subTotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
      const subNum = `SO-2026-${1000 + orders.length + 1}-0${idx + 1}`;

      // Create linked shipment tracking record
      const newShp: Shipment = {
        id: `shp_${Date.now()}_${idx}`,
        subOrderId: `so_${Date.now()}_${idx}`,
        subOrderNumber: subNum,
        masterOrderNumber: masterOrdNum,
        manufacturerName: mfg ? mfg.companyName : 'Partner Manufacturer',
        customerName: rfq.customerName,
        vehicleNumber: 'HP 12 B ' + (9000 + idx),
        courierName: 'ColdEx Logistics',
        trackingNumber: 'TRK-COLD-' + (88000 + idx),
        driverName: 'Gurpreet Singh',
        driverPhone: '+91 98765 00112',
        gpsLocation: { lat: 28.6139, lng: 77.209, address: 'Baddi Industrial Zone, Himachal Pradesh' },
        coldChainRequired: true,
        coldChainStatus: 'COMPLIANT (2°C - 8°C)',
        tempLogs: [
          { timestamp: '08:00 AM', temperatureC: 4.1, status: 'NORMAL' },
          { timestamp: '12:00 PM', temperatureC: 4.5, status: 'NORMAL' }
        ],
        dispatchDate: new Date().toISOString().split('T')[0],
        eta: '2026-09-02',
        status: 'DISPATCHED',
        timeline: [
          { title: 'Quality Batch Clearance & COA Uploaded', timestamp: 'Just now', completed: true },
          { title: 'Loaded into Cold Chain Container', timestamp: 'Just now', completed: true }
        ]
      };
      setShipments(prev => [newShp, ...prev]);

      return {
        id: `so_${Date.now()}_${idx}`,
        subOrderNumber: subNum,
        masterOrderId: `mo_${Date.now()}`,
        masterOrderNumber: masterOrdNum,
        manufacturerId: mfgId,
        manufacturerName: mfg ? mfg.companyName : 'Manufacturer Partner',
        status: 'OPEN' as SubOrderStatus,
        totalAmount: Math.round(subTotal),
        startDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '2026-09-01',
        lines: items
      };
    });

    const newMasterOrder: MasterOrder = {
      id: `mo_${Date.now()}`,
      orderNumber: masterOrdNum,
      customerId: rfq.customerId,
      customerName: rfq.customerName,
      customerCode: rfq.customerCode,
      createdDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '2026-09-01',
      status: 'OPEN',
      totalAmount: Math.round(totalMasterAmount),
      subOrders,
      shippingAddress: 'Industrial Zone, Plot 14, Phase I, Delhi'
    };

    setOrders(prev => [newMasterOrder, ...prev]);
    setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: 'APPROVED' } : r));
    setQuotes(prev => prev.map(q => {
      if (q.rfqId === rfqId || q.rfqNumber === rfq.rfqNumber) {
        const matchingSubOrder = subOrders.find(so => so.manufacturerId === q.manufacturerId || q.manufacturerName?.includes('SunBio'));
        if (matchingSubOrder) {
          return {
            ...q,
            status: 'SUB-ORDER CREATED',
            subOrderId: matchingSubOrder.id,
            subOrderNumber: matchingSubOrder.subOrderNumber,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        } else {
          return {
            ...q,
            status: 'REJECTED',
            rejectionReason: 'Buyer awarded order to another manufacturer.',
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
      }
      return q;
    }));
    addAuditLog('Order Splitting', `Generated Master Order ${masterOrdNum} with ${subOrders.length} Sub-Orders`);

    // Auto-generate invoice
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-2026-${4400 + invoices.length + 1}`,
      masterOrderId: newMasterOrder.id,
      orderNumber: newMasterOrder.orderNumber,
      customerId: rfq.customerId,
      customerName: rfq.customerName,
      customerCode: rfq.customerCode,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '2026-09-30',
      subtotal: Math.round(totalMasterAmount * 0.88),
      taxTotal: Math.round(totalMasterAmount * 0.12),
      totalAmount: Math.round(totalMasterAmount),
      paidAmount: 0,
      balanceAmount: Math.round(totalMasterAmount),
      status: 'OPEN',
      lines: rfq.lines.map((l, i) => ({
        id: `il_${i}`,
        productId: l.productId,
        productName: l.productName,
        hsnCode: '30049099',
        quantity: l.quantity,
        unitPrice: selections[l.id]?.price || 40,
        taxAmount: Math.round(l.quantity * (selections[l.id]?.price || 40) * 0.12),
        totalAmount: Math.round(l.quantity * (selections[l.id]?.price || 40) * 1.12)
      }))
    };
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const updateSubOrderStatus = (subOrderId: string, status: SubOrderStatus) => {
    setOrders(prev => prev.map(mo => {
      const hasSub = mo.subOrders.some(so => so.id === subOrderId);
      if (!hasSub) return mo;

      const updatedSubOrders = mo.subOrders.map(so => so.id === subOrderId ? { ...so, status } : so);
      
      let rolledStatus = mo.status;
      if (updatedSubOrders.some(so => so.status === 'IN_PRODUCTION')) {
        rolledStatus = 'IN_PRODUCTION';
      } else if (updatedSubOrders.every(so => so.status === 'DELIVERED')) {
        rolledStatus = 'DELIVERED';
      } else if (updatedSubOrders.some(so => so.status === 'DISPATCHED' || so.status === 'READY_TO_DISPATCH')) {
        rolledStatus = 'IN_TRANSIT';
      }

      return { ...mo, status: rolledStatus, subOrders: updatedSubOrders };
    }));
    addAuditLog('Manufacturing', `Updated sub-order ${subOrderId} status to ${status}`);
  };

  const verifyComplianceDocument = (caseId: string, docName: string, passed: boolean) => {
    setComplianceCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const updatedDocs = c.documents.map(d => d.name === docName ? { ...d, verified: passed } : d);
      return { ...c, documents: updatedDocs };
    }));
  };

  const approveComplianceCase = (caseId: string) => {
    const compCase = complianceCases.find(c => c.id === caseId);
    if (!compCase) return;

    setComplianceCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'APPROVED' } : c));
    if (compCase.entityType === 'CUSTOMER') {
      setCustomers(prev => prev.map(cust => cust.id === compCase.entityId ? { ...cust, status: 'ACTIVE', complianceStatus: 'APPROVED' } : cust));
    } else if (compCase.entityType === 'MANUFACTURER') {
      setManufacturers(prev => prev.map(mfg => mfg.id === compCase.entityId ? { ...mfg, status: 'ACTIVE', complianceStatus: 'APPROVED' } : mfg));
    }
    addAuditLog('Compliance Desk', `Approved compliance case ${compCase.caseNumber} for ${compCase.entityName}`);
  };

  const recordInvoicePayment = (invoiceId: string, amount: number, method = 'RTGS', ref = 'RTGS-' + Date.now()) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const newPaid = inv.paidAmount + amount;
      const newBal = inv.totalAmount - newPaid;
      const newStatus = newBal <= 0 ? 'PAID' : 'PARTIAL_PAYMENT';

      const newTx: PaymentTransaction = {
        id: 'tx_' + Date.now(),
        transactionRef: ref,
        invoiceId,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        date: new Date().toISOString().split('T')[0],
        amount,
        paymentMethod: method as any,
        status: 'COMPLETED',
        remarks: 'Payment recorded in Accounts'
      };
      setPaymentTransactions(txPrev => [newTx, ...txPrev]);

      return { ...inv, paidAmount: newPaid, balanceAmount: newBal, status: newStatus };
    }));
    addAuditLog('Invoices & AR', `Recorded payment of ₹${amount.toLocaleString()} for Invoice ${invoiceId}`);
  };

  const submitBuyerOnboarding = (data: Omit<BuyerOnboarding, 'id' | 'status' | 'submittedDate'>) => {
    const newBuyer: BuyerOnboarding = {
      ...data,
      id: 'bo_' + Date.now(),
      status: 'UNDER_REVIEW',
      submittedDate: new Date().toISOString().split('T')[0]
    };
    setBuyerOnboardings(prev => [newBuyer, ...prev]);

    // Also auto-generate CustomerVerificationRequest for Customer Verification module
    submitCustomerVerificationRequest({
      customerName: newBuyer.contactPerson || 'Representative',
      companyName: newBuyer.companyName,
      customerType: 'PCD',
      gstNumber: newBuyer.gstin || '07AAAAA0000A1Z5',
      panNumber: newBuyer.pan || 'AAAAA0000A',
      drugLicenseNumber: newBuyer.drugLicenseNo || 'DL-2026-REG',
      cinNumber: 'U24232DL2020PTC361234',
      email: newBuyer.email || 'customer@company.com',
      phone: newBuyer.phone || '+91 98765 43210',
      billingAddress: newBuyer.address || 'Industrial Area',
      shippingAddress: newBuyer.address || 'Industrial Area',
      state: 'Delhi',
      country: 'India',
      pincode: '110020',
      documents: newBuyer.documents?.map((d: any, idx: number) => ({
        id: `doc_public_${idx}`,
        documentType: (d.type as any) || 'GST Certificate',
        fileName: d.name,
        fileSize: '1.2 MB',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'Valid',
        url: d.url || '#'
      })) || []
    });
    setComplianceCases(prev => [newCase, ...prev]);
    addAuditLog('Buyer Onboarding', `Submitted onboarding application for ${newBuyer.companyName}`);
  };

  const submitManufacturerOnboarding = (data: Omit<ManufacturerOnboarding, 'id' | 'status' | 'submittedDate'>) => {
    const newMfg: ManufacturerOnboarding = {
      ...data,
      id: 'mo_' + Date.now(),
      status: 'UNDER_REVIEW',
      submittedDate: new Date().toISOString().split('T')[0]
    };
    setManufacturerOnboardings(prev => [newMfg, ...prev]);

    // Create matching compliance case
    const newCase: ComplianceCase = {
      id: 'comp_' + Date.now(),
      caseNumber: 'CMP-2026-' + (100 + complianceCases.length),
      entityType: 'MANUFACTURER',
      entityId: newMfg.id,
      entityName: newMfg.companyName,
      caseType: 'DRUG_LICENSE',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'Compliance Desk Officer',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      riskScore: 'LOW',
      checklist: [
        { title: 'Manufacturing License Audit', mandatory: true, passed: true },
        { title: 'WHO-GMP Audit Certificate', mandatory: true, passed: true },
        { title: 'Capacity & Facility Audit', mandatory: true, passed: true }
      ],
      documents: newMfg.documents.map(d => ({ name: d.name, url: d.url, verified: false }))
    };
    setComplianceCases(prev => [newCase, ...prev]);
    addAuditLog('Manufacturer Onboarding', `Submitted factory onboarding application for ${newMfg.companyName}`);
  };

  const approveBuyerOnboarding = (id: string) => {
    const buyerCode = `BUY-2026-${100 + Math.floor(Math.random() * 900)}`;
    setBuyerOnboardings(prev => prev.map(b => b.id === id ? { ...b, status: 'APPROVED', buyerCode } : b));
    
    // Auto-create Customer in Directory
    const b = buyerOnboardings.find(item => item.id === id);
    if (b) {
      const newCust: Customer = {
        id: 'c_' + Date.now(),
        code: buyerCode,
        name: b.companyName,
        type: 'PCD',
        gstin: b.gstin,
        pan: b.pan,
        drugLicenseNo: b.drugLicenseNo,
        contactPerson: b.contactPerson,
        email: b.email,
        phone: b.phone,
        city: b.address.split(',')[0] || 'Delhi',
        state: 'Delhi',
        status: 'ACTIVE',
        complianceStatus: 'APPROVED',
        creditLimit: 2000000,
        availableCredit: 2000000,
        creditDays: 45,
        riskScore: 'LOW',
        joinedDate: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [newCust, ...prev]);
    }
    addAuditLog('Compliance Desk', `Approved Buyer Onboarding & Issued Code ${buyerCode}`);
  };

  const approveManufacturerOnboarding = (id: string) => {
    const manufacturerCode = `MFG-2026-${100 + Math.floor(Math.random() * 900)}`;
    setManufacturerOnboardings(prev => prev.map(m => m.id === id ? { ...m, status: 'APPROVED', manufacturerCode } : m));

    const m = manufacturerOnboardings.find(item => item.id === id);
    if (m) {
      const newMfg: Manufacturer = {
        id: 'm_' + Date.now(),
        code: manufacturerCode,
        name: m.companyName,
        companyName: m.companyName,
        mfgLicenseNo: m.mfgLicenseNo,
        gstin: m.gstin,
        pan: m.pan,
        contactPerson: m.contactPerson,
        email: m.email,
        phone: m.phone,
        city: m.factoryLocation.split(',')[0] || 'Baddi',
        state: 'Himachal Pradesh',
        certifications: m.certifications.map((c, i) => ({
          id: 'cert_' + i,
          name: c,
          certificateNo: 'CERT-' + Math.floor(Math.random() * 889900),
          issuedBy: 'CDSCO / State FDA',
          issueDate: '2025-01-01',
          expiryDate: '2028-12-31',
          status: 'VALID'
        })),
        rating: 4.8,
        complianceStatus: 'APPROVED',
        status: 'ACTIVE',
        activeSubOrders: 0
      };
      setManufacturers(prev => [newMfg, ...prev]);
    }
    addAuditLog('Compliance Desk', `Approved Manufacturer Onboarding & Issued Code ${manufacturerCode}`);
  };

  const updateShipmentStatus = (shipmentId: string, status: Shipment['status']) => {
    setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status } : s));
  };

  const addCRMInteraction = (leadId: string, summary: string, type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE') => {
    setCrmLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const newInteraction = {
        id: 'int_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type,
        summary,
        author: currentRole
      };
      return { ...l, interactions: [newInteraction, ...l.interactions] };
    }));
  };

  const submitCustomerVerificationRequest = (reqData: Partial<CustomerVerificationRequest>) => {
    const newId = `CUS-VER-${100 + customerVerifications.length + 1}`;
    const gst = reqData.gstNumber || '';
    const pan = reqData.panNumber || '';
    const docs = reqData.documents || [];

    const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst.trim()) || gst.length >= 10;
    const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim()) || pan.length >= 8;
    const hasAllDocs = docs.length >= 6;
    const hasFields = !!(reqData.companyName && reqData.customerType && reqData.gstNumber && reqData.panNumber && reqData.drugLicenseNumber && reqData.cinNumber);

    const autoValOverall = (isGstValid && isPanValid && hasAllDocs && hasFields) ? 'Valid' : 'Pending Review';

    const newReq: CustomerVerificationRequest = {
      id: newId,
      customerName: reqData.customerName || 'Representative',
      companyName: reqData.companyName || 'New Pharma Entity',
      customerType: reqData.customerType || 'PCD',
      registrationDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'Under Review',
      assignedComplianceOfficer: 'Rajesh Kumar (Compliance Desk A)',
      gstNumber: gst,
      panNumber: pan,
      drugLicenseNumber: reqData.drugLicenseNumber || '',
      cinNumber: reqData.cinNumber || '',
      email: reqData.email || '',
      phone: reqData.phone || '',
      address: reqData.address || '',
      city: reqData.city || '',
      state: reqData.state || '',
      pincode: reqData.pincode || '',
      estimatedMonthlyVolume: reqData.estimatedMonthlyVolume || '₹10,00,000 / month',
      documents: docs,
      autoValidation: {
        gstCheck: isGstValid ? 'Valid' : 'Invalid',
        panCheck: isPanValid ? 'Valid' : 'Invalid',
        requiredDocsCheck: hasAllDocs ? 'Valid' : 'Pending Review',
        requiredFieldsCheck: hasFields ? 'Valid' : 'Invalid',
        overallStatus: autoValOverall,
        validationDetails: [
          isGstValid ? 'GSTIN structure format verified.' : 'GSTIN format warning.',
          isPanValid ? 'PAN structure format verified.' : 'PAN format warning.',
          hasAllDocs ? 'All 6 required onboarding documents present.' : `${docs.length}/6 mandatory documents attached.`,
          hasFields ? 'Required corporate details populated.' : 'Missing required regulatory fields.'
        ]
      },
      businessVerification: {
        gstActiveStatus: 'Active',
        panValidation: 'Verified',
        companyRegistrationValidation: 'Verified (ROC)',
        cinValidation: 'Active & Verified'
      },
      regulatoryVerification: {
        drugLicenseValidity: 'Valid (Form 20B/21B)',
        licenseExpiryCheck: 'Valid until 15-Dec-2028 (850 days remaining)',
        stateRegulatoryAuthorityValidation: 'Verified with State FDA'
      },
      financialVerification: {
        bankVerification: 'Verified (Penny Drop Passed)',
        creditRating: 'AA (Moderate Risk)',
        riskClassification: 'LOW'
      }
    };

    setCustomerVerifications(prev => [newReq, ...prev]);
    addAuditLog('Customer Verification', `Submitted verification request for ${newReq.companyName}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `New Customer Verification Request`,
      message: `${newReq.companyName} (${newReq.customerType}) submitted verification request. Assigned to ${newReq.assignedComplianceOfficer}.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const assignComplianceOfficer = (requestId: string, officerName: string) => {
    setCustomerVerifications(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      return {
        ...req,
        assignedComplianceOfficer: officerName,
        verificationStatus: req.verificationStatus === 'Pending' ? 'Under Review' : req.verificationStatus
      };
    }));
    addAuditLog('Customer Verification', `Assigned ${officerName} to request ${requestId}`);
  };

  const approveCustomerVerification = (requestId: string) => {
    const req = customerVerifications.find(r => r.id === requestId);
    if (!req) return;

    const generatedCode = `CUS000${100 + Math.floor(Math.random() * 900)}`;

    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Active',
        customerCode: generatedCode,
        portalLoginCreated: true,
        portalUsername: r.email,
        approvedAt: new Date().toISOString().split('T')[0]
      };
    }));

    const existingCust = customers.find(c => c.name === req.companyName || c.email === req.email);
    if (!existingCust) {
      const newCust: Customer = {
        id: 'c_' + Date.now(),
        code: generatedCode,
        name: req.companyName,
        type: req.customerType,
        gstin: req.gstNumber,
        pan: req.panNumber,
        drugLicenseNo: req.drugLicenseNumber,
        contactPerson: req.customerName,
        email: req.email,
        phone: req.phone,
        city: req.city || 'Delhi',
        state: req.state || 'Delhi',
        status: 'ACTIVE',
        complianceStatus: 'APPROVED',
        creditLimit: 2500000,
        availableCredit: 2500000,
        creditDays: 45,
        riskScore: req.financialVerification.riskClassification,
        joinedDate: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [newCust, ...prev]);
    } else {
      setCustomers(prev => prev.map(c => c.id === existingCust.id ? { ...c, status: 'ACTIVE', complianceStatus: 'APPROVED', code: generatedCode } : c));
    }

    addAuditLog('Customer Verification', `Approved ${req.companyName}. Generated Code: ${generatedCode}, Created Portal Login.`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Customer Approved & Active`,
      message: `${req.companyName} verification approved. Customer Code: ${generatedCode}. Account status is now Active.`,
      timestamp: 'Just now',
      type: 'SUCCESS',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const rejectCustomerVerification = (requestId: string, reason: string) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Rejected',
        rejectionReason: reason
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Rejected customer verification for ${req?.companyName || requestId}. Reason: ${reason}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Customer Verification Rejected`,
      message: `Verification for ${req?.companyName || requestId} was rejected. Reason: ${reason}`,
      timestamp: 'Just now',
      type: 'ERROR',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const requestMoreCustomerDocs = (requestId: string, notes: string[]) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Need More Docs',
        requestedDocumentsNotes: notes
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Requested additional documents for ${req?.companyName || requestId}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Additional Documents Required`,
      message: `Customer ${req?.companyName} requires document re-submission: ${notes.join('; ')}`,
      timestamp: 'Just now',
      type: 'WARNING',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const resubmitCustomerDocs = (requestId: string, updatedDocs: CustomerVerificationDocument[]) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        documents: updatedDocs,
        verificationStatus: 'Under Review',
        requestedDocumentsNotes: undefined
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Resubmitted documents for ${req?.companyName || requestId}. Status updated to Under Review.`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Documents Resubmitted`,
      message: `${req?.companyName} re-submitted requested documents. Case returned to Under Review.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, login, logout,
      currentRole, setCurrentRole,
      activeTab, setActiveTab,
      customers, manufacturers, products, setProducts, addProductMaster, updateProductMaster, toggleProductMasterStatus, mappings, setMappings, addMapping, updateMapping, removeMapping,
      rfqs, quotes, orders, invoices, complianceCases, notifications,
      declinedRfqs, declineRFQ,
      negotiationThreads, sendNegotiationMessage, revisedQuotes, submitRevisedQuote,
      buyerOnboardings, manufacturerOnboardings, shipments, crmLeads,
      paymentTransactions, auditLogs, customerVerifications,
      selectedMfgIdForProfile, setSelectedMfgIdForProfile,
      mfgProfileProductContext, setMfgProfileProductContext,
      isCreateRfqDrawerOpen, setIsCreateRfqDrawerOpen, openCreateRfqDrawer,
      addRFQ, submitQuote, selectQuoteAndCreateOrder,
      updateSubOrderStatus, verifyComplianceDocument, approveComplianceCase,
      recordInvoicePayment, submitBuyerOnboarding, submitManufacturerOnboarding,
      approveBuyerOnboarding, approveManufacturerOnboarding, updateShipmentStatus,
      addCRMInteraction, addAuditLog,
      submitCustomerVerificationRequest, assignComplianceOfficer,
      approveCustomerVerification, rejectCustomerVerification,
      requestMoreCustomerDocs, resubmitCustomerDocs
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

