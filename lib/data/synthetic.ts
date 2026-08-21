export const SYNTHETIC_TRADERS = [
  {
    id: "trader_priya",
    name: "Priya Sharma",
    plan: "PRO",
    regimeWinRates: { BULL_TREND: 0.68, BEAR_TREND: 0.55, CHOP: 0.31, CRISIS: 0.22 },
    activeFlags: ["REVENGE_FAST_REENTRY", "LATE_DAY_LEAK"],
    consecutiveLossesToday: 2,
    winRateOverall: 0.58,
    sampleSizeOverall: 47,
    calibrated: true,
    riskScore: 84
  },
  {
    id: "trader_arjun",
    name: "Arjun Mehta",
    plan: "PRO",
    regimeWinRates: { BULL_TREND: 0.42, BEAR_TREND: 0.48, CHOP: 0.67, CRISIS: 0.35 },
    activeFlags: [],
    consecutiveLossesToday: 0,
    winRateOverall: 0.61,
    sampleSizeOverall: 62,
    calibrated: true,
    riskScore: 22
  },
  {
    id: "trader_rahul",
    name: "Rahul Verma",
    plan: "FREE",
    regimeWinRates: { BULL_TREND: 0.48, BEAR_TREND: 0.40, CHOP: 0.38, CRISIS: 0.25 },
    activeFlags: ["OVERSIZE_AFTER_WINS"],
    consecutiveLossesToday: 1,
    winRateOverall: 0.44,
    sampleSizeOverall: 13,
    calibrated: false,
    riskScore: 61
  }
]

export const CURRENT_REGIME = {
  nifty: { regime: "CHOP", confidence: 0.74, source: "hmm" },
  spx: { regime: "BULL_TREND", confidence: 0.81, source: "hmm" },
  crossBorderNote: "NIFTY in CHOP, SPX in BULL — divergent regimes."
}

export interface SyntheticCase {
  caseId: string
  symbol: string
  documents: {
    billOfLading?: { consignee?: string; portOfLoading?: string; portOfDischarge?: string }
    letterOfCredit?: { consignee?: string; amount?: number; currency?: string }
    invoice?: { amount?: number; currency?: string }
  }
  description: string
}

export function generateCleanCase(): SyntheticCase {
  return {
    caseId: "case_clean_001",
    symbol: "RELIANCE",
    documents: {
      billOfLading: { consignee: "Orion Traders Pvt Ltd", portOfLoading: "Mumbai", portOfDischarge: "Dubai" },
      letterOfCredit: { consignee: "Orion Traders Pvt Ltd", amount: 100000, currency: "USD" },
      invoice: { amount: 100000, currency: "USD" }
    },
    description:
      "Clean case — all 3 documents present, invoice/LC amounts match, consignee matches. Expected: LOW risk, PASS."
  }
}

export function generateHighRiskCase(): SyntheticCase {
  return {
    caseId: "case_highrisk_001",
    symbol: "TATASTEEL",
    documents: {
      billOfLading: { consignee: "Meridian Exports Ltd", portOfLoading: "Chennai", portOfDischarge: "Singapore" },
      letterOfCredit: { consignee: "Meridian Exports Ltd", amount: 100000, currency: "USD" },
      invoice: { amount: 150000, currency: "USD" }
    },
    description:
      "High-risk case — invoice amount (150000) does not match LC amount (100000), deliberately injected mismatch. Expected: HIGH risk, FAIL, requiresHumanReview."
  }
}

export function generateMediumRiskCase(): SyntheticCase {
  return {
    caseId: "case_medium_001",
    symbol: "INFY",
    documents: {
      billOfLading: { consignee: "Falcon Global Traders", portOfLoading: "Kochi", portOfDischarge: "Colombo" },
      letterOfCredit: { consignee: "Falcon Global Traders", amount: 80000, currency: "USD" }
      // invoice deliberately omitted
    },
    description: "Medium-risk case — invoice document missing. Expected: MEDIUM risk, REVIEW."
  }
}