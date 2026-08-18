import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark } from '../components/common/LogoMark';
import { BuyerOnboardingWizard } from '../components/modules/BuyerOnboardingWizard';
import { ManufacturerOnboardingWizard } from '../components/modules/ManufacturerOnboardingWizard';
import {
  ArrowRight, ShieldCheck, FileText, CheckCircle2, Factory,
  Building2, Truck, Receipt, Layers, RefreshCw, Clock,
  BarChart3, Globe, Zap, Bot, Lock, Star, MapPin, ChevronRight,
  Check, Package, Users, TrendingUp, Award, Network, X, Phone, Mail,
  MessageSquare, Calendar, HelpCircle, DollarSign, Cpu, FileCheck
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'HOME' | 'PLATFORM' | 'BUYERS' | 'MANUFACTURERS' | 'PRICING'>('HOME');

  // Modals & Drawers State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isContactSalesDrawerOpen, setIsContactSalesDrawerOpen] = useState(false);
  const [isMfgModalOpen, setIsMfgModalOpen] = useState(false);
  const [showBuyerWizard, setShowBuyerWizard] = useState(false);

  // Demo Form State
  const [demoForm, setDemoForm] = useState({
    fullName: '', email: '', companyName: '', phone: '',
    companyType: 'Buyer Organization', teamSize: '10–50 employees',
    demoDate: '2026-08-12', demoTime: '14:00 IST', message: ''
  });
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Sales Enquiry Form State
  const [salesForm, setSalesForm] = useState({
    name: '', company: '', email: '', phone: '', message: ''
  });
  const [salesSubmitted, setSalesSubmitted] = useState(false);

  // Manufacturer Registration Form State
  const [mfgForm, setMfgForm] = useState({
    companyName: '', mfgLicenseNo: '', whoGmpNo: '', cdscoDetails: '',
    categories: 'Finished Formulations', capacity: '50M Units/Month',
    location: 'Baddi, Himachal Pradesh', contactPerson: '', email: '', phone: ''
  });
  const [mfgSubmitted, setMfgSubmitted] = useState(false);

  const handleScheduleDemo = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  const handleSendSalesEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setSalesSubmitted(true);
  };

  const handleSubmitMfgApp = (e: React.FormEvent) => {
    e.preventDefault();
    setMfgSubmitted(true);
  };

  if (showBuyerWizard) {
    return (
      <div style={{ background: '#0F172A', minHeight: '100vh', padding: 24 }}>
        <button onClick={() => setShowBuyerWizard(false)} style={{ margin: '0 0 20px 24px', padding: '8px 16px', background: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
          ← Back to FactoryGrid Landing
        </button>
        <BuyerOnboardingWizard />
      </div>
    );
  }

  return (
    <div style={{ background: '#07111D', color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh' }}>

      {/* ── TOP ENTERPRISE NAVIGATION HEADER ─────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(7, 17, 29, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand Logo */}
          <div onClick={() => setCurrentView('HOME')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <LogoMark size={32} />
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>FactoryGrid</span>
              <span style={{ fontSize: 10, color: '#18D5A5', fontWeight: 700, marginLeft: 8, padding: '2px 6px', background: 'rgba(24,213,165,0.1)', border: '1px solid rgba(24,213,165,0.2)', borderRadius: 4 }}>B2B PHARMA</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: 28, fontSize: 13.5, fontWeight: 600 }}>
            {[
              { label: 'Platform Overview', view: 'PLATFORM' },
              { label: 'For Buyers', view: 'BUYERS' },
              { label: 'For Manufacturers', view: 'MANUFACTURERS' },
              { label: 'Pricing & Plans', view: 'PRICING' },
            ].map((nav) => (
              <span
                key={nav.view}
                onClick={() => setCurrentView(nav.view as any)}
                style={{
                  color: currentView === nav.view ? '#18D5A5' : '#94A3B8',
                  cursor: 'pointer',
                  paddingBottom: 4,
                  borderBottom: currentView === nav.view ? '2px solid #18D5A5' : '2px solid transparent',
                  transition: 'all 150ms ease'
                }}
              >
                {nav.label}
              </span>
            ))}
          </nav>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => onNavigate('login')} style={{ padding: '8px 16px', background: 'transparent', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
            <button onClick={() => { setIsContactSalesDrawerOpen(true); setSalesSubmitted(false); }} style={{ padding: '8px 16px', background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Contact Sales
            </button>
            <button onClick={() => { setIsDemoModalOpen(true); setDemoSubmitted(false); }} style={{ padding: '8px 18px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Request Demo
            </button>
          </div>

        </div>
      </header>

      {/* ── VIEW 1: HOME PAGE ────────────────────────────────── */}
      {currentView === 'HOME' && (
        <div>
          {/* Hero Section */}
          <section style={{ padding: '80px 24px 100px', maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(24,213,165,0.1)', border: '1px solid rgba(24,213,165,0.2)', fontSize: 12, color: '#18D5A5', fontWeight: 600, marginBottom: 20 }}>
              <ShieldCheck size={14} /> CDSCO & WHO-GMP Compliant B2B Sourcing Platform
            </div>

            <h1 style={{ fontSize: 44, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', maxWidth: 840, margin: '0 auto 20px', lineHeight: 1.15 }}>
              Enterprise B2B Pharmaceutical Sourcing & Manufacturing Execution
            </h1>

            <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.6 }}>
              Direct procurement platform connecting buyers with verified WHO-GMP formulation units. AI RFQ matching, sealed quote comparison, master PO splitting, and cold-chain telemetry.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <button onClick={() => { setIsDemoModalOpen(true); setDemoSubmitted(false); }} style={{ padding: '14px 28px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                Request Demo <ArrowRight size={16} />
              </button>
              <button onClick={() => { setIsContactSalesDrawerOpen(true); setSalesSubmitted(false); }} style={{ padding: '14px 28px', background: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Talk to Enterprise Sales
              </button>
            </div>

            {/* Feature Highlights Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 72, textAlign: 'left' }}>
              {[
                { title: '450+ WHO-GMP Units', desc: 'Pre-inspected formulation plants', icon: Factory },
                { title: 'AI Matching Engine', desc: 'Sub-second MOQ & capability matching', icon: Bot },
                { title: 'Master Order Splitting', desc: 'Multi-plant PO allocation', icon: Layers },
                { title: '2°C–8°C Cold Chain', desc: 'Real-time IoT reefer telemetry', icon: Truck },
              ].map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    <Icon size={22} style={{ color: '#18D5A5', marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>{feat.title}</div>
                    <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>{feat.desc}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ── VIEW 2: PLATFORM OVERVIEW ────────────────────────── */}
      {currentView === 'PLATFORM' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#18D5A5', textTransform: 'uppercase', marginBottom: 8 }}>PRODUCT OVERVIEW</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>End-to-End Enterprise Procurement Suite</h2>
          <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 40, maxWidth: 700 }}>
            FactoryGrid digitizes the complete pharmaceutical sourcing lifecycle — from multi-line RFQ creation to cold-chain delivery and automated AR reconciliation.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { title: '1. Multi-Line RFQ Engine', desc: 'Create complex RFQs with exact pharmacopoeial specs (IP/BP/USP), MOQs, target prices, and cold-chain requirements.' },
              { title: '2. AI Manufacturer Matching', desc: 'Sub-second matching against 450+ verified WHO-GMP formulation units based on plant capacity and compliance ratings.' },
              { title: '3. Sealed Quote Comparison', desc: 'Compare bids side-by-side on unit pricing, lead times, delivery schedules, and compliance scores.' },
              { title: '4. Master PO & Order Splitting', desc: 'Automatically split single buyer master orders into sub-orders for each allocated manufacturing facility.' },
              { title: '5. Cold-Chain IoT Telemetry', desc: 'Real-time 2°C–8°C temperature telemetry monitoring and electronic Proof of Delivery (POD).' },
              { title: '6. Automated GST Invoicing & AR', desc: 'Instant Form 27B tax invoice generation and automated payment reconciliation against corporate credit lines.' },
            ].map((p, i) => (
              <div key={i} style={{ padding: 24, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW 3: FOR BUYERS ───────────────────────────────── */}
      {currentView === 'BUYERS' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#18D5A5', textTransform: 'uppercase', marginBottom: 8 }}>BUYER SOLUTION</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Streamline Pharmaceutical Procurement</h2>
          <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 32 }}>
            Access verified WHO-GMP manufacturers, eliminate sourcing delays, and realize average commercial savings of 7.2%.
          </p>

          <button onClick={() => setShowBuyerWizard(true)} style={{ padding: '14px 28px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 40 }}>
            Register as Buyer →
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 20, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Verified Suppliers</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Every plant holds active CDSCO Form 25/28 and WHO-GMP certificates.</div>
            </div>
            <div style={{ padding: 20, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Transparent Bidding</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Sealed bids prevent price inflation and guarantee competitive unit rates.</div>
            </div>
            <div style={{ padding: 20, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Live Tracking</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Track batch manufacturing completion and live GPS reefer telemetry.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 4: FOR MANUFACTURERS ────────────────────────── */}
      {currentView === 'MANUFACTURERS' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#18D5A5', textTransform: 'uppercase', marginBottom: 8 }}>MANUFACTURER PARTNER PROGRAM</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Expand Plant Utilization with Verified Buyer RFQs</h2>
          <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 32 }}>
            List your WHO-GMP formulation plant, receive AI-matched sourcing orders, and enjoy guaranteed payment settlements.
          </p>

          <button onClick={() => { setIsMfgModalOpen(true); setMfgSubmitted(false); }} style={{ padding: '14px 28px', background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 40 }}>
            Become a Manufacturing Partner →
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ padding: 20, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>WHO-GMP Standard</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Verified CDSCO Form 25 licenses & batch testing compliance.</div>
            </div>
            <div style={{ padding: 20, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Capacity Utilization</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Fill idle tableting and capsule lines with steady B2B buyer volume.</div>
            </div>
            <div style={{ padding: 20, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Direct Dispatch</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Generate instant cold-chain dispatches and Form 27B B2B invoices.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 5: PRICING & PLANS ──────────────────────────── */}
      {currentView === 'PRICING' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#18D5A5', textTransform: 'uppercase', marginBottom: 8 }}>ENTERPRISE PRICING</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginBottom: 32 }}>Transparent Enterprise Licensing</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { name: 'Starter', price: '₹45,000 / mo', sub: 'For mid-size buyers', features: ['Up to 10 Active RFQs/mo', 'WHO-GMP Supplier Catalog', 'Sealed Bidding Matrix', 'Standard Email Support'] },
              { name: 'Professional', price: '₹1,20,000 / mo', sub: 'For enterprise procurement', features: ['Unlimited RFQs & Orders', 'AI Order Splitting Engine', 'Cold-Chain IoT Telemetry', 'Automated GST Invoicing', 'Dedicated Account Manager'] },
              { name: 'Enterprise', price: 'Custom Quote', sub: 'For hospital chains & pharma hubs', features: ['Custom ERP Integration (SAP/Oracle)', 'Volume-based Transaction Fees', 'Dedicated Compliance Officer', 'Custom SLA & On-premise Vault'] },
            ].map((plan, i) => (
              <div key={i} style={{ padding: 28, background: '#0F172A', border: i === 1 ? '2px solid #2563EB' : '1px solid #1E293B', borderRadius: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>{plan.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#18D5A5', margin: '10px 0 2px' }}>{plan.price}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>{plan.sub}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, color: '#94A3B8', marginBottom: 24 }}>
                  {plan.features.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={14} style={{ color: '#18D5A5' }} /> {f}
                    </div>
                  ))}
                </div>

                <button onClick={() => { setIsContactSalesDrawerOpen(true); setSalesSubmitted(false); }} style={{ width: '100%', height: 40, background: i === 1 ? '#2563EB' : '#1E293B', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Request Quote
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA 1 DEDICATED MODAL: REQUEST DEMO ──────────────── */}
      {isDemoModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 560, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 28, color: '#0F172A', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Schedule Product Demonstration</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Book a 1-on-1 walkthrough with FactoryGrid procurement engineers</div>
              </div>
              <button onClick={() => setIsDemoModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {demoSubmitted ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Check size={24} />
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>Demo Request Confirmed!</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                  A calendar invitation and web link have been dispatched to <strong>{demoForm.email}</strong>. Our enterprise sourcing manager will join at <strong>{demoForm.demoDate} ({demoForm.demoTime})</strong>.
                </p>
                <button onClick={() => setIsDemoModalOpen(false)} style={{ marginTop: 20, height: 38, padding: '0 24px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleScheduleDemo} style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12.5 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Full Name *</label>
                    <input type="text" required value={demoForm.fullName} onChange={e => setDemoForm({ ...demoForm, fullName: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Business Email *</label>
                    <input type="email" required value={demoForm.email} onChange={e => setDemoForm({ ...demoForm, email: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Company Name *</label>
                    <input type="text" required value={demoForm.companyName} onChange={e => setDemoForm({ ...demoForm, companyName: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phone Number *</label>
                    <input type="tel" required value={demoForm.phone} onChange={e => setDemoForm({ ...demoForm, phone: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Company Type</label>
                    <select value={demoForm.companyType} onChange={e => setDemoForm({ ...demoForm, companyType: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#FFFFFF' }}>
                      <option value="Buyer Organization">Buyer Organization</option>
                      <option value="Manufacturer">WHO-GMP Manufacturer</option>
                      <option value="Distributor">Pharma Distributor / PCD</option>
                      <option value="Hospital Network">Hospital Procurement Network</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Team Size</label>
                    <select value={demoForm.teamSize} onChange={e => setDemoForm({ ...demoForm, teamSize: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#FFFFFF' }}>
                      <option value="10–50 employees">10–50 employees</option>
                      <option value="50–200 employees">50–200 employees</option>
                      <option value="200+ employees">200+ Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Preferred Date</label>
                    <input type="date" value={demoForm.demoDate} onChange={e => setDemoForm({ ...demoForm, demoDate: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Preferred Time Slot</label>
                    <input type="text" value={demoForm.demoTime} onChange={e => setDemoForm({ ...demoForm, demoTime: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Sourcing Scope / Notes</label>
                  <textarea rows={2} value={demoForm.message} onChange={e => setDemoForm({ ...demoForm, message: e.target.value })} placeholder="Mention product categories or annual procurement volume..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', resize: 'none' }} />
                </div>

                <button type="submit" style={{ marginTop: 8, height: 40, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Schedule Demo →
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ── CTA 2 DEDICATED RIGHT DRAWER: CONTACT SALES ──────── */}
      {isContactSalesDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 460, height: '100vh', background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', padding: 28, color: '#0F172A', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 36px rgba(0,0,0,0.15)', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Talk to Enterprise Sales</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Volume Licensing, API Integrations & SLA Pricing</div>
              </div>
              <button onClick={() => setIsContactSalesDrawerOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {/* Direct Contact Actions Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12 }}>
                <Phone size={16} style={{ color: '#2563EB', marginBottom: 4 }} />
                <div style={{ fontWeight: 700, color: '#0F172A' }}>Call Direct</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>+91 1800-889-9000</div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12 }}>
                <Mail size={16} style={{ color: '#16A34A', marginBottom: 4 }} />
                <div style={{ fontWeight: 700, color: '#0F172A' }}>Email Desk</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>sales@factorygrid.com</div>
              </div>
            </div>

            {salesSubmitted ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Check size={24} />
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>Enquiry Dispatched!</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                  Our Enterprise VP of Sales will contact <strong>{salesForm.name}</strong> within 2 business hours.
                </p>
                <button onClick={() => setIsContactSalesDrawerOpen(false)} style={{ marginTop: 20, height: 38, padding: '0 24px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendSalesEnquiry} style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12.5 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Full Name *</label>
                  <input type="text" required value={salesForm.name} onChange={e => setSalesForm({ ...salesForm, name: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Company Name *</label>
                  <input type="text" required value={salesForm.company} onChange={e => setSalesForm({ ...salesForm, company: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Corporate Email *</label>
                  <input type="email" required value={salesForm.email} onChange={e => setSalesForm({ ...salesForm, email: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phone Number *</label>
                  <input type="tel" required value={salesForm.phone} onChange={e => setSalesForm({ ...salesForm, phone: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Requirements & Sourcing Volume</label>
                  <textarea rows={3} value={salesForm.message} onChange={e => setSalesForm({ ...salesForm, message: e.target.value })} placeholder="Describe custom workflows, ERP integration needs, or transaction volume..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', resize: 'none' }} />
                </div>

                <button type="submit" style={{ marginTop: 8, height: 40, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Send Enquiry →
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ── CTA 3 DEDICATED MODAL: MANUFACTURER REGISTRATION ─── */}
      {isMfgModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 620, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 28, color: '#0F172A', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Manufacturer Partner Registration</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>CDSCO License & WHO-GMP Plant Verification Application</div>
              </div>
              <button onClick={() => setIsMfgModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {mfgSubmitted ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Check size={24} />
                </div>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>Application Submitted!</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                  Your plant application for <strong>{mfgForm.companyName}</strong> has been logged. Our Regulatory Compliance Officer will inspect your WHO-GMP certificate and issue login credentials.
                </p>
                <button onClick={() => setIsMfgModalOpen(false)} style={{ marginTop: 20, height: 38, padding: '0 24px', background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitMfgApp} style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12.5 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Company Name *</label>
                    <input type="text" required value={mfgForm.companyName} onChange={e => setMfgForm({ ...mfgForm, companyName: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Manufacturing License No *</label>
                    <input type="text" required value={mfgForm.mfgLicenseNo} onChange={e => setMfgForm({ ...mfgForm, mfgLicenseNo: e.target.value })} placeholder="Form 25/28 No." style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>WHO-GMP Certificate No *</label>
                    <input type="text" required value={mfgForm.whoGmpNo} onChange={e => setMfgForm({ ...mfgForm, whoGmpNo: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>CDSCO Registration Details</label>
                    <input type="text" value={mfgForm.cdscoDetails} onChange={e => setMfgForm({ ...mfgForm, cdscoDetails: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Factory Location *</label>
                    <input type="text" required value={mfgForm.location} onChange={e => setMfgForm({ ...mfgForm, location: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Plant Monthly Capacity</label>
                    <input type="text" value={mfgForm.capacity} onChange={e => setMfgForm({ ...mfgForm, capacity: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Contact Person *</label>
                    <input type="text" required value={mfgForm.contactPerson} onChange={e => setMfgForm({ ...mfgForm, contactPerson: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Corporate Email *</label>
                    <input type="email" required value={mfgForm.email} onChange={e => setMfgForm({ ...mfgForm, email: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                  </div>
                </div>

                <button type="submit" style={{ marginTop: 8, height: 40, background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Submit Manufacturer Application →
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
