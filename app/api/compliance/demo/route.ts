import { NextResponse } from "next/server"
import { generateCleanCase, generateHighRiskCase, generateMediumRiskCase } from "@/lib/data/synthetic"

export async function GET() {
  const cases = [generateCleanCase(), generateMediumRiskCase(), generateHighRiskCase()]
  return NextResponse.json(cases)
}