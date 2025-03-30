export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          department: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          department?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          department?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          name: string
          type: string
          ip_address: string | null
          mac_address: string | null
          manufacturer: string | null
          model: string | null
          status: string
          last_scan: string | null
          user_id: string | null
          assigned_to: string | null
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          ip_address?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          model?: string | null
          status?: string
          last_scan?: string | null
          user_id?: string | null
          assigned_to?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          ip_address?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          model?: string | null
          status?: string
          last_scan?: string | null
          user_id?: string | null
          assigned_to?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scan_results: {
        Row: {
          id: string
          device_id: string
          timestamp: string
          status: string
          run_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          timestamp?: string
          status: string
          run_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          timestamp?: string
          status?: string
          run_by?: string | null
          created_at?: string
        }
      }
      issues: {
        Row: {
          id: string
          scan_result_id: string
          name: string
          description: string | null
          severity: string
          timestamp: string
          ai_suggestion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scan_result_id: string
          name: string
          description?: string | null
          severity: string
          timestamp?: string
          ai_suggestion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scan_result_id?: string
          name?: string
          description?: string | null
          severity?: string
          timestamp?: string
          ai_suggestion?: string | null
          created_at?: string
        }
      }
      diagnostic_results: {
        Row: {
          id: string
          device_id: string
          timestamp: string
          status: string
          health_score: number | null
          run_by: string | null
          session_recording: string | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          timestamp?: string
          status: string
          health_score?: number | null
          run_by?: string | null
          session_recording?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          timestamp?: string
          status?: string
          health_score?: number | null
          run_by?: string | null
          session_recording?: string | null
          created_at?: string
        }
      }
      test_results: {
        Row: {
          id: string
          diagnostic_result_id: string
          name: string
          description: string | null
          status: string
          details: string | null
          ai_recommendation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          diagnostic_result_id: string
          name: string
          description?: string | null
          status: string
          details?: string | null
          ai_recommendation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          diagnostic_result_id?: string
          name?: string
          description?: string | null
          status?: string
          details?: string | null
          ai_recommendation?: string | null
          created_at?: string
        }
      }
      performance_metrics: {
        Row: {
          id: string
          device_id: string
          cpu: number | null
          memory: number | null
          disk: number | null
          network: number | null
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          cpu?: number | null
          memory?: number | null
          disk?: number | null
          network?: number | null
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          cpu?: number | null
          memory?: number | null
          disk?: number | null
          network?: number | null
          timestamp?: string
          created_at?: string
        }
      }
      ai_troubleshooting_results: {
        Row: {
          id: string
          device_id: string
          timestamp: string
          analysis: string | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          timestamp?: string
          analysis?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          timestamp?: string
          analysis?: string | null
          created_at?: string
        }
      }
      ai_recommendations: {
        Row: {
          id: string
          troubleshooting_result_id: string
          recommendation: string
          created_at: string
        }
        Insert: {
          id?: string
          troubleshooting_result_id: string
          recommendation: string
          created_at?: string
        }
        Update: {
          id?: string
          troubleshooting_result_id?: string
          recommendation?: string
          created_at?: string
        }
      }
      automated_fixes: {
        Row: {
          id: string
          troubleshooting_result_id: string
          name: string
          description: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          troubleshooting_result_id: string
          name: string
          description?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          troubleshooting_result_id?: string
          name?: string
          description?: string | null
          status?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

