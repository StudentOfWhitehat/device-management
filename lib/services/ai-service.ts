"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function generateAIAnalysis(issueName: string, issueDescription: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are an AI assistant specialized in diagnosing device issues. Provide a brief, actionable suggestion for fixing this issue: ${issueName} - ${issueDescription}`,
      temperature: 0.3,
      maxTokens: 100,
    })

    return text
  } catch (error) {
    console.error("AI analysis failed:", error)
    return "Consider checking system logs and consulting technical documentation for this issue."
  }
}

export async function analyzeDeviceIssues(deviceData: any) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are an AI assistant specialized in diagnosing device issues. Analyze the provided device data and suggest solutions: ${JSON.stringify(deviceData)}`,
      temperature: 0.3,
      maxTokens: 500,
    })

    return {
      analysis: text,
      recommendations: extractRecommendations(text),
    }
  } catch (error) {
    console.error("AI analysis failed:", error)
    return {
      analysis: "AI analysis failed. Please try again later.",
      recommendations: [],
    }
  }
}

function extractRecommendations(analysisText: string) {
  // Simple extraction - in a real system, you'd use more robust parsing
  const recommendations = analysisText
    .split("\n")
    .filter((line) => line.includes("- ") || line.includes("* "))
    .map((line) => line.replace(/^[*-]\s+/, "").trim())

  return recommendations.length > 0 ? recommendations : ["No specific recommendations available"]
}

