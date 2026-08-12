-- Three of the four seeded Tier 1 audit_rules (0012) need documents
-- beyond the estimate PDF to actually be evaluated: quantity/waste
-- rules need the property measurement report (EagleView/HOVER),
-- ridge cap verification needs roof photos. photos_paths already
-- exists on audits (0007); the measurement report has nowhere to go.
alter table audits add column if not exists measurement_report_path text;
