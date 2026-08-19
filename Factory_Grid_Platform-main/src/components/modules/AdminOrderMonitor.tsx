import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MasterOrder } from '../../types';
import { ShoppingBag, Search, Eye, X, CheckCircle2, Clock } from 'lucide-react';

export const AdminOrderMonitor: React.FC = () => {
  const { orders, currentRole } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(null);

  const totalOrdersCount = orders.length;
  const totalGmv = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const openCount = orders.filter(o => o.status === 'OPEN' || o.status === 'PROCESSING').length;
  const completedCount = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <ShoppingBag size={14} /> Order Governance Desk · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Master Orders &amp; PO Monitor
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Read-only governance monitor for master purchase orders, sub-order manufacturer splitting, and fulfillment timeline.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#4338CA' }}>
          <Eye size={14} /> READ-ONLY MONITORING MODE
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'MASTER ORDERS', val: totalOrdersCount, color: '#2563EB' },
          { label: 'TOTAL ORDER GMV', val: `₹${(totalGmv / 100000).toFixed(1)}L`, color: '#16A34A' },
          { label: 'OPEN / PROCESSING', val: openCount, color: '#D97706' },
          { label: 'DELIVERED / SETTLED', val: completedCount, color: '#4F46E5' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search Master Order #..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Master Order #</th>
              <th style={{ padding: '12px 16px' }}>Customer Name</th>
              <th style={{ padding: '12px 16px' }}>Created Date</th>
              <th style={{ padding: '12px 16px' }}>Expected Delivery</th>
              <th style={{ padding: '12px 16px' }}>Total Amount</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(ord => (
              <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{ord.orderNumber}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#334155' }}>{ord.customerName}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{ord.createdDate}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{ord.expectedDeliveryDate}</td>
                <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>₹{ord.totalAmount?.toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#DCFCE7', color: '#15803D' }}>
                    {ord.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => setSelectedOrder(ord)} style={{ padding: '5px 12px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    View Order Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: 700, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>Read-Only Order Inspection</span>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>Master Order: {selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, fontSize: 12.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><strong>Customer:</strong> {selectedOrder.customerName}</div>
              <div><strong>Status:</strong> {selectedOrder.status}</div>
              <div><strong>Total Amount:</strong> ₹{selectedOrder.totalAmount?.toLocaleString()}</div>
              <div><strong>Delivery Target:</strong> {selectedOrder.expectedDeliveryDate}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button onClick={() => setSelectedOrder(null)} style={{ padding: '8px 18px', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close Inspection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
