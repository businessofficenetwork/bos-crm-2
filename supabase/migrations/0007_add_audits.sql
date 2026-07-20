-- Scope audit records. Kept separate from supplements — an audit exists
-- before a supplement does, and some audits won't convert into one.
-- Per BON_BUILD_SEQUENCE.md Phase A1.
create table audits (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references claims(id),
  lead_id uuid references leads(id),        -- nullable; audits can originate from either
  status text not null default 'queued'
    check (status in ('queued', 'parsing', 'analyzing', 'findings_ready', 'failed')),
  error_detail text,                        -- populated when status = 'failed'
  estimate_pdf_path text,                   -- Supabase Storage path
  photos_paths text[],
  carrier text,
  parsed_estimate jsonb,                    -- normalized line items from the Xactimate PDF
  findings jsonb,                           -- array of {rule_id, tier, line_item, shortfall_type, est_value, confidence, rationale}
  est_total_recovery numeric,
  reviewed_by text,                         -- human QA sign-off, null until reviewed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index audits_claim_id_idx on audits(claim_id);
create index audits_lead_id_idx on audits(lead_id);

-- Same trust model as every other CRM-internal table (contractors, claims,
-- supplements, actions, reminders): populated/read by the app, no auth
-- system yet, so permissive policy for now. Unlike `leads`, nothing public
-- writes to this table directly, so it doesn't need the service-role-only
-- lockdown.
alter table audits enable row level security;
create policy "allow all - audits" on audits for all using (true) with check (true);
