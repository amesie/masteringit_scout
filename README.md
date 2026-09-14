# SCOUT

Tutor applicant intake, scoring, and shortlisting for MasteringIt. Next.js (App Router) + Supabase + Vercel.

See `scout_build_spec.md` for the original spec.

## One-time setup (do this before using the app)

### 1. Apply the database schema

Vercel's "Sensitive" environment variables (the DB password, service-role key)
are write-only — nothing, including this tool, can read them back via the
CLI. So the schema has to be applied by hand, once:

1. Open the Supabase project → **SQL Editor**.
2. Paste the contents of `supabase/migrations/0001_init.sql` and run it.
3. Paste the contents of `supabase/migrations/0002_structured_intake.sql` and
   run it too — adds the `country`/`suburb` columns used by the current
   `/apply` form.
4. Paste the contents of `supabase/migrations/0003_drop_rate_column.sql` and
   run it — drops the unused `rate` column.
5. Paste the contents of `supabase/migrations/0004_deterministic_scoring.sql`
   and run it — adds structured `grades`/`tertiary` columns to `open_needs`,
   used by the deterministic scoring formula below.

This creates the `applicants`, `profiles`, and `open_needs` tables, RLS
policies, and a private `applicant-documents` storage bucket for CVs/matric
certificates.

### 2. Create the owner account

There's no public sign-up. Visit `/bootstrap` on the deployed app (or
`localhost:3000/bootstrap` locally) and create the owner login — e.g. Maryke
Jooste. That page creates exactly one owner account and then disables itself
(the API checks whether an owner profile already exists). From then on, the
owner invites employees from **Manage Users** in the dashboard.

### 3. Add current hiring needs

Log in → **Hiring Needs** tab → add the subjects/grades currently being
hired for. New applicants are scored against this list: a matching subject
at or above its minimum score → `active`; otherwise → `dormant`. Leave it
empty and everything lands as dormant until you populate it.

### 4. Set up the applicant confirmation email

Applicants get a neutral "we've received your application" email after
submitting `/apply` (`lib/email.ts`). There's no verified sending domain for
masteringit.co.za, so this sends over Gmail SMTP from a dedicated account
instead of a transactional email API:

1. Create a Gmail account to send from (e.g. `scout.masteringit@gmail.com`)
   — don't reuse a personal or the owner's real inbox.
2. On that account: **Google Account → Security → 2-Step Verification**
   (turn it on) **→ App Passwords** → generate one for "Mail".
3. In Vercel → Project Settings → Environment Variables, add:
   - `scout_email_user` = the Gmail address
   - `scout_email_password` = the 16-character App Password (not the
     account's real password)
4. Redeploy.

If these aren't set, or sending fails for any reason, the application is
still saved normally — the email is best-effort and never blocks a
submission (see the `try/catch` around `sendApplicantConfirmation()` in
`app/api/apply/route.ts`).

## Local development

```bash
npm install
npx vercel env pull .env.local --environment=production --yes   # or development/preview
npm run dev
```

Note: local dev cannot resolve `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_*` passwords,
etc., for the same write-only reason as above — those only resolve inside
Vercel's deployed runtime. Routes that need the service-role key (`/api/apply`,
CSV import, user invites, the cron job) will only fully work once deployed,
or if you manually paste your own copy of the key into `.env.local` (get it
from the Supabase dashboard → Project Settings → API).

## Architecture notes

- **Routes**: `/apply` (public intake form), `/login` (Supabase auth),
  `/dashboard` (auth-gated, owner + employees).
- **Roles**: `owner` and `employee` have identical dashboard permissions.
  The only owner-exclusive page is **Manage Users** (`/dashboard/users`) —
  per the build spec, that's intentionally the *one* gated capability, not a
  broader permission system.
