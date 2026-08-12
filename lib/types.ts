export type ApplicantStatus =
  | "active"
  | "shortlisted"
  | "interviewed"
  | "rejected"
  | "dormant"
  | "archived"

export type SubjectMatchStatus = "meets" | "review" | "missing" | "not-qualified"

export interface SubjectScoreEntry {
  subject: string
  status: SubjectMatchStatus
  matric_result: string
  experience: string
  rationale: string
}

export interface Applicant {
  id: string
  name: string
  email: string | null
  phone: string | null
  contact: string | null
  subjects: string[]
  grade_range: string | null
  rate: number | null
  location_pref: string | null
  area: string | null
  availability: string | null
  match_score: number | null
  score_rationale: string | null
  subject_scores: SubjectScoreEntry[]
  status: ApplicantStatus
  needs_review: boolean
  review_reason: string | null
  applied_at: string
  dormant_since: string | null
  last_contacted: string | null
  source: string
  cv_file_name: string | null
  cv_file_url: string | null
  matric_file_name: string | null
  matric_file_url: string | null
  raw_submission: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type UserRole = "owner" | "staff"
export type UserStatus = "active" | "invited" | "revoked"

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: UserStatus
  created_at: string
}

export interface OpenNeed {
  id: string
  subject: string
  grade_range: string | null
  min_score: number
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}
