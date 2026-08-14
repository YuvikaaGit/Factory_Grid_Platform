import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RFQ, ManufacturerQuote, Manufacturer } from '../../types';
import { CustomerQuotationModule } from './CustomerQuotationModule';
import {
  Tag, Search, Filter, CheckCircle2, Clock, DollarSign, ArrowRight,
  ShieldCheck, Star, Sparkles, TrendingDown, Zap, Award, Check, AlertTriangle,
  FileText, Download, Eye, Send, X, Building2, AlertCircle, Layers, ChevronRight, ThumbsUp,
  MessageSquare, RefreshCw
} from 'lucide-react';

export const BuyerQuoteComparisonModule: React.FC = () => {
  const {
    rfqs, quotes, manufacturers, declinedRfqs, selectQuoteAndCreateOrder,
    negotiationThreads, sendNegotiationMessage, revisedQuotes, submitRevisedQuote,
    setActiveTab, addAuditLog, currentRole
  } = useApp();

  // Navigation View Modes: 'LIST' (Overview list of RFQs) | 'MATRIX' (Product-wise matrix) | 'CONSOLIDATED' (Merged customer quote)
  const [viewMode, setViewMode] = useState<'LIST' | 'MATRIX' | 'CONSOLIDATED'>('LIST');
  const [selectedRfqId, setSelectedRfqId] = useState<string>(rfqs[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Message Manufacturer Modal State
  const [messageModalContext, setMessageModalContext] = useState<{
    rfqId: string;
    rfqNumber: string;
    lineId: string;
    productName: string;
    lineQty: number;
    mfgId: string;
    mfgName: string;
    currentUnitPrice: number;
    currentLeadTime: number;
    currentMoq: number;
  } | null>(null);
  const [messageText, setMessageText] = useState('');

  const activeRfq = useMemo(() => {
    return rfqs.find(r => r.id === selectedRfqId) || rfqs[0];
  }, [rfqs, selectedRfqId]);

  // Selected Manufacturer per RFQ Product Line: rfqLineId -> Selection Detail Object
  const [lineSelections, setLineSelections] = useState<Record<string, {
    mfgId: string;
    mfgName: string;
    unitPrice: number;
    taxPercent: number;
    discountPercent: number;
    finalPrice: number;
    leadTimeDays: number;
    moq: number;
  }>>({});

  // Reset/Initialize line selections when active RFQ changes
  useEffect(() => {
    if (activeRfq) {
      setLineSelections({});
    }
  }, [activeRfq?.id]);

  // Handle line selection
  const handleSelectLineManufacturer = (
    lineId: string,
    mfgId: string,
    mfgName: string,
    unitPrice: number,
    taxPercent: number,
    discountPercent: number,
    finalPrice: number,
    leadTimeDays: number,
    moq: number
  ) => {
    setLineSelections(prev => ({
      ...prev,
      [lineId]: {
        mfgId,
        mfgName,
        unitPrice,
        taxPercent,
        discountPercent,
        finalPrice,
        leadTimeDays,
        moq
      }
    }));
  };

  // Quotes Calculator & Revision Sync
  const getQuotesForLine = (lineId: string, lineTargetPrice: number, lineQty: number, lineProductName: string) => {
    if (!activeRfq) return [];

    const rfqDeclined = (declinedRfqs && declinedRfqs[activeRfq.id]) || [];

    // Base suppliers
    const supplierList = [
      { id: 'm1', name: 'SunBio LifeSciences Ltd.', code: 'SUN-PHARM', baseP: lineTargetPrice * 0.92, tax: 12, disc: 5, lead: 14, moq: 1000, preferred: true },
      { id: 'm2', name: 'ABC Pharma Formulations Ltd.', code: 'ABC-PHARM', baseP: lineTargetPrice * 0.95, tax: 12, disc: 3, lead: 10, moq: 2000, preferred: false },
      { id: 'm3', name: 'XYZ Pharma Labs Ltd.', code: 'XYZ-LABS', baseP: lineTargetPrice * 1.02, tax: 18, disc: 0, lead: 18, moq: 5000, preferred: false }
    ];

    // Filter out manufacturers who declined this RFQ
    const activeSuppliers = supplierList.filter(s => {
      const isDec = rfqDeclined.some(d => d.manufacturerId === s.id || d.manufacturerName?.includes(s.name));
      return !isDec;
    });

    const calculatedQuotes = activeSuppliers.map(s => {
      const threadKey = `${activeRfq.id}_${lineId}_${s.id}`;
      const rev = revisedQuotes ? revisedQuotes[threadKey] : undefined;

      const origUnitPrice = Math.round(s.baseP * 100) / 100;
      const origTax = s.tax;
      const origDisc = s.disc;
      const origTaxAmt = origUnitPrice * (origTax / 100);
      const origDiscAmt = (origUnitPrice + origTaxAmt) * (origDisc / 100);
      const origFinalP = Math.round((origUnitPrice + origTaxAmt - origDiscAmt) * 100) / 100;
      const origLead = s.lead;
      const origMoq = s.moq;

      // If a revised quote exists, use the revised values
      const uPrice = rev ? rev.unitPrice : origUnitPrice;
      const taxPerc = rev ? rev.taxPercent : origTax;
      const discPerc = rev ? rev.discountPercent : origDisc;
      const finalP = rev ? rev.finalPrice : origFinalP;
      const leadDays = rev ? rev.leadTimeDays : origLead;
      const moqVal = rev ? rev.moq : origMoq;

      const totalLineCost = Math.round(finalP * lineQty);

      return {
        mfgId: s.id,
        mfgName: s.name,
        mfgCode: s.code,
        unitPrice: uPrice,
        taxPercent: taxPerc,
        discountPercent: discPerc,
        finalPrice: finalP,
        totalLineCost,
        leadTimeDays: leadDays,
        moq: moqVal,
        preferred: s.preferred,
        isMoqCompliant: lineQty >= moqVal,
        isRevised: !!rev,
        revisedAt: rev?.revisedAt,
        origLeadTime: origLead,
        origUnitPrice,
        origFinalPrice: origFinalP,
        threadKey
      };
    });

    // Identify lowest price & fastest delivery for smart badges
    let lowestPriceVal = Infinity;
    let fastestLeadVal = Infinity;

    calculatedQuotes.forEach(q => {
      if (q.finalPrice < lowestPriceVal) lowestPriceVal = q.finalPrice;
      if (q.leadTimeDays < fastestLeadVal) fastestLeadVal = q.leadTimeDays;
    });

    return calculatedQuotes.map(q => ({
      ...q,
      isLowestPrice: q.finalPrice === lowestPriceVal,
      isFastestDelivery: q.leadTimeDays === fastestLeadVal
    }));
  };

  // Selection Progress Stats for active RFQ
  const selectionStats = useMemo(() => {
    if (!activeRfq) return { totalLines: 0, selectedCount: 0, isComplete: false };
    const totalLines = activeRfq.lines.length;
    const selectedCount = activeRfq.lines.filter(l => !!lineSelections[l.id]).length;
    return {
      totalLines,
      selectedCount,
      isComplete: selectedCount === totalLines && totalLines > 0
    };
  }, [activeRfq, lineSelections]);

  // Open Message Manufacturer Modal
  const handleOpenMessageModal = (
    rfqId: string,
    rfqNumber: string,
    lineId: string,
    productName: string,
    lineQty: number,
    mfgId: string,
    mfgName: string,
    currentUnitPrice: number,
    currentLeadTime: number,
    currentMoq: number
  ) => {
    setMessageModalContext({
      rfqId,
      rfqNumber,
      lineId,
      productName,
      lineQty,
      mfgId,
      mfgName,
      currentUnitPrice,
      currentLeadTime,
      currentMoq
    });
    setMessageText('');
  };

  // Handle Send Negotiation Message
  const handleSendMessage = () => {
    if (!messageModalContext || !messageText.trim()) return;
    const threadKey = `${messageModalContext.rfqId}_${messageModalContext.lineId}_${messageModalContext.mfgId}`;
    sendNegotiationMessage(threadKey, messageText.trim(), 'BUYER', 'Apex Pharma (Buyer)');
    setMessageText('');
  };

  // Open Consolidated Quote Handler
  const handleOpenConsolidatedQuote = () => {
    if (!selectionStats.isComplete) {
      alert(`Please select a manufacturer for all RFQ product lines before continuing.\n\nCurrent progress: ${selectionStats.selectedCount} / ${selectionStats.totalLines} lines selected.`);
      return;
    }
    setViewMode('CONSOLIDATED');
  };

  // Render Consolidated Quote View
  if (viewMode === 'CONSOLIDATED' && activeRfq) {
    const formattedSelections: Record<string, { mfgId: string; mfgName: string; price: number }> = {};
    Object.keys(lineSelections).forEach(lineId => {
      const sel = lineSelections[lineId];
      formattedSelections[lineId] = {
        mfgId: sel.mfgId,
        mfgName: sel.mfgName,
        price: sel.finalPrice
      };
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '12px 20px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setViewMode('MATRIX')}
            style={{ padding: '7px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            ← Back to Quote Comparison Matrix
          </button>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E' }}>
            Consolidated Customer Quote Preview ({activeRfq.rfqNumber})
          </span>
        </div>

        <CustomerQuotationModule
          rfq={activeRfq}
          lineSelections={formattedSelections}
          onApproved={() => setActiveTab('orders')}
        />
      </div>
    );
  }

  // Render Product-Wise Comparison Matrix View
  if (viewMode === 'MATRIX' && activeRfq) {
    const rfqDeclined = (declinedRfqs && declinedRfqs[activeRfq.id]) || [];
    const totalResponsesCount = Math.max(3 - rfqDeclined.length, 1);
    const isDeadlineReached = new Date() > new Date(activeRfq.deadlineDate);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>
        
        {/* ── Header Bar ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <button onClick={() => setViewMode('LIST')} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                ← All RFQs
              </button>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{activeRfq.rfqNumber}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: selectionStats.isComplete ? '#DCFCE7' : '#EFF6FF', color: selectionStats.isComplete ? '#15803D' : '#1D4ED8', border: selectionStats.isComplete ? '1px solid #86EFAC' : '1px solid #BFDBFE' }}>
                {selectionStats.isComplete ? 'SELECTION COMPLETE' : 'READY FOR COMPARISON'}
              </span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              QUOTE COMPARISON MATRIX
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Compare manufacturer quotations, negotiate terms, and select the best supplier for each RFQ product line ({activeRfq.customerName}).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              disabled={!selectionStats.isComplete}
              onClick={handleOpenConsolidatedQuote}
              style={{
                padding: '10px 20px', borderRadius: 8,
                background: selectionStats.isComplete ? '#0F766E' : '#E2E8F0',
                color: selectionStats.isComplete ? '#FFFFFF' : '#94A3B8',
                border: 'none', fontWeight: 700, fontSize: 13, cursor: selectionStats.isComplete ? 'pointer' : 'not-allowed',
                display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: selectionStats.isComplete ? '0 2px 4px rgba(15,118,110,0.2)' : 'none'
              }}
              title={!selectionStats.isComplete ? 'Please select a manufacturer for all RFQ product lines before continuing.' : 'Generate Consolidated Customer Quotation'}
            >
              <FileText size={16} /> Generate Consolidated Quote →
            </button>
          </div>
        </div>

        {/* ── Summary Metric Cards Bar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Products</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{activeRfq.lines.length}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Product lines to allocate</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Manufacturer Responses</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{totalResponsesCount}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Quotations received</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Declined Responses</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: rfqDeclined.length > 0 ? '#DC2626' : '#64748B', fontFamily: 'monospace', marginTop: 4 }}>{rfqDeclined.length}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Suppliers declined RFQ</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>RFQ Deadline</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: isDeadlineReached ? '#DC2626' : '#D97706', marginTop: 8 }}>{activeRfq.deadlineDate}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{isDeadlineReached ? 'Deadline Reached' : 'Active for responses'}</div>
          </div>
        </div>

        {/* ── Status Banner ── */}
        <div style={{ background: isDeadlineReached ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${isDeadlineReached ? '#FCD34D' : '#86EFAC'}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: isDeadlineReached ? '#92400E' : '#166534', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} style={{ color: isDeadlineReached ? '#D97706' : '#16A34A', flexShrink: 0 }} />
          <span>
            {isDeadlineReached
              ? `RFQ deadline has passed (${activeRfq.deadlineDate}). Compare received quotations and select the preferred supplier for each line item below.`
              : `All manufacturer responses received. Message suppliers to negotiate pricing or lead times, and select a supplier for each product line.`
            }
          </span>
        </div>

        {/* ── PRODUCT-LINE BASED COMPARISON TABLES ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeRfq.lines.map((line, index) => {
            const lineQuotes = getQuotesForLine(line.id, line.targetPrice || 10.00, line.quantity, line.productName);
            const selectedSupplier = lineSelections[line.id];
            const lowestQuote = lineQuotes.find(q => q.isLowestPrice);
            const fastestQuote = lineQuotes.find(q => q.isFastestDelivery);
            const preferredQuote = lineQuotes.find(q => q.preferred);

            return (
              <div key={line.id} style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.05)', overflow: 'hidden' }}>
                
                {/* Line Item Header */}
                <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#E2E8F0', color: '#334155' }}>
                        LINE #{index + 1}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>
                        PRD00100{index + 1}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>{line.productName}</h3>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      Dosage: <strong>{line.dosageForm}</strong> · Pack Size: <strong>{line.packSize}</strong> · Requested Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</strong>
                    </div>
                  </div>

                  {/* Selected Supplier Indicator */}
                  {selectedSupplier ? (
                    <div style={{ padding: '6px 14px', borderRadius: 8, background: '#DCFCE7', border: '1px solid #86EFAC', fontSize: 12, fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Selected: {selectedSupplier.mfgName} (₹{selectedSupplier.finalPrice.toFixed(2)}/unit)
                    </div>
                  ) : (
                    <div style={{ padding: '6px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={16} /> Pending Selection
                    </div>
                  )}
                </div>

                {/* Smart Recommendation Indicators Summary */}
                <div style={{ padding: '12px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Lowest Price:</span>
                    <strong style={{ color: '#15803D' }}>{lowestQuote?.mfgName} (₹{lowestQuote?.finalPrice.toFixed(2)})</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Fastest Delivery:</span>
                    <strong style={{ color: '#1D4ED8' }}>{fastestQuote?.mfgName} ({fastestQuote?.leadTimeDays} Days)</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Preferred Vendor:</span>
                    <strong style={{ color: '#7E22CE' }}>{preferredQuote?.mfgName}</strong>
                  </div>
                </div>

                {/* Comparison Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MANUFACTURER</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>UNIT PRICE</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>TAX %</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DISCOUNT %</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>FINAL PRICE / UNIT</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>TOTAL LINE COST</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>LEAD TIME</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MOQ</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>EVALUATION TAGS</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineQuotes.map((q) => {
                        const isSelected = selectedSupplier?.mfgId === q.mfgId;
                        const threadMsgs = (negotiationThreads && negotiationThreads[q.threadKey]) || [];
                        const msgCount = threadMsgs.length;

                        return (
                          <tr
                            key={q.mfgId}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: isSelected ? '#F0FDF4' : q.isRevised ? '#FEFCE8' : '#FFFFFF',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            {/* 1. MANUFACTURER */}
                            <td style={{ padding: '14px' }}>
                              <div style={{ fontWeight: 800, color: isSelected ? '#15803D' : '#0F172A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {q.mfgName}
                                {q.isRevised && (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#FEF08A', color: '#854D0E', border: '1px solid #FDE047' }}>
                                    REVISED QUOTE
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>{q.mfgCode}</div>
                              {msgCount > 0 && (
                                <div style={{ fontSize: 10.5, color: '#0F766E', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <MessageSquare size={12} /> {msgCount} message{msgCount > 1 ? 's' : ''} in thread
                                </div>
                              )}
                            </td>

                            {/* 2. UNIT PRICE */}
                            <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A' }}>
                              ₹{q.unitPrice.toFixed(2)}
                              {q.isRevised && q.origUnitPrice !== q.unitPrice && (
                                <div style={{ fontSize: 10, color: '#94A3B8', textDecoration: 'line-through' }}>₹{q.origUnitPrice.toFixed(2)}</div>
                              )}
                            </td>

                            {/* 3. TAX % */}
                            <td style={{ padding: '14px', color: '#475569' }}>
                              {q.taxPercent}%
                            </td>

                            {/* 4. DISCOUNT % */}
                            <td style={{ padding: '14px', color: '#475569' }}>
                              {q.discountPercent}%
                            </td>

                            {/* 5. FINAL PRICE / UNIT */}
                            <td style={{ padding: '14px', fontWeight: 800, color: '#0F766E', fontSize: 14, fontFamily: 'monospace' }}>
                              ₹{q.finalPrice.toFixed(2)}
                              {q.isRevised && q.origFinalPrice !== q.finalPrice && (
                                <div style={{ fontSize: 10, color: '#94A3B8', textDecoration: 'line-through', fontFamily: 'monospace' }}>₹{q.origFinalPrice.toFixed(2)}</div>
                              )}
                            </td>

                            {/* 6. TOTAL LINE COST */}
                            <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                              ₹{q.totalLineCost.toLocaleString('en-IN')}
                            </td>

                            {/* 7. LEAD TIME */}
                            <td style={{ padding: '14px', fontWeight: 700, color: q.isFastestDelivery ? '#1D4ED8' : '#334155' }}>
                              {q.leadTimeDays} Days
                              {q.isRevised && q.origLeadTime !== q.leadTimeDays && (
                                <div style={{ fontSize: 10, color: '#94A3B8', textDecoration: 'line-through' }}>Prev: {q.origLeadTime} Days</div>
                              )}
                            </td>

                            {/* 8. MOQ */}
                            <td style={{ padding: '14px', color: '#475569', fontWeight: 600 }}>
                              {q.moq.toLocaleString()} Units
                            </td>

                            {/* 9. EVALUATION TAGS */}
                            <td style={{ padding: '14px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {q.isLowestPrice && (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                                    LOWEST PRICE
                                  </span>
                                )}
                                {q.isFastestDelivery && (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                    FASTEST DELIVERY
                                  </span>
                                )}
                                {q.preferred && (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#FAF5FF', color: '#7E22CE', border: '1px solid #E9D5FF' }}>
                                    PREFERRED VENDOR
                                  </span>
                                )}
                                {q.isMoqCompliant && (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' }}>
                                    MOQ COMPLIANT
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 10. ACTIONS (Message Manufacturer + Select) */}
                            <td style={{ padding: '14px', textAlign: 'right', paddingRight: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  onClick={() => handleOpenMessageModal(activeRfq.id, activeRfq.rfqNumber, line.id, line.productName, line.quantity, q.mfgId, q.mfgName, q.unitPrice, q.leadTimeDays, q.moq)}
                                  style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  title="Send a message to negotiate lead time, pricing, or terms"
                                >
                                  <MessageSquare size={13} /> Message Manufacturer
                                </button>

                                {isSelected ? (
                                  <span style={{ padding: '6px 12px', fontSize: 11.5, fontWeight: 800, borderRadius: 6, background: '#16A34A', color: '#FFF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    ✓ SELECTED
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSelectLineManufacturer(line.id, q.mfgId, q.mfgName, q.unitPrice, q.taxPercent, q.discountPercent, q.finalPrice, q.leadTimeDays, q.moq)}
                                    style={{ padding: '6px 14px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}
                                  >
                                    Select
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
            );
          })}
        </div>

        {/* ── STICKY SELECTED SUPPLIERS SUMMARY BAR ── */}
        <div style={{ position: 'sticky', bottom: 20, zIndex: 900, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(15,23,42,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
              SELECTED SUPPLIERS SUMMARY ({selectionStats.selectedCount} / {selectionStats.totalLines} LINES ALLOCATED)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 6, fontSize: 12.5 }}>
              {activeRfq.lines.map((line, idx) => {
                const sel = lineSelections[line.id];
                return (
                  <div key={line.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: sel ? '#F0FDF4' : '#FFFBEB', padding: '4px 10px', borderRadius: 6, border: `1px solid ${sel ? '#86EFAC' : '#FCD34D'}` }}>
                    {sel ? <Check size={14} style={{ color: '#16A34A' }} /> : <AlertTriangle size={14} style={{ color: '#D97706' }} />}
                    <span style={{ fontWeight: 700, color: sel ? '#166534' : '#92400E' }}>
                      Line #{idx + 1}: {sel ? `${sel.mfgName} (₹${sel.finalPrice.toFixed(2)})` : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            disabled={!selectionStats.isComplete}
            onClick={handleOpenConsolidatedQuote}
            style={{
              padding: '10px 22px', borderRadius: 8,
              background: selectionStats.isComplete ? '#0F766E' : '#CBD5E1',
              color: selectionStats.isComplete ? '#FFFFFF' : '#64748B',
              border: 'none', fontWeight: 800, fontSize: 13.5, cursor: selectionStats.isComplete ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}
          >
            Generate Consolidated Quote →
          </button>
        </div>

        {/* ── MESSAGE MANUFACTURER MODAL ──────────────────────────── */}
        {messageModalContext && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setMessageModalContext(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 580, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column' }}>
              
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(15, 118, 110, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Message Manufacturer</h3>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Direct commercial negotiation & inquiry thread</div>
                  </div>
                </div>
                <button onClick={() => setMessageModalContext(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Context Summary Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>RFQ Reference: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{messageModalContext.rfqNumber}</strong></div>
                <div>Manufacturer: <strong style={{ color: '#0F172A' }}>{messageModalContext.mfgName}</strong></div>
                <div>Product: <strong style={{ color: '#0F172A' }}>{messageModalContext.productName}</strong></div>
                <div>Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{messageModalContext.lineQty.toLocaleString()} Units</strong></div>
                <div>Current Unit Price: <strong style={{ color: '#0F172A' }}>₹{messageModalContext.currentUnitPrice.toFixed(2)}</strong></div>
                <div>Current Lead Time: <strong style={{ color: '#1D4ED8' }}>{messageModalContext.currentLeadTime} Days</strong></div>
              </div>

              {/* Persistent Conversation History */}
              {(() => {
                const threadKey = `${messageModalContext.rfqId}_${messageModalContext.lineId}_${messageModalContext.mfgId}`;
                const msgs = (negotiationThreads && negotiationThreads[threadKey]) || [];

                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Conversation History</div>
                    <div style={{ maxHeight: 180, overflowY: 'auto', background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {msgs.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>
                          No previous messages in this thread. Start the negotiation below.
                        </div>
                      ) : (
                        msgs.map(m => (
                          <div
                            key={m.id}
                            style={{
                              alignSelf: m.senderRole === 'BUYER' ? 'flex-end' : 'flex-start',
                              maxWidth: '85%',
                              background: m.senderRole === 'BUYER' ? '#0F766E' : '#FFFFFF',
                              color: m.senderRole === 'BUYER' ? '#FFFFFF' : '#0F172A',
                              border: m.senderRole === 'BUYER' ? 'none' : '1px solid #CBD5E1',
                              borderRadius: 8,
                              padding: '8px 12px',
                              fontSize: 12
                            }}
                          >
                            <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85, marginBottom: 2 }}>
                              {m.senderName} · {m.timestamp}
                            </div>
                            <div style={{ lineHeight: 1.4 }}>{m.text}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Quick Message Suggestions */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Quick Suggestion Chips</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    "Can you reduce the lead time?",
                    "Can you offer a better price?",
                    "Can you confirm the MOQ?",
                    "Can you provide an earlier delivery date?"
                  ].map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => setMessageText(chip)}
                      style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 999, color: '#334155', cursor: 'pointer' }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Your Message</label>
                <textarea
                  rows={3}
                  placeholder="Ask the manufacturer about pricing, lead time, MOQ, delivery terms, or other quotation details..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', resize: 'none' }}
                />
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => setMessageModalContext(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: messageText.trim() ? '#0F766E' : '#CBD5E1', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: messageText.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Send size={14} /> Send Message
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // ── DEFAULT VIEWMODE: LIST OF RFQS FOR BUYER COMPARISON ──────────
  const readyRfqs = (rfqs || []).filter(r => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      q === '' ||
      r.rfqNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.lines.some(l => l.productName.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>
      
      {/* ── Header ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>PROCUREMENT & SOURCING / QUOTE COMPARISON</div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            QUOTE COMPARISON MATRIX
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Compare manufacturer quotations, negotiate lead time/pricing, and select the best supplier for each RFQ product line.
          </p>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search by RFQ number, customer, product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="ALL">All Statuses ({rfqs.length})</option>
            <option value="Pricing In Progress">Pricing In Progress</option>
            <option value="Quoted">Quoted / Ready</option>
            <option value="Submitted">Submitted</option>
          </select>
        </div>
      </div>

      {/* ── RFQ Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {readyRfqs.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', padding: 48, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
            <Tag size={36} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No RFQs ready for comparison.</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
              When manufacturers submit quotes against active RFQs, they will automatically appear here for evaluation.
            </div>
          </div>
        ) : (
          readyRfqs.map(rfq => {
            const rfqDeclined = (declinedRfqs && declinedRfqs[rfq.id]) || [];
            const activeResponseCount = Math.max(3 - rfqDeclined.length, 1);
            const isDeadlinePassed = new Date() > new Date(rfq.deadlineDate);

            return (
              <div
                key={rfq.id}
                style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0F766E'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{rfq.rfqNumber}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                      READY FOR COMPARISON
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>{rfq.customerName}</h3>

                  <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                    <div>Product Lines: <strong style={{ color: '#0F172A' }}>{rfq.lines.length} Product Lines</strong></div>
                    <div>Manufacturer Responses: <strong style={{ color: '#0F766E' }}>{activeResponseCount} Responses Received</strong></div>
                    <div>Deadline: <strong style={{ color: isDeadlinePassed ? '#DC2626' : '#D97706' }}>{rfq.deadlineDate} {isDeadlinePassed && '(Expired)'}</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setSelectedRfqId(rfq.id);
                      setViewMode('MATRIX');
                    }}
                    style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Compare Quotes →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
