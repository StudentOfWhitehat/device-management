"use server"

import { createServiceSupabaseClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const cookieStore = cookies()
  const supabase = createServiceSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  return session.user
}

export async function getUserProfile(userId: string) {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

export async function getAllUsers() {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase.from("user_profiles").select("*")

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return data
}

export async function updateUserProfile(
  userId: string,
  profileData: {
    full_name?: string
    department?: string
    role?: string
  },
) {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase.from("user_profiles").update(profileData).eq("id", userId).select().single()

  if (error) {
    console.error("Error updating user profile:", error)
    throw new Error("Failed to update user profile")
  }

  return data
}

