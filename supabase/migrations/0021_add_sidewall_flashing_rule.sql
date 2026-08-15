-- New Tier 1 audit rule, added per Keri's direction (clarified after an
-- initial draft wrongly framed this as a code/manufacturer requirement
-- - it's condition-based, not code-based: flag only when tear-off
-- photos actually show deterioration).
insert into audit_rules (id, tier, category, carrier_filter, region_filter, detection_prompt, reference_value) values

('sidewall_flashing_deterioration', 1, 'roofing', null, null,
 'Check whether the estimate prices new sidewall/endwall flashing (e.g. ''R&R Aluminum sidewall/endwall flashing'') where the roof plan shows a wall abutment (sidewall, endwall, dormer, or chimney-adjacent roof section). Using tear-off/roof photos, inspect the existing flashing along any wall abutment for deterioration - holes, metal deformation (bent, warped, or crushed sections), or rust/corrosion. If deteriorated flashing is visible in photos but the estimate does not price its replacement, flag as a missing line item. If no photos show the flashing clearly enough to assess its condition, do not flag - insufficient evidence, not an assumed defect.',
 null);
