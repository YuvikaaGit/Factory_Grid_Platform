import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ManufacturerQuote, RFQ } from '../../types';
import {
  Tag, Search, Filter, Eye, Edit3, Send, X, FileText, CheckCircle2, Clock, ShieldCheck,
  ArrowLeft, AlertCircle, AlertTriangle, Check, ThumbsDown, Package, ExternalLink, RefreshCw,
  MessageSquare, Layers, ArrowRight, XCircle, DollarSign
} from 'lucide-react';

export const ManufacturerQuoteSubmissionsModule: React.FC = () => {
  const {
    quotes, rfqs, orders, manufacturers, negotiationThreads, revisedQuotes,
    sendNegotiationMessage, submitRevisedQuote, addAuditLog, setActiveTab
  } = useApp();

  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';

  // Filter quotes belonging to THIS manufacturer
  const myQuotes = useMemo(() => {
    return (quotes || []).filter(q => q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio'));
  }, [quotes, myMfgId]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filtered Quotes List (Pure filter function, no side effects)
  const filteredQuotes = useMemo(() => {
    return myQuotes.filter(q => {
      const term = searchTerm.toLowerCase().trim();
      const rfq = (rfqs || []).find(r => r.id === q.rfqId || r.rfqNumber === q.rfqNumber);
      const buyerName = rfq ? rfq.customerName : 'Apex Pharma PCD Franchise';

      const matchesSearch =
        term === '' ||
        q.id.toLowerCase().includes(term) ||
        q.rfqNumber.toLowerCase().includes(term) ||
        buyerName.toLowerCase().includes(term) ||
        (q.quoteLines && q.quoteLines.some(l => l.productName.toLowerCase().includes(term)));

      let matchesStatus = true;
      if (statusFilter === 'DRAFT') matchesStatus = q.status === 'DRAFT';
      else if (statusFilter === 'SUBMITTED') matchesStatus = q.status === 'SUBMITTED';
      else if (statusFilter === 'BUYER REVIEWING') matchesStatus = q.status === 'BUYER REVIEWING';
      else if (statusFilter === 'NEGOTIATION') matchesStatus = q.status === 'NEGOTIATION';
      else if (statusFilter === 'ACCEPTED') matchesStatus = q.status === 'ACCEPTED' || q.status === 'SUB-ORDER CREATED' || q.status === 'SELECTED';
      else if (statusFilter === 'REJECTED') matchesStatus = q.status === 'REJECTED' || q.status === 'NOT_SELECTED';
      else if (statusFilter === 'EXPIRED') matchesStatus = q.status === 'EXPIRED';

      return matchesSearch && matchesStatus;
    });
  }, [myQuotes, rfqs, searchTerm, statusFilter]);

  // Metric Summaries (Calculated deterministically from actual quotes array)
  const metrics = useMemo(() => {
    let pendingReviewCount = 0;
    let negotiationCount = 0;
    let acceptedCount = 0;
    let rejectedExpiredCount = 0;

    myQuotes.forEach(q => {
      if (q.status === 'SUBMITTED' || q.status === 'BUYER REVIEWING') {
        pendingReviewCount++;
      } else if (q.status === 'NEGOTIATION') {
        negotiationCount++;
      } else if (q.status === 'ACCEPTED' || q.status === 'SUB-ORDER CREATED' || q.status === 'SELECTED') {
        acceptedCount++;
      } else if (q.status === 'REJECTED' || q.status === 'EXPIRED' || q.status === 'NOT_SELECTED') {
        rejectedExpiredCount++;
      }
    });

    return {
      total: myQuotes.length,
      pendingReview: pendingReviewCount,
      negotiation: negotiationCount,
      accepted: acceptedCount,
      rejectedExpired: rejectedExpiredCount
    };
  }, [myQuotes]);

  // Selected Quote for Dedicated Inspection View (Initial state is NULL - landing page renders list view!)
  const [viewingQuote, setViewingQuote] = useState<ManufacturerQuote | null>(null);

  // Negotiation reply text state for detail page
  const [detailReplyText, setDetailReplyText] = useState<string>('');

  // Revised Quote Modal State inside detail view
  const [revisedQuoteModalContext, setRevisedQuoteModalContext] = useState<{
    rfqId: string;
    rfqNumber: string;
    lineId: string;
    productName: string;
    unitPrice: number;
    leadTimeDays: number;
  } | null>(null);

  const [revUnitPrice, setRevUnitPrice] = useState<number>(8.50);
  const [revTaxPercent, setRevTaxPercent] = useState<number>(12);
  const [revDiscountPercent, setRevDiscountPercent] = useState<number>(5);
  const [revLeadTimeDays, setRevLeadTimeDays] = useState<number>(11);
  const [revMoq, setRevMoq] = useState<number>(1000);
  const [revRemarks, setRevRemarks] = useState<string>('Revised commercial offer with compressed 11-day delivery.');

  // Handle Revised Quote Submit
  const handleConfirmRevisedQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisedQuoteModalContext) return;

    const threadKey = `${revisedQuoteModalContext.rfqId}_${revisedQuoteModalContext.lineId}_${myMfgId}`;
    submitRevisedQuote(threadKey, {
      unitPrice: revUnitPrice,
      taxPercent: revTaxPercent,
      discountPercent: revDiscountPercent,
      leadTimeDays: revLeadTimeDays,
      moq: revMoq,
      remarks: revRemarks
    });

    alert(`✔ Revised Commercial Offer Submitted!\n\nProduct: ${revisedQuoteModalContext.productName}\nRevised Unit Price: ₹${revUnitPrice.toFixed(2)}\nLead Time: ${revLeadTimeDays} Days`);
    setRevisedQuoteModalContext(null);
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'DRAFT' };
      case 'SUBMITTED':
        return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: 'SUBMITTED' };
      case 'BUYER REVIEWING':
        return { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE', label: 'BUYER REVIEWING' };
      case 'NEGOTIATION':
        return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'NEGOTIATION' };
      case 'ACCEPTED':
      case 'SELECTED':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'ACCEPTED' };
      case 'SUB-ORDER CREATED':
        return { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', label: 'SUB-ORDER CREATED' };
      case 'REJECTED':
      case 'NOT_SELECTED':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'REJECTED' };
      case 'EXPIRED':
        return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB', label: 'EXPIRED' };
      default:
        return { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1', label: status };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>
      
      {viewingQuote ? (
        /* ── DEDICATED QUOTE DETAILS PAGE (EXPLICIT VIEW ONLY) ─────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Top Navigation & Header Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => setViewingQuote(null)}
                style={{ padding: '7px 12px', borderRadius: 6, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={15} /> Back to Quote Submissions
              </button>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{viewingQuote.id}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>RFQ Ref: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{viewingQuote.rfqNumber}</strong></span>
                  {(() => {
                    const badge = getStatusBadge(viewingQuote.status);
                    return (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  {(rfqs || []).find(r => r.id === viewingQuote.rfqId || r.rfqNumber === viewingQuote.rfqNumber)?.customerName || 'Apex Pharma PCD Franchise'}
                </h1>
              </div>
            </div>

            {/* Header Action Button (Explicit User Actions) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {(viewingQuote.status === 'SUB-ORDER CREATED' || viewingQuote.status === 'ACCEPTED' || viewingQuote.status === 'SELECTED') && (
                <button
                  onClick={() => {
                    setViewingQuote(null);
                    setActiveTab('orders');
                  }}
                  style={{ padding: '8px 18px', borderRadius: 6, background: '#15803D', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Package size={15} /> View Sub-Order →
                </button>
              )}
            </div>
          </div>

          {/* ── VISUAL QUOTE LIFECYCLE TIMELINE STEPPER ─────────── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginBottom: 14 }}>
              COMMERCIAL QUOTE LIFECYCLE STAGE
            </div>

            {(() => {
              const st = viewingQuote.status;
              const steps = [
                { id: 'step1', label: 'RFQ Received', subText: 'Buyer issued RFQ' },
                { id: 'step2', label: 'Quote Submitted', subText: viewingQuote.submissionDate || '14 Aug 2026' },
                { id: 'step3', label: 'Buyer Reviewing', subText: 'Evaluation in progress' },
                { id: 'step4', label: 'Negotiation', subText: 'Commercial alignment' },
                { id: 'step5', label: 'Accepted', subText: 'Buyer award confirmed' },
                { id: 'step6', label: 'Sub-Order Created', subText: 'Manufacturing active' }
              ];

              let activeIndex = 1;
              if (st === 'SUBMITTED') activeIndex = 1;
              else if (st === 'BUYER REVIEWING') activeIndex = 2;
              else if (st === 'NEGOTIATION') activeIndex = 3;
              else if (st === 'ACCEPTED' || st === 'SELECTED') activeIndex = 4;
              else if (st === 'SUB-ORDER CREATED') activeIndex = 5;
              else if (st === 'REJECTED' || st === 'NOT_SELECTED') activeIndex = 3;
              else if (st === 'EXPIRED') activeIndex = 2;

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, alignItems: 'center' }}>
                  {steps.map((step, idx) => {
                    const isDone = idx <= activeIndex && st !== 'REJECTED' && st !== 'EXPIRED';
                    const isCurrent = idx === activeIndex;
                    const isRejected = (st === 'REJECTED' || st === 'NOT_SELECTED') && idx === 4;

                    let bg = '#F8FAFC';
                    let border = '#E2E8F0';
                    let iconColor = '#94A3B8';
                    let textColor = '#64748B';

                    if (isCurrent) {
                      bg = '#F0FDFA';
                      border = '#0F766E';
                      iconColor = '#0F766E';
                      textColor = '#0F172A';
                    } else if (isDone) {
                      bg = '#ECFDF5';
                      border = '#A7F3D0';
                      iconColor = '#059669';
                      textColor = '#0F172A';
                    } else if (isRejected) {
                      bg = '#FEF2F2';
                      border = '#FCA5A5';
                      iconColor = '#DC2626';
                      textColor = '#991B1B';
                    }

                    return (
                      <div
                        key={step.id}
                        style={{
                          background: bg,
                          border: `1.5px solid ${border}`,
                          borderRadius: 8,
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: iconColor }}>STAGE 0{idx + 1}</span>
                          {isRejected ? (
                            <XCircle size={14} color="#DC2626" />
                          ) : isDone ? (
                            <CheckCircle2 size={14} color="#059669" />
                          ) : (
                            <Clock size={14} color="#94A3B8" />
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginTop: 2 }}>{step.label}</div>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>{step.subText}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* ── QUOTATION SUMMARY & PRODUCT LINES BREAKDOWN ────────── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginBottom: 14 }}>
              QUOTATION SUMMARY — ALL PRODUCT LINES IN CONSOLIDATED QUOTE
            </div>

            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT NAME</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TAX (%)</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISCOUNT (%)</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>MOQ</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>LEAD TIME</th>
                    <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right', paddingRight: 16 }}>LINE TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingQuote.quoteLines || []).map((line, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0F172A' }}>₹{line.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px', color: '#16A34A', fontWeight: 600 }}>{line.taxPercent}%</td>
                      <td style={{ padding: '12px', color: '#DC2626', fontWeight: 600 }}>{line.discountPercent}%</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>{(line.moq || 1000).toLocaleString()} Units</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#1D4ED8' }}>{line.leadTimeDays} Days</td>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', textAlign: 'right', paddingRight: 16 }}>
                        ₹{line.calculatedFinalPrice ? line.calculatedFinalPrice.toLocaleString('en-IN') : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commercial Terms Summary Grid */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: 12.5 }}>
              <div>
                <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Total Calculated Quote Value</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                  ₹{viewingQuote.totalAmount ? viewingQuote.totalAmount.toLocaleString('en-IN') : '0'}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Delivery & Freight Terms</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{(viewingQuote as any).deliveryTerms || 'Ex-Factory Hyderabad / Cold Fleet'}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Quote Validity Date</div>
                <div style={{ fontWeight: 700, color: '#D97706', marginTop: 2 }}>{viewingQuote.validUntil || '2026-09-30'}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Submission Date</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{viewingQuote.submissionDate}</div>
              </div>
            </div>

            {viewingQuote.remarks && (
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', fontSize: 12.5, color: '#334155' }}>
                <strong style={{ color: '#0F172A' }}>Manufacturer Remarks:</strong> {viewingQuote.remarks}
              </div>
            )}
          </div>

          {/* ── NEGOTIATION THREAD SECTION (ACTIVE ONLY IF STATUS IS NEGOTIATION) ── */}
          {viewingQuote.status === 'NEGOTIATION' && (() => {
            const firstLineId = viewingQuote.quoteLines[0]?.rfqLineId || 'rl1';
            const threadKey = `${viewingQuote.rfqId}_${firstLineId}_${myMfgId}`;
            const threadMsgs = (negotiationThreads && negotiationThreads[threadKey]) || [
              {
                id: 'msg_def_1',
                threadKey,
                senderRole: 'BUYER' as const,
                senderName: 'Apex Pharma Procurement Desk',
                timestamp: '14 Aug 2026, 02:15 PM',
                text: 'We are reviewing your commercial offer. Can you confirm if lead time can be compressed to 11 days for batch execution?'
              }
            ];
            const rev = revisedQuotes ? revisedQuotes[threadKey] : undefined;

            return (
              <div style={{ background: '#FFFFFF', border: '1px solid #FDE047', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#854D0E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={16} /> BUYER NEGOTIATION THREAD
                </div>

                {rev && (
                  <div style={{ background: '#FEFCE8', border: '1px solid #FDE047', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12.5, color: '#854D0E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✓ Active Revised Offer: Unit Price ₹{rev.unitPrice.toFixed(2)} · Lead Time {rev.leadTimeDays} Days · Final Price ₹{rev.finalPrice.toFixed(2)}/unit</span>
                    <span style={{ fontSize: 11, color: '#A16207' }}>Submitted on {rev.revisedAt}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 250, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
                  {threadMsgs.map(m => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.senderRole === 'SUPPLIER' ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        background: m.senderRole === 'SUPPLIER' ? '#0F766E' : '#F1F5F9',
                        color: m.senderRole === 'SUPPLIER' ? '#FFFFFF' : '#0F172A',
                        borderRadius: 8,
                        padding: '10px 14px',
                        fontSize: 13
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>
                        {m.senderName} · {m.timestamp}
                      </div>
                      <div>{m.text}</div>
                    </div>
                  ))}
                </div>

                {/* Reply Input Box & Revised Quote Button */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Type negotiation reply to buyer procurement team..."
                    value={detailReplyText}
                    onChange={e => setDetailReplyText(e.target.value)}
                    style={{ flex: 1, padding: '9px 14px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && detailReplyText.trim()) {
                        sendNegotiationMessage(threadKey, detailReplyText.trim(), 'SUPPLIER', `${myMfgName} (Sales)`);
                        setDetailReplyText('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (detailReplyText.trim()) {
                        sendNegotiationMessage(threadKey, detailReplyText.trim(), 'SUPPLIER', `${myMfgName} (Sales)`);
                        setDetailReplyText('');
                      }
                    }}
                    style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={14} /> Reply
                  </button>

                  <button
                    onClick={() => setRevisedQuoteModalContext({
                      rfqId: viewingQuote.rfqId,
                      rfqNumber: viewingQuote.rfqNumber,
                      lineId: firstLineId,
                      productName: viewingQuote.quoteLines[0]?.productName || 'Product Line',
                      unitPrice: viewingQuote.quoteLines[0]?.unitPrice || 8.50,
                      leadTimeDays: viewingQuote.quoteLines[0]?.leadTimeDays || 11
                    })}
                    style={{ padding: '9px 18px', fontSize: 13, fontWeight: 800, borderRadius: 6, background: '#D97706', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <DollarSign size={14} /> Submit Revised Quote
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── REJECTION DETAILS CALLOUT (IF REJECTED) ─────────── */}
          {(viewingQuote.status === 'REJECTED' || viewingQuote.status === 'NOT_SELECTED' || viewingQuote.rejectionReason) && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: 18, color: '#991B1B' }}>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={18} /> QUOTE RESPONSE DECISION: REJECTED
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                <strong>Procurement Rejection Reason:</strong> {viewingQuote.rejectionReason || 'Target price threshold not satisfied; alternative manufacturer awarded contract.'}
              </div>
            </div>
          )}

          {/* ── SUB-ORDER CREATED DOWNSTREAM CONTEXT ───────────── */}
          {(viewingQuote.status === 'SUB-ORDER CREATED' || viewingQuote.status === 'ACCEPTED' || viewingQuote.status === 'SELECTED') && (
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                    DOWNSTREAM EXECUTION / SUB-ORDER CREATED
                  </div>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                    Sub-Order Ref: {viewingQuote.subOrderNumber || 'SO-2026-1001-01'}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setViewingQuote(null);
                    setActiveTab('orders');
                  }}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Package size={15} /> Open Sub-Order Management →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12.5, color: '#334155' }}>
                <div>Master Order: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>MO-2026-1001</strong></div>
                <div>Manufacturing Execution: <strong style={{ color: '#15803D' }}>IN PRODUCTION</strong></div>
                <div>Dispatch SLA: <strong style={{ color: '#D97706' }}>On Schedule (20 Aug 2026)</strong></div>
                <div>Cold-Chain Protocol: <strong style={{ color: '#0F766E' }}>ACTIVE (2°C - 8°C)</strong></div>
              </div>
            </div>
          )}

          {/* Page Footer Navigation */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setViewingQuote(null)}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={15} /> Back to Quote Submissions
            </button>

            {(viewingQuote.status === 'SUB-ORDER CREATED' || viewingQuote.status === 'ACCEPTED' || viewingQuote.status === 'SELECTED') && (
              <button
                onClick={() => {
                  setViewingQuote(null);
                  setActiveTab('orders');
                }}
                style={{ padding: '8px 18px', borderRadius: 6, background: '#15803D', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Package size={15} /> View Sub-Order →
              </button>
            )}
          </div>

        </div>
      ) : (
        /* ── QUOTE SUBMISSIONS LANDING LIST PAGE (DEFAULT VIEW) ─────────────────── */
        <>
          {/* ── Header Bar ────────────────────────────────────────────── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>MANUFACTURING OPERATIONS / QUOTE SUBMISSIONS</div>
              <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                QUOTE SUBMISSIONS
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                All commercial quotations submitted by {myMfgName} with real-time lifecycle tracking.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('rfqs')}
              style={{ padding: '9px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FileText size={15} /> View Assigned RFQs →
            </button>
          </div>

          {/* ── Summary Cards Bar ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Submissions</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.total}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Commercial quote records</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending Review</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>{metrics.pendingReview}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Submitted / Under review</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Negotiations</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 4 }}>{metrics.negotiation}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Revision requested by buyer</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Accepted & Created</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.accepted}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Converted to Sub-Orders</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Rejected / Expired</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626', fontFamily: 'monospace', marginTop: 4 }}>{metrics.rejectedExpired}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Closed / Expired offers</div>
            </div>
          </div>

          {/* ── Search & Filter Bar ───────────────────────────────────── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search by quote number, RFQ number, buyer, product..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Lifecycle Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">All Statuses ({myQuotes.length})</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="BUYER REVIEWING">Buyer Reviewing</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="ACCEPTED">Accepted / Sub-Order Created</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          {/* ── Quote Submissions Register Table (ONE ROW PER CONSOLIDATED QUOTE) ── */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUOTE NUMBER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ NUMBER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>BUYER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT / LINES</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>FINAL PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>LEAD TIME</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>VALID UNTIL</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>LAST UPDATED</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>NEXT ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                      <Tag size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No quote submissions match your filter.</div>
                      <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                        Navigate to "Assigned RFQs" to review buyer RFQs and submit commercial quotations.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map(q => {
                    const rfq = (rfqs || []).find(r => r.id === q.rfqId || r.rfqNumber === q.rfqNumber);
                    const buyerName = rfq ? rfq.customerName : 'Apex Pharma PCD Franchise';
                    const firstLine = q.quoteLines && q.quoteLines.length > 0 ? q.quoteLines[0] : null;
                    const badge = getStatusBadge(q.status);

                    return (
                      <tr
                        key={q.id}
                        onClick={() => setViewingQuote(q)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        {/* 1. QUOTE NUMBER */}
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {q.id}
                        </td>

                        {/* 2. RFQ NUMBER */}
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                          {q.rfqNumber}
                        </td>

                        {/* 3. BUYER */}
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                          {buyerName}
                        </td>

                        {/* 4. PRODUCT / LINES (Formatted: "Paracetamol 500mg (+1 lines)" or single name) */}
                        <td style={{ padding: '12px 14px', color: '#334155' }}>
                          {firstLine ? (
                            <span>
                              {firstLine.productName}
                              {q.quoteLines.length > 1 && <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginLeft: 4 }}>(+{q.quoteLines.length - 1} lines)</span>}
                            </span>
                          ) : (
                            `${q.quoteLines?.length || 1} Product Lines`
                          )}
                        </td>

                        {/* 5. FINAL PRICE */}
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          ₹{q.totalAmount ? q.totalAmount.toLocaleString('en-IN') : '0'}
                        </td>

                        {/* 6. LEAD TIME */}
                        <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                          {firstLine?.leadTimeDays || 14} Days
                        </td>

                        {/* 7. VALID UNTIL */}
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {q.validUntil || '2026-09-30'}
                        </td>

                        {/* 8. STATUS */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>

                        {/* 9. LAST UPDATED */}
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {q.lastUpdated || q.submissionDate || '2026-08-14'}
                        </td>

                        {/* 10. NEXT ACTION (EXPLICIT USER ACTIONS ONLY) */}
                        <td onClick={e => e.stopPropagation()} style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                          {q.status === 'SUB-ORDER CREATED' || q.status === 'ACCEPTED' || q.status === 'SELECTED' ? (
                            <button
                              onClick={() => {
                                setActiveTab('orders');
                              }}
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#15803D', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Package size={13} /> View Sub-Order →
                            </button>
                          ) : q.status === 'NEGOTIATION' ? (
                            <button
                              onClick={() => setViewingQuote(q)}
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#D97706', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <MessageSquare size={13} /> Respond
                            </button>
                          ) : q.status === 'DRAFT' ? (
                            <button
                              onClick={() => {
                                setActiveTab('rfqs');
                              }}
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#1D4ED8', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit3 size={13} /> Continue Quote
                            </button>
                          ) : q.status === 'REJECTED' || q.status === 'NOT_SELECTED' ? (
                            <button
                              onClick={() => setViewingQuote(q)}
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={13} /> View Reason
                            </button>
                          ) : (
                            <button
                              onClick={() => setViewingQuote(q)}
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={13} /> View Quote
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── REVISED QUOTE MODAL (POST-BUYER NEGOTIATION RESPONSE ONLY) ────────── */}
      {revisedQuoteModalContext && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setRevisedQuoteModalContext(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Submit Revised Commercial Offer</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{revisedQuoteModalContext.productName}</div>
              </div>
              <button onClick={() => setRevisedQuoteModalContext(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmRevisedQuoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Unit Price (₹) *</label>
                  <input type="number" step="0.01" required value={revUnitPrice} onChange={e => setRevUnitPrice(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Lead Time (Days) *</label>
                  <input type="number" required value={revLeadTimeDays} onChange={e => setRevLeadTimeDays(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tax (%)</label>
                  <input type="number" value={revTaxPercent} onChange={e => setRevTaxPercent(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Discount (%)</label>
                  <input type="number" value={revDiscountPercent} onChange={e => setRevDiscountPercent(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>MOQ (Units)</label>
                  <input type="number" value={revMoq} onChange={e => setRevMoq(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Remarks / Commercial Notes</label>
                <textarea rows={2} value={revRemarks} onChange={e => setRevRemarks(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, resize: 'none' }} />
              </div>

              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6, padding: 12, fontSize: 12.5, color: '#0F766E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Final Price / Unit (with tax & disc):</span>
                <strong style={{ fontSize: 15, fontFamily: 'monospace' }}>
                  ₹{(revUnitPrice * (1 + revTaxPercent / 100) * (1 - revDiscountPercent / 100)).toFixed(2)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setRevisedQuoteModalContext(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>Submit Revised Quote →</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
