import nodemailer from "nodemailer"

// Single email-sending abstraction — same one-function-per-concern pattern
// as lib/ai.ts. Sends over Gmail SMTP from a dedicated account (no
// DNS-verified sending domain available), authenticated with an App
// Password rather than the account's real password.

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
