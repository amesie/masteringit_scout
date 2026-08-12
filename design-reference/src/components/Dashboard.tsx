import { useState } from "react"
import { LogoFull } from "./Logo"
import ManageUsers from "./ManageUsers"

type Status = "meets" | "review" | "missing" | "not-qualified"

interface SubjectEntry {
  subject: string
  status: Status
  matricResult: string
  experience: string
  rationale: string
  reviewNote?: string
}

interface Applicant {
  id: number
  name: string
  subjects: SubjectEntry[]
  area: string
  email: string
  phone: string
  grades: string[]
  availability: string
  mode: string
  cvFile: string
  matricFile: string | null
}

interface OnFileApplicant {
  id: number
  name: string
  subjects: string[]
  area: string
  email: string
  phone: string
  dateAdded: string
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string }> = {
  "meets": { label: "Meets Criteria", bg: "#E8F7EF", text: "#1A7A47" },
  "review": { label: "Review — Below Threshold", bg: "#FFF8E1", text: "#A0620A" },
  "missing": { label: "Missing Info", bg: "#F1F0EE", text: "#5A5652" },
  "not-qualified": { label: "Not Qualified", bg: "#FDE8EC", text: "#B0253C" },
}

const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: 1, name: "Thandi Dlamini", area: "Sandton, JHB",
    email: "thandi.dlamini@gmail.com", phone: "071 234 5678",
    grades: ["Senior (Gr 7–9)", "FET (Gr 10–12)"],
    availability: "Weekday afternoons, Saturdays", mode: "Both",
    cvFile: "thandi_cv.pdf", matricFile: "thandi_matric.pdf",
    subjects: [
      {
        subject: "Mathematics", status: "meets", matricResult: "Mathematics: 85%",
        rationale: "85% matric maths, 4 yrs experience",
        experience: "I have been tutoring high school maths for 4 years, focusing on Grade 10–12 students. I completed my BCom at Wits with distinction in quantitative methods. Happy to do test prep, curriculum support, and exam coaching.",
      },
      {
        subject: "Physical Science", status: "review", matricResult: "Physical Science: 71%",
        rationale: "71% matric physics — below 75% threshold",
        reviewNote: "Below 75% threshold for Physical Science — applicant has 4 years of maths tutoring but limited science-specific experience. Confirm depth before placing.",
        experience: "My matric physical science was 71%. I covered the syllabus well and have helped students with Newton's laws and electricity, though my primary focus has always been maths.",
      },
    ],
  },
  {
    id: 2, name: "Ruan Oberholzer", area: "Bellville, CPT",
    email: "ruan.oberholzer@outlook.com", phone: "082 567 8901",
    grades: ["Senior (Gr 7–9)", "FET (Gr 10–12)"],
    availability: "Weekends only", mode: "Online",
    cvFile: "ruan_cv.pdf", matricFile: "ruan_matric.pdf",
    subjects: [
      {
        subject: "Physical Science", status: "review", matricResult: "Physical Science: 68%",
        rationale: "68% matric physics — Mech Eng student, possible exception",
        reviewNote: "Below 75% threshold for Physical Science — applicant is a current Mechanical Engineering student at Stellenbosch, may qualify for subject-knowledge exception.",
        experience: "Currently in my 3rd year of Mechanical Engineering at Stellenbosch University. I tutored classmates through first-year physics and thermodynamics. My matric physics was 68% but my tertiary work goes well beyond matric level.",
      },
      {
        subject: "Mathematics", status: "missing", matricResult: "Mathematics: result not provided",
        rationale: "Matric certificate missing — result unverified",
        experience: "I'm comfortable with maths up to first-year university level. I help engineering classmates with calculus and linear algebra regularly.",
      },
    ],
  },
  {
    id: 3, name: "Amahle Zulu", area: "Durban North, DBN",
    email: "amahle.zulu@gmail.com", phone: "064 345 6789",
    grades: ["Foundation (Gr 1–3)", "Intermediate (Gr 4–6)", "Senior (Gr 7–9)"],
    availability: "Mon–Fri mornings", mode: "In-person",
    cvFile: "amahle_cv.pdf", matricFile: null,
    subjects: [
      {
        subject: "English", status: "meets", matricResult: "English: 91%",
        rationale: "91% matric English, BA Literature, 2 yrs tutoring",
        experience: "BA English Literature from UKZN. 2 years private tutoring with Grade 4–9 learners. I focus on comprehension, essay structure, and literature analysis.",
      },
      {
        subject: "Life Sciences", status: "missing", matricResult: "Life Sciences: result not provided",
        rationale: "Matric certificate missing — Life Sciences result unverified",
        experience: "I studied Life Sciences to matric level and performed well. I have helped younger siblings with the subject but have not formally tutored it.",
      },
    ],
  },
  {
    id: 4, name: "Pieter van Niekerk", area: "Pretoria East, PTA",
    email: "pieter.vn@webmail.co.za", phone: "083 901 2345",
    grades: ["FET (Gr 10–12)"],
    availability: "Weekday evenings", mode: "Online",
    cvFile: "pieter_cv.pdf", matricFile: "pieter_matric.pdf",
    subjects: [
      {
        subject: "Accounting", status: "not-qualified", matricResult: "Accounting: 52%",
        rationale: "52% matric accounting — below minimum",
        experience: "I have some experience helping friends with their accounting work. I am good with numbers and enjoy the subject. I am willing to study further if required.",
      },
    ],
  },
  {
    id: 5, name: "Kefilwe Mokoena", area: "Soweto, JHB",
    email: "kefilwe.mokoena@gmail.com", phone: "076 678 9012",
    grades: ["Intermediate (Gr 4–6)", "Senior (Gr 7–9)", "FET (Gr 10–12)"],
    availability: "Flexible — full availability", mode: "Both",
    cvFile: "kefilwe_cv.pdf", matricFile: "kefilwe_matric.pdf",
    subjects: [
      {
        subject: "Mathematics", status: "meets", matricResult: "Mathematics: 92%",
        rationale: "92% matric maths, BSc Mathematics cum laude",
        experience: "BSc Mathematics graduate from UJ, graduated cum laude. Tutored maths at high school and first-year university level for 2 years.",
      },
      {
        subject: "Physical Science", status: "meets", matricResult: "Physical Science: 88%",
        rationale: "88% matric physical science, strong tertiary background",
        experience: "Studied physics and chemistry modules as part of my BSc. My matric physical science was 88%. I am confident teaching up to Grade 12 level.",
      },
    ],
  },
]

