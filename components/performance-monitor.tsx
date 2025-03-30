"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Cpu, MemoryStickIcon as Memory, HardDrive, Wifi, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { useRealtimePerformanceMetrics, simulateDeviceMetrics } from "@/lib/realtime"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PerformanceMonitorProps {
  deviceId: string
}

export default function PerformanceMonitor({ deviceId }: PerformanceMonitorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week">("hour")
  const [error, setError] = useState<string | null>(null)
  const { metrics, isSubscribed } = useRealtimePerformanceMetrics(deviceId)

  // Simulate real device metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      simulateDeviceMetrics(deviceId)
    }, 5000)

    return () => clearInterval(interval)
  }, [deviceId])

  // Set loading state based on subscription
  useEffect(() => {
    if (isSubscribed) {
      setIsLoading(false)
    }
  }, [isSubscribed])

  const refreshMetrics = async () => {
    setIsRefreshing(true)
    try {
      await simulateDeviceMetrics(deviceId)
    } catch (err) {
      console.error("Failed to refresh metrics:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

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
            <Button variant="outline" size="sm" onClick={refreshMetrics} className="mt-4">
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
                <ChartContainer
                  config={{
                    cpu: {
                      label: "CPU",
                      color: "hsl(var(--chart-1))",
                    },
                    memory: {
                      label: "Memory",
                      color: "hsl(var(--chart-2))",
                    },
                    disk: {
                      label: "Disk",
                      color: "hsl(var(--chart-3))",
                    },
                    network: {
                      label: "Network",
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.map((m) => ({
                        ...m,
                        timestamp: formatTimestamp(m.timestamp),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="var(--color-cpu)" name="CPU %" />
                      <Line type="monotone" dataKey="memory" stroke="var(--color-memory)" name="Memory %" />
                      <Line type="monotone" dataKey="disk" stroke="var(--color-disk)" name="Disk %" />
                      <Line type="monotone" dataKey="network" stroke="var(--color-network)" name="Network Mbps" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="day" className="mt-4">
                <ChartContainer
                  config={{
                    cpu: {
                      label: "CPU",
                      color: "hsl(var(--chart-1))",
                    },
                    memory: {
                      label: "Memory",
                      color: "hsl(var(--chart-2))",
                    },
                    disk: {
                      label: "Disk",
                      color: "hsl(var(--chart-3))",
                    },
                    network: {
                      label: "Network",
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.map((m) => ({
                        ...m,
                        timestamp: formatTimestamp(m.timestamp),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="var(--color-cpu)" name="CPU %" />
                      <Line type="monotone" dataKey="memory" stroke="var(--color-memory)" name="Memory %" />
                      <Line type="monotone" dataKey="disk" stroke="var(--color-disk)" name="Disk %" />
                      <Line type="monotone" dataKey="network" stroke="var(--color-network)" name="Network Mbps" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="week" className="mt-4">
                <ChartContainer
                  config={{
                    cpu: {
                      label: "CPU",
                      color: "hsl(var(--chart-1))",
                    },
                    memory: {
                      label: "Memory",
                      color: "hsl(var(--chart-2))",
                    },
                    disk: {
                      label: "Disk",
                      color: "hsl(var(--chart-3))",
                    },
                    network: {
                      label: "Network",
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.map((m) => ({
                        ...m,
                        timestamp: formatTimestamp(m.timestamp),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="var(--color-cpu)" name="CPU %" />
                      <Line type="monotone" dataKey="memory" stroke="var(--color-memory)" name="Memory %" />
                      <Line type="monotone" dataKey="disk" stroke="var(--color-disk)" name="Disk %" />
                      <Line type="monotone" dataKey="network" stroke="var(--color-network)" name="Network Mbps" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Data updates automatically every 5 seconds. Last updated: {new Date().toLocaleTimeString()}
      </CardFooter>
    </Card>
  )
}

