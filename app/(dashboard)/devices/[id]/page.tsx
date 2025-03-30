"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Laptop,
  Smartphone,
  Server,
  Wifi,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { getDeviceById, deleteDevice, runDiagnostic, scanDevice } from "@/lib/simplified-actions"
import { useToast } from "@/hooks/use-toast"
import SimplifiedMonitor from "@/components/simplified-monitor"

export default function DeviceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [device, setDevice] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [scans, setScans] = useState<any[]>([])

  useEffect(() => {
    const loadDevice = async () => {
      try {
        setIsLoading(true)
        const deviceData = await getDeviceById(params.id)
        setDevice(deviceData)
        // Initialize with empty arrays
        setDiagnostics([])
        setScans([])
      } catch (error) {
        console.error("Failed to load device:", error)
        toast({
          title: "Error",
          description: "Failed to load device details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDevice()
  }, [params.id, toast])

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this device?")) {
      setIsDeleting(true)
      try {
        await deleteDevice(params.id)
        toast({
          title: "Device Deleted",
          description: "The device has been successfully deleted",
        })
        router.push("/dashboard")
      } catch (error) {
        console.error("Failed to delete device:", error)
        toast({
          title: "Error",
          description: "Failed to delete device",
          variant: "destructive",
        })
        setIsDeleting(false)
      }
    }
  }

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true)
    try {
      const result = await runDiagnostic(params.id)
      setDiagnostics((prev) => [...prev, result])
      setActiveTab("diagnostics")
      toast({
        title: "Diagnostic Complete",
        description: `Health score: ${result.healthScore}%`,
      })
      // Update device status
      setDevice((prev: any) => ({
        ...prev,
        status: result.status === "passed" ? "healthy" : "warning",
      }))
    } catch (error) {
      console.error("Failed to run diagnostic:", error)
      toast({
        title: "Error",
        description: "Failed to run diagnostic",
        variant: "destructive",
      })
    } finally {
      setIsRunningDiagnostic(false)
    }
  }

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const result = await scanDevice(params.id)
      setScans((prev) => [...prev, result])
      setActiveTab("scans")
      toast({
        title: "Scan Complete",
        description: `Found ${result.issues.length} issues`,
      })
      // Update device status
      setDevice((prev: any) => ({
        ...prev,
        status: result.status,
        lastScan: new Date().toISOString(),
      }))
    } catch (error) {
      console.error("Failed to scan device:", error)
      toast({
        title: "Error",
        description: "Failed to scan device",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "laptop":
        return <Laptop className="h-6 w-6" />
      case "smartphone":
        return <Smartphone className="h-6 w-6" />
      case "server":
        return <Server className="h-6 w-6" />
      case "network":
        return <Wifi className="h-6 w-6" />
      default:
        return <Laptop className="h-6 w-6" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Healthy
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Warning
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Error
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" /> Pending
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!device) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-8 text-center">
          <CardTitle className="mb-2">Device not found</CardTitle>
          <CardDescription className="mb-4">
            The device you are looking for does not exist or has been removed.
          </CardDescription>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          {getDeviceIcon(device.type)}
          <h1 className="text-3xl font-bold tracking-tight ml-2">{device.name}</h1>
          <div className="ml-4">{getStatusBadge(device.status)}</div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScan} disabled={isScanning}>
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Scan Device
              </>
            )}
          </Button>

          <Button onClick={handleRunDiagnostic} disabled={isRunningDiagnostic}>
            {isRunningDiagnostic ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              "Run Diagnostic"
            )}
          </Button>

          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scans">Scans</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="text-sm capitalize">{device.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">IP Address</dt>
                    <dd className="text-sm">{device.ip_address || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">MAC Address</dt>
                    <dd className="text-sm">{device.mac_address || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Last Scan</dt>
                    <dd className="text-sm">
                      {device.last_scan ? new Date(device.last_scan).toLocaleString() : "Never"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Manufacturer</dt>
                    <dd className="text-sm">{device.manufacturer || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Model</dt>
                    <dd className="text-sm">{device.model || "N/A"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Current Status</h3>
                    <div className="mt-1">{getStatusBadge(device.status)}</div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">Recent Activity</h3>
                    <ul className="mt-2 space-y-2">
                      {scans.length > 0 ? (
                        scans.slice(0, 3).map((scan, index) => (
                          <li key={index} className="text-sm flex justify-between">
                            <span>Scan completed</span>
                            <span className="text-muted-foreground">{new Date(scan.timestamp).toLocaleString()}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-muted-foreground">No recent scans</li>
                      )}

                      {diagnostics.length > 0 ? (
                        diagnostics.slice(0, 3).map((diagnostic, index) => (
                          <li key={index} className="text-sm flex justify-between">
                            <span>Diagnostic test run</span>
                            <span className="text-muted-foreground">
                              {new Date(diagnostic.timestamp).toLocaleString()}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-muted-foreground">No recent diagnostics</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="w-1/2" onClick={() => setActiveTab("scans")}>
                    View Scans
                  </Button>
                  <Button variant="outline" className="w-1/2" onClick={() => setActiveTab("diagnostics")}>
                    View Diagnostics
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scans">
          {scans.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Scan History</CardTitle>
                <CardDescription>No scans have been performed yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Run a scan to check for software errors and issues.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Scan History</CardTitle>
                <CardDescription>History of all device scans and detected issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {scans
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((scan, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-medium">Scan #{scans.length - index}</h3>
                            <p className="text-sm text-muted-foreground">{new Date(scan.timestamp).toLocaleString()}</p>
                          </div>
                          {getStatusBadge(scan.status)}
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Issues Found ({scan.issues.length})</h4>
                          {scan.issues.length > 0 ? (
                            <ul className="space-y-2">
                              {scan.issues.map((issue: any, i: number) => (
                                <li key={i} className="text-sm bg-muted p-2 rounded">
                                  <div className="flex items-start gap-2">
                                    {issue.severity === "high" ? (
                                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                    ) : issue.severity === "medium" ? (
                                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                                    )}
                                    <div>
                                      <p className="font-medium">{issue.name}</p>
                                      <p className="text-muted-foreground">{issue.description}</p>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No issues detected</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="diagnostics">
          {diagnostics.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic History</CardTitle>
                <CardDescription>No diagnostic tests have been run yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Run a diagnostic test to check the health of your device.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic History</CardTitle>
                <CardDescription>History of all diagnostic tests run on this device</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {diagnostics
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((diagnostic, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-medium">Diagnostic #{diagnostics.length - index}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(diagnostic.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {getStatusBadge(diagnostic.status)}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="text-sm font-medium">Overall Health</h4>
                              <span className="text-sm">{diagnostic.healthScore}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${diagnostic.healthScore}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Test Results</h4>
                            <div className="space-y-2">
                              {diagnostic.tests.map((test: any, i: number) => (
                                <div key={i} className="bg-muted p-3 rounded-md">
                                  <div className="flex justify-between items-center">
                                    <h5 className="font-medium">{test.name}</h5>
                                    {getStatusBadge(test.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                                  {test.details && (
                                    <div className="mt-2 text-sm bg-background p-2 rounded border">
                                      <pre className="whitespace-pre-wrap">{test.details}</pre>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <SimplifiedMonitor deviceId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

