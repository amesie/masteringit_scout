-- Structured intake: country/suburb replace the old freeform "area" text for
-- new applications, and each subject_scores entry now carries the grades,
-- tertiary flag, and curriculum the applicant applied under for that
-- specific subject (previously a single global grade_range for the whole
-- application). subject_scores is jsonb, so no column change is needed for
-- that part — this just adds the two new applicant-level location columns.
--
-- `area` and `grade_range` are kept as-is: CSV-imported historical rows only
-- ever had a freeform area string and a single grade_range, and the
-- dashboard falls back to them when country/suburb aren't set.

alter table public.applicants
  add column if not exists country text,
  add column if not exists suburb text;

comment on column public.applicants.country is 'Structured location (new applications via /apply). Null for older/CSV-imported rows — see area.';
comment on column public.applicants.suburb is 'Structured location (new applications via /apply). Null for older/CSV-imported rows — see area.';
comment on column public.applicants.area is 'Freeform location text. Populated for CSV imports and kept for backward compatibility; new form applications also mirror suburb+country here as a display fallback.';
