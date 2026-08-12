import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single()
  if (!profile) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 })
  }

  const path = new URL(request.url).searchParams.get("path")
  if (!path) {
    return NextResponse.json({ error: "Missing path." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from("applicant-documents").createSignedUrl(path, 60)

  if (error || !data) {
    return NextResponse.json({ error: "Could not generate document link." }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
