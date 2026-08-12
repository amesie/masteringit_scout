import { NextResponse } from "next/server"
import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile()
  const { id } = await params
  const { isActive } = await request.json().catch(() => ({}))

  const supabase = await createClient()
  const { error } = await supabase
    .from("open_needs")
    .update({ is_active: !!isActive })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile()
  const { id } = await params

  const supabase = await createClient()
  const { error } = await supabase.from("open_needs").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
