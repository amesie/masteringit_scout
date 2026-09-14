import { GRADES } from "@/lib/intake-options"

export default function GradeSelector({
  grades,
  tertiary,
  onChange,
  gradesLabel = "Grades",
  tertiaryLabel = "Tertiary / post-matric",
}: {
  grades: string[]
  tertiary: boolean
  onChange: (grades: string[], tertiary: boolean) => void
  gradesLabel?: string
  tertiaryLabel?: string
}) {
  const toggleGrade = (g: string) => {
    onChange(grades.includes(g) ? grades.filter(x => x !== g) : [...grades, g], tertiary)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "#3A3A3A" }}>{gradesLabel}</label>
        <div className="flex flex-wrap gap-2">
          {GRADES.map(g => {
            const checked = grades.includes(g)
            return (
              <label key={g}
                className="flex items-center justify-center w-9 h-9 rounded-lg border text-xs font-medium cursor-pointer transition-all"
                style={{
                  borderColor: checked ? "#FD3352" : "#E5E3DF",
                  background: checked ? "#FD3352" : "#FFF",
                  color: checked ? "#FFF" : "#3A3A3A",
                }}>
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleGrade(g)} />
                {g}
              </label>
            )
          })}
        </div>
      </div>

      <label
        className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm cursor-pointer transition-all w-fit"
        style={{
          borderColor: tertiary ? "#FD3352" : "#E5E3DF",
          background: tertiary ? "#FFF5F7" : "#FFF",
          color: "#3A3A3A",
        }}>
        <input type="checkbox" className="sr-only" checked={tertiary} onChange={() => onChange(grades, !tertiary)} />
        <span className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
          style={{ borderColor: tertiary ? "#FD3352" : "#C5C2BD", background: tertiary ? "#FD3352" : "transparent" }}>
          {tertiary && (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
        {tertiaryLabel}
      </label>
    </div>
  )
}
