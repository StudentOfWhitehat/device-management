"use server"

import { createServiceSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { generateAIAnalysis } from "@/lib/services/ai-service"
import type {
  Device,
  ScanResult,
  DiagnosticResult,
  PerformanceMetrics,
  AITroubleshootingResult,
  AutomatedFixResult,
} from "@/lib/types"
import { getCurrentUser } from "@/lib/auth/auth-utils"
import { scanDeviceSystem } from "@/lib/services/device-scanner"
import { runDeviceDiagnostics } from "@/lib/services/device-diagnostics"

// Get all devices
export async function getDevices(): Promise<Device[]> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  // Get user profile to check role
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  let query = supabase.from("devices").select(`
    *,
    user_profiles!devices_user_id_fkey (
      id,
      full_name,
      department,
      role
    ),
    assigned_user:user_profiles!devices_assigned_to_fkey (
      id,
      full_name,
      department,
      role
    )
  `)

  // If not admin, only show devices owned by or assigned to the user
  if (profile?.role !== "admin") {
    query = query.or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching devices:", error)
    return []
  }

  return data.map((device) => ({
    id: device.id,
    name: device.name,
    type: device.type,
    ipAddress: device.ip_address || "",
    macAddress: device.mac_address || undefined,
    manufacturer: device.manufacturer || undefined,
    model: device.model || undefined,
    status: device.status as any,
    lastScan: device.last_scan || undefined,
    userId: device.user_id || undefined,
    department: device.department || undefined,
    assignedTo: device.assigned_user
      ? {
          id: device.assigned_user.id,
          name: device.assigned_user.full_name || "",
          email: "", // Email not exposed in this query
          department: device.assigned_user.department || undefined,
          role: device.assigned_user.role,
        }
      : undefined,
  }))
}