const ON_FILE: OnFileApplicant[] = [
  { id: 6, name: "Sipho Nkosi", subjects: ["Mathematics", "Physical Science"], area: "Midrand, JHB", email: "sipho.nkosi@gmail.com", phone: "079 123 4567", dateAdded: "3 Nov 2024" },
  { id: 7, name: "Liezel Botha", subjects: ["English", "Life Sciences"], area: "Somerset West, CPT", email: "liezel.botha@icloud.com", phone: "082 234 5678", dateAdded: "11 Dec 2024" },
  { id: 8, name: "Nadia Jacobs", subjects: ["Accounting"], area: "Tygervalley, CPT", email: "nadia.jacobs@gmail.com", phone: "081 345 6789", dateAdded: "7 Jan 2025" },
]

const ALL_SUBJECTS = Array.from(
  new Set(INITIAL_APPLICANTS.flatMap(a => a.subjects.map(s => s.subject)))
).sort()

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}>
      {cfg.label}
    </span>
  )
}

function SubjectChip({ subject, status }: { subject: string; status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}>
      {subject}
    </span>
  )
}

function qualifiedCount(subjects: SubjectEntry[]) {
  return subjects.filter(s => s.status === "meets").length
}

function CopiedToast({ visible }: { visible: boolean }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-all duration-300 z-50"
      style={{ background: "#3A3A3A", opacity: visible ? 1 : 0, pointerEvents: "none", transform: "translateX(-50%)" }}>
      Copied to clipboard
    </div>
  )
}

