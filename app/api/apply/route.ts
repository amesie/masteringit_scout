import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { scoreApplication, type ScoringSubjectInput } from "@/lib/scoring"
import type { OpenNeed } from "@/lib/types"

interface ApplyPayload {
  name: string
  email: string
  phone: string
  area: string
  rate: number | null
  gradeLevels: string[]
  availability: string[]
  mode: string
  subjects: ScoringSubjectInput[]
}

async function uploadFile(
  admin: ReturnType<typeof createAdminClient>,
  applicantId: string,
  kind: "cv" | "matric",
  file: File
): Promise<{ name: string; url: string } | null> {
  const path = `${applicantId}/${kind}-${file.name}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await admin.storage
    .from("applicant-documents")
    .upload(path, buffer, { contentType: file.type || undefined, upsert: true })

  if (error) {
    console.error(`Failed to upload ${kind}:`, error.message)
    return null
  }

  return { name: file.name, url: path }
}

export async function POST(request: Request) {
  let payload: ApplyPayload
  let cvFile: File | null = null
  let matricFile: File | null = null

  try {
    const formData = await request.formData()
    const rawPayload = formData.get("payload")
    if (typeof rawPayload !== "string") {
      return NextResponse.json({ error: "Missing application data." }, { status: 400 })
    }
    payload = JSON.parse(rawPayload)
    const cv = formData.get("cv")
    const matric = formData.get("matric")
    cvFile = cv instanceof File ? cv : null
    matricFile = matric instanceof File ? matric : null
  } catch {
    return NextResponse.json({ error: "Could not read the submitted form." }, { status: 400 })
  }

  if (!payload.name || !payload.email || !payload.phone) {
    return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const applicantId = randomUUID()

  const validSubjects = (payload.subjects || []).filter(s => s.subject)
  const hasMatric = !!matricFile

  let cvUpload: { name: string; url: string } | null = null
  let matricUpload: { name: string; url: string } | null = null

  if (cvFile) cvUpload = await uploadFile(admin, applicantId, "cv", cvFile)
  if (matricFile) matricUpload = await uploadFile(admin, applicantId, "matric", matricFile)

  const { data: openNeedsData } = await admin
    .from("open_needs")
    .select("*")
    .eq("is_active", true)
  const openNeeds = (openNeedsData ?? []) as OpenNeed[]

  const canScore = validSubjects.length > 0

  const scoring = canScore
    ? await scoreApplication(
        {
          name: payload.name,
          subjects: validSubjects,
          gradeLevels: payload.gradeLevels || [],
          area: payload.area,
          availability: payload.availability || [],
          mode: payload.mode,
          rate: payload.rate,
          hasMatric,
        },
        openNeeds
      )
    : {
        matchScore: 0,
        scoreRationale: "No subjects were provided — needs manual review.",
        subjectScores: [],
        needsReview: true,
        reviewReason: "SCOUT could not confidently parse this application — no subjects were provided.",
        matchesOpenNeed: false,
      }

  const status = scoring.needsReview ? "active" : scoring.matchesOpenNeed ? "active" : "dormant"
  const dormantSince = !scoring.needsReview && !scoring.matchesOpenNeed ? new Date().toISOString() : null

  const { error: insertError } = await admin.from("applicants").insert({
    id: applicantId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    subjects: validSubjects.map(s => s.subject),
    grade_range: (payload.gradeLevels || []).join(", ") || null,
    rate: payload.rate,
    location_pref: payload.mode || null,
    area: payload.area || null,
    availability: (payload.availability || []).join(", ") || null,
    match_score: scoring.matchScore,
    score_rationale: scoring.scoreRationale,
    subject_scores: scoring.subjectScores,
    status,
    needs_review: scoring.needsReview,
    review_reason: scoring.reviewReason,
    dormant_since: dormantSince,
    source: "form",
    cv_file_name: cvUpload?.name ?? cvFile?.name ?? null,
    cv_file_url: cvUpload?.url ?? null,
    matric_file_name: matricUpload?.name ?? matricFile?.name ?? null,
    matric_file_url: matricUpload?.url ?? null,
    raw_submission: payload,
  })

  if (insertError) {
    console.error("Failed to insert applicant:", insertError.message)
    return NextResponse.json({ error: "Something went wrong saving your application." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
