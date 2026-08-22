"use client"

import { useEffect, useState } from 'react'
import { Workflow, Cloud } from 'lucide-react'
import AgentOrchestrator from '@/components/AgentOrchestrator'

interface SyntheticCase {
  caseId: string
  symbol: string
  documents: Record<string, any>
  description: string
}

export default function OrchestratorPage() {
  const [cases, setCases] = useState<SyntheticCase[]>([])
  const [selected, setSelected] = useState<SyntheticCase | null>(null)

  useEffect(() => {
    fetch('/api/compliance/demo')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setCases(list)
        if (list.length > 0) setSelected(list[0])
      })
      .catch(() => setCases([]))
  }, [])

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Workflow size={22} color="var(--accent-blue)" />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Multi-Agent Orchestrator
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Research → Compliance → Risk → Behavioral → Synthesis</span>
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Cloud size={11} /> Powered by Amazon Bedrock
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {cases.map((c) => (
          <button
            key={c.caseId}
            className={selected?.caseId === c.caseId ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setSelected(c)}
            style={{ fontSize: '12px' }}
          >
            {c.symbol}
          </button>
        ))}
      </div>

      {selected && <AgentOrchestrator key={selected.caseId} demoCase={selected} />}
    </div>
  )
}
