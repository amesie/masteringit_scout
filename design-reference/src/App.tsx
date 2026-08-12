import { useState } from "react"
import IntakeForm from "./components/IntakeForm"
import Dashboard from "./components/Dashboard"
import LoginScreen from "./components/LoginScreen"

type View = "form" | "dashboard"

const USER_NAMES: Record<string, string> = {
  "maryke@masteringit.co.za": "Maryke",
  "staff@masteringit.co.za": "Lindi",
}

interface AuthUser {
  email: string
  role: "owner" | "staff"
  name: string
}

export default function App() {
  const [view, setView] = useState<View>("form")
  const [auth, setAuth] = useState<AuthUser | null>(null)

  const handleLogin = (email: string, role: "owner" | "staff") => {
    setAuth({ email, role, name: USER_NAMES[email] ?? email })
    setView("dashboard")
  }

  const handleSignOut = () => {
    setAuth(null)
    setView("form")
  }

  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Demo switcher — not part of the product UI */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs"
        style={{ background: "#3A3A3A", color: "rgba(255,255,255,0.6)" }}>
        <span className="font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>SCOUT PROTOTYPE</span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
        <span>Switch view:</span>
        <button onClick={() => setView("form")}
          className="font-semibold underline-offset-2 transition-colors"
          style={{ color: view === "form" ? "#FD3352" : "rgba(255,255,255,0.7)", textDecoration: view === "form" ? "underline" : "none" }}>
          Applicant Form
        </button>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>|</span>
        <button onClick={() => { setView("dashboard"); if (!auth) {} }}
          className="font-semibold underline-offset-2 transition-colors"
          style={{ color: view === "dashboard" ? "#29C5EA" : "rgba(255,255,255,0.7)", textDecoration: view === "dashboard" ? "underline" : "none" }}>
          Owner Dashboard
        </button>
      </div>

      {view === "form" && <IntakeForm />}

      {view === "dashboard" && !auth && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {view === "dashboard" && auth && (
        <Dashboard user={auth} onSignOut={handleSignOut} />
      )}
    </div>
  )
}
