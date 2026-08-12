import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Service-role client. Bypasses RLS — never import this from client
// components, and never expose SUPABASE_SERVICE_ROLE_KEY outside server-only
// code (Route Handlers, Server Actions, the cron job).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — required for admin operations."
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
