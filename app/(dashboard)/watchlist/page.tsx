"use client"

import { useState, useEffect, useCallback } from 'react'
import { Star, TrendingUp, TrendingDown, Plus, Trash2, RefreshCw, ShieldCheck, Activity } from 'lucide-react'

interface WatchlistItem {
  id:         string
  symbol:     string
  assetClass: string
  addedAt:    string
}

interface PriceData {
  price:     number
  change:    number
  changePct: number
  high:      number
  low:       number
  volume:    number
  name:      string
  currency:  string
  loading:   boolean
  error:     boolean
}

function MiniSparkline({ up }: { up: boolean }) {
  const pts = up
    ? [10, 8, 12, 9, 14, 11, 16, 13, 18, 15, 20]
    : [20, 18, 15, 19, 13, 16, 11, 14, 9, 12, 7]
  const min = Math.min(...pts), max = Math.max(...pts)
  const norm = pts.map(p => 24 - ((p - min) / (max - min)) * 20)
  const path = norm.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 6} ${y}`).join(' ')
  return (
    <svg width="60" height="24">
      <path d={path} fill="none" stroke={up ? 'var(--bull)' : 'var(--bear)'} strokeWidth="1.5" />
    </svg>
  )
}

export default function WatchlistPage() {
  const [items,     setItems]     = useState<WatchlistItem[]>([])
  const [prices,    setPrices]    = useState<Record<string, PriceData>>({})
  const [loading,   setLoading]   = useState(true)
  const [newTicker, setNewTicker] = useState('')
  const [adding,    setAdding]    = useState(false)
  const [addError,  setAddError]  = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchPrice = useCallback(async (symbol: string) => {
    setPrices(prev => ({ ...prev, [symbol]: { ...(prev[symbol] ?? {} as any), loading: true, error: false } }))
    try {
      const res  = await fetch(`/api/prices/${symbol}`)
      const data = await res.json()
      if (data.success) {
        setPrices(prev => ({ ...prev, [symbol]: { ...data.data, loading: false, error: false } }))
      } else {
        setPrices(prev => ({ ...prev, [symbol]: { ...(prev[symbol] ?? {} as any), loading: false, error: true } }))
      }
    } catch {
      setPrices(prev => ({ ...prev, [symbol]: { ...(prev[symbol] ?? {} as any), loading: false, error: true } }))
    }
  }, [])

  const refreshAllPrices = useCallback(async (symbols: string[]) => {
    setRefreshing(true)
    await Promise.allSettled(symbols.map(fetchPrice))
    setRefreshing(false)
  }, [fetchPrice])

  useEffect(() => {
    fetch('/api/watchlist')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setItems(d.data)
          const initPrices: Record<string, PriceData> = {}
          d.data.forEach((i: WatchlistItem) => {
            initPrices[i.symbol] = { price: 0, change: 0, changePct: 0, high: 0, low: 0, volume: 0, name: '', currency: '', loading: true, error: false }
          })
          setPrices(initPrices)
          refreshAllPrices(d.data.map((i: WatchlistItem) => i.symbol))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const sym = newTicker.trim().toUpperCase()
    if (!sym) return
    setAdding(true)
    setAddError('')
    try {
      const res  = await fetch('/api/watchlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ symbol: sym }),
      })
      const data = await res.json()
      if (data.success) {
        setItems(prev => [...prev, data.data])
        setNewTicker('')
        fetchPrice(sym)
      } else {
        setAddError(data.error || 'Failed to add ticker.')
      }
    } catch {
      setAddError('Network error — please try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(symbol: string) {
    try {
      const res  = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setItems(prev => prev.filter(i => i.symbol !== symbol))
      }
    } catch { /* noop */ }
  }

  return (
    <div className="slide-in" style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>
              Counterparty & Asset Watchlist
            </h1>
            <span className="badge badge-compliant">ACTIVE MONITORING</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time compliance monitoring across watched counterparties, equities, and market instruments
          </p>
        </div>
        <button onClick={() => refreshAllPrices(items.map(i => i.symbol))} className="btn-ghost" disabled={refreshing}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh All'}
        </button>
      </div>

      {/* Add form */}
      <div className="card-enterprise" style={{ padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Star size={16} color="var(--accent-blue)" />
          <input
            className="input-field"
            placeholder="Add ticker to watchlist (e.g. AAPL, RELIANCE, BTC)…"
            value={newTicker}
            onChange={e => setNewTicker(e.target.value)}
            disabled={adding}
            style={{ fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
          />
          <button type="submit" className="btn-primary" disabled={adding || !newTicker.trim()} style={{ flexShrink: 0 }}>
            {adding ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Plus size={14} /> Add Symbol</>}
          </button>
        </form>
        {addError && <div style={{ color: 'var(--bear)', fontSize: '12px', marginTop: '8px' }}>{addError}</div>}
      </div>

      {/* Table List */}
      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '6px' }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Star size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy-primary)' }}>Watchlist is empty</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Add tickers above to monitor prices and compliance signals.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase' }}>Symbol</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase' }}>Asset</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'right', textTransform: 'uppercase' }}>Price</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'right', textTransform: 'uppercase' }}>24h Change</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase' }}>Sparkline</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'right', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const p  = prices[item.symbol]
                  const up = (p?.changePct ?? 0) >= 0
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '800', color: 'var(--navy-primary)' }}>
                        {item.symbol}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {item.assetClass}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700' }}>
                        {p?.loading ? '—' : `$${(p?.price ?? 0).toFixed(2)}`}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: up ? 'var(--bull)' : 'var(--bear)' }}>
                        {p?.loading ? '—' : `${up ? '+' : ''}${(p?.changePct ?? 0).toFixed(2)}%`}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <MiniSparkline up={up} />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button onClick={() => handleDelete(item.symbol)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bear)' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}