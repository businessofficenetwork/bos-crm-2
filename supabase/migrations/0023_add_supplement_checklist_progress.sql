-- Tracks real check/uncheck progress on the Supplement Guide's checklists
-- (see src/lib/supplementGuideContent.js) per supplement, so a specialist
-- can work an actual claim against the BON SOP checklists instead of just
-- reading them as reference. Shape: { [checklistId]: [bool, bool, ...] },
-- same as the standalone guide page already stores in localStorage.
alter table supplements
  add column checklist_progress jsonb not null default '{}'::jsonb;
