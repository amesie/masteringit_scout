import { createClient } from "@/lib/supabase/server"
import OnFileTable from "@/components/dashboard/OnFileTable"
import { TUTORS_TAB_STATUSES } from "@/lib/status"
import type { Applicant } from "@/lib/types"

export default async function ActiveTutorsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("applicants")
    .select("*")
    .in("status", TUTORS_TAB_STATUSES)
    .order("successful_at", { ascending: false, nullsFirst: false })

  return <OnFileTable variant="tutors" initialApplicants={(data ?? []) as Applicant[]} />
}
