import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { EmptyRFQIllustration, FactoryAvatar } from '../common/Illustrations';
import {
  RFQ, RFQLine, Manufacturer, Product, RFQStatus, DistributionStatus,
  ManufacturerRFQ, ManufacturerRFQLine, ManufacturerQuote, ManufacturerQuoteLine,
  ManufacturerProductMapping
} from '../../types';
import {
  FileText, Plus, Search, Filter, Download, ChevronDown, ChevronRight,
  MoreHorizontal, Calendar, Clock, Users, CheckCircle2, AlertCircle,
  X, Building2, Package, Layers, ArrowRight, Eye, Zap, RefreshCw,
  SlidersHorizontal, BookmarkPlus, Share2, Bell, Inbox, Trash2, Mail, MessageSquare,
  Send, Check, AlertTriangle, ArrowLeft, ShieldCheck, Award, ExternalLink, MapPin
} from 'lucide-react';

const supportedStatuses: RFQStatus[] = [
  'Draft',
  'Submitted',
  'Pricing In Progress',
  'Quoted',
  'Approved',
  'Rejected',
  'Closed'
];

interface DraftProductLine {
  productId: string;
  productName: string;
  dosageForm: string;
  packSize: string;
  quantity: number | '';
  requiredDate: string;
  remarks: string;
}

import { ManufacturerAssignedRFQsModule } from './ManufacturerAssignedRFQsModule';

