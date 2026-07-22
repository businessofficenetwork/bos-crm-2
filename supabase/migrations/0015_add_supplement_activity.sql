-- Carrier interaction log per supplement — every step Keri takes, and
-- every message the system drafts, gets logged here chronologically.
-- Separate from job_comments (internal team notes/@mentions on a
-- job) since this is specifically the carrier-facing interaction
-- history for one supplement.
create table supplement_activity (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references supplements(id),
  entry_type text not null default 'manual' check (entry_type in ('manual', 'system')),
  body text not null,
  created_at timestamptz not null default now()
);

create index supplement_activity_supplement_id_idx on supplement_activity(supplement_id);

alter table supplement_activity enable row level security;
create policy "allow all - supplement_activity" on supplement_activity for all using (true) with check (true);
