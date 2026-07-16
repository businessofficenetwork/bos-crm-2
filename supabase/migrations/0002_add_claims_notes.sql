-- Add a free-form notes field to claims (Jobs), matching the notes
-- field already present on contractors and supplements.
alter table claims add column notes text;
