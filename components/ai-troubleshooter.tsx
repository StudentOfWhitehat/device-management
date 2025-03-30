"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Bot, CheckCircle2, XCircle, AlertTriangle, Zap, Terminal } from "lucide-react"
import { runAITroubleshooting, applyAutomatedFix } from "@/lib/device-actions"
import type { AITroubleshootingResult } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface AITroubleshooterProps {
  deviceId: string
}

export default function AITroubleshooter({ deviceId }: AITroubleshooterProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AITroubleshootingResult | null>(null)
  const [applyingFix, setApplyingFix] = useState<string | null>(null)
  const [fixResults, setFixResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const { toast } = useToast()

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setProgress(0)
    setResult(null)
    setFixResults({})

    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + Math.floor(Math.random() * 10) + 1
      })
    }, 300)

    try {
      const aiResult = await runAITroubleshooting(deviceId)
      setResult(aiResult)
      setProgress(100)
    } catch (error) {
      console.error("AI troubleshooting failed:", error)
      toast({
        title: "Analysis Failed",
        description: "Failed to complete AI analysis. Please try again.",
        variant: "destructive",
      })
    } finally {
      clearInterval(interval)
      setIsAnalyzing(false)
    }
  }

  const handleApplyFix = async (fixName: string) => {
    setApplyingFix(fixName)

    try {
      const result = await applyAutomatedFix(deviceId, fixName)
      setFixResults((prev) => ({
        ...prev,
        [fixName]: result,
      }))

      toast({
        title: result.success ? "Fix Applied" : "Fix Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Failed to apply fix:", error)
      setFixResults((prev) => ({
        ...prev,
        [fixName]: {
          success: false,
          message: "An unexpected error occurred. Please try again.",
        },
      }))

      toast({
        title: "Fix Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setApplyingFix(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI-Powered Troubleshooter
        </CardTitle>
        <CardDescription>Let our AI analyze your device and suggest fixes for common issues</CardDescription>
      </CardHeader>
      <CardContent>
        {!isAnalyzing && !result && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">AI Troubleshooter</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Our AI will analyze your device's logs, diagnostics, and performance metrics to identify issues and
              suggest fixes.
            </p>
            <Button onClick={runAnalysis}>Start AI Analysis</Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Analyzing Device</h3>
              <span className="text-sm">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Collecting system logs...
              </p>
              <p className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Analyzing diagnostic results...
              </p>
              <p className="flex items-center">
                {progress > 50 ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Identifying potential issues...
              </p>
              <p className="flex items-center">
                {progress > 75 ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Generating recommendations...
              </p>
              <p className="flex items-center">
                {progress === 100 ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Preparing automated fixes...
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertTitle>AI Analysis</AlertTitle>
              <AlertDescription>{result.analysis}</AlertDescription>
            </Alert>

            <div>
              <h3 className="text-sm font-medium mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-3">Available Automated Fixes</h3>
              <div className="space-y-3">
                {result.automatedFixes.map((fix) => {
                  const fixResult = fixResults[fix.name]

                  return (
                    <div key={fix.name} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">{fix.name}</h4>
                        </div>
                        {fixResult ? (
                          <Badge className={fixResult.success ? "bg-green-500" : "bg-red-500"}>
                            {fixResult.success ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" /> Failed
                              </>
                            )}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyFix(fix.name)}
                            disabled={applyingFix === fix.name}
                          >
                            {applyingFix === fix.name ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <Terminal className="h-3 w-3 mr-1" />
                                Apply Fix
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{fix.description}</p>
                      {fixResult && (
                        <p className={`text-sm mt-2 ${fixResult.success ? "text-green-600" : "text-red-600"}`}>
                          {fixResult.message}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {result && (
        <CardFooter>
          <Button variant="outline" onClick={runAnalysis} className="w-full">
            Run New Analysis
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

