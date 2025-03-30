"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Cpu, MemoryStickIcon as Memory, HardDrive, Wifi, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { getDevicePerformanceMetrics } from "@/lib/actions/device-actions"
import type { PerformanceMetrics } from "@/lib/types"
import { createBrowserClient } from "@/lib/supabase/client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { simulateDeviceMetrics } from "@/lib/services/real-time-service"

interface RealTimeMonitorProps {
  deviceId: string
}

export default function RealTimeMonitor({ deviceId }: RealTimeMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week">("hour")
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient()

  const loadMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getDevicePerformanceMetrics(deviceId, timeRange)
      setMetrics(data)
    } catch (err) {
      console.error("Failed to load metrics:", err)
      setError("Failed to load performance metrics. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshMetrics = async () => {
    setIsRefreshing(true)
    try {
      // Generate a new metric
      await simulateDeviceMetrics(deviceId)
      // No need to fetch metrics here as the subscription will update the state
    } catch (err) {
      console.error("Failed to refresh metrics:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadMetrics()

    // Set up real-time subscription
    const channel = supabase
      .channel(`device-metrics-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "performance_metrics",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          // Add new metric to the state
          setMetrics((current) => {
            const newMetric: PerformanceMetrics = {
              cpu: payload.new.cpu || 0,
              memory: payload.new.memory || 0,
              disk: payload.new.disk || 0,
              network: payload.new.network || 0,
              timestamp: payload.new.timestamp,
            }

            const newMetrics = [...current, newMetric]

            // Keep only the last 60 data points for hour view
            if (timeRange === "hour" && newMetrics.length > 60) {
              return newMetrics.slice(-60)
            }

            // Keep only the last 24 data points for day view
            if (timeRange === "day" && newMetrics.length > 24) {
              return newMetrics.slice(-24)
            }

            // Keep only the last 7 data points for week view
            if (timeRange === "week" && newMetrics.length > 7) {
              return newMetrics.slice(-7)
            }

            return newMetrics
          })
        },
      )
      .subscribe()

    // Set up interval to simulate real-time updates
    const interval = setInterval(() => {
      simulateDeviceMetrics(deviceId).catch(console.error)
    }, 10000) // Every 10 seconds

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [deviceId, timeRange, supabase])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    if (timeRange === "hour") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (timeRange === "day") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { weekday: "short" })
    }
  }

  const getStatusBadge = (value: number, type: "cpu" | "memory" | "disk" | "network") => {
    let threshold = { warning: 70, critical: 90 }

    if (type === "disk") {
      threshold = { warning: 80, critical: 95 }
    } else if (type === "network") {
      // For network, high values are good
      return <Badge className="bg-green-500">Good</Badge>
    }

    if (value >= threshold.critical) {
      return <Badge className="bg-red-500">Critical</Badge>
    } else if (value >= threshold.warning) {
      return <Badge className="bg-yellow-500">Warning</Badge>
    } else {
      return <Badge className="bg-green-500">Normal</Badge>
    }
  }

  const getCurrentValue = (type: "cpu" | "memory" | "disk" | "network") => {
    if (metrics.length === 0) return 0
    return metrics[metrics.length - 1][type]
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Real-Time Performance</CardTitle>
            <CardDescription>Monitor CPU, memory, disk, and network performance</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshMetrics} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={loadMetrics} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Cpu className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">CPU</span>
                  </div>
                  {getStatusBadge(getCurrentValue("cpu"), "cpu")}
                </div>
                <div className="text-2xl font-bold">{getCurrentValue("cpu").toFixed(1)}%</div>
              </div>

              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Memory className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Memory</span>
                  </div>
                  {getStatusBadge(getCurrentValue("memory"), "memory")}
                </div>
                <div className="text-2xl font-bold">{getCurrentValue("memory").toFixed(1)}%</div>
              </div>

              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <HardDrive className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Disk</span>
                  </div>
                  {getStatusBadge(getCurrentValue("disk"), "disk")}
                </div>
                <div className="text-2xl font-bold">{getCurrentValue("disk").toFixed(1)}%</div>
              </div>

              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Wifi className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Network</span>
                  </div>
                  {getStatusBadge(getCurrentValue("network"), "network")}
                </div>
                <div className="text-2xl font-bold">{getCurrentValue("network").toFixed(1)} Mbps</div>
              </div>
            </div>

            <Tabs defaultValue="hour" onValueChange={(value) => setTimeRange(value as any)}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="hour">Hour</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="hour" className="mt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.map((m) => ({
                        ...m,
                        formattedTime: formatTimestamp(m.timestamp),
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedTime" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                      <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                      <Line type="monotone" dataKey="disk" stroke="#ffc658" name="Disk %" />
                      <Line type="monotone" dataKey="network" stroke="#ff8042" name="Network Mbps" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="day" className="mt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.map((m) => ({
                        ...m,
                        formattedTime: formatTimestamp(m.timestamp),
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedTime" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                      <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                      <Line type="monotone" dataKey="disk" stroke="#ffc658" name="Disk %" />
                      <Line type="monotone" dataKey="network" stroke="#ff8042" name="Network Mbps" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="week" className="mt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.map((m) => ({
                        ...m,
                        formattedTime: formatTimestamp(m.timestamp),
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedTime" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                      <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                      <Line type="monotone" dataKey="disk" stroke="#ffc658" name="Disk %" />
                      <Line type="monotone" dataKey="network" stroke="#ff8042" name="Network Mbps" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Data updates in real-time via Supabase. Last updated: {new Date().toLocaleTimeString()}
      </CardFooter>
    </Card>
  )
}

