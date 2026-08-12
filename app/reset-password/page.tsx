"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogoFull } from "@/components/Logo"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    setTimeout(() => router.replace("/dashboard"), 1500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "#F9F8F6" }}>
      <div className="w-full max-w-[380px]">
        <LogoFull className="h-9 w-auto mb-10" />

        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-5 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#E8F7EF" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 16l7 7 13-13" stroke="#1A7A47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "#3A3A3A" }}>Password updated</h2>
            <p className="text-sm" style={{ color: "#8A8580" }}>Taking you to the dashboard…</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-1" style={{ color: "#3A3A3A" }}>Set a new password</h1>
            <p className="text-sm mb-7" style={{ color: "#8A8580" }}>Choose a new password for your SCOUT account.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>New password</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-lg border text-sm"
                  style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
                  onFocus={e => (e.target.style.borderColor = "#FD3352")}
                  onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Confirm password</label>
                <input type="password" required placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-lg border text-sm"
                  style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
                  onFocus={e => (e.target.style.borderColor = "#FD3352")}
                  onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
              </div>
              {error && (
                <div className="px-3.5 py-3 rounded-lg text-sm" style={{ background: "#FDE8EC", color: "#B0253C" }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#FD3352", color: "#FFF" }}>
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
