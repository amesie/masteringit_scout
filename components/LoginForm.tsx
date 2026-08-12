"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogoFull } from "./Logo"
import { createClient } from "@/lib/supabase/client"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const revoked = searchParams.get("revoked") === "1"
  const nextPath = searchParams.get("next") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (signInError) {
      setError("Incorrect email or password. Please try again.")
      return
    }

    router.replace(nextPath)
    router.refresh()
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setForgotSent(true)
  }

  if (showForgot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: "#F9F8F6" }}>
        <div className="w-full max-w-[380px]">
          <LogoFull className="h-9 w-auto mb-10" />

          {forgotSent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#E8F7EF" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#1A7A47"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "#3A3A3A" }}>Check your inbox</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#8A8580" }}>
                {"If that address is registered, we've sent a reset link to "}
                <span className="font-medium" style={{ color: "#3A3A3A" }}>{forgotEmail}</span>.
              </p>
              <button onClick={() => { setShowForgot(false); setForgotSent(false) }}
                className="text-sm font-medium hover:underline"
                style={{ color: "#FD3352" }}>
                Back to log in
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-1" style={{ color: "#3A3A3A" }}>Reset your password</h2>
              <p className="text-sm mb-7" style={{ color: "#8A8580" }}>
                {"Enter your email and we'll send you a reset link."}
              </p>
              <form onSubmit={handleForgot} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Email address</label>
                  <input type="email" required placeholder="you@masteringit.co.za"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-lg border text-sm"
                    style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
                    onFocus={e => (e.target.style.borderColor = "#FD3352")}
                    onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
                </div>
                <button type="submit"
                  className="w-full py-3.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "#FD3352", color: "#FFF" }}>
                  Send reset link
                </button>
                <button type="button" onClick={() => setShowForgot(false)}
                  className="text-sm text-center hover:underline"
                  style={{ color: "#8A8580" }}>
                  Back to log in
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "#F9F8F6" }}>
      <div className="w-full max-w-[380px]">
        <LogoFull className="h-9 w-auto mb-10" />

        <div className="mb-7">
          <h1 className="text-xl font-semibold mb-1" style={{ color: "#3A3A3A" }}>Log in to SCOUT</h1>
          <p className="text-sm" style={{ color: "#8A8580" }}>Tutor screening — MasteringIt internal tool</p>
        </div>

        {revoked && (
          <div className="mb-4 px-3.5 py-3 rounded-lg text-sm" style={{ background: "#FDE8EC", color: "#B0253C" }}>
            Your access has been revoked. Contact the account owner if this is unexpected.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Email address</label>
            <input type="email" required placeholder="you@masteringit.co.za"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 rounded-lg border text-sm"
              style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#FD3352")}
              onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Password</label>
            <input type="password" required placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
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
            className="w-full py-3.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 mt-1 disabled:opacity-60"
            style={{ background: "#FD3352", color: "#FFF" }}>
            {loading ? "Logging in…" : "Log in"}
          </button>

          <div className="text-center">
            <button type="button" onClick={() => setShowForgot(true)}
              className="text-sm hover:underline"
              style={{ color: "#8A8580" }}>
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
