"use client"

import { useEffect, useState } from 'react'
import { ShieldCheck, Play, Cloud, Circle } from 'lucide-react'
import AnalysisLoader from '@/components/compliance/AnalysisLoader'
import VerdictPanel, { ComplianceVerdict } from '@/components/compliance/VerdictPanel'
import AuditTrail from '@/components/compliance/AuditTrail'

interface SystemStatus {
  bedrock: boolean
  dynamodb: boolean
  auditMode: 'dynamodb' | 'memory'
}

function StatusDot({ ok }: { ok: boolean }) {
  return <Circle size={7} fill={ok ? 'var(--bull)' : 'var(--bear)'} color={ok ? 'var(--bull)' : 'var(--bear)'} />
}

interface SyntheticCase {
  caseId: string
  symbol: string
  documents: Record<string, any>
  description: string
}

interface CardMeta {
  title: string
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  badgeClass: string
  description: string
}

// Card copy kept accurate to what each synthetic case actually contains —
// the task brief's "Missing bill of lading" for the medium case doesn't
// match lib/data/synthetic.ts (which omits the invoice, not the BoL), so
// this uses the real description to avoid contradicting the checks table.
const CARD_META: Record<string, CardMeta> = {
  case_clean_001:     { title: 'Standard LC Transaction',    risk: 'LOW',    badgeClass: 'badge-compliant', description: 'All 3 documents present, amounts and parties match' },
  case_highrisk_001:  { title: 'Amount Mismatch Detected',   risk: 'HIGH',   badgeClass: 'badge-flagged',   description: 'Invoice vs LC amount discrepancy, deliberately injected' },
  case_medium_001:    { title: 'Incomplete Documentation',   risk: 'MEDIUM', badgeClass: 'badge-review',    description: 'Invoice document missing from the case file' },
}

const CARD_ORDER = ['case_clean_001', 'case_highrisk_001', 'case_medium_001']

const RISK_ACCENT: Record<string, string> = {
  LOW: 'var(--bull)',
  MEDIUM: 'var(--warning)',
  HIGH: 'var(--bear)',
}

export default function CompliancePage() {
  const [cases, setCases] = useState<SyntheticCase[]>([])
  const [activeCase, setActiveCase] = useState<SyntheticCase | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [loaderDone, setLoaderDone] = useState(false)
  const [verdict, setVerdict] = useState<ComplianceVerdict | null>(null)
  const [fetchedVerdict, setFetchedVerdict] = useState<ComplianceVerdict | null>(null)
  const [auditRefresh, setAuditRefresh] = useState(0)
  const [status, setStatus] = useState<SystemStatus | null>(null)

  useEffect(() => {
    fetch('/api/compliance/demo')
      .then((res) => res.json())
      .then((data) => setCases(Array.isArray(data) ? data : []))
      .catch(() => setCases([]))

    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
  }, [])

  // Reveal the verdict only once BOTH the (real) API call has resolved and
  // the (cosmetic) loader animation has finished its stagger — whichever is
  // slower — so the pipeline never looks like it skipped steps.
  useEffect(() => {
    if (loaderDone && fetchedVerdict) {
      setVerdict(fetchedVerdict)
      setAnalyzing(false)
    }
  }, [loaderDone, fetchedVerdict])

  async function runAnalysis(c: SyntheticCase) {
    setActiveCase(c)
    setVerdict(null)
    setFetchedVerdict(null)
    setLoaderDone(false)
    setAnalyzing(true)

    try {
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: c.caseId, symbol: c.symbol, documents: c.documents }),
      })
      const data = await res.json()
      setFetchedVerdict(data)
    } catch {
      setAnalyzing(false)
    }
  }

  const orderedCases = CARD_ORDER
    .map((id) => cases.find((c) => c.caseId === id))
    .filter((c): c is SyntheticCase => Boolean(c))

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Status bar ── */}
      {status && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StatusDot ok={status.bedrock} /> Bedrock: {status.bedrock ? 'Connected' : 'Not connected'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StatusDot ok={status.dynamodb} /> DynamoDB: {status.dynamodb ? 'Live' : 'In-memory fallback'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StatusDot ok={true} /> Compliance Engine: Ready
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <ShieldCheck size={22} color="var(--accent-blue)" />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            TradeGuard Compliance Intelligence
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>GIFT City Trade Finance Risk Analysis</span>
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Cloud size={11} /> Powered by Amazon Bedrock
          </span>
        </div>
      </div>

      {/* ── Demo case cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {orderedCases.map((c) => {
          const meta = CARD_META[c.caseId]
          const isActive = activeCase?.caseId === c.caseId
          return (
            <div
              key={c.caseId}
              className="card-enterprise card-hover-lift"
              style={{
                padding: '18px',
                borderTop: `3px solid ${RISK_ACCENT[meta.risk]}`,
                opacity: analyzing && !isActive ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className={`badge ${meta.badgeClass}`}>{meta.risk} RISK</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{meta.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', minHeight: '36px' }}>{meta.description}</div>
              <button
                className="btn-primary"
                disabled={analyzing}
                onClick={() => runAnalysis(c)}
                style={{ width: '100%', justifyContent: 'center', opacity: analyzing ? 0.6 : 1, cursor: analyzing ? 'not-allowed' : 'pointer' }}
              >
                <Play size={13} /> Run Analysis
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Analysis panel ── */}
      {analyzing && !verdict && (
        <AnalysisLoader onComplete={() => setLoaderDone(true)} />
      )}

      {verdict && (
        <VerdictPanel verdict={verdict} onDecisionLogged={() => setAuditRefresh((n) => n + 1)} />
      )}

      {activeCase && (verdict || analyzing) && (
        <AuditTrail caseId={activeCase.caseId} refreshSignal={auditRefresh} />
      )}
    </div>
  )
}
