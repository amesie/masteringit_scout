import { useState } from "react"
import { LogoFull } from "./Logo"

type FileState = { name: string } | null

const GRADE_LEVELS = ["Foundation (Gr 1–3)", "Intermediate (Gr 4–6)", "Senior (Gr 7–9)", "FET (Gr 10–12)", "Tertiary"]

const SUBJECTS = [
  "Mathematics",
  "Mathematical Literacy",
  "Physical Science",
  "Life Sciences",
  "Accounting",
  "English",
  "Afrikaans",
  "Geography",
  "History",
  "Economics",
  "Business Studies",
  "Computer Applications Technology",
  "Other",
]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIMES = ["Morning (7–11)", "Afternoon (12–16)", "Evening (17–20)"]

interface SubjectBlockData {
  id: number
  subject: string
  customSubject: string
  experience: string
}

let nextId = 2

function SubjectBlock({
  block,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  block: SubjectBlockData
  index: number
  canRemove: boolean
  onChange: (updated: SubjectBlockData) => void
  onRemove: () => void
}) {
  const isOther = block.subject === "Other"

  return (
    <div className="flex flex-col gap-4 px-4 py-5 rounded-xl border"
      style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
      {/* Block header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8A8580" }}>
          Subject {index + 1}
        </span>
        {canRemove && (
          <button type="button" onClick={onRemove}
            className="text-xs font-medium transition-colors hover:underline"
            style={{ color: "#B0253C" }}>
            Remove
          </button>
        )}
      </div>

      {/* Subject dropdown */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Subject</label>
        <div className="relative">
          <select
            required
            value={block.subject}
            onChange={e => onChange({ ...block, subject: e.target.value, customSubject: "" })}
            className="w-full appearance-none px-3.5 pr-9 py-3 rounded-lg border text-sm"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: block.subject ? "#3A3A3A" : "#8A8580", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")}>
            <option value="">Select a subject</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="#8A8580" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Custom subject input — shown when "Other" is selected */}
      {isOther && (
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Please specify subject</label>
          <input
            type="text"
            required
            placeholder="e.g. isiZulu, Engineering Graphics"
            value={block.customSubject}
            onChange={e => onChange({ ...block, customSubject: e.target.value })}
            className="w-full px-3.5 py-3 rounded-lg border text-sm"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>
      )}

      {/* Per-subject experience */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>
          Experience & competency
          {block.subject && block.subject !== "Other" && (
            <span className="font-normal" style={{ color: "#8A8580" }}> — {block.subject}</span>
          )}
        </label>
        <p className="text-xs mb-2" style={{ color: "#8A8580" }}>
          e.g. years tutoring, relevant study, matric result, achievements
        </p>
        <textarea
          required
          rows={4}
          placeholder={`Tell us about your background with${block.subject && block.subject !== "Other" ? ` ${block.subject}` : " this subject"}...`}
          value={block.experience}
          onChange={e => onChange({ ...block, experience: e.target.value })}
          className="w-full px-3.5 py-3 rounded-lg border text-sm resize-none"
          style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
          onFocus={e => (e.target.style.borderColor = "#FD3352")}
          onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
      </div>
    </div>
  )
}

function FileChip({ file, onRemove }: { file: FileState; onRemove: () => void }) {
  if (!file) return null
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{ background: "#E8F7EF", color: "#1A7A47" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="7" fill="#1A7A47"/>
        <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="truncate max-w-[180px]">{file.name}</span>
      <button onClick={onRemove} className="text-current opacity-60 hover:opacity-100 transition-opacity" aria-label="Remove file">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

function UploadField({ label, hint, value, onChange }: {
  label: string
  hint: string
  value: FileState
  onChange: (f: FileState) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>{label}</label>
      <p className="text-xs mb-2" style={{ color: "#8A8580" }}>{hint}</p>
      {value ? (
        <FileChip file={value} onRemove={() => onChange(null)} />
      ) : (
        <label
          className="flex flex-col items-center justify-center gap-2 w-full py-6 rounded-lg border-2 border-dashed cursor-pointer"
          style={{ borderColor: "#E5E3DF", background: "#FAFAF8" }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) onChange({ name: f.name })
          }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium" style={{ color: "#8A8580" }}>Choose file or drag here</span>
          <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) onChange({ name: f.name })
            }} />
        </label>
      )}
    </div>
  )
}

