import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  await requireOwner()

  const { name, email } = await request.json().catch(() => ({}))

  if (!name || !email || typeof name !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const normalizedEmail = email.trim().toLowerCase()

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data: { name: name.trim() },
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    }
  )

  if (inviteError || !invited?.user) {
    return NextResponse.json(
      { error: inviteError?.message || "Could not send invite." },
      { status: 400 }
    )
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: invited.user.id,
    email: normalizedEmail,
    name: name.trim(),
    role: "staff",
    status: "invited",
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    user: { id: invited.user.id, name: name.trim(), email: normalizedEmail },
  })
}
