import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// One-time bootstrap for the very first owner account. Since there's no
// public sign-up, someone has to create the first login by hand. This
// route self-disables the moment any owner profile exists — safe to leave
// in place after initial setup.
export async function POST(request: Request) {
  const { name, email, password } = await request.json().catch(() => ({}))

  if (!name || !email || !password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Name, email, and an 8+ character password are required." },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner")

  if (count && count > 0) {
    return NextResponse.json(
      { error: "An owner account already exists. Use the dashboard's invite flow instead." },
      { status: 403 }
    )
  }

  const normalizedEmail = email.trim().toLowerCase()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { name: name.trim() },
  })

  if (createError || !created?.user) {
    return NextResponse.json({ error: createError?.message || "Could not create account." }, { status: 400 })
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    email: normalizedEmail,
    name: name.trim(),
    role: "owner",
    status: "active",
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
