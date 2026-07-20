-- Formalizes the lead status machine from BON_BUILD_SEQUENCE.md Phase B1:
-- new -> contacted -> qualified -> converted | dead
-- Drops 'audit_sent' as a lead status — that concept now lives on the
-- separate `audits` table (see 0007), not on the lead itself.
-- Checked live data first: only 'new' and 'contacted' rows exist today,
-- both compatible with the new constraint.
alter table leads add constraint leads_status_check
  check (status in ('new', 'contacted', 'qualified', 'converted', 'dead'));
