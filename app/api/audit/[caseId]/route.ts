import { NextRequest, NextResponse } from "next/server"
import { getAuditLog } from "@/lib/aws/audit"

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  try {
    const { caseId } = params
    const events = await getAuditLog(caseId)
    return NextResponse.json({ caseId, events })
  } catch (err) {
    console.error("[audit-route] GET failed:", err)
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 })
  }
}