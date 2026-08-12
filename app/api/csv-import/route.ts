import { NextResponse } from "next/server"
import { requireProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { scoreApplication } from "@/lib/scoring"
import type { OpenNeed } from "@/lib/types"

type CsvRow = Record<string, string>

function get(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    const found = Object.keys(row).find(k => k.trim().toLowerCase() === key)
    if (found && row[found]?.trim()) return row[found].trim()
  }
  return ""
}

function splitList(value: string): string[] {
  return value
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean)
}

function truthy(value: string): boolean {
  return ["yes", "y", "true", "1"].includes(value.trim().toLowerCase())
}

export async function POST(request: Request) {
  await requireProfile()

  const { rows } = (await request.json().catch(() => ({}))) as { rows?: CsvRow[] }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: openNeedsData } = await admin.from("open_needs").select("*").eq("is_active", true)
  const openNeeds = (openNeedsData ?? []) as OpenNeed[]

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const [i, row] of rows.entries()) {
    const name = get(row, "name", "full name", "applicant")
    const email = get(row, "email", "email address")
    const phone = get(row, "phone", "mobile", "phone number", "contact")

    if (!name) {
      skipped++
      errors.push(`Row ${i + 1}: missing name — skipped.`)
      continue
    }

    const subjects = splitList(get(row, "subjects", "subject"))
    const gradeRangeRaw = get(row, "grade_range", "grades", "grade levels")
    const gradeLevels = splitList(gradeRangeRaw)
    const mode = get(row, "location_pref", "mode", "teaching mode")
    const area = get(row, "area", "location", "suburb")
    const availabilityRaw = get(row, "availability")
    const availability = splitList(availabilityRaw)
    const experience = get(row, "experience", "background", "notes")
    const hasMatric = truthy(get(row, "matric", "matric certificate"))
    const appliedAtRaw = get(row, "applied_at", "date added", "dateadded")
    const appliedAt = appliedAtRaw && !isNaN(Date.parse(appliedAtRaw)) ? new Date(appliedAtRaw).toISOString() : undefined

    const canScore = subjects.length > 0
    const scoring = canScore
      ? await scoreApplication(
          {
            name,
            subjects: subjects.map(subject => ({ subject, experience })),
            gradeLevels,
            area,
            availability,
            mode,
            hasMatric,
          },
          openNeeds
        )
      : {
          matchScore: 0,
          scoreRationale: "No subjects were provided — needs manual review.",
          subjectScores: [],
          needsReview: true,
          reviewReason: "SCOUT could not confidently parse this row — no subjects were provided.",
          matchesOpenNeed: false,
        }

    const missingContactInfo = !email || !phone
    const needsReview = scoring.needsReview || missingContactInfo
    const reviewReason = missingContactInfo
      ? [scoring.reviewReason, "Missing email or phone — needs manual review."].filter(Boolean).join(" ")
      : scoring.reviewReason

    const status = needsReview ? "active" : scoring.matchesOpenNeed ? "active" : "dormant"
    const dormantSince = !needsReview && !scoring.matchesOpenNeed ? new Date().toISOString() : null

    const { error } = await admin.from("applicants").insert({
      name,
      email: email || null,
      phone: phone || null,
      subjects,
      grade_range: gradeRangeRaw || null,
      location_pref: mode || null,
      area: area || null,
      availability: availabilityRaw || null,
      match_score: scoring.matchScore,
      score_rationale: scoring.scoreRationale,
      subject_scores: scoring.subjectScores,
      status,
      needs_review: needsReview,
      review_reason: reviewReason || null,
      dormant_since: dormantSince,
      source: "csv_import",
      ...(appliedAt ? { applied_at: appliedAt } : {}),
      raw_submission: row,
    })

    if (error) {
      skipped++
      errors.push(`Row ${i + 1} (${name}): ${error.message}`)
    } else {
      imported++
    }
  }

  return NextResponse.json({ ok: true, imported, skipped, errors })
}
