import nodemailer from "nodemailer"

// Single email-sending abstraction — same one-function-per-concern pattern
// as lib/ai.ts. Sends via SendGrid's SMTP relay using an API key (SMTP
// username is always the literal string "apikey" — that's SendGrid's
// convention, not a placeholder left in by mistake). The visible sender is
// a Proton Mail address, verified with SendGrid as a "Single Sender" — that
// verification is just a confirmation-email click, not SMTP/IMAP access to
// Proton itself, which isn't possible from a serverless function (Proton's
// SMTP only works through Bridge, a paid-plan desktop app that has to run
// on a real, always-on machine).
//
// Previously ran over Gmail SMTP directly from a dedicated account; that
// account got flagged/suspended by Google's automated abuse detection —
// exactly the risk a real transactional provider avoids.

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) return transporter

  const apiKey = process.env.scout_email_api_key

  if (!apiKey) {
    throw new Error("Missing scout_email_api_key environment variable.")
  }

  transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: { user: "apikey", pass: apiKey },
  })
  return transporter
}

function fromAddress(): string {
  const from = process.env.scout_email_from
  if (!from) {
    throw new Error("Missing scout_email_from environment variable.")
  }
  return from
}

// Neutral acknowledgment of receipt only — per the build spec guardrail,
// SCOUT never sends a rejection or any status/score info automatically.
export async function sendApplicantConfirmation(to: string, name: string): Promise<void> {
  const firstName = name.trim().split(/\s+/)[0] || "there"

  await getTransporter().sendMail({
    from: `"MasteringIt" <${fromAddress()}>`,
    to,
    subject: "We've received your application — MasteringIt",
    text: `Hi ${firstName},\n\nThanks for applying to tutor with MasteringIt. We've received your application and will be in touch if there's a match.\n\n— MasteringIt`,
  })
}

// General-purpose send, used for staff-reviewed outreach (e.g. the
// shortlist interview-invite draft) — unlike sendApplicantConfirmation,
// content here is written/edited by a person before this is ever called.
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  await getTransporter().sendMail({
    from: `"MasteringIt" <${fromAddress()}>`,
    to,
    subject,
    text: body,
  })
}
