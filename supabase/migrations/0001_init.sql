-- SCOUT initial schema
-- Applicants, staff profiles/roles, and the owner's current hiring criteria.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- profiles: one row per dashboard user (owner or employee), linked 1:1 to
-- auth.users. Role and status are only ever written by server-side routes
-- using the service-role key (invite / revoke), never directly by clients.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  status text not null default 'invited' check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now()
);

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_self_or_owner"
  on public.profiles for select
  using (id = auth.uid() or public.is_owner());

-- No insert/update/delete policies: all writes go through server routes
-- using the service-role key (invite, revoke, first-login activation).

-- ─────────────────────────────────────────────────────────────────────────
-- open_needs: the owner's current hiring criteria. Drives whether a new
-- applicant lands as `active` (matches a current need) or `dormant`
-- (qualified, but nothing open right now), and what dormant applicants are
-- checked against for reactivation.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.open_needs (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  grade_range text,
  min_score integer not null default 70,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.open_needs enable row level security;

-- Owner and employees have identical permissions everywhere except staff
-- account management (see profiles policies below) — per the build spec,
-- that's the *only* owner-exclusive capability, so open_needs is writable
-- by any authenticated dashboard user, not just the owner.
create policy "open_needs_select_authenticated"
  on public.open_needs for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid()));

create policy "open_needs_write_authenticated"
  on public.open_needs for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid()))
  with check (exists (select 1 from public.profiles where id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────
-- applicants
-- ─────────────────────────────────────────────────────────────────────────
create type public.applicant_status as enum (
  'active', 'shortlisted', 'interviewed', 'rejected', 'dormant', 'archived'
);

create table if not exists public.applicants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  contact text generated always as (coalesce(email, '') || case when email is not null and phone is not null then ' / ' else '' end || coalesce(phone, '')) stored,
  subjects text[] not null default '{}',
  grade_range text,
  rate numeric,
  location_pref text,
  area text,
  availability text,
  match_score integer,
  score_rationale text,
  subject_scores jsonb not null default '[]'::jsonb,
  status public.applicant_status not null default 'active',
  needs_review boolean not null default false,
  review_reason text,
  applied_at timestamptz not null default now(),
  dormant_since timestamptz,
  last_contacted timestamptz,
  source text not null default 'form',
  cv_file_name text,
  cv_file_url text,
  matric_file_name text,
  matric_file_url text,
  raw_submission jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applicants_status_idx on public.applicants (status);
create index if not exists applicants_dormant_since_idx on public.applicants (dormant_since);
create index if not exists applicants_subjects_gin_idx on public.applicants using gin (subjects);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applicants_set_updated_at on public.applicants;
create trigger applicants_set_updated_at
  before update on public.applicants
  for each row execute function public.set_updated_at();

drop trigger if exists open_needs_set_updated_at on public.open_needs;
create trigger open_needs_set_updated_at
  before update on public.open_needs
  for each row execute function public.set_updated_at();

alter table public.applicants enable row level security;

-- Owner + employees have identical read/write access to applicants.
-- Public submissions (from /apply) and CSV import are written server-side
-- with the service-role key, which bypasses RLS — there is intentionally
-- no anon insert policy here.
create policy "applicants_select_authenticated"
  on public.applicants for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid()));

create policy "applicants_update_authenticated"
  on public.applicants for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid()))
  with check (exists (select 1 from public.profiles where id = auth.uid()));

-- No delete policy anywhere: dormant applicants past 12 months are flagged
-- for review, never auto-deleted or auto-archived (POPIA data-retention
-- guardrail from the build spec).

comment on table public.applicants is 'Tutor applicants: intake, scoring, lifecycle status.';
comment on column public.applicants.needs_review is 'True when SCOUT could not confidently parse the submission, or when a dormant applicant has crossed the 12-month review threshold.';
comment on table public.profiles is 'Dashboard users (owner/employee). Role and status are only written server-side.';
comment on table public.open_needs is 'Owner-maintained list of subjects/grades currently being hired for.';

-- ─────────────────────────────────────────────────────────────────────────
-- Storage: CVs and matric certificates. Private bucket — uploaded and read
-- back exclusively via the service-role key (server routes), so no public
-- storage policies are needed.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('applicant-documents', 'applicant-documents', false)
on conflict (id) do nothing;
