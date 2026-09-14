import type { Applicant, ApplicantStatus, SubjectMatchStatus } from "@/lib/types"

// Structured country/suburb (new /apply submissions) take priority — but
// only once a suburb is actually set. Older/CSV-imported rows only ever had
// the freeform `area` text; falling back on `country` alone would show a
// bare "South Africa" and hide the real imported location.
export function applicantLocation(a: Pick<Applicant, "country" | "suburb" | "area">): string {
  if (a.suburb) return [a.suburb, a.country].filter(Boolean).join(", ")
  return a.area || "—"
}

// Subject-level match status — lifted directly from the Figma prototype's
// STATUS_CONFIG (design-reference/src/components/Dashboard.tsx).
export const SUBJECT_STATUS_CONFIG: Record<
  SubjectMatchStatus,
  { label: string; bg: string; text: string }
> = {
  meets: { label: "Meets Criteria", bg: "#E8F7EF", text: "#1A7A47" },
  review: { label: "Review — Below Threshold", bg: "#FFF8E1", text: "#A0620A" },
  missing: { label: "Missing Info", bg: "#F1F0EE", text: "#5A5652" },
  "not-qualified": { label: "Not Qualified", bg: "#FDE8EC", text: "#B0253C" },
}

// Applicant lifecycle status — extends the same visual language (light
// tint + saturated text) to the six statuses from the build spec.
export const APPLICANT_STATUS_CONFIG: Record<
  ApplicantStatus,
  { label: string; bg: string; text: string }
> = {
  active: { label: "Active", bg: "#E8F7EF", text: "#1A7A47" },
  shortlisted: { label: "Shortlisted", bg: "#E6F7FC", text: "#0E7490" },
  interviewed: { label: "Interviewed", bg: "#F3E8FD", text: "#6B21A8" },
  rejected: { label: "Rejected", bg: "#FDE8EC", text: "#B0253C" },
  dormant: { label: "Dormant", bg: "#F1F0EE", text: "#5A5652" },
  archived: { label: "Archived", bg: "#ECECEC", text: "#6B6763" },
}
