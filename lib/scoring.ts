import type { OpenNeed, SubjectMatchStatus, SubjectScoreEntry } from "@/lib/types"

// Deterministic scoring — 4 categories worth 25 points each, no AI call.
// Replaces the old Gemini-judged scoring: fully explainable, and doesn't
// depend on an external model being reachable.

export interface ScoringSubjectInput {
  subject: string
  experience: string
  grades?: string[]
  tertiary?: boolean
  curriculum?: string
  matricMark?: number
}

export interface ScoringInput {
  name: string
  subjects: ScoringSubjectInput[]
  location: string
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

// Flat, global pass mark for "qualified" in any subject — one number for
// every subject/grade, per how the business actually wants this to work.
const QUALIFYING_MATRIC_MARK = 70
// Within this many points below the threshold, a subject is "review" rather
// than outright "not-qualified".
const REVIEW_BAND = 10

function deriveStatus(matricMark: number | null): SubjectMatchStatus {
  if (matricMark == null) return "missing"
  if (matricMark >= QUALIFYING_MATRIC_MARK) return "meets"
  if (matricMark >= QUALIFYING_MATRIC_MARK - REVIEW_BAND) return "review"
  return "not-qualified"
}

function gradesOverlap(
  subjectGrades: string[],
  subjectTertiary: boolean,
  needGrades: string[],
  needTertiary: boolean
): boolean {
  if (subjectTertiary && needTertiary) return true
  return subjectGrades.some(g => needGrades.includes(g))
}

interface NeedMatch {
  need: OpenNeed | null
  subjectMatch: number
  gradeMatch: number
  notesMatch: number
}

const MODE_KEYWORDS: Record<string, string[]> = {
  Online: ["online"],
  "In-person": ["in-person", "in person"],
  Both: ["online", "in-person", "in person", "both"],
}

function scoreAgainstNeed(input: ScoringSubjectInput, mode: string, location: string, need: OpenNeed): NeedMatch {
  const gradeMatch = gradesOverlap(input.grades ?? [], input.tertiary ?? false, need.grades, need.tertiary) ? 25 : 0

  const notes = (need.notes || "").toLowerCase()
  let notesMatch = 0
  if (notes) {
    if ((MODE_KEYWORDS[mode] ?? []).some(kw => notes.includes(kw))) notesMatch += 12.5

    const locationParts = location.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    if (locationParts.some(part => notes.includes(part))) notesMatch += 12.5
  }

  return { need, subjectMatch: 25, gradeMatch, notesMatch }
}

// Evaluates against every active need matching this subject and keeps
// whichever scores highest — an applicant shouldn't lose out because one of
// several open postings for the same subject happens to be a worse fit.
function bestNeedMatch(input: ScoringSubjectInput, mode: string, location: string, openNeeds: OpenNeed[]): NeedMatch {
  const candidates = openNeeds.filter(n => n.is_active && n.subject.toLowerCase() === input.subject.toLowerCase())
  if (candidates.length === 0) {
    return { need: null, subjectMatch: 0, gradeMatch: 0, notesMatch: 0 }
  }
  return candidates
    .map(need => scoreAgainstNeed(input, mode, location, need))
    .reduce((best, cur) =>
      cur.subjectMatch + cur.gradeMatch + cur.notesMatch > best.subjectMatch + best.gradeMatch + best.notesMatch
        ? cur
        : best
    )
}

function buildSubjectScore(
  input: ScoringSubjectInput,
  mode: string,
  location: string,
  hasMatric: boolean,
  openNeeds: OpenNeed[]
): SubjectScoreEntry {
  const matricMark =
    typeof input.matricMark === "number" && Number.isFinite(input.matricMark)
      ? Math.max(0, Math.min(100, input.matricMark))
      : null
  const markScore = matricMark != null ? Math.round((25 * matricMark) / 100) : 0
  const status = deriveStatus(matricMark)

  const match = bestNeedMatch(input, mode, location, openNeeds)
  const score = Math.round(markScore + match.subjectMatch + match.gradeMatch + match.notesMatch)

  const rationaleParts = [
    matricMark != null ? `Matric mark ${matricMark}% (${markScore}/25)` : "No matric mark provided (0/25)",
    match.need ? `Matches active ${match.need.subject} need (${match.subjectMatch}/25)` : "No matching open need (0/25)",
  ]
  if (match.need) {
    rationaleParts.push(`Grade range ${match.gradeMatch > 0 ? "matches" : "doesn't match"} (${match.gradeMatch}/25)`)
    rationaleParts.push(`Location/mode context (${match.notesMatch}/25)`)
  }

  return {
    subject: input.subject,
    status,
    matric_result: hasMatric ? "Uploaded — not yet reviewed" : "Not uploaded",
    matric_mark: matricMark,
    experience: input.experience,
    rationale: `${rationaleParts.join(" · ")} — ${score}/100`,
    grades: input.grades ?? [],
    tertiary: input.tertiary ?? false,
    curriculum: input.curriculum ?? "",
    score,
    score_breakdown: {
      markScore,
      subjectMatch: match.subjectMatch,
      gradeMatch: match.gradeMatch,
      notesMatch: match.notesMatch,
    },
  }
}

export async function scoreApplication(input: ScoringInput, openNeeds: OpenNeed[]): Promise<ScoringResult> {
  const subjectScores = input.subjects.map(s =>
    buildSubjectScore(s, input.mode, input.location, input.hasMatric, openNeeds)
  )

  if (subjectScores.length === 0) {
    return {
      matchScore: 0,
      scoreRationale: "No subjects were provided — needs manual review.",
      subjectScores: [],
      needsReview: true,
      reviewReason: "SCOUT could not confidently parse this application — no subjects were provided.",
      matchesOpenNeed: false,
    }
  }

  const best = subjectScores.reduce((a, b) => (b.score > a.score ? b : a))
  const bestNeed = openNeeds.find(n => n.is_active && n.subject.toLowerCase() === best.subject.toLowerCase())
  const matchesOpenNeed = !!bestNeed && best.status === "meets" && best.score >= bestNeed.min_score
  const needsReview = best.status === "missing"

  return {
    matchScore: best.score,
    scoreRationale: best.rationale,
    subjectScores,
    needsReview,
    reviewReason: needsReview
      ? "SCOUT could not score this application — no matric mark was provided for any subject. Needs manual review."
      : null,
    matchesOpenNeed,
  }
}
