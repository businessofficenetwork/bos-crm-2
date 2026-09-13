-- Statute of Limitations countdown: a configurable rules table, same
-- shape as op_threshold_rules. The seeded CO/OK/MO rows below are
-- PLACEHOLDERS ONLY (deadline_months is not a real legal number) -
-- verified = false on all of them, which the UI must show a persistent
-- warning for. Do not flip verified = true until Keri has confirmed the
-- real deadline with an attorney or the state insurance code - see the
-- brief this was built from ("Before Building This" section).

create table statute_of_limitations_rules (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  claim_type text,
  deadline_months int not null,
  trigger_event text not null default 'date_of_loss',
  source_note text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table statute_of_limitations_rules enable row level security;
create policy "allow all - statute_of_limitations_rules" on statute_of_limitations_rules for all using (true) with check (true);

insert into statute_of_limitations_rules (state, claim_type, deadline_months, trigger_event, source_note, verified)
values
  ('CO', 'first-party property', 24, 'date_of_loss', 'PLACEHOLDER - needs legal verification. Do not rely on this number.', false),
  ('OK', 'first-party property', 24, 'date_of_loss', 'PLACEHOLDER - needs legal verification. Do not rely on this number.', false),
  ('MO', 'first-party property', 24, 'date_of_loss', 'PLACEHOLDER - needs legal verification. Do not rely on this number.', false);

-- date_of_loss already exists on claims (added in 0001_v1_core_schema.sql).
alter table claims
  add column sol_deadline date,
  add column sol_status text;
