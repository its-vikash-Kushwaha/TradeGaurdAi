import { callBedrock } from "@/lib/ai/bedrock"

const BEDROCK_MODEL = "anthropic.claude-3-7-sonnet-20250219-v1:0"

const SYSTEM_PROMPT = `You are the Research Agent for TradeGuard AI, a trade-finance compliance system for GIFT City IBUs.
Given a case query and context, produce a structured research finding for a compliance officer reviewing a Letter of Credit / trade-finance case.
Only reference facts present in the query/context provided — never invent specific transaction numbers, company names, or amounts that were not given to you.
Output ONLY valid JSON matching this exact shape:
{"key_points": string[3-5], "risk_level": "LOW"|"MEDIUM"|"HIGH", "confidence": string, "regulatory_flags": string[], "recommendation": string}`

export interface ResearchFindings {
  key_points: string[]
  risk_level: "LOW" | "MEDIUM" | "HIGH"
  confidence: string
  regulatory_flags: string[]
  recommendation: string
}

export interface ResearchResult {
  findings: ResearchFindings
  model: string
  source: "bedrock" | "synthetic-demo"
  processing_time_ms: number
}

function parseFindings(text: string): ResearchFindings | null {
  try {
    const stripped = text.replace(/```json\n?|```\n?/g, "").trim()
    const data = JSON.parse(stripped)
    if (!Array.isArray(data.key_points) || !data.risk_level) return null
    return data as ResearchFindings
  } catch {
    return null
  }
}

// Deterministic, clearly-labeled fallback used when Bedrock is unreachable —
// grounded in the actual documentType/context passed in, not fabricated
// specifics. Callers must show source==="synthetic-demo" visibly in the UI.
function syntheticFindings(documentType: string, context: string): ResearchFindings {
  const type = documentType || "trade finance document"
  return {
    key_points: [
      `${type} received for structural review — field-level content was not independently verified by an AI model in this run.`,
      "Demo checklist: confirm Bill of Lading, Letter of Credit, and Invoice amounts reconcile before settlement.",
      "Demo checklist: confirm consignee name matches exactly across Bill of Lading and Letter of Credit.",
      context ? `Context noted for this case: "${context.slice(0, 160)}"` : "No additional case context was provided.",
    ],
    risk_level: "MEDIUM",
    confidence: "low (synthetic fallback — not a real model assessment)",
    regulatory_flags: [
      "FEMA cross-border documentation — not independently checked in this run",
      "AML screening — not independently checked in this run",
      "Sanctions/country routing — not independently checked in this run",
    ],
    recommendation: "Bedrock was unreachable for this request. Treat this as a placeholder checklist, not a real finding — route to a human officer for the actual review.",
  }
}

export async function runResearchAgent(query: string, context: string, documentType: string): Promise<ResearchResult> {
  const start = Date.now()
  try {
    const prompt = `Query: ${query}\nContext: ${context ?? "none provided"}\nDocument type: ${documentType ?? "unspecified"}\n\nProduce the research finding.`
    const text = await callBedrock(prompt, SYSTEM_PROMPT)
    const parsed = parseFindings(text)
    if (!parsed) throw new Error("Bedrock response was not valid structured JSON")
    return { findings: parsed, model: BEDROCK_MODEL, source: "bedrock", processing_time_ms: Date.now() - start }
  } catch (err) {
    console.error("[research-agent] Bedrock call failed, using synthetic fallback:", err)
    return {
      findings: syntheticFindings(documentType, context),
      model: "none",
      source: "synthetic-demo",
      processing_time_ms: Date.now() - start,
    }
  }
}
