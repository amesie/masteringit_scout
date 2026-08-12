"use client"

import { useState } from "react"
import type { OpenNeed } from "@/lib/types"

export default function OpenNeedsClient({ initialNeeds }: { initialNeeds: OpenNeed[] }) {
  const [needs, setNeeds] = useState(initialNeeds)
  const [subject, setSubject] = useState("")
  const [gradeRange, setGradeRange] = useState("")
  const [minScore, setMinScore] = useState("70")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/open-needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, gradeRange, minScore: Number(minScore), notes }),
    })
    const body = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(body.error || "Could not add this need.")
      return
    }

    setNeeds(prev => [...prev, body.need])
    setSubject("")
    setGradeRange("")
    setMinScore("70")
    setNotes("")
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    setNeeds(prev => prev.map(n => (n.id === id ? { ...n, is_active: isActive } : n)))
    await fetch(`/api/open-needs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    })
  }

  const remove = async (id: string) => {
    setNeeds(prev => prev.filter(n => n.id !== id))
    await fetch(`/api/open-needs/${id}`, { method: "DELETE" })
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold" style={{ color: "#3A3A3A" }}>Current hiring needs</h2>
        <p className="text-sm mt-0.5" style={{ color: "#8A8580" }}>
          SCOUT scores every new applicant against this list. A subject match at or above its minimum score sends the applicant straight to Active; otherwise they go to On File as dormant until a matching need opens up.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 mb-6 p-4 rounded-xl border" style={{ borderColor: "#E5E3DF", background: "#FAFAF8" }}>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Subject</label>
          <input type="text" required placeholder="Mathematics" value={subject} onChange={e => setSubject(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm w-40"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Grade range</label>
          <input type="text" placeholder="Gr 10–12" value={gradeRange} onChange={e => setGradeRange(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm w-32"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Min. score</label>
          <input type="number" min={0} max={100} value={minScore} onChange={e => setMinScore(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm w-24"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }} />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Notes (optional)</label>
          <input type="text" placeholder="e.g. urgent, Sandton branch" value={notes} onChange={e => setNotes(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm w-full"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }} />
        </div>
        <button type="submit" disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "#FD3352", color: "#FFF" }}>
          {loading ? "Adding…" : "Add need"}
        </button>
      </form>

      {error && (
        <div className="mb-6 px-3.5 py-3 rounded-lg text-sm" style={{ background: "#FDE8EC", color: "#B0253C" }}>
          {error}
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E3DF", background: "#FAFAF8" }}>
              {["Subject", "Grade range", "Min. score", "Notes", "Active", ""].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#8A8580" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {needs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "#8A8580" }}>
                  No hiring needs recorded yet — every new applicant will land as dormant until you add some.
                </td>
              </tr>
            ) : needs.map((n, i) => (
              <tr key={n.id} style={{ borderTop: i > 0 ? "1px solid #F1F0EE" : undefined }}>
                <td className="px-5 py-4 text-sm font-semibold" style={{ color: "#3A3A3A" }}>{n.subject}</td>
                <td className="px-5 py-4 text-sm" style={{ color: "#8A8580" }}>{n.grade_range || "—"}</td>
                <td className="px-5 py-4 text-sm" style={{ color: "#8A8580" }}>{n.min_score}</td>
                <td className="px-5 py-4 text-sm" style={{ color: "#8A8580" }}>{n.notes || "—"}</td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleActive(n.id, !n.is_active)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: n.is_active ? "#E8F7EF" : "#F1F0EE",
                      color: n.is_active ? "#1A7A47" : "#5A5652",
                    }}>
                    {n.is_active ? "Active" : "Paused"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => remove(n.id)} className="text-xs font-medium hover:underline" style={{ color: "#B0253C" }}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
