-- O&P (Overhead & Profit) threshold checker: a configurable rule engine
-- rather than a hardcoded "3 trades" rule, since the real threshold
-- varies by carrier and state.

create table op_threshold_rules (
  id uuid primary key default gen_random_uuid(),
  carrier_name text,
  state text,
  min_trades_required int not null default 3,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table op_threshold_rules enable row level security;
create policy "allow all - op_threshold_rules" on op_threshold_rules for all using (true) with check (true);

-- Global default rule: carrier_name and state both null means "applies
-- to everything that has no more specific rule".
insert into op_threshold_rules (carrier_name, state, min_trades_required, notes)
values (null, null, 3, 'Global default rule - applies when no carrier- or state-specific rule matches.');

-- `state` is added here (not just to op_threshold_rules) because the claims
-- table didn't have one yet, and rule-matching needs it. It's also needed
-- by the statute-of-limitations feature planned as a follow-up.
alter table claims
  add column state text,
  add column trades_involved text[] not null default '{}',
  add column op_qualifies boolean,
  add column op_override boolean,
  add column op_notes text;
