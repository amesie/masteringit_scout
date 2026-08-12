import { createClient } from "@/lib/supabase/server"
import OnFileTable from "@/components/dashboard/OnFileTable"
import type { Applicant } from "@/lib/types"

export default async function OnFilePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("applicants")
    .select("*")
    .in("status", ["dormant", "archived"])
    .order("dormant_since", { ascending: true, nullsFirst: false })

  return <OnFileTable initialApplicants={(data ?? []) as Applicant[]} />
}
