import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark } from '../components/common/LogoMark';
import { EnterpriseAccessRequestModal } from '../components/common/EnterpriseAccessRequestModal';
import { BuyerOnboardingWizard } from '../components/modules/BuyerOnboardingWizard';
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

/* ─────────────────────────────────────────────────────────
   BACKGROUND CANVAS — Aurora Nebula (Approved Dark Theme)
───────────────────────────────────────────────────────── */
function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const t         = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Star = { x: number; y: number; vx: number; vy: number; r: number; a: number; maxA: number; phase: number };
    const NUM_STARS = 80;
    const stars: Star[] = Array.from({ length: NUM_STARS }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      vx:    (Math.random() - 0.5) * 0.12,
      vy:    (Math.random() - 0.5) * 0.12,
      r:     Math.random() * 1.2 + 0.3,
      a:     0,
      maxA:  Math.random() * 0.45 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }));

    type Blob = { ax: number; ay: number; r: number; cr: number; cg: number; cb: number; speed: number; phase: number };
    const blobs: Blob[] = [
      { ax: 0.10, ay: 0.05, r: 0.55, cr: 16,  cg: 185, cb: 129, speed: 0.00018, phase: 0 },
      { ax: 0.85, ay: 0.20, r: 0.45, cr: 58,  cg: 184, cb: 255, speed: 0.00014, phase: 1.8 },
      { ax: 0.50, ay: 0.72, r: 0.50, cr: 16,  cg: 185, cb: 129, speed: 0.00012, phase: 3.6 },
      { ax: 0.15, ay: 0.65, r: 0.38, cr: 58,  cg: 184, cb: 255, speed: 0.00022, phase: 0.9 },
      { ax: 0.75, ay: 0.80, r: 0.42, cr: 110, cg: 100, cb: 240, speed: 0.00016, phase: 5.0 },
      { ax: 0.45, ay: 0.35, r: 0.30, cr: 20,  cg: 200, cb: 200, speed: 0.00020, phase: 2.4 },
    ];

    const draw = () => {
      t.current += 1;
      const T = t.current;

      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = '#07111D';
      ctx.fillRect(0, 0, W, H);

      const CELL = 80;
      const cols = Math.ceil(W / CELL) + 1;
      const rows = Math.ceil(H / CELL) + 1;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.018)';
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, H);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(W, r * CELL);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        for (let r = 0; r <= rows; r++) {
          ctx.beginPath();
          ctx.arc(c * CELL, r * CELL, 1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fill();
        }
      }

      blobs.forEach(b => {
        const cx = (b.ax + Math.sin(T * b.speed + b.phase) * 0.12) * W;
        const cy = (b.ay + Math.cos(T * b.speed * 0.8 + b.phase) * 0.12) * H;
        const rad = Math.min(W, H) * b.r;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, `rgba(${b.cr},${b.cg},${b.cb},0.14)`);
        grad.addColorStop(0.5, `rgba(${b.cr},${b.cg},${b.cb},0.05)`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      stars.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = W;
        if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H;
        if (s.y > H) s.y = 0;

        s.a = (Math.sin(T * 0.02 + s.phase) * 0.5 + 0.5) * s.maxA;

        const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
        halo.addColorStop(0, `rgba(24,213,165,${(s.a * 0.5).toFixed(3)})`);
        halo.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 6, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,255,245,${(s.a * 1.1).toFixed(3)})`;
        ctx.fill();
      });

      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.9);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(7,17,29,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   HERO ISOMETRIC PARALLAX ILLUSTRATION
───────────────────────────────────────────────────────── */
function HeroIsometricIllustration() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(p => (p + 1) % 7), 2800);
    return () => clearInterval(t);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 16;
    setMouse({ x, y });
  }, []);

  const nodes = [
    { label: 'Buyer Office',     sub: 'Procurement Desk',   icon: Building2,   c: '#18D5A5', x: '6%',  y: '10%' },
    { label: 'FactoryGrid',      sub: 'Smart Platform',      icon: Zap,         c: '#3AB8FF', x: '42%', y: '5%'  },
    { label: 'Manufacturers',    sub: '450+ WHO-GMP Units',  icon: Factory,     c: '#18D5A5', x: '78%', y: '22%' },
    { label: 'Compliance Hub',   sub: 'CDSCO Verified',      icon: ShieldCheck, c: '#FBBF24', x: '72%', y: '62%' },
    { label: 'Warehouse',        sub: 'Cold Storage Vault',  icon: Package,     c: '#3AB8FF', x: '38%', y: '76%' },
    { label: 'Logistics',        sub: '2°C–8°C Cold Fleet',  icon: Truck,       c: '#18D5A5', x: '8%',  y: '56%' },
    { label: 'Delivery',         sub: 'GRN Confirmation',    icon: CheckCircle2,c: '#A78BFA', x: '60%', y: '88%' },
  ];

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMouseMove}
      style={{ width: '100%', aspectRatio: '1 / 0.85', position: 'relative', cursor: 'crosshair' }}
    >
      <motion.div
        animate={{ rotateX: 10 + mouse.y * 0.3, rotateY: -8 + mouse.x * 0.3 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
          viewBox="0 0 500 420"
          preserveAspectRatio="none"
        >
          {[
            ['30 50', '210 25'], ['210 25', '390 93'], ['390 93', '360 260'],
            ['360 260', '190 320'], ['190 320', '40 235'], ['40 235', '300 370'],
          ].map(([from, to], i) => (
            <line key={i}
              x1={from.split(' ')[0]} y1={from.split(' ')[1]}
              x2={to.split(' ')[0]}   y2={to.split(' ')[1]}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"
            />
          ))}
        </svg>

        {nodes.map((node, idx) => {
          const Icon = node.icon;
          const isActive = idx === activeIdx;
          return (
            <motion.div
              key={node.label}
              style={{
                position: 'absolute', left: node.x, top: node.y,
                width: 140,
                background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.65)',
                border: `1px solid ${isActive ? node.c + '60' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                padding: '11px 15px',
                backdropFilter: 'blur(20px)',
                boxShadow: isActive ? `0 16px 40px rgba(0,0,0,0.7), 0 0 24px ${node.c}30` : '0 8px 24px rgba(0,0,0,0.5)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${node.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} style={{ color: node.c }} />
                </div>
                <div style={{ flex: 1 }} />
                <span className="fg-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: node.c, display: 'inline-block' }} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{node.label}</div>
              <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>{node.sub}</div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   APPROVED LANDING PAGE MAIN COMPONENT
───────────────────────────────────────────────────────── */
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [currentView, setCurrentView] = useState<'HOME' | 'PLATFORM' | 'BUYERS' | 'MANUFACTURERS' | 'PRICING'>('HOME');

  // Modals & Drawers State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isContactSalesDrawerOpen, setIsContactSalesDrawerOpen] = useState(false);

  // Sales Enquiry Form State
  const [salesForm, setSalesForm] = useState({
    name: '', company: '', email: '', phone: '', message: ''
  });
  const [salesSubmitted, setSalesSubmitted] = useState(false);

  const handleSendSalesEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setSalesSubmitted(true);
  };

  return (
    <div style={{ background: '#07111D', color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', position: 'relative' }}>
      
      {/* Background Canvas Aurora Nebula */}
      <BackgroundCanvas />

      {/* ── TOP APPROVED NAVBAR ───────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(7, 17, 29, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
            <span onClick={() => setCurrentView('PLATFORM')} style={{ color: currentView === 'PLATFORM' ? '#18D5A5' : '#94A3B8', cursor: 'pointer' }}>Platform</span>
            <span onClick={() => setCurrentView('BUYERS')} style={{ color: currentView === 'BUYERS' ? '#18D5A5' : '#94A3B8', cursor: 'pointer' }}>Buyers</span>
            <span onClick={() => setCurrentView('MANUFACTURERS')} style={{ color: currentView === 'MANUFACTURERS' ? '#18D5A5' : '#94A3B8', cursor: 'pointer' }}>Manufacturers</span>
            <span onClick={() => setCurrentView('PRICING')} style={{ color: currentView === 'PRICING' ? '#18D5A5' : '#94A3B8', cursor: 'pointer' }}>Pricing</span>
          </nav>

          {/* Header Action Buttons (Exact Same Approved Styling & Positions) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => onNavigate('login')} style={{ padding: '8px 16px', background: 'transparent', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
            <button onClick={() => { setIsContactSalesDrawerOpen(true); setSalesSubmitted(false); }} style={{ padding: '8px 16px', background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Contact Sales
            </button>
            <button onClick={() => setIsDemoModalOpen(true)} style={{ padding: '8px 18px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Request Demo
            </button>
          </div>

        </div>
      </header>

      {/* ── VIEW 1: APPROVED HERO HOME PAGE ──────────────────── */}
      {currentView === 'HOME' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
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

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 60 }}>
              <button onClick={() => setIsDemoModalOpen(true)} style={{ padding: '14px 28px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                Request Demo <ArrowRight size={16} />
              </button>
              <button onClick={() => { setIsContactSalesDrawerOpen(true); setSalesSubmitted(false); }} style={{ padding: '14px 28px', background: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Contact Sales
              </button>
            </div>

            {/* Interactive Hero Parallax Isometric Illustration */}
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <HeroIsometricIllustration />
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
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#18D5A5', textTransform: 'uppercase', marginBottom: 8 }}>PRODUCT OVERVIEW</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>End-to-End Enterprise Procurement Suite</h2>
          <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 40, maxWidth: 700 }}>
            FactoryGrid digitizes the complete pharmaceutical sourcing lifecycle — from multi-line RFQ creation to cold-chain delivery and automated AR reconciliation.
          </p>
        </div>
      )}

      {/* ── VIEW 3: BUYERS ───────────────────────────────────── */}
      {currentView === 'BUYERS' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#18D5A5', textTransform: 'uppercase', marginBottom: 8 }}>BUYER SOLUTION</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Streamline Pharmaceutical Procurement</h2>
          <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 32 }}>
            Access verified WHO-GMP manufacturers, eliminate sourcing delays, and realize average commercial savings of 7.2%.
          </p>
        </div>
      )}

      {/* ── VIEW 4: MANUFACTURERS (NAV DESTINATION) ──────────── */}
      {currentView === 'MANUFACTURERS' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#18D5A5', textTransform: 'uppercase', marginBottom: 8 }}>MANUFACTURER PARTNER PROGRAM</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Expand Plant Utilization with Verified Buyer RFQs</h2>
          <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 32 }}>
            List your WHO-GMP formulation plant, receive AI-matched sourcing orders, and enjoy guaranteed payment settlements.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ padding: 20, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>WHO-GMP Verification</div>
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

      {/* ── VIEW 5: PRICING ──────────────────────────────────── */}
      {currentView === 'PRICING' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#18D5A5', textTransform: 'uppercase', marginBottom: 8 }}>PRICING</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>Enterprise Licensing & Transaction Fees</h2>
          <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 32 }}>Transparent enterprise pricing plans tailored for pharmaceutical buyers and manufacturer networks.</p>
        </div>
      )}

      {/* ── 1. DEMO REQUEST MODAL (EnterpriseAccessRequestModal) ── */}
      <EnterpriseAccessRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        defaultType="BUYER"
      />

      {/* ── 2. CONTACT SALES DRAWER / MODAL ────────────────── */}
      {isContactSalesDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 460, height: '100vh', background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', padding: 28, color: '#0F172A', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 36px rgba(0,0,0,0.15)', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Talk to Enterprise Sales</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Volume Licensing, API Integrations & SLA Discussion</div>
              </div>
              <button onClick={() => setIsContactSalesDrawerOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {/* Direct Contact Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12 }}>
                <Phone size={16} style={{ color: '#2563EB', marginBottom: 4 }} />
                <div style={{ fontWeight: 700, color: '#0F172A' }}>Call Sales</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>+91 1800-889-9000</div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12 }}>
                <Mail size={16} style={{ color: '#16A34A', marginBottom: 4 }} />
                <div style={{ fontWeight: 700, color: '#0F172A' }}>Email Sales</div>
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
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendSalesEnquiry} style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12.5 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Name *</label>
                  <input type="text" required value={salesForm.name} onChange={e => setSalesForm({ ...salesForm, name: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Company *</label>
                  <input type="text" required value={salesForm.company} onChange={e => setSalesForm({ ...salesForm, company: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Business Email *</label>
                  <input type="email" required value={salesForm.email} onChange={e => setSalesForm({ ...salesForm, email: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phone *</label>
                  <input type="tel" required value={salesForm.phone} onChange={e => setSalesForm({ ...salesForm, phone: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Message</label>
                  <textarea rows={3} value={salesForm.message} onChange={e => setSalesForm({ ...salesForm, message: e.target.value })} placeholder="How can our sales team help you?" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', resize: 'none' }} />
                </div>

                <button type="submit" style={{ marginTop: 8, height: 40, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Send Enquiry
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
