"use client"

import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Hook for subscribing to real-time performance metrics
export function useRealtimePerformanceMetrics(deviceId: string) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupSubscription = async () => {
      // First, get initial data
      const { data: initialData, error } = await supabase
        .from("performance_metrics")
        .select("*")
        .eq("device_id", deviceId)
        .order("timestamp", { ascending: false })
        .limit(60)

      if (!error && initialData) {
        setMetrics(initialData.reverse())
      }

      // Subscribe to real-time updates
      channel = supabase
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
            setMetrics((prev) => [...prev, payload.new].slice(-60)) // Keep last 60 data points
          },
        )
        .subscribe(() => {
          setIsSubscribed(true)
        })
    }

    setupSubscription()

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [deviceId])

  return { metrics, isSubscribed }
}

// Hook for subscribing to device status changes
export function useRealtimeDeviceStatus(deviceId: string) {
  const [status, setStatus] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupSubscription = async () => {
      // First, get initial status
      const { data, error } = await supabase.from("devices").select("status").eq("id", deviceId).single()

      if (!error && data) {
        setStatus(data.status)
      }

      // Subscribe to real-time updates
      channel = supabase
        .channel(`device-status-${deviceId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "devices",
            filter: `id=eq.${deviceId}`,
          },
          (payload) => {
            setStatus(payload.new.status)
          },
        )
        .subscribe(() => {
          setIsSubscribed(true)
        })
    }

    setupSubscription()

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [deviceId])

  return { status, isSubscribed }
}

// Function to simulate real device metrics
// In a real system, this would be replaced with actual device monitoring
export async function simulateDeviceMetrics(deviceId: string) {
  // Generate random metrics
  const metrics = {
    device_id: deviceId,
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    disk: Math.random() * 100,
    network: Math.random() * 100,
    timestamp: new Date().toISOString(),
  }

  // Insert into database
  const { error } = await supabase.from("performance_metrics").insert(metrics)

  if (error) {
    console.error("Error inserting metrics:", error)
    return false
  }

  return true
}

