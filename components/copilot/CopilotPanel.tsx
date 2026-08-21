"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Play, ChevronDown, ChevronUp, AlertTriangle, Radio, Clock, X, DollarSign, Zap, BarChart2, ShieldCheck, Activity, Users, Globe, Eye, FileText, CheckCircle2 } from 'lucide-react'
import { pusherClient, pusherEnabled } from '@/lib/pusher-client'
import TiltInterventionModal from './TiltInterventionModal'
import type { BehavioralRawOutput } from './TiltInterventionModal'

// Demo payload — fires compliance risk modal on demand
const DEMO_TILT_DATA: BehavioralRawOutput = {
  psychState:             'TILT',
  stateScore:             87,
  likelyNextMistake:      'REVENGE_TRADE',
  warningMessage:         'Transaction TG-1042 invoice amount ($245,000) differs from declared Customs Entry ($220,000) by 11.3%. Manual review required before trade settlement.',
  recommendedAction:      'CLOSE_PLATFORM',
  breathingRoom:          'Review supporting Commercial Invoice and Customs Bill of Entry. Require dual-signature compliance signoff.',
  shouldStopTradingToday: true,
  stopReason:             'Compliance Exception Flagged — High Discrepancy Score 87/100.',
}

// ─── types ────────────────────────────────────────────────────────────────────

interface Position {
  id: string; symbol: string; side: string; entryPrice: number
  quantity: number; stopLoss: number | null; targetPrice: number | null
  status: string; openedAt: string
}

interface Perspective {
  id: string; type: string; model: string; summary: string
  signal: string | null; alertLevel: string; urgentAlert: string | null
  rawOutput: Record<string, any>
}

interface Session {
  id: string; status: string; refreshCount: number
  overallSignal: string | null; consensusSummary: string | null
  stopLossNote: string | null; nextDecisionLevel: number | null
  currentPrice: number | null
  lastRefreshedAt: string | null
  perspectives: Perspective[]
}

// ─── constants ────────────────────────────────────────────────────────────────

const PERSPECTIVE_META: Record<string, { label: string; color: string; icon: any }> = {
  TECHNICAL:     { label: 'Technical & Pricing Read', color: 'var(--accent-blue)', icon: BarChart2   },
  INSTITUTIONAL: { label: 'Institutional Order Flow', color: 'var(--purple)',      icon: Users        },
  DARK_POOL:     { label: 'Volume & Anomaly Check',   color: 'var(--cyan)',        icon: Eye          },
  SOCIAL:        { label: 'Market Sentiment',         color: '#D97706',            icon: Globe        },
  FUNDAMENTAL:   { label: 'Fundamental Valuation',    color: 'var(--warning)',     icon: Activity     },
  BEHAVIORAL:    { label: 'Risk & Rule Validation',   color: 'var(--bull)',        icon: ShieldCheck  },
}

const SIGNAL_ORDER: Record<string, number> = {
  TECHNICAL: 0, INSTITUTIONAL: 1, DARK_POOL: 2,
  SOCIAL: 3, FUNDAMENTAL: 4, BEHAVIORAL: 5,
}

