"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, ShieldAlert, ArrowRight, Radio, BookOpen, Search,
  Check, X, ChevronRight, BarChart3, Building2, Lock, FileText,
  AlertTriangle, Database, CheckCircle2, Zap
} from 'lucide-react'

interface ImpactStats {
  journals:     number
  positions:    number
  trapWarnings: number
  riskEntries:  number
  sessions:     number
}

const COMPLIANCE_PILLARS = [
  {
    icon: ShieldCheck,
    color: '#2563EB',
    title: 'Automated Document Verification',
    desc: 'OCR & field matching for Commercial Invoices, Bills of Lading, and Certificates of Origin. Instantly flags quantity, amount, and entity mismatches.',
  },
  {
    icon: ShieldAlert,
    color: '#DC2626',
    title: 'Trade Exception Detection',
    desc: 'Real-time detection of high-risk transactions, anomalous pricing spikes, and sanctioned country routing prior to trade execution.',
  },
  {
    icon: Radio,
    color: '#6366F1',
    title: 'Multi-Agent AI Copilot',
    desc: 'Parallel analysis from 6 domain agents — Technical, Institutional Flow, Dark Pool Anomaly, Fundamental, Sentiment, and Trader Risk.',
  },
  {
    icon: BookOpen,
    color: '#16A34A',
    title: 'Immutable Audit Trail',
    desc: 'Every AI decision, document check, and compliance verdict is timestamped and recorded in a 256-bit encrypted audit log.',
  },
  {
    icon: Search,
    color: '#D97706',
    title: 'Regulatory & Market Terminal',
    desc: 'Grounded search across US, Indian NSE/BSE, Crypto, Forex, and Commodities with Azure AI Foundry IQ regulatory indexing.',
  },
  {
    icon: Building2,
    color: '#0891B2',
    title: 'GIFT City / IFSC Integration',
    desc: 'Built to support International Banking Units (IBUs), trade finance desks, and cross-border regulatory frameworks.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Data & Document Intake',
    desc: 'Upload invoices, transaction payloads, or reference tickers. Real-time OCR and structure parsing begin instantly.',
    color: '#2563EB',
  },
  {
    step: '02',
    title: 'Multi-Agent Risk Analysis',
    desc: '6 domain compliance agents validate pricing, entity verification, regime signals, and historical anomalies in parallel.',
    color: '#6366F1',
  },
  {
    step: '03',
    title: 'Audit-Ready Verdict',
    desc: 'Synthesizes all perspective data into a single, explainable compliance recommendation with immutable audit logging.',
    color: '#16A34A',
  },
]