type SubjectAction = "qualify" | "not-fit" | "more-info"
type SubjectStatuses = Record<string, Status>

function SubjectCard({
  entry,
  currentStatus,
  hasMatricFile,
  onAction,
}: {
  entry: SubjectEntry
  currentStatus: Status
  hasMatricFile: boolean
  onAction: (action: SubjectAction) => void
}) {
  const [actioned, setActioned] = useState(false)

  const handleAction = (action: SubjectAction) => {
    onAction(action)
    setActioned(true)
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E3DF" }}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4"
        style={{ background: "#FAFAF8", borderBottom: "1px solid #E5E3DF" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#3A3A3A" }}>{entry.subject}</p>
          <p className="text-xs mt-0.5" style={{ color: "#8A8580" }}>{entry.matricResult}</p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-4" style={{ background: "#FFF" }}>
        {/* Review callout */}
        {currentStatus === "review" && entry.reviewNote && (
          <div className="px-4 py-3 rounded-lg border-l-4" style={{ background: "#FFF8E1", borderColor: "#FFE22B" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#A0620A" }}>Needs Review</p>
            <p className="text-xs leading-relaxed" style={{ color: "#A0620A" }}>{entry.reviewNote}</p>
          </div>
        )}

        {/* Missing info callout */}
        {currentStatus === "missing" && !hasMatricFile && (
          <div className="px-4 py-3 rounded-lg border-l-4" style={{ background: "#F1F0EE", borderColor: "#C5C2BD" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#5A5652" }}>Missing Information</p>
            <p className="text-xs" style={{ color: "#5A5652" }}>Matric certificate has not been uploaded — result unverified.</p>
          </div>
        )}

        {/* Experience note */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#8A8580" }}>Experience note</p>
          <p className="text-sm leading-relaxed" style={{ color: "#3A3A3A" }}>{entry.experience}</p>
        </div>

        {/* Per-subject action buttons */}
        {actioned ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "#F1F0EE" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="7" fill="#8A8580"/>
              <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs font-medium" style={{ color: "#5A5652" }}>Action recorded for {entry.subject}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1 border-t" style={{ borderColor: "#F1F0EE" }}>
            <button onClick={() => handleAction("qualify")}
              className="w-full py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#1A7A47", color: "#FFF" }}>
              Mark as Qualified — Keep on File
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => handleAction("more-info")}
                className="py-2.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E3DF", color: "#3A3A3A", background: "#FFF" }}>
                Needs More Info
              </button>
              <button onClick={() => handleAction("not-fit")}
                className="py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ background: "#FDE8EC", color: "#B0253C" }}>
                Not a Fit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicantDrawer({
  applicant,
  subjectStatuses,
  onClose,
  onSubjectAction,
}: {
  applicant: Applicant
  subjectStatuses: SubjectStatuses
  onClose: () => void
  onSubjectAction: (subjectName: string, action: SubjectAction) => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = (val: string) => {
    navigator.clipboard.writeText(val).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qualified = applicant.subjects.filter(s => subjectStatuses[s.subject] === "meets").length
  const total = applicant.subjects.length

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: "rgba(58,58,58,0.25)" }} onClick={onClose} />

      <div className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-[560px] overflow-y-auto flex flex-col"
        style={{ background: "#FFFFFF", boxShadow: "-4px 0 32px rgba(58,58,58,0.1)" }}>

        {/* Drawer header */}
        <div className="flex items-start justify-between px-8 py-6 border-b" style={{ borderColor: "#E5E3DF" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#3A3A3A" }}>{applicant.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: "#8A8580" }}>
              {total === 1
                ? applicant.subjects[0].subject
                : `${total} subjects — ${qualified} of ${total} qualified`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 flex-shrink-0 ml-4"
            aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="#3A3A3A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 px-8 py-6 flex flex-col gap-7">
          {/* Contact */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>Contact</h3>
            <div className="flex flex-col gap-2">
              {[
                { icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z", value: applicant.email },
                { icon: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z", value: applicant.phone },
              ].map(({ icon, value }) => (
                <div key={value} className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg"
                  style={{ background: "#F9F8F6" }}>
                  <div className="flex items-center gap-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580", flexShrink: 0 }}>
                      <path d={icon} fill="currentColor"/>
                    </svg>
                    <span className="text-sm" style={{ color: "#3A3A3A" }}>{value}</span>
                  </div>
                  <button onClick={() => copy(value)} className="text-xs font-medium hover:underline" style={{ color: "#FD3352" }}>Copy</button>
                </div>
              ))}
            </div>
          </section>

          {/* General details */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>Details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Area", value: applicant.area },
                { label: "Mode", value: applicant.mode },
                { label: "Availability", value: applicant.availability },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs" style={{ color: "#8A8580" }}>{label}</dt>
                  <dd className="text-sm font-medium mt-0.5" style={{ color: "#3A3A3A" }}>{value}</dd>
                </div>
              ))}
              <div className="col-span-2">
                <dt className="text-xs" style={{ color: "#8A8580" }}>Grade levels</dt>
                <dd className="flex flex-wrap gap-1.5 mt-1">
                  {applicant.grades.map(g => (
                    <span key={g} className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: "#F1F0EE", color: "#3A3A3A" }}>{g}</span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          {/* Per-subject cards */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>
              {applicant.subjects.length === 1 ? "Subject" : `Subjects (${applicant.subjects.length})`}
            </h3>
            <div className="flex flex-col gap-3">
              {applicant.subjects.map(entry => (
                <SubjectCard
                  key={entry.subject}
                  entry={entry}
                  currentStatus={subjectStatuses[entry.subject] ?? entry.status}
                  hasMatricFile={!!applicant.matricFile}
                  onAction={action => onSubjectAction(entry.subject, action)} />
              ))}
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A8580" }}>Documents</h3>
            <div className="flex flex-col gap-2">
              <a href="#" onClick={e => e.preventDefault()}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors hover:border-[#FD3352] group"
                style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-sm font-medium" style={{ color: "#3A3A3A" }}>{applicant.cvFile}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-auto opacity-40 group-hover:opacity-100" style={{ color: "#FD3352" }}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              {applicant.matricFile ? (
                <a href="#" onClick={e => e.preventDefault()}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors hover:border-[#FD3352] group"
                  style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "#3A3A3A" }}>{applicant.matricFile}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-auto opacity-40 group-hover:opacity-100" style={{ color: "#FD3352" }}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                  style={{ borderColor: "#E5E3DF", background: "#FAFAF8" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#C5C2BD" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm" style={{ color: "#8A8580" }}>Matric certificate — not uploaded</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <CopiedToast visible={copied} />
    </>
  )
}

function PhoneReveal({ phone }: { phone: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <button onClick={() => setRevealed(r => !r)}
      title={revealed ? phone : "Show number"}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
      style={{ color: revealed ? "#FD3352" : "#8A8580" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
      </svg>
    </button>
  )
}

function ActiveApplicantsTab() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Applicant | null>(null)

  // Track per-applicant, per-subject statuses
  const [subjectStatusMap, setSubjectStatusMap] = useState<Record<number, SubjectStatuses>>({})

  const getSubjectStatuses = (applicant: Applicant): SubjectStatuses => {
    const overrides = subjectStatusMap[applicant.id] ?? {}
    const result: SubjectStatuses = {}
    applicant.subjects.forEach(s => {
      result[s.subject] = overrides[s.subject] ?? s.status
    })
    return result
  }

  const handleSubjectAction = (applicantId: number, subjectName: string, action: SubjectAction) => {
    const newStatus: Status =
      action === "qualify" ? "meets" :
      action === "not-fit" ? "not-qualified" :
      "missing"

    setSubjectStatusMap(prev => ({
      ...prev,
      [applicantId]: { ...(prev[applicantId] ?? {}), [subjectName]: newStatus },
    }))

    // Update selected applicant state if drawer is open
    if (selected?.id === applicantId) {
      setSelected(prev => prev ? { ...prev } : null)
    }
  }

  const filtered = INITIAL_APPLICANTS.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    const statuses = getSubjectStatuses(a)
    if (subjectFilter !== "all" && !a.subjects.some(s => s.subject.toLowerCase().includes(subjectFilter.toLowerCase()))) return false
    if (statusFilter !== "all") {
      const hasMatchingStatus = a.subjects.some(s => (statuses[s.subject] ?? s.status) === statusFilter)
      if (!hasMatchingStatus) return false
    }
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 rounded-lg border text-sm font-medium"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}>
            <option value="all">All statuses</option>
            <option value="meets">Meets Criteria</option>
            <option value="review">Review</option>
            <option value="missing">Missing Info</option>
            <option value="not-qualified">Not Qualified</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="#8A8580" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Filter by subject..."
            value={subjectFilter === "all" ? "" : subjectFilter}
            onChange={e => setSubjectFilter(e.target.value || "all")}
            className="pl-9 pr-4 py-2.5 rounded-lg border text-sm w-44"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>

        <div className="relative ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="search" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-lg border text-sm w-56"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E3DF", background: "#FAFAF8" }}>
              {["Name & Surname", "Subjects", "Area", "Top Rationale", "Contact", ""].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#8A8580" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "#8A8580" }}>
                  No applicants match these filters
                </td>
              </tr>
            ) : filtered.map((a, i) => {
              const statuses = getSubjectStatuses(a)
              const qualCount = a.subjects.filter(s => statuses[s.subject] === "meets").length
              const total = a.subjects.length
              // Show rationale from first non-meets subject, else first subject
              const primaryEntry = a.subjects.find(s => statuses[s.subject] !== "meets") ?? a.subjects[0]

              return (
                <tr key={a.id}
                  className="transition-colors hover:bg-gray-50 cursor-pointer"
                  style={{ borderTop: i > 0 ? "1px solid #F1F0EE" : undefined }}
                  onClick={() => setSelected(a)}>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold" style={{ color: "#3A3A3A" }}>{a.name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {a.subjects.map(s => (
                        <SubjectChip key={s.subject} subject={s.subject} status={statuses[s.subject] ?? s.status} />
                      ))}
                    </div>
                    {total > 1 && (
                      <p className="text-xs" style={{ color: qualCount === total ? "#1A7A47" : "#8A8580" }}>
                        {qualCount} of {total} subjects qualified
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: "#8A8580" }}>{a.area}</span>
                  </td>
                  <td className="px-5 py-4 max-w-[200px]">
                    <span className="text-xs leading-relaxed" style={{ color: "#8A8580" }}>{primaryEntry.rationale}</span>
                  </td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      <a href={`mailto:${a.email}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                        style={{ color: "#8A8580" }} title={a.email}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                      </a>
                      <PhoneReveal phone={a.phone} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#FD3352]"
                      style={{ color: "#8A8580" }}>
                      View
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <ApplicantDrawer
          applicant={selected}
          subjectStatuses={getSubjectStatuses(selected)}
          onClose={() => setSelected(null)}
          onSubjectAction={(subjectName, action) => handleSubjectAction(selected.id, subjectName, action)} />
      )}
    </div>
  )
}

function OnFileTab() {
  const [search, setSearch] = useState("")
  const [subjectSearch, setSubjectSearch] = useState("")

  const filtered = ON_FILE.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    if (subjectSearch && !a.subjects.some(s => s.toLowerCase().includes(subjectSearch.toLowerCase()))) return false
    return true
  })

  return (
    <div>
      <p className="text-sm mb-5" style={{ color: "#8A8580" }}>
        These applicants have been kept on file for future opportunities.
      </p>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="search" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-lg border text-sm w-48"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Filter by subject..." value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-lg border text-sm w-44"
            style={{ borderColor: "#E5E3DF", background: "#FFF", color: "#3A3A3A", outline: "none" }}
            onFocus={e => (e.target.style.borderColor = "#FD3352")}
            onBlur={e => (e.target.style.borderColor = "#E5E3DF")} />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E3DF", background: "#F5F4F2" }}>
              {["Name & Surname", "Subject(s)", "Area", "Contact", "Date Added"].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#8A8580" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={a.id}
                className="transition-colors hover:bg-gray-50"
                style={{ borderTop: i > 0 ? "1px solid #F1F0EE" : undefined }}>
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold" style={{ color: "#3A3A3A" }}>{a.name}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {a.subjects.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background: "#E8F7EF", color: "#1A7A47" }}>{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: "#8A8580" }}>{a.area}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-0.5">
                    <a href={`mailto:${a.email}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                      style={{ color: "#8A8580" }} title={a.email}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </a>
                    <PhoneReveal phone={a.phone} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: "#8A8580" }}>{a.dateAdded}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard({
  user,
  onSignOut,
}: {
  user?: { email: string; role: "owner" | "staff"; name: string }
  onSignOut: () => void
}) {
  if (!user) return null
  const isOwner = user.role === "owner"
  type Tab = "active" | "onfile" | "users"
  const [tab, setTab] = useState<Tab>("active")
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const tabs: { key: Tab; label: string; ownerOnly?: boolean }[] = [
    { key: "active", label: "Active Applicants" },
    { key: "onfile", label: "On File", ownerOnly: true },
    { key: "users", label: "Manage Users", ownerOnly: true },
  ]

  return (
    <div className="min-h-screen" style={{ background: "#F9F8F6" }}>
      <header className="border-b px-8 py-4 flex items-center gap-6" style={{ background: "#FFF", borderColor: "#E5E3DF" }}>
        <LogoFull className="h-8 w-auto flex-shrink-0" />
        <div className="mx-2 h-6 w-px" style={{ background: "#E5E3DF" }} />
        <div>
          <h1 className="text-base font-semibold" style={{ color: "#3A3A3A" }}>Tutor Applicants</h1>
          <p className="text-xs" style={{ color: "#8A8580" }}>SCOUT — Internal Screening Tool</p>
        </div>

        {/* User menu */}
        <div className="ml-auto relative">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E5E3DF", background: "#FFF" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: isOwner ? "#FDE8EC" : "#F1F0EE", color: isOwner ? "#B0253C" : "#5A5652" }}>
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-tight" style={{ color: "#3A3A3A" }}>{user.name}</p>
              <p className="text-xs leading-tight capitalize" style={{ color: "#8A8580" }}>{user.role}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "#8A8580" }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded-xl border py-1 overflow-hidden"
                style={{ background: "#FFF", borderColor: "#E5E3DF", boxShadow: "0 4px 20px rgba(58,58,58,0.1)" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "#F1F0EE" }}>
                  <p className="text-xs font-semibold" style={{ color: "#3A3A3A" }}>{user.name}</p>
                  <p className="text-xs truncate" style={{ color: "#8A8580" }}>{user.email}</p>
                </div>
                {isOwner && (
                  <button onClick={() => { setTab("users"); setUserMenuOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center gap-2.5"
                    style={{ color: "#3A3A3A" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "#8A8580" }}>
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Manage users
                  </button>
                )}
                <button onClick={onSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center gap-2.5"
                  style={{ color: "#B0253C" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="px-8 py-8 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: "#F1F0EE" }}>
          {tabs.filter(t => !t.ownerOnly || isOwner).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === key ? "#FFF" : "transparent",
                color: tab === key ? "#3A3A3A" : "#8A8580",
                boxShadow: tab === key ? "0 1px 4px rgba(58,58,58,0.1)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "active" && <ActiveApplicantsTab />}
        {tab === "onfile" && isOwner && <OnFileTab />}
        {tab === "users" && isOwner && <ManageUsers />}
      </main>
    </div>
  )
}
