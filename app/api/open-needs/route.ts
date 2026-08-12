import { NextResponse } from "next/server"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  await requireProfile()
  const { subject, gradeRange, minScore, notes } = await request.json().catch(() => ({}))

  if (!subject || typeof subject !== "string") {
    return NextResponse.json({ error: "Subject is required." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("open_needs")
    .insert({
      subject: subject.trim(),
      grade_range: gradeRange?.trim() || null,
      min_score: Number.isFinite(minScore) ? minScore : 70,
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, need: data })
}
