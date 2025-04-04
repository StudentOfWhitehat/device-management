import { createClient } from "@supabase/supabase-js"

// Create a singleton Supabase client for browser usage
let client: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  client = createClient(supabaseUrl, supabaseAnonKey)

  return client
}