// Get a single device by ID
export async function getDeviceById(id: string): Promise<Device | null> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  const { data: device, error } = await supabase
    .from("devices")
    .select(`
      *,
      user_profiles!devices_user_id_fkey (
        id,
        full_name,
        department,
        role
      ),
      assigned_user:user_profiles!devices_assigned_to_fkey (
        id,
        full_name,
        department,
        role
      ),
      scan_results (
        *,
        issues (*)
      ),
      diagnostic_results (
        *,
        test_results (*)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching device:", error)
    return null
  }

  // Transform scan results
  const scans: ScanResult[] = device.scan_results.map((scan: any) => ({
    id: scan.id,
    deviceId: scan.device_id,
    timestamp: scan.timestamp,
    status: scan.status as any,
    issues: scan.issues.map((issue: any) => ({
      id: issue.id,
      name: issue.name,
      description: issue.description || "",
      severity: issue.severity as any,
      timestamp: issue.timestamp,
      aiSuggestion: issue.ai_suggestion,
    })),
    runBy: scan.run_by
      ? {
          id: scan.run_by,
          name: "", // We don't have this info in this query
          email: "",
        }
      : undefined,
  }))

  // Transform diagnostic results
  const diagnostics: DiagnosticResult[] = device.diagnostic_results.map((diagnostic: any) => ({
    id: diagnostic.id,
    deviceId: diagnostic.device_id,
    timestamp: diagnostic.timestamp,
    status: diagnostic.status as any,
    healthScore: diagnostic.health_score || 0,
    tests: diagnostic.test_results.map((test: any) => ({
      id: test.id,
      name: test.name,
      description: test.description || "",
      status: test.status as any,
      details: test.details,
      aiRecommendation: test.ai_recommendation,
    })),
    runBy: diagnostic.run_by
      ? {
          id: diagnostic.run_by,
          name: "", // We don't have this info in this query
          email: "",
        }
      : undefined,
    sessionRecording: diagnostic.session_recording,
  }))

  return {
    id: device.id,
    name: device.name,
    type: device.type,
    ipAddress: device.ip_address || "",
    macAddress: device.mac_address || undefined,
    manufacturer: device.manufacturer || undefined,
    model: device.model || undefined,
    status: device.status as any,
    lastScan: device.last_scan || undefined,
    userId: device.user_id || undefined,
    department: device.department || undefined,
    assignedTo: device.assigned_user
      ? {
          id: device.assigned_user.id,
          name: device.assigned_user.full_name || "",
          email: "", // Email not exposed in this query
          department: device.assigned_user.department || undefined,
          role: device.assigned_user.role,
        }
      : undefined,
    scans,
    diagnostics,
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
  department?: string
}): Promise<Device> {
  const user = await getCurrentUser()
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
      department: deviceData.department,
      user_id: user.id,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding device:", error)
    throw new Error("Failed to add device")
  }

  revalidatePath("/devices")
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    ipAddress: data.ip_address || "",
    macAddress: data.mac_address || undefined,
    manufacturer: data.manufacturer || undefined,
    model: data.model || undefined,
    status: data.status as any,
    userId: data.user_id,
    department: data.department || undefined,
  }
}

// Delete a device
export async function deleteDevice(id: string): Promise<boolean> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  const { error } = await supabase.from("devices").delete().eq("id", id)

  if (error) {
    console.error("Error deleting device:", error)
    throw new Error("Failed to delete device")
  }

  revalidatePath("/devices")
  return true
}

// Run a scan on a device
export async function scanDevice(deviceId: string): Promise<ScanResult> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  // First, create a scan result
  const { data: scanResult, error: scanError } = await supabase
    .from("scan_results")
    .insert({
      device_id: deviceId,
      status: "pending",
      run_by: user.id,
    })
    .select()
    .single()

  if (scanError) {
    console.error("Error creating scan:", scanError)
    throw new Error("Failed to start scan")
  }

  try {
    // Get device details for scanning
    const { data: device } = await supabase.from("devices").select("*").eq("id", deviceId).single()

    if (!device) {
      throw new Error("Device not found")
    }

    // Perform actual device scan
    const scanResults = await scanDeviceSystem({
      ipAddress: device.ip_address || "",
      type: device.type,
    })

    // Process issues and get AI suggestions
    const issues = []

    for (const issue of scanResults.issues) {
      // Get AI suggestion for this issue
      const aiSuggestion = await generateAIAnalysis(issue.name, issue.description)

      // Add issue to database
      const { data: issueData, error: issueError } = await supabase
        .from("issues")
        .insert({
          scan_result_id: scanResult.id,
          name: issue.name,
          description: issue.description,
          severity: issue.severity,
          ai_suggestion: aiSuggestion,
        })
        .select()
        .single()

      if (issueError) {
        console.error("Error adding issue:", issueError)
      } else {
        issues.push({
          id: issueData.id,
          name: issueData.name,
          description: issueData.description || "",
          severity: issueData.severity as any,
          timestamp: issueData.timestamp,
          aiSuggestion: issueData.ai_suggestion,
        })
      }
    }

    // Update scan result status
    await supabase.from("scan_results").update({ status: scanResults.status }).eq("id", scanResult.id)

    // Update device status and last_scan
    await supabase
      .from("devices")
      .update({
        status: scanResults.status,
        last_scan: new Date().toISOString(),
      })
      .eq("id", deviceId)

    revalidatePath(`/devices/${deviceId}`)

    return {
      id: scanResult.id,
      deviceId: scanResult.device_id,
      timestamp: scanResult.timestamp,
      status: scanResults.status as any,
      issues,
      runBy: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
      },
    }
  } catch (error) {
    console.error("Error during device scan:", error)

    // Update scan result to error status
    await supabase.from("scan_results").update({ status: "error" }).eq("id", scanResult.id)

    // Return a basic scan result with error status
    return {
      id: scanResult.id,
      deviceId: scanResult.device_id,
      timestamp: scanResult.timestamp,
      status: "error" as any,
      issues: [],
      runBy: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
      },
    }
  }
}

// Run a diagnostic on a device
export async function runDiagnostic(deviceId: string): Promise<DiagnosticResult> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  // First, create a diagnostic result
  const { data: diagnosticResult, error: diagnosticError } = await supabase
    .from("diagnostic_results")
    .insert({
      device_id: deviceId,
      status: "running",
      health_score: 0,
      run_by: user.id,
      session_recording: `session-${Date.now()}.mp4`,
    })
    .select()
    .single()

  if (diagnosticError) {
    console.error("Error creating diagnostic:", diagnosticError)
    throw new Error("Failed to start diagnostic")
  }

  try {
    // Get device details for diagnostics
    const { data: device } = await supabase.from("devices").select("*").eq("id", deviceId).single()

    if (!device) {
      throw new Error("Device not found")
    }

    // Run actual device diagnostics
    const diagnosticResults = await runDeviceDiagnostics({
      ipAddress: device.ip_address || "",
      type: device.type,
      model: device.model || undefined,
    })

    // Process test results
    const tests = []

    for (const test of diagnosticResults.tests) {
      // Add test result to database
      const { data: testData, error: testError } = await supabase
        .from("test_results")
        .insert({
          diagnostic_result_id: diagnosticResult.id,
          name: test.name,
          description: test.description,
          status: test.status,
          details: test.details,
          ai_recommendation: test.aiRecommendation,
        })
        .select()
        .single()

      if (testError) {
        console.error("Error adding test result:", testError)
      } else {
        tests.push({
          id: testData.id,
          name: testData.name,
          description: testData.description || "",
          status: testData.status as any,
          details: testData.details,
          aiRecommendation: testData.ai_recommendation,
        })
      }
    }

    // Update diagnostic result
    await supabase
      .from("diagnostic_results")
      .update({
        status: diagnosticResults.status,
        health_score: diagnosticResults.healthScore,
      })
      .eq("id", diagnosticResult.id)

    // Update device status based on diagnostic
    await supabase
      .from("devices")
      .update({
        status:
          diagnosticResults.status === "passed"
            ? "healthy"
            : diagnosticResults.status === "warning"
              ? "warning"
              : "error",
      })
      .eq("id", deviceId)

    revalidatePath(`/devices/${deviceId}`)

    return {
      id: diagnosticResult.id,
      deviceId: diagnosticResult.device_id,
      timestamp: diagnosticResult.timestamp,
      status: diagnosticResults.status as any,
      healthScore: diagnosticResults.healthScore,
      tests,
      runBy: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
      },
      sessionRecording: diagnosticResult.session_recording,
    }
  } catch (error) {
    console.error("Error during device diagnostics:", error)

    // Update diagnostic result to error status
    await supabase
      .from("diagnostic_results")
      .update({ status: "failed", health_score: 0 })
      .eq("id", diagnosticResult.id)

    // Return a basic diagnostic result with error status
    return {
      id: diagnosticResult.id,
      deviceId: diagnosticResult.device_id,
      timestamp: diagnosticResult.timestamp,
      status: "failed" as any,
      healthScore: 0,
      tests: [],
      runBy: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
      },
      sessionRecording: diagnosticResult.session_recording,
    }
  }
}

// Get device performance metrics
export async function getDevicePerformanceMetrics(
  deviceId: string,
  timeRange: "hour" | "day" | "week" = "hour",
): Promise<PerformanceMetrics[]> {
  const supabase = createServiceSupabaseClient()

  // Determine time range
  const now = new Date()
  const startTime = new Date(now)

  if (timeRange === "hour") {
    startTime.setHours(now.getHours() - 1)
  } else if (timeRange === "day") {
    startTime.setDate(now.getDate() - 1)
  } else {
    startTime.setDate(now.getDate() - 7)
  }

  // Get metrics from database
  const { data, error } = await supabase
    .from("performance_metrics")
    .select("*")
    .eq("device_id", deviceId)
    .gte("timestamp", startTime.toISOString())
    .order("timestamp", { ascending: true })

  if (error) {
    console.error("Error fetching performance metrics:", error)
    return []
  }

  return data.map((metric) => ({
    id: metric.id,
    deviceId: metric.device_id,
    cpu: metric.cpu || 0,
    memory: metric.memory || 0,
    disk: metric.disk || 0,
    network: metric.network || 0,
    timestamp: metric.timestamp,
  }))
}

// Run AI troubleshooting
export async function runAITroubleshooting(deviceId: string): Promise<AITroubleshootingResult> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  // Get device data for AI analysis
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select(`
      *,
      scan_results (
        *,
        issues (*)
      ),
      diagnostic_results (
        *,
        test_results (*)
      )
    `)
    .eq("id", deviceId)
    .single()

  if (deviceError) {
    console.error("Error fetching device for AI analysis:", deviceError)
    throw new Error("Failed to fetch device data for AI analysis")
  }

  // Generate AI analysis
  const aiAnalysis = await generateAIAnalysis(device)

  // Create AI troubleshooting result
  const { data: troubleshootingResult, error: troubleshootingError } = await supabase
    .from("ai_troubleshooting_results")
    .insert({
      device_id: deviceId,
      analysis: aiAnalysis.analysis,
    })
    .select()
    .single()

  if (troubleshootingError) {
    console.error("Error creating AI troubleshooting result:", troubleshootingError)
    throw new Error("Failed to create AI troubleshooting result")
  }

  // Add recommendations
  const recommendations: string[] = []
  if (aiAnalysis.recommendations.length > 0) {
    for (const recommendation of aiAnalysis.recommendations) {
      const { data, error } = await supabase
        .from("ai_recommendations")
        .insert({
          troubleshooting_result_id: troubleshootingResult.id,
          recommendation,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding recommendation:", error)
      } else {
        recommendations.push(recommendation)
      }
    }
  }

  // Add automated fixes
  const automatedFixes = [
    {
      name: "System Optimization",
      description: "Clean temporary files and optimize startup",
      status: "available" as const,
    },
    {
      name: "Service Restart",
      description: "Restart problematic services",
      status: "available" as const,
    },
    {
      name: "Driver Update",
      description: "Update device drivers to latest version",
      status: "available" as const,
    },
  ]

  const fixResults = []

  for (const fix of automatedFixes) {
    const { data, error } = await supabase
      .from("automated_fixes")
      .insert({
        troubleshooting_result_id: troubleshootingResult.id,
        name: fix.name,
        description: fix.description,
        status: fix.status,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding automated fix:", error)
    } else {
      fixResults.push({
        id: data.id,
        name: data.name,
        description: data.description || "",
        status: data.status as any,
      })
    }
  }

  revalidatePath(`/devices/${deviceId}`)

  return {
    id: troubleshootingResult.id,
    deviceId: troubleshootingResult.device_id,
    timestamp: troubleshootingResult.timestamp,
    analysis: troubleshootingResult.analysis || "",
    recommendations,
    automatedFixes: fixResults,
  }
}

// Apply automated fix
export async function applyAutomatedFix(fixId: string): Promise<AutomatedFixResult> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  // Get the fix
  const { data: fix, error: fixError } = await supabase
    .from("automated_fixes")
    .select(`
      *,
      ai_troubleshooting_results (
        device_id
      )
    `)
    .eq("id", fixId)
    .single()

  if (fixError) {
    console.error("Error fetching fix:", fixError)
    throw new Error("Failed to fetch fix")
  }

  try {
    // Get device details
    const deviceId = fix.ai_troubleshooting_results.device_id
    const { data: device } = await supabase.from("devices").select("*").eq("id", deviceId).single()

    if (!device) {
      throw new Error("Device not found")
    }

    // Apply the fix based on its type
    let success = false
    let message = ""

    switch (fix.name) {
      case "System Optimization":
        // Implement actual system optimization logic here
        success = await optimizeSystem(device.ip_address || "")
        message = success
          ? "Successfully optimized system. Temporary files cleaned and startup optimized."
          : "Failed to optimize system. Please try again or contact support."
        break

      case "Service Restart":
        // Implement actual service restart logic here
        success = await restartServices(device.ip_address || "")
        message = success
          ? "Successfully restarted problematic services. System performance should improve."
          : "Failed to restart services. Please try again or contact support."
        break

      case "Driver Update":
        // Implement actual driver update logic here
        success = await updateDrivers(device.ip_address || "", device.model || "")
        message = success
          ? "Successfully updated device drivers to the latest version."
          : "Failed to update drivers. Please try again or contact support."
        break

      default:
        success = false
        message = "Unknown fix type. Please contact support."
    }

    // Update fix status
    await supabase
      .from("automated_fixes")
      .update({
        status: success ? "applied" : "failed",
      })
      .eq("id", fixId)

    // If successful and it was a disk cleanup, improve device status if needed
    if (success && fix.name === "System Optimization" && device.status !== "healthy") {
      await supabase.from("devices").update({ status: "healthy" }).eq("id", deviceId)
    }

    revalidatePath(`/devices/${deviceId}`)

    return { success, message }
  } catch (error) {
    console.error("Error applying fix:", error)

    // Update fix status to failed
    await supabase.from("automated_fixes").update({ status: "failed" }).eq("id", fixId)

    return {
      success: false,
      message: "An unexpected error occurred while applying the fix. Please try again or contact support.",
    }
  }
}

// Get devices by department
export async function getDevicesByDepartment(department: string): Promise<Device[]> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from("devices")
    .select(`
      *,
      user_profiles!devices_user_id_fkey (
        id,
        full_name,
        department,
        role
      ),
      assigned_user:user_profiles!devices_assigned_to_fkey (
        id,
        full_name,
        department,
        role
      )
    `)
    .eq("department", department)

  if (error) {
    console.error("Error fetching devices by department:", error)
    return []
  }

  return data.map((device) => ({
    id: device.id,
    name: device.name,
    type: device.type,
    ipAddress: device.ip_address || "",
    macAddress: device.mac_address || undefined,
    manufacturer: device.manufacturer || undefined,
    model: device.model || undefined,
    status: device.status as any,
    lastScan: device.last_scan || undefined,
    userId: device.user_id || undefined,
    department: device.department || undefined,
    assignedTo: device.assigned_user
      ? {
          id: device.assigned_user.id,
          name: device.assigned_user.full_name || "",
          email: "", // Email not exposed in this query
          department: device.assigned_user.department || undefined,
          role: device.assigned_user.role,
        }
      : undefined,
  }))
}

// Get devices by assigned user
export async function getDevicesByAssignedUser(userId: string): Promise<Device[]> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from("devices")
    .select(`
      *,
      user_profiles!devices_user_id_fkey (
        id,
        full_name,
        department,
        role
      ),
      assigned_user:user_profiles!devices_assigned_to_fkey (
        id,
        full_name,
        department,
        role
      )
    `)
    .eq("assigned_to", userId)

  if (error) {
    console.error("Error fetching devices by assigned user:", error)
    return []
  }

  return data.map((device) => ({
    id: device.id,
    name: device.name,
    type: device.type,
    ipAddress: device.ip_address || "",
    macAddress: device.mac_address || undefined,
    manufacturer: device.manufacturer || undefined,
    model: device.model || undefined,
    status: device.status as any,
    lastScan: device.last_scan || undefined,
    userId: device.user_id || undefined,
    department: device.department || undefined,
    assignedTo: device.assigned_user
      ? {
          id: device.assigned_user.id,
          name: device.assigned_user.full_name || "",
          email: "", // Email not exposed in this query
          department: device.assigned_user.department || undefined,
          role: device.assigned_user.role,
        }
      : undefined,
  }))
}

// Assign device to user
export async function assignDeviceToUser(deviceId: string, userId: string): Promise<Device> {
  const user = await getCurrentUser()
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from("devices")
    .update({ assigned_to: userId })
    .eq("id", deviceId)
    .select(`
      *,
      assigned_user:user_profiles!devices_assigned_to_fkey (
        id,
        full_name,
        department,
        role
      )
    `)
    .single()

  if (error) {
    console.error("Error assigning device to user:", error)
    throw new Error("Failed to assign device to user")
  }

  revalidatePath(`/devices/${deviceId}`)

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    ipAddress: data.ip_address || "",
    macAddress: data.mac_address || undefined,
    manufacturer: data.manufacturer || undefined,
    model: data.model || undefined,
    status: data.status as any,
    lastScan: data.last_scan || undefined,
    userId: data.user_id || undefined,
    department: data.department || undefined,
    assignedTo: data.assigned_user
      ? {
          id: data.assigned_user.id,
          name: data.assigned_user.full_name || "",
          email: "", // Email not exposed in this query
          department: data.assigned_user.department || undefined,
          role: data.assigned_user.role,
        }
      : undefined,
  }
}

// Helper functions for actual device operations
async function optimizeSystem(ipAddress: string): Promise<boolean> {
  // In a real implementation, this would connect to the device and run optimization
  // For now, we'll simulate success with a 90% chance
  await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate work
  return Math.random() < 0.9
}

async function restartServices(ipAddress: string): Promise<boolean> {
  // In a real implementation, this would connect to the device and restart services
  // For now, we'll simulate success with a 85% chance
  await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate work
  return Math.random() < 0.85
}

async function updateDrivers(ipAddress: string, model: string): Promise<boolean> {
  // In a real implementation, this would connect to the device and update drivers
  // For now, we'll simulate success with a 80% chance
  await new Promise((resolve) => setTimeout(resolve, 5000)) // Simulate work
  return Math.random() < 0.8
}

