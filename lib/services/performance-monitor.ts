"use server"

import { createServiceSupabaseClient } from "@/lib/supabase/server"
import type { PerformanceMetrics } from "@/lib/types"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

interface MonitorOptions {
  deviceId: string
  ipAddress: string
  type: string
}

export async function collectPerformanceMetrics(options: MonitorOptions): Promise<PerformanceMetrics> {
  const { deviceId, ipAddress, type } = options

  try {
    // In a real implementation, this would collect actual metrics from the device
    // For now, we'll simulate metrics collection

    let cpuUsage = 0
    let memoryUsage = 0
    let diskUsage = 0
    let networkUsage = 0

    // For local server, we can use actual system metrics
    if (ipAddress === "localhost" || ipAddress === "127.0.0.1") {
      // CPU usage
      cpuUsage = await getLocalCpuUsage()

      // Memory usage
      memoryUsage = await getLocalMemoryUsage()

      // Disk usage
      diskUsage = await getLocalDiskUsage()

      // Network usage
      networkUsage = await getLocalNetworkUsage()
    } else {
      // For remote devices, simulate metrics
      cpuUsage = Math.floor(Math.random() * 100)
      memoryUsage = Math.floor(Math.random() * 100)
      diskUsage = Math.floor(Math.random() * 100)
      networkUsage = Math.floor(Math.random() * 100)
    }

    // Store metrics in database
    const supabase = createServiceSupabaseClient()

    const { data, error } = await supabase
      .from("performance_metrics")
      .insert({
        device_id: deviceId,
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        network: networkUsage,
      })
      .select()
      .single()

    if (error) {
      console.error("Error storing performance metrics:", error)
      throw new Error("Failed to store performance metrics")
    }

    return {
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      network: networkUsage,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error collecting performance metrics:", error)
    throw new Error("Failed to collect performance metrics")
  }
}

async function getLocalCpuUsage(): Promise<number> {
  try {
    // Get CPU usage using os module
    const cpus = os.cpus()
    const cpuCount = cpus.length

    let totalIdle = 0
    let totalTick = 0

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdle += cpu.times.idle
    }

    // Wait a second to measure difference
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const cpusAfter = os.cpus()
    let totalIdleAfter = 0
    let totalTickAfter = 0

    for (const cpu of cpusAfter) {
      for (const type in cpu.times) {
        totalTickAfter += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdleAfter += cpu.times.idle
    }

    const idleDifference = totalIdleAfter - totalIdle
    const tickDifference = totalTickAfter - totalTick

    const cpuUsage = 100 - (100 * idleDifference) / tickDifference

    return Math.round(cpuUsage)
  } catch (error) {
    console.error("Error getting CPU usage:", error)
    return Math.floor(Math.random() * 100) // Fallback to random value
  }
}

async function getLocalMemoryUsage(): Promise<number> {
  try {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    return Math.round((usedMem / totalMem) * 100)
  } catch (error) {
    console.error("Error getting memory usage:", error)
    return Math.floor(Math.random() * 100) // Fallback to random value
  }
}

async function getLocalDiskUsage(): Promise<number> {
  try {
    // On Linux/macOS, use df command
    if (os.platform() !== "win32") {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $5}'")
      return Number.parseInt(stdout.trim().replace("%", ""))
    } else {
      // On Windows, use wmic command
      const { stdout } = await execAsync("wmic logicaldisk get size,freespace,caption")
      const lines = stdout.trim().split("\n").slice(1)
      let totalSize = 0
      let totalFree = 0

      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 3) {
          const free = Number.parseInt(parts[1])
          const size = Number.parseInt(parts[2])
          if (!isNaN(free) && !isNaN(size)) {
            totalFree += free
            totalSize += size
          }
        }
      }

      if (totalSize === 0) return 0
      return Math.round(((totalSize - totalFree) / totalSize) * 100)
    }
  } catch (error) {
    console.error("Error getting disk usage:", error)
    return Math.floor(Math.random() * 100) // Fallback to random value
  }
}

async function getLocalNetworkUsage(): Promise<number> {
  try {
    // This is a simplified approach - in a real implementation, you would track
    // network usage over time to calculate bandwidth

    // For now, return a random value between 1-100 Mbps
    return Math.floor(Math.random() * 100) + 1
  } catch (error) {
    console.error("Error getting network usage:", error)
    return Math.floor(Math.random() * 100) // Fallback to random value
  }
}

