# SCOUT — Tutor Recruitment Screener
## Build Specification for Claude Code

**SMME Partner:** MasteringIT (tutoring & career services)
**Owner:** Maryke Jooste
**Purpose:** Automate tutor applicant intake, scoring, shortlisting, and long-term dormant-applicant tracking.

---

## 1. What SCOUT does

SCOUT is a web app with two entry points:

1. A **login-gated dashboard** for the business owner and employees to view, score, and manage tutor applicants.
2. A **public application form** for prospective tutors to apply — no login required.

Applications are automatically scored against the owner's current hiring criteria, sorted into active or dormant status, and tracked over time so qualified-but-not-currently-needed applicants aren't lost.

---

## 2. Already set up (do not recreate)

- **GitHub repo:** `amesie/masteringit_scout`, production branch `main`
- **Vercel project:** `masteringit_scout`, connected to the GitHub repo (auto-deploys on push to `main`)
- **Supabase project:** created, connected to both GitHub and Vercel
  - Email/password auth is enabled
- **Environment variable already set in Vercel:** `GEMINI_API_KEY`
- **Supabase auto-syncs its own project URL and keys into Vercel** via the Supabase↔Vercel integration — these should already appear as environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY` or similarly named — check what's actually present in Vercel before assuming names)

Claude Code should build **into this existing repo/project**, not scaffold a new one from scratch, and should read the actual environment variable names present in Vercel rather than assuming.

---

## 3. Routes & access control

| Route | Who | Access |
|---|---|---|
| `/login` | Owner + employees | Requires Supabase auth login |
| `/dashboard` (or similar) | Owner + employees | Logged-in only |
| `/apply` | New tutor applicants | Fully public, no login |

**Roles:**
- `owner` and `employee` have **identical permissions** across the dashboard — viewing applicants, scoring, shortlisting, messaging candidates, etc.
- The **only** owner-exclusive capability is managing staff accounts (adding or removing employee logins). This should be a single gated page/action, not a broader permission system.

---

## 4. Applicant data model (Supabase / Postgres)

Suggested `applicants` table:

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `name` | text | |
| `contact` | text | phone/email |
| `subjects` | text[] | subjects they can tutor |
| `grade_range` | text | e.g. "Grade 8–12" |
| `rate` | numeric | requested rate |
| `location_pref` | text | online / in-person / either |
| `match_score` | integer | 0–100, set by SCOUT |
| `score_rationale` | text | short AI-generated explanation |
| `status` | enum | `active`, `shortlisted`, `interviewed`, `rejected`, `dormant`, `archived` |
| `applied_at` | timestamp | when they first applied |
| `dormant_since` | timestamp, nullable | set the moment status becomes `dormant` |
| `last_contacted` | timestamp, nullable | updated whenever owner/employee reaches out |
| `source` | text | e.g. "form", "csv_import" — distinguishes new applicants from imported historical ones |

**Import support:** Include a CSV upload flow (admin-only page or a one-off script) that maps Maryke's existing applicant records into this schema, tagging them `source = csv_import`.

---

## 5. Applicant lifecycle logic

1. **New application** submitted via `/apply` → SCOUT extracts structured data from the submission (name, subjects, grade levels, rate, availability, location preference).
2. **Scoring:** SCOUT compares the extracted profile against the owner's current criteria and assigns a `match_score` (0–100) with a short rationale.
3. **Branch:**
   - If the applicant matches a **current** open need → `status = active`, appears on the owner/employee shortlist dashboard.
   - If the applicant is **qualified but there's no current opening** for their subject(s) → `status = dormant`, `dormant_since = now()`.
4. **Dormant pool monitoring** (scheduled job — Supabase scheduled function or Vercel cron):
   - If a **new opening matches** a dormant applicant's subjects → reactivate to `active`, clear `dormant_since`.
   - If **12 months pass** with `status = dormant` and no reactivation → flag the applicant for owner review (e.g. a "needs review" badge on the dashboard, or a notification). The owner then manually confirms (keep dormant, reach out, or archive) — **do not auto-delete**, since this is a data-retention decision the owner should make explicitly (relevant under South Africa's POPIA data protection law — indefinite silent retention without review isn't a defensible policy).

---

## 6. AI provider abstraction (important)

All AI calls must go through a **single backend function**, e.g. `generateContent(prompt, systemInstructions)`, so the underlying provider can be swapped without touching any other code.

- **Now (demo):** this function calls the Gemini API using `GEMINI_API_KEY`.
- **Later (deployment):** swap the function's internals to call the Claude API (`claude-haiku-4-5`) using an `ANTHROPIC_API_KEY` environment variable instead. No other file should reference "Gemini" or "Claude" by name — only this one function.

This function is used for:
- Extracting structured applicant data from free-text submissions
- Scoring applicants against the owner's criteria
- Generating the short rationale shown alongside each score

---

## 7. Guardrails (non-negotiable)

- SCOUT **never sends a rejection message** to an applicant without explicit owner/employee instruction. Automated responses are limited to a neutral acknowledgment of receipt.
- If SCOUT **cannot confidently parse** an application (e.g. missing key fields), it should flag the applicant for manual review rather than guessing or silently dropping them.
- Dormant applicants past 12 months are **flagged for review, never auto-deleted or auto-archived**.
- API keys and Supabase service-role keys must **only** live in Vercel environment variables — never hardcoded or committed to the repo.

---

## 8. Visual design

The visual design has already been prototyped in Figma Make. The exported files are in `/design-reference` at the repo root.

- **Follow this styling exactly** — colors, typography, spacing, button/card shapes, and any icon set used — rather than defaulting to generic styling.
- **Reuse existing components** from `/design-reference` where they match a needed feature (login form, buttons, cards, layout shell) instead of rebuilding them from scratch.
- Check whether the export depends on any fonts, icon packages, or libraries not already in the project, and install them if so — don't assume everything works out of the box.

## 9. Suggested build order

1. Supabase schema: `applicants` table + `employees`/roles table (or use Supabase's built-in `auth.users` with a `role` column via a linked `profiles` table).
2. `/login` page + auth-gated dashboard shell.
3. `/apply` public form → writes to `applicants` table.
4. `generateContent()` abstraction + Gemini integration for scoring.
5. Dashboard: applicant list, filtering by status, scoring display, manual status changes.
6. Owner-only employee management page.
7. Dormant lifecycle: scheduled check + reactivation logic + 12-month flagging.
8. CSV import flow for historical applicants.
