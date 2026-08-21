"use client"

import { useState, useEffect, useRef } from 'react'
import { Bell, Clock, Search, ChevronDown, ShieldCheck, CheckCircle2, Building, Command } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { searchPopularSymbols } from '@/lib/data/symbols'

interface TickerPrice {
  price:     number
  changePct: number
  loading:   boolean
}

interface UserProfile {
  name:  string
  email: string
  plan:  string
}

const WATCH_TICKERS = [
  { symbol: 'SPY',      label: 'SPY', yahooSymbol: 'SPY'      },
  { symbol: 'QQQ',      label: 'QQQ', yahooSymbol: 'QQQ'      },
  { symbol: 'BTC-USD',  label: 'BTC', yahooSymbol: 'BTC-USD'  },
  { symbol: 'USDINR=X', label: '₹/USD', yahooSymbol: 'USDINR=X' },
]

// Map routes to breadcrumbs
const BREADCRUMB_MAP: Record<string, string> = {
  '/feed':      'Overview / Compliance Command Center',
  '/trades':    'Trade Operations / Transactions & Audit Log',
  '/watchlist': 'Trade Operations / Counterparty Watchlist',
  '/mind':      'Compliance & Risk / Risk & Regime Engine',
  '/copilot':   'Intelligence / AI Compliance Copilot',
  '/research':  'Intelligence / Regulatory & Market Terminal',
  '/journal':   'Intelligence / Audit & Review Journal',
  '/settings':  'System / Enterprise Settings',
}

export default function TopBar() {
  const router                        = useRouter()
  const pathname                      = usePathname()
  const [prices,    setPrices]        = useState<Record<string, TickerPrice>>({})
  const [time,      setTime]          = useState(new Date())
  const [searchVal, setSearchVal]     = useState('')
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchFocus, setSearchFocus] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user,       setUser]         = useState<UserProfile | null>(null)
  const searchRef                     = useRef<HTMLDivElement>(null)
  const profileRef                    = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)

  const searchSuggestions = searchVal.length >= 1 ? searchPopularSymbols(searchVal, 6) : searchPopularSymbols('', 6)

  // Keyboard shortcut to focus search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  async function fetchPrices() {
    await Promise.allSettled(
      WATCH_TICKERS.map(async t => {
        try {
          const res  = await fetch(`/api/prices/${encodeURIComponent(t.yahooSymbol)}`)
          const data = await res.json()
          if (data.success) {
            setPrices(prev => ({
              ...prev,
              [t.symbol]: { price: data.data.price, changePct: data.data.changePct, loading: false },
            }))
          }
        } catch {
          // keep previous on failure
        }
      })
    )
  }

  useEffect(() => {
    const initial: Record<string, TickerPrice> = {}
    WATCH_TICKERS.forEach(t => { initial[t.symbol] = { price: 0, changePct: 0, loading: true } })
    setPrices(initial)
    fetchPrices()

    const priceInterval = setInterval(fetchPrices, 60_000)
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(priceInterval); clearInterval(clockInterval) }
  }, [])

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current  && !searchRef.current.contains(e.target  as Node)) setSearchOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function navigateSearch(symbol: string) {
    if (!symbol.trim()) return
    router.push(`/research?symbol=${encodeURIComponent(symbol.toUpperCase().trim())}`)
    setSearchVal('')
    setSearchOpen(false)
  }

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const breadcrumb = BREADCRUMB_MAP[pathname] ?? 'TradeGuard Platform'

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'TC'

  return (
    <header style={{
      height: '56px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-default)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0, gap: '16px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    }}>
      {/* Left: Breadcrumbs & System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color="var(--accent-blue)" />
          <span style={{
            fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)',
            fontFamily: 'Inter, sans-serif',
          }}>
            {breadcrumb}
          </span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'var(--border-default)' }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '3px 8px', borderRadius: '6px',
          background: 'var(--bull-dim)', border: '1px solid rgba(22,163,74,0.2)',
        }}>
          <CheckCircle2 size={11} color="var(--bull)" />
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--bull)' }}>
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            style={{
              width: '100%', padding: '7px 60px 7px 34px',
              background: 'var(--bg-subtle)', border: '1px solid var(--border-default)',
              borderRadius: '8px', color: 'var(--text-primary)',
              fontSize: '12px', fontFamily: 'JetBrains Mono, monospace',
              outline: 'none', textTransform: 'uppercase',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            placeholder="Search transaction / ticker…"
            value={searchVal}
            onChange={e => { setSearchVal(e.target.value); setSearchFocus(0) }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); navigateSearch(searchVal || (searchSuggestions[searchFocus]?.symbol ?? '')) }
              if (e.key === 'ArrowDown') { e.preventDefault(); setSearchFocus(f => Math.min(f + 1, searchSuggestions.length - 1)) }
              if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchFocus(f => Math.max(f - 1, 0)) }
              if (e.key === 'Escape')    setSearchOpen(false)
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <div style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}>
            <span style={{
              fontSize: '10px', padding: '2px 5px', borderRadius: '4px',
              background: 'var(--bg-surface)', color: 'var(--text-muted)',
              border: '1px solid var(--border-default)',
              fontFamily: 'JetBrains Mono, monospace', fontWeight: '600',
            }}>
              Ctrl K
            </span>
          </div>
        </div>
        {searchOpen && searchSuggestions.length > 0 && (
          <div className="slide-down" style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
            marginTop: '4px', borderRadius: '8px', overflow: 'hidden',
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }}>
            {searchSuggestions.map((s, i) => (
              <div
                key={s.symbol}
                onMouseDown={() => navigateSearch(s.symbol)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', cursor: 'pointer',
                  background: i === searchFocus ? 'var(--bg-subtle)' : 'transparent',
                  borderBottom: i < searchSuggestions.length - 1 ? '1px solid var(--border-default)' : 'none',
                }}
                onMouseEnter={() => setSearchFocus(i)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '12px', color: 'var(--text-primary)' }}>{s.symbol}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.name}</span>
                </div>
                <span style={{
                  fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                  background: 'var(--bg-subtle)', color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: '600',
                }}>{s.market}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Clock & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          color: 'var(--text-muted)', fontSize: '12px',
        }}>
          <Clock size={12} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>{timeStr} UTC</span>
        </div>

        <button style={{
          width: '32px', height: '32px', background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)',
          transition: 'all 0.15s ease',
        }}>
          <Bell size={14} />
        </button>

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '3px 8px 3px 3px', borderRadius: '8px',
              border: '1px solid var(--border-default)', background: 'var(--bg-surface)',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: '26px', height: '26px',
              background: 'var(--navy-primary)',
              borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '800', color: '#FFFFFF', flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{
              fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)',
              maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.name ? user.name.split(' ')[0] : 'Compliance'}
            </span>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>

          {profileOpen && (
            <div className="slide-down" style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 300,
              marginTop: '6px', borderRadius: '10px', overflow: 'hidden',
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.12)', minWidth: '220px',
            }}>
              <div style={{ padding: '14px', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {user?.name ?? 'Compliance Officer'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {user?.email ?? 'officer@tradeguard.app'}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span className="badge badge-compliant" style={{ fontSize: '10px' }}>
                    ENTERPRISE VERIFIED
                  </span>
                </div>
              </div>
              <button
                onClick={() => { router.push('/settings'); setProfileOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', background: 'transparent', border: 'none',
                  color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)'}
                onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
              >
                Settings & Compliance Rules
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