- **AI abstraction**: `generateContent()` in `lib/ai.ts` calls Gemini using
  the `scout_gemini_api` env var. It's currently **unused** — scoring was
  switched to a fully deterministic formula (see below) after the Gemini
  integration proved unreliable in practice. The function is left in place
  as a working abstraction in case a future feature needs an AI call (e.g.
  CV text extraction); nothing currently calls it.
- **Email abstraction**: `sendApplicantConfirmation()` in `lib/email.ts` is
  the only file that sends applicant-facing email — Gmail SMTP via
  `scout_email_user`/`scout_email_password` (see setup step 4 above).
  Content is a neutral acknowledgment of receipt only, per the build spec
  guardrail against automated rejections or status messages. Called
  fire-and-forget from `/api/apply` — a send failure is logged but never
  fails the applicant's submission.
- **Scoring**: `lib/scoring.ts` computes a 0–100 score per subject from 4
  categories worth 25 points each, no AI involved:
  1. **Matric mark** — the applicant's self-reported mark for that subject,
     scaled against a flat global qualifying threshold (`QUALIFYING_MATRIC_MARK`
     in `lib/scoring.ts`, currently 70).
  2. **Subject match** — full marks if an active Hiring Need exists for that
     subject.
  3. **Grade match** — full marks if the applicant's grades/tertiary overlap
     the matching need's grades/tertiary (exact overlap, both sides
     structured — see `open_needs.grades`/`tertiary`).
  4. **Notes/context match** — up to half marks each for the applicant's
     teaching mode and location being mentioned in the need's free-text
     `notes` (case-insensitive substring match).

     When multiple active needs match a subject, the applicant is scored
     against each and the best total is kept. When no need matches at all,
     only category 1 counts (max 25/100) — the applicant lands in the
     dormant pool, same as before. The applicant's overall `match_score` is
     the **best-scoring subject**, so a strong primary subject isn't dragged
     down by a weaker secondary one. If no subject has a matric mark at all,
     the applicant is flagged `needs_review = true` rather than scored —
     never silently guessed or dropped.
- **Grades/curriculum are per-subject, not global**: each entry in
  `applicants.subject_scores` (jsonb) carries its own `grades`, `tertiary`,
  `curriculum`, and `matric_mark` — an applicant can apply to tutor CAPS
  Grade 8–10 Maths and IEB Tertiary Accounting in the same submission, each
  scored independently. `country`/`suburb` are the only applicant-level
  location fields now; `area` and `grade_range` remain on the table purely
  for CSV-imported/older rows that predate this structure (see
  `lib/status.ts`'s `applicantLocation()` for the fallback the dashboard
  uses). Hiring Needs use the same structured Grade 1–12 + Tertiary picker
  (`components/GradeSelector.tsx`, shared with the intake form) instead of
  freeform grade-range text, so grade-match scoring (category 3 above) is
  exact overlap rather than parsed prose.
- **Dormant lifecycle**: `/api/cron/dormant-check`, scheduled nightly via
  `vercel.json`. Reactivates dormant applicants that now match an open need;
  flags applicants dormant 12+ months for manual review. Never deletes or
  auto-archives (POPIA data-retention guardrail from the spec).
- **Documents**: CVs/matric certificates go to a private Supabase Storage
  bucket, uploaded server-side. The dashboard fetches short-lived signed URLs
  on demand (`/api/documents`) rather than exposing the bucket publicly.

## Deviations from the spec worth knowing about

- Real Vercel env var names differ from the spec's guesses — see
  `.env.example` for what's actually there.
- The Figma prototype gated "On File" behind the owner role; the spec's
  permissions section says only user management is owner-exclusive, so this
  build follows the spec and gives employees the same access.
- The spec's data model includes `applicants.rate`. MasteringIt pays a flat,
  non-negotiable rate, so this build doesn't collect or score on it anywhere
  — the intake form has no rate field, and nothing writes to that column.
  The column was dropped from `applicants` in migration `0003`.
- Added `open_needs` (owner's current hiring criteria) and a `needs_review`
  flag on `applicants`, both implied by the spec but not given explicit
  schemas.
