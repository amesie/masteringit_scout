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
- **AI abstraction**: every AI call goes through `generateContent()` in
  `lib/ai.ts` — the only file that references the underlying provider by
  name. It calls Gemini today using the `scout_gemini_api` env var (that's
  the actual key name in Vercel — not `GEMINI_API_KEY` as the spec guessed).
  To move to Claude later, swap the body of that one function to call the
  Claude API (`claude-haiku-4-5`) with an `ANTHROPIC_API_KEY` env var; no
  other file changes.
- **Scoring**: `lib/scoring.ts` calls `generateContent()` to assess each
  subject an applicant applied for against `open_needs` (the owner's current
  hiring criteria — a table this build added since the spec didn't define
  where "current criteria" should live). If the model's response can't be
  parsed or it reports low confidence, the applicant is inserted with
  `needs_review = true` and a reason — never silently guessed or dropped.
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
  The column itself is left in place in `applicants` (unused) rather than
  migrated out, since removing a column wasn't asked for.
- Added `open_needs` (owner's current hiring criteria) and a `needs_review`
  flag on `applicants`, both implied by the spec but not given explicit
  schemas.
