"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, AlertTriangle, Filter, RefreshCw, Layers, ShieldCheck, FileText } from 'lucide-react'

interface FeedEvent {
  id:             string
  symbol?:        string | null
  eventType:      string
  impactLevel:    string
  headline:       string
  publishedAt:    string
  sentimentScore: number
  sentimentLabel: string
  retailTrap:     boolean
  retailTrapText?: string | null
  aiAnalysis:     Record<string, any>
}

function getRelativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)   return 'just now'
  if (diff < 60)  return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

function SentimentIndicator({ score }: { score: number }) {
  if (score >= 65) return (
    <span className="badge badge-compliant">
      <TrendingUp size={12} /> {score}/100 LOW RISK
    </span>
  )
  if (score <= 40) return (
    <span className="badge badge-flagged">
      <TrendingDown size={12} /> {score}/100 HIGH RISK
    </span>
  )
  return (
    <span className="badge badge-review">
      <Minus size={12} /> {score}/100 MEDIUM RISK
    </span>
  )
}

function FeedCard({ event }: { event: FeedEvent }) {
  const [expanded, setExpanded] = useState(false)
  const ai = event.aiAnalysis || {}

  return (
    <div
      className="card-enterprise card-hover-lift slide-in"
      style={{ padding: '18px 20px', marginBottom: '12px', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {event.symbol && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: '800', fontSize: '12px',
              padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)', color: 'var(--navy-primary)',
            }}>
              {event.symbol}
            </span>
          )}
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
            background: 'var(--bg-subtle)', color: 'var(--text-secondary)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {event.eventType}
          </span>
          {(event.impactLevel === 'HIGH' || event.impactLevel === 'CRITICAL') && (
            <span className="badge badge-flagged">
              <AlertTriangle size={10} /> {event.impactLevel} EXCEPTION
            </span>
          )}
          {event.retailTrap && (
            <span className="badge badge-review">
              <AlertTriangle size={10} /> DISCREPANCY DETECTED
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {getRelativeTime(event.publishedAt)}
          </span>
          <SentimentIndicator score={event.sentimentScore} />
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Headline */}
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-primary)', lineHeight: '1.5', marginBottom: expanded ? '14px' : '0' }}>
        {event.headline}
      </h3>

      {/* Expanded Details */}
      {expanded && (
        <div className="slide-down" style={{ borderTop: '1px solid var(--border-default)', paddingTop: '14px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={e => e.stopPropagation()}>
          {(ai.whatHappened) && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>Transaction Context</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ai.whatHappened}</p>
            </div>
          )}
          {(ai.whatItMeans || ai.newsImpact) && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>Compliance Impact Assessment</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ai.whatItMeans || ai.newsImpact}</p>
            </div>
          )}
          {(ai.retailMistake || event.retailTrapText) && (
            <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--bear)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={12} /> Compliance Risk Advisory
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ai.retailMistake || event.retailTrapText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  onStatsLoad?: (stats: { total: number; bullish: number; traps: number; avgSentiment: number }) => void
}

export default function IntelligenceFeed({ onStatsLoad }: Props) {
  const [events,   setEvents]   = useState<FeedEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('ALL')
  const [refreshing, setRefreshing] = useState(false)

  const loadEvents = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res  = await fetch('/api/feed')
      const data = await res.json()
      if (data.success) {
        const items: FeedEvent[] = data.data ?? data.events ?? []
        setEvents(items)
        if (onStatsLoad) {
          onStatsLoad({
            total:        items.length,
            bullish:      items.filter(e => e.sentimentScore >= 65).length,
            traps:        items.filter(e => e.retailTrap).length,
            avgSentiment: items.length
              ? Math.round(items.reduce((s, e) => s + e.sentimentScore, 0) / items.length)
              : 50,
          })
        }
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [onStatsLoad])

  useEffect(() => { loadEvents() }, [loadEvents])

  const FEED_TABS = [
    { key: 'ALL',         label: 'All Activity' },
    { key: 'HIGH_IMPACT', label: 'High Priority' },
    { key: 'RETAIL_TRAP', label: 'Exceptions' },
    { key: 'BULLISH',     label: 'Verified Compliant' },
    { key: 'BEARISH',     label: 'High Risk' },
  ] as const

  const filtered = useMemo(() => {
    switch (filter) {
      case 'HIGH_IMPACT': return events.filter(e => e.impactLevel === 'HIGH' || e.impactLevel === 'CRITICAL')
      case 'RETAIL_TRAP': return events.filter(e => e.retailTrap)
      case 'BULLISH':     return events.filter(e => e.sentimentScore >= 65)
      case 'BEARISH':     return events.filter(e => e.sentimentScore <= 40)
      default:            return events
    }
  }, [events, filter])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '10px' }} />)}
      </div>
    )
  }

  return (
    <div>
      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px', color: 'var(--text-muted)' }}>
          <Filter size={14} />
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filter:</span>
        </div>
        {FEED_TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
            border: `1px solid ${filter === key ? 'var(--accent-blue)' : 'var(--border-default)'}`,
            background: filter === key ? 'var(--accent-blue-dim)' : 'var(--bg-surface)',
            color: filter === key ? 'var(--accent-blue)' : 'var(--text-secondary)',
            fontSize: '12px', fontWeight: '600', transition: 'all 0.15s ease',
          }}>
            {label}
          </button>
        ))}
        <button
          onClick={() => loadEvents(true)}
          disabled={refreshing}
          className="btn-ghost"
          style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '12px' }}
        >
          <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Updating…' : 'Refresh'}
        </button>
      </div>

      {/* Events List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', borderRadius: '10px' }}>
          <ShieldCheck size={28} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy-primary)', marginBottom: '4px' }}>No compliance activity matches filter</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Adjust filter selection or refresh the audit log.</p>
        </div>
      ) : (
        filtered.map(event => <FeedCard key={event.id} event={event} />)
      )}
    </div>
  )
}