export default function IntakeForm() {
  const [submitted, setSubmitted] = useState(false)
  const [grades, setGrades] = useState<string[]>([])
  const [days, setDays] = useState<string[]>([])
  const [times, setTimes] = useState<string[]>([])
  const [cv, setCv] = useState<FileState>(null)
  const [matric, setMatric] = useState<FileState>(null)
  const [subjectBlocks, setSubjectBlocks] = useState<SubjectBlockData[]>([
    { id: 1, subject: "", customSubject: "", experience: "" },
  ])
  const [mode, setMode] = useState("")

  const toggleArr = (arr: string[], val: string, set: (a: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const addSubject = () => {
    setSubjectBlocks(prev => [...prev, { id: nextId++, subject: "", customSubject: "", experience: "" }])
  }

  const removeSubject = (id: number) => {
    setSubjectBlocks(prev => prev.filter(b => b.id !== id))
  }

  const updateBlock = (id: number, updated: SubjectBlockData) => {
    setSubjectBlocks(prev => prev.map(b => b.id === id ? updated : b))
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{ background: "#F9F8F6" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#E8F7EF" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 16l7 7 13-13" stroke="#1A7A47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3" style={{ color: "#3A3A3A" }}>Application received</h2>
          <p className="text-base leading-relaxed" style={{ color: "#8A8580" }}>
            {"Thanks — we'll be in touch if there's a match."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 py-10" style={{ background: "#F9F8F6" }}>
      <div className="mx-auto w-full max-w-[480px]">
        {/* Header */}
        <div className="mb-10">
          <LogoFull className="h-10 w-auto mb-8" />
          <h1 className="text-2xl font-semibold mb-2" style={{ color: "#3A3A3A" }}>Tutor Application</h1>
          <p className="text-sm" style={{ color: "#8A8580" }}>{"Tell us about yourself — takes about 5 minutes."}</p>
        </div>

        <div className="mb-8 h-px" style={{ background: "#E5E3DF" }} />

        <form className="flex flex-col gap-6" onSubmit={e => { e.preventDefault(); setSubmitted(true) }}>
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Name</label>
              <input type="text" required placeholder="Thandi"
                className="w-full px-3.5 py-3 rounded-lg border text-sm"
                style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "#FD3352")}
                onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Surname</label>
              <input type="text" required placeholder="Dlamini"
                className="w-full px-3.5 py-3 rounded-lg border text-sm"
                style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "#FD3352")}
                onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Mobile number</label>
            <input type="tel" required placeholder="071 234 5678"
              className="w-full px-3.5 py-3 rounded-lg border text-sm"
              style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#FD3352")}
              onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>Email address</label>
            <input type="email" required placeholder="you@example.com"
              className="w-full px-3.5 py-3 rounded-lg border text-sm"
              style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#FD3352")}
              onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
          </div>

          {/* Subject blocks */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: "#3A3A3A" }}>{"Subject(s) you're applying to tutor"}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8A8580" }}>You can add more than one subject below.</p>
            </div>

            {subjectBlocks.map((block, index) => (
              <SubjectBlock
                key={block.id}
                block={block}
                index={index}
                canRemove={subjectBlocks.length > 1}
                onChange={updated => updateBlock(block.id, updated)}
                onRemove={() => removeSubject(block.id)} />
            ))}

            <button
              type="button"
              onClick={addSubject}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border text-sm font-medium transition-colors"
              style={{ borderColor: "#E5E3DF", borderStyle: "dashed", background: "transparent", color: "#8A8580" }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#FD3352"
                e.currentTarget.style.color = "#FD3352"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#E5E3DF"
                e.currentTarget.style.color = "#8A8580"
              }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add another subject
            </button>
          </div>

          {/* Grade levels */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#3A3A3A" }}>Grade levels you can teach</label>
            <div className="flex flex-wrap gap-2">
              {GRADE_LEVELS.map(g => {
                const active = grades.includes(g)
                return (
                  <button key={g} type="button"
                    onClick={() => toggleArr(grades, g, setGrades)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={{
                      borderColor: active ? "#FD3352" : "#E5E3DF",
                      background: active ? "#FD3352" : "#FFF",
                      color: active ? "#FFF" : "#3A3A3A",
                    }}>
                    {g}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#3A3A3A" }}>{"Area / suburb you're based in"}</label>
            <input type="text" required placeholder="e.g. Sandton, Johannesburg"
              className="w-full px-3.5 py-3 rounded-lg border text-sm"
              style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "#FD3352")}
              onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#3A3A3A" }}>Availability</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DAYS.map(d => {
                const active = days.includes(d)
                return (
                  <button key={d} type="button"
                    onClick={() => toggleArr(days, d, setDays)}
                    className="w-10 h-10 rounded-full text-xs font-medium border transition-all"
                    style={{
                      borderColor: active ? "#FD3352" : "#E5E3DF",
                      background: active ? "#FD3352" : "#FFF",
                      color: active ? "#FFF" : "#3A3A3A",
                    }}>
                    {d}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col gap-1.5">
              {TIMES.map(t => {
                const active = times.includes(t)
                return (
                  <button key={t} type="button"
                    onClick={() => toggleArr(times, t, setTimes)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm transition-all text-left"
                    style={{
                      borderColor: active ? "#FD3352" : "#E5E3DF",
                      background: active ? "#FFF5F7" : "#FFF",
                      color: "#3A3A3A",
                    }}>
                    <span className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? "#FD3352" : "#C5C2BD", background: active ? "#FD3352" : "transparent" }}>
                      {active && (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                          <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#3A3A3A" }}>Teaching mode</label>
            <div className="grid grid-cols-3 gap-2">
              {["Online", "In-person", "Both"].map(m => {
                const active = mode === m
                return (
                  <button key={m} type="button"
                    onClick={() => setMode(m)}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-center transition-all"
                    style={{
                      borderColor: active ? "#FD3352" : "#E5E3DF",
                      background: active ? "#FFF5F7" : "#FFF",
                      color: "#3A3A3A",
                    }}>
                    <span className="text-sm font-medium">{m}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* File uploads */}
          <UploadField label="CV" hint="PDF or Word document" value={cv} onChange={setCv} />
          <UploadField label="Matric certificate" hint="PDF or image (JPG, PNG)" value={matric} onChange={setMatric} />

          {/* Submit */}
          <div className="mt-2">
            <button type="submit"
              className="w-full py-4 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 active:opacity-80"
              style={{ background: "#FD3352", color: "#FFF" }}>
              Submit application
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: "#8A8580" }}>
              Your information is only used to review your application.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
