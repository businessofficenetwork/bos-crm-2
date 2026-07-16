-- Standalone reminders, not tied to any contractor/claim/supplement
-- (e.g. "call the insurance rep Friday"). Distinct from the actions
-- table, which is always attached to a supplement.
create table reminders (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No auth/login system exists yet, so RLS is enabled with a permissive
-- policy for now, matching the other v1 tables.
alter table reminders enable row level security;
create policy "allow all - reminders" on reminders for all using (true) with check (true);
