-- MasteringIt pays a flat, non-negotiable rate — applicants.rate was part of
-- the spec's suggested schema but was never collected on the intake form or
-- written to by any code path (see README "Deviations from the spec").
-- Dropping it now that removal has actually been requested.

alter table public.applicants
  drop column if exists rate;
