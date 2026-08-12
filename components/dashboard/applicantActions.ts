import type { SupabaseClient } from "@supabase/supabase-js"
import type { Applicant, ApplicantStatus, SubjectScoreEntry } from "@/lib/types"

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

// Used by the "Mark as Qualified — Keep on File" subject action: as well as
// recording that subject as a match, it moves the applicant into the On
// File (dormant) pool so it's actually reachable from that tab, which is
// what the button's label promises.
export async function keepOnFile(
  supabase: SupabaseClient,
  id: string,
  subjectScores: SubjectScoreEntry[],
  alreadyDormant: boolean
) {
  return supabase
    .from("applicants")
    .update({
      subject_scores: subjectScores,
      status: "dormant",
      ...(alreadyDormant ? {} : { dormant_since: new Date().toISOString() }),
    })
    .eq("id", id)
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

export async function deleteApplicant(id: string): Promise<{ error: string | null }> {
  const res = await fetch(`/api/applicants/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: body.error || "Could not delete this applicant." }
  }
  return { error: null }
}

export async function rescoreApplicant(
  id: string
): Promise<{ applicant: Applicant | null; error: string | null }> {
  const res = await fetch(`/api/applicants/${id}/rescore`, { method: "POST" })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { applicant: null, error: body.error || "Could not re-score this applicant." }
  }
  return { applicant: body.applicant as Applicant, error: null }
}
