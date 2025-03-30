import { createServiceSupabaseClient } from "@/lib/supabase/server"
import { collectPerformanceMetrics } from "@/lib/services/performance-monitor"
import { NextResponse } from "next/server"

// This endpoint will be called by a cron job to collect metrics for all devices
export async function GET() {
  try {
    const supabase = createServiceSupabaseClient()

    // Get all devices
    const { data: devices, error } = await supabase.from("devices").select("*")

    if (error) {
      console.error("Error fetching devices:", error)
      return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
    }

    // Collect metrics for each device
    const results = []

    for (const device of devices) {
      try {
        const metrics = await collectPerformanceMetrics({
          deviceId: device.id,
          ipAddress: device.ip_address || "",
          type: device.type,
        })

        results.push({
          deviceId: device.id,
          status: "success",
          metrics,
        })
      } catch (error) {
        console.error(`Error collecting metrics for device ${device.id}:`, error)
        results.push({
          deviceId: device.id,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in metrics collection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

