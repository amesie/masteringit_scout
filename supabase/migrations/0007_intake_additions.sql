-- Additional tutor intake fields collected on /apply:
--   residential_suburb  free-text suburb the applicant lives in (the existing
--                       `suburb` column holds the city/town dropdown choice)
--   current_work        what the applicant currently does (job / studies)
--   teaching_languages  languages they're comfortable teaching in
--   police_clearance    applicant ticked that they are able to obtain a
--                       police clearance certificate
--   popia_consent_at    when the applicant gave POPIA consent to process
--                       their personal information (required to submit)
--
-- All nullable so older and CSV-imported rows remain valid.

alter table public.applicants
  add column if not exists residential_suburb text,
  add column if not exists current_work text,
  add column if not exists teaching_languages text[] not null default '{}',
  add column if not exists police_clearance boolean,
  add column if not exists popia_consent_at timestamptz;

comment on column public.applicants.residential_suburb is 'Free-text suburb the applicant lives in. `suburb` holds the city/town selected from the dropdown.';
comment on column public.applicants.current_work is 'Applicant''s current work or studies, as entered on /apply.';
comment on column public.applicants.teaching_languages is 'Languages the applicant is comfortable teaching in (English / Afrikaans).';
comment on column public.applicants.police_clearance is 'true = applicant indicated they can obtain a police clearance certificate; false = not ticked; null = not asked (older/CSV rows).';
comment on column public.applicants.popia_consent_at is 'Timestamp of the applicant''s POPIA consent on /apply. Null for older/CSV-imported rows.';
comment on column public.applicants.applied_at is 'Date the application was made. Defaults to insert time; staff can correct it from the applicant drawer.';