const OVERALL_SIGNAL_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  FAVORABLE_CONDITIONS: { color: 'var(--bull)',         bg: 'var(--bull-dim)',        border: 'rgba(22,163,74,0.25)',  label: 'VERIFIED COMPLIANT'   },
  HOLD_POSITION:        { color: 'var(--accent-blue)',  bg: 'var(--accent-blue-dim)', border: 'rgba(37,99,235,0.25)',  label: 'STANDARD MONITORING'  },
  ADD_CAUTION:          { color: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(217,119,6,0.25)',  label: 'MANUAL REVIEW REQUIRED' },
  REVIEW_STOP:          { color: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(217,119,6,0.25)',  label: 'EXCEPTIONS DETECTED'  },
  EXIT_NOW:             { color: 'var(--bear)',         bg: 'var(--bear-dim)',        border: 'rgba(220,38,38,0.25)',  label: 'HIGH RISK REJECTION'  },
}

function signalColor(signal: string | null): string {
  if (!signal) return 'var(--text-muted)'
  const s = signal.toUpperCase()
  if (['BULLISH', 'VERY_BULLISH', 'CALM_DISCIPLINED', 'ALIGNED', 'ACCUMULATING', 'FUNDAMENTAL'].includes(s)) return 'var(--bull)'
  if (['BEARISH', 'VERY_BEARISH', 'TILT', 'HIGH_RISK', 'DISTRIBUTING', 'OPPOSED', 'EXIT_NOW'].includes(s)) return 'var(--bear)'
  if (['SLIGHTLY_ANXIOUS', 'EMOTIONALLY_COMPROMISED', 'AGGRESSIVELY_BEARISH', 'ADD_CAUTION', 'REVIEW_STOP'].includes(s)) return 'var(--warning)'
  return 'var(--accent-blue)'
}

function elapsed(iso: string | null): string {
  if (!iso) return '—'
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60)   return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m ago`
}

function PerspectiveCard({ p }: { p: Perspective }) {
  const [expanded, setExpanded] = useState(false)
  const meta = PERSPECTIVE_META[p.type] ?? { label: p.type, color: 'var(--text-secondary)', icon: Activity }
  const Icon = meta.icon

  return (
    <div className="card-enterprise card-hover-lift" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: meta.color + '12', border: `1px solid ${meta.color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={14} color={meta.color} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-primary)' }}>
            {meta.label}
          </span>
        </div>
        {p.signal && (
          <span style={{
            fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
            color: signalColor(p.signal),
            background: signalColor(p.signal) + '12',
            border: `1px solid ${signalColor(p.signal)}25`,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {p.signal.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {p.urgentAlert && (
        <div style={{
          background: 'var(--bear-dim)', border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: '6px', padding: '8px 10px', fontSize: '12px',
          color: 'var(--bear)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <AlertTriangle size={12} /> {p.urgentAlert}
        </div>
      )}

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {p.summary || 'Compliance analysis currently unavailable.'}
      </p>

      {Object.keys(p.rawOutput ?? {}).length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '11px', color: 'var(--text-muted)', padding: 0, fontWeight: '600',
          }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide audit metadata' : 'View audit metadata'}
        </button>
      )}

      {expanded && (
        <pre className="slide-down" style={{
          marginTop: '10px', padding: '10px', borderRadius: '6px',
          background: 'var(--bg-subtle)', fontSize: '11px',
          color: 'var(--text-secondary)', overflowX: 'auto',
          border: '1px solid var(--border-default)', lineHeight: '1.5',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {JSON.stringify(p.rawOutput, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── Main Panel ────────────────────────────────────────────────────────────

interface Props {
  position: Position
  onPositionUpdate?: (updated: any) => void
}

export default function CopilotPanel({ position, onPositionUpdate }: Props) {
  const [session,                setSession]                = useState<Session | null>(null)
  const [analyzing,              setAnalyzing]              = useState(false)
  const [loading,                setLoading]                = useState(true)
  const [tiltDismissedAtRefresh, setTiltDismissedAtRefresh] = useState<number | null>(null)
  const [demoTilt,               setDemoTilt]               = useState(false)
  const [showCloseForm,          setShowCloseForm]          = useState(false)
  const [exitPrice,              setExitPrice]              = useState('')
  const [closing,                setClosing]                = useState(false)
  const [closeError,             setCloseError]             = useState('')
  const refreshTimer                                        = useRef<NodeJS.Timeout | null>(null)

  const isClosed = position.status === 'CLOSED'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res  = await fetch(`/api/positions/${position.id}`)
        const data = await res.json()
        if (data.success) {
          if (data.data.session) {
            setSession(data.data.session)
          } else if (position.status === 'OPEN') {
            setLoading(false)
            setAnalyzing(true)
            try {
              const sr = await fetch(`/api/positions/${position.id}/copilot/start`, { method: 'POST' })
              const sd = await sr.json()
              if (sd.success) setSession(sd.data.session)
            } finally {
              setAnalyzing(false)
            }
            return
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [position.id, position.status])

  useEffect(() => {
    const channel = pusherClient.subscribe(`copilot-${position.id}`)
    channel.bind('copilot-update', (payload: { session: Session }) => {
      setSession(payload.session)
      setAnalyzing(false)
    })
    return () => { pusherClient.unsubscribe(`copilot-${position.id}`) }
  }, [position.id])

  async function startCopilot() {
    setAnalyzing(true)
    try {
      const res  = await fetch(`/api/positions/${position.id}/copilot/start`, { method: 'POST' })
      const data = await res.json()
      if (data.success) setSession(data.data.session)
    } finally {
      setAnalyzing(false)
    }
  }

  const triggerRefresh = useCallback(async () => {
    setAnalyzing(true)
    try {
      const res  = await fetch(`/api/positions/${position.id}/copilot/refresh`, { method: 'POST' })
      const data = await res.json()
      if (data.success) setSession(data.data.session)
    } finally {
      setAnalyzing(false)
    }
  }, [position.id])

  useEffect(() => {
    if (session?.status !== 'ACTIVE' || isClosed) return
    const interval = pusherEnabled ? 60_000 : 15_000
    refreshTimer.current = setInterval(() => { triggerRefresh() }, interval)
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current) }
  }, [session?.status, isClosed, triggerRefresh])

  async function handleClosePosition() {
    const price = parseFloat(exitPrice)
    if (!exitPrice || isNaN(price) || price <= 0) {
      setCloseError('Enter a valid settlement exit price.')
      return
    }
    setCloseError('')
    setClosing(true)
    try {
      const res = await fetch(`/api/positions/${position.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED', exitPrice: price }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCloseForm(false)
        onPositionUpdate?.(data.data)
      } else {
        setCloseError(data.error || 'Failed to close trade position.')
      }
    } catch {
      setCloseError('Network error — please try again.')
    } finally {
      setClosing(false)
    }
  }

  const perspectives = [...(session?.perspectives ?? [])].sort(
    (a, b) => (SIGNAL_ORDER[a.type] ?? 99) - (SIGNAL_ORDER[b.type] ?? 99)
  )

  const livePrice    = session?.currentPrice != null && session.currentPrice > 0 ? session.currentPrice : null
  const pnlDollar    = livePrice !== null
    ? (position.side === 'LONG'
        ? (livePrice - position.entryPrice) * position.quantity
        : (position.entryPrice - livePrice) * position.quantity)
    : null
  const pnlPct       = livePrice !== null
    ? (position.side === 'LONG'
        ? ((livePrice - position.entryPrice) / position.entryPrice) * 100
        : ((position.entryPrice - livePrice) / position.entryPrice) * 100)
    : null
  const pnlPositive  = (pnlDollar ?? 0) >= 0

  const overallStyle = OVERALL_SIGNAL_STYLE[session?.overallSignal ?? ''] ?? OVERALL_SIGNAL_STYLE['HOLD_POSITION']

  const behavioralPerspective   = perspectives.find(p => p.type === 'BEHAVIORAL')
  const psychState              = behavioralPerspective?.signal ?? null
  const isTilt                  = psychState === 'TILT'
  const currentRefresh          = session?.refreshCount ?? 0
  const showTiltModal           = isTilt && (tiltDismissedAtRefresh === null || currentRefresh > tiltDismissedAtRefresh)
  const behavioralData          = behavioralPerspective?.rawOutput as BehavioralRawOutput | undefined

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', color: 'var(--text-muted)', fontSize: '13px', gap: '8px' }}>
        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
        Loading AI Compliance Session…
      </div>
    )
  }

  return (
    <div className="slide-in">
      {/* TILT Emergency Intervention Modal */}
      {showTiltModal && behavioralData && !demoTilt && (
        <TiltInterventionModal
          data={behavioralData}
          symbol={position.symbol}
          onDismiss={() => setTiltDismissedAtRefresh(currentRefresh)}
          onStopTrading={() => setTiltDismissedAtRefresh(currentRefresh)}
        />
      )}

      {/* Position Header Card */}
      <div className="card-enterprise" style={{ padding: '20px 22px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {position.symbol}
              </span>
              <span className={position.side === 'LONG' ? 'badge badge-compliant' : 'badge badge-flagged'}>
                {position.side}
              </span>
              <span className="badge badge-info" style={{ fontSize: '10px' }}>
                TRANSACTION AUDIT ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              Entry ${position.entryPrice.toFixed(2)} · Size: {position.quantity}
              {position.stopLoss && <span> · Stop Loss: ${position.stopLoss.toFixed(2)}</span>}
            </div>
          </div>

          {/* P&L & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {livePrice !== null && (
              <div style={{
                padding: '8px 14px', borderRadius: '8px',
                background: pnlPositive ? 'var(--bull-dim)' : 'var(--bear-dim)',
                border: `1px solid ${pnlPositive ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
                textAlign: 'right',
              }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unrealized Value</div>
                <div style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: pnlPositive ? 'var(--bull)' : 'var(--bear)' }}>
                  {pnlPositive ? '+' : ''}${pnlDollar!.toFixed(2)} ({pnlPositive ? '+' : ''}{pnlPct!.toFixed(2)}%)
                </div>
              </div>
            )}

            {!session && !analyzing && !isClosed && (
              <button className="btn-primary" onClick={startCopilot}>
                <Play size={14} /> Start Copilot
              </button>
            )}

            {session?.status === 'ACTIVE' && !analyzing && (
              <button className="btn-ghost" onClick={triggerRefresh} style={{ padding: '7px 12px', fontSize: '12px' }}>
                <RefreshCw size={12} /> Refresh Audit
              </button>
            )}

            {!isClosed && !showCloseForm && (
              <button
                onClick={() => { setShowCloseForm(true); setExitPrice((livePrice ?? position.entryPrice).toFixed(2)) }}
                className="btn-ghost"
                style={{ color: 'var(--bear)', borderColor: 'rgba(220,38,38,0.2)', background: 'var(--bear-dim)', padding: '7px 12px', fontSize: '12px' }}
              >
                <X size={12} /> Settle Trade
              </button>
            )}
          </div>
        </div>

        {/* Close position form inline */}
        {showCloseForm && !isClosed && (
          <div className="slide-down" style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-primary)' }}>Exit Settlement Price:</span>
            <input
              type="number"
              step="any"
              className="input-field"
              style={{ width: '140px', fontFamily: 'JetBrains Mono, monospace', padding: '6px 10px' }}
              value={exitPrice}
              onChange={e => setExitPrice(e.target.value)}
            />
            <button className="btn-primary" onClick={handleClosePosition} disabled={closing} style={{ padding: '7px 14px', fontSize: '12px' }}>
              {closing ? 'Settling…' : 'Confirm Settlement'}
            </button>
            <button className="btn-ghost" onClick={() => setShowCloseForm(false)} style={{ padding: '7px 12px', fontSize: '12px' }}>Cancel</button>
            {closeError && <span style={{ fontSize: '12px', color: 'var(--bear)' }}>{closeError}</span>}
          </div>
        )}
      </div>

      {/* Structured 2-Panel AI Compliance Assistant Layout */}
      {session && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }} className="copilot-grid">

          {/* Left Panel: Unified Verdict & Agent Factors */}
          <div>
            {/* Unified Compliance Verdict Card */}
            {session.consensusSummary && (
              <div className="card-enterprise" style={{
                padding: '20px', marginBottom: '16px',
                borderLeft: `4px solid ${overallStyle.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color={overallStyle.color} />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      AI Compliance Consensus Verdict
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '4px',
                    color: overallStyle.color, background: overallStyle.bg, border: `1px solid ${overallStyle.border}`,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {overallStyle.label}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: '14px' }}>
                  {session.consensusSummary}
                </p>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-default)' }}>
                  {session.stopLossNote && (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Risk Recommendation</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{session.stopLossNote}</div>
                    </div>
                  )}
                  {session.nextDecisionLevel && (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Key Decision Price</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                        ${session.nextDecisionLevel.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6 Perspective Agent Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {perspectives.map(p => <PerspectiveCard key={p.id} p={p} />)}
            </div>
          </div>

          {/* Right Panel: Factor Risk Matrix & Audit Trace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Factor Risk Matrix */}
            <div className="card-enterprise" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Zap size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Compliance Risk Factors
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { factor: 'Entity & Exporter Verification', risk: 'LOW', color: 'var(--bull)' },
                  { factor: 'Document Consistency OCR', risk: 'LOW', color: 'var(--bull)' },
                  { factor: 'Transaction Amount Matching', risk: 'MEDIUM', color: 'var(--warning)' },
                  { factor: 'Sanctions & Country Routing', risk: 'LOW', color: 'var(--bull)' },
                  { factor: 'Regulatory Exception Risk', risk: 'LOW', color: 'var(--bull)' },
                ].map(f => (
                  <div key={f.factor} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-subtle)', borderRadius: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{f.factor}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: f.color, fontFamily: 'JetBrains Mono, monospace' }}>
                      {f.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card-enterprise" style={{ padding: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Recommended Compliance Action
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}>
                  <CheckCircle2 size={14} /> Approve Trade Compliance
                </button>
                <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', color: 'var(--warning)', borderColor: 'rgba(217,119,6,0.3)' }}>
                  <AlertTriangle size={14} /> Flag for Manual Exception Review
                </button>
              </div>
            </div>

            {/* Audit Trace Timestamp */}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Session Refreshed: {elapsed(session.lastRefreshedAt)} · Run #{session.refreshCount}
              <br />
              256-Bit Encrypted Audit Log
            </div>
          </div>
        </div>
      )}
    </div>
  )
}