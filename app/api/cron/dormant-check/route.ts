import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Applicant, OpenNeed } from "@/lib/types"

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000

// Runs nightly via Vercel Cron (see vercel.json). Two jobs, per the build
// spec's dormant-lifecycle rules:
//   1. Reactivate dormant applicants whose subjects now match a current
//      open need.
//   2. Flag applicants dormant for 12+ months for owner/employee review —
//      never auto-delete or auto-archive (POPIA data-retention guardrail).
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const admin = createAdminClient()

  const { data: openNeedsData } = await admin.from("open_needs").select("*").eq("is_active", true)
  const openNeeds = (openNeedsData ?? []) as OpenNeed[]

  const { data: dormantData } = await admin.from("applicants").select("*").eq("status", "dormant")
  const dormantApplicants = (dormantData ?? []) as Applicant[]

  let reactivated = 0
  let flagged = 0
  const now = Date.now()

  for (const applicant of dormantApplicants) {
    const matchesOpenNeed = openNeeds.some(
      need =>
        need.is_active &&
        (applicant.match_score ?? 0) >= need.min_score &&
        applicant.subject_scores.some(
          s => s.subject.toLowerCase() === need.subject.toLowerCase() && s.status === "meets"
        )
    )

    if (matchesOpenNeed) {
      await admin
        .from("applicants")
        .update({ status: "active", dormant_since: null, needs_review: false, review_reason: null })
        .eq("id", applicant.id)
      reactivated++
      continue
    }

    const dormantSince = applicant.dormant_since ? new Date(applicant.dormant_since).getTime() : null
    const crossedTwelveMonths = dormantSince !== null && now - dormantSince >= TWELVE_MONTHS_MS

    if (crossedTwelveMonths && !applicant.needs_review) {
      await admin
        .from("applicants")
        .update({
          needs_review: true,
          review_reason:
            "Dormant for 12+ months with no matching opening — needs owner/employee review (keep dormant, reach out, or archive). Never auto-deleted.",
        })
        .eq("id", applicant.id)
      flagged++
    }
  }

  return NextResponse.json({
    ok: true,
    checked: dormantApplicants.length,
    reactivated,
    flaggedForReview: flagged,
  })
}
