"use server"

import type { Device, ScanResult, Issue, User, AITroubleshootingResult } from "./types"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"
import { prisma } from "./db"
import { auth } from "./auth" // We'll create this next
import { createServerSupabaseClient } from "./supabase"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { generateAIAnalysis } from "./ai-service"

// Define DeviceStatus type
type DeviceStatus = "healthy" | "warning" | "error" | "pending"

// Mock database
let devices: Device[] = [
  {
    id: "1",
    name: "Main Server",
    type: "server",
    ipAddress: "192.168.1.100",
    macAddress: "00:1A:2B:3C:4D:5E",
    manufacturer: "Dell",
    model: "PowerEdge R740",
    status: "healthy",
    lastScan: new Date().toISOString(),
    userId: "user1",
    department: "IT",
    assignedTo: {
      id: "user1",
      name: "Demo User",
      email: "user1@example.com",
    },
    scans: [
      {
        id: "s1",
        deviceId: "1",
        timestamp: new Date().toISOString(),
        status: "healthy",
        issues: [],
        runBy: {
          id: "user1",
          name: "Demo User",
          email: "user1@example.com",
        },
      },
    ],
    diagnostics: [
      {
        id: "d1",
        deviceId: "1",
        timestamp: new Date().toISOString(),
        status: "passed",
        healthScore: 98,
        runBy: {
          id: "user1",
          name: "Demo User",
          email: "user1@example.com",
        },
        tests: [
          {
            name: "CPU Load Test",
            description: "Tests CPU under load",
            status: "passed",
            details: "CPU load normal at 15%",
            aiRecommendation: "No action needed. CPU performance is optimal.",
          },
          {
            name: "Memory Test",
            description: "Tests memory allocation and access",
            status: "passed",
            details: "Memory usage at 40%, no leaks detected",
            aiRecommendation: "Memory usage is within normal parameters.",
          },
          {
            name: "Disk I/O Test",
            description: "Tests disk read/write speeds",
            status: "passed",
            details: "Read: 250MB/s, Write: 180MB/s",
            aiRecommendation: "Disk performance is excellent.",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Development Laptop",
    type: "laptop",
    ipAddress: "192.168.1.101",
    macAddress: "00:2C:3D:4E:5F:6G",
    manufacturer: "Apple",
    model: "MacBook Pro",
    status: "warning",
    lastScan: new Date().toISOString(),
    userId: "user1",
    department: "Engineering",
    assignedTo: {
      id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
    },
    scans: [
      {
        id: "s2",
        deviceId: "2",
        timestamp: new Date().toISOString(),
        status: "warning",
        runBy: {
          id: "user1",
          name: "Demo User",
          email: "user1@example.com",
        },
        issues: [
          {
            name: "Disk Space Low",
            description: "Less than 10% disk space remaining",
            severity: "medium",
            timestamp: new Date().toISOString(),
            aiSuggestion: "Consider cleaning up temporary files or moving data to external storage.",
          },
        ],
      },
    ],
    diagnostics: [],
  },
]

// Example of a real server action
export async function getDevices(userId?: string) {
  // Get the current authenticated user
  const session = await auth()

  if (!session) {
    throw new Error("Unauthorized")
  }

  // If user is admin, they can see all devices or filter by userId
  if (session.user.role === "admin" && userId) {
    return prisma.device.findMany({
      where: { userId },
      include: {
        user: true,
        assignedTo: true,
      },
    })
  }

  // Regular users can only see their own devices
  return prisma.device.findMany({
    where: { userId: session.user.id },
    include: {
      user: true,
      assignedTo: true,
    },
  })
}

// Update addDevice to include userId
export async function addDeviceOld(deviceData: Partial<Device>): Promise<Device> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const newDevice: Device = {
    id: uuidv4(),
    name: deviceData.name || "Unnamed Device",
    type: deviceData.type || "other",
    ipAddress: deviceData.ipAddress || "0.0.0.0",
    macAddress: deviceData.macAddress,
    manufacturer: deviceData.manufacturer,
    model: deviceData.model,
    status: "pending",
    userId: deviceData.userId, // Include the userId
    department: deviceData.department,
    assignedTo: deviceData.assignedTo,
    scans: [],
    diagnostics: [],
  }

  devices.push(newDevice)
  return newDevice
}

export async function getDeviceByIdOld(id: string): Promise<Device | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return devices.find((device) => device.id === id) || null
}

export async function deleteDeviceOld(id: string): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const initialLength = devices.length
  devices = devices.filter((device) => device.id !== id)
  return devices.length < initialLength
}

export async function scanDevice(id: string, user?: User): Promise<ScanResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const device = devices.find((d) => d.id === id)
  if (!device) {
    throw new Error("Device not found")
  }

  // Generate random issues based on device type
  const issues: Issue[] = []
  const randomIssueCount = Math.floor(Math.random() * 3) // 0-2 issues

  for (let i = 0; i < randomIssueCount; i++) {
    const possibleIssues = [
      {
        name: "High CPU Usage",
        description: "CPU usage is above 90% for extended periods",
        severity: "medium" as const,
        aiSuggestion:
          "Check for resource-intensive applications or processes. Consider terminating unnecessary processes.",
      },
      {
        name: "Memory Leak Detected",
        description: "Memory usage is increasing over time without releasing",
        severity: "high" as const,
        aiSuggestion:
          "Restart the application that's causing the memory leak. Update to the latest version if available.",
      },
      {
        name: "Disk Space Low",
        description: "Less than 10% disk space remaining",
        severity: "medium" as const,
        aiSuggestion: "Clean temporary files, empty recycle bin, or consider adding additional storage.",
      },
      {
        name: "Network Latency",
        description: "High network latency detected",
        severity: "low" as const,
        aiSuggestion: "Check network connection, restart router, or move closer to Wi-Fi access point.",
      },
      {
        name: "Service Not Responding",
        description: "A critical service is not responding",
        severity: "high" as const,
        aiSuggestion:
          "Restart the service or the entire system. Check for recent updates that might have caused issues.",
      },
    ]

    const randomIssue = possibleIssues[Math.floor(Math.random() * possibleIssues.length)]
    issues.push({
      ...randomIssue,
      timestamp: new Date().toISOString(),
    })
  }

  // Determine status based on issues
  let status: "healthy" | "warning" | "error" = "healthy"
  if (issues.some((issue) => issue.severity === "high")) {
    status = "error"
  } else if (issues.some((issue) => issue.severity === "medium")) {
    status = "warning"
  }

  const scanResult: ScanResult = {
    id: uuidv4(),
    deviceId: id,
    timestamp: new Date().toISOString(),
    status,
    issues,
    runBy: user,
  }

  // Update device
  device.status = status
  device.lastScan = scanResult.timestamp
  device.scans = [...(device.scans || []), scanResult]

  return scanResult
}

