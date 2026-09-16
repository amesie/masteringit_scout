-- Read-only Postgres role for a marker/evaluator to inspect the schema and
-- data directly with any generic Postgres client (TablePlus, DBeaver,
-- psql), without a Supabase account or any write access.
--
-- Scoped to the public schema only — auth.* (password hashes, sessions)
-- and storage.* (uploaded file metadata) stay out of reach regardless.
--
-- BYPASSRLS matters here: the RLS policies on applicants/open_needs/
-- profiles check auth.uid() (Supabase's Auth/PostgREST-aware context),
-- which a plain direct Postgres connection never has — without this the
-- role would have table-level SELECT but the policies would still filter
-- every query down to zero rows. BYPASSRLS only skips row-level filtering;
-- it grants no write or schema-altering capability.
--
-- Replace the password below before running this, then share the
-- resulting connection details with your marker directly — never commit
-- the real password to this repo. Revoke access once grading is done:
--   drop role if exists scout_marker;

create role scout_marker with login password 'REPLACE_WITH_A_PASSWORD' bypassrls;
grant usage on schema public to scout_marker;
grant select on all tables in schema public to scout_marker;
alter default privileges in schema public grant select on tables to scout_marker;
