"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Laptop, Smartphone, Server, Wifi, AlertCircle, CheckCircle2, Clock, PlusCircle } from "lucide-react"
import { getDevices } from "@/lib/device-actions"
import type { Device, DeviceStatus } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

interface DeviceListProps {
  devices?: Device[]
}

export default function DeviceList({ devices: propDevices }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(!propDevices)
  const { user } = useAuth()

  useEffect(() => {
    // If devices are provided as props, use them
    if (propDevices) {
      setDevices(propDevices)
      setIsLoading(false)
      return
    }

    // Otherwise, fetch devices
    const loadDevices = async () => {
      try {
        const deviceData = await getDevices(user?.id)
        setDevices(deviceData)
      } catch (error) {
        console.error("Failed to load devices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [user?.id, propDevices])

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
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

  const getStatusBadge = (status: DeviceStatus) => {
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted"></CardHeader>
            <CardContent className="h-20 mt-4 space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardContent>
            <CardFooter className="h-10 bg-muted mt-2"></CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardTitle className="mb-2">No devices found</CardTitle>
        <CardDescription className="mb-4">
          Add your first device to start monitoring and running diagnostics.
        </CardDescription>
        <Link href="/add-device">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {devices.map((device) => (
        <Card key={device.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center">
              {getDeviceIcon(device.type)}
              <CardTitle className="ml-2 text-xl">{device.name}</CardTitle>
            </div>
            {getStatusBadge(device.status)}
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mt-2">
              <p>IP: {device.ipAddress}</p>
              <p>Last Scan: {device.lastScan ? new Date(device.lastScan).toLocaleString() : "Never"}</p>
              {device.assignedTo && <p>Assigned to: {device.assignedTo.name}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`/devices/${device.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

