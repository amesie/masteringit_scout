"use client"

import { useState } from "react"
import { Pill } from "./Pill"
import type { Profile, UserRole, UserStatus } from "@/lib/types"

const STATUS_STYLE: Record<UserStatus, { bg: string; text: string; label: string }> = {
  active: { bg: "#E8F7EF", text: "#1A7A47", label: "Active" },
  invited: { bg: "#FFF8E1", text: "#A0620A", label: "Invited" },
  revoked: { bg: "#F1F0EE", text: "#5A5652", label: "Revoked" },
}

const ROLE_STYLE: Record<UserRole, { bg: string; text: string; label: string }> = {
  owner: { bg: "#FDE8EC", text: "#B0253C", label: "Owner" },
  staff: { bg: "#F1F0EE", text: "#5A5652", label: "Staff / Screener" },
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
}

function RevokeConfirmModal({ user, onConfirm, onCancel, busy }: {
  user: Profile
  onConfirm: () => void
  onCancel: () => void
  busy: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: "rgba(58,58,58,0.3)" }} onClick={onCancel} />
      <div className="fixed z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] rounded-2xl p-8"
        style={{ background: "#FFF", boxShadow: "0 8px 40px rgba(58,58,58,0.15)" }}>
        <div className="mb-1 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "#FDE8EC" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#B0253C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-base font-semibold mt-3 mb-1.5" style={{ color: "#3A3A3A" }}>Revoke access?</h3>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "#8A8580" }}>
          <span className="font-medium" style={{ color: "#3A3A3A" }}>{user.name || user.email}</span>
          {" will immediately lose access to SCOUT. This cannot be undone without re-inviting them."}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={busy}
            className="flex-1 py-3 rounded-lg text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-60"
            style={{ borderColor: "#E5E3DF", color: "#3A3A3A", background: "#FFF" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#B0253C", color: "#FFF" }}>
            {busy ? "Revoking…" : "Revoke access"}
          </button>
        </div>
      </div>
    </>
  )
}

function AddUserModal({ onClose, onAdded }: {
  onClose: () => void
  onAdded: (user: Profile) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    })
    const body = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(body.error || "Could not send invite.")
      return
    }

    onAdded({
      id: body.user.id,
      name: body.user.name,
      email: body.user.email,
      role: "staff",
      status: "invited",
      created_at: new Date().toISOString(),
    })
    setSent(true)
  }

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: "rgba(58,58,58,0.3)" }} onClick={onClose} />
      <div className="fixed z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] rounded-2xl overflow-hidden"
        style={{ background: "#FFF", boxShadow: "0 8px 40px rgba(58,58,58,0.15)" }}>

        <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: "#E5E3DF" }}>
          <h3 className="text-base font-semibold" style={{ color: "#3A3A3A" }}>
            {sent ? "Invite sent" : "Add a user"}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
            aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "#E8F7EF" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#1A7A47"/>
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "#3A3A3A" }}>
              Invite sent to <span style={{ color: "#FD3352" }}>{email}</span>
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#8A8580" }}>
              {name} will receive an email to set their own password and activate their account.
            </p>
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#FD3352", color: "#FFF" }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Full name</label>
              <input type="text" required placeholder="e.g. Lindi Dlamini"
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-3 rounded-lg border text-sm"
                style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "#FD3352")}
                onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Email address</label>
              <input type="email" required placeholder="lindi@masteringit.co.za"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 rounded-lg border text-sm"
                style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "#FD3352")}
                onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Role</label>
              <div className="relative">
                <select disabled value="staff"
                  className="w-full appearance-none px-3.5 pr-9 py-3 rounded-lg border text-sm"
                  style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}>
                  <option value="staff">Staff / Screener</option>
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="#8A8580" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "#8A8580" }}>
                Owner role is not assignable here. Staff can screen applicants but cannot manage users.
              </p>
            </div>

            {error && (
              <div className="px-3.5 py-3 rounded-lg text-sm" style={{ background: "#FDE8EC", color: "#B0253C" }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} disabled={loading}
                className="flex-1 py-3 rounded-lg text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-60"
                style={{ borderColor: "#E5E3DF", color: "#3A3A3A", background: "#FFF" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#FD3352", color: "#FFF" }}>
                {loading ? "Sending…" : "Send invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

export default function ManageUsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [showAddModal, setShowAddModal] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<Profile | null>(null)
  const [revoking, setRevoking] = useState(false)

  const handleAdded = (user: Profile) => {
    setUsers(prev => [...prev, user])
  }

  const handleRevoke = async (id: string) => {
    setRevoking(true)
    const res = await fetch(`/api/users/${id}`, { method: "PATCH" })
    setRevoking(false)
    if (res.ok) {
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, status: "revoked" as UserStatus } : u)))
    }
    setRevokeTarget(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "#3A3A3A" }}>Team & Access</h2>
          <p className="text-sm mt-0.5" style={{ color: "#8A8580" }}>Manage who can access SCOUT and what they can do.</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#FD3352", color: "#FFF" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add user
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E3DF", background: "#FAFAF8" }}>
              {["Name", "Email", "Role", "Status", "Date Added", ""].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#8A8580" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const statusStyle = STATUS_STYLE[u.status]
              const roleStyle = ROLE_STYLE[u.role]
              const canRevoke = u.role !== "owner" && u.status !== "revoked"
              return (
                <tr key={u.id} style={{ borderTop: i > 0 ? "1px solid #F1F0EE" : undefined }}>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold" style={{ color: "#3A3A3A" }}>{u.name || "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: "#8A8580" }}>{u.email}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Pill bg={roleStyle.bg} text={roleStyle.text} label={roleStyle.label} />
                  </td>
                  <td className="px-5 py-4">
                    <Pill bg={statusStyle.bg} text={statusStyle.text} label={statusStyle.label} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: "#8A8580" }}>{formatDate(u.created_at)}</span>
                  </td>
                  <td className="px-5 py-4">
                    {canRevoke ? (
                      <button onClick={() => setRevokeTarget(u)}
                        className="text-xs font-medium transition-colors hover:underline"
                        style={{ color: "#B0253C" }}>
                        Revoke access
                      </button>
                    ) : u.status === "revoked" ? (
                      <span className="text-xs" style={{ color: "#C5C2BD" }}>Access revoked</span>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 px-5 py-4 rounded-xl border" style={{ borderColor: "#E5E3DF", background: "#FAFAF8" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>Role permissions</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { role: "Owner", items: ["View & screen all applicants", "Manage hiring needs & CSV import", "Access On File list", "Add & remove users"] },
            { role: "Staff / Screener", items: ["View & screen all applicants", "Manage hiring needs & CSV import", "Access On File list", "No access to user management"] },
          ].map(({ role, items }) => (
            <div key={role}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#3A3A3A" }}>{role}</p>
              <ul className="flex flex-col gap-1">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#8A8580" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 flex-shrink-0">
                      <circle cx="6" cy="6" r="6" fill="#E5E3DF"/>
                      <path d="M3.5 6l1.5 1.5 3.5-3" stroke="#8A8580" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
      )}

      {revokeTarget && (
        <RevokeConfirmModal
          user={revokeTarget}
          busy={revoking}
          onConfirm={() => handleRevoke(revokeTarget.id)}
          onCancel={() => setRevokeTarget(null)} />
      )}
    </div>
  )
}
