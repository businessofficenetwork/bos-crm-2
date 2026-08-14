-- Named individual logins for the CRM itself (admin/office staff),
-- separate from portal_users (which is for contractors logging into
-- their own portal). Per Keri's decision: named accounts, not shared
-- passwords, so audit reviews/messages can auto-credit the right
-- person instead of everyone typing their name in by hand.
create table crm_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'staff')),
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now()
);

-- Password hashes must never be reachable via the anon key - same
-- precedent as portal_users (0017_secure_portal_tables.sql). RLS with
-- zero policies means only the service-role key (used exclusively in
-- Netlify functions) can touch this table.
alter table crm_users enable row level security;
