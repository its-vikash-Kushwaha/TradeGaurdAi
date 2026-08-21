import { NextRequest, NextResponse } from "next/server"
import { getAuditLog, isUsingMemoryFallback } from "@/lib/aws/audit"

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const { caseId } = params
    const events = await getAuditLog(caseId)
    const humanDecisions = events.filter((e) => e.agent === "HumanOfficer")

    return NextResponse.json({
      caseId,
      events,
      humanDecisions,
      auditMode: isUsingMemoryFallback() ? "memory" : "dynamodb"
    })
  } catch (err) {
    console.error("[compliance-case-route] GET failed:", err)
    return NextResponse.json({ error: "Failed to fetch case audit trail" }, { status: 500 })
  }
}