"use client"

import { useState } from 'react'
import {
  CheckCircle2, XCircle, ShieldAlert, Bot, ArrowRight,
  FileSearch, ListChecks, Gauge, AlertTriangle,
} from 'lucide-react'
import { assessRisk } from '@/lib/ai/riskEngine'
import RiskEngine from '@/components/RiskEngine'

export interface ComplianceCheck {
  name: string
  passed: boolean
  reason: string
}

export interface ComplianceVerdict {
  caseId: string
  symbol: string
  verdict: 'PASS' | 'FAIL' | 'REVIEW'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  checks: ComplianceCheck[]
  aiAnalysis: string
  model: string
  timestamp: string
  requiresHumanReview: boolean
}

interface Props {
  verdict: ComplianceVerdict
  onDecisionLogged?: () => void
}

const RISK_STYLE: Record<string, { color: string; dim: string; badgeClass: string }> = {
  LOW:    { color: 'var(--bull)',    dim: 'var(--bull-dim)',    badgeClass: 'badge-compliant' },
  MEDIUM: { color: 'var(--warning)', dim: 'var(--warning-dim)', badgeClass: 'badge-review' },
  HIGH:   { color: 'var(--bear)',    dim: 'var(--bear-dim)',    badgeClass: 'badge-flagged' },
}

const VERDICT_STYLE: Record<string, { color: string; badgeClass: string }> = {
  PASS:   { color: 'var(--bull)',    badgeClass: 'badge-compliant' },
  REVIEW: { color: 'var(--warning)', badgeClass: 'badge-review' },
  FAIL:   { color: 'var(--bear)',    badgeClass: 'badge-flagged' },
}

const CHECK_LABELS: Record<string, string> = {
  document_completeness: 'Document Completeness',
  amount_consistency:    'Amount Consistency',
  party_verification:    'Party Verification',
  regulatory_compliance: 'Regulatory Compliance',
}

// These four stages reflect the four checks actually computed server-side
// (document_completeness / amount_consistency / party_verification feed
// ResearchAgent+VerificationAgent, regulatory_compliance is ComplianceAgent's
// deterministic rule check, and Bedrock only generates the narrative below).
// RiskEngine is the LOW/MEDIUM/HIGH threshold math applied to the 4 checks.
const AGENT_CHAIN = [
  { name: 'ResearchAgent',      icon: FileSearch,   model: 'Document Parser (rule-based)' },
  { name: 'VerificationAgent',  icon: ListChecks,   model: 'Cross-Check Engine (rule-based)' },
  { name: 'ComplianceAgent',    icon: ShieldAlert,   modelFromVerdict: true },
  { name: 'RiskEngine',         icon: Gauge,         model: 'Deterministic Risk Scorer' },
]

function MetricLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
      {children}
    </div>
  )
}

export default function VerdictPanel({ verdict, onDecisionLogged }: Props) {
  const [decision, setDecision] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const risk = RISK_STYLE[verdict.riskLevel] ?? RISK_STYLE.MEDIUM
  const vStyle = VERDICT_STYLE[verdict.verdict] ?? VERDICT_STYLE.REVIEW

  async function submitDecision(finalDecision: string) {
    setDecision(finalDecision)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/compliance/${verdict.caseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: finalDecision, notes, userId: 'demo_officer' }),
      })
      if (res.ok) {
        setSubmitted(true)
        onDecisionLogged?.()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Top metrics row ── */}
      <div className="card-enterprise" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '18px' }}>
        <div>
          <MetricLabel>Case ID</MetricLabel>
          <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{verdict.caseId}</div>
        </div>
        <div>
          <MetricLabel>Symbol</MetricLabel>
          <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{verdict.symbol}</div>
        </div>
        <div>
          <MetricLabel>Risk Level</MetricLabel>
          <span className={`badge ${risk.badgeClass}`}>{verdict.riskLevel}</span>
        </div>
        <div>
          <MetricLabel>Confidence</MetricLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', borderRadius: '4px', background: 'var(--bg-subtle)', overflow: 'hidden', minWidth: '48px' }}>
              <div style={{ width: `${verdict.confidence}%`, height: '100%', background: risk.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{verdict.confidence}%</span>
          </div>
        </div>
        <div>
          <MetricLabel>Verdict</MetricLabel>
          <span className={`badge ${vStyle.badgeClass}`}>{verdict.verdict}</span>
        </div>
      </div>

      {/* ── Checks table ── */}
      <div className="card-enterprise" style={{ padding: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
          Compliance Checks
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 70px 1fr', gap: '12px', padding: '6px 0', borderBottom: '1px solid var(--border-default)', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Check Name</span>
            <span>Status</span>
            <span>Reason</span>
          </div>
          {verdict.checks.map((check) => (
            <div key={check.name} style={{ display: 'grid', gridTemplateColumns: '220px 70px 1fr', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-default)', alignItems: 'start' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {CHECK_LABELS[check.name] ?? check.name}
              </span>
              <span>
                {check.passed ? <CheckCircle2 size={16} color="var(--bull)" /> : <XCircle size={16} color="var(--bear)" />}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{check.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Analysis box ── */}
      <div className="card-enterprise" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Bot size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Claude Analysis via Amazon Bedrock
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '10px' }}>{verdict.aiAnalysis}</p>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          model: {verdict.model}
        </div>
      </div>

      {/* ── Risk Engine (weighted score over the same 4 checks above) ── */}
      <RiskEngine assessment={assessRisk(verdict.checks)} />

      {/* ── Agent chain visualization ── */}
      <div className="card-enterprise" style={{ padding: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
          Agent Chain
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {AGENT_CHAIN.map((agent, i) => {
            const Icon = agent.icon
            const modelLabel = agent.modelFromVerdict ? verdict.model : agent.model
            return (
              <div key={agent.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  border: '1px solid var(--border-default)', borderRadius: '10px', padding: '10px 14px',
                  background: 'var(--bg-subtle)', minWidth: '150px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Icon size={13} color="var(--accent-blue)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <CheckCircle2 size={11} color="var(--bull)" />
                    <span style={{ fontSize: '10px', color: 'var(--bull)', fontWeight: 600 }}>Complete</span>
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{modelLabel}</div>
                </div>
                {i < AGENT_CHAIN.length - 1 && <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── HITL Approval ── */}
      {verdict.requiresHumanReview && (
        <div className="card-enterprise" style={{ padding: '20px', border: '1px solid rgba(220,38,38,0.3)', background: 'var(--bear-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={15} color="var(--bear)" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--bear)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Human Review Required
            </span>
          </div>

          {submitted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--bull)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bull)' }}>
                Decision logged: {decision}
              </span>
            </div>
          ) : (
            <>
              <textarea
                className="input-field"
                placeholder="Officer notes (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ marginBottom: '12px', minHeight: '60px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn-primary" disabled={submitting} onClick={() => submitDecision('APPROVED')}>
                  Approve
                </button>
                <button
                  className="btn-primary"
                  disabled={submitting}
                  style={{ background: 'var(--warning)' }}
                  onClick={() => submitDecision('ESCALATED')}
                >
                  Escalate
                </button>
                <button
                  className="btn-ghost"
                  disabled={submitting}
                  style={{ color: 'var(--bear)', borderColor: 'rgba(220,38,38,0.3)' }}
                  onClick={() => submitDecision('REJECTED')}
                >
                  Reject
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
