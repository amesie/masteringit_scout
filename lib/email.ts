import nodemailer from "nodemailer"

// Single email-sending abstraction — same one-function-per-concern pattern
// as lib/ai.ts. Sends over Gmail SMTP, authenticated with an App Password
// (Google Account -> Security -> 2-Step Verification -> App Passwords),
// never the account's real password.
//
// History worth knowing: the first attempt used a brand-new dedicated Gmail
// account, which Google's abuse detection flagged/suspended almost
// immediately — a fresh account used right away for automated sending
// reads as bot-like to most providers, Gmail included. A brief detour
// through SendGrid hit the same fresh-account problem on the Proton
// address being verified as its sender. The fix in both cases is the same:
// use an address with real history, not a newly created one — so this now
// runs through an existing, already-established personal Gmail account
// instead of a dedicated throwaway.

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) return transporter

  const user = process.env.scout_email_user
  const pass = process.env.scout_email_password

  if (!user || !pass) {
    throw new Error("Missing scout_email_user / scout_email_password environment variables.")
  }

  transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } })
  return transporter
}

// Neutral acknowledgment of receipt only — per the build spec guardrail,
// SCOUT never sends a rejection or any status/score info automatically.
export async function sendApplicantConfirmation(to: string, name: string): Promise<void> {
  const firstName = name.trim().split(/\s+/)[0] || "there"
  const user = process.env.scout_email_user

  await getTransporter().sendMail({
    from: `"MasteringIt" <${user}>`,
    to,
    subject: "We've received your application — MasteringIt",
    text: `Hi ${firstName},\n\nThanks for applying to tutor with MasteringIt. We've received your application and will be in touch if there's a match.\n\n— MasteringIt`,
  })
}

// General-purpose send, used for staff-reviewed outreach (e.g. the
// shortlist interview-invite draft) — unlike sendApplicantConfirmation,
// content here is written/edited by a person before this is ever called.
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const user = process.env.scout_email_user

  await getTransporter().sendMail({
    from: `"MasteringIt" <${user}>`,
    to,
    subject,
    text: body,
  })
}
