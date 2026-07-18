-- Comments thread per job (claim), e.g. for the new mentions feature.
-- Typing "@name" in a comment flags it as a mention (checked at query
-- time via body ILIKE '%@%', no separate flag needed for that part).
-- `read` tracks whether a mention has been seen via the notification
-- bell — there's no login system yet, so this is a single shared
-- read state, not per-user.
create table job_comments (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id),
  author text,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index job_comments_claim_id_idx on job_comments(claim_id);

alter table job_comments enable row level security;
create policy "allow all - job_comments" on job_comments for all using (true) with check (true);
