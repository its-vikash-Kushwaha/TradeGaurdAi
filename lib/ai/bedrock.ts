import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "ap-south-1" })
const MODEL_ID = "anthropic.claude-3-7-sonnet-20250219-v1:0"

export async function callBedrock(prompt: string, systemPrompt?: string): Promise<string> {
  const body: any = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }]
  }
  if (systemPrompt) body.system = systemPrompt
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-7-sonnet-20250219-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body)
  })
  const response = await client.send(command)
  const result = JSON.parse(new TextDecoder().decode(response.body))
  return result.content[0].text
}

// Note: the task brief that requested this called a `callBedrockClaude`
// function returning `{ text, model }` — that function doesn't exist in this
// codebase. This wraps the real `callBedrock` (which returns a plain
// string) instead, to avoid inventing an API surface nothing else uses.
export async function testBedrockConnection(): Promise<{
  working: boolean
  model: string
  error?: string
}> {
  try {
    const text = await callBedrock(
      "Say exactly: BEDROCK_CONNECTED",
      "You are a test agent. Follow instructions exactly."
    )
    return {
      working: text.includes("BEDROCK_CONNECTED"),
      model: MODEL_ID
    }
  } catch (error) {
    return {
      working: false,
      model: "none",
      error: String(error)
    }
  }
}