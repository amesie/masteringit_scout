import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/types"

// Fetches the logged-in user's profile (role/status). Redirects to /login
// if there's no session — call this at the top of dashboard pages/layouts.
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  if (profile.status === "invited") {
    await supabase.from("profiles").update({ status: "active" }).eq("id", user.id)
    profile.status = "active"
  }

  if (profile.status === "revoked") {
    await supabase.auth.signOut()
    redirect("/login?revoked=1")
  }

  return profile as Profile
}

export async function requireOwner(): Promise<Profile> {
  const profile = await requireProfile()
  if (profile.role !== "owner") {
    redirect("/dashboard")
  }
  return profile
}
