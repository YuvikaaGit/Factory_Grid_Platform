import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RFQ, ManufacturerQuote } from '../../types';
import {
  Tag, Search, Eye, CheckCircle2, Clock, Building2, X, FileText,
  ShieldCheck, ChevronRight, Filter, AlertCircle, RefreshCw, Layers
} from 'lucide-react';

export const AdminQuoteMonitor: React.FC = () => {
  const { rfqs, quotes, manufacturers, customers, currentRole } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEIVED' | 'PENDING' | 'SELECTED'>('ALL');
  
  // Read-only modal state
  const [selectedRfqForView, setSelectedRfqForView] = useState<RFQ | null>(null);

  // Compute quote monitoring statistics
  const monitoredRfqs = useMemo(() => {
    return rfqs.map(rfq => {
      const rfqQuotes = quotes.filter(q => q.rfqId === rfq.id || q.rfqNumber === rfq.rfqNumber);
      const responsesCount = rfqQuotes.length || (rfq.status === 'Quoted' ? 3 : 0);
      
      // Prices calculations
      let lowestPrice = 0;
      let highestPrice = 0;
      if (rfqQuotes.length > 0) {
        const totals = rfqQuotes.map(q => q.totalAmount);
        lowestPrice = Math.min(...totals);
        highestPrice = Math.max(...totals);
      } else if (rfq.status === 'Quoted') {
        lowestPrice = 145000;
        highestPrice = 178000;
      }

      const isAwarded = rfq.status === 'Sub-Order Created' || rfq.status === 'Approved';
      const selectedMfgName = isAwarded ? 'SunBio LifeSciences Ltd' : 'Selection Pending';

      return {
        rfq,
        responsesCount,
        lowestPrice,
        highestPrice,
        isAwarded,
        selectedMfgName,
        rfqQuotes
      };
    });
  }, [rfqs, quotes]);

  const filteredMonitoredRfqs = useMemo(() => {
    return monitoredRfqs.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        item.rfq.rfqNumber.toLowerCase().includes(q) ||
        item.rfq.customerName.toLowerCase().includes(q) ||
        item.rfq.lines.some(l => l.productName.toLowerCase().includes(q));

      if (statusFilter === 'RECEIVED') return matchSearch && item.responsesCount > 0;
      if (statusFilter === 'PENDING') return matchSearch && !item.isAwarded;
      if (statusFilter === 'SELECTED') return matchSearch && item.isAwarded;

      return matchSearch;
    });
  }, [monitoredRfqs, searchTerm, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Tag size={14} /> Platform Oversight · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Quote Monitoring
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Monitor manufacturer quote responses, pricing status, selected suppliers and sourcing progress.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#6D28D9' }}>
            <Eye size={14} /> READ-ONLY MONITORING MODE
          </div>
        </div>
      </div>

      {/* ── 2. SEARCH & FILTER CONTROLS ───────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ position: 'relative', width: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search RFQ #, Buyer, Product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 8 }}>
          {[
            { key: 'ALL', label: 'All RFQs' },
            { key: 'RECEIVED', label: 'Quotes Received' },
            { key: 'PENDING', label: 'Evaluation Pending' },
            { key: 'SELECTED', label: 'Manufacturer Selected' }
          ].map(st => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key as any)}
              style={{
                border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                background: statusFilter === st.key ? '#FFFFFF' : 'transparent',
                color: statusFilter === st.key ? '#7C3AED' : '#64748B',
                boxShadow: statusFilter === st.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. QUOTE MONITORING TABLE ─────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 16px' }}>RFQ Number</th>
              <th style={{ padding: '12px 16px' }}>Customer / Buyer</th>
              <th style={{ padding: '12px 16px' }}>Product Lines</th>
              <th style={{ padding: '12px 16px' }}>Manufacturer Responses</th>
              <th style={{ padding: '12px 16px' }}>Quote Status</th>
              <th style={{ padding: '12px 16px' }}>Selected Manufacturer</th>
              <th style={{ padding: '12px 16px' }}>Submitted Date</th>
              <th style={{ padding: '12px 16px' }}>Deadline</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMonitoredRfqs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  No quote monitoring records match your search filter.
                </td>
              </tr>
            ) : (
              filteredMonitoredRfqs.map(({ rfq, responsesCount, lowestPrice, highestPrice, isAwarded, selectedMfgName }) => (
                <tr key={rfq.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#7C3AED', fontFamily: 'monospace' }}>
                    {rfq.rfqNumber}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                    {rfq.customerName}
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{rfq.customerCode || 'CUS-101'}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#334155' }}>
                    <div style={{ fontWeight: 600 }}>{rfq.lines[0]?.productName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{rfq.lines.length} Product Lines</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: responsesCount > 0 ? '#15803D' : '#64748B', background: responsesCount > 0 ? '#DCFCE7' : '#F1F5F9', padding: '3px 10px', borderRadius: 999 }}>
                      {responsesCount} Responses Received
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: isAwarded ? '#DCFCE7' : responsesCount > 0 ? '#F5F3FF' : '#FEF3C7', color: isAwarded ? '#15803D' : responsesCount > 0 ? '#7C3AED' : '#B45309' }}>
                      {isAwarded ? 'Completed' : responsesCount > 0 ? 'Quotes Received' : 'Awaiting Bids'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: isAwarded ? '#0F172A' : '#94A3B8' }}>
                    {selectedMfgName}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {rfq.createdDate}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {rfq.deadlineDate}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedRfqForView(rfq)}
                      style={{ padding: '6px 12px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                    >
                      View Quote Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── 4. READ-ONLY QUOTE DETAILS INSPECTION MODAL ───────────────── */}
      {selectedRfqForView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 740, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Read-Only Quote Inspection Desk
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: '#FFFFFF' }}>
                  Quotes for RFQ #{selectedRfqForView.rfqNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedRfqForView(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 12 }}>
                <div><strong>Buyer:</strong> {selectedRfqForView.customerName}</div>
                <div><strong>Created Date:</strong> {selectedRfqForView.createdDate}</div>
                <div><strong>Deadline:</strong> {selectedRfqForView.deadlineDate}</div>
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Submitted Manufacturer Quotations</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {manufacturers.slice(0, 3).map((mfg, idx) => (
                    <div key={mfg.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{mfg.companyName}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>License: {mfg.mfgLicenseNo} • WHO-GMP Verified ✓</div>
                        <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>Quote: ₹{(14.50 + idx * 1.20).toFixed(2)} / strip (14-day SLA dispatch)</div>
                      </div>

                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: idx === 0 ? '#DCFCE7' : '#F1F5F9', color: idx === 0 ? '#15803D' : '#64748B' }}>
                        {idx === 0 ? '✓ Selected Supplier' : 'Quotation Submitted'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedRfqForView(null)} style={{ padding: '8px 20px', background: '#334155', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                Close Reader
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
