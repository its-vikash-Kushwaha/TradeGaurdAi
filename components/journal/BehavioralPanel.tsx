"use client"

import { useEffect, useState } from 'react'
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { analyzeBehavior, BehavioralReport } from '@/lib/ai/behavioral'

const RISK_COLOR: Record<string, string> = {
  LOW: 'var(--bull)',
  MEDIUM: 'var(--warning)',
  HIGH: 'var(--bear)',
}

function MiniTrendChart({ trend }: { trend: BehavioralReport['trend'] }) {
  if (trend.length < 2) return null
  const max = Math.max(...trend.map((d) => d.pnl), 0)
  const min = Math.min(...trend.map((d) => d.pnl), 0)
  const range = max - min || 1
  const w = 280
  const h = 40
  const points = trend.map((d, i) => {
    const x = (i / (trend.length - 1)) * w
    const y = h - ((d.pnl - min) / range) * h
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points.join(' ')} fill="none" stroke="var(--accent-blue)" strokeWidth="1.5" />
    </svg>
  )
}

export default function BehavioralPanel() {
  const [report, setReport] = useState<BehavioralReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/positions')
      .then((r) => r.json())
      .then((d) => {
        const trades = (d.success ? d.data : []).map((t: any) => ({
          id: t.id,
          symbol: t.symbol,
          entryTime: t.entryTime,
          exitTime: t.exitTime,
          pnl: t.pnl,
          quantity: t.quantity,
          status: t.status,
        }))
        setReport(analyzeBehavior(trades))
      })
      .catch(() => setReport(analyzeBehavior([])))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="skeleton" style={{ height: '200px', borderRadius: '10px', marginBottom: '16px' }} />
  }
  if (!report) return null

  const scoreColor = report.emotionalRiskScore >= 60 ? 'var(--bear)' : report.emotionalRiskScore >= 30 ? 'var(--warning)' : 'var(--bull)'

  return (
    <div className="card-enterprise" style={{ padding: '18px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Brain size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Behavioral Intelligence
          </span>
        </div>
        {report.usingSyntheticData && (
          <span className="badge badge-review" style={{ fontSize: '9px' }}>SYNTHETIC DEMO DATA</span>
        )}
      </div>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '14px' }}>
        {report.usingSyntheticData ? 'No trade history yet — showing a synthetic 30-day pattern for demo purposes.' : 'Computed from your real trade history.'}
      </p>

      {/* Emotional risk score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ fontSize: '24px', fontWeight: 800, color: scoreColor, fontFamily: 'JetBrains Mono, monospace' }}>
          {report.emotionalRiskScore}
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Emotional Risk Score</div>
          <div style={{ width: '120px', height: '5px', borderRadius: '4px', background: 'var(--bg-subtle)', overflow: 'hidden', marginTop: '4px' }}>
            <div style={{ width: `${report.emotionalRiskScore}%`, height: '100%', background: scoreColor }} />
          </div>
        </div>
      </div>

      {/* Pattern cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {report.patterns.map((p) => (
          <div key={p.id} style={{ display: 'flex', gap: '8px', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: '6px', alignItems: 'flex-start' }}>
            {p.detected ? <AlertTriangle size={12} color={RISK_COLOR[p.risk]} style={{ marginTop: '2px', flexShrink: 0 }} /> : <CheckCircle2 size={12} color="var(--bull)" style={{ marginTop: '2px', flexShrink: 0 }} />}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '2px' }}>{p.insight}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Win/loss + best/worst day */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '10px' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700 }}>Win Rate</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{report.winLossRatio.winRatePct}% ({report.winLossRatio.wins}W / {report.winLossRatio.losses}L)</div>
        </div>
        {report.bestDay && (
          <div>
            <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}><TrendingUp size={9} /> Best Day</div>
            <div style={{ fontWeight: 700, color: 'var(--bull)' }}>{report.bestDay.date} (+${report.bestDay.pnl.toFixed(0)})</div>
          </div>
        )}
        {report.worstDay && (
          <div>
            <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}><TrendingDown size={9} /> Worst Day</div>
            <div style={{ fontWeight: 700, color: 'var(--bear)' }}>{report.worstDay.date} (${report.worstDay.pnl.toFixed(0)})</div>
          </div>
        )}
      </div>

      {report.trend.length >= 2 && (
        <div>
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700, marginBottom: '4px' }}>P&amp;L Trend</div>
          <MiniTrendChart trend={report.trend} />
        </div>
      )}
    </div>
  )
}
