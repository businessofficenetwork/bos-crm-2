-- BOS CRM v1 core schema: contractors, claims, supplements, actions
-- Run once in the Supabase SQL editor against the live project.

create extension if not exists pgcrypto;

create table contractors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  market text not null default 'other' check (market in ('MO', 'WI', 'other')),
  pricing_tier text,
  status text not null default 'active' check (status in ('active', 'inactive', 'prospect')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references contractors(id),
  property_address text,
  homeowner_name text,
  carrier text,
  claim_number text,
  adjuster_name text,
  adjuster_contact text,
  date_of_loss date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index claims_contractor_id_idx on claims(contractor_id);

create table supplements (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id),
  stage text not null default 'Intake' check (stage in (
    'Intake', 'Docs Received', 'Reviewed', 'Supplement Written',
    'Submitted', 'Carrier Response', 'Approved', 'Paid', 'Invoiced', 'Closed'
  )),
  original_estimate_rcv numeric(12, 2),
  supplement_requested numeric(12, 2),
  supplement_approved numeric(12, 2),
  bon_fee numeric(12, 2),
  intake_date date,
  docs_received_date date,
  reviewed_date date,
  supplement_written_date date,
  submitted_date date,
  carrier_response_date date,
  approved_date date,
  paid_date date,
  invoiced_date date,
  closed_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supplements_claim_id_idx on supplements(claim_id);

create table actions (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references supplements(id),
  description text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index actions_supplement_id_idx on actions(supplement_id);

-- No auth/login system exists yet in v1, so RLS is enabled with a permissive
-- policy for now (tighten once user accounts are added).
alter table contractors enable row level security;
alter table claims enable row level security;
alter table supplements enable row level security;
alter table actions enable row level security;

create policy "allow all - contractors" on contractors for all using (true) with check (true);
create policy "allow all - claims" on claims for all using (true) with check (true);
create policy "allow all - supplements" on supplements for all using (true) with check (true);
create policy "allow all - actions" on actions for all using (true) with check (true);
