"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogoFull } from "@/components/Logo"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

const TABS = [
  { href: "/dashboard", label: "Active Applicants", ownerOnly: false },
  { href: "/dashboard/on-file", label: "On File", ownerOnly: false },
  { href: "/dashboard/needs", label: "Hiring Needs", ownerOnly: false },
  { href: "/dashboard/import", label: "Import CSV", ownerOnly: false },
  { href: "/dashboard/users", label: "Manage Users", ownerOnly: true },
]

export default function DashboardShell({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const isOwner = profile.role === "owner"
  const displayName = profile.name || profile.email

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen" style={{ background: "#F9F8F6" }}>
      <header className="border-b px-8 py-4 flex items-center gap-6" style={{ background: "#FFF", borderColor: "#E5E3DF" }}>
        <LogoFull className="h-8 w-auto flex-shrink-0" />
        <div className="mx-2 h-6 w-px" style={{ background: "#E5E3DF" }} />
        <div>
          <h1 className="text-base font-semibold" style={{ color: "#3A3A3A" }}>Tutor Applicants</h1>
          <p className="text-xs" style={{ color: "#8A8580" }}>SCOUT — Internal Screening Tool</p>
        </div>

        <div className="ml-auto relative">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: isOwner ? "#FDE8EC" : "#F1F0EE", color: isOwner ? "#B0253C" : "#5A5652" }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-tight" style={{ color: "#3A3A3A" }}>{displayName}</p>
              <p className="text-xs leading-tight capitalize" style={{ color: "#8A8580" }}>{profile.role}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "#8A8580" }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded-xl border py-1 overflow-hidden"
                style={{ background: "#FFF", borderColor: "#E5E3DF", boxShadow: "0 4px 20px rgba(58,58,58,0.1)" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F0EE" }}>
                  <p className="text-xs font-semibold" style={{ color: "#3A3A3A" }}>{displayName}</p>
                  <p className="text-xs truncate" style={{ color: "#8A8580" }}>{profile.email}</p>
                </div>
                {isOwner && (
                  <Link href="/dashboard/users" onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center gap-2.5"
                    style={{ color: "#3A3A3A" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Manage users
                  </Link>
                )}
                <button onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center gap-2.5"
                  style={{ color: "#B0253C" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="px-8 py-8 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: "#F1F0EE" }}>
          {TABS.filter(t => !t.ownerOnly || isOwner).map(({ href, label }) => {
            const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "#FFF" : "transparent",
                  color: active ? "#3A3A3A" : "#8A8580",
                  boxShadow: active ? "0 1px 4px rgba(58,58,58,0.1)" : "none",
                }}>
                {label}
              </Link>
            )
          })}
        </div>

        {children}
      </main>
    </div>
  )
}
