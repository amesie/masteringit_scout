import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SCOUT — Tutor Applicant Screening",
  description: "MasteringIt internal tool for tutor applicant intake, scoring, and shortlisting.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>{children}</body>
    </html>
  )
}
