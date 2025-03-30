import { NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient()

    // Create test devices if they don't exist
    const { data: existingDevices } = await supabase.from("devices").select("id")

    if (!existingDevices || existingDevices.length === 0) {
      // Create test devices
      await supabase.from("devices").insert([
        {
          name: "Main Server",
          type: "server",
          ip_address: "192.168.1.100",
          mac_address: "00:1A:2B:3C:4D:5E",
          manufacturer: "Dell",
          model: "PowerEdge R740",
          status: "healthy",
        },
        {
          name: "Development Laptop",
          type: "laptop",
          ip_address: "192.168.1.101",
          mac_address: "00:2C:3D:4E:5F:6G",
          manufacturer: "Apple",
          model: "MacBook Pro",
          status: "warning",
        },
      ])
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully" })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}

