"use client"

import { Gauge, AlertOctagon } from 'lucide-react'
import type { RiskAssessment } from '@/lib/ai/riskEngine'

const RISK_COLOR: Record<string, string> = {
  LOW: 'var(--bull)',
  MEDIUM: 'var(--warning)',
  HIGH: 'var(--bear)',
  CRITICAL: 'var(--bear)',
}

const RISK_BADGE: Record<string, string> = {
  LOW: 'badge-compliant',
  MEDIUM: 'badge-review',
  HIGH: 'badge-flagged',
  CRITICAL: 'badge-flagged',
}

interface Props {
  assessment: RiskAssessment
}

export default function RiskEngine({ assessment }: Props) {
  const color = RISK_COLOR[assessment.overall_risk] ?? 'var(--text-muted)'
  // Gauge arc: 0-100 score mapped to a semicircle via stroke-dasharray
  const circumference = Math.PI * 80 // radius 80
  const dash = (assessment.score / 100) * circumference

  return (
    <div className="card-enterprise" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Gauge size={15} color="var(--accent-blue)" />
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Risk Engine
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {/* Visual gauge 0-100 */}
        <svg width="180" height="100" viewBox="0 0 180 100">
          <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="var(--bg-subtle)" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          <text x="90" y="80" textAnchor="middle" fontSize="28" fontWeight="800" fill="var(--text-primary)" fontFamily="JetBrains Mono, monospace">
            {assessment.score}
          </text>
        </svg>

        <div>
          <span className={`badge ${RISK_BADGE[assessment.overall_risk]}`} style={{ fontSize: '13px', padding: '5px 12px' }}>
            {assessment.overall_risk}
          </span>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.6, maxWidth: '360px' }}>
            {assessment.recommendation}
          </p>
          {assessment.requires_hitl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--bear)', fontSize: '12px', fontWeight: 700 }}>
              <AlertOctagon size={13} /> Human review required
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {assessment.factors.map((f) => (
          <div key={f.category} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 60px', gap: '12px', padding: '9px 0', borderTop: '1px solid var(--border-default)', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {f.category} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({Math.round(f.weight * 100)}%)</span>
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{f.description}</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: RISK_COLOR[f.severity], fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>
              {f.severity}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-default)', fontSize: '11px', color: 'var(--text-muted)' }}>
        {assessment.reasoning}
      </div>
    </div>
  )
}
