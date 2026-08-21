"use client"

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface Step {
  label: string
  agent?: string
}

const STEPS: Step[] = [
  { label: 'Fetching documents from S3...' },
  { label: 'ResearchAgent analyzing documents...', agent: 'ResearchAgent' },
  { label: 'VerificationAgent cross-checking data...', agent: 'VerificationAgent' },
  { label: 'ComplianceAgent checking IFSCA rules...', agent: 'ComplianceAgent' },
  { label: 'RiskEngine computing risk score...', agent: 'RiskEngine' },
]

const STEP_DELAY_MS = 500

interface Props {
  onComplete?: () => void
}

export default function AnalysisLoader({ onComplete }: Props) {
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setCompletedCount(i + 1), STEP_DELAY_MS * (i + 1))
    )
    const finalTimer = setTimeout(() => onComplete?.(), STEP_DELAY_MS * (STEPS.length + 1))
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(finalTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allDone = completedCount >= STEPS.length

  return (
    <div className="card-enterprise fade-in-up" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {STEPS.map((step, i) => {
          const done = i < completedCount
          const active = i === completedCount
          return (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: done || active ? 1 : 0.35, transition: 'opacity 0.2s ease' }}>
              <div style={{ width: '18px', height: '18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                  <CheckCircle2 size={16} color="var(--bull)" />
                ) : active ? (
                  <Loader2 size={16} color="var(--accent-blue)" className="spin" style={{ animation: 'spin 0.9s linear infinite' }} />
                ) : (
                  <Circle size={14} color="var(--border-muted)" />
                )}
              </div>
              <span style={{
                fontSize: '13px',
                fontFamily: 'JetBrains Mono, monospace',
                color: done ? 'var(--text-primary)' : active ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontWeight: done || active ? 600 : 400,
              }}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {allDone && (
        <div className="fade-in-up" style={{
          marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <CheckCircle2 size={16} color="var(--bull)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bull)' }}>Analysis Complete</span>
        </div>
      )}
    </div>
  )
}