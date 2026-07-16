-- Leads captured from the supplement-audit landing page (a separate
-- Netlify site — see supplement-audit-landing/ sibling project).
-- Unlike every other table so far, this one has NO anon access at
-- all: RLS is enabled with zero policies, so the anon/publishable
-- key can neither read nor write. Inserts happen only via the
-- landing page's Netlify function, using the service_role key
-- (which bypasses RLS entirely and must never be exposed client-side).
-- A select policy for authenticated CRM users comes in a later task.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  email text,
  message text,                          -- "biggest supplement headache" free text
  source text not null default 'web',    -- 'meta_ad' | 'cold_call' | 'referral' | 'web'
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,                      -- distinct per ad variant for attribution
  status text not null default 'new',    -- 'new' | 'contacted' | 'audit_sent' | 'converted' | 'dead'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

alter table public.leads add constraint leads_contact_present
  check (phone is not null or email is not null);
