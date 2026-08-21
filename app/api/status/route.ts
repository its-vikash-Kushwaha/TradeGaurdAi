import { NextResponse } from "next/server"
import { testBedrockConnection } from "@/lib/ai/bedrock"
import { checkDynamoDBHealth, isUsingMemoryFallback } from "@/lib/aws/audit"

export async function GET() {
  const [bedrockResult, dynamodbHealthy] = await Promise.all([
    testBedrockConnection(),
    checkDynamoDBHealth()
  ])

  return NextResponse.json({
    bedrock: bedrockResult.working,
    dynamodb: dynamodbHealthy,
    auditMode: isUsingMemoryFallback() ? "memory" : "dynamodb",
    region: process.env.AWS_REGION || "ap-south-1",
    timestamp: new Date().toISOString(),
    // Static capability flags describing what this build implements, NOT a
    // live health check of each — only bedrock/dynamodb above are actually
    // probed. Do not read this block as "all systems verified working."
    features: {
      sequentialAgents: true,
      hitlApproval: true,
      complianceCheck: true,
      auditTrail: true,
      regimeDetection: true,
      behavioralIntelligence: true
    }
  })
}
