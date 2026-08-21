import { NextResponse } from "next/server"
import { testBedrockConnection } from "@/lib/ai/bedrock"

export async function GET() {
  const result = await testBedrockConnection()
  return NextResponse.json(result)
}
