-- Tier 1 audit rules, per BON_BUILD_SEQUENCE.md Phase A1/item #2.
-- Each row encodes one pattern Keri has personally verified from her
-- own claims experience (not general/secondhand suggestions — one
-- candidate rule was deliberately left out because it came from an
-- unverified AI suggestion rather than her own confirmed experience).
--
-- carrier_filter/region_filter/reference_value are left null on all
-- four for now — Keri doesn't yet have enough real-claims data to say
-- whether any of these are carrier- or region-specific, or what a
-- typical dollar impact is. Fill these in once the audit pipeline has
-- scanned enough real estimates to answer those questions with data
-- instead of a guess.

insert into audit_rules (id, tier, category, carrier_filter, region_filter, detection_prompt, reference_value) values

('ridge_cap_standalone_lkq', 1, 'roofing', null, null,
 'Check whether the estimate prices ridge cap as cut from 3-tab shingle material rather than as a standalone ridge cap product. Ridge cap should match the shingle type currently on the roof (like-kind-and-quality) — cross-reference roof/ridge photos to confirm the actual shingle type. If the estimate''s ridge cap line item is priced/described as cut-3-tab while photos show a different shingle type (e.g., architectural/laminate) on the roof, flag as a missing or misclassified ridge cap line item.',
 null),

('quantity_mismatch_vs_measurements', 1, 'quantity', null, null,
 'Compare the estimate''s line-item quantities against the property measurement report (e.g. EagleView/HOVER) for matching categories (roofing squares, ridge/hip/valley length, etc.). A small margin of error is normal (e.g. 19.25 vs 19.3). Flag only if quantities are systematically lower than the measurement report across most or all materials — not an isolated rounding difference on a single item — since this indicates the carrier used rounded-down or incorrect quantities rather than the actual measured figures.',
 null),

('waste_factor_mismatch', 1, 'quantity', null, null,
 'Compare the waste percentage/calculation applied in the estimate against the waste factor suggested on the property measurement report (e.g. EagleView/HOVER). Flag if the estimate''s applied waste calculation does not closely match the report''s suggested waste factor (runs lower) — this shortfall is typically where starter shingle and other waste-dependent materials end up uncovered. Do not flag based on whether starter is itemized as its own line item; the trigger is the waste percentage mismatch itself.',
 null),

('garage_door_partial_panel_warranty', 1, 'unit_count', null, null,
 'Check whether the estimate replaces only some panels of a garage door rather than the entire door. Partial panel replacement typically voids the manufacturer''s warranty for the door. If found, flag this and recommend: (1) obtaining photos of the door''s manufacturer tag (make/model) and installation date if available, (2) pulling that model''s manufacturer warranty documentation, (3) checking whether the specific damaged panel(s) can be ordered separately — if not available, obtaining a statement confirming unavailability — to support replacing the full door rather than individual panels.',
 null);