export async function runDiagnostic(deviceId: string) {
  const session = await auth()

  if (!session) {
    throw new Error("Unauthorized")
  }

  // Check if user has access to this device
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  })

  if (!device || (device.userId !== session.user.id && session.user.role !== "admin")) {
    throw new Error("Unauthorized")
  }

  // Create a diagnostic result
  const diagnosticResult = await prisma.diagnosticResult.create({
    data: {
      deviceId,
      status: "running",
      healthScore: 0,
      runById: session.user.id,
      sessionRecording: `session-${Date.now()}.mp4`,
      tests: {
        create: [
          {
            name: "CPU Load Test",
            description: "Tests CPU under load",
            status: "running",
          },
          // Add more tests as needed
        ],
      },
    },
    include: {
      tests: true,
    },
  })

  // In a real system, you would trigger an actual diagnostic process here
  // For now, we'll simulate it with a timeout and update

  // This would be handled by a background job in a real system
  setTimeout(async () => {
    // Update the diagnostic with results
    await prisma.diagnosticResult.update({
      where: { id: diagnosticResult.id },
      data: {
        status: "passed",
        healthScore: 95,
        tests: {
          updateMany: {
            where: { diagnosticResultId: diagnosticResult.id },
            data: {
              status: "passed",
              details: "Test completed successfully",
              aiRecommendation: "No issues detected",
            },
          },
        },
      },
    })

    // Update device status
    await prisma.device.update({
      where: { id: deviceId },
      data: { status: "healthy" },
    })

    // Revalidate the page to show updated data
    revalidatePath(`/devices/${deviceId}`)
  }, 5000)

  return diagnosticResult
}

