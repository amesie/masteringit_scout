"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SUBJECT_STATUS_CONFIG, APPLICANT_STATUS_CONFIG } from "@/lib/status"
import type { Applicant, ApplicantStatus, SubjectMatchStatus, SubjectScoreEntry } from "@/lib/types"
import { updateApplicantStatus, updateSubjectScores, markContacted, getDocumentUrl } from "./applicantActions"
import { Pill } from "./Pill"

const STATUS_OPTIONS: ApplicantStatus[] = [
  "active",
  "shortlisted",
  "interviewed",
  "rejected",
  "dormant",
  "archived",
]

function CopiedToast({ visible }: { visible: boolean }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-all duration-300 z-50"
      style={{ background: "#3A3A3A", opacity: visible ? 1 : 0, pointerEvents: "none", transform: "translateX(-50%)" }}>
      Copied to clipboard
    </div>
  )
}

type SubjectAction = "qualify" | "not-fit" | "more-info"

function SubjectCard({ entry, hasMatricFile, onAction }: {
  entry: SubjectScoreEntry
  hasMatricFile: boolean
  onAction: (action: SubjectAction) => void
}) {
  const [busy, setBusy] = useState(false)
  const cfg = SUBJECT_STATUS_CONFIG[entry.status]

  const handleAction = async (action: SubjectAction) => {
    setBusy(true)
    await onAction(action)
    setBusy(false)
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E3DF" }}>
      <div className="flex items-start justify-between gap-3 px-5 py-4"
        style={{ background: "#FAFAF8", borderBottom: "1px solid #E5E3DF" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#3A3A3A" }}>{entry.subject}</p>
          <p className="text-xs mt-0.5" style={{ color: "#8A8580" }}>{entry.matric_result}</p>
        </div>
        <Pill bg={cfg.bg} text={cfg.text} label={cfg.label} />
      </div>

      <div className="px-5 py-4 flex flex-col gap-4" style={{ background: "#FFF" }}>
        {entry.status === "review" && entry.rationale && (
          <div className="px-4 py-3 rounded-lg border-l-4" style={{ background: "#FFF8E1", borderColor: "#FFE22B" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#A0620A" }}>Needs Review</p>
            <p className="text-xs leading-relaxed" style={{ color: "#A0620A" }}>{entry.rationale}</p>
          </div>
        )}

        {entry.status === "missing" && !hasMatricFile && (
          <div className="px-4 py-3 rounded-lg border-l-4" style={{ background: "#F1F0EE", borderColor: "#C5C2BD" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5A5652" }}>Missing Information</p>
            <p className="text-xs" style={{ color: "#5A5652" }}>Matric certificate has not been uploaded — result unverified.</p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#8A8580" }}>Experience note</p>
          <p className="text-sm leading-relaxed" style={{ color: "#3A3A3A" }}>{entry.experience || "—"}</p>
        </div>

        {entry.rationale && entry.status !== "review" && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#8A8580" }}>SCOUT rationale</p>
            <p className="text-sm leading-relaxed" style={{ color: "#3A3A3A" }}>{entry.rationale}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5 pt-1 border-t" style={{ borderColor: "#F1F0EE" }}>
          <button onClick={() => handleAction("qualify")} disabled={busy}
            className="w-full py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#1A7A47", color: "#FFF" }}>
            Mark as Qualified — Keep on File
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => handleAction("more-info")} disabled={busy}
              className="py-2.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-60"
              style={{ borderColor: "#E5E3DF", color: "#3A3A3A", background: "#FFF" }}>
              Needs More Info
            </button>
            <button onClick={() => handleAction("not-fit")} disabled={busy}
              className="py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#FDE8EC", color: "#B0253C" }}>
              Not a Fit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

async function openDocument(path: string | null) {
  if (!path) return
  const url = await getDocumentUrl(path)
  if (url) window.open(url, "_blank", "noopener,noreferrer")
}

export default function ApplicantDrawer({
  applicant,
  onClose,
  onUpdated,
}: {
  applicant: Applicant
  onClose: () => void
  onUpdated: (updated: Applicant) => void
}) {
  const [copied, setCopied] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [contactSaving, setContactSaving] = useState(false)

  const copy = (val: string) => {
    navigator.clipboard.writeText(val).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qualified = applicant.subject_scores.filter(s => s.status === "meets").length
  const total = applicant.subject_scores.length
  const statusCfg = APPLICANT_STATUS_CONFIG[applicant.status]

  const handleStatusChange = async (status: ApplicantStatus) => {
    setStatusSaving(true)
    const supabase = createClient()
    const { error } = await updateApplicantStatus(supabase, applicant.id, status)
    setStatusSaving(false)
    if (!error) {
      onUpdated({
        ...applicant,
        status,
        dormant_since: status === "dormant" ? new Date().toISOString() : null,
      })
    }
  }

  const handleMarkContacted = async () => {
    setContactSaving(true)
    const supabase = createClient()
    const { error } = await markContacted(supabase, applicant.id)
    setContactSaving(false)
    if (!error) {
      onUpdated({ ...applicant, last_contacted: new Date().toISOString() })
    }
  }

  const handleSubjectAction = async (subjectName: string, action: SubjectAction) => {
    const newStatus: SubjectMatchStatus =
      action === "qualify" ? "meets" : action === "not-fit" ? "not-qualified" : "missing"

    const updatedScores = applicant.subject_scores.map(s =>
      s.subject === subjectName ? { ...s, status: newStatus } : s
    )

    const supabase = createClient()
    const { error } = await updateSubjectScores(supabase, applicant.id, updatedScores)
    if (!error) {
      onUpdated({ ...applicant, subject_scores: updatedScores })
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: "rgba(58,58,58,0.25)" }} onClick={onClose} />

      <div className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-[560px] overflow-y-auto flex flex-col"
        style={{ background: "#FFFFFF", boxShadow: "-4px 0 32px rgba(58,58,58,0.1)" }}>

        <div className="flex items-start justify-between px-8 py-6 border-b" style={{ borderColor: "#E5E3DF" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#3A3A3A" }}>{applicant.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: "#8A8580" }}>
              {total <= 1
                ? applicant.subject_scores[0]?.subject ?? "No subjects on file"
                : `${total} subjects — ${qualified} of ${total} qualified`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 flex-shrink-0 ml-4"
            aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 px-8 py-6 flex flex-col gap-7">
          {applicant.needs_review && (
            <div className="px-4 py-3 rounded-lg border-l-4" style={{ background: "#FFF8E1", borderColor: "#FFE22B" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#A0620A" }}>Needs Review</p>
              <p className="text-xs leading-relaxed" style={{ color: "#A0620A" }}>
                {applicant.review_reason || "SCOUT flagged this applicant for manual review."}
              </p>
            </div>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>Status</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select value={applicant.status} disabled={statusSaving}
                  onChange={e => handleStatusChange(e.target.value as ApplicantStatus)}
                  className="appearance-none pl-3.5 pr-8 py-2.5 rounded-lg border text-sm font-medium"
                  style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{APPLICANT_STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="#8A8580" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <Pill bg={statusCfg.bg} text={statusCfg.text} label={statusCfg.label} />
              <button onClick={handleMarkContacted} disabled={contactSaving}
                className="ml-auto text-xs font-medium hover:underline disabled:opacity-60" style={{ color: "#FD3352" }}>
                Mark contacted
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: "#8A8580" }}>
              {applicant.last_contacted
                ? `Last contacted ${new Date(applicant.last_contacted).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`
                : "Not yet contacted"}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>Contact</h3>
            <div className="flex flex-col gap-2">
              {[
                { icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z", value: applicant.email },
                { icon: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z", value: applicant.phone },
              ].filter(f => f.value).map(({ icon, value }) => (
                <div key={value} className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg"
                  style={{ background: "#F9F8F6" }}>
                  <div className="flex items-center gap-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580", flexShrink: 0 }}>
                      <path d={icon} fill="currentColor"/>
                    </svg>
                    <span className="text-sm" style={{ color: "#3A3A3A" }}>{value}</span>
                  </div>
                  <button onClick={() => copy(value as string)} className="text-xs font-medium hover:underline" style={{ color: "#FD3352" }}>Copy</button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>Details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Area", value: applicant.area || "—" },
                { label: "Mode", value: applicant.location_pref || "—" },
                { label: "Availability", value: applicant.availability || "—" },
                { label: "Rate", value: applicant.rate != null ? `R${applicant.rate}/hr` : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs" style={{ color: "#8A8580" }}>{label}</dt>
                  <dd className="text-sm font-medium mt-0.5" style={{ color: "#3A3A3A" }}>{value}</dd>
                </div>
              ))}
              <div className="col-span-2">
                <dt className="text-xs" style={{ color: "#8A8580" }}>Grade levels</dt>
                <dd className="flex flex-wrap gap-1.5 mt-1">
                  {(applicant.grade_range || "").split(",").filter(Boolean).map(g => (
                    <span key={g} className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: "#F1F0EE", color: "#3A3A3A" }}>{g.trim()}</span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>
              {total <= 1 ? "Subject" : `Subjects (${total})`}
            </h3>
            <div className="flex flex-col gap-3">
              {applicant.subject_scores.map(entry => (
                <SubjectCard
                  key={entry.subject}
                  entry={entry}
                  hasMatricFile={!!applicant.matric_file_url}
                  onAction={action => handleSubjectAction(entry.subject, action)} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>Documents</h3>
            <div className="flex flex-col gap-2">
              {applicant.cv_file_url ? (
                <button onClick={() => openDocument(applicant.cv_file_url)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors hover:border-[#FD3352] group text-left"
                  style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "#3A3A3A" }}>{applicant.cv_file_name}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-auto opacity-40 group-hover:opacity-100" style={{ color: "#FD3352" }}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border" style={{ borderColor: "#E5E3DF", background: "#FAFAF8" }}>
                  <span className="text-sm" style={{ color: "#8A8580" }}>CV — not uploaded</span>
                </div>
              )}
              {applicant.matric_file_url ? (
                <button onClick={() => openDocument(applicant.matric_file_url)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors hover:border-[#FD3352] group text-left"
                  style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "#3A3A3A" }}>{applicant.matric_file_name}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-auto opacity-40 group-hover:opacity-100" style={{ color: "#FD3352" }}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border" style={{ borderColor: "#E5E3DF", background: "#FAFAF8" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#C5C2BD" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm" style={{ color: "#8A8580" }}>Matric certificate — not uploaded</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <CopiedToast visible={copied} />
    </>
  )
}
