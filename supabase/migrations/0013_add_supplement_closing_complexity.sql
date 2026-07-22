-- Two new fields on supplements for the Pipeline Kanban rebuild:
-- - closing_date: presence indicates the homeowner is selling the
--   house, creating a hard deadline pressure on the supplement.
-- - complexity: manual for now (Roof Only / Multiple Trades /
--   Complex) — "system's assessment of missing items" would need the
--   currently-paused audit agent; this is a plain dropdown until then.
alter table supplements
  add column closing_date date,
  add column complexity text check (complexity in ('roof_only', 'multiple_trades', 'complex'));