// Implement other server actions similarly

// New function for AI-powered troubleshooting
export async function runAITroubleshooting(id: string): Promise<AITroubleshootingResult> {
  // Simulate network delay for AI processing
  await new Promise((resolve) => setTimeout(resolve, 4000))

  const device = devices.find((d) => d.id === id)
  if (!device) {
    throw new Error("Device not found")
  }

  // Get the latest scan and diagnostic results
  const latestScan = device.scans?.[device.scans.length - 1]
  const latestDiagnostic = device.diagnostics?.[device.diagnostics.length - 1]

  // Generate AI analysis based on device status and previous results
  let analysis = "Based on system logs and diagnostic results, "
  let recommendations: string[] = []
  let automatedFixes: { name: string; description: string; status: "available" | "applied" | "failed" }[] = []

  if (device.status === "healthy") {
    analysis += "your device appears to be functioning normally. No critical issues detected."
    recommendations = [
      "Continue regular maintenance",
      "Keep software up to date",
      "Run periodic scans to ensure optimal performance",
    ]
    automatedFixes = [
      {
        name: "System Optimization",
        description: "Clean temporary files and optimize startup",
        status: "available",
      },
    ]
  } else if (device.status === "warning") {
    analysis += "I've detected several potential issues that should be addressed to prevent future problems."

    // Add recommendations based on issues
    if (latestScan?.issues) {
      latestScan.issues.forEach((issue) => {
        if (issue.aiSuggestion) {
          recommendations.push(issue.aiSuggestion)
        }
      })
    }

    if (recommendations.length === 0) {
      recommendations = ["Run disk cleanup to free space", "Check for software updates", "Scan for malware"]
    }

    automatedFixes = [
      {
        name: "Disk Cleanup",
        description: "Remove temporary files and free up disk space",
        status: "available",
      },
      {
        name: "Service Restart",
        description: "Restart problematic services",
        status: "available",
      },
    ]
  } else {
    analysis += "critical issues have been identified that require immediate attention."

    // Add recommendations based on diagnostic tests
    if (latestDiagnostic?.tests) {
      latestDiagnostic.tests
        .filter((test) => test.status === "failed")
        .forEach((test) => {
          if (test.aiRecommendation) {
            recommendations.push(test.aiRecommendation)
          }
        })
    }

    if (recommendations.length === 0) {
      recommendations = ["Restart the device immediately", "Check hardware connections", "Run a full system diagnostic"]
    }

    automatedFixes = [
      {
        name: "Emergency System Repair",
        description: "Attempt to repair critical system files",
        status: "available",
      },
      {
        name: "Service Recovery",
        description: "Restore essential services to working state",
        status: "available",
      },
      {
        name: "Driver Rollback",
        description: "Roll back recently updated drivers that may be causing issues",
        status: "available",
      },
    ]
  }

  // Create AI troubleshooting result
  const aiResult: AITroubleshootingResult = {
    id: uuidv4(),
    deviceId: id,
    timestamp: new Date().toISOString(),
    analysis,
    recommendations,
    automatedFixes,
  }

  return aiResult
}

