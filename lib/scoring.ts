import { generateContent } from "@/lib/ai"
import type { OpenNeed, SubjectMatchStatus, SubjectScoreEntry } from "@/lib/types"

export interface ScoringSubjectInput {
  subject: string
  experience: string
}

export interface ScoringInput {
  name: string
  subjects: ScoringSubjectInput[]
  gradeLevels: string[]
  area: string
  availability: string[]
  mode: string
  hasMatric: boolean
}

export interface ScoringResult {
  matchScore: number
  scoreRationale: string
  subjectScores: SubjectScoreEntry[]
  needsReview: boolean
  reviewReason: string | null
  matchesOpenNeed: boolean
}

const VALID_STATUSES: SubjectMatchStatus[] = ["meets", "review", "missing", "not-qualified"]

const SYSTEM_INSTRUCTIONS = `You are SCOUT, the applicant-screening engine for MasteringIt, a South African tutoring company.
You assess a tutor applicant's self-reported subjects and experience against the company's current hiring criteria.
Be conservative: only mark a subject "meets" when experience is specific and credible (real qualifications, results, years tutoring).
Use "review" when experience is plausible but thin, unverified, or borderline.
Use "not-qualified" when experience clearly falls short.
Use "missing" when there isn't enough information to judge a subject at all, or the matric certificate wasn't uploaded and matric results matter for that subject.
Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "matchScore": <integer 0-100, overall applicant quality across all subjects>,
  "scoreRationale": "<one short sentence, e.g. '85% implied maths ability, 4 yrs experience'>",
  "confident": <boolean — false only if the submission is too sparse or contradictory to assess responsibly>,
  "subjects": [
    { "subject": "<subject name>", "status": "meets"|"review"|"missing"|"not-qualified", "rationale": "<short reason>", "matricResultNote": "<short note on matric relevance, or empty string>" }
  ]
}`

function buildPrompt(input: ScoringInput, openNeeds: OpenNeed[]): string {
  const needsList = openNeeds.length
    ? openNeeds
        .map(n => `- ${n.subject}${n.grade_range ? ` (${n.grade_range})` : ""} — minimum score ${n.min_score}`)
        .join("\n")
    : "(No specific open needs recorded — assess purely on merit.)"

  const subjectsList = input.subjects
    .map(s => `Subject: ${s.subject}\nApplicant's stated experience: ${s.experience || "(not provided)"}`)
    .join("\n\n")

  return `Current hiring needs:
${needsList}

Applicant: ${input.name}
Grade levels applied for: ${input.gradeLevels.join(", ") || "(not specified)"}
Area: ${input.area || "(not specified)"}
Availability: ${input.availability.join(", ") || "(not specified)"}
Teaching mode: ${input.mode || "(not specified)"}
Matric certificate uploaded: ${input.hasMatric ? "yes" : "no"}

${subjectsList}

Assess this applicant now and return the JSON described in your instructions.`
}

export async function scoreApplication(
  input: ScoringInput,
  openNeeds: OpenNeed[]
): Promise<ScoringResult> {
  const fallback: ScoringResult = {
    matchScore: 0,
    scoreRationale: "Automated scoring unavailable — needs manual review.",
    subjectScores: input.subjects.map(s => ({
      subject: s.subject,
      status: "missing" as SubjectMatchStatus,
      matric_result: input.hasMatric ? "Uploaded — not yet reviewed" : "Not uploaded",
      experience: s.experience,
      rationale: "Automated scoring unavailable.",
    })),
    needsReview: true,
    reviewReason: "SCOUT could not automatically score this application — needs manual review.",
    matchesOpenNeed: false,
  }

  let raw: string
  try {
    raw = await generateContent(buildPrompt(input, openNeeds), SYSTEM_INSTRUCTIONS)
  } catch {
    return fallback
  }

  let parsed: {
    matchScore?: unknown
    scoreRationale?: unknown
    confident?: unknown
    subjects?: unknown
  }
  try {
    const jsonText = raw.trim().replace(/^```json\s*|^```\s*|```$/g, "")
    parsed = JSON.parse(jsonText)
  } catch {
    return fallback
  }

  if (
    typeof parsed.matchScore !== "number" ||
    typeof parsed.scoreRationale !== "string" ||
    !Array.isArray(parsed.subjects)
  ) {
    return fallback
  }

  const subjectScores: SubjectScoreEntry[] = []
  for (const entry of parsed.subjects as unknown[]) {
    if (typeof entry !== "object" || entry === null) continue
    const s = entry as Record<string, unknown>
    const status = VALID_STATUSES.includes(s.status as SubjectMatchStatus)
      ? (s.status as SubjectMatchStatus)
      : "missing"
    const subjectName = typeof s.subject === "string" ? s.subject : ""
    if (!subjectName) continue
    const original = input.subjects.find(x => x.subject === subjectName)
    subjectScores.push({
      subject: subjectName,
      status,
      matric_result: input.hasMatric
        ? (typeof s.matricResultNote === "string" && s.matricResultNote) || "Uploaded — not yet reviewed"
        : "Not uploaded",
      experience: original?.experience ?? "",
      rationale: typeof s.rationale === "string" ? s.rationale : "",
    })
  }

  if (subjectScores.length === 0) {
    return fallback
  }

  const confident = parsed.confident !== false
  const matchScore = Math.max(0, Math.min(100, Math.round(parsed.matchScore)))

  const matchesOpenNeed = openNeeds.some(
    need =>
      need.is_active &&
      subjectScores.some(
        s => s.subject.toLowerCase() === need.subject.toLowerCase() && s.status === "meets"
      ) &&
      matchScore >= need.min_score
  )

  return {
    matchScore,
    scoreRationale: parsed.scoreRationale,
    subjectScores,
    needsReview: !confident,
    reviewReason: confident ? null : "SCOUT flagged this application for manual review — low confidence in the automated assessment.",
    matchesOpenNeed,
  }
}
