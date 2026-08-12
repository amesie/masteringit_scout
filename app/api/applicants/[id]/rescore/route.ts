import { NextResponse } from "next/server"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { scoreApplication } from "@/lib/scoring"
import type { Applicant, OpenNeed } from "@/lib/types"

// On-demand version of what the nightly dormant-check cron does for one
// applicant: re-run scoring against the *current* Hiring Needs. Lets staff
// check an On File applicant right after adding a new need, instead of
// waiting for the nightly job.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile()
  const { id } = await params

  const supabase = await createClient()

  const { data: applicantData, error: fetchError } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !applicantData) {
    return NextResponse.json({ error: "Applicant not found." }, { status: 404 })
  }
  const applicant = applicantData as Applicant

  if (applicant.subject_scores.length === 0) {
    return NextResponse.json(
      { error: "This applicant has no subjects on file to score." },
      { status: 400 }
    )
  }

  const { data: openNeedsData } = await supabase.from("open_needs").select("*").eq("is_active", true)
  const openNeeds = (openNeedsData ?? []) as OpenNeed[]

  const scoring = await scoreApplication(
    {
      name: applicant.name,
      subjects: applicant.subject_scores.map(s => ({ subject: s.subject, experience: s.experience })),
      gradeLevels: (applicant.grade_range || "").split(",").map(s => s.trim()).filter(Boolean),
      area: applicant.area || "",
      availability: (applicant.availability || "").split(",").map(s => s.trim()).filter(Boolean),
      mode: applicant.location_pref || "",
      hasMatric: !!applicant.matric_file_url,
    },
    openNeeds
  )

  const newStatus = scoring.needsReview ? applicant.status : scoring.matchesOpenNeed ? "active" : "dormant"

  const updates: Record<string, unknown> = {
    match_score: scoring.matchScore,
    score_rationale: scoring.scoreRationale,
    subject_scores: scoring.subjectScores,
    needs_review: scoring.needsReview,
    review_reason: scoring.needsReview ? scoring.reviewReason : null,
    status: newStatus,
  }

  if (newStatus === "active") {
    updates.dormant_since = null
  } else if (newStatus === "dormant" && applicant.status !== "dormant") {
    updates.dormant_since = new Date().toISOString()
  }

  const { data: updated, error: updateError } = await supabase
    .from("applicants")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Could not save the new score." }, { status: 500 })
  }

  return NextResponse.json({ ok: true, applicant: updated })
}
