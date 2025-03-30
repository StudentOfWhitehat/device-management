"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import { getDevices } from "@/lib/device-actions"
import type { Device, DiagnosticResult } from "@/lib/types"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

export default function DiagnosticsPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [allDiagnostics, setAllDiagnostics] = useState<(DiagnosticResult & { deviceName: string })[]>([])

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const deviceData = await getDevices()
        setDevices(deviceData)

        // Collect all diagnostics from all devices
        const diagnostics: (DiagnosticResult & { deviceName: string })[] = []
        deviceData.forEach((device) => {
          if (device.diagnostics && device.diagnostics.length > 0) {
            device.diagnostics.forEach((diagnostic) => {
              diagnostics.push({
                ...diagnostic,
                deviceName: device.name,
              })
            })
          }
        })

        // Sort by timestamp (newest first)
        diagnostics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setAllDiagnostics(diagnostics)
      } catch (error) {
        console.error("Failed to load devices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Passed
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Warning
          </Badge>
        )
      case "running":
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" /> Running
          </Badge>
        )
      default:
        return (
          <Badge>
            <Clock className="h-3 w-3 mr-1" /> Unknown
          </Badge>
        )
    }
  }

  const getAverageHealthScore = () => {
    if (allDiagnostics.length === 0) return 0
    const total = allDiagnostics.reduce((sum, diag) => sum + diag.healthScore, 0)
    return Math.round(total / allDiagnostics.length)
  }

  const healthScore = getAverageHealthScore()
  let healthStatus = "Excellent"
  if (healthScore < 60) healthStatus = "Critical"
  else if (healthScore < 80) healthStatus = "Moderate"
  else if (healthScore < 90) healthStatus = "Good"

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Diagnostics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus}</div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Health Score</span>
                <span className="font-semibold">{healthScore}%</span>
              </div>
              <Progress value={healthScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allDiagnostics.length}</div>
            <p className="text-xs text-muted-foreground">Across all devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allDiagnostics.filter((d) => d.status === "passed").length}</div>
            <p className="text-xs text-muted-foreground">Diagnostics with no issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allDiagnostics.filter((d) => d.status === "failed" || d.status === "warning").length}
            </div>
            <p className="text-xs text-muted-foreground">Diagnostics with warnings or failures</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Diagnostic Results</h2>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-14 bg-muted"></CardHeader>
              <CardContent className="h-20 mt-4 space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
              <CardFooter className="h-10 bg-muted mt-2"></CardFooter>
            </Card>
          ))}
        </div>
      ) : allDiagnostics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-center text-muted-foreground mb-4">No diagnostic tests have been run yet.</p>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Run diagnostics on your devices to see results here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {allDiagnostics.slice(0, 6).map((diagnostic, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{diagnostic.deviceName}</CardTitle>
                  <CardDescription>{new Date(diagnostic.timestamp).toLocaleString()}</CardDescription>
                </div>
                {getStatusBadge(diagnostic.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Health Score</span>
                      <span className="font-semibold">{diagnostic.healthScore}%</span>
                    </div>
                    <Progress value={diagnostic.healthScore} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {diagnostic.tests.filter((t) => t.status === "passed").length} tests passed,{" "}
                    {diagnostic.tests.filter((t) => t.status === "failed").length} failed,{" "}
                    {diagnostic.tests.filter((t) => t.status === "warning").length} warnings
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/devices/${diagnostic.deviceId}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {allDiagnostics.length > 6 && (
        <div className="flex justify-center mt-6">
          <Button variant="outline">View All Diagnostics</Button>
        </div>
      )}
    </div>
  )
}

