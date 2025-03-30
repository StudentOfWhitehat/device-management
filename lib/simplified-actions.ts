"use server"

import { createServiceSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Get all devices
export async function getDevices() {
  try {
    const supabase = createServiceSupabaseClient()

    const { data, error } = await supabase.from("devices").select("*")

    if (error) {
      console.error("Error fetching devices:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getDevices:", error)
    return []
  }
}

// Get a single device by ID
export async function getDeviceById(id: string) {
  try {
    const supabase = createServiceSupabaseClient()

    const { data, error } = await supabase.from("devices").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching device:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getDeviceById:", error)
    return null
  }
}

// Add a new device
export async function addDevice(deviceData: {
  name: string
  type: string
  ipAddress?: string
  macAddress?: string
  manufacturer?: string
  model?: string
}) {
  try {
    const supabase = createServiceSupabaseClient()

    const { data, error } = await supabase
      .from("devices")
      .insert({
        name: deviceData.name,
        type: deviceData.type,
        ip_address: deviceData.ipAddress,
        mac_address: deviceData.macAddress,
        manufacturer: deviceData.manufacturer,
        model: deviceData.model,
        status: "healthy", // Default to healthy for simplicity
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding device:", error)
      throw new Error("Failed to add device")
    }

    revalidatePath("/devices")
    return data
  } catch (error) {
    console.error("Error in addDevice:", error)
    throw error
  }
}

// Delete a device
export async function deleteDevice(id: string) {
  try {
    const supabase = createServiceSupabaseClient()

    const { error } = await supabase.from("devices").delete().eq("id", id)

    if (error) {
      console.error("Error deleting device:", error)
      throw new Error("Failed to delete device")
    }

    revalidatePath("/devices")
    return true
  } catch (error) {
    console.error("Error in deleteDevice:", error)
    throw error
  }
}

// Run a scan on a device (simplified)
export async function scanDevice(id: string) {
  try {
    // Generate random scan results
    const status = Math.random() > 0.7 ? "warning" : "healthy"
    const issues = []

    if (status === "warning") {
      issues.push({
        name: "High CPU Usage",
        description: "CPU usage is above 90% for extended periods",
        severity: "medium",
      })
    }

    // Update device status
    const supabase = createServiceSupabaseClient()

    await supabase
      .from("devices")
      .update({
        status,
        last_scan: new Date().toISOString(),
      })
      .eq("id", id)

    revalidatePath(`/devices/${id}`)

    return {
      id: crypto.randomUUID(),
      deviceId: id,
      timestamp: new Date().toISOString(),
      status,
      issues,
    }
  } catch (error) {
    console.error("Error in scanDevice:", error)
    throw error
  }
}

// Run a diagnostic on a device (simplified)
export async function runDiagnostic(id: string) {
  try {
    // Generate random diagnostic results
    const status = Math.random() > 0.7 ? "warning" : "passed"
    const healthScore = Math.floor(Math.random() * 30) + 70 // 70-100

    const tests = [
      {
        name: "CPU Load Test",
        description: "Tests CPU under load",
        status: Math.random() > 0.2 ? "passed" : "warning",
        details: "CPU load normal at 15%",
      },
      {
        name: "Memory Test",
        description: "Tests memory allocation and access",
        status: Math.random() > 0.2 ? "passed" : "warning",
        details: "Memory usage at 40%, no leaks detected",
      },
      {
        name: "Disk I/O Test",
        description: "Tests disk read/write speeds",
        status: Math.random() > 0.2 ? "passed" : "warning",
        details: "Read: 250MB/s, Write: 180MB/s",
      },
    ]

    // Update device status
    const supabase = createServiceSupabaseClient()

    await supabase
      .from("devices")
      .update({
        status: status === "passed" ? "healthy" : "warning",
      })
      .eq("id", id)

    revalidatePath(`/devices/${id}`)

    return {
      id: crypto.randomUUID(),
      deviceId: id,
      timestamp: new Date().toISOString(),
      status,
      healthScore,
      tests,
    }
  } catch (error) {
    console.error("Error in runDiagnostic:", error)
    throw error
  }
}

