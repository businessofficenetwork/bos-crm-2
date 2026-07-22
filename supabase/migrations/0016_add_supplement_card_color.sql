-- Manual override color for a Kanban card, independent of the
-- automatic stage-color outline. Null means "no override, just show
-- the stage-colored outline."
alter table supplements
  add column card_color text;
