import { NextRequest, NextResponse } from "next/server"
import { callBedrock } from "@/lib/ai/bedrock"
import { logAgentAction, getAuditLog } from "@/lib/aws/audit"

const SYMBOL_FORMAT = /^[A-Z0-9.\-^]{1,15}$/
const BEDROCK_MODEL = "anthropic.claude-3-7-sonnet-20250219-v1:0"

interface DocumentSet {
  billOfLading?: { consignee?: string; portOfLoading?: string; portOfDischarge?: string; [k: string]: any }
  letterOfCredit?: { consignee?: string; amount?: number; currency?: string; [k: string]: any }
  invoice?: { amount?: number; currency?: string; [k: string]: any }
}

interface CheckResult {
  name: string
  passed: boolean
  reason: string
}

function checkDocumentCompleteness(documents: DocumentSet): CheckResult {
  const missing: string[] = []
  if (!documents.billOfLading) missing.push("billOfLading")
  if (!documents.letterOfCredit) missing.push("letterOfCredit")
  if (!documents.invoice) missing.push("invoice")
  const passed = missing.length === 0
  return {
    name: "document_completeness",
    passed,
    reason: passed ? "All 3 required documents present" : `Missing document(s): ${missing.join(", ")}`
  }
}

function checkAmountConsistency(documents: DocumentSet): { result: CheckResult; mismatchDetected: boolean } {
  const invoiceAmount = documents.invoice?.amount
  const lcAmount = documents.letterOfCredit?.amount

  if (invoiceAmount == null || lcAmount == null) {
    return {
      result: {
        name: "amount_consistency",
        passed: true,
        reason: "Insufficient data to verify — invoice or LC amount missing, check skipped"
      },
      mismatchDetected: false
    }
  }

  const passed = invoiceAmount === lcAmount
  return {
    result: {
      name: "amount_consistency",
      passed,
      reason: passed
        ? `Invoice amount (${invoiceAmount}) matches LC amount (${lcAmount})`
        : `Mismatch: invoice amount (${invoiceAmount}) does not match LC amount (${lcAmount})`
    },
    mismatchDetected: !passed
  }
}

function checkPartyVerification(documents: DocumentSet): CheckResult {
  const bolConsignee = documents.billOfLading?.consignee
  const lcConsignee = documents.letterOfCredit?.consignee

  if (!bolConsignee || !lcConsignee) {
    return {
      name: "party_verification",
      passed: true,
      reason: "Insufficient data to verify — consignee missing on one or both documents, check skipped"
    }
  }

  const passed = bolConsignee.trim().toLowerCase() === lcConsignee.trim().toLowerCase()
  return {
    name: "party_verification",
    passed,
    reason: passed
      ? `Consignee "${bolConsignee}" matches across BoL and LC`
      : `Mismatch: BoL consignee "${bolConsignee}" does not match LC consignee "${lcConsignee}"`
  }
}

function checkRegulatoryCompliance(caseId: string, symbol: string, amountMismatchDetected: boolean): CheckResult {
  const reasons: string[] = []
  if (!caseId) reasons.push("caseId missing")
  if (!symbol || !SYMBOL_FORMAT.test(symbol)) reasons.push("symbol does not match expected ticker format")
  if (amountMismatchDetected) reasons.push("unresolved invoice/LC amount discrepancy is a regulatory red flag under IFSCA cross-border documentation rules")

  const passed = reasons.length === 0
  return {
    name: "regulatory_compliance",
    passed,
    reason: passed ? "No basic IFSCA/RBI rule violations detected" : reasons.join("; ")
  }
}

function fallbackAnalysis(checks: CheckResult[], riskLevel: string): string {
  const failed = checks.filter((c) => !c.passed)
  if (failed.length === 0) {
    return `All ${checks.length} compliance checks passed. Risk level: ${riskLevel}.`
  }
  return `${failed.length} of ${checks.length} checks failed (${failed.map((c) => c.name).join(", ")}). Risk level: ${riskLevel}. Manual review recommended.`
}

export async function POST(req: NextRequest) {
  try {
    const { caseId, symbol, documents, traderProfile } = await req.json()
    const docs: DocumentSet = documents || {}

    const check1 = checkDocumentCompleteness(docs)
    const { result: check2, mismatchDetected } = checkAmountConsistency(docs)
    const check3 = checkPartyVerification(docs)
    const check4 = checkRegulatoryCompliance(caseId, symbol, mismatchDetected)

    const checks: CheckResult[] = [check1, check2, check3, check4]
    const failedCount = checks.filter((c) => !c.passed).length
    const riskLevel = failedCount === 0 ? "LOW" : failedCount === 1 ? "MEDIUM" : "HIGH"
    const verdict = riskLevel === "LOW" ? "PASS" : riskLevel === "MEDIUM" ? "REVIEW" : "FAIL"
    const requiresHumanReview = riskLevel === "HIGH"

    // Confidence is a simple heuristic: penalize failed checks and any check
    // that had to be skipped due to insufficient data — not a model output.
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
      console.error("[compliance-route] Bedrock call failed, using fallback analysis:", err)
      aiAnalysis = fallbackAnalysis(checks, riskLevel)
      model = "rule-based-fallback"
    }

    const result = {
      caseId,
      symbol,
      verdict,
      riskLevel,
      confidence,
      checks,
      aiAnalysis,
      model,
      timestamp: new Date().toISOString(),
      requiresHumanReview
    }

    await logAgentAction({
      caseId: caseId || "unknown",
      agent: "ComplianceAgent",
      action: "document_verification",
      input: `${symbol} :: ${JSON.stringify(docs)}`,
      output: aiAnalysis,
      model,
      riskLevel
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error("[compliance-route] POST failed:", err)
    return NextResponse.json({ error: "Compliance verification failed" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const caseId = req.nextUrl.searchParams.get("caseId")
    if (!caseId) {
      return NextResponse.json({ error: "caseId query parameter is required" }, { status: 400 })
    }
    const events = await getAuditLog(caseId)
    return NextResponse.json({ caseId, events })
  } catch (err) {
    console.error("[compliance-route] GET failed:", err)
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 })
  }
}