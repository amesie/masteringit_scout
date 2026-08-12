import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import OpenNeedsClient from "@/components/dashboard/OpenNeedsClient"
import type { OpenNeed } from "@/lib/types"

export default async function NeedsPage() {
  await requireProfile()
  const supabase = await createClient()
  const { data } = await supabase.from("open_needs").select("*").order("created_at", { ascending: true })

  return <OpenNeedsClient initialNeeds={(data ?? []) as OpenNeed[]} />
}
