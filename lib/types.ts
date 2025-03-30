export type DeviceStatus = "healthy" | "warning" | "error" | "pending"

export interface User {
  id: string
  name: string
  email: string
}

export interface Device {
  id: string
  name: string
  type: string
  ipAddress: string
  macAddress?: string
  manufacturer?: string
  model?: string
  status: DeviceStatus
  lastScan?: string
  scans?: ScanResult[]
  diagnostics?: DiagnosticResult[]
  userId?: string
  assignedTo?: User
  department?: string
}

export interface Issue {
  name: string
  description: string
  severity: "low" | "medium" | "high"
  timestamp: string
  aiSuggestion?: string
}

export interface ScanResult {
  id: string
  deviceId: string
  timestamp: string
  status: DeviceStatus
  issues: Issue[]
  runBy?: User
}

export interface TestResult {
  name: string
  description: string
  status: "passed" | "failed" | "warning" | "running"
  details?: string
  aiRecommendation?: string
}

export interface DiagnosticResult {
  id: string
  deviceId: string
  timestamp: string
  status: "passed" | "failed" | "warning" | "running"
  healthScore: number
  tests: TestResult[]
  runBy?: User
  sessionRecording?: string
}

export interface PerformanceMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  timestamp: string
}

export interface AITroubleshootingResult {
  id: string
  deviceId: string
  timestamp: string
  analysis: string
  recommendations: string[]
  automatedFixes: {
    name: string
    description: string
    status: "available" | "applied" | "failed"
  }[]
}

