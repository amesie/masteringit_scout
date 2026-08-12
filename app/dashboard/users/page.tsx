import { requireOwner } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import ManageUsersClient from "@/components/dashboard/ManageUsersClient"
import type { Profile } from "@/lib/types"

export default async function UsersPage() {
  await requireOwner()
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: true })

  return <ManageUsersClient initialUsers={(data ?? []) as Profile[]} />
}
