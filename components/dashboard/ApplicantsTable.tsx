"use client"

import { useMemo, useState } from "react"
import { SUBJECT_STATUS_CONFIG, APPLICANT_STATUS_CONFIG } from "@/lib/status"
import type { Applicant, ApplicantStatus } from "@/lib/types"
import { Pill, Chip } from "./Pill"
import PhoneReveal from "./PhoneReveal"
import ApplicantDrawer from "./ApplicantDrawer"

const STATUS_FILTERS: ApplicantStatus[] = ["active", "shortlisted", "interviewed", "rejected"]

export default function ApplicantsTable({ initialApplicants }: { initialApplicants: Applicant[] }) {
  const [applicants, setApplicants] = useState(initialApplicants)
  const [statusFilter, setStatusFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = applicants.find(a => a.id === selectedId) ?? null

  const handleUpdated = (updated: Applicant) => {
    setApplicants(prev => prev.map(a => (a.id === updated.id ? updated : a)))
  }

  const filtered = useMemo(() => {
    return applicants.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
      if (subjectFilter && !a.subjects.some(s => s.toLowerCase().includes(subjectFilter.toLowerCase()))) return false
      if (statusFilter !== "all" && a.status !== statusFilter) return false
      return true
    })
  }, [applicants, search, subjectFilter, statusFilter])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 rounded-lg border text-sm font-medium"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}>
            <option value="all">All statuses</option>
            {STATUS_FILTERS.map(s => (
              <option key={s} value={s}>{APPLICANT_STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="#8A8580" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Filter by subject..." value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-lg border text-sm w-44"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>

        <div className="relative ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="search" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-lg border text-sm w-56"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E3DF", background: "#FAFAF8" }}>
              {["Name & Surname", "Status", "Subjects", "Area", "Top Rationale", "Contact", ""].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#8A8580" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: "#8A8580" }}>
                  No applicants match these filters
                </td>
              </tr>
            ) : filtered.map((a, i) => {
              const qualCount = a.subject_scores.filter(s => s.status === "meets").length
              const total = a.subject_scores.length
              const primaryEntry = a.subject_scores.find(s => s.status !== "meets") ?? a.subject_scores[0]
              const statusCfg = APPLICANT_STATUS_CONFIG[a.status]

              return (
                <tr key={a.id}
                  className="transition-colors hover:bg-gray-50 cursor-pointer"
                  style={{ borderTop: i > 0 ? "1px solid #F1F0EE" : undefined }}
                  onClick={() => setSelectedId(a.id)}>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold" style={{ color: "#3A3A3A" }}>{a.name}</span>
                    {a.needs_review && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{ background: "#FFF8E1", color: "#A0620A" }}>
                        Needs review
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Pill bg={statusCfg.bg} text={statusCfg.text} label={statusCfg.label} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {a.subject_scores.length > 0 ? a.subject_scores.map(s => (
                        <Chip key={s.subject} bg={SUBJECT_STATUS_CONFIG[s.status].bg} text={SUBJECT_STATUS_CONFIG[s.status].text} label={s.subject} />
                      )) : a.subjects.map(s => (
                        <Chip key={s} bg="#F1F0EE" text="#5A5652" label={s} />
                      ))}
                    </div>
                    {total > 1 && (
                      <p className="text-xs" style={{ color: qualCount === total ? "#1A7A47" : "#8A8580" }}>
                        {qualCount} of {total} subjects qualified
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: "#8A8580" }}>{a.area || "—"}</span>
                  </td>
                  <td className="px-5 py-4 max-w-[200px]">
                    <span className="text-xs leading-relaxed" style={{ color: "#8A8580" }}>
                      {primaryEntry?.rationale || a.score_rationale || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      {a.email && (
                        <a href={`mailto:${a.email}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                          style={{ color: "#8A8580" }} title={a.email}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                          </svg>
                        </a>
                      )}
                      <PhoneReveal phone={a.phone} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#FD3352]"
                      style={{ color: "#8A8580" }}>
                      View
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <ApplicantDrawer
          applicant={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated} />
      )}
    </div>
  )
}
