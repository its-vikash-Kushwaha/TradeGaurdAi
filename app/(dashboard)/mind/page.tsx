"use client"

import { useState, useEffect } from 'react'
import { Brain, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Info } from 'lucide-react'
import DirectiveCard from '@/components/mind/DirectiveCard'
import TraderModelCard from '@/components/mind/TraderModelCard'
import RegimeBadge from '@/components/shared/RegimeBadge'

interface DirectiveHistory {
  id:             string
  directiveDate:  string
  acknowledged:   boolean
  directive: { headline: string; todayEV: string; sizeGuidance: string }
}

const REGIME_CONFIG: Record<string, { color: string; bg: string; label: string; description: string }> = {
  BULL_TREND: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  label: 'Bull Trend',  description: 'Strong upward market regime' },
  BEAR_TREND: { color: '#DC2626', bg: 'rgba(220,38,38,0.08)', label: 'Bear Trend',  description: 'Negative market pressure'  },
  CHOP:       { color: '#D97706', bg: 'rgba(217,119,6,0.08)',  label: 'Range-bound', description: 'High chop and sideways action' },
  CRISIS:     { color: '#DC2626', bg: 'rgba(220,38,38,0.12)', label: 'High Volatility', description: 'Elevated systemic risk event' },
}

interface RegimeData {
  current_regime: string
  confidence:     number
  posterior:      Record<string, number>
  source:         string
  resolvedIndex:  string
}

function RegimePanel({ symbol }: { symbol: string }) {
  const [regime,  setRegime]  = useState<RegimeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/regime?symbol=${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setRegime(d.data) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) {
    return (
      <div className="card-enterprise" style={{ padding: '16px' }}>
        <div className="skeleton" style={{ height: '14px', width: '60%', borderRadius: '4px', marginBottom: '10px' }} />
        <div className="skeleton" style={{ height: '36px', width: '100%', borderRadius: '6px' }} />
      </div>
    )
  }

  if (!regime) return null

  const config  = REGIME_CONFIG[regime.current_regime] ?? { color: '#64748B', bg: 'var(--bg-subtle)', label: regime.current_regime, description: '' }
  const confPct = (regime.confidence * 100).toFixed(0)

  return (
    <div className="card-enterprise card-hover-lift" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.color }} />
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--navy-primary)' }}>{regime.resolvedIndex}</span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}>
          {config.label}
        </span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{config.description}</p>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Classifier Confidence</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: config.color, fontFamily: 'JetBrains Mono, monospace' }}>{confPct}%</span>
        </div>
        <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${confPct}%`, background: config.color, borderRadius: '2px' }} />
        </div>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-default)', paddingTop: '8px' }}>
        Source: {regime.source === 'heuristic' ? 'Estimated Statistical Model' : 'Regime Classifier'}
      </div>
    </div>
  )
}

export default function MindPage() {
  const [history,  setHistory]  = useState<DirectiveHistory[]>([])
  const [isPro,    setIsPro]    = useState(false)
  const [showHist, setShowHist] = useState(false)

  useEffect(() => {
    fetch('/api/mind/directive')
      .then(r => r.json())
      .then(d => { if (d.plan) setIsPro(d.plan === 'PRO') })
      .catch(() => null)

    fetch('/api/mind/directive/history')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setHistory(d.data) })
      .catch(() => null)
  }, [])

  return (
    <div className="slide-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>
            Risk & Regime Engine
          </h1>
          <span className="badge badge-info">REGULATORY ENGINE</span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <RegimeBadge symbol="^NSEI" />
            <RegimeBadge symbol="^GSPC" />
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Daily compliance directive, risk parameter model, and statistical regime classification
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: '20px', alignItems: 'start' }} className="mind-grid">
        {/* Col 1 */}
        <div>
          <DirectiveCard isPro={isPro} />

          {history.length > 1 && (
            <div className="card-enterprise" style={{ padding: '16px', marginTop: '16px' }}>
              <button
                onClick={() => setShowHist(h => !h)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Directive History ({history.length - 1})
                </span>
                {showHist ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              </button>

              {showHist && (
                <div className="slide-down" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.slice(1).map(d => (
                    <div key={d.id} style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{d.directiveDate}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.directive.headline}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Col 2 */}
        <div>
          <TraderModelCard />
        </div>

        {/* Col 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Market Regimes
          </div>
          <RegimePanel symbol="^NSEI" />
          <RegimePanel symbol="^GSPC" />
          <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Regimes are computed via statistical classification models on 5-year price returns.
          </div>
        </div>
      </div>
    </div>
  )
}
