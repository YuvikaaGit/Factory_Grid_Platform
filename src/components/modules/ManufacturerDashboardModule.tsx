import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Factory, Package, FileText, Tag, ShoppingBag, Truck, Receipt,
  CheckCircle2, Clock, ShieldCheck, ArrowRight, ChevronRight, Plus,
  AlertTriangle, Cpu, TrendingUp, BarChart3, RefreshCw
} from 'lucide-react';

export const ManufacturerDashboardModule: React.FC = () => {
  const {
    rfqs, quotes, orders, shipments, invoices, mappings,
    manufacturers, setActiveTab, currentRole
  } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const mfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const mfgId = myMfg?.id || 'm1';

  // 1. Mapped Products Count
  const myMappings = (mappings || []).filter(m => m.manufacturerId === mfgId || m.manufacturerName?.includes('SunBio'));
  const mappedCount = myMappings.length || 4;

  // 2. Active Assigned RFQs
  const assignedRfqs = (rfqs || []).filter(r => r.status === 'PRICING_IN_PROGRESS' || r.status === 'SUBMITTED');

  // 3. Pending Quotes
  const pendingQuotes = (quotes || []).filter(q => q.manufacturerId === mfgId || q.manufacturerName?.includes('SunBio'));

  // 4. Sub-Orders List
  const mySubOrders = (orders || []).flatMap(o =>
    (o.subOrders || [])
      .filter(s => s.manufacturerId === mfgId || s.manufacturerName?.includes('SunBio'))
      .map(s => ({ ...s, masterOrderNumber: o.orderNumber, customerName: o.customerName }))
  );

  // Read Unified Store
  const [unifiedSubOrders, setUnifiedSubOrders] = React.useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_unified_suborders_v9');
      if (saved) return Object.values(JSON.parse(saved));
    } catch (e) { console.error(e); }
    return [];
  });

  const activeProductionCount = unifiedSubOrders.filter(s => s.productionStatus !== 'READY_TO_DISPATCH').length;
  const readyToDispatchCount = unifiedSubOrders.filter(s => s.productionStatus === 'READY_TO_DISPATCH' && !s.shipment).length;
  const activeShipmentCount = unifiedSubOrders.filter(s => s.shipment && (s.shipment.shipmentStatus === 'DISPATCHED' || s.shipment.shipmentStatus === 'IN_TRANSIT' || s.shipment.shipmentStatus === 'OUT_FOR_DELIVERY')).length;

  // 6. Total Revenue / Settlements
  const settledTotal = (invoices || []).reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>
      
      {/* ── Enterprise Header ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(15, 118, 110, 0.10)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Factory size={24} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>Manufacturer Operations Portal</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {mfgName} — Operations Dashboard
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              WHO-GMP Licensed Contract Facility · License: Form 25/28 (TS/HYD/2024/88921)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{ padding: '9px 16px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Package size={15} /> My Product Catalog ({mappedCount})
          </button>
          <button
            onClick={() => setActiveTab('rfqs')}
            style={{ padding: '9px 16px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FileText size={15} /> View Assigned RFQs
          </button>
        </div>
      </div>

      {/* ── Key Performance Metrics Bar ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        
        {/* Metric 1: Product Catalog */}
        <div
          onClick={() => setActiveTab('products')}
          style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#0F766E'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#CBD5E1'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Product Catalog</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(15,118,110,0.08)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{mappedCount}</div>
          <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            Formulations Mapped →
          </div>
        </div>

        {/* Metric 2: Active RFQs */}
        <div
          onClick={() => setActiveTab('rfqs')}
          style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#CBD5E1'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Assigned RFQs</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{assignedRfqs.length}</div>
          <div style={{ fontSize: 11.5, color: '#1D4ED8', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            Pending Quote Input →
          </div>
        </div>

        {/* Metric 3: Active Production Orders */}
        <div
          onClick={() => setActiveTab('production-planning')}
          style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#D97706'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#CBD5E1'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Batches</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{activeProductionCount}</div>
          <div style={{ fontSize: 11.5, color: '#D97706', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            In Production Line →
          </div>
        </div>

        {/* Metric 4: Active Shipments */}
        <div
          onClick={() => setActiveTab('shipments')}
          style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#059669'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#CBD5E1'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Shipments</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{activeShipmentCount}</div>
          <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            Cold-Chain In Transit →
          </div>
        </div>

        {/* Metric 5: Compliance Status */}
        <div
          style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Compliance Status</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(15,118,110,0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={18} /> Verified Active
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
            WHO-GMP & CDSCO License Valid
          </div>
        </div>
      </div>

      {/* ── Operational Navigation Grid ──────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E', marginBottom: 14 }}>
          MANUFACTURER WORKSPACE MODULES
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          
          {/* Module 1: Product Catalog */}
          <div
            onClick={() => setActiveTab('products')}
            style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>My Product Catalog</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{mappedCount} formulations mapped to plant</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#0F766E' }} />
          </div>

          {/* Module 2: Assigned RFQs */}
          <div
            onClick={() => setActiveTab('rfqs')}
            style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Assigned RFQs</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{assignedRfqs.length} open RFQs for pricing</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#1D4ED8' }} />
          </div>

          {/* Module 3: Quote Submissions */}
          <div
            onClick={() => setActiveTab('quotes')}
            style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Quote Submissions</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{pendingQuotes.length} quotes submitted</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#1D4ED8' }} />
          </div>

          {/* Module 4: Production Planning */}
          <div
            onClick={() => setActiveTab('production-planning')}
            style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Production Planning</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{activeProductionCount} active manufacturing runs</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#D97706' }} />
          </div>

          {/* Module 5: Sub-Order Management */}
          <div
            onClick={() => setActiveTab('orders')}
            style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Sub-Order Management</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{mySubOrders.length} purchase orders assigned</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#1D4ED8' }} />
          </div>

          {/* Module 6: Dispatch & Tracking */}
          <div
            onClick={() => setActiveTab('shipments')}
            style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Dispatch & Tracking</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{activeShipmentCount} cold-chain shipments active</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: '#16A34A' }} />
          </div>

        </div>
      </div>

      {/* ── Active Work Queue: Assigned RFQs ──────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Assigned RFQs Pending Quote Input</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: '#64748B' }}>Buyer RFQs matching plant manufacturing capabilities</p>
          </div>
          <button onClick={() => setActiveTab('rfqs')} style={{ fontSize: 12, fontWeight: 700, color: '#0F766E', background: 'none', border: 'none', cursor: 'pointer' }}>
            View All RFQs →
          </button>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>RFQ Number</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Buyer Company</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Requested Product</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Quantity</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Deadline</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignedRfqs.map(rfq => (
                <tr key={rfq.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{rfq.rfqNumber}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{rfq.customerName}</td>
                  <td style={{ padding: '10px 14px', color: '#334155' }}>{rfq.lines[0]?.productName || 'Pharma Batch'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{(rfq.lines[0]?.quantity || 5000).toLocaleString()} Units</td>
                  <td style={{ padding: '10px 14px', color: '#64748B' }}>{rfq.deadlineDate}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => setActiveTab('rfqs')}
                      style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}
                    >
                      Submit Quote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
