-- Matric verification (lib/verification.ts) cross-checks self-reported
-- matric marks against the uploaded certificate; matric_verified records
-- the outcome separately from needs_review, which already means other
-- things (e.g. no mark provided at all).
--
-- Outreach drafting (app/api/applicants/[id]/draft-outreach) persists a
-- draft interview-invite email generated when an applicant is shortlisted,
-- so any employee can review/edit/send it — never sent automatically.

alter table public.applicants
  add column if not exists matric_verified boolean,
  add column if not exists outreach_draft_subject text,
  add column if not exists outreach_draft_body text;

comment on column public.applicants.matric_verified is 'null = not checked (no certificate uploaded, or verification failed); true = self-reported marks consistent with the certificate; false = a discrepancy was found (see review_reason).';
comment on column public.applicants.outreach_draft_subject is 'AI-drafted interview-invite email subject, generated on shortlisting. Never sent automatically — an employee must review and click Send.';
comment on column public.applicants.outreach_draft_body is 'AI-drafted interview-invite email body. Cleared once actually sent.';
