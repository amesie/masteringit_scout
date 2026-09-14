import { NextResponse } from "next/server"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import type { Applicant } from "@/lib/types"

// Explicit, human-triggered send of the (possibly edited) outreach draft —
// the only place this codebase actually emails an applicant something
// beyond the neutral apply-confirmation, and only ever on a person's click.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile()
  const { id } = await params
  const { subject, body } = await request.json().catch(() => ({}))

  if (!subject || !body || typeof subject !== "string" || typeof body !== "string") {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: applicantData, error: fetchError } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !applicantData) {
    return NextResponse.json({ error: "Applicant not found." }, { status: 404 })
  }
  const applicant = applicantData as Applicant

  if (!applicant.email) {
    return NextResponse.json({ error: "This applicant has no email address on file." }, { status: 400 })
  }

  try {
    await sendEmail(applicant.email, subject, body)
  } catch (err) {
    console.error("Failed to send outreach email:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Could not send the email." }, { status: 500 })
  }

  const { data: updated, error: updateError } = await supabase
    .from("applicants")
    .update({
      outreach_draft_subject: null,
      outreach_draft_body: null,
      last_contacted: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message || "Email sent, but could not update the record." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, applicant: updated })
}
