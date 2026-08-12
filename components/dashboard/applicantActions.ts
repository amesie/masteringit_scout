import type { SupabaseClient } from "@supabase/supabase-js"
import type { ApplicantStatus, SubjectScoreEntry } from "@/lib/types"

export async function updateApplicantStatus(
  supabase: SupabaseClient,
  id: string,
  status: ApplicantStatus
) {
  return supabase
    .from("applicants")
    .update({
      status,
      dormant_since: status === "dormant" ? new Date().toISOString() : null,
    })
    .eq("id", id)
}

export async function updateSubjectScores(
  supabase: SupabaseClient,
  id: string,
  subjectScores: SubjectScoreEntry[]
) {
  return supabase.from("applicants").update({ subject_scores: subjectScores }).eq("id", id)
}

export async function markContacted(supabase: SupabaseClient, id: string) {
  return supabase.from("applicants").update({ last_contacted: new Date().toISOString() }).eq("id", id)
}

export async function getDocumentUrl(path: string): Promise<string | null> {
  const res = await fetch(`/api/documents?path=${encodeURIComponent(path)}`)
  if (!res.ok) return null
  const { url } = await res.json()
  return url ?? null
}
