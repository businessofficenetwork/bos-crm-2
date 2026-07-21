-- Adds 'manual_review' as a distinct audits.status value, matching
-- the existing CLAUDE.md rule: "Extraction outputs must pass
-- reconciliation math before being written to the database. Failures
-- set status = 'manual_review', never silently proceed."
-- Distinct from 'failed' (a crash/error) — 'manual_review' means
-- parsing ran but couldn't be trusted (unreadable PDF, or parsed
-- numbers didn't reconcile against the document's own stated totals).
alter table audits drop constraint audits_status_check;
alter table audits add constraint audits_status_check
  check (status in ('queued', 'parsing', 'analyzing', 'findings_ready', 'manual_review', 'failed'));
