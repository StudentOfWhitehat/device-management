import { NextResponse } from "next/server"
import { collectPerformanceMetrics } from "@/lib/services/performance-monitor"
import { createServiceSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { deviceId: string } }) {
  const deviceId = params.deviceId

  try {
    const supabase = createServiceSupabaseClient()

    // Get device details
    const { data: device, error } = await supabase.from("devices").select("*").eq("id", deviceId).single()

    if (error || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Collect metrics
    const metrics = await collectPerformanceMetrics({
      deviceId: device.id,
      ipAddress: device.ip_address || "",
      type: device.type,
    })

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error(`Error collecting metrics for device ${deviceId}:`, error)
    return NextResponse.json({ error: "Failed to collect metrics" }, { status: 500 })
  }
}

