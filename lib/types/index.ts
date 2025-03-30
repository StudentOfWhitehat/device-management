export type DeviceStatus = "healthy" | "warning" | "error" | "pending"

export interface User {
  id: string
  name: string
  email: string
  role?: string
  department?: string
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
  userId?: string
  assignedTo?: User
  department?: string
  scans?: ScanResult[]
  diagnostics?: DiagnosticResult[]
}

export interface Issue {
  id: string
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
  id: string
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
  id?: string
  deviceId?: string
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
    id: string
    name: string
    description: string
    status: "available" | "applied" | "failed"
  }[]
}

export interface AutomatedFixResult {
  success: boolean
  message: string
}

