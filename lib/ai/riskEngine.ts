import { CheckResult } from "@/lib/services/complianceChecks"

export interface RiskFactor {
  category: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  description: string
  weight: number
  score: number
}

export interface RiskAssessment {
  overall_risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  score: number
  factors: RiskFactor[]
  recommendation: string
  requires_hitl: boolean
  confidence: number
  reasoning: string
}

const WEIGHTS = {
  document_completeness: 0.25,
  counterparty_risk: 0.30,
  regulatory_compliance: 0.25,
  transaction_patterns: 0.20,
}

function severityFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score >= 70) return "HIGH"
  if (score >= 35) return "MEDIUM"
  return "LOW"
}

function overallRiskFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score > 80) return "CRITICAL"
  if (score > 60) return "HIGH"
  if (score > 30) return "MEDIUM"
  return "LOW"
}

// Maps the 4 deterministic compliance checks (lib/services/complianceChecks.ts)
// onto the 4 weighted risk categories this engine scores against. A failed
// check contributes its full category weight (as a 0-100 sub-score) to the
// overall risk score — this stays a pure function of the same check data the
// compliance verdict already computed, not a separate/diverging judgment.
export function assessRisk(checks: CheckResult[]): RiskAssessment {
  const byName = Object.fromEntries(checks.map((c) => [c.name, c]))

  const factors: RiskFactor[] = [
    {
      category: "Document Completeness",
      description: byName.document_completeness?.reason ?? "Not evaluated",
      weight: WEIGHTS.document_completeness,
      score: byName.document_completeness?.passed === false ? 100 : 0,
      severity: "LOW",
    },
    {
      category: "Counterparty Risk",
      description: byName.party_verification?.reason ?? "Not evaluated",
      weight: WEIGHTS.counterparty_risk,
      score: byName.party_verification?.passed === false ? 100 : 0,
      severity: "LOW",
    },
    {
      category: "Regulatory Compliance",
      description: byName.regulatory_compliance?.reason ?? "Not evaluated",
      weight: WEIGHTS.regulatory_compliance,
      score: byName.regulatory_compliance?.passed === false ? 100 : 0,
      severity: "LOW",
    },
    {
      category: "Transaction Patterns",
      description: byName.amount_consistency?.reason ?? "Not evaluated",
      weight: WEIGHTS.transaction_patterns,
      score: byName.amount_consistency?.passed === false ? 100 : 0,
      severity: "LOW",
    },
  ].map((f) => ({ ...f, severity: severityFromScore(f.score) }))

  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0))
  const overall_risk = overallRiskFromScore(score)
  const requires_hitl = overall_risk === "HIGH" || overall_risk === "CRITICAL"

  const failedCategories = factors.filter((f) => f.score > 0).map((f) => f.category)
  const reasoning =
    failedCategories.length === 0
      ? "All 4 weighted risk categories scored clean — no failed checks contributed to the score."
      : `Weighted score driven by: ${failedCategories.join(", ")}.`

  const recommendation =
    overall_risk === "CRITICAL"
      ? "Block transaction and escalate to senior compliance officer immediately."
      : overall_risk === "HIGH"
      ? "Route to human officer for mandatory review before proceeding."
      : overall_risk === "MEDIUM"
      ? "Flag for review — proceed only after officer sign-off."
      : "No elevated risk factors detected — eligible for standard processing."

  return {
    overall_risk,
    score,
    factors,
    recommendation,
    requires_hitl,
    confidence: 100, // deterministic weighted-sum calculation, not a model estimate
    reasoning,
  }
}
