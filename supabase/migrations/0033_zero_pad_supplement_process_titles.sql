-- The Knowledge Base lists a category's entries ordered by title, and
-- 0032 titled these "1. ...", "2. ...", ..., "34. ..." - which sorts
-- lexicographically (1, 10, 11, ..., 2, 20, ...) instead of in the
-- reading order the category description promises ("read it top to
-- bottom"). Zero-padding the number fixes the sort without needing any
-- app-side renumbering logic.
update kb_entries
set title = regexp_replace(title, '^(\d)\. ', '0\1. '), updated_at = now()
where category_id = 'supplement-process'
  and title ~ '^\d\. ';
