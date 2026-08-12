import { NextResponse } from "next/server"
import { requireProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

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

export async function POST(request: Request) {
  await requireProfile()

  const { rows } = (await request.json().catch(() => ({}))) as { rows?: CsvRow[] }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 })
  }

  const admin = createAdminClient()

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
    const gradeRange = get(row, "grade_range", "grades", "grade levels") || null
    const rateRaw = get(row, "rate", "hourly rate")
    const rate = rateRaw ? Number(rateRaw.replace(/[^0-9.]/g, "")) : null
    const locationPref = get(row, "location_pref", "mode", "teaching mode") || null
    const area = get(row, "area", "location", "suburb") || null
    const availability = get(row, "availability") || null
    const appliedAtRaw = get(row, "applied_at", "date added", "dateadded")
    const appliedAt = appliedAtRaw && !isNaN(Date.parse(appliedAtRaw)) ? new Date(appliedAtRaw).toISOString() : undefined

    const needsReview = !email || !phone || subjects.length === 0

    const { error } = await admin.from("applicants").insert({
      name,
      email: email || null,
      phone: phone || null,
      subjects,
      grade_range: gradeRange,
      rate: Number.isFinite(rate) ? rate : null,
      location_pref: locationPref,
      area,
      availability,
      status: "dormant",
      dormant_since: new Date().toISOString(),
      needs_review: needsReview,
      review_reason: needsReview
        ? "Imported from CSV with incomplete data — needs manual review."
        : null,
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
