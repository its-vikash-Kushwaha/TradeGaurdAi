import { NextRequest, NextResponse } from "next/server"
import { runResearchAgent } from "@/lib/ai/researchAgent"

export async function POST(req: NextRequest) {
  try {
    const { query, context, documentType } = await req.json()
    if (!query) {
      return NextResponse.json({ success: false, error: "query is required" }, { status: 400 })
    }

    const result = await runResearchAgent(query, context, documentType)

    return NextResponse.json({
      success: true,
      agent: "research",
      findings: result.findings,
      model: result.model,
      source: result.source,
      timestamp: new Date().toISOString(),
      processing_time_ms: result.processing_time_ms,
    })
  } catch (error) {
    console.error("[research-agent] POST failed:", error)
    return NextResponse.json({ success: false, error: "Research agent failed" }, { status: 500 })
  }
}
