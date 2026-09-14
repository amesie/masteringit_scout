import { NextResponse } from "next/server"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { generateContent } from "@/lib/ai"
import type { Applicant } from "@/lib/types"

// Drafts (never sends) a personalized interview-invite email. Triggered
// automatically right after an applicant is moved to "shortlisted", and
// reused for the manual "Regenerate draft" button in the dashboard — one
// code path for both. Sending is a separate, explicit step
// (POST /send-outreach) so nothing goes out without a person reviewing it.
const SYSTEM_INSTRUCTIONS = `You are drafting an interview-invite email on behalf of MasteringIt, a South African tutoring company, to a shortlisted tutor applicant.
Write a warm, professional, concise email inviting them to interview. Do not invent a specific date, time, or location — ask them to reply with their availability instead. Do not mention a match score, ranking, or any other applicants.
Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{ "subject": "<email subject line>", "body": "<email body, plain text, no HTML>" }`

function buildPrompt(applicant: Applicant): string {
  const subjects = applicant.subject_scores.map(s => s.subject).join(", ") || applicant.subjects.join(", ")
  return `Applicant name: ${applicant.name}\nSubject(s) they applied to tutor: ${subjects || "(not specified)"}\n\nWrite the interview-invite email now.`
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile()
  const { id } = await params

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

  let raw: string
  try {
    raw = await generateContent(buildPrompt(applicant), SYSTEM_INSTRUCTIONS)
  } catch (err) {
    console.error("Failed to draft outreach email:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Could not draft an outreach email right now." }, { status: 500 })
  }

  let parsed: { subject?: unknown; body?: unknown }
  try {
    const jsonText = raw.trim().replace(/^```json\s*|^```\s*|```$/g, "")
    parsed = JSON.parse(jsonText)
  } catch {
    console.error("Outreach draft response was not valid JSON:", raw.slice(0, 500))
    return NextResponse.json({ error: "Could not draft an outreach email right now." }, { status: 500 })
  }

  if (typeof parsed.subject !== "string" || typeof parsed.body !== "string") {
    console.error("Outreach draft response missing subject/body:", raw.slice(0, 500))
    return NextResponse.json({ error: "Could not draft an outreach email right now." }, { status: 500 })
  }

  const { data: updated, error: updateError } = await supabase
    .from("applicants")
    .update({ outreach_draft_subject: parsed.subject, outreach_draft_body: parsed.body })
    .eq("id", id)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Could not save the draft." }, { status: 500 })
  }

  return NextResponse.json({ ok: true, applicant: updated })
}
