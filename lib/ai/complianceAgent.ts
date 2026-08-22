import { callBedrock } from "@/lib/ai/bedrock"
import {
  DocumentSet,
  CheckResult,
  checkDocumentCompleteness,
  checkAmountConsistency,
  checkPartyVerification,
  checkRegulatoryCompliance,
} from "@/lib/services/complianceChecks"

const BEDROCK_MODEL = "anthropic.claude-3-7-sonnet-20250219-v1:0"

export interface ComplianceResult {
  verdict: "PASS" | "REVIEW" | "FAIL"
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  confidence: number
  checks: CheckResult[]
  aiAnalysis: string
  model: string
  requiresHumanReview: boolean
}

function fallbackAnalysis(checks: CheckResult[], riskLevel: string): string {
  const failed = checks.filter((c) => !c.passed)
  if (failed.length === 0) {
    return `All ${checks.length} compliance checks passed. Risk level: ${riskLevel}.`
  }
  return `${failed.length} of ${checks.length} checks failed (${failed.map((c) => c.name).join(", ")}). Risk level: ${riskLevel}. Manual review recommended.`
}

export async function runComplianceAgent(
  caseId: string,
  symbol: string,
  documents: DocumentSet,
  traderProfile?: Record<string, unknown>
): Promise<ComplianceResult> {
  const check1 = checkDocumentCompleteness(documents)
  const { result: check2, mismatchDetected } = checkAmountConsistency(documents)
  const check3 = checkPartyVerification(documents)
  const check4 = checkRegulatoryCompliance(caseId, symbol, mismatchDetected)

  const checks: CheckResult[] = [check1, check2, check3, check4]
  const failedCount = checks.filter((c) => !c.passed).length
  const riskLevel = failedCount === 0 ? "LOW" : failedCount === 1 ? "MEDIUM" : "HIGH"
  const verdict = riskLevel === "LOW" ? "PASS" : riskLevel === "MEDIUM" ? "REVIEW" : "FAIL"
  const requiresHumanReview = riskLevel === "HIGH"

  const skippedCount = checks.filter((c) => c.reason.includes("skipped")).length
  const confidence = Math.max(0, 100 - failedCount * 20 - skippedCount * 10)

  let aiAnalysis: string
  let model: string
  try {
    const prompt = `Case ${caseId} (symbol ${symbol}). Compliance checks:\n${JSON.stringify(
      checks,
      null,
      2
    )}\nTrader profile: ${JSON.stringify(traderProfile ?? {})}\n\nWrite a concise 2-4 sentence compliance analyst summary of these findings. Only reference the numbers/facts given above — do not invent details.`
    aiAnalysis = await callBedrock(
      prompt,
      "You are the Compliance Agent for TradeGuard AI, a behavioral risk system for GIFT City brokers. Only cite data provided. Never fabricate numbers."
    )
    model = BEDROCK_MODEL
  } catch (err) {
    console.error("[compliance-agent] Bedrock call failed, using fallback analysis:", err)
    aiAnalysis = fallbackAnalysis(checks, riskLevel)
    model = "rule-based-fallback"
  }

  return { verdict, riskLevel, confidence, checks, aiAnalysis, model, requiresHumanReview }
}
