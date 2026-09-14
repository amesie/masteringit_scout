-- Deterministic scoring replaces the AI-judged score: 4 categories worth 25
-- points each (matric mark, subject match, grade match, notes/context
-- match). Grade matching needs Hiring Needs to store grades the same
-- structured way applicants do (Grade 1-12 + Tertiary) instead of freeform
-- text, so exact overlap can be computed instead of parsing prose.
--
-- `grade_range` (freeform text) is left in place, unused going forward —
-- same "don't force-migrate old data" pattern already used for
-- applicants.area/grade_range.

alter table public.open_needs
  add column if not exists grades text[] not null default '{}',
  add column if not exists tertiary boolean not null default false;

comment on column public.open_needs.grades is 'Structured grades (e.g. {"8","9","10"}), replacing freeform grade_range for new needs.';
comment on column public.open_needs.tertiary is 'Whether this need includes tertiary/post-matric level.';
