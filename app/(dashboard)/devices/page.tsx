"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DeviceList from "@/components/device-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, Laptop, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { getDevices } from "@/lib/device-actions"
import type { Device } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import EmployeeFilter from "@/components/employee-filter"

export default function DevicesPage() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoading(true)
        const deviceData = await getDevices(user?.id)
        setDevices(deviceData)
      } catch (error) {
        console.error("Failed to load devices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [user?.id])

  const handleFilterChange = (filteredDevices: Device[]) => {
    if (filteredDevices.length === 0) {
      setFilteredDevices(null) // Reset to show all devices
    } else {
      setFilteredDevices(filteredDevices)
    }
  }

  // Calculate stats
  const allDevices = filteredDevices || devices
  const healthyCount = allDevices.filter((d) => d.status === "healthy").length
  const warningCount = allDevices.filter((d) => d.status === "warning" || d.status === "error").length

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground mt-1">Manage all your registered devices</p>
        </div>
        <Link href="/add-device">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{allDevices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredDevices ? "Filtered devices" : "Across all categories"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{healthyCount}</div>
                <p className="text-xs text-muted-foreground">Devices with no issues</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attention Needed</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{warningCount}</div>
                <p className="text-xs text-muted-foreground">Devices with warnings or errors</p>
              </>
            )}
          </CardContent>
        </Card>

        <EmployeeFilter onFilterChange={handleFilterChange} isLoading={isLoading} setIsLoading={setIsLoading} />
      </div>

      {filteredDevices ? <DeviceList devices={filteredDevices} /> : <DeviceList />}
    </div>
  )
}