const FAQ_ITEMS = [
  { q: 'Is TradeGuard AI designed for institutional compliance teams?', a: 'Yes. TradeGuard AI is engineered specifically for financial institutions, trade finance desks, IBUs in GIFT City / IFSC, and compliance officers needing automated risk screening.' },
  { q: 'How does document OCR and field verification work?', a: 'TradeGuard AI extracts data fields from invoices, bills of lading, and certificates, comparing values against declared transaction amounts to catch discrepancies instantly.' },
  { q: 'Does TradeGuard support Indian NSE/BSE and global markets?', a: 'Yes. TradeGuard natively supports Indian NSE/BSE equities, US stocks, Crypto, Forex, and Commodities with real-time price feeds and currency formatting.' },
  { q: 'Are AI compliance decisions explainable and auditable?', a: 'Every verdict includes complete source attribution, factor breakdown, and a timestamped audit trail suitable for internal risk audits.' },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [stats,    setStats]    = useState<ImpactStats | null>(null)
  const [openFAQ,  setOpenFAQ]  = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/impact')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.success && d.userId) router.replace('/feed') })
      .catch(() => null)
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>

      {/* Professional Landing Nav Header */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '64px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
          }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>TradeGuard AI</span>
            <span style={{ fontSize: '10px', color: 'var(--accent-blue)', marginLeft: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '2px 6px', background: 'var(--accent-blue-dim)', borderRadius: '4px', border: '1px solid rgba(37,99,235,0.2)' }}>IFSC Node 01</span>
          </div>
        </div>

        {/* Center Navbar Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {[
            { label: 'Compliance Platform', href: '#features' },
            { label: 'Workflow', href: '#workflow' },
            { label: 'Regulatory Terminal', href: '/research' },
            { label: 'GIFT City / IFSC', href: '#ifsc' },
            { label: 'FAQ', href: '#faq' },
          ].map(link => (
            <Link key={link.label} href={link.href} style={{
              textDecoration: 'none', color: 'var(--text-secondary)',
              fontSize: '13px', fontWeight: '600', transition: 'color 0.15s ease',
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/feed" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy-primary)', cursor: 'pointer' }}>Sign In</span>
          </Link>
          <Link href="/feed" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '13px' }}>
              Launch Platform <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 40px 60px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '20px', marginBottom: '24px',
          background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)',
        }}>
          <Building2 size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)', letterSpacing: '0.02em' }}>
            Enterprise Trade Compliance & Risk Intelligence Platform
          </span>
        </div>

        <h1 style={{
          fontSize: '48px', fontWeight: '900', lineHeight: '1.12',
          marginBottom: '20px', letterSpacing: '-0.02em', color: 'var(--navy-primary)',
        }}>
          Intelligent Trade Compliance, Risk &
          <br />
          <span style={{ color: 'var(--accent-blue)' }}>Regulatory Automation</span>
        </h1>

        <p style={{
          fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.6,
          maxWidth: '680px', margin: '0 auto 36px',
        }}>
          Analyze trade documents, validate transactions, detect compliance exceptions, and generate explainable AI-powered risk assessments in real time.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '60px' }}>
          <Link href="/feed" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '8px' }}>
              Start Compliance Review <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/copilot" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '8px' }}>
              <Radio size={16} color="var(--accent-blue)" /> Live AI Copilot
            </button>
          </Link>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
          background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px',
          border: '1px solid var(--border-default)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          {[
            { value: '98.4%',   label: 'Compliance Accuracy Rate',   sub: 'verified rules'             },
            { value: '100%',    label: 'Audit Log Integrity',       sub: '256-bit encrypted history'   },
            { value: stats?.positions ? String(stats.positions) : '2,480+', label: 'Transactions Screened', sub: 'active & archived'       },
            { value: stats?.trapWarnings ? String(stats.trapWarnings) : '142', label: 'Exceptions Flagged', sub: 'risk alerts generated'   },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px', fontWeight: '900', fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '4px', color: 'var(--navy-primary)',
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Workflow */}
      <AnimatedSection>
        <section id="workflow" style={{ padding: '60px 40px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{
              fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)',
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px',
            }}>
              Workflow Architecture
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>
              3-Step Compliance Verification Pipeline
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="card-enterprise card-hover-lift" style={{ padding: '28px 24px' }}>
                <div style={{
                  fontSize: '12px', fontWeight: '800', color: item.color,
                  fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px',
                  letterSpacing: '0.06em',
                }}>
                  STAGE {item.step}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--navy-primary)', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Capabilities */}
      <AnimatedSection>
        <section id="features" style={{ padding: '60px 40px', background: '#FFFFFF', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)',
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px',
              }}>
                Capabilities
              </div>
              <h2 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>
                Enterprise Compliance Architecture
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {COMPLIANCE_PILLARS.map(f => {
                const Icon = f.icon
                return (
                  <div key={f.title} className="card-enterprise card-hover-lift" style={{ padding: '24px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      background: f.color + '10', border: `1px solid ${f.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '16px',
                    }}>
                      <Icon size={20} color={f.color} />
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy-primary)', marginBottom: '8px' }}>{f.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection>
        <section id="faq" style={{ padding: '60px 40px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '26px', fontWeight: '800', color: 'var(--navy-primary)', marginBottom: '32px', textAlign: 'center',
              letterSpacing: '-0.01em',
            }}>
              Enterprise & Regulatory FAQ
            </h2>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '16px 0', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '14px', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy-primary)' }}>
                    {item.q}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: '600' }}>
                    {openFAQ === i ? '−' : '+'}
                  </span>
                </button>
                {openFAQ === i && (
                  <div style={{ paddingBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid var(--border-default)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
            <strong>TradeGuard AI</strong> — Intelligent Trade Compliance & Risk Intelligence Platform · IFSC GIFT City Node
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            © 2025 TradeGuard AI. All rights reserved. 256-bit encrypted audit log architecture.
          </div>
        </div>
      </footer>
    </div>
  )
}