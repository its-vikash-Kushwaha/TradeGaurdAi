import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import db from "@/lib/db"
import { getUserId } from "@/lib/auth"
import { runResearchAgent } from "@/lib/ai/researchAgent"
import { runComplianceAgent } from "@/lib/ai/complianceAgent"
import { assessRisk } from "@/lib/ai/riskEngine"
import { analyzeBehavior, BehavioralTrade } from "@/lib/ai/behavioral"
import { DocumentSet } from "@/lib/services/complianceChecks"
import { logAgentAction } from "@/lib/aws/audit"

export async function POST(req: NextRequest) {
  const start = Date.now()
  try {
    const { caseId, symbol, documents, query, context, documentType, traderProfile } = await req.json()
    if (!caseId || !symbol) {
      return NextResponse.json({ success: false, error: "caseId and symbol are required" }, { status: 400 })
    }
    const docs: DocumentSet = documents || {}
    const agentsInvoked: string[] = []

    // Step 1 — Research Agent
    const research = await runResearchAgent(
      query || `Research findings for case ${caseId}`,
      context || JSON.stringify(docs),
      documentType || "Letter of Credit"
    )
    agentsInvoked.push("ResearchAgent")

    // Step 2 — Compliance Agent (same logic that powers /api/compliance)
    const compliance = await runComplianceAgent(caseId, symbol, docs, traderProfile)
    agentsInvoked.push("ComplianceAgent")

    // Step 3 — Risk Engine (weighted score over the same 4 checks)
    const risk = assessRisk(compliance.checks)
    agentsInvoked.push("RiskEngine")

    // Step 4 — Behavioral Agent (only if a real trading user context exists)
    const userId = await getUserId()
    let behavioral: ReturnType<typeof analyzeBehavior> | null = null
    if (userId) {
      const trades = await db.trade.findMany({ where: { userId }, orderBy: { entryTime: "desc" }, take: 100 })
      const behavioralTrades: BehavioralTrade[] = trades.map((t) => ({
        id: t.id, symbol: t.symbol, entryTime: t.entryTime, exitTime: t.exitTime,
        pnl: t.pnl, quantity: t.quantity, status: t.status,
      }))
      behavioral = analyzeBehavior(behavioralTrades)
      agentsInvoked.push("BehavioralAgent")
    }

    // Step 5 — Synthesis
    const overallRisk = risk.overall_risk
    const complianceStatus = compliance.verdict
    const requiresHumanReview = risk.requires_hitl || compliance.requiresHumanReview

    const keyFindings: string[] = [
      ...research.findings.key_points.slice(0, 2),
      ...compliance.checks.filter((c) => !c.passed).map((c) => c.reason),
      risk.reasoning,
    ]

    const recommendation = requiresHumanReview
      ? "Route to a human compliance officer before proceeding — one or more agents flagged elevated risk."
      : "No elevated risk detected across agents — eligible for standard processing."

    const auditEntryId = await logAgentAction({
      caseId,
      agent: "Orchestrator",
      action: "multi_agent_analysis",
      input: `${symbol} :: ${JSON.stringify(docs)}`,
      output: `${agentsInvoked.length} agents run — overall risk ${overallRisk}, compliance ${complianceStatus}`,
      model: `research:${research.model} | compliance:${compliance.model}`,
      riskLevel: overallRisk === "CRITICAL" ? "HIGH" : overallRisk,
    })

    if (requiresHumanReview) {
      await logAgentAction({
        caseId,
        agent: "Orchestrator",
        action: "hitl_auto_triggered",
        input: `overall_risk=${overallRisk}`,
        output: "Case automatically routed for human review",
        model: "rule-based",
        riskLevel: overallRisk === "CRITICAL" ? "HIGH" : overallRisk,
      })
    }

    return NextResponse.json({
      case_id: caseId,
      agents_invoked: agentsInvoked,
      total_processing_time: Date.now() - start,
      overall_risk: overallRisk,
      compliance_status: complianceStatus,
      key_findings: keyFindings,
      recommendation,
      requires_human_review: requiresHumanReview,
      confidence: compliance.confidence,
      audit_entry_id: auditEntryId,
      // Full detail from each agent, for the UI to render step-by-step
      research,
      compliance,
      risk,
      behavioral,
    })
  } catch (error) {
    console.error("[orchestrator] POST failed:", error)
    return NextResponse.json({ success: false, error: "Orchestrator failed" }, { status: 500 })
  }
}
