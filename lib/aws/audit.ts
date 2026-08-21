import { DynamoDBClient, PutItemCommand, QueryCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { v4 as uuidv4 } from "uuid"

// Table schema assumed: partition key "caseId", sort key "eventId"
const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" })
const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE || "tradeguard-audit-trail"

// Process-memory fallback used when DynamoDB isn't configured/reachable.
// Next.js compiles each route file into its own module graph, so a plain
// module-scoped Map is NOT reliably shared between e.g. app/api/compliance
// and app/api/compliance/[caseId] — confirmed broken in dev testing. Stashing
// it on globalThis (the same pattern Next.js recommends for Prisma-client
// singletons) makes it survive across route modules and HMR reloads within
// ONE process. This still will NOT work across separate serverless
// invocations in a real Vercel deployment — it is a local-dev-only safety
// net, not a substitute for the real table.
const globalForAudit = globalThis as unknown as { __tradeguardAuditMemory?: Map<string, any[]> }
const memoryAuditLog: Map<string, any[]> = globalForAudit.__tradeguardAuditMemory ?? new Map()
globalForAudit.__tradeguardAuditMemory = memoryAuditLog

export function isUsingMemoryFallback(): boolean {
  return !(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_DYNAMODB_TABLE
  )
}

export interface AgentAction {
  caseId: string
  agent: string
  action: string
  input: string
  output: string
  model: string
  riskLevel?: string
  userId?: string
  humanDecision?: string
  humanNotes?: string
}

function truncate(text: string, max = 500): string {
  return text.length > max ? text.slice(0, max) : text
}

export async function logAgentAction(data: AgentAction): Promise<string> {
  const eventId = uuidv4()
  const item = {
    caseId: data.caseId,
    eventId,
    agent: data.agent,
    action: data.action,
    input: truncate(data.input),
    output: truncate(data.output),
    model: data.model,
    riskLevel: data.riskLevel ?? "",
    userId: data.userId ?? "",
    humanDecision: data.humanDecision ?? "PENDING",
    humanNotes: data.humanNotes ?? "",
    status: "COMPLETED",
    timestamp: new Date().toISOString()
  }

  try {
    if (isUsingMemoryFallback()) throw new Error("AWS not configured")

    await client.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(item, { removeUndefinedValues: true })
      })
    )

    console.log(`[audit] logged event ${eventId} for case ${data.caseId}`)
    return eventId
  } catch (err) {
    console.error("[audit] logAgentAction failed, using in-memory fallback:", err)
    console.log("[Audit] Using in-memory fallback")
    const existing = memoryAuditLog.get(data.caseId) ?? []
    existing.push(item)
    memoryAuditLog.set(data.caseId, existing)
    return eventId
  }
}

export async function getAuditLog(caseId: string): Promise<Record<string, any>[]> {
  try {
    if (isUsingMemoryFallback()) throw new Error("AWS not configured")

    const result = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "caseId = :caseId",
        ExpressionAttributeValues: marshall({ ":caseId": caseId })
      })
    )

    const items = (result.Items ?? []).map((item) => unmarshall(item))
    if (items.length > 0) return items

    return memoryAuditLog.get(caseId) ?? []
  } catch (err) {
    console.error("[audit] getAuditLog failed, checking in-memory fallback:", err)
    return memoryAuditLog.get(caseId) ?? []
  }
}

// Lightweight health check: describes the table instead of writing/reading
// data, so it's safe to call from a status endpoint without side effects.
export async function checkDynamoDBHealth(): Promise<boolean> {
  if (isUsingMemoryFallback()) return false
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }))
    return true
  } catch (err) {
    console.error("[audit] checkDynamoDBHealth failed:", err)
    return false
  }
}

export async function logHumanDecision(
  caseId: string,
  decision: string,
  notes: string,
  userId: string
): Promise<string> {
  return logAgentAction({
    caseId,
    agent: "HumanOfficer",
    action: "human_decision",
    input: "Review of case",
    output: notes || decision,
    model: "human",
    humanDecision: decision,
    humanNotes: notes,
    userId
  })
}