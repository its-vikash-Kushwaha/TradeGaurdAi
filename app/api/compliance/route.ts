import { NextRequest, NextResponse } from "next/server"
import { logAgentAction, getAuditLog } from "@/lib/aws/audit"
import { DocumentSet } from "@/lib/services/complianceChecks"
import { runComplianceAgent } from "@/lib/ai/complianceAgent"

export async function POST(req: NextRequest) {
  try {
    const { caseId, symbol, documents, traderProfile } = await req.json()
    const docs: DocumentSet = documents || {}

    const { verdict, riskLevel, confidence, checks, aiAnalysis, model, requiresHumanReview } =
      await runComplianceAgent(caseId, symbol, docs, traderProfile)

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