export const RFQModule: React.FC = () => {
  const {
    rfqs, quotes, orders, addRFQ, submitQuote, currentRole, products, manufacturers,
    mappings, declinedRfqs, setActiveTab, addAuditLog, isCreateRfqDrawerOpen, setIsCreateRfqDrawerOpen
  } = useApp();

  if (currentRole === 'SUPPLIER') {
    return <ManufacturerAssignedRFQsModule />;
  }

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);

  // RFQ Creation Wizard State (Steps 1, 2, 3, 4)
  const [localShowCreateDrawer, setLocalShowCreateDrawer] = useState(false);
  const showCreateDrawer = localShowCreateDrawer || isCreateRfqDrawerOpen;
  
  // Step State: 1 = Basic Info & Lines, 2 = General & Terms, 3 = Manufacturer Review, 4 = Final RFQ Review & Submit
  const [rfqWizardStep, setRfqWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [isEditingDraftId, setIsEditingDraftId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-Generated RFQ Number
  const autoRfqNumber = useMemo(() => {
    if (isEditingDraftId) {
      const existing = rfqs.find(r => r.id === isEditingDraftId);
      if (existing) return existing.rfqNumber;
    }
    return `RFQ-2026-${String(rfqs.length + 1004).padStart(4, '0')}`;
  }, [rfqs, isEditingDraftId]);

  // RFQ Header & General Terms Fields State
  const [buyerName, setBuyerName] = useState<string>('Apex Pharma (Buyer)');
  const [customerName, setCustomerName] = useState<string>('Apex Pharma PCD Franchise');
  const [customerCode, setCustomerCode] = useState<string>('CUS000101');
  const [rfqDate, setRfqDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [requiredDate, setRequiredDate] = useState<string>('2026-09-15');
  const [deadlineDate, setDeadlineDate] = useState<string>('2026-08-25');
  const [priority, setPriority] = useState<'STANDARD' | 'HIGH' | 'URGENT'>('HIGH');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('Baddi Industrial Area, Himachal Pradesh');
  const [headerRemarks, setHeaderRemarks] = useState<string>('Fast delivery required as per specification.');

  // RFQ Product Lines State — initial 4 product lines (Requirement #2)
  const [rfqLines, setRfqLines] = useState<DraftProductLine[]>([
    {
      productId: 'p6',
      productName: 'Paracetamol 500mg Tablets',
      dosageForm: 'Tablet',
      packSize: '10 x 10 Strip',
      quantity: 10000,
      requiredDate: '2026-09-15',
      remarks: 'Fast delivery'
    },
    {
      productId: 'p1',
      productName: 'Amoxicillin 250mg Tablets',
      dosageForm: 'Tablet',
      packSize: '10 x 10 Strip',
      quantity: 5000,
      requiredDate: '2026-09-15',
      remarks: 'Standard packaging'
    },
    {
      productId: 'p3',
      productName: 'Azithromycin 500mg Tablets',
      dosageForm: 'Tablet',
      packSize: '10 x 3 Strip',
      quantity: 2000,
      requiredDate: '2026-09-15',
      remarks: 'Export quality'
    },
    {
      productId: 'p4',
      productName: 'Pantoprazole 40mg + Domperidone 30mg SR',
      dosageForm: 'Capsule',
      packSize: '10 x 10 Strip',
      quantity: 3000,
      requiredDate: '2026-09-15',
      remarks: 'Alu-Alu blister packaging'
    }
  ]);

  // Distribution Summary Overlay State
  const [distributionResultModal, setDistributionResultModal] = useState<{
    rfqNumber: string;
    mfgRfqs: ManufacturerRFQ[];
    logs: string[];
  } | null>(null);

  // In-memory store for created Manufacturer RFQ distribution records
  const [manufacturerRfqsStore, setManufacturerRfqsStore] = useState<Record<string, ManufacturerRFQ[]>>({});

  // Specific Clicked Manufacturer Profile Drawer State (Requirement #1)
  const [clickedProfileMfgId, setClickedProfileMfgId] = useState<string | null>(null);

  // Supplier Quote Submission Drawer State
  const [supplierQuoteRfq, setSupplierQuoteRfq] = useState<RFQ | null>(null);
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});

  // Filtered RFQs for table view
  const filteredRfqs = useMemo(() => {
    return rfqs.filter(rfq => {
      const matchSearch =
        rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.lines.some(l => l.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || rfq.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rfqs, searchTerm, statusFilter]);

  // Derived Eligible Manufacturers for Step 3 & Step 4 Review
  const eligibleManufacturersForDraft = useMemo(() => {
    const validLines = rfqLines.filter(l => l.productId && l.quantity);
    const mfgMap = new Map<string, { mfg: Manufacturer; matchedProducts: string[] }>();

    validLines.forEach(line => {
      const lineMappings = mappings.filter(m => m.productId === line.productId);
      let matchedMfgIds = lineMappings.map(m => m.manufacturerId);

      if (matchedMfgIds.length === 0) {
        matchedMfgIds = manufacturers.slice(0, 2).map(m => m.id);
      }

      matchedMfgIds.forEach(mfgId => {
        const mfgObj = manufacturers.find(m => m.id === mfgId);
        if (!mfgObj) return;

        if (!mfgMap.has(mfgId)) {
          mfgMap.set(mfgId, { mfg: mfgObj, matchedProducts: [line.productName || 'Product'] });
        } else {
          const item = mfgMap.get(mfgId)!;
          if (!item.matchedProducts.includes(line.productName)) {
            item.matchedProducts.push(line.productName);
          }
        }
      });
    });

    return Array.from(mfgMap.values());
  }, [rfqLines, mappings, manufacturers]);

  // Handle Adding EXACTLY ONE EMPTY Product Row (Requirement #4)
  const handleAddEmptyProductRow = () => {
    setRfqLines(prev => [
      ...prev,
      {
        productId: '',
        productName: '',
        dosageForm: '',
        packSize: '',
        quantity: '',
        requiredDate: requiredDate || '2026-09-15',
        remarks: ''
      }
    ]);
  };

  // Handle Remove Product Row
  const handleRemoveRow = (idx: number) => {
    if (rfqLines.length === 1) return;
    setRfqLines(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle Row Field Change
  const handleRowChange = (idx: number, field: keyof DraftProductLine, value: any) => {
    setRfqLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;

      if (field === 'productId') {
        const found = products.find(p => p.id === value);
        if (found) {
          return {
            ...line,
            productId: value,
            productName: found.name,
            dosageForm: found.dosageForm,
            packSize: found.packSize,
            quantity: line.quantity || ''
          };
        } else {
          return { ...line, productId: '', productName: '', dosageForm: '', packSize: '' };
        }
      }

      return { ...line, [field]: value };
    }));
  };

  // Close creation drawer helper
  const closeDrawer = () => {
    setLocalShowCreateDrawer(false);
    setIsCreateRfqDrawerOpen(false);
    setRfqWizardStep(1);
    setValidationError(null);
  };

  // Open Edit Draft Drawer
  const handleOpenEditDraft = (rfq: RFQ) => {
    setIsEditingDraftId(rfq.id);
    setCustomerName(rfq.customerName);
    setRfqDate(rfq.createdDate);
    setDeadlineDate(rfq.deadlineDate);
    setHeaderRemarks(rfq.remarks || '');
    setRfqLines(rfq.lines.map(l => ({
      productId: l.productId,
      productName: l.productName,
      dosageForm: l.dosageForm,
      packSize: l.packSize,
      quantity: l.quantity,
      requiredDate: l.requiredDate,
      remarks: l.remarks || ''
    })));
    setRfqWizardStep(1);
    setLocalShowCreateDrawer(true);
  };

  // Navigation validation for Step 1 -> Step 2
  const handleContinueToGeneralTerms = () => {
    const validLines = rfqLines.filter(l => l.productId && l.quantity && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setValidationError('Please select at least one product line and specify a valid quantity greater than 0.');
      return;
    }
    setValidationError(null);
    setRfqWizardStep(2);
  };

  // Save RFQ as Draft
  const handleSaveDraft = () => {
    const validLines = rfqLines.filter(l => l.productId && l.quantity);
    if (validLines.length === 0) {
      setValidationError('Please select at least one product and enter a quantity.');
      return;
    }

    setValidationError(null);
    const rfqId = isEditingDraftId || `rfq_${Date.now()}`;

    const createdLines: RFQLine[] = validLines.map((line, idx) => ({
      id: `line_${Date.now()}_${idx}`,
      productId: line.productId,
      productName: line.productName,
      dosageForm: line.dosageForm,
      packSize: line.packSize,
      quantity: Number(line.quantity),
      requiredDate: line.requiredDate,
      remarks: line.remarks,
      eligibleManufacturersCount: 0
    }));

    const draftRfq: RFQ = {
      id: rfqId,
      rfqNumber: autoRfqNumber,
      customerId: 'c1',
      customerName,
      customerCode,
      createdDate: rfqDate,
      deadlineDate,
      status: 'Draft',
      lines: createdLines,
      remarks: headerRemarks,
      priority,
      deliveryLocation
    };

    addRFQ(draftRfq);
    addAuditLog('RFQ Center', `Saved ${autoRfqNumber} as Draft (Status = Draft)`);
    closeDrawer();
    setIsEditingDraftId(null);
  };

  // Submit RFQ & Execute Automatic System Floating (Requirements #4 & #5)
  const handleExecuteRFQSubmission = () => {
    const validLines = rfqLines.filter(l => l.productId && l.quantity && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setValidationError('Please select at least one product and specify a valid quantity greater than 0.');
      return;
    }

    setValidationError(null);
    const rfqId = isEditingDraftId || `rfq_${Date.now()}`;

    const createdLines: RFQLine[] = [];
    const createdMfgRfqsMap: Record<string, ManufacturerRFQ> = {};
    const notificationLogs: string[] = [];

    validLines.forEach((line, idx) => {
      const lineId = `line_${Date.now()}_${idx}`;

      // Query MANUFACTURER_PRODUCT table
      const lineMappings = mappings.filter(m => m.productId === line.productId);
      let eligibleMfgIds = lineMappings.map(m => m.manufacturerId);

      if (eligibleMfgIds.length === 0) {
        eligibleMfgIds = manufacturers.slice(0, 2).map(m => m.id);
      }

      eligibleMfgIds = Array.from(new Set(eligibleMfgIds));

      createdLines.push({
        id: lineId,
        productId: line.productId,
        productName: line.productName,
        dosageForm: line.dosageForm,
        packSize: line.packSize,
        quantity: Number(line.quantity),
        requiredDate: line.requiredDate,
        remarks: line.remarks,
        eligibleManufacturersCount: eligibleMfgIds.length,
        eligibleManufacturerIds: eligibleMfgIds
      });

      // Create MANUFACTURER_RFQ and MANUFACTURER_RFQ_LINE records
      eligibleMfgIds.forEach(mfgId => {
        const mfgObj = manufacturers.find(m => m.id === mfgId);
        const mfgName = mfgObj ? (mfgObj.companyName || mfgObj.name) : 'Verified Manufacturer';

        if (!createdMfgRfqsMap[mfgId]) {
          createdMfgRfqsMap[mfgId] = {
            id: `mfg_rfq_${Date.now()}_${mfgId}`,
            rfqId,
            rfqNumber: autoRfqNumber,
            manufacturerId: mfgId,
            manufacturerName: mfgName,
            status: 'Sent',
            sentDate: new Date().toISOString().split('T')[0],
            emailNotificationSent: true,
            smsNotificationSent: true,
            lines: []
          };

          // Send Email & SMS Notification
          notificationLogs.push(`📧 Email Notification sent to ${mfgObj?.email || 'contact@manufacturer.com'} for ${autoRfqNumber}`);
          notificationLogs.push(`📱 SMS Notification sent to ${mfgObj?.phone || '+91 98765 43210'} for ${autoRfqNumber}`);
        }

        createdMfgRfqsMap[mfgId].lines.push({
          id: `mfg_line_${Date.now()}_${idx}`,
          manufacturerRfqId: createdMfgRfqsMap[mfgId].id,
          rfqLineId: lineId,
          productId: line.productId,
          productName: line.productName,
          quantity: Number(line.quantity),
          requiredDate: line.requiredDate,
          remarks: line.remarks
        });
      });
    });

    const mfgRfqList = Object.values(createdMfgRfqsMap);

    const finalRfq: RFQ = {
      id: rfqId,
      rfqNumber: autoRfqNumber,
      customerId: 'c1',
      customerName,
      customerCode,
      createdDate: rfqDate,
      deadlineDate,
      status: 'Pricing In Progress',
      lines: createdLines,
      remarks: headerRemarks,
      priority,
      deliveryLocation
    };

    addRFQ(finalRfq);
    setManufacturerRfqsStore(prev => ({ ...prev, [rfqId]: mfgRfqList }));
    addAuditLog('RFQ Center', `Submitted ${autoRfqNumber} with ${createdLines.length} lines & floated to ${mfgRfqList.length} manufacturers (Status = Pricing In Progress)`);

    closeDrawer();
    setIsEditingDraftId(null);

    setDistributionResultModal({
      rfqNumber: autoRfqNumber,
      mfgRfqs: mfgRfqList,
      logs: notificationLogs
    });
  };

  // Manufacturer Submits Quote
  const handleOpenSupplierQuoteModal = (rfq: RFQ) => {
    setSupplierQuoteRfq(rfq);
    const initialPrices: Record<string, number> = {};
    rfq.lines.forEach(l => {
      initialPrices[l.id] = 12.00;
    });
    setQuotePrices(initialPrices);
  };

  const handleExecuteSupplierQuoteSubmission = () => {
    if (!supplierQuoteRfq) return;

    const quoteId = `q_${Date.now()}`;
    const mfgId = 'm1'; // SunBio LifeSciences Ltd default supplier ID
    const mfgObj = manufacturers.find(m => m.id === mfgId);
    const mfgName = mfgObj ? (mfgObj.companyName || mfgObj.name) : 'SunBio LifeSciences Ltd';

    const quoteLines: ManufacturerQuoteLine[] = supplierQuoteRfq.lines.map(l => {
      const uPrice = quotePrices[l.id] || 12.00;
      const total = uPrice * l.quantity;
      return {
        rfqLineId: l.id,
        productId: l.productId,
        productName: l.productName,
        unitPrice: uPrice,
        taxPercent: 12,
        discountPercent: 0,
        leadTimeDays: 14,
        moq: 1000,
        calculatedFinalPrice: total
      };
    });

    const totalAmount = quoteLines.reduce((acc, l) => acc + l.calculatedFinalPrice, 0);

    const newQuote: ManufacturerQuote = {
      id: quoteId,
      rfqId: supplierQuoteRfq.id,
      rfqNumber: supplierQuoteRfq.rfqNumber,
      manufacturerId: mfgId,
      manufacturerName: mfgName,
      submissionDate: new Date().toISOString().split('T')[0],
      validUntil: supplierQuoteRfq.deadlineDate,
      status: 'SUBMITTED',
      totalAmount,
      remarks: 'Submitted commercial quotation with 14-day SLA dispatch.',
      quoteLines
    };

    submitQuote(newQuote);

    setManufacturerRfqsStore(prev => {
      const existing = prev[supplierQuoteRfq.id] || [];
      const updated = existing.map(m => m.manufacturerId === mfgId ? { ...m, status: 'Responded' as DistributionStatus } : m);
      return { ...prev, [supplierQuoteRfq.id]: updated };
    });

    addAuditLog('Quote Center', `Supplier ${mfgName} submitted quote for ${supplierQuoteRfq.rfqNumber} (Total ₹${totalAmount.toLocaleString()})`);
    setSupplierQuoteRfq(null);
  };

  // ── RENDER SPECIFIC MANUFACTURER PROFILE DRAWER (Requirement #1 — RELEVANT MANUFACTURING CAPABILITIES) ──
  const renderSpecificManufacturerProfileDrawer = () => {
    if (!clickedProfileMfgId) return null;
    const mfg = manufacturers.find(m => m.id === clickedProfileMfgId) || manufacturers[0];

    const mfgMappedItems = mappings.filter(m => m.manufacturerId === mfg.id);
    const mfgProducts = mfgMappedItems.map(m => {
      const prd = products.find(p => p.id === m.productId);
      return { mapping: m, product: prd };
    }).filter(i => i.product !== undefined) as { mapping: ManufacturerProductMapping; product: Product }[];

    const mockHistoricalOrders = [
      { poNumber: 'PO-2026-001', productName: 'Paracetamol 500mg Tablets', quantity: 5000, date: '2026-06-10', status: 'Delivered' },
      { poNumber: 'PO-2026-002', productName: 'Amoxicillin 250mg Tablets', quantity: 3000, date: '2026-07-25', status: 'Delivered' }
    ];

    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'flex-end' }}
        onClick={() => setClickedProfileMfgId(null)}
      >
        <div
          style={{ width: '100%', maxWidth: 740, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-16px 0 40px rgba(15, 23, 42, 0.2)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <FactoryAvatar initials={(mfg.companyName || mfg.name).slice(0, 2).toUpperCase()} size={46} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{mfg.companyName || mfg.name}</h3>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.25)' }}>
                    Verified Manufacturer ✓
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  📍 {mfg.city}, {mfg.state} · Code: {mfg.code || 'MFG000401'}
                </div>
              </div>
            </div>

            <button onClick={() => setClickedProfileMfgId(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Company Overview */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 8, letterSpacing: '0.05em' }}>
                Company Information & Capabilities
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12.5 }}>
                <div><span style={{ color: '#64748B' }}>Manufacturer Code:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{mfg.code || 'MFG000401'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Location:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{mfg.city}, {mfg.state}</strong></div>
                <div><span style={{ color: '#64748B' }}>Experience:</span> <strong style={{ color: '#0F172A', display: 'block' }}>18+ Years</strong></div>
              </div>
            </div>

            {/* Certifications & Compliance */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 8, letterSpacing: '0.05em' }}>
                Certifications & Compliance
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                {['WHO-GMP Certified', 'CDSCO Form 28 License', 'ISO 9001:2015'].map(c => (
                  <div key={c} style={{ padding: '6px 12px', background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} /> {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Past Purchase / Order History */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 8, letterSpacing: '0.05em' }}>
                Past Purchase / Order History
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>PO Number</th>
                      <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Product</th>
                      <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Quantity</th>
                      <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Order Date</th>
                      <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHistoricalOrders.map(po => (
                      <tr key={po.poNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>{po.poNumber}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F172A' }}>{po.productName}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{po.quantity.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', color: '#475569' }}>{po.date}</td>
                        <td style={{ padding: '8px 12px', color: '#059669', fontWeight: 700 }}>✓ {po.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* REQUIREMENT #1: RELEVANT MANUFACTURING CAPABILITIES */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.05em' }}>
                Relevant Manufacturing Capabilities
              </div>

              {(() => {
                // Split mapped products into Current RFQ Products vs Other Capabilities
                const activeRfqProductIds = new Set(rfqLines.filter(l => l.productId).map(l => l.productId));
                const currentRfqItems = mfgProducts.filter(item => activeRfqProductIds.has(item.product.id));
                const otherItems = mfgProducts.filter(item => !activeRfqProductIds.has(item.product.id));

                const renderProductCard = (item: { mapping: ManufacturerProductMapping; product: Product }, isRfqMatch: boolean) => {
                  const { product, mapping } = item;
                  return (
                    <div key={product.id} style={{ padding: 14, background: '#FFFFFF', border: `1px solid ${isRfqMatch ? '#99F6E4' : '#CBD5E1'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isRfqMatch && <span style={{ color: '#0F766E', fontWeight: 900 }}>✓</span>}
                            <span>{product.name}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                            <strong>Generic:</strong> {product.genericName || product.name} · <strong>Salt:</strong> {product.saltCombination || 'Standard Compendial Formulation'}
                          </div>
                        </div>

                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: isRfqMatch ? 'rgba(15, 118, 110, 0.12)' : '#F1F5F9', color: isRfqMatch ? '#0F766E' : '#475569', border: `1px solid ${isRfqMatch ? 'rgba(15, 118, 110, 0.3)' : '#CBD5E1'}` }}>
                          {isRfqMatch ? 'Current RFQ Match' : 'Active Formulation'}
                        </span>
                      </div>

                      {/* Product Specifications Grid from Product Catalog */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11.5, marginTop: 4 }}>
                        <div><span style={{ color: '#64748B' }}>Strength:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{product.strength || 'N/A'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Dosage Form:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{product.dosageForm}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Pack Size:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{product.packSize}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Standard MOQ:</span> <strong style={{ color: '#0F766E', display: 'block', fontFamily: 'monospace' }}>{(mapping.moq || product.moq || 1000).toLocaleString()} Units</strong></div>
                        <div><span style={{ color: '#64748B' }}>Lead Time:</span> <strong style={{ color: '#0F766E', display: 'block' }}>{mapping.standardLeadTimeDays} Days</strong></div>
                        <div style={{ gridColumn: 'span 3' }}><span style={{ color: '#64748B' }}>Regulatory Info:</span> <span style={{ color: '#334155', fontWeight: 600, display: 'block' }}>{(product.regulatoryInfo || ['WHO-GMP Required', 'CDSCO Applicable']).join(' · ')}</span></div>
                      </div>
                    </div>
                  );
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* CURRENT RFQ PRODUCTS SUBSECTION */}
                    {currentRfqItems.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 8, letterSpacing: '0.04em' }}>
                          Current RFQ Products ({currentRfqItems.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {currentRfqItems.map(item => renderProductCard(item, true))}
                        </div>
                      </div>
                    )}

                    {/* OTHER MANUFACTURING CAPABILITIES SUBSECTION */}
                    {otherItems.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: 8, letterSpacing: '0.04em' }}>
                          Other Manufacturing Capabilities ({otherItems.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {otherItems.map(item => renderProductCard(item, false))}
                        </div>
                      </div>
                    )}

                    {mfgProducts.length === 0 && (
                      <div style={{ padding: 14, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, color: '#64748B', fontSize: 12.5 }}>
                        No catalog products currently mapped to this manufacturer.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, justifyContent: 'flex-between' }}>
            <button
              onClick={() => setClickedProfileMfgId(null)}
              style={{ padding: '10px 20px', background: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              ← Back to RFQ Manufacturer Review
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

      {/* Enterprise Header */}
      <div className="ent-command-bar" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div className="ent-command-bar-left" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(15, 118, 110, 0.10)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={22} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>Dashboard / RFQ Center</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              RFQ Sourcing & Distribution Engine
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Create multi-product RFQs, execute line-by-line manufacturer matching, review eligible suppliers, and track responses.
            </p>
          </div>
        </div>

        <div className="ent-command-bar-right" style={{ gap: 12 }}>
          {(currentRole === 'BUYER' || currentRole === 'ADMIN') && (
            <button
              onClick={() => {
                setIsEditingDraftId(null);
                setRfqWizardStep(1);
                setRfqLines([
                  { productId: 'p6', productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 10 Strip', quantity: 10000, requiredDate: '2026-09-15', remarks: 'Fast delivery' },
                  { productId: 'p1', productName: 'Amoxicillin 250mg Tablets', dosageForm: 'Tablet', packSize: '10 x 10 Strip', quantity: 5000, requiredDate: '2026-09-15', remarks: 'Standard packaging' },
                  { productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 3 Strip', quantity: 2000, requiredDate: '2026-09-15', remarks: 'Export quality' },
                  { productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 3000, requiredDate: '2026-09-15', remarks: 'Alu-Alu blister packaging' }
                ]);
                setLocalShowCreateDrawer(true);
              }}
              className="ent-btn-primary"
              style={{ padding: '10px 20px', gap: 8, fontWeight: 700, background: '#0F766E', borderColor: '#0F766E', color: '#FFFFFF', cursor: 'pointer' }}
            >
              <Plus size={16} /> + Create Master RFQ
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filter Controls Panel ───────────────────────── */}
      <div style={{ padding: 18, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
          
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px' }}>
            <Search size={16} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by RFQ Number, product name, or customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', padding: 0, background: 'transparent', width: '100%', fontSize: 13.5, color: '#0F172A', outline: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', ...supportedStatuses].map(st => {
              const isActive = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: isActive ? 700 : 500,
                    border: `1px solid ${isActive ? '#0F766E' : '#CBD5E1'}`,
                    background: isActive ? 'rgba(15, 118, 110, 0.1)' : '#FFFFFF',
                    color: isActive ? '#0F766E' : '#475569',
                    cursor: 'pointer', transition: 'all 150ms'
                  }}
                >
                  {st === 'ALL' ? `All (${rfqs.length})` : st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RFQ Data Table ───────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ Number</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Customer</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Product Lines Specified</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Dates</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Status</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 20 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRfqs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <EmptyRFQIllustration />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>No RFQs Found</div>
                    <div style={{ fontSize: 13, color: '#64748B', maxWidth: 400 }}>
                      No requisitions match your search filters. Click "+ Create Master RFQ" to assemble a multi-product RFQ.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRfqs.map(rfq => {
                const isExpanded = expandedRfqId === rfq.id;
                const rfqQuotes = quotes.filter(q => q.rfqId === rfq.id);

                return (
                  <React.Fragment key={rfq.id}>
                    <tr
                      onClick={() => setExpandedRfqId(isExpanded ? null : rfq.id)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', background: isExpanded ? '#F8FAFC' : '#FFFFFF', transition: 'background 0.15s ease' }}
                    >
                      {/* 1. RFQ Number */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {rfq.rfqNumber}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          Issued: {rfq.createdDate}
                        </div>
                      </td>

                      {/* 2. Customer */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{rfq.customerName}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{rfq.customerCode}</div>
                      </td>

                      {/* 3. Product Lines */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                          {rfq.lines[0]?.productName}
                        </div>
                        {rfq.lines.length > 1 && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', marginTop: 2 }}>
                            +{rfq.lines.length - 1} additional product lines
                          </div>
                        )}
                      </td>

                      {/* 4. Dates */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                          Req: {rfq.lines[0]?.requiredDate || rfq.deadlineDate}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          Deadline: {rfq.deadlineDate}
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
                            background: rfq.status === 'Draft' ? '#F1F5F9' : rfq.status === 'Pricing In Progress' ? 'rgba(15, 118, 110, 0.1)' : '#EFF6FF',
                            border: `1px solid ${rfq.status === 'Draft' ? '#CBD5E1' : rfq.status === 'Pricing In Progress' ? 'rgba(15, 118, 110, 0.25)' : '#BFDBFE'}`,
                            color: rfq.status === 'Draft' ? '#475569' : rfq.status === 'Pricing In Progress' ? '#0F766E' : '#1D4ED8'
                          }}
                        >
                          {rfq.status}
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td onClick={e => e.stopPropagation()} style={{ padding: '14px 16px', textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          {rfq.status === 'Draft' ? (
                            <button
                              onClick={() => handleOpenEditDraft(rfq)}
                              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.25)', cursor: 'pointer' }}
                            >
                              Edit Draft →
                            </button>
                          ) : (
                            <button
                              onClick={() => setExpandedRfqId(isExpanded ? null : rfq.id)}
                              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={13} /> {isExpanded ? 'Hide Details' : 'View RFQ & Quotes'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── EXPANDABLE BUYER RFQ VIEW WITH SUBMITTED QUOTES ── */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', padding: 0 }}>
                          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            
                            {/* RFQ Header Summary Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>RFQ Number</span><div style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{rfq.rfqNumber}</div></div>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>Customer</span><div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{rfq.customerName}</div></div>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>Quotation Deadline</span><div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{rfq.deadlineDate}</div></div>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>Header Remarks</span><div style={{ fontSize: 12.5, color: '#475569' }}>{rfq.remarks || 'None'}</div></div>
                            </div>

                            {/* Product Lines Table */}
                            <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                              <div style={{ padding: '10px 14px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                Requisition Product Lines ({rfq.lines.length})
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Product</th>
                                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Quantity</th>
                                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Required Date</th>
                                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rfq.lines.map((line, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>{line.productName}</td>
                                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()}</td>
                                      <td style={{ padding: '10px 12px', color: '#475569' }}>{line.requiredDate}</td>
                                      <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>{line.remarks || 'Standard packaging'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* SECTION: MANUFACTURER RFQS / SUBMITTED QUOTES */}
                            <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                              <div style={{ padding: '10px 14px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', fontSize: 12, fontWeight: 800, color: '#0F766E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>MANUFACTURER RFQs / SUBMITTED QUOTATIONS</span>
                              </div>

                              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {rfq.lines.map((line) => {
                                  const lineQuotes = rfqQuotes.flatMap(q =>
                                    q.quoteLines.filter(ql => ql.rfqLineId === line.id).map(ql => ({ quote: q, line: ql }))
                                  );

                                  return (
                                    <div key={line.id} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: 14 }}>
                                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                                        Product: {line.productName} — Quantity: {line.quantity.toLocaleString()}
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {manufacturers.slice(0, 3).map((mfg, mIdx) => {
                                          const rfqDeclinedList = (declinedRfqs && declinedRfqs[rfq.id]) || [];
                                          const decRecord = rfqDeclinedList.find(d => d.manufacturerId === mfg.id || d.manufacturerName?.includes(mfg.companyName || mfg.name));
                                          const isDeclined = !!decRecord;

                                          const matchingQuote = lineQuotes.find(q => q.quote.manufacturerId === mfg.id);
                                          const statusLabel = isDeclined ? 'DECLINED' : matchingQuote ? 'Responded' : mIdx === 0 ? 'Responded' : mIdx === 1 ? 'Opened' : 'Not Responded';
                                          const unitPrice = !isDeclined && matchingQuote ? matchingQuote.line.unitPrice : (!isDeclined && mIdx === 0) ? 12.00 : (!isDeclined && mIdx === 1) ? 11.50 : undefined;
                                          const totalCost = unitPrice ? unitPrice * line.quantity : undefined;

                                          return (
                                            <div key={mfg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5 }}>
                                              <div>
                                                {/* Clickable Manufacturer Name */}
                                                <span
                                                  onClick={() => setClickedProfileMfgId(mfg.id)}
                                                  style={{ fontWeight: 800, color: '#0F766E', cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                  {mfg.companyName || mfg.name}
                                                </span>
                                                <span style={{
                                                  fontSize: 11, marginLeft: 8, padding: '2px 6px', borderRadius: 4,
                                                  background: isDeclined ? '#FEE2E2' : statusLabel === 'Responded' ? 'rgba(15, 118, 110, 0.1)' : '#F1F5F9',
                                                  color: isDeclined ? '#B91C1C' : statusLabel === 'Responded' ? '#0F766E' : '#64748B',
                                                  border: isDeclined ? '1px solid #FCA5A5' : '1px solid #CBD5E1',
                                                  fontWeight: 700
                                                }}>
                                                  Status: {statusLabel}
                                                </span>
                                                {isDeclined && (
                                                  <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>
                                                    Reason: {decRecord?.declineReason || 'Required delivery date not achievable'}
                                                  </div>
                                                )}
                                              </div>

                                              <div>
                                                {isDeclined ? (
                                                  <span style={{ color: '#DC2626', fontSize: 12, fontWeight: 700 }}>Declined by Manufacturer</span>
                                                ) : unitPrice ? (
                                                  <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                                                    Unit Price: <strong>₹{unitPrice.toFixed(2)}</strong> · Total Cost: <strong style={{ color: '#0F766E' }}>₹{totalCost?.toLocaleString()}</strong>
                                                  </span>
                                                ) : (
                                                  <span style={{ color: '#94A3B8', fontSize: 12 }}>No Quote Submitted</span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── 4-STEP UNIFIED RFQ CREATION WIZARD DRAWER ── */}
      {showCreateDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={closeDrawer}>
          <div style={{ width: '100%', maxWidth: 780, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.15)' }} onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{autoRfqNumber}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>Step {rfqWizardStep} of 4</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>
                  {rfqWizardStep === 1 && 'Basic Information & Product Lines'}
                  {rfqWizardStep === 2 && 'General & RFQ Terms'}
                  {rfqWizardStep === 3 && 'Eligible Manufacturers Review'}
                  {rfqWizardStep === 4 && 'Review & Submit RFQ'}
                </h2>
              </div>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* 4-Step Indicator Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #E2E8F0', background: '#F1F5F9' }}>
              <div style={{ padding: '10px 8px', fontSize: 11.5, fontWeight: 700, color: rfqWizardStep === 1 ? '#0F766E' : '#64748B', borderBottom: rfqWizardStep === 1 ? '2px solid #0F766E' : 'none', background: rfqWizardStep === 1 ? '#FFFFFF' : 'transparent', textAlign: 'center' }}>
                1. Basic Info & Lines
              </div>
              <div style={{ padding: '10px 8px', fontSize: 11.5, fontWeight: 700, color: rfqWizardStep === 2 ? '#0F766E' : '#64748B', borderBottom: rfqWizardStep === 2 ? '2px solid #0F766E' : 'none', background: rfqWizardStep === 2 ? '#FFFFFF' : 'transparent', textAlign: 'center' }}>
                2. General & Terms
              </div>
              <div style={{ padding: '10px 8px', fontSize: 11.5, fontWeight: 700, color: rfqWizardStep === 3 ? '#0F766E' : '#64748B', borderBottom: rfqWizardStep === 3 ? '2px solid #0F766E' : 'none', background: rfqWizardStep === 3 ? '#FFFFFF' : 'transparent', textAlign: 'center' }}>
                3. Eligible Manufacturers
              </div>
              <div style={{ padding: '10px 8px', fontSize: 11.5, fontWeight: 700, color: rfqWizardStep === 4 ? '#0F766E' : '#64748B', borderBottom: rfqWizardStep === 4 ? '2px solid #0F766E' : 'none', background: rfqWizardStep === 4 ? '#FFFFFF' : 'transparent', textAlign: 'center' }}>
                4. Final Review & Submit
              </div>
            </div>

            {/* Form Validation Alert */}
            {validationError && (
              <div style={{ margin: '16px 24px 0', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#B91C1C', fontSize: 13 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{validationError}</span>
              </div>
            )}

            {/* ── STEP 1: BASIC INFORMATION & PRODUCT LINES BUILDER ── */}
            {rfqWizardStep === 1 && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Basic Info Header */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.05em' }}>
                    RFQ Header Details
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Auto RFQ Number</label>
                      <input type="text" disabled value={autoRfqNumber} style={{ width: '100%', padding: '8px 12px', background: '#E2E8F0', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontSize: 13, fontWeight: 800, fontFamily: 'monospace' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Buyer Name</label>
                      <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Company Name</label>
                      <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                  </div>
                </div>

                {/* PRODUCT LINES BUILDER (Requirement #4 — Strict Empty Row on Add) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>RFQ Product Lines ({rfqLines.length})</h4>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Add one or multiple products to include in this RFQ.</div>
                    </div>
                    <button
                      onClick={handleAddEmptyProductRow}
                      style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.25)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={14} /> + Add Product
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {rfqLines.map((line, idx) => (
                      <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Product Line #{idx + 1}
                          </span>
                          {rfqLines.length > 1 && (
                            <button onClick={() => handleRemoveRow(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }} title="Remove Line">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        {/* Product Selector (Starts Empty on Add) */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Product *</label>
                          <select
                            value={line.productId}
                            onChange={e => handleRowChange(idx, 'productId', e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: line.productId ? '#0F172A' : '#94A3B8', fontSize: 13, fontWeight: 600 }}
                          >
                            <option value="">[ Select Product ▼ ]</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity & Required Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Quantity *</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="[ Enter Quantity ]"
                              value={line.quantity}
                              onChange={e => handleRowChange(idx, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                              style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Required Date *</label>
                            <input
                              type="date"
                              value={line.requiredDate}
                              onChange={e => handleRowChange(idx, 'requiredDate', e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }}
                            />
                          </div>
                        </div>

                        {/* Line Remarks */}
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Remarks</label>
                          <input
                            type="text"
                            placeholder="[ Enter Remarks ]"
                            value={line.remarks}
                            onChange={e => handleRowChange(idx, 'remarks', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 12.5 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: GENERAL & TERMS ── */}
            {rfqWizardStep === 2 && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 14 }}>
                    General & Delivery Terms (Step 2)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>RFQ Date</label>
                      <input type="date" value={rfqDate} onChange={e => setRfqDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>General Required Date</label>
                      <input type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Priority Level</label>
                      <select value={priority} onChange={e => setPriority(e.target.value as any)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13, fontWeight: 600 }}>
                        <option value="STANDARD">STANDARD</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Quotation Deadline</label>
                      <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Delivery Location</label>
                    <input type="text" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Special Remarks / Instructions</label>
                    <textarea rows={3} value={headerRemarks} onChange={e => setHeaderRemarks(e.target.value)} placeholder="Enter delivery terms or packaging instructions..." style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: ELIGIBLE MANUFACTURERS REVIEW ── */}
            {rfqWizardStep === 3 && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div style={{ background: 'rgba(15, 118, 110, 0.06)', border: '1px solid rgba(15, 118, 110, 0.25)', borderRadius: 10, padding: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Eligible Manufacturers Review</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#475569' }}>
                    Based on the products in your RFQ, the system identified the following manufacturers. The RFQ will be automatically sent to all eligible manufacturers after submission.
                  </p>
                </div>

                {/* Manufacturer Review Cards (No Checkboxes / No Manual Selection) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {eligibleManufacturersForDraft.length === 0 ? (
                    <div style={{ padding: 24, textAlignment: 'center', color: '#64748B', fontSize: 13 }}>No eligible manufacturers found for selected products.</div>
                  ) : (
                    eligibleManufacturersForDraft.map(({ mfg, matchedProducts }) => (
                      <div key={mfg.id} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h4
                              onClick={() => setClickedProfileMfgId(mfg.id)}
                              style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F766E', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {mfg.companyName || mfg.name}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }}>
                                Verified Manufacturer ✓
                              </span>
                              <span style={{ fontSize: 12, color: '#64748B' }}>📍 {mfg.city}, {mfg.state}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setClickedProfileMfgId(mfg.id)}
                            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            View Profile →
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 12.5, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                          <div>
                            <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Products Matching RFQ</span>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{matchedProducts.join(', ')}</span>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Capabilities</span>
                            <span style={{ fontWeight: 600, color: '#334155' }}>Tablets / Capsules</span>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Certification</span>
                            <span style={{ fontWeight: 700, color: '#059669' }}>WHO-GMP</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 4: FINAL RFQ REVIEW & SUBMISSION (Requirement #2 — FULL UNCLIPPED PRODUCT LIST) ── */}
            {rfqWizardStep === 4 && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Header Information Summary */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 10 }}>
                    Review & Submit RFQ
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 12.5 }}>
                    <div><span style={{ color: '#64748B' }}>RFQ Number:</span> <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{autoRfqNumber}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Buyer:</span> <strong style={{ color: '#0F172A' }}>{buyerName}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Company:</span> <strong style={{ color: '#0F172A' }}>{customerName}</strong></div>
                    <div><span style={{ color: '#64748B' }}>RFQ Date:</span> <strong style={{ color: '#0F172A' }}>{rfqDate}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Required Date:</span> <strong style={{ color: '#0F172A' }}>{requiredDate}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Priority:</span> <strong style={{ color: '#D97706' }}>{priority}</strong></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B' }}>Delivery Location:</span> <span style={{ color: '#0F172A' }}>{deliveryLocation}</span></div>
                  </div>
                </div>

                {/* REQUIREMENT #2: REQUISITION PRODUCT LINES (Dynamic Count & UNCLIPPED List) */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    REQUISITION PRODUCT LINES ({rfqLines.filter(l => l.productId && l.quantity).length})
                  </div>
                  
                  {/* AUTO-EXPANDING UNCLIPPED CONTAINER */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {rfqLines.filter(l => l.productId && l.quantity).map((line, i) => (
                      <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{line.productName}</div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                            Required: {line.requiredDate} {line.remarks ? `· Remarks: ${line.remarks}` : ''}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: '#0F766E', fontSize: 14, fontFamily: 'monospace' }}>
                          {Number(line.quantity).toLocaleString()} Units
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eligible Manufacturers Summary */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                    {eligibleManufacturersForDraft.length} Eligible Manufacturers Identified
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {eligibleManufacturersForDraft.map(e => (
                      <span
                        key={e.mfg.id}
                        onClick={() => setClickedProfileMfgId(e.mfg.id)}
                        style={{ padding: '6px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#0F766E', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {e.mfg.companyName || e.mfg.name} →
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: '#0F766E', fontWeight: 600 }}>
                    ✓ Your RFQ will be automatically distributed to all eligible manufacturers after submission.
                  </div>
                </div>
              </div>
            )}

            {/* Drawer Footer Actions (Wizard Navigation) */}
            <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <div>
                {rfqWizardStep > 1 ? (
                  <button
                    onClick={() => setRfqWizardStep((rfqWizardStep - 1) as any)}
                    style={{ padding: '10px 18px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    [ Back ]
                  </button>
                ) : (
                  <button
                    onClick={closeDrawer}
                    style={{ padding: '10px 16px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Save Draft button accessible at Step 4 */}
                {rfqWizardStep === 4 && (
                  <button
                    onClick={handleSaveDraft}
                    style={{ padding: '10px 18px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    [ Save Draft ]
                  </button>
                )}

                {/* Wizard Next / Submit Buttons */}
                {rfqWizardStep === 1 && (
                  <button
                    onClick={handleContinueToGeneralTerms}
                    style={{ padding: '10px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    [ Continue to General & Terms → ]
                  </button>
                )}

                {rfqWizardStep === 2 && (
                  <button
                    onClick={() => setRfqWizardStep(3)}
                    style={{ padding: '10px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    [ Continue to Manufacturer Review → ]
                  </button>
                )}

                {rfqWizardStep === 3 && (
                  <button
                    onClick={() => setRfqWizardStep(4)}
                    style={{ padding: '10px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    [ Continue to RFQ Review → ]
                  </button>
                )}

                {rfqWizardStep === 4 && (
                  <button
                    onClick={handleExecuteRFQSubmission}
                    style={{ padding: '10px 24px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={15} /> [ Submit RFQ ]
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTOMATIC SYSTEM FLOATING RESULT OVERLAY ── */}
      {distributionResultModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', borderRadius: 14, padding: 24, boxShadow: '0 24px 48px rgba(15, 23, 42, 0.3)', border: '1px solid #CBD5E1' }}>
            
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(15, 118, 110, 0.12)', border: '1px solid rgba(15, 118, 110, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Send size={24} style={{ color: '#0F766E' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>RFQ System Floating Complete</h3>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                Query <strong>MANUFACTURER_PRODUCT</strong> executed. Main RFQ status updated to <strong>Pricing In Progress</strong>.
              </div>
            </div>

            {/* Created MANUFACTURER_RFQ Records Table */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '8px 12px', background: '#F1F5F9', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                MANUFACTURER_RFQ Distribution Records
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Eligible Manufacturer</th>
                    <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Matched Products</th>
                    <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Distribution Status</th>
                  </tr>
                </thead>
                <tbody>
                  {distributionResultModal.mfgRfqs.map(rec => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{rec.manufacturerName}</td>
                      <td style={{ padding: '8px 12px', color: '#334155' }}>{rec.lines.map(l => l.productName).join(', ')}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }}>
                          Status: {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notification Logs */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>
                Automated Notification Logs (Email & SMS)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: '#334155', fontFamily: 'monospace' }}>
                {distributionResultModal.logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setDistributionResultModal(null)}
                style={{ padding: '10px 24px', background: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Close & Track RFQ Status →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUFACTURER SUBMITS QUOTATION MODAL ── */}
      {supplierQuoteRfq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 620, background: '#FFFFFF', borderRadius: 14, padding: 24, boxShadow: '0 24px 48px rgba(15, 23, 42, 0.3)', border: '1px solid #CBD5E1' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Manufacturer Quote Submission</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  Submit Commercial Quotation for {supplierQuoteRfq.rfqNumber}
                </h3>
              </div>
              <button onClick={() => setSupplierQuoteRfq(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {supplierQuoteRfq.lines.map((line, idx) => {
                const uPrice = quotePrices[line.id] || 12.00;
                const totalCost = uPrice * line.quantity;

                return (
                  <div key={line.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      Product #{idx + 1}: {line.productName} (Qty: {line.quantity.toLocaleString()} Units)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Unit Price (₹ / Box) *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={uPrice}
                          onChange={e => setQuotePrices(prev => ({ ...prev, [line.id]: parseFloat(e.target.value) || 0 }))}
                          style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13, fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Total Cost (₹) (Calculated)</label>
                        <input
                          type="text"
                          disabled
                          value={`₹${totalCost.toLocaleString()}`}
                          style={{ width: '100%', padding: '8px 12px', background: '#E2E8F0', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontSize: 13, fontWeight: 800, fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSupplierQuoteRfq(null)}
                style={{ padding: '10px 16px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSupplierQuoteSubmission}
                style={{ padding: '10px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Submit Commercial Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLICKED MANUFACTURER PROFILE DRAWER OVERLAY ── */}
      {renderSpecificManufacturerProfileDrawer()}
    </div>
  );
};
