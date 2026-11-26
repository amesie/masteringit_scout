-- "Successful" applicant status: the applicant passed their interview and
-- is now a tutor. These applicants appear on the dashboard's Active Tutors
-- tab. successful_at records when they were marked successful.

alter type public.applicant_status add value if not exists 'successful';

alter table public.applicants
  add column if not exists successful_at timestamptz;

comment on column public.applicants.successful_at is 'When the applicant was marked Successful (passed interview, now a tutor). Cleared if their status changes away from successful.';
