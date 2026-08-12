"use client"

import { useState } from "react"
import Papa from "papaparse"

type CsvRow = Record<string, string>

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export default function CsvImportClient() {
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<CsvRow[]>([])
  const [parseError, setParseError] = useState("")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    setParseError("")
    setResult(null)
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0].message)
        }
        setRows(results.data)
      },
      error: err => setParseError(err.message),
    })
  }

  const handleImport = async () => {
    setImporting(true)
    setResult(null)
    const res = await fetch("/api/csv-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    })
    const body = await res.json().catch(() => ({}))
    setImporting(false)
    if (res.ok) {
      setResult(body)
    } else {
      setParseError(body.error || "Import failed.")
    }
  }

  const previewRows = rows.slice(0, 8)
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold" style={{ color: "#3A3A3A" }}>Import historical applicants</h2>
        <p className="text-sm mt-0.5" style={{ color: "#8A8580" }}>
          Upload a CSV of past applicants. Expected columns: name, email, phone, subjects, grade_range, location_pref, area, availability, experience, matric.
          Each row is scored against your current Hiring Needs just like a live application — rows that match land as <code>active</code>, the rest as <code>dormant</code>. Rows SCOUT can&apos;t confidently assess are flagged for review. Imported rows are tagged <code>source = csv_import</code>.
        </p>
      </div>

      <label
        className="flex flex-col items-center justify-center gap-2 w-full py-10 rounded-xl border-2 border-dashed cursor-pointer mb-6"
        style={{ borderColor: "#E5E3DF", background: "#FAFAF8" }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-medium" style={{ color: "#8A8580" }}>
          {fileName || "Choose CSV file or drag here"}
        </span>
        <input type="file" accept=".csv" className="sr-only"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }} />
      </label>

      {parseError && (
        <div className="mb-6 px-3.5 py-3 rounded-lg text-sm" style={{ background: "#FDE8EC", color: "#B0253C" }}>
          {parseError}
        </div>
      )}

      {rows.length > 0 && !result && (
        <>
          <div className="rounded-xl border overflow-x-auto mb-4" style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E3DF", background: "#FAFAF8" }}>
                  {columns.map(c => (
                    <th key={c} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "#8A8580" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? "1px solid #F1F0EE" : undefined }}>
                    {columns.map(c => (
                      <td key={c} className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#3A3A3A" }}>{row[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mb-4" style={{ color: "#8A8580" }}>
            Showing {previewRows.length} of {rows.length} rows.
          </p>
          <button onClick={handleImport} disabled={importing}
            className="px-5 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#FD3352", color: "#FFF" }}>
            {importing ? "Importing…" : `Import ${rows.length} applicants`}
          </button>
        </>
      )}

      {result && (
        <div className="rounded-xl border p-5" style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "#3A3A3A" }}>
            Imported {result.imported} of {result.imported + result.skipped} rows
          </p>
          {result.errors.length > 0 && (
            <ul className="flex flex-col gap-1 mt-3">
              {result.errors.map((err, i) => (
                <li key={i} className="text-xs" style={{ color: "#B0253C" }}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
