import { createClient } from "@/lib/supabase/server"
import ApplicantsTable from "@/components/dashboard/ApplicantsTable"
import type { Applicant } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("applicants")
    .select("*")
    .not("status", "in", "(dormant,archived)")
    .order("applied_at", { ascending: false })

  return <ApplicantsTable initialApplicants={(data ?? []) as Applicant[]} />
}
