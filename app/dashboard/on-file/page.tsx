import { createClient } from "@/lib/supabase/server"
import OnFileTable from "@/components/dashboard/OnFileTable"
import { ON_FILE_TAB_STATUSES } from "@/lib/status"
import type { Applicant } from "@/lib/types"

export default async function OnFilePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("applicants")
    .select("*")
    .in("status", ON_FILE_TAB_STATUSES)
    .order("dormant_since", { ascending: true, nullsFirst: false })

  return <OnFileTable variant="on-file" initialApplicants={(data ?? []) as Applicant[]} />
}
