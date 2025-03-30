"use server"

import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateAIAnalysis(deviceData: any) {
  try {
    // Extract relevant data for analysis
    const deviceInfo = {
      name: deviceData.name,
      type: deviceData.type,
      status: deviceData.status,
      scans: deviceData.scan_results?.map((scan: any) => ({
        status: scan.status,
        timestamp: scan.timestamp,
        issues: scan.issues,
      })),
      diagnostics: deviceData.diagnostic_results?.map((diag: any) => ({
        status: diag.status,
        healthScore: diag.health_score,
        timestamp: diag.timestamp,
        tests: diag.test_results,
      })),
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant specialized in diagnosing device issues. Analyze the provided device data and suggest solutions.",
        },
        {
          role: "user",
          content: `Analyze this device data and provide recommendations: ${JSON.stringify(deviceInfo)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const analysisText = response.choices[0].message.content || ""

    // Extract recommendations
    const recommendations = extractRecommendations(analysisText)

    return {
      analysis: analysisText,
      recommendations,
    }
  } catch (error) {
    console.error("AI analysis failed:", error)
    return {
      analysis: "AI analysis failed. Please try again later.",
      recommendations: ["Run a manual diagnostic to identify issues."],
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

