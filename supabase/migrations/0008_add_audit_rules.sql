-- Encodes the Tier 1/2/3 scope-audit workbook as data, not hardcoded
-- logic, so rules can be added/tuned without a code change. Seeding
-- this table (Tier 1 first) is a separate step from creating it.
-- Per BON_BUILD_SEQUENCE.md Phase A1.
create table audit_rules (
  id text primary key,                      -- e.g. 'ridge_cap_three_tab'
  tier int not null,                        -- 1/2/3 from the workbook
  category text,                            -- roofing | elevation | code | quantity | unit_count
  carrier_filter text[],                    -- null = all carriers; else applies to listed carriers
  region_filter jsonb,                      -- e.g. {"state":"CO","min_elevation_ft":6000} for I&W barrier gates
  detection_prompt text not null,           -- the rule expressed as an instruction to the model
  reference_value numeric,                  -- typical recovery value for prioritization
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Same trust model as audits (see 0007) — internal config data, no
-- public path touches it, permissive policy since there's no auth
-- system yet.
alter table audit_rules enable row level security;
create policy "allow all - audit_rules" on audit_rules for all using (true) with check (true);
