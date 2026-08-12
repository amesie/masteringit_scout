"use client"

import { useMemo, useState } from "react"
import { Chip } from "./Pill"
import PhoneReveal from "./PhoneReveal"
import ApplicantDrawer from "./ApplicantDrawer"
import type { Applicant } from "@/lib/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
}

export default function OnFileTable({ initialApplicants }: { initialApplicants: Applicant[] }) {
  const [applicants, setApplicants] = useState(initialApplicants)
  const [search, setSearch] = useState("")
  const [subjectSearch, setSubjectSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = applicants.find(a => a.id === selectedId) ?? null

  const handleUpdated = (updated: Applicant) => {
    setApplicants(prev => prev.map(a => (a.id === updated.id ? updated : a)))
  }

  const handleDeleted = (id: string) => {
    setApplicants(prev => prev.filter(a => a.id !== id))
    setSelectedId(null)
  }

  const filtered = useMemo(() => {
    return applicants.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
      if (subjectSearch && !a.subjects.some(s => s.toLowerCase().includes(subjectSearch.toLowerCase()))) return false
      return true
    })
  }, [applicants, search, subjectSearch])

  return (
    <div>
      <p className="text-sm mb-5" style={{ color: "#8A8580" }}>
        Qualified applicants kept on file for future openings. Applicants dormant for 12+ months are flagged for your review — SCOUT never removes them automatically.
      </p>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="search" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-lg border text-sm w-48"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Filter by subject..." value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-lg border text-sm w-44"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E3DF", background: "#F5F4F2" }}>
              {["Name & Surname", "Subject(s)", "Area", "Contact", "Dormant Since", ""].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#8A8580" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "#8A8580" }}>
                  No applicants on file
                </td>
              </tr>
            ) : filtered.map((a, i) => (
              <tr key={a.id}
                className="transition-colors hover:bg-gray-50 cursor-pointer"
                style={{ borderTop: i > 0 ? "1px solid #F1F0EE" : undefined }}
                onClick={() => setSelectedId(a.id)}>
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold" style={{ color: "#3A3A3A" }}>{a.name}</span>
                  {a.needs_review && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: "#FDE8EC", color: "#B0253C" }}>
                      12mo review
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {a.subjects.map(s => (
                      <Chip key={s} bg="#E8F7EF" text="#1A7A47" label={s} />
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: "#8A8580" }}>{a.area || "—"}</span>
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
                  <span className="text-sm" style={{ color: "#8A8580" }}>{formatDate(a.dormant_since)}</span>
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
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ApplicantDrawer
          applicant={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted} />
      )}
    </div>
  )
}
