import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RFQ } from '../../types';
import { FileText, Search, Eye, X, Clock, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';

export const AdminRfqMonitor: React.FC = () => {
  const { rfqs, currentRole } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);

  const totalRfqs = rfqs.length;
  const pendingCount = rfqs.filter(r => r.status === 'Open' || r.status === 'Draft' || r.status === 'Submitted').length;
  const quotedCount = rfqs.filter(r => r.status === 'Quoted' || r.status === 'Under Review').length;
  const closedCount = rfqs.filter(r => r.status === 'Closed' || r.status === 'Awarded').length;

  const filteredRfqs = rfqs.filter(r =>
    r.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <FileText size={14} /> Procurement Oversight · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            RFQ Monitoring Desk
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Read-only governance monitor for buyer RFQs, formulation line items, status distribution, and supplier dispatch logs.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#4338CA' }}>
          <Eye size={14} /> READ-ONLY MONITORING MODE
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'TOTAL RFQS', val: totalRfqs, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'PENDING QUOTES', val: pendingCount, color: '#D97706', bg: '#FFFBEB' },
          { label: 'ACTIVE / QUOTED', val: quotedCount, color: '#16A34A', bg: '#DCFCE7' },
          { label: 'CLOSED / AWARDED', val: closedCount, color: '#4F46E5', bg: '#EEF2FF' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.val}</div>
          </div>
        ))}
      </div>

      {/* RFQ Queue Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search RFQ # or Customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>RFQ #</th>
              <th style={{ padding: '12px 16px' }}>Customer Entity</th>
              <th style={{ padding: '12px 16px' }}>Formulation Lines</th>
              <th style={{ padding: '12px 16px' }}>Submission Date</th>
              <th style={{ padding: '12px 16px' }}>Target Date</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRfqs.map(rfq => (
              <tr key={rfq.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{rfq.rfqNumber}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#334155' }}>{rfq.customerName}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{rfq.lines ? rfq.lines.length : 1} Line(s)</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{rfq.createdDate || rfq.createdAt || '2026-08-01'}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{rfq.targetDeliveryDate || '2026-09-15'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: rfq.status === 'Closed' ? '#F1F5F9' : rfq.status === 'Quoted' ? '#DCFCE7' : '#FEF3C7', color: rfq.status === 'Closed' ? '#64748B' : rfq.status === 'Quoted' ? '#15803D' : '#B45309' }}>
                    {rfq.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => setSelectedRfq(rfq)} style={{ padding: '5px 12px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Read-Only RFQ Detail Drawer / Modal */}
      {selectedRfq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: 750, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>Read-Only Governance Inspection</span>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>RFQ Details: {selectedRfq.rfqNumber}</h3>
              </div>
              <button onClick={() => setSelectedRfq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
              <div><strong>Customer Name:</strong> {selectedRfq.customerName}</div>
              <div><strong>Status:</strong> {selectedRfq.status}</div>
              <div><strong>Created Date:</strong> {selectedRfq.createdDate || selectedRfq.createdAt || '2026-08-01'}</div>
              <div><strong>Target Delivery:</strong> {selectedRfq.targetDeliveryDate || '2026-09-15'}</div>
            </div>

            <h4 style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 800 }}>Formulation Line Items:</h4>
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 800 }}>
                    <th style={{ padding: 10 }}>Product Name</th>
                    <th style={{ padding: 10 }}>Dosage Form</th>
                    <th style={{ padding: 10 }}>Quantity</th>
                    <th style={{ padding: 10 }}>Target Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRfq.lines || []).map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{l.productName}</td>
                      <td style={{ padding: 10 }}>{l.dosageForm || 'Tablet / Capsule'}</td>
                      <td style={{ padding: 10, fontFamily: 'monospace' }}>{l.quantity?.toLocaleString()}</td>
                      <td style={{ padding: 10, fontFamily: 'monospace' }}>₹{l.targetPrice || l.unitPrice || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button onClick={() => setSelectedRfq(null)} style={{ padding: '8px 18px', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close Inspection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
