import { generateContent } from "@/lib/ai"
import type { SubjectScoreEntry } from "@/lib/types"

// Cross-checks self-reported matric marks against the actual uploaded
// certificate. This is a trust/fraud-check layer, separate from
// lib/scoring.ts's deterministic formula — it never changes match_score or
// status, only needs_review + matric_verified.

const MISMATCH_THRESHOLD = 10 // percentage points

const SYSTEM_INSTRUCTIONS = `You are a document-reading assistant for SCOUT, a South African tutoring company's applicant-screening tool.
You will be shown an image or PDF of a matric (National Senior Certificate) results document.
For each subject listed in the prompt, read the percentage mark actually printed on the document for that exact subject name, if present.
Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "subjects": [
    { "subject": "<subject name, exactly as given in the prompt>", "markFound": <integer 0-100, or null if this subject isn't on the document>, "notes": "<short note if the document is unclear, unreadable, or doesn't look like a matric certificate, else empty string>" }
  ]
}`

function buildPrompt(subjects: string[]): string {
  return `Subjects to look for on this document: ${subjects.join(", ")}\n\nRead the document and return the JSON described in your instructions.`
}

export interface VerificationResult {
  // null = couldn't verify at all (no reportable marks, AI failure, or an unparseable response)
  verified: boolean | null
  mismatches: string[]
}

export async function verifyMatricMarks(
  subjectScores: SubjectScoreEntry[],
  fileBuffer: Buffer,
  mimeType: string
): Promise<VerificationResult> {
  const subjectsWithMarks = subjectScores.filter(s => s.matric_mark != null)
  if (subjectsWithMarks.length === 0) {
    return { verified: null, mismatches: [] }
  }

  let raw: string
  try {
    raw = await generateContent(
      buildPrompt(subjectsWithMarks.map(s => s.subject)),
      SYSTEM_INSTRUCTIONS,
      { mimeType, data: fileBuffer }
    )
  } catch (err) {
    console.error("Matric verification AI call failed:", err instanceof Error ? err.message : err)
    return { verified: null, mismatches: [] }
  }

  let parsed: { subjects?: unknown }
  try {
    const jsonText = raw.trim().replace(/^```json\s*|^```\s*|```$/g, "")
    parsed = JSON.parse(jsonText)
  } catch {
    console.error("Matric verification response was not valid JSON:", raw.slice(0, 500))
    return { verified: null, mismatches: [] }
  }

  if (!Array.isArray(parsed.subjects)) {
    console.error("Matric verification response missing a subjects array:", raw.slice(0, 500))
    return { verified: null, mismatches: [] }
  }

  const mismatches: string[] = []

  for (const entry of subjectsWithMarks) {
    const found = (parsed.subjects as unknown[]).find(
      s => typeof s === "object" && s !== null && (s as Record<string, unknown>).subject === entry.subject
    ) as Record<string, unknown> | undefined

    const markFound = found && typeof found.markFound === "number" ? found.markFound : null

    if (markFound == null) {
      mismatches.push(`${entry.subject}: not found on the uploaded certificate (self-reported ${entry.matric_mark}%).`)
      continue
    }

    if (Math.abs(markFound - (entry.matric_mark as number)) > MISMATCH_THRESHOLD) {
      mismatches.push(`${entry.subject}: self-reported ${entry.matric_mark}%, certificate shows ${markFound}%.`)
    }
  }

  return { verified: mismatches.length === 0, mismatches }
}
