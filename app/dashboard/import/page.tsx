import { requireProfile } from "@/lib/auth"
import CsvImportClient from "@/components/dashboard/CsvImportClient"

export default async function ImportPage() {
  await requireProfile()
  return <CsvImportClient />
}
