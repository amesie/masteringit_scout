import { NextResponse } from "next/server"
import { requireProfile } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Manual, explicit delete — triggered only by an owner/employee clicking
// "Delete applicant" and confirming. Distinct from the dormant-lifecycle
// guardrail in the build spec, which is about SCOUT never *automatically*
// deleting or archiving applicants; a deliberate human action here is fine.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile()
  const { id } = await params

  const admin = createAdminClient()

  const { data: applicant } = await admin
    .from("applicants")
    .select("cv_file_url, matric_file_url")
    .eq("id", id)
    .single()

  const filesToRemove = [applicant?.cv_file_url, applicant?.matric_file_url].filter(
    (path): path is string => !!path
  )

  if (filesToRemove.length > 0) {
    await admin.storage.from("applicant-documents").remove(filesToRemove)
  }

  const { error } = await admin.from("applicants").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
