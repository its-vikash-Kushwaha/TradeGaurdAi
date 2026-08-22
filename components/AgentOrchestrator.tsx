"use client"

import { useState } from 'react'
import { CheckCircle2, Loader2, Circle, AlertOctagon, Play } from 'lucide-react'
import RiskEngine from '@/components/RiskEngine'
import type { RiskAssessment } from '@/lib/ai/riskEngine'

interface SyntheticCase {
  caseId: string
  symbol: string
  documents: Record<string, any>
  description: string
}

const AGENT_STEPS = [
  { key: 'research', label: 'Research Agent', desc: 'Gathering case intelligence' },
  { key: 'compliance', label: 'Compliance Agent', desc: 'Checking rules' },
  { key: 'risk', label: 'Risk Engine', desc: 'Calculating weighted risk' },
  { key: 'behavioral', label: 'Behavioral Agent', desc: 'Reading trader context' },
  { key: 'synthesis', label: 'Synthesis', desc: 'Combining all agent outputs' },
]

const STEP_DELAY_MS = 500

interface OrchestratorResult {
  case_id: string
  agents_invoked: string[]
  total_processing_time: number
  overall_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  compliance_status: string
  key_findings: string[]
  recommendation: string
  requires_human_review: boolean
  confidence: number
  audit_entry_id: string
  research: any
  compliance: any
  risk: RiskAssessment
  behavioral: any
}

const RISK_BADGE: Record<string, string> = {
  LOW: 'badge-compliant', MEDIUM: 'badge-review', HIGH: 'badge-flagged', CRITICAL: 'badge-flagged',
}

export default function AgentOrchestrator({ demoCase }: { demoCase: SyntheticCase }) {
  const [running, setRunning] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [result, setResult] = useState<OrchestratorResult | null>(null)

  async function run() {
    setRunning(true)
    setResult(null)
    setVisibleSteps(0)

    const fetchPromise = fetch('/api/orchestrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: demoCase.caseId, symbol: demoCase.symbol, documents: demoCase.documents }),
    }).then((r) => r.json())

    // Stage the 5 steps visually — cosmetic pacing so the orchestration is
    // visible, same pattern as the compliance page's AnalysisLoader. The
    // real work happens in the single fetch above.
    for (let i = 1; i <= AGENT_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, STEP_DELAY_MS))
      setVisibleSteps(i)
    }

    const data = await fetchPromise
    setResult(data)
    setRunning(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card-enterprise" style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{demoCase.caseId} — {demoCase.symbol}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{demoCase.description}</div>
        </div>
        <button className="btn-primary" onClick={run} disabled={running}>
          <Play size={13} /> {running ? 'Running…' : 'Run Orchestrator'}
        </button>
      </div>

      {running && (
        <div className="card-enterprise fade-in-up" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {AGENT_STEPS.map((s, i) => {
              const done = i < visibleSteps
              const active = i === visibleSteps
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: done || active ? 1 : 0.35 }}>
                  {done ? <CheckCircle2 size={15} color="var(--bull)" /> : active ? <Loader2 size={15} color="var(--accent-blue)" style={{ animation: 'spin 0.9s linear infinite' }} /> : <Circle size={13} color="var(--border-muted)" />}
                  <span style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', fontWeight: done || active ? 600 : 400, color: done ? 'var(--text-primary)' : active ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                    [{s.label}] {done ? 'Complete' : active ? 'Running…' : 'Pending'} — {s.desc}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {result && (
        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-enterprise" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Synthesis</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className={`badge ${RISK_BADGE[result.overall_risk]}`}>{result.overall_risk}</span>
                <span className="badge badge-info">{result.compliance_status}</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '10px' }}>{result.recommendation}</p>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '18px', marginBottom: '10px' }}>
              {result.key_findings.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            {result.requires_human_review && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--bear)', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                <AlertOctagon size={13} /> HITL auto-triggered — routed for human review
              </div>
            )}
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              agents: {result.agents_invoked.join(', ')} · {result.total_processing_time}ms · audit: {result.audit_entry_id}
            </div>
            {result.risk.overall_risk !== result.compliance_status.replace('FAIL', 'HIGH').replace('PASS', 'LOW').replace('REVIEW', 'MEDIUM') && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--warning)', background: 'var(--warning-dim)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '6px', padding: '8px 10px' }}>
                Note: RiskEngine&apos;s weighted score and ComplianceAgent&apos;s check-count verdict used different methodologies here and landed on different risk tiers over the same evidence — both are shown below rather than silently reconciled.
              </div>
            )}
          </div>

          <RiskEngine assessment={result.risk} />
        </div>
      )}
    </div>
  )
}
