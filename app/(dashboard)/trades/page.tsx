"use client"

import { useState, useEffect, useCallback } from 'react'
import { Plus, TrendingUp, TrendingDown, X, Star, ChevronUp, ChevronDown, ShieldCheck, Filter, AlertTriangle, FileText } from 'lucide-react'
import CloseTradeModal from '@/components/trades/CloseTradeModal'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Trade {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  entryTime: string
  exitPrice: number | null
  exitTime: string | null
  quantity: number
  stopLoss: number | null
  takeProfit: number | null
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  pnl: number | null
  pnlPct: number | null
  rMultiple: number | null
  setupTag: string | null
  regimeAtEntry: string | null
  statedConviction: number | null
  assetClass: string
  notes: string | null
}

const SETUP_TAGS_KEY = 'tg_setup_tags'
const DEFAULT_SETUPS = ['Range Reversal', 'Breakout', 'Institutional Flow', 'Momentum', 'Mean Reversion']

const REGIME_COLORS: Record<string, string> = {
  BULL_TREND:  '#16A34A',
  BEAR_TREND:  '#DC2626',
  CHOP:        '#D97706',
  CRISIS:      '#DC2626',
}

function ConvictionStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display:'flex', gap:'2px' }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(value === n ? 0 : n)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:'1px', color: n <= (hovered || value) ? '#D97706' : 'var(--border-muted)' }}>
          <Star size={13} fill={n <= (hovered || value) ? '#D97706' : 'none'} />
        </button>
      ))}
    </div>
  )
}

function RegimeDot({ regime }: { regime: string | null }) {
  const color = regime ? (REGIME_COLORS[regime] ?? '#64748B') : '#64748B'
  return (
    <span title={regime ?? 'Unknown'} style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }} />
  )
}

function RCell({ r }: { r: number | null }) {
  if (r == null) return <span style={{ color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>—</span>
  const color = r >= 2 ? '#16A34A' : r > 0 ? '#16A34A' : r >= -1 ? '#D97706' : '#DC2626'
  const bg    = r >= 2 ? 'rgba(22,163,74,0.1)' : r > 0 ? 'rgba(22,163,74,0.05)' : r >= -1 ? 'rgba(217,119,6,0.05)' : 'rgba(220,38,38,0.1)'
  return (
    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'12px', fontWeight:'700', color, background:bg, padding:'2px 6px', borderRadius:'4px' }}>
      {r >= 0 ? '+' : ''}{r.toFixed(2)}R
    </span>
  )
}

// ─── New Trade Modal ─────────────────────────────────────────────────────────

