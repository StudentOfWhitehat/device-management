"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Cpu, MemoryStickIcon as Memory, HardDrive, Wifi, RefreshCw, Loader2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface SimplifiedMonitorProps {
  deviceId: string
}

export default function SimplifiedMonitor({ deviceId }: SimplifiedMonitorProps) {
  const [metrics, setMetrics] = useState({
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    disk: Math.random() * 100,
    network: Math.random() * 100,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const supabase = createBrowserClient()

  // Function to generate random metrics
  const generateRandomMetrics = () => {
    setIsLoading(true)

    // Simulate a network request
    setTimeout(() => {
      setMetrics({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100,
      })
      setLastUpdated(new Date())
      setIsLoading(false)
    }, 1000)
  }

  // Update metrics every 10 seconds
  useEffect(() => {
    const interval = setInterval(generateRandomMetrics, 10000)
    return () => clearInterval(interval)
  }, [])

  // Initial load
  useEffect(() => {
    generateRandomMetrics()
  }, [])

  const getStatusBadge = (value: number, type: string) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Device Performance</CardTitle>
            <CardDescription>Monitor CPU, memory, disk, and network performance</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={generateRandomMetrics} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Cpu className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                {getStatusBadge(metrics.cpu, "cpu")}
              </div>
              <div className="text-2xl font-bold">{metrics.cpu.toFixed(1)}%</div>
            </div>

            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Memory className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm font-medium">Memory</span>
                </div>
                {getStatusBadge(metrics.memory, "memory")}
              </div>
              <div className="text-2xl font-bold">{metrics.memory.toFixed(1)}%</div>
            </div>

            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm font-medium">Disk</span>
                </div>
                {getStatusBadge(metrics.disk, "disk")}
              </div>
              <div className="text-2xl font-bold">{metrics.disk.toFixed(1)}%</div>
            </div>

            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Wifi className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm font-medium">Network</span>
                </div>
                {getStatusBadge(metrics.network, "network")}
              </div>
              <div className="text-2xl font-bold">{metrics.network.toFixed(1)} Mbps</div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </CardFooter>
    </Card>
  )
}

