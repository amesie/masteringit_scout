import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { scoreApplication, type ScoringSubjectInput } from "@/lib/scoring"
import { sendApplicantConfirmation } from "@/lib/email"
import { verifyMatricMarks } from "@/lib/verification"
import { GRADES, CURRICULA, COUNTRIES, TEACHING_MODES } from "@/lib/intake-options"
import type { OpenNeed } from "@/lib/types"

interface ApplyPayload {
  name: string
  email: string
  phone: string
  country: string
  suburb: string
  availability: string[]
  mode: string
  subjects: ScoringSubjectInput[]
}

const MAX_NAME_LENGTH = 200
const MAX_SHORT_TEXT_LENGTH = 100
const MAX_EXPERIENCE_LENGTH = 5000
const MAX_SUBJECTS = 10
const MAX_AVAILABILITY_ITEMS = 20
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Rejects malformed/oversized/out-of-domain input from this public,
// unauthenticated endpoint. Subject/suburb names themselves aren't strictly
// allowlisted, since the form's "Other" option intentionally lets applicants
// submit free text there — just length-capped like every other text field.
function validatePayload(payload: ApplyPayload): string | null {
  if (typeof payload.name !== "string" || !payload.name.trim() || payload.name.length > MAX_NAME_LENGTH) {
    return "Please provide a valid name."
  }
  if (typeof payload.email !== "string" || !EMAIL_REGEX.test(payload.email.trim()) || payload.email.length > 320) {
    return "Please provide a valid email address."
  }
  if (typeof payload.phone !== "string" || !payload.phone.trim() || payload.phone.length > 30) {
    return "Please provide a valid phone number."
  }
  if (payload.country != null && (typeof payload.country !== "string" || !COUNTRIES.includes(payload.country))) {
    return "Please select a valid country."
  }
  if (payload.suburb != null && (typeof payload.suburb !== "string" || payload.suburb.length > MAX_SHORT_TEXT_LENGTH)) {
    return "Please provide a valid suburb."
  }
  if (payload.mode != null && (typeof payload.mode !== "string" || !TEACHING_MODES.includes(payload.mode))) {
    return "Please select a valid teaching mode."
  }
  if (
    !Array.isArray(payload.availability) ||
    payload.availability.length > MAX_AVAILABILITY_ITEMS ||
    payload.availability.some(a => typeof a !== "string" || a.length > 50)
  ) {
    return "Invalid availability data."
  }
  if (!Array.isArray(payload.subjects) || payload.subjects.length === 0 || payload.subjects.length > MAX_SUBJECTS) {
    return `Please add between 1 and ${MAX_SUBJECTS} subjects.`
  }

  for (const s of payload.subjects) {
    if (typeof s.subject !== "string" || !s.subject.trim() || s.subject.length > MAX_SHORT_TEXT_LENGTH) {
      return "Each subject must have a valid name."
    }
    if (s.experience != null && (typeof s.experience !== "string" || s.experience.length > MAX_EXPERIENCE_LENGTH)) {
      return "Experience notes are too long."
    }
    if (s.curriculum != null && (typeof s.curriculum !== "string" || !CURRICULA.includes(s.curriculum))) {
      return "Please select a valid curriculum."
    }
    if (s.grades != null && (!Array.isArray(s.grades) || s.grades.some(g => typeof g !== "string" || !GRADES.includes(g)))) {
      return "Invalid grade selection."
    }
    if (s.tertiary != null && typeof s.tertiary !== "boolean") {
      return "Invalid tertiary value."
    }
    if (s.matricMark != null) {
      const mark = Number(s.matricMark)
      if (!Number.isFinite(mark) || mark < 0 || mark > 100) {
        return "Matric mark must be a number between 0 and 100."
      }
    }
  }

  return null
}

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
])
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

function validateFile(file: File, label: string): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${label} is too large — please keep it under 10MB.`
  }
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    return `${label} must be a PDF, Word document, or image (JPG/PNG).`
  }
  return null
}

// Storage keys are built from this — never trust a client-supplied filename
// as-is.
function sanitizeFileName(name: string): string {
  return name.slice(-150).replace(/[^a-zA-Z0-9.\-_ ]/g, "_")
}

async function uploadFile(
  admin: ReturnType<typeof createAdminClient>,
  applicantId: string,
  kind: "cv" | "matric",
  file: File
): Promise<{ name: string; url: string } | null> {
  const path = `${applicantId}/${kind}-${sanitizeFileName(file.name)}`
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

  const validationError = validatePayload(payload)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  if (cvFile) {
    const fileError = validateFile(cvFile, "CV")
    if (fileError) return NextResponse.json({ error: fileError }, { status: 400 })
  }
  if (matricFile) {
    const fileError = validateFile(matricFile, "Matric certificate")
    if (fileError) return NextResponse.json({ error: fileError }, { status: 400 })
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
  const location = [payload.suburb, payload.country].filter(Boolean).join(", ")

  const scoring = canScore
    ? await scoreApplication(
        {
          name: payload.name,
          subjects: validSubjects,
          location,
          availability: payload.availability || [],
          mode: payload.mode,
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

  // Every new application starts in the plain Applicants queue for staff to
  // review — match score/matchesOpenNeed are still computed and shown, but
  // no longer auto-route the applicant to dormant/On File at intake. That
  // only happens now via an explicit staff action (marking Shortlisted, or
  // "Keep on File" on a subject).
  const status = "active"
  const dormantSince = null

  const { error: insertError } = await admin.from("applicants").insert({
    id: applicantId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    subjects: validSubjects.map(s => s.subject),
    location_pref: payload.mode || null,
    country: payload.country || null,
    suburb: payload.suburb || null,
    area: location || null,
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

  // The application is already saved at this point — a failure to send the
  // confirmation email shouldn't fail the submission the applicant sees.
  try {
    await sendApplicantConfirmation(payload.email, payload.name)
  } catch (err) {
    console.error("Failed to send applicant confirmation email:", err instanceof Error ? err.message : err)
  }

  // Best-effort: cross-check self-reported marks against the certificate
  // itself, reusing the file already in memory rather than re-downloading
  // it from storage. Never blocks or fails the submission — a failure here
  // just leaves matric_verified null (not yet checked).
  if (matricFile && scoring.subjectScores.length > 0) {
    try {
      const fileBuffer = Buffer.from(await matricFile.arrayBuffer())
      const verification = await verifyMatricMarks(
        scoring.subjectScores,
        fileBuffer,
        matricFile.type || "application/octet-stream"
      )

      if (verification.verified != null) {
        const reviewReason =
          verification.mismatches.length > 0
            ? [scoring.reviewReason, `Matric verification found discrepancies: ${verification.mismatches.join(" ")}`]
                .filter(Boolean)
                .join(" ")
            : scoring.reviewReason

        await admin
          .from("applicants")
          .update({
            matric_verified: verification.verified,
            needs_review: scoring.needsReview || !verification.verified,
            review_reason: reviewReason,
          })
          .eq("id", applicantId)
      }
    } catch (err) {
      console.error("Matric verification failed:", err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json({ ok: true })
}