function NewTradeModal({ onClose, onCreated, setupTags, onAddTag }: {
  onClose: () => void
  onCreated: () => void
  setupTags: string[]
  onAddTag: (tag: string) => void
}) {
  const [direction, setDirection]     = useState<'LONG' | 'SHORT'>('LONG')
  const [symbol, setSymbol]           = useState('')
  const [assetClass, setAssetClass]   = useState('STOCK')
  const [entryPrice, setEntryPrice]   = useState('')
  const [quantity, setQuantity]       = useState('')
  const [stopLoss, setStopLoss]       = useState('')
  const [takeProfit, setTakeProfit]   = useState('')
  const [setupTag, setSetupTag]       = useState('')
  const [newTag, setNewTag]           = useState('')
  const [showNewTag, setShowNewTag]   = useState(false)
  const [conviction, setConviction]   = useState(0)
  const [notes, setNotes]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const ep = parseFloat(entryPrice)
    const qty = parseFloat(quantity)

    if (!symbol.trim()) { setError('Ticker symbol is required'); return }
    if (isNaN(ep) || ep <= 0) { setError('Valid entry price required'); return }
    if (isNaN(qty) || qty <= 0) { setError('Valid quantity required'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase().trim(),
          side: direction,
          assetClass,
          entryPrice: ep,
          quantity: qty,
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          targetPrice: takeProfit ? parseFloat(takeProfit) : null,
          setupTag: setupTag || null,
          statedConviction: conviction || null,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onCreated()
        onClose()
      } else {
        setError(data.error || 'Failed to log position.')
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function addNewTag() {
    if (newTag.trim()) {
      onAddTag(newTag.trim())
      setSetupTag(newTag.trim())
      setNewTag('')
      setShowNewTag(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,18,32,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px' }}>
      <div className="card-enterprise slide-in" style={{ width:'100%', maxWidth:'520px', padding:'24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <ShieldCheck size={18} color="var(--accent-blue)" />
            <h2 style={{ fontSize:'16px', fontWeight:'800', color:'var(--navy-primary)' }}>Log Transaction / Position</h2>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Direction toggle */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
            <button type="button" onClick={() => setDirection('LONG')} style={{ flex:1, padding:'8px', borderRadius:'6px', fontWeight:'700', fontSize:'13px', border:'1px solid', borderColor: direction==='LONG' ? 'var(--bull)' : 'var(--border-default)', background: direction==='LONG' ? 'var(--bull-dim)' : 'var(--bg-surface)', color: direction==='LONG' ? 'var(--bull)' : 'var(--text-muted)' }}>
              ▲ LONG (Buy)
            </button>
            <button type="button" onClick={() => setDirection('SHORT')} style={{ flex:1, padding:'8px', borderRadius:'6px', fontWeight:'700', fontSize:'13px', border:'1px solid', borderColor: direction==='SHORT' ? 'var(--bear)' : 'var(--border-default)', background: direction==='SHORT' ? 'var(--bear-dim)' : 'var(--bg-surface)', color: direction==='SHORT' ? 'var(--bear)' : 'var(--text-muted)' }}>
              ▼ SHORT (Sell)
            </button>
          </div>

          {/* Symbol & Asset class */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px', marginBottom:'12px' }}>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Ticker Symbol *</label>
              <input className="input-field" placeholder="AAPL, RELIANCE, BTC" value={symbol} onChange={e => setSymbol(e.target.value)} style={{ fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase' }} autoFocus />
            </div>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Asset Class</label>
              <select className="input-field" value={assetClass} onChange={e => setAssetClass(e.target.value)}>
                <option value="STOCK">Stock</option>
                <option value="CRYPTO">Crypto</option>
                <option value="FOREX">Forex</option>
                <option value="COMMODITY">Commodity</option>
              </select>
            </div>
          </div>

          {/* Entry & Qty */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Entry Price *</label>
              <input type="number" step="any" className="input-field" placeholder="150.00" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} style={{ fontFamily:'JetBrains Mono,monospace' }} />
            </div>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Quantity *</label>
              <input type="number" step="any" className="input-field" placeholder="10" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ fontFamily:'JetBrains Mono,monospace' }} />
            </div>
          </div>

          {/* Stop & Target */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
            <div>
              <label style={{ fontSize:'11px', fontWeight: '700', color:'var(--bear)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Stop Loss</label>
              <input type="number" step="any" className="input-field" placeholder="145.00" value={stopLoss} onChange={e => setStopLoss(e.target.value)} style={{ fontFamily:'JetBrains Mono,monospace' }} />
            </div>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'700', color:'var(--bull)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Take Profit Target</label>
              <input type="number" step="any" className="input-field" placeholder="165.00" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} style={{ fontFamily:'JetBrains Mono,monospace' }} />
            </div>
          </div>

          {error && <div style={{ color:'var(--bear)', fontSize:'12px', marginBottom:'12px' }}>{error}</div>}

          <div style={{ display:'flex', gap:'8px' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={loading}>{loading ? 'Logging…' : 'Log Transaction'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type SortKey = 'entryTime' | 'symbol' | 'pnl' | 'rMultiple' | 'status'
type SortDir = 'asc' | 'desc'

export default function TradesPage() {
  const [trades, setTrades]       = useState<Trade[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [closeTarget, setClose]   = useState<Trade | null>(null)
  const [sortKey, setSortKey]     = useState<SortKey>('entryTime')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')
  const [setupTags, setSetupTags] = useState<string[]>(DEFAULT_SETUPS)

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/positions')
      const data = await res.json()
      if (data.success) setTrades(data.data ?? [])
    } catch { /* noop */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...trades].sort((a, b) => {
    let va: number | string | null = a[sortKey] as number | string | null
    let vb: number | string | null = b[sortKey] as number | string | null
    if (sortKey === 'status') { va = a.status; vb = b.status }
    if (va == null) return 1
    if (vb == null) return -1
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const open   = sorted.filter(t => t.status === 'OPEN')
  const closed = sorted.filter(t => t.status !== 'OPEN')

  const closedTrades  = trades.filter(t => t.status === 'CLOSED')
  const withR         = closedTrades.filter(t => t.rMultiple != null)
  const winRate       = withR.length > 0 ? withR.filter(t => (t.rMultiple ?? 0) > 0).length / withR.length : null
  const expectancyR   = withR.length > 0 ? withR.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / withR.length : null

  function SortBtn({ col }: { col: SortKey }) {
    const active = sortKey === col
    return (
      <button onClick={() => toggleSort(col)} style={{ background:'none', border:'none', cursor:'pointer', color: active ? 'var(--accent-blue)' : 'var(--text-muted)', display:'inline-flex', alignItems:'center', gap:'2px', padding:'0' }}>
        {active && sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
    )
  }

  const th: React.CSSProperties = { padding:'10px 14px', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid var(--border-default)', whiteSpace:'nowrap', background:'var(--bg-subtle)' }
  const td: React.CSSProperties = { padding:'12px 14px', fontSize:'13px', color:'var(--text-primary)', borderBottom:'1px solid var(--border-default)', whiteSpace:'nowrap' }

  return (
    <div className="slide-in" style={{ maxWidth:'1100px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', gap:'16px', flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <h1 style={{ fontSize:'22px', fontWeight:'800', color:'var(--navy-primary)', letterSpacing:'-0.01em' }}>
              Transactions & Audit Log
            </h1>
            <span className="badge badge-compliant">256-BIT AUDIT LOG</span>
          </div>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>
            Track open positions, review trade risk metrics, and execute compliance settlements
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={14} /> Log Transaction
        </button>
      </div>

      {/* Summary KPI Strip */}
      {closedTrades.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'14px', marginBottom:'24px' }}>
          {[
            { label:'Closed Transactions', value: String(closedTrades.length), color: 'var(--accent-blue)' },
            { label:'Win Rate', value: winRate != null ? `${(winRate*100).toFixed(0)}%` : '—', color: winRate != null && winRate >= 0.5 ? 'var(--bull)' : 'var(--bear)' },
            { label:'Expectancy', value: expectancyR != null ? `${expectancyR >= 0 ? '+' : ''}${expectancyR.toFixed(2)}R` : '—', color: expectancyR != null ? (expectancyR > 0 ? 'var(--bull)' : 'var(--bear)') : undefined },
            { label:'Open Positions', value: String(open.length), color: open.length > 0 ? 'var(--warning)' : 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} className="metric-card card-hover-lift">
              <div style={{ fontSize:'11px', color:'var(--text-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:'700' }}>{s.label}</div>
              <div style={{ fontSize:'24px', fontWeight:'800', fontFamily:'JetBrains Mono,monospace', color: s.color ?? 'var(--navy-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table Card */}
      <div className="card-enterprise" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'40px', display:'flex', flexDirection:'column', gap:'8px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height:'48px', borderRadius:'6px' }} />)}
          </div>
        ) : trades.length === 0 ? (
          <div style={{ padding:'64px 20px', textAlign:'center' }}>
            <FileText size={28} color="var(--text-muted)" style={{ margin:'0 auto 12px' }} />
            <div style={{ fontSize:'15px', fontWeight:'700', color:'var(--navy-primary)', marginBottom:'4px' }}>No transactions logged</div>
            <div style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'20px' }}>Click &ldquo;Log Transaction&rdquo; to begin audit tracking.</div>
            <button onClick={() => setShowNew(true)} className="btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:'6px' }}><Plus size={14} /> Log Transaction</button>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Symbol <SortBtn col="symbol" /></th>
                  <th style={th}>Dir</th>
                  <th style={th}>Asset</th>
                  <th style={th}>Entry Price</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Status <SortBtn col="status" /></th>
                  <th style={th}>R-Multiple <SortBtn col="rMultiple" /></th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} style={{ transition:'background 0.15s' }}>
                    <td style={td}>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:'800', color:'var(--navy-primary)' }}>{t.symbol}</span>
                    </td>
                    <td style={td}>
                      <span className={t.direction === 'LONG' ? 'badge badge-compliant' : 'badge badge-flagged'}>
                        {t.direction}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize:'11px', color:'var(--text-secondary)', fontFamily:'JetBrains Mono,monospace' }}>{t.assetClass}</span>
                    </td>
                    <td style={td}>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:'600' }}>${t.entryPrice.toFixed(2)}</span>
                    </td>
                    <td style={td}>
                      <span style={{ fontFamily:'JetBrains Mono,monospace' }}>{t.quantity}</span>
                    </td>
                    <td style={td}>
                      <span className={t.status === 'OPEN' ? 'badge badge-info' : 'badge badge-compliant'}>
                        {t.status}
                      </span>
                    </td>
                    <td style={td}>
                      <RCell r={t.rMultiple} />
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {t.status === 'OPEN' ? (
                        <button
                          onClick={() => setClose(t)}
                          className="btn-ghost"
                          style={{ padding:'4px 8px', fontSize:'11px', color:'var(--bear)', borderColor:'rgba(220,38,38,0.2)' }}
                        >
                          Settle
                        </button>
                      ) : (
                        <span style={{ fontSize:'11px', color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>Audited</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNew && (
        <NewTradeModal
          onClose={() => setShowNew(false)}
          onCreated={fetchTrades}
          setupTags={setupTags}
          onAddTag={t => setSetupTags(prev => [...prev, t])}
        />
      )}

      {closeTarget && (
        <CloseTradeModal
          trade={closeTarget}
          onClose={() => setClose(null)}
          onClosed={fetchTrades}
        />
      )}
    </div>
  )
}
