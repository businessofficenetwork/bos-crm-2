-- Quick-reference fields for how a contractor likes to be worked with,
-- shown on their main screen so anyone on the team can see it before
-- reaching out. Free text, not enums - Keri's examples ("Type A, OCD,
-- Funny, Laid Back") aren't a fixed list.
alter table contractors
  add column communication_style text,
  add column best_contact_time text,
  add column preferred_contact_method text check (
    preferred_contact_method is null
    or preferred_contact_method in ('call', 'text', 'email')
  );
