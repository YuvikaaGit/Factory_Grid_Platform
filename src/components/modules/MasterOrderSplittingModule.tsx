import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MasterOrder, SubOrder, SubOrderStatus } from '../../types';
import {
  ShoppingBag, Factory, CheckCircle2, Clock, ChevronRight, AlertCircle,
  Package, ArrowRight, Layers, FileText, ShieldCheck, Eye, Search, Filter, Check, X, ArrowLeft, FileCheck, Send, Building2
} from 'lucide-react';

export const MasterOrderSplittingModule: React.FC = () => {
  const { orders, currentRole, manufacturers, setActiveTab, addAuditLog } = useApp();

  // Navigation View Modes:
  // 'LIST' | 'DETAILS' | 'ORIGINAL_QUOTE' | 'SPLIT_PREVIEW' | 'SPLIT_SUCCESS' | 'SUB_ORDERS_LIST' | 'SUB_ORDER_DETAIL' | 'PO_CREATION_LIST' | 'CREATE_PO_FORM' | 'PO_SUCCESS' | 'PO_DETAIL'
  const [viewMode, setViewMode] = useState<
    'LIST' | 'DETAILS' | 'ORIGINAL_QUOTE' | 'SPLIT_PREVIEW' | 'SPLIT_SUCCESS' | 'SUB_ORDERS_LIST' | 'SUB_ORDER_DETAIL' | 'PO_CREATION_LIST' | 'CREATE_PO_FORM' | 'PO_SUCCESS' | 'PO_DETAIL'
  >('DETAILS');

  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [selectedSubOrderCode, setSelectedSubOrderCode] = useState<string>('SO-1001-01');
  const [targetPoSubOrderCode, setTargetPoSubOrderCode] = useState<string>('SO-1001-01');

  // Persisted Created POs State: Record<subOrderCode, { poNumber: string; createdDate: string; status: 'Created' | 'Accepted' | 'Rejected'; rejectionReason?: string }>
  const [createdPos, setCreatedPos] = useState<Record<string, { poNumber: string; createdDate: string; status: 'Created' | 'Accepted' | 'Rejected'; rejectionReason?: string }>>({
    'SO-1001-01': { poNumber: 'PO-2026-1001-01', createdDate: '14 Aug 2026', status: 'Created' },
    'SO-1001-02': { poNumber: 'PO-2026-1001-02', createdDate: '14 Aug 2026', status: 'Created' }
  });

  // List View Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Order Splitting State
  const [isSplitComplete, setIsSplitComplete] = useState<boolean>(true);

  const activeMasterOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || orders[0];
  }, [orders, selectedOrderId]);

  // Role Checks
  const isBuyer = currentRole === 'BUYER' || currentRole === 'ADMIN';
  const isManufacturer = currentRole === 'SUPPLIER';

  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';

  // Sub-orders dataset for active master order
  const subOrdersDataset = useMemo(() => {
    return [
      {
        code: 'SO-1001-01',
        poCode: 'PO-2026-1001-01',
        mfgId: 'm1',
        mfgName: 'SunBio LifeSciences Ltd.',
        mfgCode: 'SUN-PHARM',
        productsCount: 2,
        totalQuantity: 12000,
        orderValue: 195300,
        subtotal: 180000,
        taxTotal: 21600,
        discountTotal: 6300,
        leadTimeDays: 14,
        status: createdPos['SO-1001-01']?.status || 'Open',
        lines: [
          { productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 9.66, taxPercent: 12, discountPercent: 5, finalPrice: 10.28, totalCost: 102800, leadTime: '14 Days' },
          { productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', quantity: 2000, unitPrice: 15.00, taxPercent: 18, discountPercent: 0, finalPrice: 16.80, totalCost: 92500, leadTime: '12 Days' }
        ]
      },
      {
        code: 'SO-1001-02',
        poCode: 'PO-2026-1001-02',
        mfgId: 'm2',
        mfgName: 'Cipla Partner Formulations Ltd.',
        mfgCode: 'CIPLA-PARTNER',
        productsCount: 1,
        totalQuantity: 5000,
        orderValue: 57500,
        subtotal: 57500,
        taxTotal: 6900,
        discountTotal: 1725,
        leadTimeDays: 10,
        status: createdPos['SO-1001-02']?.status || 'Open',
        lines: [
          { productName: 'Amoxicillin 250mg Tablets', dosageForm: 'Capsule', quantity: 5000, unitPrice: 11.50, taxPercent: 12, discountPercent: 3, finalPrice: 12.40, totalCost: 57500, leadTime: '10 Days' }
        ]
      }
    ];
  }, [createdPos]);

  const activeSubOrderObj = useMemo(() => {
    return subOrdersDataset.find(s => s.code === selectedSubOrderCode) || subOrdersDataset[0];
  }, [subOrdersDataset, selectedSubOrderCode]);

  const targetPoSubOrderObj = useMemo(() => {
    return subOrdersDataset.find(s => s.code === targetPoSubOrderCode) || subOrdersDataset[0];
  }, [subOrdersDataset, targetPoSubOrderCode]);

  // PO Created Count & Status Logic
  const poCreatedCount = Object.keys(createdPos).length;
  const masterPoStatus = useMemo(() => {
    const statuses = Object.values(createdPos).map(p => p.status);
    if (statuses.length === 0) return 'Open';
    if (statuses.every(s => s === 'Accepted')) return 'Processing (All Accepted)';
    if (statuses.some(s => s === 'Accepted')) return 'In Fulfillment';
    if (statuses.some(s => s === 'Rejected')) return 'Attention Required (PO Rejected)';
    return 'POs Created';
  }, [createdPos]);

  // Handle Order Splitting Action
  const handleExecuteSplitOrders = () => {
    setIsSplitComplete(true);
    setViewMode('SPLIT_SUCCESS');
    addAuditLog('Order Engine', `Split Master Order MO-2026-1001 into 2 manufacturer sub-orders.`);
  };

  // Handle Create PO Confirmation Action
  const handleConfirmCreatePO = (subOrderCode: string) => {
    const targetObj = subOrdersDataset.find(s => s.code === subOrderCode) || subOrdersDataset[0];
    setCreatedPos(prev => ({
      ...prev,
      [subOrderCode]: {
        poNumber: targetObj.poCode,
        createdDate: '14 Aug 2026',
        status: 'Created'
      }
    }));
    addAuditLog('PO Engine', `Created Purchase Order ${targetObj.poCode} for Sub-Order ${subOrderCode} (${targetObj.mfgName}).`);
    setViewMode('PO_SUCCESS');
  };

  // Filter Master Orders for List View
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.rfqNumber?.toLowerCase().includes(q) ||
        o.subOrders.some(s => s.manufacturerName.toLowerCase().includes(q));

      let matchStatus = true;
      if (statusFilter === 'OPEN') matchStatus = o.status === 'APPROVED' || o.status === 'CREATED' || o.status === 'PROCESSING';
      else if (statusFilter === 'CLOSED') matchStatus = o.status === 'COMPLETED';

      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // ── 1. ORIGINAL QUOTE DETAILS READ-ONLY VIEW (`viewMode === 'ORIGINAL_QUOTE'`) ──
  if (viewMode === 'ORIGINAL_QUOTE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Breadcrumb & Command Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Original Quote Details</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Original Customer Quotation Details (QUOTE-1001)
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Read-Only Source Quotation for Master Order <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Master Order
            </button>
          </div>
        </div>

        {/* Read-Only Quote Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quote Number</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>QUOTE-1001</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Source RFQ: RFQ-2026-1001</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>Apex Pharma PCD Franchise</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Authorized Procurement Entity</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quote Status</div>
            <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', display: 'inline-block', marginTop: 4 }}>
              APPROVED
            </span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Dates</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>Created: 14 Aug 2026</div>
            <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>Approved: 14 Aug 2026</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #0F766E', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Total Quote Value</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>₹2,52,800</div>
            <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>Fixed Commercial Contract</div>
          </div>
        </div>

        {/* Selected Suppliers Allocation Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12 }}>
            SELECTED SUPPLIERS MATRIX
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5 }}>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>Paracetamol 500mg Tablets</div>
              <div style={{ color: '#0F766E', fontWeight: 800, fontSize: 14, marginTop: 2 }}>→ SunBio LifeSciences Ltd.</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5 }}>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>Amoxicillin 250mg Tablets</div>
              <div style={{ color: '#0F766E', fontWeight: 800, fontSize: 14, marginTop: 2 }}>→ Cipla Partner Formulations Ltd.</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5 }}>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>Azithromycin 500mg Tablets</div>
              <div style={{ color: '#0F766E', fontWeight: 800, fontSize: 14, marginTop: 2 }}>→ SunBio LifeSciences Ltd.</div>
            </div>
          </div>
        </div>

        {/* Read-Only Product Line Items Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>ORIGINAL QUOTATION LINE ITEMS (3 Products)</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Approved commercial baseline. Read-only view.</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>REQUIRED DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SELECTED MANUFACTURER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TAX %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISCOUNT %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>FINAL PRICE / UNIT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>LEAD TIME</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Paracetamol 500mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>10,000 Units</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>14 Aug 2026</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>SunBio LifeSciences Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹9.66</td>
                  <td style={{ padding: '12px 14px' }}>12%</td>
                  <td style={{ padding: '12px 14px' }}>5%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹10.28</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹1,02,800</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>14 Days</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Amoxicillin 250mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>5,000 Units</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>14 Aug 2026</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>Cipla Partner Formulations Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹11.50</td>
                  <td style={{ padding: '12px 14px' }}>12%</td>
                  <td style={{ padding: '12px 14px' }}>3%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹12.40</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹57,500</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>10 Days</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Azithromycin 500mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>2,000 Units</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>14 Aug 2026</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>SunBio LifeSciences Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹15.00</td>
                  <td style={{ padding: '12px 14px' }}>18%</td>
                  <td style={{ padding: '12px 14px' }}>0%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹16.80</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹92,500</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>12 Days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // ── 2. DEDICATED PURCHASE ORDER DETAIL VIEW (`viewMode === 'PO_DETAIL'`) ──
  if (viewMode === 'PO_DETAIL' && targetPoSubOrderObj) {
    const poInfo = createdPos[targetPoSubOrderObj.code] || { poNumber: targetPoSubOrderObj.poCode, createdDate: '14 Aug 2026', status: 'Created' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

        {/* Breadcrumb & Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('PO_CREATION_LIST')}>Purchase Orders</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{poInfo.poNumber}</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              PURCHASE ORDER: {poInfo.poNumber}
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Supplier: <strong style={{ color: '#0F766E' }}>{targetPoSubOrderObj.mfgName}</strong> · Parent Master Order: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>MO-2026-1001</strong> · Sub-Order: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{targetPoSubOrderObj.code}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('SUB_ORDERS_LIST')} style={{ padding: '8px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              Back to Sub-Orders
            </button>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Master Order
            </button>
          </div>
        </div>

        {/* PO Meta Summary Grid */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Supplier / Manufacturer</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', marginTop: 2 }}>{targetPoSubOrderObj.mfgName}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Buyer Entity</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Parent Master Order</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Code</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{targetPoSubOrderObj.code}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Source Quote</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>QUOTE-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Status</div>
            <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: poInfo.status === 'Accepted' ? '#DCFCE7' : poInfo.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7', color: poInfo.status === 'Accepted' ? '#15803D' : poInfo.status === 'Rejected' ? '#B91C1C' : '#B45309', border: '1px solid #CBD5E1', display: 'inline-block', marginTop: 2 }}>
              {poInfo.status}
            </span>
          </div>
        </div>

        {/* Commercial Terms & Addresses */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 12.5 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Date & Expected Delivery</div>
            <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>PO Date: 14 Aug 2026</div>
            <div style={{ fontWeight: 700, color: '#1D4ED8', marginTop: 1 }}>Expected Delivery: 2026-09-02</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Payment & Freight Terms</div>
            <div style={{ fontWeight: 600, color: '#334155', marginTop: 2 }}>Payment Terms: Net 30 Days</div>
            <div style={{ fontWeight: 600, color: '#334155', marginTop: 1 }}>Delivery: Door Delivery / Cold-Chain</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Billing Address</div>
            <div style={{ color: '#334155', marginTop: 2 }}>Apex Pharma HQ, Sector 18, Gurugram, Haryana</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Shipping Address</div>
            <div style={{ color: '#334155', marginTop: 2 }}>Apex Pharma Logistics Depot, Baddi, HP</div>
          </div>
        </div>

        {/* PO Line Items Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>ORDER ITEMS ({targetPoSubOrderObj.lines.length} Line Items)</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Contains strictly items assigned to this purchase order.</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TAX %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISCOUNT %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>FINAL PRICE / UNIT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>LEAD TIME</th>
                </tr>
              </thead>
              <tbody>
                {targetPoSubOrderObj.lines.map((line, lIdx) => (
                  <tr key={lIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>₹{line.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{line.taxPercent}%</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{line.discountPercent}%</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{line.finalPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>₹{line.totalCost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>{line.leadTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PO Commercial Summary Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Subtotal</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>₹{targetPoSubOrderObj.subtotal.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>GST & Tax</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>₹{targetPoSubOrderObj.taxTotal.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Discount Applied</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace', marginTop: 2 }}>-₹{targetPoSubOrderObj.discountTotal.toLocaleString()}</div>
          </div>
          <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Grand Total PO Value</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>₹{targetPoSubOrderObj.orderValue.toLocaleString()}</div>
          </div>
        </div>

      </div>
    );
  }

  // ── 3. PURCHASE ORDER CREATION SUCCESS SCREEN (`viewMode === 'PO_SUCCESS'`) ──
  if (viewMode === 'PO_SUCCESS' && targetPoSubOrderObj) {
    const poInfo = createdPos[targetPoSubOrderObj.code] || { poNumber: targetPoSubOrderObj.poCode, createdDate: '14 Aug 2026', status: 'Created' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Success Banner */}
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 24, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#15803D', letterSpacing: '0.06em' }}>PURCHASE ORDER CREATED</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#166534' }}>
                {poInfo.poNumber} Created Successfully
              </h2>
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: '#166534', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
            <div>✓ <strong>{poInfo.poNumber}</strong> created successfully</div>
            <div>✓ Linked to Sub-Order <strong style={{ fontFamily: 'monospace' }}>{targetPoSubOrderObj.code}</strong></div>
            <div>✓ Purchase Order notification queued for <strong>{targetPoSubOrderObj.mfgName}</strong></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <button onClick={() => setViewMode('PO_CREATION_LIST')} style={{ padding: '9px 18px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Back to Purchase Orders
          </button>

          <button onClick={() => setViewMode('PO_DETAIL')} style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            View Purchase Order →
          </button>
        </div>

      </div>
    );
  }

  // ── 4. CREATE PO FORM & REVIEW VIEW (`viewMode === 'CREATE_PO_FORM'`) ──
  if (viewMode === 'CREATE_PO_FORM' && targetPoSubOrderObj) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Header Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>PURCHASE ORDER ENGINE</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Create Purchase Order
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Review commercial terms before issuing PO to <strong style={{ color: '#0F766E' }}>{targetPoSubOrderObj.mfgName}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('PO_CREATION_LIST')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={() => handleConfirmCreatePO(targetPoSubOrderObj.code)} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Create Purchase Order →
            </button>
          </div>
        </div>

        {/* PO Key Details Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Auto-Generated PO Number</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{targetPoSubOrderObj.poCode}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Parent Master Order</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Code</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{targetPoSubOrderObj.code}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Manufacturer</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{targetPoSubOrderObj.mfgName}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>
        </div>

        {/* PO Line Items Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>PO PRODUCTS FOR {targetPoSubOrderObj.mfgName}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Line items derived strictly from approved quotation values.</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TAX %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISCOUNT %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>FINAL PRICE / UNIT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>LEAD TIME</th>
                </tr>
              </thead>
              <tbody>
                {targetPoSubOrderObj.lines.map((line, lIdx) => (
                  <tr key={lIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>₹{line.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{line.taxPercent}%</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{line.discountPercent}%</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{line.finalPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>₹{line.totalCost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>{line.leadTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commercial Terms & Summary Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Subtotal</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>₹{targetPoSubOrderObj.subtotal.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tax (GST)</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>₹{targetPoSubOrderObj.taxTotal.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Discount</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace', marginTop: 2 }}>-₹{targetPoSubOrderObj.discountTotal.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Expected Delivery</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>2026-09-02</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Payment & Delivery Terms</div>
            <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>Net 30 Days · Cold-Chain Delivery</div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(15,23,42,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setViewMode('PO_CREATION_LIST')} style={{ padding: '9px 18px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => handleConfirmCreatePO(targetPoSubOrderObj.code)} style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Create Purchase Order →
          </button>
        </div>

      </div>
    );
  }

  // ── 5. PURCHASE ORDER CREATION LIST VIEW (`viewMode === 'PO_CREATION_LIST'`) ──
  if (viewMode === 'PO_CREATION_LIST' && activeMasterOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Breadcrumb & Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Purchase Orders</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Purchase Orders
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Create manufacturer-specific purchase orders from Master Order <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Master Order
            </button>
          </div>
        </div>

        {/* Master Summary Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Orders</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>2 Sub-Orders</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Progress</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', marginTop: 2 }}>{poCreatedCount} / 2 Created</div>
          </div>
        </div>

        {/* Purchase Orders List Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {subOrdersDataset.map(so => {
            const hasPo = !!createdPos[so.code];
            const poData = createdPos[so.code];

            return (
              <div key={so.code} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                      {hasPo ? poData.poNumber : `Sub-Order: ${so.code}`}
                    </span>
                    {hasPo ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: poData.status === 'Accepted' ? '#DCFCE7' : poData.status === 'Rejected' ? '#FEE2E2' : '#E0F2FE', color: poData.status === 'Accepted' ? '#15803D' : poData.status === 'Rejected' ? '#B91C1C' : '#0369A1', border: '1px solid #CBD5E1' }}>
                        {poData.status}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                        PO Not Created
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>{so.mfgName}</h3>

                  <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    <div>Linked Sub-Order: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{so.code}</strong></div>
                    <div>Product Lines: <strong style={{ color: '#0F172A' }}>{so.productsCount} {so.productsCount > 1 ? 'Products' : 'Product'}</strong></div>
                    <div>Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{so.totalQuantity.toLocaleString()} Units</strong></div>
                    <div>PO Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{so.orderValue.toLocaleString()}</strong></div>
                    <div>Lead Time: <strong style={{ color: '#1D4ED8' }}>{so.leadTimeDays} Days</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                  {hasPo ? (
                    <button
                      onClick={() => {
                        setTargetPoSubOrderCode(so.code);
                        setViewMode('PO_DETAIL');
                      }}
                      style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      View PO →
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTargetPoSubOrderCode(so.code);
                        setViewMode('CREATE_PO_FORM');
                      }}
                      style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      Create PO →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Manufacturer Notification Queue Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 10 }}>
            MANUFACTURER PO NOTIFICATION QUEUE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#15803D' }}>
            {createdPos['SO-1001-01'] ? (
              <div>✓ PO-2026-1001-01 created — Purchase Order notification queued for SunBio LifeSciences Ltd.</div>
            ) : (
              <div style={{ color: '#64748B' }}>○ SO-1001-01 — Pending PO Creation (SunBio LifeSciences Ltd.)</div>
            )}
            {createdPos['SO-1001-02'] ? (
              <div>✓ PO-2026-1001-02 created — Purchase Order notification queued for Cipla Partner Formulations Ltd.</div>
            ) : (
              <div style={{ color: '#64748B' }}>○ SO-1001-02 — Pending PO Creation (Cipla Partner Formulations Ltd.)</div>
            )}
          </div>
        </div>

      </div>
    );
  }

  // ── 6. SUB-ORDER DETAILS VIEW (`viewMode === 'SUB_ORDER_DETAIL'`) ──
  if (viewMode === 'SUB_ORDER_DETAIL' && activeSubOrderObj) {
    const hasPoForThisSubOrder = !!createdPos[activeSubOrderObj.code];
    const poDataForThisSubOrder = createdPos[activeSubOrderObj.code];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

        {/* Breadcrumb & Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('SUB_ORDERS_LIST')}>Sub-Orders</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{activeSubOrderObj.code}</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              SUB-ORDER: {activeSubOrderObj.code}
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Manufacturer: <strong style={{ color: '#0F766E' }}>{activeSubOrderObj.mfgName}</strong> · Parent Master Order: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>MO-2026-1001</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('SUB_ORDERS_LIST')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Sub-Orders
            </button>
          </div>
        </div>

        {/* Sub-Order Meta Summary Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Code</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeSubOrderObj.code}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Manufacturer</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{activeSubOrderObj.mfgName}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Parent Master Order</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Status</div>
            <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: hasPoForThisSubOrder ? '#DCFCE7' : '#FEF3C7', color: hasPoForThisSubOrder ? '#15803D' : '#B45309', border: '1px solid #CBD5E1', display: 'inline-block', marginTop: 2 }}>
              {activeSubOrderObj.status}
            </span>
          </div>
        </div>

        {/* PO Section Bar inside Sub-Order Detail */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>PURCHASE ORDER STATUS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
              {hasPoForThisSubOrder ? (
                <span>PO Status: <strong style={{ color: '#16A34A' }}>{poDataForThisSubOrder.status}</strong> ({poDataForThisSubOrder.poNumber})</span>
              ) : (
                <span>PO Status: <strong style={{ color: '#B45309' }}>Not Created</strong></span>
              )}
            </div>
          </div>

          <div>
            {hasPoForThisSubOrder ? (
              <button
                onClick={() => {
                  setTargetPoSubOrderCode(activeSubOrderObj.code);
                  setViewMode('PO_DETAIL');
                }}
                style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
              >
                View PO →
              </button>
            ) : (
              <button
                onClick={() => {
                  setTargetPoSubOrderCode(activeSubOrderObj.code);
                  setViewMode('CREATE_PO_FORM');
                }}
                style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
              >
                Create PO →
              </button>
            )}
          </div>
        </div>

        {/* Sub-Order Assigned Product Lines Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
              ORDER LINES FOR {activeSubOrderObj.mfgName} ({activeSubOrderObj.lines.length} Line Items)
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Showing strictly products assigned to this manufacturer.
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TAX %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISCOUNT %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>FINAL PRICE / UNIT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>LEAD TIME</th>
                </tr>
              </thead>
              <tbody>
                {activeSubOrderObj.lines.map((line, lIdx) => (
                  <tr key={lIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>₹{line.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{line.taxPercent}%</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{line.discountPercent}%</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{line.finalPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>₹{line.totalCost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>{line.leadTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // ── 7. DEDICATED SUB-ORDERS LIST VIEW (`viewMode === 'SUB_ORDERS_LIST'`) ──
  if (viewMode === 'SUB_ORDERS_LIST' && activeMasterOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Breadcrumb & Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Sub-Orders</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Sub-Orders
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Manufacturer-specific orders created from Master Order <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Master Order
            </button>
          </div>
        </div>

        {/* Master Summary Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Orders Created</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>2 Sub-Orders</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Status</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', marginTop: 2 }}>{poCreatedCount} / 2 POs Created</div>
          </div>
        </div>

        {/* Sub-Orders Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {subOrdersDataset.map(so => {
            const hasPo = !!createdPos[so.code];

            return (
              <div key={so.code} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{so.code}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                      {so.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>{so.mfgName}</h3>

                  <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    <div>Product Lines: <strong style={{ color: '#0F172A' }}>{so.productsCount} {so.productsCount > 1 ? 'Products' : 'Product'}</strong></div>
                    <div>Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{so.totalQuantity.toLocaleString()} Units</strong></div>
                    <div>Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{so.orderValue.toLocaleString()}</strong></div>
                    <div>Lead Time: <strong style={{ color: '#1D4ED8' }}>{so.leadTimeDays} Days</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => {
                      setSelectedSubOrderCode(so.code);
                      setViewMode('SUB_ORDER_DETAIL');
                    }}
                    style={{ padding: '8px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    View Sub-Order →
                  </button>

                  {hasPo ? (
                    <button
                      onClick={() => {
                        setTargetPoSubOrderCode(so.code);
                        setViewMode('PO_DETAIL');
                      }}
                      style={{ padding: '8px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      View PO →
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTargetPoSubOrderCode(so.code);
                        setViewMode('CREATE_PO_FORM');
                      }}
                      style={{ padding: '8px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      Create PO →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Purchase Orders Section Bar below Sub-Orders */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
              PURCHASE ORDERS ENGINE
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>
              Create and manage manufacturer-specific Purchase Orders. ({poCreatedCount} / 2 Created)
            </div>
          </div>

          <button onClick={() => setViewMode('PO_CREATION_LIST')} style={{ padding: '9px 20px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {poCreatedCount > 0 ? 'View Purchase Orders →' : 'Create Purchase Orders →'}
          </button>
        </div>

      </div>
    );
  }

  // ── 8. SPLIT SUCCESS CONFIRMATION SCREEN (`viewMode === 'SPLIT_SUCCESS'`) ──
  if (viewMode === 'SPLIT_SUCCESS') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Success Banner */}
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 24, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#15803D', letterSpacing: '0.06em' }}>ORDER SPLIT SUCCESSFULLY</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#166534' }}>
                Master Order MO-2026-1001 Split Complete
              </h2>
            </div>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 13.5, color: '#166534', fontWeight: 500 }}>
            2 manufacturer-specific Sub-Orders have been created successfully from Master Order <strong style={{ fontFamily: 'monospace' }}>MO-2026-1001</strong>.
          </p>
        </div>

        {/* Created Sub-Orders Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>✓ SO-1001-01</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>Open</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>SunBio LifeSciences Ltd.</h3>
            <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Product Lines: <strong>2 Product Lines</strong></div>
              <div>Total Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>12,000 Units</strong></div>
              <div>Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹1,95,300</strong></div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>✓ SO-1001-02</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>Open</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>Cipla Partner Formulations Ltd.</h3>
            <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Product Lines: <strong>1 Product Line</strong></div>
              <div>Total Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>5,000 Units</strong></div>
              <div>Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹57,500</strong></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <button onClick={() => setViewMode('DETAILS')} style={{ padding: '9px 18px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Back to Master Order
          </button>

          <button onClick={() => setViewMode('SUB_ORDERS_LIST')} style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            View Sub-Orders →
          </button>
        </div>

      </div>
    );
  }

  // ── 9. ORDER SPLITTING PREVIEW VIEW (`viewMode === 'SPLIT_PREVIEW'`) ──
  if (viewMode === 'SPLIT_PREVIEW' && activeMasterOrder) {
    const splitGroups = [
      {
        subOrderNumber: 'SO-1001-01',
        manufacturerName: 'SunBio LifeSciences Ltd.',
        mfgCode: 'SUN-PHARM',
        productsCount: 2,
        totalQuantity: 12000,
        totalValue: 195300,
        leadTimeDays: 14,
        products: ['Paracetamol 500mg Tablets (10,000)', 'Azithromycin 500mg Tablets (2,000)']
      },
      {
        subOrderNumber: 'SO-1001-02',
        manufacturerName: 'Cipla Partner Formulations Ltd.',
        mfgCode: 'CIPLA-PARTNER',
        productsCount: 1,
        totalQuantity: 5000,
        totalValue: 57500,
        leadTimeDays: 10,
        products: ['Amoxicillin 250mg Tablets (5,000)']
      }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Header Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>AUTOMATED SOURCING SPLIT</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Order Splitting Preview
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              The Master Order <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</strong> will be automatically split into manufacturer-specific Sub-Orders.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              Back
            </button>
            <button onClick={handleExecuteSplitOrders} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Create Sub-Orders →
            </button>
          </div>
        </div>

        {/* Split Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {splitGroups.map((group, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{group.subOrderNumber}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                    Ready to Create
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>{group.manufacturerName}</h3>

                <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                  <div>Product Lines: <strong style={{ color: '#0F172A' }}>{group.productsCount} Product Lines</strong></div>
                  <div>Total Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{group.totalQuantity.toLocaleString()} Units</strong></div>
                  <div>Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{group.totalValue.toLocaleString()}</strong></div>
                  <div>Lead Time: <strong style={{ color: '#1D4ED8' }}>{group.leadTimeDays} Days</strong></div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', fontSize: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Assigned Products</div>
                  {group.products.map((p, pIdx) => (
                    <div key={pIdx} style={{ color: '#334155', fontWeight: 600 }}>• {p}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(15,23,42,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>
            2 Sub-Orders will be created from Master Order MO-2026-1001
          </div>
          <button onClick={handleExecuteSplitOrders} style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Create Sub-Orders →
          </button>
        </div>

      </div>
    );
  }

  // ── 10. MASTER ORDER DETAILS VIEW (`viewMode === 'DETAILS'`) ─────────
  if (viewMode === 'DETAILS' && activeMasterOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Breadcrumb & Command Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>MO-2026-1001</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Master Order MO-2026-1001
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Customer: <strong style={{ color: '#0F172A' }}>Apex Pharma PCD Franchise</strong> · Source Quote: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>QUOTE-1001</strong> · Sub-Orders: <strong style={{ color: '#0F766E' }}>{isSplitComplete ? '2 Created' : 'Pending Split'}</strong> · POs: <strong style={{ color: '#0F766E' }}>{poCreatedCount} / 2 Created</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('ORIGINAL_QUOTE')} style={{ padding: '8px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              View Original Quote
            </button>

            {isSplitComplete ? (
              <>
                <button onClick={() => setViewMode('SUB_ORDERS_LIST')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  View Sub-Orders →
                </button>

                <button onClick={() => setViewMode('PO_CREATION_LIST')} style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {poCreatedCount > 0 ? 'View Purchase Orders →' : 'Create Purchase Orders →'}
                </button>
              </>
            ) : (
              <button onClick={() => setViewMode('SPLIT_PREVIEW')} style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Split into Sub-Orders →
              </button>
            )}
          </div>
        </div>

        {/* Master Order Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Order Number</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>MO-2026-1001</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Source Quote</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>QUOTE-1001</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Approved on 14 Aug 2026</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order Status</div>
            <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', display: 'inline-block', marginTop: 4 }}>
              {masterPoStatus}
            </span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Orders & POs</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>2 Sub-Orders</div>
            <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 700 }}>{poCreatedCount} / 2 POs Created</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #0F766E', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Total Order Value</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>₹2,52,800</div>
            <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>Expected Delivery: 2026-09-02</div>
          </div>
        </div>

        {/* Master Order Line Items Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Master Order Line Items (3 Products)</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Manufacturer allocations derived from quote comparison selection</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SELECTED MANUFACTURER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TAX</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISCOUNT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>FINAL PRICE / UNIT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>LEAD TIME</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ASSIGNMENT</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Paracetamol 500mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>10,000 Units</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>SunBio LifeSciences Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹9.66</td>
                  <td style={{ padding: '12px 14px' }}>12%</td>
                  <td style={{ padding: '12px 14px' }}>5%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹10.28</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹1,02,800</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>14 Days</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>Assigned</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Amoxicillin 250mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>5,000 Units</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>Cipla Partner Formulations Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹11.50</td>
                  <td style={{ padding: '12px 14px' }}>12%</td>
                  <td style={{ padding: '12px 14px' }}>3%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹12.40</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹57,500</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>10 Days</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>Assigned</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Azithromycin 500mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>2,000 Units</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>SunBio LifeSciences Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹15.00</td>
                  <td style={{ padding: '12px 14px' }}>18%</td>
                  <td style={{ padding: '12px 14px' }}>0%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹16.80</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹92,500</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>12 Days</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>Assigned</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sub-Orders Section Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Manufacturer-wise Sub-Orders</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Sub-orders created from grouping products by manufacturer</div>
            </div>
            {isSplitComplete ? (
              <button onClick={() => setViewMode('SUB_ORDERS_LIST')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}>
                View Sub-Orders →
              </button>
            ) : (
              <button onClick={() => setViewMode('SPLIT_PREVIEW')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}>
                Split Order Preview →
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-ORDER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>MANUFACTURER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT LINES</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ORDER VALUE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PO STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {subOrdersDataset.map(so => {
                  const hasPo = !!createdPos[so.code];

                  return (
                    <tr key={so.code} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{so.code}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>{so.mfgName}</td>
                      <td style={{ padding: '12px 14px' }}>{so.productsCount} {so.productsCount > 1 ? 'Products' : 'Product'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace' }}>{so.totalQuantity.toLocaleString()} Units</td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹{so.orderValue.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {hasPo ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>PO Created</span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>PO Not Created</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setSelectedSubOrderCode(so.code); setViewMode('SUB_ORDER_DETAIL'); }} style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', cursor: 'pointer' }}>
                            View Sub-Order →
                          </button>
                          {hasPo ? (
                            <button onClick={() => { setTargetPoSubOrderCode(so.code); setViewMode('PO_DETAIL'); }} style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, background: '#0F766E', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                              View PO →
                            </button>
                          ) : (
                            <button onClick={() => { setTargetPoSubOrderCode(so.code); setViewMode('CREATE_PO_FORM'); }} style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, background: '#0F766E', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                              Create PO →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>



      </div>
    );
  }

  // ── 11. DEFAULT VIEWMODE: LIST OF MASTER ORDERS ──────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

      {/* Header Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>ORDER ENGINE / SOURCING CONSOLE</div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            MASTER ORDERS & SPLITTING
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Master orders created from approved customer quotations and split into manufacturer sub-orders.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search by Order Number, Customer, Quote Number, Manufacturer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Filter:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="ALL">All Orders ({orders.length})</option>
            <option value="OPEN">Open Orders</option>
            <option value="CLOSED">Closed Orders</option>
          </select>
        </div>
      </div>

      {/* Master Orders Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredOrders.map(ord => (
          <div
            key={ord.id}
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#0F766E'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                  {masterPoStatus}
                </span>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>{ord.customerName}</h3>

              <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                <div>Source Quote: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>QUOTE-1001</strong></div>
                <div>Product Lines: <strong style={{ color: '#0F172A' }}>3 Product Lines</strong></div>
                <div>Sub-Orders: <strong style={{ color: '#0F766E' }}>2 Sub-Orders Created</strong></div>
                <div>Purchase Orders: <strong style={{ color: '#0F766E' }}>{poCreatedCount} / 2 POs Created</strong></div>
                <div>Total Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹2,52,800</strong></div>
              </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedOrderId(ord.id);
                  setViewMode('DETAILS');
                }}
                style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                View Order →
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
