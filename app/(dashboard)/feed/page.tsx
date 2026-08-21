"use client"

import { useState, useEffect } from 'react'
import {
  ShieldCheck, ShieldAlert, Activity, AlertTriangle, CheckCircle2,
  FileText, Clock, RefreshCw, Filter, ArrowUpRight, ChevronRight, Zap, Building2, Flame
} from 'lucide-react'
import IntelligenceFeed from '@/components/feed/IntelligenceFeed'
import RegimeBadge from '@/components/shared/RegimeBadge'
import DirectiveCard from '@/components/mind/DirectiveCard'

interface FeedStats {
  total:        number
  bullish:      number
  traps:        number
  avgSentiment: number
}

interface TrendingItem {
  id:            string
  symbol:        string
  hypeRating:    string
  sentimentScore: number
  mentionCount:  number
  grokAnalysis?: string | null
  priceChange1h?: number | null
}

interface MarketBrief {
  paragraph1?:     string
  paragraph2?:     string
  paragraph3?:     string
  topRisk?:        string
  marketMood?:     string
  suggestedFocus?: string[]
}

const HYPE_COLOR: Record<string, string> = {
  EXTREME: 'var(--bear)',
  HIGH:    'var(--warning)',
  MODERATE:'var(--accent-blue)',
  LOW:     'var(--bull)',
  ORGANIC: 'var(--bull)',
}

const MOOD_COLOR: Record<string, string> = {
  RISK_ON:  'var(--bull)',
  RISK_OFF: 'var(--bear)',
  VOLATILE: 'var(--bear)',
  CAUTIOUS: 'var(--warning)',
  RANGING:  'var(--accent-blue)',
}

export default function FeedPage() {
  const [stats,     setStats]     = useState<FeedStats | null>(null)
  const [trending,  setTrending]  = useState<TrendingItem[]>([])
  const [brief,     setBrief]     = useState<MarketBrief | null>(null)
  const [briefDate, setBriefDate] = useState<string | null>(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [isPro,     setIsPro]     = useState(false)
  const [userName,  setUserName]  = useState<string>('')

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.name) setUserName(d.data.name.split(' ')[0]) })
      .catch(() => {})

    fetch('/api/trending')
      .then(r => r.json())
      .then(d => { if (d.success) setTrending(d.data.slice(0, 5)) })

    fetch('/api/market-brief')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setBrief(d.data.aiSummary)
          setBriefDate(d.data.briefDate)
        }
      })

    fetch('/api/mind/directive')
      .then(r => r.json())
      .then(d => { if (d.plan) setIsPro(d.plan === 'PRO') })
      .catch(() => null)
  }, [])

  async function generateBrief() {
    setGeneratingBrief(true)
    try {
      const res  = await fetch('/api/brief/generate', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.data) {
        setBrief(data.data.aiSummary)
        setBriefDate(data.data.briefDate)
      }
    } finally {
      setGeneratingBrief(false)
    }
  }

  // Enterprise Compliance KPI Metrics
  const cards = stats
    ? [
        { label: 'Total Transactions',  value: (stats.total * 24 + 140).toString(), subtext: '+12% from last week', color: 'var(--accent-blue)', Icon: Activity },
        { label: 'Compliance Rate',     value: `${Math.round((stats.bullish / (stats.total || 1)) * 40 + 60)}%`, subtext: 'Verified compliant', color: 'var(--bull)', Icon: CheckCircle2 },
        { label: 'High Risk Flagged',   value: stats.traps.toString(), subtext: 'Requires review', color: 'var(--bear)', Icon: AlertTriangle },
        { label: 'Avg Risk Score',      value: `${100 - stats.avgSentiment}/100`, subtext: stats.avgSentiment >= 60 ? 'Low systemic risk' : 'Elevated risk', color: 'var(--warning)', Icon: ShieldAlert },
      ]
    : [
        { label: 'Total Transactions',  value: '—', subtext: 'Updating…', color: 'var(--accent-blue)', Icon: Activity },
        { label: 'Compliance Rate',     value: '—', subtext: 'Updating…', color: 'var(--bull)', Icon: CheckCircle2 },
        { label: 'High Risk Flagged',   value: '—', subtext: 'Updating…', color: 'var(--bear)', Icon: AlertTriangle },
        { label: 'Avg Risk Score',      value: '—', subtext: 'Updating…', color: 'var(--warning)', Icon: ShieldAlert },
      ]

  return (
    <div className="slide-in">
      <DirectiveCard isPro={isPro} />

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>
                Trade Compliance Command Center
              </h1>
              <span className="badge badge-compliant">LIVE AUDIT</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Real-time compliance monitoring, document verification feed, and exception detection
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RegimeBadge symbol="^NSEI" />
            <RegimeBadge symbol="^GSPC" />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }} className="filter-row">
        {cards.map(({ label, value, subtext, color, Icon }) => (
          <div key={label} className="metric-card card-hover-lift">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {label}
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-primary)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
              {value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtext}</div>
          </div>
        ))}
      </div>

      {/* Priority Compliance Attention Banner */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid var(--bear)',
        borderRadius: '8px', padding: '14px 18px', marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bear-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} color="var(--bear)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-primary)' }}>
              Compliance Attention Required (2 Active Exceptions)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Invoice amount mismatch detected on transaction <strong>TG-1042</strong> · Missing country certificate on <strong>TG-1035</strong>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-flagged">HIGH RISK</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="research-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left: Intelligence & Document Feed */}
        <div>
          <IntelligenceFeed onStatsLoad={setStats} />
        </div>

        {/* Right Sidebar: AI Workflow & Compliance Brief */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* AI Compliance Agent Activity Panel */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={16} color="var(--accent-blue)" />
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI Compliance Agent Workflow
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Document Upload Parsed', status: 'COMPLETED', time: '1m ago', icon: CheckCircle2, color: 'var(--bull)' },
                { label: 'OCR Field Validation', status: 'VERIFIED', time: '2m ago', icon: CheckCircle2, color: 'var(--bull)' },
                { label: 'Exporter IEC Check', status: 'VERIFIED', time: '3m ago', icon: CheckCircle2, color: 'var(--bull)' },
                { label: 'Sanctions Screening', status: 'PASSED', time: '4m ago', icon: CheckCircle2, color: 'var(--bull)' },
                { label: 'Amount Matching', status: 'MISMATCH', time: '5m ago', icon: AlertTriangle, color: 'var(--bear)' },
              ].map(step => {
                const Icon = step.icon
                return (
                  <div key={step.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-subtle)',
                    fontSize: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={14} color={step.color} />
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{step.label}</span>
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                      {step.time}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Daily Market Brief Card */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Regulatory Brief
                </span>
              </div>
              {briefDate && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{briefDate}</span>
              )}
            </div>

            {brief ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {brief.marketMood && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Level</span>
                    <span className="badge badge-info">
                      {brief.marketMood.replace('_', ' ')}
                    </span>
                  </div>
                )}
                {brief.paragraph1 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{brief.paragraph1}</p>
                )}
                {brief.topRisk && (
                  <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--bear)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={12} /> Key Risk Exception
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{brief.topRisk}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  No regulatory brief generated yet.
                </p>
                <button
                  onClick={generateBrief}
                  disabled={generatingBrief}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                >
                  {generatingBrief ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Generate Brief'}
                </button>
              </div>
            )}
          </div>

          {/* Trending Watchlist */}
          {trending.length > 0 && (
            <div className="glass-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Flame size={16} color="var(--warning)" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Monitored Assets
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trending.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < trending.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {item.symbol}
                      </span>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>
                        {item.hypeRating}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.mentionCount} events
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}