// Function to apply automated fix
export async function applyAutomatedFix(
  deviceId: string,
  fixName: string,
): Promise<{ success: boolean; message: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const device = devices.find((d) => d.id === deviceId)
  if (!device) {
    throw new Error("Device not found")
  }

  // 90% chance of success
  const success = Math.random() < 0.9

  if (success) {
    // If it was a disk cleanup and the device had disk space issues, improve the status
    if (fixName === "Disk Cleanup" && device.status === "warning") {
      const hasDiskIssue = device.scans?.some((scan) => scan.issues.some((issue) => issue.name === "Disk Space Low"))

      if (hasDiskIssue) {
        device.status = "healthy"
      }
    }

    return {
      success: true,
      message: `Successfully applied "${fixName}". Device status has been updated.`,
    }
  } else {
    return {
      success: false,
      message: `Failed to apply "${fixName}". Please try again or contact support.`,
    }
  }
}

// Function to get devices by department
export async function getDevicesByDepartment(department: string): Promise<Device[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return devices.filter((device) => device.department === department)
}

// Function to get devices by assigned user
export async function getDevicesByAssignedUser(userId: string): Promise<Device[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return devices.filter((device) => device.assignedTo?.id === userId)
}

// Function to assign device to user
export async function assignDeviceToUser(deviceId: string, user: User): Promise<Device> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const device = devices.find((d) => d.id === deviceId)
  if (!device) {
    throw new Error("Device not found")
  }

  device.assignedTo = user

  return device
}

// Function to get performance metrics for a device
export type PerformanceMetrics = {
  cpu: number
  memory: number
  disk: number
  network: number
  timestamp: string
}

export async function getDevicePerformanceMetrics(
  deviceId: string,
  timeRange: "hour" | "day" | "week" = "hour",
): Promise<PerformanceMetrics[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const device = devices.find((d) => d.id === deviceId)
  if (!device) {
    throw new Error("Device not found")
  }

  // Generate mock performance data
  const metrics: PerformanceMetrics[] = []
  const now = new Date()

  // Determine number of data points based on time range
  let dataPoints = 60 // hour: 60 points (1 per minute)
  if (timeRange === "day") dataPoints = 24 // day: 24 points (1 per hour)
  if (timeRange === "week") dataPoints = 7 // week: 7 points (1 per day)

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(now)

    if (timeRange === "hour") {
      timestamp.setMinutes(now.getMinutes() - (dataPoints - i))
    } else if (timeRange === "day") {
      timestamp.setHours(now.getHours() - (dataPoints - i))
    } else {
      timestamp.setDate(now.getDate() - (dataPoints - i))
    }

    // Generate random metrics with some consistency
    const baselineCpu = Math.floor(Math.random() * 30) + 10
    const baselineMemory = Math.floor(Math.random() * 40) + 30
    const baselineDisk = Math.floor(Math.random() * 20) + 40
    const baselineNetwork = Math.floor(Math.random() * 50) + 20

    metrics.push({
      cpu: baselineCpu + (Math.random() * 10 - 5),
      memory: baselineMemory + (Math.random() * 10 - 5),
      disk: baselineDisk + (Math.random() * 5 - 2.5),
      network: baselineNetwork + (Math.random() * 20 - 10),
      timestamp: timestamp.toISOString(),
    })
  }

  return metrics
}

// Helper to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  return session.user
}

