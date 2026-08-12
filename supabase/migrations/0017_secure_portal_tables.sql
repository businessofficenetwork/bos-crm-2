-- portal_users and portal_messages were created directly in the
-- Supabase dashboard (not through a migration) by whatever tool built
-- portal.html/portal-admin.html. This migration brings them under
-- migration control and fixes two real security problems found
-- during review:
--   1. portal_users.portal_password stored/compared passwords in
--      plain text. Table has 0 rows live, so this is a safe rename
--      to password_hash (server-side functions hash before insert).
--   2. Neither table had row level security enabled, so the app's
--      shared "anon" key (embedded in the portal's client-side JS)
--      could read/write both directly, bypassing the portal's login
--      screen entirely. Enabling RLS with zero policies matches the
--      `leads` table precedent (0004_add_leads.sql): only the
--      service-role key, used exclusively in Netlify functions, can
--      touch these tables from now on.

create table if not exists portal_users (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id),
  username text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now()
);

alter table portal_users add column if not exists password_hash text;
alter table portal_users drop column if exists portal_password;
alter table portal_users alter column password_hash set not null;
alter table portal_users enable row level security;

create table if not exists portal_messages (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id),
  sender text not null check (sender in ('bon', 'contractor')),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table portal_messages enable row level security;
