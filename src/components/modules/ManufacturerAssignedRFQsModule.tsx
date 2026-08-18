import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RFQ, ManufacturerQuote } from '../../types';
import {
  FileText, Search, Filter, Clock, CheckCircle2, AlertTriangle,
  X, Send, Eye, Save, Calendar, Check, AlertCircle, Building2, Package,
  ShieldCheck, XCircle, ThumbsDown, ArrowLeft, MessageSquare, Edit3, DollarSign,
  Calculator, Truck, Percent, Tag
} from 'lucide-react';

interface LineInputState {
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  taxPercent: number;
  discountPercent: number;
  deliveryTerms: string;
  remarks: string;
}

export const ManufacturerAssignedRFQsModule: React.FC = () => {
  const {
    rfqs, quotes, mappings, manufacturers, submitQuote, declineRFQ, declinedRfqs,
    negotiationThreads, sendNegotiationMessage, revisedQuotes, submitRevisedQuote,
    addAuditLog, setActiveTab
  } = useApp();

  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const myMfgCode = myMfg?.code || 'MFG000401';

  // Check if RFQ is declined by current manufacturer
  const isDeclinedByMe = (rfqId: string) => {
    const list = (declinedRfqs && declinedRfqs[rfqId]) || [];
    return list.some(d => d.manufacturerId === myMfgId || d.manufacturerName?.includes('SunBio'));
  };

  const getDeclineRecord = (rfqId: string) => {
    const list = (declinedRfqs && declinedRfqs[rfqId]) || [];
    return list.find(d => d.manufacturerId === myMfgId || d.manufacturerName?.includes('SunBio'));
  };

  // Products mapped to this manufacturer
  const myMappedProductIds = useMemo(() => {
    const pMappings = (mappings || []).filter(m =>
      m.manufacturerId === myMfgId || m.manufacturerCode === myMfgCode || m.manufacturerName?.includes('SunBio')
    );
    return new Set(pMappings.map(m => m.productId));
  }, [mappings, myMfgId, myMfgCode]);

  // Filter RFQs assigned to THIS manufacturer
  const assignedRfqs = useMemo(() => {
    return (rfqs || []).filter(rfq => {
      const isEligible = rfq.lines.some(line => myMappedProductIds.has(line.productId) || line.productName.toLowerCase().includes('paracetamol') || line.productName.toLowerCase().includes('amox') || line.productName.toLowerCase().includes('panto'));
      return isEligible;
    });
  }, [rfqs, myMappedProductIds]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // Filtered RFQ List
  const filteredRfqs = useMemo(() => {
    return assignedRfqs.filter(rfq => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        rfq.rfqNumber.toLowerCase().includes(q) ||
        rfq.customerName.toLowerCase().includes(q) ||
        rfq.lines.some(l => l.productName.toLowerCase().includes(q));

      const myQuote = quotes.find(q => q.rfqId === rfq.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
      const isQuoted = !!myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED' || myQuote.status === 'SUB-ORDER CREATED');
      const isDraft = !!myQuote && myQuote.status === 'DRAFT';
      const isDeclined = isDeclinedByMe(rfq.id);
      const isExpired = new Date() > new Date(rfq.deadlineDate);

      const isNegotiation = rfq.lines.some(l => {
        const threadKey = `${rfq.id}_${l.id}_${myMfgId}`;
        return (negotiationThreads && negotiationThreads[threadKey]?.length > 0) || (revisedQuotes && revisedQuotes[threadKey]);
      });

      let matchesFilter = true;
      if (selectedFilter === 'NEW') matchesFilter = !myQuote && !isDeclined && !isExpired;
      else if (selectedFilter === 'DRAFT') matchesFilter = isDraft && !isDeclined;
      else if (selectedFilter === 'SUBMITTED') matchesFilter = isQuoted;
      else if (selectedFilter === 'NEGOTIATION') matchesFilter = isNegotiation;
      else if (selectedFilter === 'DECLINED') matchesFilter = isDeclined;
      else if (selectedFilter === 'EXPIRED') matchesFilter = isExpired;

      return matchesSearch && matchesFilter;
    });
  }, [assignedRfqs, quotes, declinedRfqs, negotiationThreads, revisedQuotes, searchTerm, selectedFilter, myMfgId]);

  // Metric Summaries for KPI Cards
  const metrics = useMemo(() => {
    let pendingQuoteCount = 0;
    let inNegotiationCount = 0;
    let submittedCount = 0;

    assignedRfqs.forEach(rfq => {
      const myQuote = quotes.find(q => q.rfqId === rfq.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
      const isDeclined = isDeclinedByMe(rfq.id);
      const isExpired = new Date() > new Date(rfq.deadlineDate);

      const hasNegotiation = rfq.lines.some(l => {
        const threadKey = `${rfq.id}_${l.id}_${myMfgId}`;
        return (negotiationThreads && negotiationThreads[threadKey]?.length > 0) || (revisedQuotes && revisedQuotes[threadKey]);
      });

      if (!isDeclined && !isExpired) {
        if (hasNegotiation) {
          inNegotiationCount++;
        } else if (myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED' || myQuote.status === 'SUB-ORDER CREATED')) {
          submittedCount++;
        } else {
          pendingQuoteCount++;
        }
      }
    });

    return {
      total: assignedRfqs.length,
      pendingQuote: pendingQuoteCount,
      inNegotiation: inNegotiationCount,
      submitted: submittedCount
    };
  }, [assignedRfqs, quotes, declinedRfqs, negotiationThreads, revisedQuotes, myMfgId]);

  // Selected RFQ for Detail Inspection / Pricing View
  const [selectedRfqForDetail, setSelectedRfqForDetail] = useState<RFQ | null>(null);

  // Per-Line Commercial Input States for active RFQ (6 Fields Per Line)
  const [lineInputs, setLineInputs] = useState<Record<string, LineInputState>>({});
  const [quoteFormError, setQuoteFormError] = useState<string | null>(null);

  // Synchronize line inputs when opening RFQ Detail
  useEffect(() => {
    if (selectedRfqForDetail) {
      const existingQuote = quotes.find(q => q.rfqId === selectedRfqForDetail.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
      const initial: Record<string, LineInputState> = {};

      selectedRfqForDetail.lines.forEach(line => {
        const matchLine = existingQuote?.quoteLines?.find(ql => ql.rfqLineId === line.id || ql.productId === line.productId);
        initial[line.id] = {
          unitPrice: matchLine?.unitPrice ?? (line.targetPrice || 12.00),
          moq: matchLine?.moq ?? 1000,
          leadTimeDays: matchLine?.leadTimeDays ?? 14,
          taxPercent: matchLine?.taxPercent ?? 12,
          discountPercent: matchLine?.discountPercent ?? 5,
          deliveryTerms: (matchLine as any)?.deliveryTerms || (existingQuote as any)?.deliveryTerms || 'Ex-Factory Hyderabad / Cold-Chain Fleet',
          remarks: ''
        };
      });

      setLineInputs(initial);
      setQuoteFormError(null);
    }
  }, [selectedRfqForDetail, quotes, myMfgId]);

  // Handle Per-Line Input Field Changes
  const handleLineInputChange = (lineId: string, field: keyof LineInputState, value: any) => {
    setLineInputs(prev => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || {
          unitPrice: 12.00,
          moq: 1000,
          leadTimeDays: 14,
          taxPercent: 12,
          discountPercent: 5,
          deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
          remarks: ''
        }),
        [field]: value
      }
    }));
  };

  // Calculate Real-Time Line Breakdown Math
  const getLineCalculation = (line: any) => {
    const input = lineInputs[line.id] || {
      unitPrice: line.targetPrice || 12.00,
      moq: 1000,
      leadTimeDays: 14,
      taxPercent: 12,
      discountPercent: 5,
      deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
      remarks: ''
    };

    const baseAmount = line.quantity * input.unitPrice;
    const discountAmount = baseAmount * (input.discountPercent / 100);
    const amountAfterDiscount = baseAmount - discountAmount;
    const taxAmount = amountAfterDiscount * (input.taxPercent / 100);
    const finalLineAmount = Math.round(amountAfterDiscount + taxAmount);

    return {
      baseAmount,
      discountAmount,
      taxAmount,
      finalLineAmount
    };
  };

  // Consolidated Quote Overall Summary Calculations
  const consolidatedSummary = useMemo(() => {
    if (!selectedRfqForDetail) return { totalLines: 0, totalQty: 0, subtotal: 0, totalDiscount: 0, totalTax: 0, finalQuotationValue: 0, maxLeadTime: 14, overallDeliveryTerms: 'Ex-Factory Hyderabad' };

    let totalQty = 0;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let finalQuotationValue = 0;
    let maxLeadTime = 0;
    let overallDeliveryTerms = 'Ex-Factory Hyderabad / Cold-Chain Fleet';

    selectedRfqForDetail.lines.forEach(line => {
      totalQty += line.quantity;
      const input = lineInputs[line.id] || {
        unitPrice: line.targetPrice || 12.00,
        moq: 1000,
        leadTimeDays: 14,
        taxPercent: 12,
        discountPercent: 5,
        deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
        remarks: ''
      };

      const calc = getLineCalculation(line);
      subtotal += calc.baseAmount;
      totalDiscount += calc.discountAmount;
      totalTax += calc.taxAmount;
      finalQuotationValue += calc.finalLineAmount;
      if (input.leadTimeDays > maxLeadTime) maxLeadTime = input.leadTimeDays;
      if (input.deliveryTerms) overallDeliveryTerms = input.deliveryTerms;
    });

    return {
      totalLines: selectedRfqForDetail.lines.length,
      totalQty,
      subtotal: Math.round(subtotal),
      totalDiscount: Math.round(totalDiscount),
      totalTax: Math.round(totalTax),
      finalQuotationValue: Math.round(finalQuotationValue),
      maxLeadTime: maxLeadTime || 14,
      overallDeliveryTerms
    };
  }, [selectedRfqForDetail, lineInputs]);

  // Single Consolidated Quote Submission Handler
  const handleSingleConsolidatedQuoteSubmit = () => {
    if (!selectedRfqForDetail) return;
    setQuoteFormError(null);

    if (isDeclinedByMe(selectedRfqForDetail.id)) {
      setQuoteFormError('This RFQ has been declined. Quote submission is disabled.');
      return;
    }

    const isExpired = new Date() > new Date(selectedRfqForDetail.deadlineDate);
    if (isExpired) {
      setQuoteFormError('RFQ deadline has passed. Late quotations cannot be submitted.');
      return;
    }

    // Comprehensive Mandatory Field Validation per Product Line
    for (const line of selectedRfqForDetail.lines) {
      const input = lineInputs[line.id];
      if (!input || !input.unitPrice || input.unitPrice <= 0) {
        setQuoteFormError(`Complete pricing details for ${line.productName}: Valid Unit Price is required before submitting the quotation.`);
        return;
      }
      if (!input.moq || input.moq <= 0) {
        setQuoteFormError(`Complete pricing details for ${line.productName}: Valid MOQ is required before submitting the quotation.`);
        return;
      }
      if (!input.leadTimeDays || input.leadTimeDays <= 0) {
        setQuoteFormError(`Complete pricing details for ${line.productName}: Valid Lead Time is required before submitting the quotation.`);
        return;
      }
    }

    // Build consolidated quoteLines array containing all 6 commercial fields for each line
    const quoteLines = selectedRfqForDetail.lines.map(line => {
      const input = lineInputs[line.id] || {
        unitPrice: 12.00,
        moq: 1000,
        leadTimeDays: 14,
        taxPercent: 12,
        discountPercent: 5,
        deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
        remarks: ''
      };
      const calc = getLineCalculation(line);

      return {
        rfqLineId: line.id,
        productId: line.productId,
        productName: line.productName,
        unitPrice: input.unitPrice,
        taxPercent: input.taxPercent,
        discountPercent: input.discountPercent,
        leadTimeDays: input.leadTimeDays,
        moq: input.moq,
        deliveryTerms: input.deliveryTerms,
        calculatedFinalPrice: calc.finalLineAmount
      };
    });

    const totalCalculatedAmount = quoteLines.reduce((acc, l) => acc + l.calculatedFinalPrice, 0);

    const newQuote: ManufacturerQuote = {
      id: `QTE-2026-${Math.floor(100 + Math.random() * 900)}`,
      rfqId: selectedRfqForDetail.id,
      rfqNumber: selectedRfqForDetail.rfqNumber,
      manufacturerId: myMfgId,
      manufacturerName: myMfgName,
      submissionDate: new Date().toISOString().split('T')[0],
      validUntil: '2026-09-30',
      status: 'SUBMITTED',
      quoteLines,
      totalAmount: totalCalculatedAmount,
      remarks: 'WHO-GMP lab batch assay included with cold chain packaging.',
      ...({ deliveryTerms: consolidatedSummary.overallDeliveryTerms } as any)
    };

    submitQuote(newQuote);
    addAuditLog('SUBMIT_MANUFACTURER_QUOTE', `Submitted consolidated quote for RFQ ${selectedRfqForDetail.rfqNumber} (${quoteLines.length} products, ₹${totalCalculatedAmount.toLocaleString('en-IN')})`);
    alert(`✔ Consolidated Quotation Submitted Successfully!\n\nRFQ #: ${selectedRfqForDetail.rfqNumber}\nProduct Lines: ${selectedRfqForDetail.lines.length}\nFinal Quotation Value: ₹${totalCalculatedAmount.toLocaleString('en-IN')}`);
  };

  // Negotiation Modal State (product-level modal post-buyer response)
  const [viewingNegotiationLine, setViewingNegotiationLine] = useState<{
    rfq: RFQ;
    lineId: string;
    productName: string;
  } | null>(null);

  // Revised Quote Modal State (post-buyer response)
  const [revisedQuoteContext, setRevisedQuoteContext] = useState<{
    rfqId: string;
    rfqNumber: string;
    lineId: string;
    productName: string;
    lineQty: number;
    currentUnitPrice: number;
    currentLeadTime: number;
  } | null>(null);

  const [revUnitPrice, setRevUnitPrice] = useState<number>(8.50);
  const [revTaxPercent, setRevTaxPercent] = useState<number>(12);
  const [revDiscountPercent, setRevDiscountPercent] = useState<number>(5);
  const [revLeadTimeDays, setRevLeadTimeDays] = useState<number>(11);
  const [revMoq, setRevMoq] = useState<number>(1000);
  const [revRemarks, setRevRemarks] = useState<string>('Revised commercial offer with compressed delivery commitment.');

  // Negotiation reply text inside modal
  const [modalReplyText, setModalReplyText] = useState<string>('');

  // Decline RFQ Modal State
  const [declineModalRfq, setDeclineModalRfq] = useState<RFQ | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [declineRemarks, setDeclineRemarks] = useState<string>('');
  const [declineFormError, setDeclineFormError] = useState<string | null>(null);

  // Open Decline Confirmation Modal
  const handleOpenDeclineModal = (rfq: RFQ, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeclineModalRfq(rfq);
    setDeclineReason('');
    setDeclineRemarks('');
    setDeclineFormError(null);
  };

  // Confirm Decline Action
  const handleConfirmDeclineAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalRfq) return;

    if (!declineReason || !declineReason.trim()) {
      setDeclineFormError('Please select a reason for declining this RFQ.');
      return;
    }

    declineRFQ(declineModalRfq.id, myMfgId, myMfgName, declineReason, declineRemarks);
    setDeclineModalRfq(null);
    alert(`RFQ ${declineModalRfq.rfqNumber} declined successfully.`);
  };

  // Open Revised Quote Modal
  const handleOpenRevisedQuoteModal = (rfq: RFQ, line: any) => {
    const threadKey = `${rfq.id}_${line.id}_${myMfgId}`;
    const activeRev = revisedQuotes ? revisedQuotes[threadKey] : undefined;

    setRevisedQuoteContext({
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      lineId: line.id,
      productName: line.productName,
      lineQty: line.quantity,
      currentUnitPrice: activeRev ? activeRev.unitPrice : (lineInputs[line.id]?.unitPrice || line.targetPrice || 9.50),
      currentLeadTime: activeRev ? activeRev.leadTimeDays : (lineInputs[line.id]?.leadTimeDays || 14)
    });

    setRevUnitPrice(activeRev ? activeRev.unitPrice : (lineInputs[line.id]?.unitPrice || 8.50));
    setRevTaxPercent(12);
    setRevDiscountPercent(5);
    setRevLeadTimeDays(activeRev ? activeRev.leadTimeDays : 11);
    setRevMoq(1000);
    setRevRemarks(activeRev ? (activeRev.remarks || 'Revised price & compressed lead time.') : 'Revised commercial offer with 11-day delivery commitment.');
  };

  // Submit Revised Quote Form Handler
  const handleConfirmRevisedQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisedQuoteContext) return;

    const threadKey = `${revisedQuoteContext.rfqId}_${revisedQuoteContext.lineId}_${myMfgId}`;
    submitRevisedQuote(threadKey, {
      unitPrice: revUnitPrice,
      taxPercent: revTaxPercent,
      discountPercent: revDiscountPercent,
      leadTimeDays: revLeadTimeDays,
      moq: revMoq,
      remarks: revRemarks
    });

    alert(`✔ Revised Quote Submitted Successfully!\n\nProduct: ${revisedQuoteContext.productName}\nRevised Price: ₹${revUnitPrice.toFixed(2)}\nLead Time: ${revLeadTimeDays} Days`);
    setRevisedQuoteContext(null);
  };

  // Status Badge Helper
  const getRFQStatusBadge = (rfq: RFQ) => {
    const isDeclined = isDeclinedByMe(rfq.id);
    const isExpired = new Date() > new Date(rfq.deadlineDate);
    const myQuote = quotes.find(q => q.rfqId === rfq.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));

    const hasNegotiation = rfq.lines.some(l => {
      const threadKey = `${rfq.id}_${l.id}_${myMfgId}`;
      return (negotiationThreads && negotiationThreads[threadKey]?.length > 0) || (revisedQuotes && revisedQuotes[threadKey]);
    });

    if (isDeclined) return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'DECLINED' };
    if (isExpired) return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB', label: 'EXPIRED' };
    if (hasNegotiation) return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'NEGOTIATION' };
    if (myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED' || myQuote.status === 'SUB-ORDER CREATED')) return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'SUBMITTED' };
    if (myQuote && myQuote.status === 'DRAFT') return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'DRAFT' };
    return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: 'PRICING IN PROGRESS' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>
      
      {selectedRfqForDetail ? (
        /* ── RFQ PRICING & CONSOLIDATED QUOTATION VIEW ─────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Top Header Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => setSelectedRfqForDetail(null)}
                style={{ padding: '7px 12px', borderRadius: 6, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={15} /> Back to Assigned RFQs
              </button>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{selectedRfqForDetail.rfqNumber}</span>
                  {(() => {
                    const badge = getRFQStatusBadge(selectedRfqForDetail);
                    return (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  {selectedRfqForDetail.customerName}
                </h1>
              </div>
            </div>

            {/* TOP-RIGHT ACTION BUTTONS ONLY: Decline RFQ & Single Consolidated Submit Quote */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {(() => {
                const isDeclined = isDeclinedByMe(selectedRfqForDetail.id);
                const myQuote = quotes.find(q => q.rfqId === selectedRfqForDetail.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
                const isSubmitted = myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED' || myQuote.status === 'SUB-ORDER CREATED');
                const isExpired = new Date() > new Date(selectedRfqForDetail.deadlineDate);

                if (isDeclined) {
                  return (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', padding: '6px 12px', background: '#FEF2F2', borderRadius: 6, border: '1px solid #FCA5A5' }}>
                      ✕ RFQ Declined
                    </span>
                  );
                }

                if (isExpired) {
                  return (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', padding: '6px 12px', background: '#F3F4F6', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                      Expired
                    </span>
                  );
                }

                if (isSubmitted) {
                  return (
                    <button
                      onClick={() => {
                        setSelectedRfqForDetail(null);
                        setActiveTab('quotes');
                      }}
                      style={{ padding: '8px 16px', borderRadius: 6, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      ✓ Quote Submitted — View Submissions →
                    </button>
                  );
                }

                return (
                  <>
                    <button
                      onClick={(e) => handleOpenDeclineModal(selectedRfqForDetail, e)}
                      style={{ padding: '8px 14px', borderRadius: 6, background: '#FFF', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <ThumbsDown size={14} /> Decline RFQ
                    </button>

                    <button
                      onClick={handleSingleConsolidatedQuoteSubmit}
                      style={{ padding: '8px 20px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.2)' }}
                    >
                      <Send size={15} /> Submit Quote
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Validation Error Banner */}
          {quoteFormError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 16px', borderRadius: 8, color: '#DC2626', fontSize: 12.5, fontWeight: 700 }}>
              ⚠️ {quoteFormError}
            </div>
          )}

          {/* BUYER SPECIFICATIONS & COMMERCIAL DETAILS */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 12.5, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Buyer Organization</div>
              <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{selectedRfqForDetail.customerName}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>RFQ Creation Date</div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedRfqForDetail.createdDate}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Required Delivery Date</div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedRfqForDetail.lines[0]?.requiredDate || '2026-09-15'}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Response Deadline</div>
              <div style={{ fontWeight: 800, color: '#D97706', marginTop: 2 }}>{selectedRfqForDetail.deadlineDate}</div>
            </div>
          </div>

          {/* REQUESTED PRODUCT LINES SECTION (EVERY PRODUCT HAS ITS OWN PRICING CARD) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 14 }}>
              REQUESTED PRODUCT LINES ({selectedRfqForDetail.lines.length}) — ENTER PRICING & COMMERCIAL TERMS FOR CONSOLIDATED QUOTE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {selectedRfqForDetail.lines.map(line => {
                const threadKey = `${selectedRfqForDetail.id}_${line.id}_${myMfgId}`;
                const threadMsgs = (negotiationThreads && negotiationThreads[threadKey]) || [];
                const activeRev = revisedQuotes ? revisedQuotes[threadKey] : undefined;
                const hasMsgs = threadMsgs.length > 0;

                const inputState = lineInputs[line.id] || {
                  unitPrice: line.targetPrice || 12.00,
                  moq: 1000,
                  leadTimeDays: 14,
                  taxPercent: 12,
                  discountPercent: 5,
                  deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
                  remarks: ''
                };

                const calc = getLineCalculation(line);

                return (
                  <div key={line.id} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    
                    {/* Line Header & Requirements */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{line.productName}</span>
                          {hasMsgs && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                              BUYER NEGOTIATION ACTIVE ({threadMsgs.length} msgs)
                            </span>
                          )}
                          {activeRev && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                              REVISED QUOTE SUBMITTED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                          Requested Quantity: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</strong> | Required Date: <strong>{line.requiredDate || '2026-09-15'}</strong> | Target Price: <strong>₹{(line.targetPrice || 12.00).toFixed(2)}</strong>
                        </div>
                      </div>

                      {/* Post-Buyer Response Actions ONLY (Shown when Buyer Negotiation is active) */}
                      {hasMsgs && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => setViewingNegotiationLine({ rfq: selectedRfqForDetail, lineId: line.id, productName: line.productName })}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <MessageSquare size={13} /> View Buyer Negotiation ({threadMsgs.length})
                          </button>

                          <button
                            onClick={() => handleOpenRevisedQuoteModal(selectedRfqForDetail, line)}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <DollarSign size={13} /> Submit Revised Quote
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 6 COMMERCIAL INPUT FIELDS FOR THIS PRODUCT LINE */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>UNIT PRICE (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={inputState.unitPrice}
                          onChange={e => handleLineInputChange(line.id, 'unitPrice', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700, background: '#FFF' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>MOQ (UNITS) *</label>
                        <input
                          type="number"
                          required
                          value={inputState.moq}
                          onChange={e => handleLineInputChange(line.id, 'moq', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>LEAD TIME (DAYS) *</label>
                        <input
                          type="number"
                          required
                          value={inputState.leadTimeDays}
                          onChange={e => handleLineInputChange(line.id, 'leadTimeDays', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>TAX (%)</label>
                        <input
                          type="number"
                          value={inputState.taxPercent}
                          onChange={e => handleLineInputChange(line.id, 'taxPercent', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>DISCOUNT (%)</label>
                        <input
                          type="number"
                          value={inputState.discountPercent}
                          onChange={e => handleLineInputChange(line.id, 'discountPercent', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>DELIVERY TERMS</label>
                        <select
                          value={inputState.deliveryTerms}
                          onChange={e => handleLineInputChange(line.id, 'deliveryTerms', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, background: '#FFF', fontWeight: 600 }}
                        >
                          <option value="Ex-Factory Hyderabad / Cold-Chain Fleet">Ex-Factory Hyderabad / Cold Fleet</option>
                          <option value="FOR Destination / Freight Included">FOR Destination / Freight Included</option>
                          <option value="FOB Port Clearance Included">FOB Port Clearance Included</option>
                          <option value="CIF Consignee Warehouse">CIF Consignee Warehouse</option>
                        </select>
                      </div>
                    </div>

                    {/* DYNAMIC CALCULATION BREAKDOWN FOR THIS LINE */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, fontSize: 12 }}>
                      <div>
                        <span style={{ color: '#64748B', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Base Amount:</span>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>₹{calc.baseAmount.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <span style={{ color: '#DC2626', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Discount ({inputState.discountPercent}%):</span>
                        <div style={{ fontWeight: 700, color: '#DC2626', fontFamily: 'monospace' }}>-₹{Math.round(calc.discountAmount).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <span style={{ color: '#16A34A', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Tax ({inputState.taxPercent}%):</span>
                        <div style={{ fontWeight: 700, color: '#16A34A', fontFamily: 'monospace' }}>+₹{Math.round(calc.taxAmount).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <span style={{ color: '#0F766E', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>Final Line Amount:</span>
                        <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', fontSize: 14 }}>₹{calc.finalLineAmount.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CONSOLIDATED QUOTE SUMMARY CARD ────────────────────────────── */}
          <div style={{ background: '#F0FDFA', border: '2px solid #0F766E', borderRadius: 12, padding: 22, boxShadow: '0 4px 14px rgba(15,118,110,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #99F6E4', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  CONSOLIDATED QUOTE SUMMARY
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  ONE CONSOLIDATED QUOTATION ({consolidatedSummary.totalLines} Product Lines · {consolidatedSummary.totalQty.toLocaleString()} Total Units)
                </h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Final Commercial Offer Value</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                  ₹{consolidatedSummary.finalQuotationValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 12.5, color: '#334155', marginBottom: 20 }}>
              <div>Subtotal Base Amount: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{consolidatedSummary.subtotal.toLocaleString('en-IN')}</strong></div>
              <div>Total Discount: <strong style={{ color: '#DC2626', fontFamily: 'monospace' }}>-₹{consolidatedSummary.totalDiscount.toLocaleString('en-IN')}</strong></div>
              <div>Total Tax (GST): <strong style={{ color: '#16A34A', fontFamily: 'monospace' }}>+₹{consolidatedSummary.totalTax.toLocaleString('en-IN')}</strong></div>
              <div>Overall Delivery Lead Time: <strong style={{ color: '#1D4ED8' }}>{consolidatedSummary.maxLeadTime} Days</strong></div>
              <div>Delivery Terms: <strong style={{ color: '#0F172A' }}>{consolidatedSummary.overallDeliveryTerms}</strong></div>
            </div>

            {/* SINGLE SUBMIT QUOTE PRIMARY ACTION BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #99F6E4' }}>
              <div style={{ fontSize: 12.5, color: '#0F766E', fontWeight: 600 }}>
                All requested line items will be transmitted together as <strong>ONE consolidated commercial quote</strong>.
              </div>

              {(() => {
                const myQuote = quotes.find(q => q.rfqId === selectedRfqForDetail.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
                const isSubmitted = myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED' || myQuote.status === 'SUB-ORDER CREATED');

                if (isSubmitted) {
                  return (
                    <button
                      onClick={() => {
                        setSelectedRfqForDetail(null);
                        setActiveTab('quotes');
                      }}
                      style={{ padding: '10px 20px', borderRadius: 8, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
                    >
                      ✓ Quote Submitted — View Submissions →
                    </button>
                  );
                }

                return (
                  <button
                    onClick={handleSingleConsolidatedQuoteSubmit}
                    style={{ padding: '11px 28px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,118,110,0.3)' }}
                  >
                    <Send size={16} /> Submit Complete Quotation →
                  </button>
                );
              })()}
            </div>
          </div>

        </div>
      ) : (
        /* ── ASSIGNED RFQS MAIN LIST VIEW (ENTERPRISE B2B TABLE) ───────────── */
        <>
          {/* Header Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>MANUFACTURING OPERATIONS / ASSIGNED RFQS</div>
              <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                ASSIGNED RFQS
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                Review assigned buyer RFQs, submit quotes, and manage commercial negotiations for {myMfgName}.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Search RFQs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: 180, padding: '7px 10px 7px 30px', fontSize: 12.5, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
                />
              </div>

              <select
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
                style={{ padding: '7px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">All Statuses ({assignedRfqs.length})</option>
                <option value="NEW">New Assigned</option>
                <option value="DRAFT">Draft Saved</option>
                <option value="SUBMITTED">Quote Submitted</option>
                <option value="NEGOTIATION">In Negotiation</option>
                <option value="DECLINED">Declined</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Assigned RFQs</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.total}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Total buyer RFQ distributions</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending Quote</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>{metrics.pendingQuote}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Awaiting initial quotation</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>In Negotiation</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 4 }}>{metrics.inNegotiation}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Buyer negotiation active</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Submitted</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.submitted}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Commercial quote submitted</div>
            </div>
          </div>

          {/* Enterprise RFQ List Table */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ #</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>BUYER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCTS</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>REQUIRED DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUOTE STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DEADLINE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredRfqs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                      <FileText size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No assigned RFQs match your filter.</div>
                    </td>
                  </tr>
                ) : (
                  filteredRfqs.map(rfq => {
                    const badge = getRFQStatusBadge(rfq);
                    const totalQty = rfq.lines.reduce((acc, l) => acc + l.quantity, 0);

                    return (
                      <tr
                        key={rfq.id}
                        onClick={() => setSelectedRfqForDetail(rfq)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {rfq.rfqNumber}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                          {rfq.customerName}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>
                          {rfq.lines.length} {rfq.lines.length === 1 ? 'Product' : 'Products'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
                          {totalQty.toLocaleString()} Units
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {rfq.lines[0]?.requiredDate || '2026-09-15'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {rfq.deadlineDate}
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                          <button
                            onClick={() => setSelectedRfqForDetail(rfq)}
                            style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            View RFQ →
                          </button>
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

      {/* ── MODAL 1: COMPACT NEGOTIATION THREAD MODAL (POST-BUYER RESPONSE) ── */}
      {viewingNegotiationLine && (() => {
        const { rfq, lineId, productName } = viewingNegotiationLine;
        const threadKey = `${rfq.id}_${lineId}_${myMfgId}`;
        const threadMsgs = (negotiationThreads && negotiationThreads[threadKey]) || [
          {
            id: 'msg_def_1',
            threadKey,
            senderRole: 'BUYER' as const,
            senderName: 'Apex Pharma Procurement Desk',
            timestamp: '14 Aug 2026, 02:15 PM',
            text: 'We are reviewing your offer. Can you improve unit price to ₹8.50 and compress lead time to 11 days?'
          }
        ];

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewingNegotiationLine(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>BUYER NEGOTIATION THREAD</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>{productName}</h3>
                  <div style={{ fontSize: 11, color: '#64748B' }}>RFQ Ref: {rfq.rfqNumber}</div>
                </div>
                <button onClick={() => setViewingNegotiationLine(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              {/* Message Stream */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                {threadMsgs.map(m => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.senderRole === 'SUPPLIER' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      background: m.senderRole === 'SUPPLIER' ? '#0F766E' : '#F1F5F9',
                      color: m.senderRole === 'SUPPLIER' ? '#FFFFFF' : '#0F172A',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 12.5
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginBottom: 3 }}>
                      {m.senderName} · {m.timestamp}
                    </div>
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>

              {/* Inline Reply Input */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <input
                  type="text"
                  placeholder="Type reply to buyer procurement team..."
                  value={modalReplyText}
                  onChange={e => setModalReplyText(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', fontSize: 12.5, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && modalReplyText.trim()) {
                      sendNegotiationMessage(threadKey, modalReplyText.trim(), 'SUPPLIER', `${myMfgName} (Sales)`);
                      setModalReplyText('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (modalReplyText.trim()) {
                      sendNegotiationMessage(threadKey, modalReplyText.trim(), 'SUPPLIER', `${myMfgName} (Sales)`);
                      setModalReplyText('');
                    }
                  }}
                  style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Send size={13} /> Reply
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 2: SUBMIT REVISED QUOTE FORM MODAL (POST-BUYER RESPONSE) ── */}
      {revisedQuoteContext && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setRevisedQuoteContext(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Submit Revised Commercial Quote</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{revisedQuoteContext.productName} ({revisedQuoteContext.lineQty.toLocaleString()} Units)</div>
              </div>
              <button onClick={() => setRevisedQuoteContext(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
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
                <button type="button" onClick={() => setRevisedQuoteContext(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>Submit Revised Quote →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: DECLINE RFQ CONFIRMATION MODAL ────────────────── */}
      {declineModalRfq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeclineModalRfq(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Decline RFQ {declineModalRfq.rfqNumber}?</h3>
              <button onClick={() => setDeclineModalRfq(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {declineFormError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: 10, borderRadius: 6, color: '#DC2626', fontSize: 12 }}>
                ⚠️ {declineFormError}
              </div>
            )}

            <form onSubmit={handleConfirmDeclineAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Select Reason for Declining *</label>
                <select value={declineReason} onChange={e => setDeclineReason(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}>
                  <option value="">-- Choose a Reason --</option>
                  <option value="Required delivery date not achievable">Required delivery date not achievable</option>
                  <option value="Production line at maximum capacity">Production line at maximum capacity</option>
                  <option value="Target price below manufacturing cost">Target price below manufacturing cost</option>
                  <option value="API / Raw material unavailable">API / Raw material unavailable</option>
                  <option value="Out of scope formulation">Out of scope formulation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Additional Remarks (Optional)</label>
                <textarea rows={3} value={declineRemarks} onChange={e => setDeclineRemarks(e.target.value)} placeholder="Provide optional notes for buyer..." style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setDeclineModalRfq(null)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm Decline</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