// Get user profile
export async function getUserProfile(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

// Get all devices
export async function getDevicesNew() {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

  // Get user profile to check role
  const profile = await getUserProfile(user.id)

  let query = supabase.from("devices").select(`
    *,
    user_profiles!devices_user_id_fkey (
      id,
      full_name,
      department,
      role
    ),
    user_profiles!devices_assigned_to_fkey (
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
    ...device,
    owner: device.user_profiles,
    assignedTo: device.user_profiles,
  }))
}

// Get device by ID
export async function getDeviceByIdNew(id: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

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
      user_profiles!devices_assigned_to_fkey (
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

  return {
    ...device,
    owner: device.user_profiles,
    assignedTo: device.user_profiles,
    scans: device.scan_results,
    diagnostics: device.diagnostic_results,
  }
}

// Add a new device
export async function addDeviceNew(deviceData: {
  name: string
  type: string
  ipAddress?: string
  macAddress?: string
  manufacturer?: string
  model?: string
  department?: string
}) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

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
  return data
}

// Delete a device
export async function deleteDeviceNew(id: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("devices").delete().eq("id", id)

  if (error) {
    console.error("Error deleting device:", error)
    throw new Error("Failed to delete device")
  }

  revalidatePath("/devices")
  return true
}

// Run a scan on a device
export async function scanDeviceNew(id: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

  // First, create a scan result
  const { data: scanResult, error: scanError } = await supabase
    .from("scan_results")
    .insert({
      device_id: id,
      status: "pending",
      run_by: user.id,
    })
    .select()
    .single()

  if (scanError) {
    console.error("Error creating scan:", scanError)
    throw new Error("Failed to start scan")
  }

  // In a real system, you would trigger an actual scan here
  // For now, we'll simulate it with a timeout and update

  // Simulate scanning process
  // This would be a background job in a real system
  setTimeout(async () => {
    try {
      // Generate random issues
      const issueCount = Math.floor(Math.random() * 3) // 0-2 issues
      const issues = []

      for (let i = 0; i < issueCount; i++) {
        const possibleIssues = [
          {
            name: "High CPU Usage",
            description: "CPU usage is above 90% for extended periods",
            severity: "medium",
            ai_suggestion:
              "Check for resource-intensive applications or processes. Consider terminating unnecessary processes.",
          },
          {
            name: "Memory Leak Detected",
            description: "Memory usage is increasing over time without releasing",
            severity: "high",
            ai_suggestion:
              "Restart the application that's causing the memory leak. Update to the latest version if available.",
          },
          {
            name: "Disk Space Low",
            description: "Less than 10% disk space remaining",
            severity: "medium",
            ai_suggestion: "Clean temporary files, empty recycle bin, or consider adding additional storage.",
          },
        ]

        const randomIssue = possibleIssues[Math.floor(Math.random() * possibleIssues.length)]
        issues.push(randomIssue)
      }

      // Determine status based on issues
      let status = "healthy"
      if (issues.some((issue) => issue.severity === "high")) {
        status = "error"
      } else if (issues.some((issue) => issue.severity === "medium")) {
        status = "warning"
      }

      // Update scan result
      await supabase.from("scan_results").update({ status }).eq("id", scanResult.id)

      // Add issues
      if (issues.length > 0) {
        await supabase.from("issues").insert(
          issues.map((issue) => ({
            scan_result_id: scanResult.id,
            name: issue.name,
            description: issue.description,
            severity: issue.severity,
            ai_suggestion: issue.ai_suggestion,
          })),
        )
      }

      // Update device status
      await supabase
        .from("devices")
        .update({
          status,
          last_scan: new Date().toISOString(),
        })
        .eq("id", id)

      revalidatePath(`/devices/${id}`)
    } catch (error) {
      console.error("Error updating scan result:", error)
    }
  }, 3000)

  return scanResult
}

// Run a diagnostic on a device
export async function runDiagnosticNew(id: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

  // First, create a diagnostic result
  const { data: diagnosticResult, error: diagnosticError } = await supabase
    .from("diagnostic_results")
    .insert({
      device_id: id,
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

  // In a real system, you would trigger an actual diagnostic process here
  // For now, we'll simulate it with a timeout and update

  // Simulate diagnostic process
  // This would be a background job in a real system
  setTimeout(async () => {
    try {
      // Generate random test results
      const testCount = Math.floor(Math.random() * 3) + 3 // 3-5 tests
      const tests = []

      const possibleTests = [
        {
          name: "CPU Load Test",
          description: "Tests CPU under load",
          status: Math.random() > 0.2 ? "passed" : "failed",
          details: "CPU load normal at 15%",
          ai_recommendation: "No action needed. CPU performance is optimal.",
        },
        {
          name: "Memory Test",
          description: "Tests memory allocation and access",
          status: Math.random() > 0.2 ? "passed" : "failed",
          details: "Memory usage at 40%, no leaks detected",
          ai_recommendation: "Memory usage is within normal parameters.",
        },
        {
          name: "Disk I/O Test",
          description: "Tests disk read/write speeds",
          status: Math.random() > 0.2 ? "passed" : "failed",
          details: "Read: 250MB/s, Write: 180MB/s",
          ai_recommendation: "Disk performance is excellent.",
        },
        {
          name: "Network Connectivity",
          description: "Tests network connectivity and speed",
          status: Math.random() > 0.2 ? "passed" : "failed",
          details: "Ping: 15ms, Download: 95Mbps",
          ai_recommendation: "Network connectivity is stable and fast.",
        },
        {
          name: "Service Health Check",
          description: "Checks if all services are running properly",
          status: Math.random() > 0.2 ? "passed" : "failed",
          details: "All services running normally",
          ai_recommendation: "All services are functioning correctly.",
        },
      ]

      // Select random tests
      const selectedTests = [...possibleTests].sort(() => 0.5 - Math.random()).slice(0, testCount)
      tests.push(...selectedTests)

      // Determine overall status and health score
      let overallStatus = "passed"
      if (tests.some((test) => test.status === "failed")) {
        overallStatus = "failed"
      } else if (tests.some((test) => test.status === "warning")) {
        overallStatus = "warning"
      }

      // Calculate health score (0-100)
      const healthScore = tests.reduce((score, test) => {
        if (test.status === "passed") return score + 100 / tests.length
        if (test.status === "warning") return score + 50 / tests.length
        return score
      }, 0)

      // Update diagnostic result
      await supabase
        .from("diagnostic_results")
        .update({
          status: overallStatus,
          health_score: Math.round(healthScore),
        })
        .eq("id", diagnosticResult.id)

      // Add test results
      await supabase.from("test_results").insert(
        tests.map((test) => ({
          diagnostic_result_id: diagnosticResult.id,
          name: test.name,
          description: test.description,
          status: test.status,
          details: test.details,
          ai_recommendation: test.ai_recommendation,
        })),
      )

      // Update device status based on diagnostic
      await supabase
        .from("devices")
        .update({
          status: overallStatus === "passed" ? "healthy" : overallStatus === "warning" ? "warning" : "error",
        })
        .eq("id", id)

      revalidatePath(`/devices/${id}`)
    } catch (error) {
      console.error("Error updating diagnostic result:", error)
    }
  }, 5000)

  return diagnosticResult
}

// Run AI troubleshooting
export async function runAITroubleshootingNew(id: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

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
    .eq("id", id)
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
      device_id: id,
      analysis: aiAnalysis.analysis,
    })
    .select()
    .single()

  if (troubleshootingError) {
    console.error("Error creating AI troubleshooting result:", troubleshootingError)
    throw new Error("Failed to create AI troubleshooting result")
  }

  // Add recommendations
  if (aiAnalysis.recommendations.length > 0) {
    await supabase.from("ai_recommendations").insert(
      aiAnalysis.recommendations.map((recommendation) => ({
        troubleshooting_result_id: troubleshootingResult.id,
        recommendation,
      })),
    )
  }

  // Add automated fixes
  const automatedFixes = [
    {
      name: "System Optimization",
      description: "Clean temporary files and optimize startup",
      status: "available",
    },
    {
      name: "Service Restart",
      description: "Restart problematic services",
      status: "available",
    },
    {
      name: "Driver Update",
      description: "Update device drivers to latest version",
      status: "available",
    },
  ]

  await supabase.from("automated_fixes").insert(
    automatedFixes.map((fix) => ({
      troubleshooting_result_id: troubleshootingResult.id,
      name: fix.name,
      description: fix.description,
      status: fix.status,
    })),
  )

  // Get the complete result with recommendations and fixes
  const { data: completeResult, error: completeResultError } = await supabase
    .from("ai_troubleshooting_results")
    .select(`
      *,
      ai_recommendations (*),
      automated_fixes (*)
    `)
    .eq("id", troubleshootingResult.id)
    .single()

  if (completeResultError) {
    console.error("Error fetching complete AI result:", completeResultError)
    throw new Error("Failed to fetch complete AI result")
  }

  return {
    ...completeResult,
    recommendations: completeResult.ai_recommendations.map((r: any) => r.recommendation),
    automatedFixes: completeResult.automated_fixes,
  }
}

// Apply automated fix
export async function applyAutomatedFixNew(fixId: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

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

  // In a real system, you would actually apply the fix here
  // For now, we'll simulate it with a success/failure

  // 90% chance of success
  const success = Math.random() < 0.9

  // Update fix status
  await supabase
    .from("automated_fixes")
    .update({
      status: success ? "applied" : "failed",
    })
    .eq("id", fixId)

  if (success) {
    // If it was a disk cleanup and the device had disk space issues, improve the status
    if (fix.name === "Disk Cleanup") {
      // Get the device
      const deviceId = fix.ai_troubleshooting_results.device_id

      // Check if device has disk space issues
      const { data: scanResults } = await supabase
        .from("scan_results")
        .select(`
          *,
          issues (*)
        `)
        .eq("device_id", deviceId)
        .order("timestamp", { ascending: false })
        .limit(1)

      if (scanResults && scanResults.length > 0) {
        const hasDiskIssue = scanResults[0].issues.some((issue: any) => issue.name === "Disk Space Low")

        if (hasDiskIssue) {
          await supabase.from("devices").update({ status: "healthy" }).eq("id", deviceId)

          revalidatePath(`/devices/${deviceId}`)
        }
      }
    }

    return {
      success: true,
      message: `Successfully applied "${fix.name}". Device status has been updated.`,
    }
  } else {
    return {
      success: false,
      message: `Failed to apply "${fix.name}". Please try again or contact support.`,
    }
  }
}

// Get performance metrics
export async function getDevicePerformanceMetricsNew(deviceId: string, timeRange: "hour" | "day" | "week" = "hour") {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

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

  // If no data, generate mock data
  if (!data || data.length === 0) {
    // Generate mock performance data
    const metrics = []
    const dataPoints = timeRange === "hour" ? 60 : timeRange === "day" ? 24 : 7

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(now)

      if (timeRange === "hour") {
        timestamp.setMinutes(now.getMinutes() - (dataPoints - i))
      } else if (timeRange === "day") {
        timestamp.setHours(now.getHours() - (dataPoints - i))
      } else {
        timestamp.setDate(now.getDate() - (dataPoints - i))
      }

      // Generate random metrics with some consistency
      const baselineCpu = Math.floor(Math.random() * 30) + 10
      const baselineMemory = Math.floor(Math.random() * 40) + 30
      const baselineDisk = Math.floor(Math.random() * 20) + 40
      const baselineNetwork = Math.floor(Math.random() * 50) + 20

      metrics.push({
        cpu: baselineCpu + (Math.random() * 10 - 5),
        memory: baselineMemory + (Math.random() * 10 - 5),
        disk: baselineDisk + (Math.random() * 5 - 2.5),
        network: baselineNetwork + (Math.random() * 20 - 10),
        timestamp: timestamp.toISOString(),
      })
    }

    return metrics
  }

  return data
}

// Get devices by department
export async function getDevicesByDepartmentNew(department: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

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
      user_profiles!devices_assigned_to_fkey (
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
    ...device,
    owner: device.user_profiles,
    assignedTo: device.user_profiles,
  }))
}

// Get devices by assigned user
export async function getDevicesByAssignedUserNew(userId: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

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
      user_profiles!devices_assigned_to_fkey (
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
    ...device,
    owner: device.user_profiles,
    assignedTo: device.user_profiles,
  }))
}

// Assign device to user
export async function assignDeviceToUserNew(deviceId: string, userId: string) {
  const user = await getAuthenticatedUser()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("devices")
    .update({ assigned_to: userId })
    .eq("id", deviceId)
    .select()
    .single()

  if (error) {
    console.error("Error assigning device to user:", error)
    throw new Error("Failed to assign device to user")
  }

  revalidatePath(`/devices/${deviceId}`)
  return data
}

