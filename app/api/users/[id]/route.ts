import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner()
  const { id } = await params

  if (id === owner.id) {
    return NextResponse.json({ error: "You can't revoke your own access." }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: target } = await admin.from("profiles").select("role").eq("id", id).single()
  if (target?.role === "owner") {
    return NextResponse.json({ error: "The owner account can't be revoked." }, { status: 400 })
  }

  const { error: banError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: "87600h",
  })
  if (banError) {
    return NextResponse.json({ error: banError.message }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ status: "revoked" })
    .eq("id", id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
