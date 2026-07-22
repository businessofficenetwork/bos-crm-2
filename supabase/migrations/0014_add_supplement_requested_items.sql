-- Checklist of items requested in a supplement, per Kanban card.
-- `verified` is checked manually for now — auto-checking against the
-- carrier's returned estimate needs the currently-paused audit agent,
-- and will be wired in as an added automation on top of this same
-- structure later, not a schema change.
create table supplement_requested_items (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references supplements(id),
  description text not null,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index supplement_requested_items_supplement_id_idx on supplement_requested_items(supplement_id);

alter table supplement_requested_items enable row level security;
create policy "allow all - supplement_requested_items" on supplement_requested_items for all using (true) with check (true);
