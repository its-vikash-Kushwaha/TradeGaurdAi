"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, TrendingUp, TrendingDown, BarChart2, Activity, AlertTriangle, RefreshCw, Zap, ChevronRight, ShieldCheck, Database, Building2 } from 'lucide-react'
import MarketStatusBadge from '@/components/shared/MarketStatusBadge'
import ShareButton from '@/components/shared/ShareButton'

const MARKET_GROUPS = [
  { flag: '🇺🇸', label: 'US Stocks',   color: 'var(--accent-blue)', tickers: ['AAPL', 'NVDA', 'TSLA', 'META', 'MSFT', 'AMZN', 'GOOGL'] },
  { flag: '🇮🇳', label: 'India NSE',   color: 'var(--warning)',     tickers: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO'] },
  { flag: '₿',   label: 'Crypto',      color: '#D97706',            tickers: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE'] },
  { flag: '💱',  label: 'Forex',       color: 'var(--cyan)',        tickers: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDINR', 'AUDUSD'] },
  { flag: '🪙',  label: 'Commodities', color: '#D97706',            tickers: ['XAUUSD', 'XAGUSD', 'CL', 'NG'] },
  { flag: '🌏',  label: 'Global',      color: 'var(--purple)',      tickers: ['VOD.L', 'SAP.DE', 'ASML.AS', '7203.T'] },
]

function MiniChart({ positive }: { positive: boolean }) {
  const pts = positive
    ? [40, 35, 42, 38, 45, 43, 50, 48, 55, 52, 60]
    : [60, 55, 52, 58, 48, 45, 42, 46, 38, 35, 30]
  const max = Math.max(...pts), min = Math.min(...pts)
  const norm = pts.map(p => 44 - ((p - min) / (max - min)) * 40)
  const path = norm.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${y}`).join(' ')
  return (
    <svg width="100" height="44" style={{ opacity: 0.85 }}>
      <path d={path} fill="none" stroke={positive ? 'var(--bull)' : 'var(--bear)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AnalysisPanel({ symbol, data }: { symbol: string; data: any }) {
  const mi  = data.marketInfo || {}
  const cs  = mi.currencySymbol || '$'
  const isUp = (data.changePct ?? 0) >= 0
  const rec  = data.synthesis?.recommendation ?? 'PROCEED_WITH_CAUTION'

  return (
    <div className="slide-in" style={{ marginTop: '20px' }}>
      {/* Price Header Card */}
      <div className="card-enterprise" style={{ padding: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--navy-primary)' }}>{mi.name || symbol}</span>
          <span style={{
            fontSize: '11px', padding: '2px 8px', background: 'var(--bg-subtle)', color: 'var(--accent-blue)',
            borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700',
          }}>
            {mi.exchange || 'Global'}
          </span>
          <span style={{
            fontSize: '11px', padding: '2px 8px', background: 'var(--bg-subtle)', color: 'var(--text-muted)',
            borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace',
          }}>
            {mi.currency || 'USD'}
          </span>
          {mi.yahooSymbol && <MarketStatusBadge yahooSymbol={mi.yahooSymbol} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--navy-primary)' }}>
                {cs}{(data.price ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                {isUp ? '+' : ''}{(data.changePct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                ['High', mi.high != null ? `${cs}${mi.high.toFixed?.(2) ?? mi.high}` : '—'],
                ['Low',  mi.low  != null ? `${cs}${mi.low.toFixed?.(2)  ?? mi.low}`  : '—'],
                ['Vol',  mi.volume || '—'],
                ['Cap',  mi.marketCap || '—'],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k}:</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <MiniChart positive={isUp} />
            <span className={rec === 'FAVORABLE' ? 'badge badge-compliant' : 'badge badge-review'}>
              {rec.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* News & Technical Cards Grid */}
      <div className="research-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div className="card-enterprise" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart2 size={13} color="var(--accent-blue)" /> News & Catalyst Analysis
          </div>
          {data.newsImpact?.headline && (
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-primary)', marginBottom: '6px', lineHeight: '1.4' }}>
              {data.newsImpact.headline}
            </p>
          )}
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {data.newsImpact?.newsImpact || data.newsImpact?.whatItMeans || 'No recent market catalyst identified.'}
          </p>
        </div>

        <div className="card-enterprise" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={13} color="var(--accent-blue)" /> Technical Indicator Matrix
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {[
              ['Trend',      data.technicalRead?.trend ?? data.technicalRead?.technicalBias ?? '—'],
              ['RSI',        data.technicalRead?.rsi ?? '—'],
              ['Support',    data.technicalRead?.support1 != null ? `${cs}${(+data.technicalRead.support1).toLocaleString()}` : '—'],
              ['Resistance', data.technicalRead?.resistance1 != null ? `${cs}${(+data.technicalRead.resistance1).toLocaleString()}` : '—'],
            ].map(([k, v]) => (
              <div key={k as string} style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--navy-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Synthesis */}
      <div className="card-enterprise" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--navy-primary)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={13} color="var(--accent-blue)" /> Executive Analysis Synthesis
          </div>
          <ShareButton
            text={`${symbol} Compliance Analysis\n${data.synthesis?.summary ?? ''}`}
            label="Export Summary"
          />
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
          {data.synthesis?.summary ?? data.synthesis?.recommendationReason ?? '—'}
        </p>
      </div>
    </div>
  )
}

function ResearchPageInner() {
  const searchParams                    = useSearchParams()
  const [ticker,  setTicker]  = useState('')
  const [symbol,  setSymbol]  = useState('')
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    const sym = searchParams.get('symbol')
    if (sym) { setTicker(sym.toUpperCase()); handleSearch(sym) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (sym: string) => {
    const s = sym.toUpperCase().trim()
    if (!s) return
    setSymbol(s)
    setError(null)
    setLoading(true)
    setData(null)

    try {
      const res  = await fetch(`/api/research/${encodeURIComponent(s)}`)
      const json = await res.json()

      if (json.success && json.data) {
        const d  = json.data
        const mi = d.marketInfo || {}
        setData({
          price:      d.priceAtAnalysis ?? 0,
          change:     mi.change ?? 0,
          changePct:  mi.changePct ?? 0,
          marketInfo: {
            name:           mi.name         || s,
            exchange:       mi.exchange     || 'Global',
            currency:       mi.currency     || 'USD',
            currencySymbol: mi.currencySymbol || '$',
            market:         mi.market       || 'US',
            volume:         mi.volume       || 'N/A',
            marketCap:      mi.marketCap    || 'N/A',
            high:           mi.high         ?? d.priceAtAnalysis,
            low:            mi.low          ?? d.priceAtAnalysis,
            yahooSymbol:    mi.yahooSymbol,
          },
          newsImpact:          d.newsImpact,
          technicalRead:       d.technicalRead,
          retailTrapAnalysis:  d.retailTrapAnalysis,
          synthesis:           d.synthesis,
        })
      } else {
        setError(json.error || `Could not load analysis for ${s}.`)
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="slide-in" style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy-primary)', letterSpacing: '-0.01em' }}>
            Regulatory & Market Intelligence Terminal
          </h1>
          <span className="badge badge-info">MULTI-MARKET</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Multi-asset risk screening across US Equities, Indian NSE/BSE, Crypto, Forex, and Commodities
        </p>
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '460px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '36px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', height: '42px', fontSize: '14px' }}
            placeholder="Search ticker e.g. AAPL, RELIANCE, BTC, EURUSD"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(ticker) }}
          />
        </div>
        <button className="btn-primary" onClick={() => handleSearch(ticker)} disabled={loading} style={{ height: '42px', padding: '0 20px' }}>
          {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Analyze Symbol'}
        </button>
      </div>

      {/* Quick Tickers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {MARKET_GROUPS.map(group => (
          <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', minWidth: '100px' }}>
              {group.flag} {group.label}
            </span>
            {group.tickers.map(t => (
              <button key={t} onClick={() => { setTicker(t); handleSearch(t) }} disabled={loading}
                style={{
                  padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                  border: '1px solid var(--border-default)', background: 'var(--bg-surface)',
                  color: 'var(--navy-primary)', fontSize: '11px', fontWeight: '600',
                  fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.15s ease',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <RefreshCw size={20} color="var(--accent-blue)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy-primary)' }}>Analyzing {symbol} across multi-agent compliance rules…</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '14px 18px', background: 'var(--bear-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', color: 'var(--bear)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {data && !loading && <AnalysisPanel symbol={symbol} data={data} />}
    </div>
  )
}

export default function ResearchPage() {
  return (
    <Suspense>
      <ResearchPageInner />
    </Suspense>
  )
}