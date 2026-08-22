"use client"

import { useState, useEffect } from 'react'
import { BookOpen, Brain, Calendar, Tag, AlertTriangle, RefreshCw, Flame, PenLine, Shield, CheckCircle2, FileText } from 'lucide-react'
import AITransparencyBadge from '@/components/ui/AITransparencyBadge'
import BehavioralPanel from '@/components/journal/BehavioralPanel'

interface AIResponse {
  whatYourThinkingShows?: string
  patternMatch?:          string
  oneThing?:              string
  encouragement?:         string
  emotionTag?:            string
  riskLevel?:             string
  riskNote?:              string | null
}

interface JournalEntry {
  id:               string
  createdAt:        string
  symbol?:          string | null
  rawText:          string
  aiResponse?:      AIResponse | null
  emotionTag:       string
  riskFlag:         boolean
  processingStatus: string
}

const TAG_BADGES: Record<string, { label: string; badgeClass: string }> = {
  DISCIPLINED:   { label: 'VERIFIED DISCIPLINED', badgeClass: 'badge-compliant' },
  FOMO:          { label: 'FOMO ALERT',           badgeClass: 'badge-review'    },
  REVENGE:       { label: 'REVENGE TRADE RISK',   badgeClass: 'badge-flagged'   },
  PANIC:         { label: 'PANIC EXCEPTION',      badgeClass: 'badge-flagged'   },
  GREED:         { label: 'OVERLEVERAGE RISK',    badgeClass: 'badge-review'    },
  FEARFUL:       { label: 'HESITATION ALERT',     badgeClass: 'badge-review'    },
  OVERCONFIDENT: { label: 'RULE VIOLATION',       badgeClass: 'badge-review'    },
  NEUTRAL:       { label: 'STANDARD AUDIT',       badgeClass: 'badge-info'      },
  UNCLEAR:       { label: 'UNSTRUCTURED ENTRY',   badgeClass: 'badge-info'      },
}

function tagBadge(tag: string) {
  return TAG_BADGES[tag] ?? TAG_BADGES['NEUTRAL']
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function computeProfile(entries: JournalEntry[]) {
  const tagCount: Record<string, number> = {}
  let riskEntries = 0
  entries.forEach(e => {
    const t = e.emotionTag || 'NEUTRAL'
    tagCount[t] = (tagCount[t] || 0) + 1
    if (e.riskFlag) riskEntries++
  })
  const dominant = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'NEUTRAL'

  const days = new Set(entries.map(e => new Date(e.createdAt).toDateString()))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (days.has(d.toDateString())) streak++
    else if (i > 0) break
  }

  return { tagCount, dominant, riskEntries, total: entries.length, streak }
}

function EntryCard({ entry }: { entry: JournalEntry }) {
  const [showAI, setShowAI] = useState(false)
  const ai = entry.aiResponse as AIResponse | null
  const tb = tagBadge(entry.emotionTag)

  return (
    <div className="card-enterprise card-hover-lift slide-in" style={{ padding: '18px 20px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} /> {formatDate(entry.createdAt)} {formatTime(entry.createdAt)} UTC
          </span>
          {entry.symbol && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: '800', fontSize: '11px',
              padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)', color: 'var(--navy-primary)',
            }}>
              {entry.symbol}
            </span>
          )}
          {entry.riskFlag && (
            <span className="badge badge-flagged" style={{ fontSize: '10px' }}>
              <AlertTriangle size={10} /> RISK EXCEPTION
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${tb.badgeClass}`} style={{ fontSize: '10px' }}>
            {tb.label}
          </span>
          {ai && (
            <button onClick={() => setShowAI(!showAI)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }}>
              <Brain size={12} /> {showAI ? 'Hide AI Audit' : 'AI Audit'}
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: showAI ? '12px' : 0 }}>
        {entry.rawText}
      </p>

      {showAI && ai && (
        <div className="slide-down" style={{
          background: 'var(--bg-subtle)', border: '1px solid var(--border-default)',
          borderRadius: '8px', padding: '14px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase' }}>
              AI Compliance Review Analysis
            </span>
            <AITransparencyBadge
              model="Azure OpenAI GPT-4o"
              task="Behavioral journal reflection — emotion tagging and pattern detection"
              inputSummary={`Journal text (${entry.rawText.length} chars)`}
              safetyPassed={!entry.riskFlag}
              generatedAt={entry.createdAt}
            />
          </div>
          {ai.whatYourThinkingShows && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ai.whatYourThinkingShows}</p>
          )}
          {ai.oneThing && (
            <div style={{ background: 'var(--bull-dim)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(22,163,74,0.2)', fontSize: '12px', color: 'var(--bull)' }}>
              <strong>Recommended Action:</strong> {ai.oneThing}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function JournalPage() {
  const [entries,    setEntries]    = useState<JournalEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [text,       setText]       = useState('')
  const [symbol,     setSymbol]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [degradedNotice, setDegradedNotice] = useState('')

  useEffect(() => {
    fetch('/api/journal')
      .then(r => r.json())
      .then(d => { if (d.success) setEntries(d.data) })
      .finally(() => setLoadingHistory(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setSubmitError('')
    setDegradedNotice('')
    try {
      const res  = await fetch('/api/journal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawText: text.trim(), symbol: symbol.trim() || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setEntries(prev => [data.data, ...prev])
        setText('')
        setSymbol('')
        if (data.degraded) setDegradedNotice(data.degradedReason || 'Reflection unavailable — entry saved successfully.')
      } else {
        setSubmitError(data.error || 'Failed to save entry.')
      }
    } catch {
      setSubmitError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const profile = computeProfile(entries)

  return (
    <div className="slide-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>
              Compliance Review & Activity Journal
            </h1>
            <span className="badge badge-compliant">IMMUTABLE LOG</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Log trade rationale, review risk factors, and build structured compliance documentation
          </p>
        </div>
        {profile.streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <Flame size={18} color="var(--warning)" />
            <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--navy-primary)' }}>
              {profile.streak} Day Audit Streak
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Form */}
        <div>
          <BehavioralPanel />
          <div className="card-enterprise" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
              New Activity Log Entry
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Transaction Ticker Ref
                </label>
                <input
                  className="input-field"
                  style={{ fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
                  placeholder="e.g. TSLA, RELIANCE"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Trade Rationale & Compliance Notes
                </label>
                <textarea
                  className="input-field"
                  style={{ resize: 'vertical', minHeight: '130px', lineHeight: '1.6' }}
                  placeholder="Describe entry conditions, risk factors, or compliance observations…"
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
              </div>
              {submitError && <div style={{ color: 'var(--bear)', fontSize: '12px' }}>{submitError}</div>}
              {degradedNotice && <div style={{ color: 'var(--warning)', fontSize: '12px' }}>{degradedNotice}</div>}
              <button type="submit" className="btn-primary" disabled={submitting || !text.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                {submitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Log Entry & Audit'}
              </button>
            </form>
          </div>
        </div>

        {/* Right History */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
            Audit Log History ({entries.length})
          </div>
          {loadingHistory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />)}
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', borderRadius: '10px' }}>
              <FileText size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No audit entries logged yet.</p>
            </div>
          ) : (
            entries.map(e => <EntryCard key={e.id} entry={e} />)
          )}
        </div>
      </div>
    </div>
  )
}