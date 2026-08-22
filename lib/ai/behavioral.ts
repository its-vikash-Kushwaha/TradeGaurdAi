// Pure deterministic behavioral-pattern detection — no external API calls.
// Operates on real Trade rows when available; falls back to clearly-labeled
// synthetic data only when a user has no real trade history yet.

export interface BehavioralTrade {
  id: string
  symbol: string
  entryTime: string | Date
  exitTime: string | Date | null
  pnl: number | null
  quantity: number
  status: string
}

export interface BehavioralPattern {
  id: string
  title: string
  detected: boolean
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  insight: string
}

export interface DayPnl {
  date: string
  pnl: number
}

export interface BehavioralReport {
  patterns: BehavioralPattern[]
  winLossRatio: { wins: number; losses: number; winRatePct: number }
  bestDay: DayPnl | null
  worstDay: DayPnl | null
  emotionalRiskScore: number
  trend: DayPnl[]
  usingSyntheticData: boolean
}

function dayKey(d: string | Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

function detectOvertrading(trades: BehavioralTrade[]): BehavioralPattern {
  const sorted = [...trades].sort((a, b) => +new Date(a.entryTime) - +new Date(b.entryTime))
  let maxIn7Days = 0
  for (let i = 0; i < sorted.length; i++) {
    const windowStart = +new Date(sorted[i].entryTime)
    const windowEnd = windowStart + 7 * 24 * 3600 * 1000
    const count = sorted.filter((t) => {
      const ts = +new Date(t.entryTime)
      return ts >= windowStart && ts < windowEnd
    }).length
    if (count > maxIn7Days) maxIn7Days = count
  }
  const detected = maxIn7Days > 5
  return {
    id: 'overtrading',
    title: 'Overtrading',
    detected,
    risk: detected ? 'HIGH' : 'LOW',
    insight: detected
      ? `${maxIn7Days} trades within a single 7-day window — above the 5-trade threshold. Consider a hard cap on trades/week.`
      : `Peak activity was ${maxIn7Days} trades in any 7-day window — within the healthy range.`,
  }
}

function detectRevengeTrading(trades: BehavioralTrade[]): BehavioralPattern {
  const closed = [...trades]
    .filter((t) => t.status === 'CLOSED' && t.pnl != null)
    .sort((a, b) => +new Date(a.entryTime) - +new Date(b.entryTime))

  let maxStreak = 0
  let streak = 0
  for (const t of closed) {
    if ((t.pnl ?? 0) < 0) {
      streak++
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 0
    }
  }
  const detected = maxStreak >= 3
  return {
    id: 'revenge_trading',
    title: 'Revenge Trading',
    detected,
    risk: detected ? 'HIGH' : 'LOW',
    insight: detected
      ? `Longest losing streak: ${maxStreak} consecutive losses. Risk of revenge-sizing after the 3rd loss — consider a cooldown rule.`
      : `Longest losing streak: ${maxStreak} consecutive losses — below the 3-loss revenge-trading threshold.`,
  }
}

function detectPositionSizeBreach(trades: BehavioralTrade[]): BehavioralPattern {
  if (trades.length === 0) {
    return { id: 'position_size', title: 'Position Size Breaches', detected: false, risk: 'LOW', insight: 'No trades to evaluate.' }
  }
  const avgQty = trades.reduce((s, t) => s + t.quantity, 0) / trades.length
  const breaches = trades.filter((t) => t.quantity > avgQty * 1.5)
  const detected = breaches.length > 0
  return {
    id: 'position_size',
    title: 'Position Size Breaches',
    detected,
    risk: detected ? (breaches.length > trades.length * 0.2 ? 'HIGH' : 'MEDIUM') : 'LOW',
    insight: detected
      ? `${breaches.length} of ${trades.length} trades sized 50%+ above your average (${avgQty.toFixed(1)} units) — check for impulsive size-ups after wins.`
      : `All trades stayed within 50% of your average position size (${avgQty.toFixed(1)} units).`,
  }
}

function computeWinLoss(trades: BehavioralTrade[]): { wins: number; losses: number; winRatePct: number } {
  const closed = trades.filter((t) => t.status === 'CLOSED' && t.pnl != null)
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0).length
  const winRatePct = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0
  return { wins, losses, winRatePct }
}

function computeDayPnls(trades: BehavioralTrade[]): DayPnl[] {
  const byDay = new Map<string, number>()
  for (const t of trades) {
    if (t.status !== 'CLOSED' || t.pnl == null) continue
    const key = dayKey(t.exitTime ?? t.entryTime)
    byDay.set(key, (byDay.get(key) ?? 0) + t.pnl)
  }
  return Array.from(byDay.entries())
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function computeEmotionalRiskScore(patterns: BehavioralPattern[], winRatePct: number): number {
  let score = 0
  for (const p of patterns) {
    if (!p.detected) continue
    score += p.risk === 'HIGH' ? 30 : p.risk === 'MEDIUM' ? 15 : 5
  }
  if (winRatePct < 40) score += 15
  return Math.min(100, score)
}

// Clearly-labeled synthetic 30-day trade history — used ONLY when a user has
// zero real trades. Deterministic (no Math.random) so results are stable
// across renders/refreshes for the same demo user.
export function generateSyntheticTrades(): BehavioralTrade[] {
  const symbols = ['RELIANCE.NS', 'INFY.NS', 'TCS.NS', 'HDFCBANK.NS']
  const trades: BehavioralTrade[] = []
  const now = Date.now()
  const pnlPattern = [120, -80, 200, -150, -60, -40, 90, 300, -110, 60, -70, 150, -90, 40, 220]
  for (let i = 0; i < 15; i++) {
    const entryTime = new Date(now - (30 - i * 2) * 24 * 3600 * 1000)
    const exitTime = new Date(entryTime.getTime() + 4 * 3600 * 1000)
    trades.push({
      id: `synthetic_${i}`,
      symbol: symbols[i % symbols.length],
      entryTime,
      exitTime,
      pnl: pnlPattern[i % pnlPattern.length],
      quantity: 10 + (i % 5) * 5,
      status: 'CLOSED',
    })
  }
  return trades
}

export function analyzeBehavior(realTrades: BehavioralTrade[]): BehavioralReport {
  const usingSyntheticData = realTrades.length === 0
  const trades = usingSyntheticData ? generateSyntheticTrades() : realTrades

  const patterns = [
    detectOvertrading(trades),
    detectRevengeTrading(trades),
    detectPositionSizeBreach(trades),
  ]
  const winLossRatio = computeWinLoss(trades)
  const trend = computeDayPnls(trades)
  const bestDay = trend.length ? trend.reduce((a, b) => (b.pnl > a.pnl ? b : a)) : null
  const worstDay = trend.length ? trend.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : null
  const emotionalRiskScore = computeEmotionalRiskScore(patterns, winLossRatio.winRatePct)

  return { patterns, winLossRatio, bestDay, worstDay, emotionalRiskScore, trend, usingSyntheticData }
}
