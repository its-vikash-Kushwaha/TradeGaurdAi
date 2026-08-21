import { NextRequest, NextResponse } from "next/server"
import { logHumanDecision } from "@/lib/aws/audit"

export async function POST(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const { caseId } = params
    const { decision, notes, userId } = await req.json()

    if (!decision) {
      return NextResponse.json({ error: "decision is required" }, { status: 400 })
    }

    const eventId = await logHumanDecision(caseId, decision, notes || "", userId || "demo_officer")

    return NextResponse.json({ caseId, eventId, decision, logged: true })
  } catch (err) {
    console.error("[compliance-approve-route] POST failed:", err)
    return NextResponse.json({ error: "Failed to log human decision" }, { status: 500 })
  }
}
