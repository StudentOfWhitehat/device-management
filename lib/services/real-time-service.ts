"use server"

import { createServiceSupabaseClient } from "@/lib/supabase/server"
import type { PerformanceMetrics } from "@/lib/types"

// Function to publish performance metrics to Supabase Realtime
export async function publishPerformanceMetrics(deviceId: string, metrics: PerformanceMetrics) {
  const supabase = createServiceSupabaseClient()

  try {
    // Insert metrics into the database
    // This will automatically trigger Supabase Realtime for subscribers
    const { data, error } = await supabase
      .from("performance_metrics")
      .insert({
        device_id: deviceId,
        cpu: metrics.cpu,
        memory: metrics.memory,
        disk: metrics.disk,
        network: metrics.network,
        timestamp: metrics.timestamp || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error publishing metrics:", error)
      throw new Error("Failed to publish metrics")
    }

    return data
  } catch (error) {
    console.error("Error in publishPerformanceMetrics:", error)
    throw error
  }
}

// Function to simulate device metrics for testing
export async function simulateDeviceMetrics(deviceId: string) {
  try {
    const metrics: PerformanceMetrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100,
      timestamp: new Date().toISOString(),
    }

    await publishPerformanceMetrics(deviceId, metrics)
    return metrics
  } catch (error) {
    console.error("Error simulating metrics:", error)
    throw error
  }
}

