"use client"

import { useEffect, useState, useCallback } from 'react'
import { Database, RefreshCw, AlertTriangle } from 'lucide-react'

interface AuditEvent {
  eventId: string
  caseId: string
  agent: string
  action: string
  riskLevel?: string
  model: string
  status: string
  timestamp: string
  humanDecision?: string
}

interface Props {
  caseId: string
  refreshSignal?: number
}

const RISK_COLOR: Record<string, string> = {
  LOW: 'var(--bull)',
  MEDIUM: 'var(--warning)',
  HIGH: 'var(--bear)',
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch {
    return iso
  }
}

export default function AuditTrail({ caseId, refreshSignal }: Props) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [auditMode, setAuditMode] = useState<'dynamodb' | 'memory' | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/compliance/${caseId}`)
      const data = await res.json()
      setEvents(data.events ?? [])
      setAuditMode(data.auditMode ?? null)
    } catch {
      // keep last known events on transient failure
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    setLoading(true)
    fetchEvents()
    const interval = setInterval(fetchEvents, 5000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  useEffect(() => {
    if (refreshSignal !== undefined) fetchEvents()
  }, [refreshSignal, fetchEvents])

  return (
    <div className="card-enterprise" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        {auditMode === 'memory' ? (
          <span className="badge badge-review" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} /> Using in-memory store — connect AWS for persistent audit trail
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={14} color="var(--accent-blue)" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Live DynamoDB Audit Trail
            </span>
          </div>
        )}
        {loading && <RefreshCw size={12} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />}
      </div>

      {loading && events.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading audit events...</div>
      ) : events.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>No audit events yet</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Time', 'Agent', 'Action', 'Risk', 'Model', 'Status'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px 6px 0', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.eventId} style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '8px 10px 8px 0', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>{formatTime(e.timestamp)}</td>
                  <td style={{ padding: '8px 10px 8px 0', fontWeight: 600, color: 'var(--text-primary)' }}>{e.agent}</td>
                  <td style={{ padding: '8px 10px 8px 0', color: 'var(--text-secondary)' }}>{e.action}{e.humanDecision && e.humanDecision !== 'PENDING' ? ` → ${e.humanDecision}` : ''}</td>
                  <td style={{ padding: '8px 10px 8px 0', color: e.riskLevel ? RISK_COLOR[e.riskLevel] ?? 'var(--text-muted)' : 'var(--text-muted)', fontWeight: 700 }}>{e.riskLevel || '—'}</td>
                  <td style={{ padding: '8px 10px 8px 0', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', fontSize: '11px' }}>{e.model}</td>
                  <td style={{ padding: '8px 10px 8px 0', color: 'var(--text-secondary)' }}>{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
