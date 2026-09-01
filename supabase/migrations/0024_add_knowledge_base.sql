-- Knowledge Base: categories + entries, brought in from BON's
-- previously-standalone "SUPP/KB" tool (localStorage-only, at
-- bosknowledge.netlify.app) plus the new Roofing Line-Item Encyclopedia
-- (Module 1). Reuses the text-primary-key pattern already established by
-- audit_rules, since the source data already has stable readable slugs
-- and nothing else needs to reference these rows by a generated id.

create table kb_categories (
  id text primary key,
  label text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table kb_entries (
  id text primary key,
  category_id text not null references kb_categories(id),
  title text not null,
  tags text[] not null default '{}',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index kb_entries_category_id_idx on kb_entries(category_id);

alter table kb_categories enable row level security;
alter table kb_entries enable row level security;
create policy "allow all - kb_categories" on kb_categories for all using (true) with check (true);
create policy "allow all - kb_entries" on kb_entries for all using (true) with check (true);

insert into kb_categories (id, label, description, sort_order) values
  ('detection', 'Detection Framework', 'Tier 1 measurement math, Tier 2 rules-based checklist, Tier 3 photo-based accessory counting.', 0),
  ('lineitems', 'Line Item Library', 'Xactimate codes commonly missed — ventilation, flashing, underlayment, ice & water, drip edge, decking.', 1),
  ('code', 'Code & Manufacturer Requirements', 'IRC citations and manufacturer install specs that justify a supplement, by state/jurisdiction.', 2),
  ('carrier', 'Carrier Playbook', 'Carrier-specific quirks, adjuster patterns, claim number formats, what pushes back and what doesn''t.', 3),
  ('scripts', 'Scripts & Rebuttals', 'Negotiation language and diagnostic questions for live calls.', 4),
  ('workflow', 'Workflow / SOP', 'BON''s own client and delivery workflow — intake, approval, carrier rounds, close.', 5),
  ('cases', 'Case Library', 'Real back-tested examples, worked start to finish.', 6),
  ('states', 'State Notes', 'PA-ban states, licensing quirks, compliance edge cases by jurisdiction.', 7),
  ('roofing-encyclopedia-m1', 'Roofing Line-Item Encyclopedia (Module 1)', 'Roof covering, tear-off & core roofing components — what each line item is, when it applies, what to document, and how carriers typically push back.', 8);

insert into kb_entries (id, category_id, title, tags, body, updated_at) values
  ('detection-three-tier-overview', 'detection', 'The Three-Tier Detection Architecture', '{"architecture","tier-1","tier-2","tier-3","reliability","mvp-scope"}', 'The scope-audit tool''s core design splits every possible detection method into three tiers by **reliability**, not by importance — a Tier 1 catch and a Tier 3 catch can be worth the same dollar amount, but they deserve very different levels of trust in an automated pipeline.

**Tier 1 — Measurement math.** Near-zero error. Pulled directly from structured measurement data (PDF or XML export) via arithmetic — pitch, linear footage, square footage, quantity reconciliation. If the measurement report says X, Tier 1 logic can derive a supplement flag with very high confidence, because it''s just math against a validated source.

**Tier 2 — Rules-based checklist.** Deterministic and reliable, but conditional. This is a checklist-vs-line-item audit: given a trigger condition (roof has a chimney over 30" wide, property elevation is above 7,000 ft, gutters are present), does the estimate contain the corresponding required line item? The logic itself is exact, but it depends on correctly identifying whether the trigger condition applies — which is usually still derivable from the measurement report or estimate metadata, not photos.

**Tier 3 — Photo-based accessory counting.** Useful only as a human-confirmed draft, never as an automatic determination. This tier requires actually looking at photos to detect damaged components, count roof-mounted accessories, and recognize damage-mark conventions (chalk circles, adjuster markups). It''s the least reliable tier by nature — vision-based inference on photos of varying quality — but it''s also where some of the highest-dollar misses live (solar D&R, garage door hail counts), so it''s not a tier to skip, just one to flag differently than Tier 1/2 output.

**MVP scope decision — build Tier 1 and Tier 2 first, defer Tier 3.** The tool was deliberately built and shipped on Tier 1 + Tier 2 logic only, with photo/vision analysis deferred to a later phase. This wasn''t a limitation accepted reluctantly — it was a conscious sequencing choice: get the deterministic, high-confidence tiers working and validated first, since a tool that''s wrong with confidence is worse than a tool that''s honest about what it can''t yet check.

**Cross-reference:** see the Line Item Library entries for which specific items fall into which tier (e.g., steep charges and pitch-based logic are Tier 1; ice & water elevation-gating is Tier 2; solar/satellite/detach-reset items are Tier 3).

**Source:** RSWE/BOS scope-audit tool architecture, established across multiple build sessions.', '2026-08-10T00:15:00Z'),
  ('detection-tier1-measurement-math', 'detection', 'Tier 1 — Measurement Math (Near-Zero Error)', '{"tier-1","measurement-math","vendor-agnostic","structured-export","tear-off-reconciliation"}', '**Vendor-agnostic by design.** The tool ingests measurement data from any aerial measurement vendor — Roofr, EagleView, Hover, and others — rather than locking to one provider. This became viable because structured export formats (ESX and similar) are now offered by essentially every major vendor, making structured data a commodity rather than a differentiator to build around.

**Structured exports are the primary ingestion path — OCR is fallback only, and this is a permanent architecture decision, not a temporary shortcut.** A real validation test confirmed this: a Roofr/GAF QuickMeasure geometry XML export was checked against its own published measurement report for a Monument, Colorado property, and every quantity reproduced within rounding tolerance — sub-1% error across eaves, rakes, ridge, hip, valley, flashing, and total area. That level of accuracy is only available from structured data; OCR is reserved strictly for image-only scanned PDFs where no structured export exists, and even then it''s flagged as a real pipeline risk (see note below).

**The tear-off reconciliation rule — a concrete, validated Tier 1 catch.** On a real matched-pair back-test (the Nuessle property, State Farm claim), diffing the original estimate against the final approved supplement showed roughly $4,997 in total recovery. Of that, approximately $2,044 came from a roof field quantity shortfall that the measurement engine caught independently, purely through tear-off reconciliation math — no photo review needed. This is the clearest real-dollar proof that Tier 1 logic alone finds real money.

**Steep charge tiers are Tier 1, not Tier 2 — pitch comes straight from the report.** Since roof pitch is a direct measurement-report field, the three steep-charge tiers (7/12–9/12, 10/12–12/12, >12/12) and their qualifying square footage can be checked by pure arithmetic against the report, with no ambiguity about whether the trigger condition applies. See Line Item Library''s access/labor entry for the specific tiers.

**OCR is a real, build-critical pipeline risk, not a minor detail.** Two files in the validation data set came through as image-only scans requiring OCR — and text extraction alone silently fails on scanned inputs (it doesn''t error out, it just returns nothing useful, which is worse than a visible failure). Any pipeline handling mixed input sources needs an explicit check for "is this actually structured/extractable text, or a scanned image" before assuming extraction succeeded.

**Source:** RSWE/BOS scope-audit tool build sessions, including the Monument, CO structured-export validation and the Nuessle matched-pair back-test.', '2026-08-10T00:15:00Z'),
  ('detection-tier2-rules-based', 'detection', 'Tier 2 — Rules-Based Checklist (Deterministic, Condition-Gated)', '{"tier-2","rules-based","checklist","trigger-condition","false-positive-guard"}', 'Tier 2 logic is exact once you know whether the trigger condition applies — the audit itself is a deterministic checklist-vs-line-item comparison, but getting the trigger condition right is what makes or breaks accuracy at this tier.

**The clearest example — and a real, validated false-positive guard: elevation-gated ice & water shield in Colorado.** Eave ice & water is code-required above roughly 7,000 ft (Pikes Peak Regional Building Department practice), and NOT owed below that threshold. A real appraisal-grade estimate in the validation data set (a deluxe-shake roof at 6,614 ft elevation) would have triggered a false "missing ice & water" flag under naive logic that just checks "is I&W present in the estimate" — but the elevation rule correctly suppressed that flag, since at 6,614 ft it genuinely isn''t owed. This is logged as a **confirmed false-positive guard** in the tool''s validation set, not a hypothetical — it''s proof that Tier 2 logic needs the actual trigger condition (property elevation, in this case) as an input, not just a presence/absence check on the estimate.

**Property elevation is therefore a required input field for any Colorado audit** — without it, the tool can''t distinguish a legitimate short from a non-issue. Valleys and penetrations require I&W regardless of elevation — only the eave requirement is gated.

**Code-upgrade / PWI items need to be tagged differently, not treated as standard flags.** Step flashing and drip edge/gutter apron have been billed by carriers as "did not previously exist but required by current building code — payable when incurred, subject to limits." A Tier 2 checklist should flag these as present-or-missing the same as any line item, but tag them as code-upgrade/PWI rather than standard RCV — since the payment mechanism and policy-limit exposure differ (see Code & Manufacturer Requirements for the fuller explanation).

**Other confirmed Tier 2 trigger-condition rules:** chimney cricket/saddle required above 30" chimney width (a fixed threshold check against a measurable dimension); decking gap tolerance under 1/8" (a manufacturer spec, not carrier-specific, but checkable the same deterministic way); shingle grade tier (standard/high/deluxe) driving matched selection of starter and ridge cap together, not independently.

**Why this tier matters even though it''s "just a checklist":** the reliability of Tier 2 output is only as good as the trigger-condition logic behind it. The elevation-gated I&W case is the proof that getting the trigger condition wrong doesn''t just cause a missed catch — it causes a confidently wrong flag, which is worse for credibility with a carrier than no flag at all.

**Source:** RSWE/BOS scope-audit tool Truth Set Validation tab, Carrier Patterns tab.', '2026-08-10T00:15:00Z'),
  ('detection-tier3-photo-based', 'detection', 'Tier 3 — Photo-Based Detection (Human-Confirmed Draft Only)', '{"tier-3","photo-analysis","human-confirmed","solar-detach-reset","garage-door","damage-marks"}', 'Tier 3 is the least reliable tier by design — vision-based inference on photos of variable quality — and its output should always be treated as a draft for human confirmation, never an automatic determination the way Tier 1 math or Tier 2 rules can be.

**What Tier 3 actually does:**
- **Detects damaged discrete components** and compares the resulting unit count against the estimate''s stated EA (each) quantity — the core mechanism behind catches like the garage door case below.
- **Recognizes adjuster damage-mark conventions** — specifically circled or chalked impact marks, which are the standard way inspectors visually flag hail strikes in photos.
- **Inventories roof-mounted accessories from overview photos** — this is how equipment that''s easy to miss on the ground (satellite dishes, antennas, HVAC units) actually gets caught; a satellite dish visible in one photo set was flagged this way as a candidate missed line item requiring verification.

**The garage door case — the clearest validated proof that Tier 3 catches real money invisible to any measurement report.** On the same Nuessle matched-pair back-test referenced in the Tier 1 entry, roughly $2,954 of the total ~$4,997 recovery came from a garage overhead door unit-count miss — a pure photo-counting catch. This was confirmed with actual ground-truth photo review: both garage doors showed hail damage, three circled impacts each. No measurement report anywhere would surface this; it exists only in the photos.

**Solar detach & reset — flagged as the highest-value, most-frequently-shorted Tier 3 item (see Line Item Library).** Because it''s specialized and often subcontracted, it''s easy to omit entirely if nobody specifically checks the photos for a solar array — this is exactly the kind of item Tier 3''s accessory-inventory function exists to catch.

**Why "human-confirmed draft only" is a hard rule, not a suggestion:** photo quality varies enormously (angle, lighting, resolution, whether damage marks are actually visible or just implied), and vision-based inference on a bad photo can produce a confident-looking but wrong count. Unlike Tier 1 (where the underlying measurement data is validated and trustworthy) or Tier 2 (where the logic is deterministic once the trigger condition is known), Tier 3 output is inherently probabilistic — it should always route to a person for confirmation before it becomes a line item on a submitted supplement.

**Source:** RSWE/BOS scope-audit tool, Photo Layer (Tier-3) tab and the Nuessle matched-pair back-test with ground-truth photo confirmation.', '2026-08-10T00:15:00Z'),
  ('detection-validation-method', 'detection', 'Validation Method — Truth Set & Matched-Pair Back-Tests', '{"validation","truth-set","back-testing","false-positive-rate","negative-control"}', 'The tool''s accuracy isn''t asserted — it''s tracked against a live validation set that auto-calculates hit rate, miss rate, and false-positive rate as more real jobs get logged. Two real matched-pair back-tests anchor this validation approach so far:

**Heckethorn property — negative control.** A settled appraisal award, used specifically to test whether the tool over-flags. The tool returned clean on this job — no false positives — which validates the false-positive guard logic (see the elevation-gated ice & water example in the Tier 2 entry) actually works in practice, not just in theory. A negative control that comes back clean is just as important a validation result as a positive control that catches real money — it''s proof the tool isn''t just flagging everything and hoping some of it sticks.

**Nuessle property — positive, quantified control.** A State Farm original estimate diffed against the final approved supplement, showing ~$4,997 in total real recovery. This one back-test validated both Tier 1 and Tier 3 simultaneously: ~$2,044 from the Tier 1 tear-off reconciliation rule (pure measurement math, no photos needed) and ~$2,954 from the Tier 3 garage door photo-count miss (confirmed with ground-truth photos showing three circled hail impacts on each door). Having one back-test validate both a high-confidence tier and a lower-confidence tier at the same time is a useful pattern — it shows the tiers are complementary, not redundant; each caught money the other couldn''t.

**Why this matters for the appraisal-grade estimates used elsewhere in the knowledge base:** an appraisal award, like the one used as the Heckethorn negative control, represents a comprehensive ceiling scope (see Line Item Library''s access/labor entry on appraisal-as-ceiling framing) — but for validation purposes specifically, a *settled* appraisal is valuable precisely because it''s a known-correct, already-reconciled answer to check the tool against, not just a rich source of possible line items.

**Practical takeaway:** as more real jobs get run through the tool, the growing set of true positives, true negatives, and any false positives/negatives is the actual measure of whether the detection framework is trustworthy — not just whether the underlying logic sounds reasonable. Keep feeding it real matched pairs (original estimate vs. final approved outcome) whenever they''re available, since that''s what the Truth Set is built to consume.

**Source:** RSWE/BOS scope-audit tool, Truth Set Validation tab and Matched-Pair Back-Tests tab.', '2026-08-10T00:15:00Z'),
  ('detection-legal-framing-guardrail', 'detection', 'Legal Framing Guardrail — "Scope of Work," Never "What the Carrier Owes"', '{"legal-guardrail","output-framing","compliance","public-adjusting"}', 'This is a load-bearing design constraint on every piece of output language the tool produces, not a stylistic preference — it''s what keeps the tool''s output from crossing into public-adjusting territory.

**The rule:** all tool output must be framed as **"scope of work required to install the roof"** — a contractor-facing description of what the repair actually requires — never as **"what the carrier owes"** or any language that reads as claim advocacy on the homeowner''s behalf. This distinction is exactly the line drawn in the State Notes entries on Missouri and Minnesota''s contractor-rep prohibitions, and on Colorado''s public-adjuster-only licensing structure (C.R.S. 10-2-417): BON''s model stays outside licensed public-adjusting activity specifically because it documents the contractor''s own scope of work, sold to the contractor, rather than representing the homeowner''s claim to the carrier.

**Why this needed to be flagged explicitly during the tool''s design, not assumed:** it would be easy for a scope-audit tool''s output to drift into "the carrier should pay you $X for this claim" language, since that''s the practical effect of the analysis — but that framing is exactly what separates a compliant scope-documentation vendor from unlicensed public adjusting. The tool''s job is to answer "what does this roof need to be properly repaired, to code and to manufacturer spec" — a contractor question — not "what is the homeowner entitled to recover" — a claim-advocacy question. Same underlying facts, different framing, different legal category.

**Practical implication for every entry and template in this knowledge base, not just the tool itself:** the Scripts & Rebuttals templates, the Line Item Library entries, and any future contractor-facing output should default to this same framing discipline — describe what the repair scope requires, not what the carrier "owes." This is worth checking any new script or template against before it goes into active use, the same way it was checked here.

**Source:** flagged as an explicit, unresolved-at-the-time legal guardrail during the tool''s initial feasibility and architecture phase; since resolved for Colorado specifically (see State Notes — Colorado entry) but the framing discipline applies everywhere regardless of state-specific licensing detail.', '2026-08-10T00:15:00Z'),
  ('lineitem-underlayment-drip-edge-flashing', 'lineitems', 'Underlayment, Drip Edge & Flashing', '{"underlayment","drip-edge","flashing","ice-and-water","code-upgrade","pwi","irc-code"}', '**Synthetic underlayment / felt** — required across the total SQ on every roof, no exceptions. Xactimate selector family: RFG FELT. Full-coverage, not spot.

**Drip edge — eave** — code-required per IRC R905.2.8.5, on every roof. This is the single most commonly shorted line item across every carrier in the Carrier Playbook (see the dedicated drip-edge rebuttal in Scripts & Rebuttals — IRC R908.3 is the section that wins the "no need to touch it" denial, not 905.2.8.5 itself, which just governs installation method).

**Drip edge — rake** — same code basis, separate LF line from eave.

**Gutter apron (separate line)** — where gutters are present, gutter apron is distinct from drip edge and frequently gets conflated with it on carrier estimates — check both are actually present as separate lines, not one covering the other.

**Ice & water shield — elevation-gated in Colorado, not automatic:** Code-required above roughly 7,000 ft per Pikes Peak Regional Building Department practice — confirm the current threshold before relying on this, code amendments move. Below that elevation, eave I&W is legitimately NOT owed and flagging it as a carrier short would be a false positive. Regardless of elevation, I&W at valleys and penetrations is always required — that part isn''t elevation-gated.

**Valley metal (open valley)** — new metal required on tear-off; reusing existing valley metal isn''t code-compliant.

**Step flashing** — new step flashing required on tear-off, reuse isn''t code-compliant. Sidewall LF is often only documented in photos or field notes, not the measurement report — this is a Tier 3 (photo-based) catch, not something a measurement-report diff alone will surface.

**Counterflashing** — required at masonry walls/chimneys to terminate step or apron flashing.

**Apron / headwall flashing** — required wherever a headwall condition exists.

**Pipe jack / boot flashing** — new boots required on tear-off; weather-cracked boots are a common carrier short since damage isn''t always obvious without a close photo. Lead boot is a legitimate upgrade line separate from standard neoprene where specified.

**Chimney flashing kit** — full chimney flashing replacement on tear-off, not spot repair.

**Chimney cricket / saddle** — code-required behind chimneys wider than 30". Has trade overlap with framing, so it can get dropped between trades on a multi-trade estimate.

**Skylight flashing kit** — full kit replacement per skylight on tear-off, sized to the actual skylight (small vs. large kits are separate line items, not interchangeable).

**Furnace / B-vent flashing + storm collar** — replacement per vent. Note from State Farm''s denial patterns: storm collar specifically only gets approved if it independently shows damage — proximity to an approved flashing item isn''t enough for that carrier.

**Roof-to-wall flashing (general)** — required wherever a wall abutment condition exists, separate from headwall/step flashing.

**Code-upgrade items bill differently — this is a distinct payment mechanism, not a standard line item.** Step flashing and drip edge/gutter apron have been billed by carriers as "did not previously exist but required by current building code — payable when incurred, subject to limits." This sits in a separate Code-Upgrade / PWI bucket, not standard RCV. Don''t treat a code-upgrade approval the same as a normal line-item approval — it''s often subject to a separate policy limit and a different payment trigger (incurred cost, not automatic RCV release).

**Source:** built from the RSWE scope-audit workbook''s Harvested Line Items tab (~55 confirmed real selector descriptions cross-referenced against actual jobs) and the MD Roofing Supplementing SOP''s code/manufacturer requirements section.', '2026-08-07T23:30:00Z'),
  ('lineitem-ventilation', 'lineitems', 'Ventilation', '{"ventilation","ridge-cap","ridge-vent","turtle-vents","shorting-pattern"}', '**Ridge cap (hip & ridge) — the highest-frequency confirmed shorting pattern of any line item in the data set.** The improper substitute is cutting 3-tab shingles to use as ridge cap instead of a dedicated hip/ridge product. If a carrier estimate doesn''t show a distinct ridge cap line separate from field shingles, this is the first thing to check — it''s the single most common short, not an edge case.

**Ridge vent** — sized to ridge LF minus any solid ridge, per manufacturer''s balanced-vent specification (intake/exhaust balance, not just "some ridge vent").

**Ridge vent — cut-in labor** — the slot-cutting labor for ridge vent installation. Sometimes bundled into the vent line item itself rather than broken out — check whether it''s actually priced in or just assumed.

**Box / turtle / off-ridge vents** — confirm count from labeled photos, not just the estimate''s stated quantity. This is a Tier 3 (photo-based) catch: vents can be present on the roof but under-counted on the estimate, or counted but not clearly visible in submitted photos, so photo-based count verification is the actual audit step, not just reading the estimate.

**Turbine vents** — R&R, counted the same way as box/turtle vents.

**Power attic vent** — R&R plus flag for electrical disconnect/reconnect, since the electrical work is sometimes a separate trade that gets missed in the roofing scope.

**Gable / louver vents** — R&R where affected by the loss — not every gable vent needs replacement, only ones actually in the damage path.

**Source:** RSWE scope-audit workbook, Harvested Line Items tab.', '2026-08-07T23:30:00Z'),
  ('lineitem-detach-reset', 'lineitems', 'Detach & Reset — High-Value Bundle Items', '{"detach-and-reset","solar","gutters","satellite","high-value"}', 'Detach & Reset items are actions tied to specific roof-mounted equipment, not standalone selectors — they get missed because they require noticing the equipment is present in the first place, then remembering it needs a D&R line rather than just being ignored during tear-off.

**Detach & reset solar array — the single highest-value bundle item in this category, and the one most frequently shorted.** Specialized D&R, frequently subcontracted out, and treated in the data as "never miss" — this is real money left on the table when overlooked. A well-documented solar D&R ask (see the PM example format in Scripts & Rebuttals / SOP: panel count, conduit LF, conduit pipe jacks, critter guard LF, mounting bracket count) is what actually gets this approved cleanly rather than as a vague lump sum.

**Detach & reset gutters** — needed to access the eave/fascia for tear-off; this is an action tied to the tear-off itself, not a separate standalone selector.

**Detach & reset downspouts** — same logic, counted per downspout.

**Detach & reset satellite dish** — includes re-aiming the dish on reset, which is sometimes missed as a labor line even when the D&R itself is captured.

**Detach & reset antenna** — roof-mounted antenna, same D&R logic as satellite.

**Detach & reset heat cable** — eave heat cable, priced by LF.

**Detach & reset lightning protection** — typically subcontracted; easy to miss entirely if it''s not flagged at initial inspection since it''s not always visually obvious from the ground.

**Detach & reset rooftop HVAC/AC** — needed to access the deck underneath; a real cost item that''s easy to overlook if the unit isn''t in the primary damage photos.

**Practical takeaway:** every item in this category requires someone to have actually noticed the equipment on the roof — this is inherently a photo/site-visit catch, not something a measurement report or Xactimate template will surface on its own. Worth a standing checklist item at every initial inspection: "what''s mounted on this roof besides vents?"

**Source:** RSWE scope-audit workbook, Harvested Line Items tab.', '2026-08-07T23:30:00Z'),
  ('lineitem-access-labor-shingle-grade', 'lineitems', 'Access/Labor Charges & Shingle Grade Tiers', '{"steep-charge","shingle-grade","labor","op","appraisal-ceiling"}', '**Steep charges are a paired remove-plus-add structure, applied only to the qualifying slope square footage** — not the whole roof if only part of it exceeds the pitch threshold. Three confirmed tiers: 7/12–9/12, 10/12–12/12, and greater than 12/12. Pitch comes directly from the measurement report (a Tier 1 / measurement-math catch, not something requiring photo review), so there''s no excuse for this one being missed if the report was actually read.

**Shingle grade has three tiers, not two — standard, high, and deluxe.** Standard (RFG300) and high (RFG400) are the commonly known tiers; a deluxe grade also exists above high grade (seen priced as "Laminated – Deluxe grd" on a Presidential Shake-equivalent roof, paired with O&P and full perimeter starter). Grade tier drives shingle selection, starter selection, AND ridge-cap selection together as a set — if you''re auditing an estimate and the shingle grade looks off, check whether starter and ridge cap were priced to match the correct tier too, since they move together.

**O&P (3+ trades)** — see the dedicated multi-trade coordination script in Scripts & Rebuttals for the actual argument to make; the trigger condition worth remembering here is the "3 or more trades requiring coordination" threshold cited across multiple carriers and the SOP alike.

**Appraisal-grade estimates are a ceiling reference, not a floor.** One real appraisal-process estimate in this data set (10% O&P, full flashing scope, chimney chase cover, flue caps, dual skylight kits, solar water heater D&R) represents the most complete scope observed anywhere in the data — useful as "everything that could plausibly be owed" for comparison, not as a typical target. Lean initial carrier estimates (particularly Farmers/Foremost, confirmed as the leanest baseline scope in this data) represent the floor. The gap between a carrier''s floor-level initial estimate and the appraisal-grade ceiling is the actual supplement opportunity band on a given job — useful framing when triaging which jobs are worth the deepest audit effort.

**Source:** RSWE scope-audit workbook, Harvested Line Items and Carrier Patterns tabs.', '2026-08-07T23:30:00Z'),
  ('lineitem-50-item-checklist', 'lineitems', 'The 50-Item Missing Line Items Master Checklist', '{"checklist","deep-review","sop","reference"}', 'The original quick-reference checklist from the MD Roofing Supplementing SOP — run through this on every deep review pass. It''s deliberately terse; cross-reference the other Line Item Library entries above for the detail behind any item that needs it (drip edge, ridge cap, ice & water, and detach & reset items all have their own fuller entries).

**Items 1–25:**
1. Starter on rakes
2. Starter on eaves
3. Ridge cap
4. Drip edge mismatch
5. Step flashing
6. Counterflashing
7. Ice & water shield
8. Valley metal
9. Chimney saddle
10. Chimney flashing (small/large)
11. Pipe jack replacement
12. T-top vent replacement
13. HVAC disconnect/reconnect
14. Ridge vent
15. Turtle vents
16. Furnace stack collar
17. Satellite dish removal
18. Skylight curb flashing
19. Skylight saddle
20. Additional decking
21. Decking re-nailing
22. Access charges
23. Steep/2-story
24. Tear-off labor minimums
25. Gutter labor minimums

**Items 26–50:**
26. Paint labor minimums
27. O&P (3+ trades)
28. Parapet cap metal
29. Detached structures
30. Door seals
31. Window screens
32. Glazing bead
33. Sealant/caulking
34. Ladder safety
35. Dumpster fees
36. Delivery fees
37. Haul-off
38. Satellite bracket removal
39. Fence protection
40. Window protection
41. Landscaping protection
42. Roll-off fees
43. Permit fees
44. Deck protection
45. HVAC pad leveling
46. Drip edge color match
47. Roof-to-wall transitions
48. Headwall flashing
49. Underlayment upgrade
50. System-matching components

**Source:** MD Roofing and Solar Supplementing Division SOP, Section 10.', '2026-08-07T23:30:00Z'),
  ('code-irc-citations', 'code', 'IRC Citations That Actually Move Carriers', '{"irc-code","drip-edge","tear-off","chimney-cricket","ventilation-code"}', '**IRC R905.2.8.5 — Drip edge application method.** Governs *how* drip edge is installed: under the underlayment at eaves, over it at rakes. This is the section carriers cite when denying eave drip edge R&R with "installed correctly, no need to manipulate it." It''s usually a correct citation on its own terms — it doesn''t require you to touch undamaged eave drip edge just because it exists.

**IRC R908.3 — Re-covering vs. Replacement.** This is the section that actually wins the drip edge argument, and it works because it answers a different question than R905.2.8.5. R908.3 requires that the existing roof covering, and any materials secured to the deck, be removed before a re-roof passes inspection. On a full tear-off, that means drip edge comes off the deck by code, independent of whether the old drip edge itself shows storm damage. See the full drafted rebuttal in Scripts & Rebuttals — the key move is citing R908.3 specifically, not just "code requires it" generically, since a vague code reference invites a vague denial back.

**Chimney cricket / saddle — code-required above 30" chimney width.** This is a framing/roofing trade-overlap item (see Line Item Library) that gets dropped between trades. Worth flagging on any chimney over 30" wide regardless of which trade "owns" the line — code doesn''t care whose scope it falls under, it just requires the cricket.

**Ventilation code claims — verify new-construction-only language before citing it.** One real example (Farmers, Pikes Peak Regional Building Department): an adjuster initially told a contractor a ventilation code requirement supported a supplement, then reversed the position days later, stating she''d "misspoken" — the actual code position was that the ventilation requirement applies to new construction only, not re-roofing. Two lessons here: (1) don''t treat a verbal or informal adjuster concession as final until it''s actually reflected in the revised written estimate, and (2) before building a ventilation-code argument yourself, confirm whether the specific code section you''re citing applies to re-roofs or only new construction — this exact mistake got made by an adjuster, and it''s an easy one to make in either direction.

**General principle across all of these:** naming the specific code section by number is what gets traction, not a general "this is code" assertion. Carriers have their own code citations ready (as seen with R905.2.8.5) and will use them against a vague argument — you need the section that actually answers your specific question, not just any adjacent one.', '2026-08-07T23:45:00Z'),
  ('code-manufacturer-install-requirements', 'code', 'Manufacturer Installation Requirements (Universal, Cross-Brand)', '{"manufacturer-requirements","installation-spec","warranty","universal"}', 'These requirements are consistent across every major shingle manufacturer''s installation instructions — they''re not brand-specific negotiating points, they''re baseline installation requirements that justify a supplement regardless of which manufacturer''s product is on the roof:

- **Nails must land in solid wood.** Fastening into anything else voids proper installation regardless of nail count or pattern.
- **Decking must not have excessive gaps** — under 1/8 inch is the standard tolerance. Wider gaps require decking work before shingles can be properly installed, which is a legitimate supplement basis distinct from storm-damage decking claims (see the State Farm entry in Carrier Playbook for how carriers distinguish pre-existing decking condition from storm causation — this manufacturer requirement is a separate, code/warranty-driven argument that doesn''t depend on proving storm damage to the decking itself).
- **Underlayment must be fully adhered or properly fastened** — partial or loose installation doesn''t meet manufacturer spec regardless of coverage area.
- **Starter shingles must be installed at both eaves and rakes** — not just one or the other. This is a near-universal miss worth checking on every estimate (see items 1–2 on the 50-item checklist in Line Item Library).
- **Flashings must not be reused.** New step flashing, valley metal, and similar components are required on any tear-off/reroof — reusing existing flashing doesn''t meet manufacturer installation requirements, independent of whether the old flashing shows visible damage.
- **Pipe boots and accessories must be replaced if brittle or damaged** — this is a condition-based requirement, not an automatic replacement-on-every-job rule, but "brittle" from age/UV exposure counts even without acute storm damage.
- **Ridge cap must match the system** — meaning a dedicated hip/ridge product from the same product line, not field shingles cut down. This directly supports the ridge-cap shorting pattern flagged in Line Item Library as the highest-frequency confirmed short.

**What to always source and attach when making a manufacturer-based argument:**
- The shingle''s actual installation guide (brand and product-line specific)
- Starter/ridge instructions for that specific product
- The manufacturer''s flashing-reuse prohibition language
- Local jurisdiction code citation for decking requirements (see jurisdiction-specific entry for the Pikes Peak Regional Building Department reference)

**Source:** MD Roofing and Solar Supplementing Division SOP, code and manufacturer requirements section.', '2026-08-07T23:45:00Z'),
  ('code-jurisdiction-pikes-peak', 'code', 'Jurisdiction-Specific: Pikes Peak Regional Building Department (Colorado)', '{"colorado","pikes-peak","jurisdiction","ice-and-water","elevation-gated","ventilation"}', '**Ice & water shield — elevation-gated, not automatic below ~7,000 ft.** Per Pikes Peak Regional Building Department practice, eave ice & water barrier is code-required above roughly 7,000 feet elevation — below that threshold, it is legitimately NOT owed as a code requirement. This cuts both ways: don''t argue eave I&W as a code-required supplement on a lower-elevation property (you''ll lose that argument and it costs credibility on the next ask), but do cite it confidently above the threshold. Regardless of elevation, ice & water at valleys and penetrations is required everywhere in this jurisdiction — that part isn''t elevation-gated, only the eave requirement is.

**Confirm the current threshold before relying on this — code amendments move.** The ~7,000 ft figure reflects the most recent confirmation in this data, but Pikes Peak Regional Building Department code gets amended periodically. Worth a periodic spot-check rather than treating this as permanently fixed.

**Ventilation code requirements apply to new construction only, not re-roofing.** This was confirmed the hard way — an adjuster initially cited a ventilation code requirement as supplement-justifying, then reversed the position days later after checking, stating the code only applies to new construction. Don''t build a ventilation-code supplement argument in this jurisdiction assuming it applies to re-roofs; verify the specific applicability first.

**Practical use:** property elevation is a required input for any scope audit in this market — the same measurement or estimate can be a legitimate short or a false-positive flag depending entirely on where the property sits relative to the 7,000 ft line. This is encoded as a specific false-positive guard in the RSWE scope-audit workbook''s validation logic — worth treating with the same rigor in any manual review.

**Source:** RSWE scope-audit workbook (Truth Set Validation / Carrier Patterns tabs) and Farmers Insurance correspondence (Elaine Owen), cross-referenced.', '2026-08-07T23:45:00Z'),
  ('carrier-statefarm', 'carrier', 'State Farm', '{"state-farm","claim-format","wccs","renfroe","recoverable-depreciation","class-4-roof","price-list","document-taxonomy"}', '**Claim number format:** NN-AAN-NNL (e.g. 06-87G0-73C, 06-96G9-00M). The leading two digits appear to be a region/office code — "06-" is consistent across CO/IL claims in this set. Older-style all-caps-no-dash formats also appear (0687K967V), which resolve to the same dash format once inside their system — don''t treat the two as different claims if you see both.

**Central inbox, individually-named adjusters:** All correspondence funnels through statefarmfireclaims@statefarm.com ("HOME CLMS-FIRECLAIMS"), but every real response is signed by a named individual — title varies by team (see below). Always include ONLY the claim number in the subject line; anything else risks the auto-router losing it. Auto-reply confirms this inbox is not for new claim reports (route those to the app/800-SF-Claim instead).

**Adjuster teams you''ll encounter, and what it tells you:**
- **Claim Specialist / Fire Property Stewardship (in-office)** — standard desk adjuster, normal-volume claims.
- **WCCS Deployed – Fire Weather & Cat** — "Weather Catastrophe Claim Services," surge team deployed for storm/CAT volume. If your adjuster''s signature says WCCS Deployed, expect a different person on the file than who did the initial inspection, and expect slower turnaround on large supplements (a $300k+ window supplement was explicitly flagged as "please be patient").
- **External Claim Resource — RENFROE** — a third-party independent adjusting firm State Farm contracts during CAT surges. Tone differs slightly from in-house: more explanation and legwork volunteered unprompted (e.g. one RENFROE adjuster proactively sourced a discontinued tile from a Denver supplier and got a freight quote rather than just denying the mismatch). Treat RENFROE claims as slightly more negotiable/conversational than in-house WCCS.
- **HCCS Stewardship** — another internal team label seen on reconciliation emails; functionally similar to Fire Property Stewardship.

**Price lists are regional and dated:** e.g. ILBL8F_MAR13 (Illinois), COCS28_JUL25 (Colorado Springs, July 2025 vintage). The suffix date matters — if a claim sits open a long time, check whether the price list on a later supplement estimate has rolled to a newer version than the original.

**Estimate structure (standard Xactimate output, consistent across every sample):**
Line Item Total → Material Sales Tax → Subtotal → General Contractor Overhead (10%) → General Contractor Profit (10%) → RCV (incl. O&P) → Less Depreciation (incl. taxes) → Less GC O&P on depreciation → Less Deductible → Net ACV Payment. A "Maximum Additional Amounts Available If Incurred" section tracks recoverable depreciation separately — this is NOT paid automatically.

**Recoverable depreciation release is invoice-triggered, not automatic.** The standard ask that works: submit the final invoice and explicitly request release of recoverable depreciation in the same email. No separate form seen in this set — just a plain-language request attached to the final invoice submission.

**Deductible collection is never State Farm''s job.** When a payment comes in short of the invoice total, the standard adjuster response is to confirm the shortfall equals the deductible and tell the contractor to "contact the insured directly to collect the outstanding amount." Don''t escalate a short payment to State Farm without first checking it isn''t just the deductible.

**Document taxonomy (attachment filename prefixes worth recognizing):**
- SF-1 = Customer Copy estimate
- SD-1 = Claim Rep Draft Report (internal-facing draft, sometimes shared)
- FD-1 = CTR (Claim Team Resource?) email response
- DF-1 = system-generated document
These prefixes show up consistently enough to use as a quick visual sort when triaging a claim folder with many attachments.

**Class 4 impact-resistant roof certification is an agency-side process, not claims-side.** The Class 4 Roof Form (dated/versioned — Sept 2025 revision seen) is handled by the local agent''s office staff (e.g. an agent''s Office Manager), completely separate from the claims desk handling the actual loss. If a homeowner wants the discount applied, that request and form goes to the agent''s office, not statefarmfireclaims@.

**Checks are mailed, not direct-deposited to the contractor in this set** — 7-10 business day delivery is the standard line, repeated across claims and payment types (initial payment, supplement payment, permit fee reimbursement).

**Source:** built from 66 State Farm claim-correspondence threads (deduplicated from 86 uploaded emails) spanning May 2025-May 2026, across CO and IL claims, in-house/WCCS/RENFROE adjusters.', '2026-08-07T22:08:45Z'),
  ('carrier-statefarm-addendum1', 'carrier', 'State Farm — Denial Language & Line-Item Patterns', '{"state-farm","denial-language","causation-denial","quantity-dispute","hazmat-asbestos","permit-fees","scope-downgrade"}', 'State Farm''s supplement denials/approvals are almost always delivered as a **line-item reconciliation list**, grouped by roof section/elevation, with a one-line reason on anything not approved. The reasons repeat across adjusters and claims — these are the patterns worth having memorized before you write a rebuttal.

**Causation denials (the most common category) — "not damaged by named peril":**
- Furnace vent rain cap/storm collar denied when the adjacent, already-approved item (e.g. the vent itself) shows damage but the collar/cap doesn''t independently.
- Storm collar specifically: "only replaced if it contains storm damage" — proximity to an approved item is not enough, each component needs its own visible damage.
- Screen doors and overhead doors get attributed to pre-existing wear, animal damage, or "deterioration" rather than the named peril — and adjusters will quote your OWN inspection report''s language back at you if it mentions "deterioration" anywhere. Scrub your submitted reports for that word before sending if you intend to claim full storm causation on the same item.
- A "6 inch B Vent" was denied outright because it "does not exist on the policyholder''s home" — identified as a photo from a different property based on shingle color mismatch. State Farm adjusters do cross-reference submitted photos against known roof/siding color from the original inspection; mismatched-house photos get caught, not just rubber-stamped.

**Quantity disputes — adjuster''s original inspection measurement wins by default:**
- Clean/seal/paint siding and similar linear-footage items get approved only up to the footage the adjuster''s own inspection report recorded, even when the contractor''s measurement is higher — the difference is denied outright, not split. If you want to win a quantity dispute, you need documentation showing the adjuster''s original measurement missed something (additional elevation, photo gap), not just a bigger number.
- Same pattern on flashing pipe jacks: approved for the count in the inspection report (2 of 3 claimed), third denied "not approved at this time" — meaning it''s not a hard no, just unsupported yet. Worth a follow-up with photo evidence specifically on the unaccounted-for unit.

**Scope-method disputes — they''ll downgrade R&R to repair/replace-in-kind if the underlying material shows pre-existing condition issues:**
- Sheathing R&R was denied with the reasoning that the sheathing "is warped and shows wear, tear, deterioration" and that since an overlay was done previously, the correct scope is replace-only, not R&R. This is their standard move when they can point to a pre-existing condition on the same component you''re claiming storm damage on — expect a downgrade, not a flat denial, and expect them to point at the roof''s history (overlay vs. tear-off) as justification.

**Duplicate/stacked-labor denials:**
- Roofer per-hour labor add-ons on top of standard R&R line items get denied as "sufficient labor is already accounted for" — don''t stack hourly labor charges next to unit-priced R&R items for the same scope of work; it reads as double-billing to the adjuster regardless of intent.

**Hazmat/asbestos abatement (non-friable, outdoor siding removal) — a real approved/denied split worth keeping as a template:**
Approved: PPE for handling contaminated material, proper disposal as a bid item (no separate disposal fee line in CTRE for hazmat), removal of asbestos material including double-bagging, encapsulation solution to keep material non-friable during removal.
Denied, consistently reasoned as "outdoor project, non-warranted": containment/air barrier chamber, safety shower, decontamination charge, post-abatement testing, negative air machine/respirator/exhaust fan, ducting. The through-line: State Farm treats full indoor-abatement-protocol items (containment, decon, negative air) as inapplicable to an outdoor, non-friable removal — even though the underlying disposal and PPE costs are accepted. If you''re bidding hazmat siding removal, expect the "indoor containment kit" line items to get cut regardless of who''s doing the work, and don''t lead with them.

**Permit fee scope is narrow:** base permit fee (commonly ~$135) is paid; anything layered on top — use fees, convenience fees, state-mandated statute letters — gets denied as "outside the scope of your insurance," even when it''s a real, invoiced cost tied to pulling the permit.

**Supplement documentation thresholds — what triggers a request for more detail vs. a straight approval:**
- Photos are the first ask on anything not visible in the original inspection (downspouts, a claimed damaged window) — supplements without photos get bounced back before any dollar discussion happens.
- When a supplement request runs meaningfully above the original estimated scope (e.g. a window bid higher than what State Farm scoped), they ask for an itemized breakdown with a stated reason (how many units, why) before considering it — a lump-sum ask on a scope jump gets stalled, an itemized one with rationale moves.
- Solar panel detach/reset on a roof claim: State Farm will ask whether you''re sourcing the estimate from the ORIGINAL solar installer specifically, to protect the panel warranty — bidding it out to a general contractor instead is likely to draw a follow-up question.
- Discontinued materials (e.g. a discontinued tile line) don''t automatically convert to a full-replacement win — one adjuster proactively sourced remaining stock from a secondary supplier and priced freight before conceding the point. Expect them to exhaust "can we still match it" before agreeing to full replacement for a discontinuation argument.

**Tone:** Uniformly polite even inside denials — closings like "Thank you for assisting our valued Insureds" appear on hard-no reconciliation emails as often as approvals. Don''t read scripted courtesy as a signal the decision is soft.

**Source:** built from the same State Farm correspondence set, focused on the reconciliation/denial emails and supplement-request threads.', '2026-08-07T22:08:45Z'),
  ('carrier-americanfamily', 'carrier', 'American Family (AFICS)', '{"american-family","afics","claim-format","depreciation-deadline","metal-exclusion","decking"}', '**Structure — who you''re actually dealing with:** American Family claims are handled through a third-party administrator, AFICS (American Family Insurance Claims Services), 6000 American Parkway, Madison, WI 53783. AFICS also administers Homesite Insurance claims under the same infrastructure — different underlying carrier, same desk and email domain (afics.com), so don''t assume every afics.com email is a straight American Family claim; check which company is named in the adjuster''s signature block.

**Claim number format:** 01-0XX-XXXXXX (e.g., 01-008-748859, 01-009-072551). Dashes are cosmetic — the same claim shows up dashed and undashed across threads and AccuLynx subject lines interchangeably.

**Routing and submission:** Two live inboxes, and adjusters are inconsistent about which they push: claimdocuments@afics.com (most common, "include claim number in subject line") and claimcorrespondence@afics.com (billed as "faster response," and it''s also the fallback when an adjuster leaves the company — auto-replies redirect there). When in doubt, cc both. Most correspondence flows through AccuLynx (do-not-reply@mail.acculynx.com relaying on behalf of the actual adjuster address) rather than direct email.

**Adjuster churn is high — plan for it:** Multiple adjusters rotated through the same claim numbers in this data set (Jason Carr, Adam McCarthy, Micah Nussbaum, Diana Davila, Nathan Williams, Rylen Thalhammer, and others), and at least one auto-reply confirmed an adjuster had left the company mid-claim with the inbox unmonitored. Don''t assume claim continuity with a single point of contact — re-confirm who owns the file if a thread goes quiet.

**Depreciation expiration is a hard deadline — the single most important thing to track:** Recoverable depreciation expires exactly one year from date of loss in this carrier''s practice (one claim: DOL 08/20/2024, depreciation expired 08/20/2025). Past that date, the adjuster (Ashlyn Lankford) flatly refused release regardless of documentation — "no longer eligible to recover," full stop, no exception process shown. Completion photos and a signed Certificate of Completion submitted before the deadline are what release depreciation; submitting proof after the deadline does not resurrect it. Build a hard tickler for this on every AmFam job — 12 months from DOL, not from approval date.

**Metal exclusion — categorical, not case-by-case:** Cosmetic-damage-only metal is excluded by policy language, not adjuster discretion. Confirmed excluded in this data: gutters/downspouts, decorative chimney shroud, flue cap, chase cover, garage doors, light fixtures. One adjuster stated it plainly: "exterior metals would be excluded for cosmetic appearance only damages." The lever that works: if the metal has functional/storm damage (not just cosmetic), it''s reviewable with photos — don''t submit metal items without documenting functional damage up front.

**Decking is peril-gated, and code arguments don''t move it:** Decking replacement requires direct hail penetration through the decking itself — rot, deterioration, wear and tear are explicitly excluded regardless of circumstances. This carrier rejected a code-compliance argument outright (plank decking with >1/4" gaps, code requires a nailable surface before reroofing) — the adjuster''s answer was that decking has no coverage unless "the hail went through the decking itself," full stop. Contrast this with code-triggered items elsewhere (turtle vents, ice & water shield, high-profile hip and ridge) which get approved routinely when cited — the difference is that decking coverage is gated by peril-causation language in the policy, not by code-compliance logic, so a code argument alone will not clear that specific bar.

**Shingle class upgrades require proof of pre-existing class:** Will only upgrade to a higher shingle class if a different, higher class already existed on the roof — and they want to see it. A vague or unclear photo isn''t enough; expect a request for a clearer photo of the shingle name/class or an offer to pull an ITEL sample if none is available.

**Receipts must be current, not historical:** A 2023 gutter receipt was rejected as support for a current-year gutter replacement — "unable to utilize the receipt from 2023 for this replacement." Submit receipts dated to the actual work being invoiced.

**O&P is tied to trade coordination, not blanket approval:** Overhead and profit was approved on subbed-out trades but denied on the roof itself (primary trade, not subbed out) and on a greenhouse repair obtained and estimated by a separate contractor the insured hired directly — the logic being O&P applies to trades you''re actually coordinating, not every line on the estimate.

**Felt/underlayment tear-off labor is inconsistent across adjusters:** One adjuster flatly refused to pay for tear-off of multiple felt layers ("they all come up at once"), while a different adjuster later approved two full layers of felt on another claim without pushback. Don''t assume a prior denial from one adjuster predicts another''s answer — this is adjuster-level judgment, not fixed policy language, so it''s worth re-asking on a new claim even after a denial elsewhere.

**Hand-load/haul-off labor has a default formula worth knowing before you negotiate:** One adjuster''s default math was 5 minutes per bundle for hand-loading, assuming 3 bundles per square, with an equivalent 5 min/bundle added for extra haul-off labor. If you''re pushing for more, come with your own bundle count and time justification rather than a flat ask.

**What sails through without friction:** Permit fees (approved essentially every time, no pushback seen), autocalculation waste corrections when you flag them (one adjuster manually corrected an 11% waste error on request), and any item with clear code citation attached (turtle vents, synthetic underlayment, high-profile hip and ridge, ice & water shield).

**Payment mechanics:** Adjusters routinely offer a choice between electronic transfer or paper check ("either way is fine"); paper checks commonly cited at 7-14 business days. Estimate revisions after a supplement submission are commonly quoted at 1-3 business days for approval, though this varies by adjuster workload.

**Tone:** Generally cooperative and low-friction when documentation is solid — casual, often warm correspondence (emojis, "have a great day," first-name familiarity) is the norm, especially from higher-volume adjusters. Pushback shows up at defined categorical lines (metal cosmetic exclusion, decking peril-causation, receipt currency, sub-vs-non-sub O&P) rather than as blanket resistance — this is a carrier where knowing the exclusion logic gets you further than persistence alone.

**Escalation path:** Not demonstrated in this data — every thread in this batch stayed at the assigned adjuster or TPA-representative level; no supervisor escalation, appraisal-clause invocation, or DOI complaint appears anywhere. If you have an actual move you use with AFICS/American Family when an adjuster won''t budge, that''s worth adding yourself — this entry only reflects what the correspondence shows.

**Source:** built from 70 real American Family/AFICS claim email threads (one additional file in the upload batch, claim 059580434, was actually Liberty Mutual and was excluded as out of scope), spanning roughly May 2025 through August 2026.', '2026-08-07T22:08:45Z'),
  ('carrier-farmers-lineitem-denials', 'carrier', 'Farmers Insurance Exchange — Line Item Denial Patterns', '{"farmers","denial-language","drip-edge","marring","o-and-p","ventilation-code","stucco"}', '**Drip edge (the single most repeated line-item fight on Farmers claims):** Their standard denial on eaves is that drip edge installed correctly goes *under* the felt, so it doesn''t need to be manipulated or replaced during tear-off — they only allow drip edge replacement on rakes, where it installs *over* the felt. This shows up nearly verbatim across multiple adjusters (Amy Milyard, Althea Thompson), so treat it as a scripted talking point, not an individual judgment call.

**Turtle vents / roof vents:** Denied for D&R unless there''s photo evidence the vent itself was damaged by hail — "not damaged from hail" is the standard line. One adjuster (Elaine Owen) initially told us a ventilation code requirement supported a supplement, then reversed it days later, admitting she''d "misspoken" — the actual code position is that Pikes Peak ventilation requirements apply to new construction only, not re-roofing. She asked for something specific from the city before reconsidering. Lesson: verbal or even written-but-informal approvals from an adjuster aren''t final until they''re in the revised estimate — get it in writing on the actual document, and don''t be surprised if a code-based justification gets walked back once someone checks it.

**Marring / wear-and-tear exclusion on metal accessories:** Rain caps, exhaust caps, and furnace vent caps get denied for R&R with the same reasoning every time — marring to metal roofing materials is excluded in the policy, and because these caps don''t touch the roof surface, there''s no need to detach/reset them during tear-off anyway. This is a policy-language exclusion, not a documentation gap — photos won''t move it. Don''t spend rebuttal effort here unless the damage is functional, not cosmetic.

**O&P (Overhead & Profit):** Denied on grounds that "the trades do not overlap nor are they complex which needs continuous oversight." Standard single-trade roof jobs will not get O&P from Farmers without a genuine multi-trade coordination argument.

**Stucco / siding causation:** Farmers will look at hail size data to argue causation. One denial explicitly compared the stucco damage pattern (described as long-term water exposure, cracking, settling, weathering) against the storm''s actual recorded hail size (.75") and concluded that size of hail typically produces impacts under half an inch — enough to warrant paint but not house wrap, metal lath, or a full re-dash. If you''re pushing a supplement on siding/stucco, be ready for them to cite the actual recorded hail diameter for the loss date against what that size can plausibly do.

**Asphalt starter vs. waste allowance:** Farmers will offer to keep a 10% waste allowance (which nets better for us $-wise) rather than switch to itemized starter at a reduced 5% waste — this is presented as a favor, but do the math per job since it isn''t automatically the better deal.

**Permit fees:** These get approved close to automatically across every claim reviewed — not a fight worth having, and not a signal of anything if it''s the only line that clears.

**Source:** built from Farmers Insurance Exchange correspondence (Amy Milyard, Althea Thompson, Elaine Owen, Chance Podoll, John Komaroski) across claims from mid-2025 through mid-2026, Colorado Springs market.', '2026-08-07T22:08:45Z'),
  ('carrier-farmers-drip-edge-code-win', 'carrier', 'Farmers — Drip Edge Eaves Rebuttal (IRC R908.3 vs. 905.2.8.5)', '{"farmers","drip-edge","irc-code","rebuttal-win"}', 'Standard denial on eaves drip edge is "installed under the felt correctly, no need to manipulate" (see main Farmers denial-patterns entry). One claim got this reversed by citing the *correct* code section — worth knowing the specific citation since an adjuster may be thinking of a different, adjacent code section than the one your argument actually rests on.

Farmers cited **IRC 905.2.8.5** in one denial, which governs the *application method* of drip edge (under the underlayment on eaves, over it on rakes) — that section supports their "no need to touch it" position on an undamaged eave.

The winning counter-argument doesn''t dispute 905.2.8.5 at all — it invokes **IRC R908.3 (Re-covering vs. Replacement)**, which mandates that the existing roof covering and any materials secured to the deck must be removed for a re-roof to pass inspection. Since all roofing materials (drip edge included) have to come off the deck for inspection, new drip edge on the eaves becomes a code-driven requirement independent of whether the old drip edge was "damaged" — not removing it during a full tear-off would itself violate R908.3.

The distinction to hold onto: their code citation and your code citation aren''t in conflict — they''re answering different questions (how it''s installed vs. what a re-cover-to-replacement tear-off requires). Naming the correct section by number, not just "the code requires it," is what got traction here.

**Source:** Farmers Insurance Exchange, claim 7010176180-1 (Althea Thompson), June 2026.', '2026-08-07T22:08:45Z'),
  ('carrier-farmers-payment-timing-vendors', 'carrier', 'Farmers — Response Windows, Payment Timing & Vendor Routing (Accuserve)', '{"farmers","payment-timing","response-time","accuserve","escalation"}', '**Response time commitments:** Farmers adjusters consistently commit to 3-5 business days to review and respond to a supplement request. Treat 5 business days as the point to follow up, not before.

**Payment sequencing:** Farmers will frequently decline to cut a standalone supplemental payment while the job is still in progress — the stated pattern (John Komaroski, Farmers) is one final payment at job completion that bundles recoverable depreciation with the approved supplement. Don''t read a lack of a supplement check mid-job as a stall; ask directly whether they''re holding for a single final payment before escalating.

**Subject-line / routing integrity:** Farmers correspondence carries a routing code in the subject line (e.g., "[BS4FSLAZ3]") with an explicit instruction not to alter the subject line when replying, to avoid misrouting. This is worth building into any templated reply workflow so it isn''t accidentally stripped.

**Third-party vendor routing (Accuserve):** At least one claim routed the initial estimate/inspection through Accuserve rather than Farmers staff directly, with the Farmers adjuster (Chance Podoll) only entering at the supplemental review stage. On this claim, a full item replacement request (an exterior door) was denied up front in favor of a cheaper repair retrofit (a door sweep) at the adjuster''s suggestion. When the retrofit was field-installed and failed in practice (the door became difficult to open/close after repeated adjustment attempts), the correct move was documenting the failure — photos/video of the failed repair — and resubmitting the *original* replacement request, framed around returning the property to pre-loss condition rather than re-arguing the original damage. Expect Farmers to counter a replacement ask with a cheaper repair-only alternative first; a documented in-field failure of that repair is a stronger second attempt than re-litigating the initial denial.

**Claims can run long:** at least one claim (loss date 07/20/2023) still had active correspondence and follow-up chasing well into late 2025 — over two years post-loss. Long gaps between adjuster responses on older claims aren''t unusual and don''t necessarily mean anything has gone wrong.

**Outright denials happen, not just line-item cuts:** at least one claim required following up specifically on "this claim denial answer" — distinguish in your own tracking between a partial line-item denial (normal, arguable) and a full claim denial (different escalation path).

**Source:** Farmers Insurance Exchange correspondence — John Komaroski, Elaine Owen, Chance Podoll, Tyler Orr/Accuserve (Dustin Letts) threads, 2025–2026.', '2026-08-07T22:08:45Z'),
  ('carrier-farmers-shingle-classification', 'carrier', 'Farmers — Shingle Classification Disputes (Class 3 vs. Class 4, ITEL Fallback)', '{"farmers","shingle-classification","itel","class-4","quantity-supplement"}', 'One claim (Scott Jagels, Farmers) disputed a Class 4 shingle designation on the grounds that the "sure nail strip" visible in photos appears on all Duration-line shingles generically, not just the Class 4 variant — he supplied an Owens Corning website screenshot as support and offered to send a physical shingle sample to ITEL for lab verification if we wanted to contest it further.

Since the job was already complete and ITEL turnaround would have delayed the homeowner''s resolution, the practical call was to concede the reclassification down to the standard Duration shingle (Class 3, product code "400S") rather than fight it through lab testing. Worth flagging as a real trade-off pattern: Farmers'' actual fallback on a contested shingle class is ITEL lab verification, and it''s a legitimate offer, not a bluff — but it''s slow enough that conceding on a completed job is often the better move unless the classification is unambiguous and well-documented up front (ideally *before* the roof is torn off, since photo evidence alone wasn''t sufficient here).

Same claim also had a straightforward quantity supplement (an uncounted 2-story roof section, +10.08 SQ) approved without pushback once the measurement report was attached, and the same eaves drip-edge dispute as elsewhere in Farmers claims (see drip edge entries) — plus a $136 permit fee approved without discussion.

**Takeaway for scoping:** get shingle class documented (photos showing full packaging/branding, not just the nail strip) at initial inspection, before tear-off — once the roof is off, a contested classification either gets conceded or goes to ITEL, and ITEL is a real delay, not just a threat.

**Source:** Farmers Insurance Exchange, claim 7010190417-1 (Scott Jagels), June 2026.', '2026-08-07T22:08:45Z'),
  ('carrier-foremost-brand-structure', 'carrier', 'Foremost Insurance Company — Same Adjusters, Same Infrastructure as Farmers', '{"foremost","farmers","brand-structure","shared-adjusters"}', 'Foremost Insurance Company (Grand Rapids, Michigan) is not an independent carrier for playbook purposes — it runs on the same claims infrastructure as Farmers. Same portal domain (claimsupport.farmers.com), same "myclaim@" / "myadjuster@" address pattern, same automated "Important Claim Information" and "Settlement Notice" templates, and the same individual adjusters work claims under both brand names interchangeably. Confirmed overlap: Chance Podoll and Nina Brandt both appear as the assigned rep on claims under the Farmers name and separately under the Foremost name.

**Practical implication:** every rebuttal strategy, code citation, and negotiation pattern in the Farmers entries above applies directly to Foremost claims — treat them as one carrier family, not two playbooks.

**One difference worth tracking (small sample, not yet a hard rule):** a Foremost review-window commitment came in at 5-7 business days versus the 3-5 typical on Farmers-branded claims. Could be adjuster-specific rather than brand-specific — worth confirming as more Foremost claims come through before treating it as a real distinction.

**Source:** Foremost Insurance Company correspondence (Malee Intarachot, Nina Brandt, Martel Scott, Chancellor Podoll), 2025–2026, cross-referenced against Farmers-branded claims worked by the same reps.', '2026-08-07T22:08:45Z'),
  ('carrier-hartford-initial', 'carrier', 'The Hartford / Sentinel Insurance — Initial Notes (Thin Sample)', '{"hartford","sentinel","depreciation","claim-numbering"}', 'Worth building the entry anyway for the structural details that did show up, and flagging clearly what''s still unknown.

**Claim/event numbering:** Hartford uses a dual-number system — an "Event Number" formatted like PP0020941985/PP0021072434, paired with a separate claim number in a different format (e.g., "Y4R-DP-20720") on the same loss. Track both; correspondence sometimes references only one or the other.

**Underwriting brand vs. claims brand:** the actual policy is underwritten by **Sentinel Insurance Company, Ltd.**, a Hartford subsidiary — "The Hartford" is the claims-facing brand, Sentinel is what shows up as "Writing Company" on the formal document footer. Don''t be thrown if paperwork says Sentinel; it''s the same claim.

**Depreciation payment goes to the homeowner, not the contractor:** on at least one claim, the adjuster (Evita Darius) confirmed recoverable depreciation was released via EFT direct deposit into the *homeowner''s* account, not paid to MD Roofing directly. If BON is tracking payment-recipient patterns across carriers, note Hartford as homeowner-disbursed rather than contractor-disbursed for depreciation releases — worth confirming with the homeowner that funds actually landed before assuming the job is fully funded.

**AccuLynx relay layer:** Hartford''s adjuster emails in this set show up routed through `do-not-reply@mail.acculynx.com` with the adjuster''s real Hartford address in the display name — this is AccuLynx''s own thread-relay behavior on the job, not something Hartford does differently from other carriers. Don''t read anything carrier-specific into that address pattern.

**Claim duration:** the PP0020941985 event (loss date 07/07/2023) still had active claim-document correspondence in June 2025 — another data point for "old claims stay open and active far longer than the loss date would suggest," consistent with what''s already logged for Farmers.

**What''s still missing:** no denial language, no line-item pushback, no code citations, no O&P or depreciation-percentage detail. If more Hartford correspondence comes through later — especially anything with an adjuster explaining *why* a line item was cut — that''s the higher-value follow-up to mine specifically, since this batch didn''t have it.

**Source:** The Hartford (Sentinel Insurance Company, Ltd.) — adjusters Evita Darius and Erin Turner, claims PP0020941985 and PP0021072434, June–August 2025.', '2026-08-07T22:08:45Z'),
  ('carrier-allstate', 'carrier', 'Allstate', '{"allstate","claim-format","depreciation","building-code","acculynx"}', '**Claim number format:** 10-digit numeric claim number (e.g., 0781341193), sometimes shown with three leading zeros in formal subject lines (000798690426) — same claim, just different digit padding depending on the notification template. The underwriting entity varies by policy even though a shared claims@claims.allstate.com inbox handles all of them — "Allstate Vehicle and Property Insurance Company," "Allstate Fire and Casualty Insurance Company," and "Allstate Indemnity Company" all show up on identical-looking correspondence.

**AccuLynx notification stubs are near-content-free.** A real share of the AccuLynx-relayed emails just say "Allstate 96" or "Log in to review" with no substantive body — the actual content lives behind a MyClaim portal login, not in the email. Don''t read an empty-looking AccuLynx notification as "nothing happened" — check the portal.

**AccuLynx reply reliability is inconsistent.** At least one adjuster thread showed replies sent through AccuLynx never reaching the adjuster; the adjuster had to be contacted directly from the MD Roofing email address instead. If a claim goes quiet after a reply, don''t assume it was received — confirm.

**Depreciation release is gated on two documents:** a signed Certificate of Completion and the permit receipt. Every depreciation-release thread in this data included both before payment moved. The permit fee itself is commonly bundled into the same release as the recoverable depreciation.

**Building code coverage is not universal — check the policy first.** Multiple adjusters explicitly stated the policy does not include a building code/ordinance endorsement, meaning code-required items (ice & water shield, drip edge upgrades, step flashing) become the insured''s out-of-pocket expense unless code coverage is confirmed. This showed up as a stated policy fact, not just pushback.

**Item-level scrutiny is granular and photo-dependent.** One adjuster denied/adjusted several line items in a single pass: ridge vents changed to "replace only" with no separate R&R, because Xactimate treats vent removal as included with the shingle tear-off; garage door trim paint scaled down to match the actual garage count; a starter-vs-ice-and-water-barrier distinction required a dedicated photo because the one submitted couldn''t be read either way. Expect line-by-line photo reconciliation, not blanket approval or denial.

**Solar panels under lease require third-party sign-off.** If panels are leased rather than owned, the leasing company must give written consent before a contractor can detach/reset them — this can stall a claim independent of anything Allstate itself is doing.

**Adjuster churn/coverage is common mid-claim.** Several threads show a "Supplement Adjuster" or backup stepping in while the assigned adjuster is out of office, plus at least one explicit mid-claim reassignment. A new name on a reply is usually just coverage, not a new issue.

**Stated response SLAs, when given, are usually honored:** 3–5 business days for acknowledgment, 24–48 or 48–72 hours for processing after document submission, were the ranges adjusters cited directly. Useful for calibrating your own follow-up cadence rather than chasing same-day.

**Standard fax for document submission: (877) 292-9527** — shared across most adjusters regardless of individual phone extension.

**Deductible math confusion shows up on the homeowner side, not Allstate''s.** Homeowners in this data repeatedly misread the net-of-deductible payment as Allstate shorting the claim. Worth having a one-paragraph explainer ready — net claim equals the contractor invoice; Allstate pays the invoice minus the deductible; the insured pays that deductible portion directly to the contractor — since this caused real confusion and needed a manual walkthrough from the office.

**Escalation path:** Not demonstrated in this data — every thread stayed at the individual claims-specialist level, the same gap seen in the State Farm and American Family entries. If there''s a real move here (supervisor request, appraisal clause, DOI complaint), it isn''t reflected in this correspondence.

**Source:** built from 30 real Allstate claim email threads (AccuLynx-relayed and direct), June 2025–April 2026.', '2026-08-07T22:08:45Z'),
  ('carrier-libertymutual', 'carrier', 'Liberty Mutual / Safeco', '{"liberty-mutual","safeco","claim-format","supplement-portal","cost-incurred"}', '**Brand note — treat Safeco as Liberty Mutual, not a separate carrier.** Every "Safeco" claim in this data is handled by Liberty Mutual employees (@libertymutual.com addresses), uses the same PO Box 5014 Scranton PA mailing address, and the same adjusters work both brands interchangeably. An April 2026 thread confirms Liberty Mutual is formally renaming Safeco to Liberty Mutual outright: "Claims adjusters handle both Safeco and Liberty claims so you will not experience any delay due to this change." Expect the Safeco name to disappear from correspondence going forward — don''t build separate tracking for it.

**Claim number format:** 6-digit number + "-01" exposure suffix (e.g., 059580434-01). The "-01" is the exposure number, not part of the claim number, and appears as its own field in the email footer metadata.

**Supplements must go through the portal, not just email.** Adjusters repeatedly redirected supplement submissions to the "Assisted Supplement Capture" portal at property-supplements.libertymutual.com rather than accepting an emailed estimate as the primary submission. Email correspondence supplements the portal — it doesn''t replace it.

**Invoices must be genuinely itemized — generic line items get bounced.** One adjuster explicitly rejected a lump-sum invoice line ("Exterior…….$1,007.77") and required task-level breakdown ("Exterior – Removed and Replaced Garage Door…….$1,577.27") before processing payment. A single dollar amount per trade category is not sufficient documentation for this carrier.

**Debris removal needs its own line item, even if the grand total already matches.** Recoverable depreciation and debris removal are both paid "if/when incurred" — meaning after the homeowner has actually paid the contractor — and debris removal specifically has to be broken out as its own final-invoice line before that portion releases, even when the overall total already equals the approved estimate.

**"Cost incurred" ceiling — this is their core supplement-pushback doctrine.** If a contractor''s own submitted estimate is lower than what the carrier''s pricing system would otherwise produce for the same scope, Liberty Mutual holds the contractor to their own number rather than paying the higher system price — even after already matching a subsequent, higher ask once. Their stated logic, paraphrased: if you were willing to do the job for $31K, why do you need $42K now — an insurance estimate is a cost ceiling, not a target price. Any supplement above the contractor''s own contracted number requires unredacted proof of actual incurred cost, not just a revised estimate.

**Payment via "Pay Your Way" is real, not a scam — but it confuses homeowners.** Final payments frequently arrive as a link from alert@getmypayment.libertymutual.com with payment-method choices (PayPal, debit transfer, direct deposit, check). Every adjuster using this method proactively warned the homeowner it wasn''t a scam — worth pre-warning your own clients the first time it shows up, since it reads exactly like a phishing attempt.

**Solar ownership status gets asked early** on solar-adjacent damage — owned vs. leased, before the claim proceeds. Lighter-touch than Allstate''s lease-consent requirement (this is just an ownership question, not a third-party sign-off), but it''s a standard early ask.

**Adjuster reassignment is routine and can take 1–2 business days to land.** New claims frequently sit in an unassigned queue briefly before a desk adjuster is pulled. No word in the first day or two is normal queue time, not a dropped file.

**Escalation is possible here — and was actually attempted in this data, unlike the Allstate or American Family entries.** One thread shows a real escalation push: requesting a coverage/timeline summary with a supervisor CC''d. The result — the carrier answered once with specifics, then shut it down hard on the second ask ("This will be the last response on this matter... Our coverage decision is final"), citing policy timeline language tied to months elapsed since date of loss. Escalating here doesn''t reliably move a firm no, but it does get answered rather than ignored.

**Standard fax: 888-268-8840 — always include the claim number in the fax itself**, not just the cover sheet, per multiple adjuster signatures.

**Source:** built from 40+ real Liberty Mutual/Safeco claim email threads (adjuster correspondence, homeowner CCs, and MD Roofing outbound), May 2025–April 2026.', '2026-08-07T22:08:45Z'),
  ('carrier-libertymutual-addendum1', 'carrier', 'Liberty Mutual / Safeco — Denial Language & Pricing Authority', '{"liberty-mutual","safeco","denial-language","o-and-p","itel-pricing"}', '**O&P denial template — this is a stock rationale, not a case-by-case judgment call.** Verbatim pattern, paraphrased: "O&P is warranted for complexity and coordination on claim. This claim does not fall under that criteria." No further detail is given about what would meet the bar — pursuing O&P here means making the multi-trade/coordination case affirmatively rather than waiting for them to articulate what''s missing.

**Pricing authority is ITEL, stated explicitly — argue against ITEL, not against Xactimate defaults.** One denial letter stated directly: "we use ITEL pricing and is not negotiable as the materials can be ordered and delivered to the home for install." If material cost is coming in above their number, the rebuttal needs to address ITEL''s own basis (delivery/availability), not just cite a different price list.

**Code items get denied with a specific "not locally enforced" framing** — distinct from Allstate''s "no code coverage on this policy" framing. Liberty Mutual''s version excludes code items from covered scope specifically when the underlying code isn''t locally enforced in that jurisdiction, meaning a code argument here needs proof of actual local enforcement, not just a general IRC reference.

**Storm-vs-condition denials show up here too** ("Repairs to stucco - damage not storm related") — the same age/condition attribution pattern seen in the State Farm entry. No specific counter-evidence approach was demonstrated in this data beyond the general principle of isolating storm-specific damage markers.

**Window damage gets redirected to a repair estimate, not a replacement one,** when only vinyl/trim components are damaged. The adjuster explicitly asked for "an estimate from a window repair company" rather than treating it as a roofer-scope replacement item.

**Pricing-adjustment requests have a hard documentation bar:** all unredacted material and labor invoices, plus a copy of the signed insured contract. This was stated as a requirement for the request to be considered at all, not just helpful supporting material.

**Internal review shorthand "KTOR" appears in adjuster decision language** — e.g., "KTOR supports confirm it is pre-existing," "KTOR supports confirmed the damage." This is Liberty Mutual''s internal review/verification reference cited as the basis for both approvals and denials. Worth knowing the term exists in their decision letters even without visibility into the tool behind it.

**Source:** built from the same Liberty Mutual/Safeco correspondence set, focused on formal supplement-decision and denial letters, May 2025–April 2026.', '2026-08-07T22:08:45Z'),
  ('carrier-nationwide', 'carrier', 'Nationwide', '{"nationwide","claim-format","depreciation-deadline","ice-and-water-shield","op-denial","class-4-shingles","full-replacement-rebuttal"}', 'The underwriter named in the signature isn''t a reliable signal of anything — don''t read into it. Nearly every adjuster signs with a Florida license number regardless of the property being in Colorado, which points to a centralized/remote claims operation rather than local desk assignment.

**Claim number format:** 6 digits–dash–2 letters (e.g., 398952-GQ, 872818-GQ, 706605-GP, 842210-GO, 153973-GR). The 2-letter suffix appears to be a batch/queue code, not a claim-type indicator — GQ is by far the most common in this data set, with GP/GO/GR also appearing.

**Routing and submission:** One shared inbox, nationwide-claims@nationwide.com — simpler than AmFam''s two-inbox split. Most correspondence flows through AccuLynx (do-not-reply@mail.acculynx.com / reply@mail.acculynx.com relaying on behalf of the real adjuster address), but individual adjuster direct addresses also show up in the wild (kendan1@nationwide.com, ruizf3@nationwide.com, nationwide_claims005/008/019/021@nationwide.com). CC both the individual and the shared queue — the individual inbox is where OOO and reassignment gaps show up first.

**Adjuster churn is high — plan for it:** At least ten different named adjusters appear across this batch (Ryan Lacy, Myreka Hassen, Chelsea De La Cruz, Gabbrell Sparks, Liz Harman, Mia Brown, Don Rogers, Nathaniel "Blayne" Kendall, Courtney Moore, Sharion McQuitery, Belmina Imsirovic), and one file contains an explicit reassignment notice: "The prior adjuster is no longer in the role and the claim was reassigned to myself." Courtney Moore also picked up Blayne Kendall''s queue while he was out of office and handed it back on his return — so a covering adjuster mid-thread isn''t a sign anything went wrong, just normal coverage.

**What pushes back — categorical, not case-by-case:**
- **Ice & Water Shield (IWS):** Denied by default on pitch/overhang math. Adjusters will show their own SF calculation (based on pitch and overhang) and ask you to justify yours — bring the calc, not just the request.
- **Height removal charge:** Denied as a blanket "official stance" — "height has little impact on the removal of shingles." Not evaluated per-file; don''t expect this one to move without a structural argument specific to the property.
- **Overhead & Profit (O&P):** Default posture is denial even on legitimately complex multi-trade jobs. A 7-trade job (painting, fencing, garage doors, gutters, windows, roofing, solar) was denied outright with the standard multi-trade/NAIC argument attached. The one partial win in this data was 3 supervisory hours approved in place of full O&P for coordinating garage work — treat that as the ceiling to expect, not the floor.
- **Hand-hauling / extra labor:** Denied as already "included in the line item for shingles" — a flat denial that doesn''t engage with the specifics of the extra-labor claim.
- **Repair vs. replace (decking spacing, code-based arguments):** Nationwide will not accept a general code assertion. They require either (a) a copy of the applicable code on official city letterhead confirming it''s an enforced requirement, or (b) the name, phone, and email of the city inspector enforcing it. On top of that, they want a defined photo set: each slope showing the condition, top-down shots, close-ups, and photos with a tape measure in frame. Submit all of it up front — partial documentation just resets the review clock.
- **Class 4 / impact-resistant shingle verification:** Photos of white backing are explicitly "not sufficient" — they want manufacturer product documentation or third-party testing (ITEL report). A verbal on-roof agreement from their own inspector doesn''t carry weight if it isn''t in the file — get any on-site adjuster concession in writing before you rely on it.
- **Full roof replacement denials:** These are contestable and winnable. The Warren claim (872818-GQ) was denied for full replacement, then overturned to full replacement after a detailed rebuttal (collateral metal damage, mat fracture argument, discontinued shingle color, hail-hit test-square counts) plus a re-inspection. Nationwide will require the homeowner to explicitly confirm consent to a second inspection before it''s scheduled — cite the Duties After Loss clause yourself if needed; that''s the same clause they invoke.
- **Dropped line items on revised estimates:** Previously-approved items (gutters, in this data set) can silently disappear between estimate revisions. Always reconcile the final approved estimate line-by-line against prior approvals — catching this requires a specific itemized LF-by-elevation breakdown, not just a general "gutters are missing" flag.

**Depreciation deadline — different from American Family:** Recoverable depreciation must be claimed within **2 years of the date of loss**, not 12 months. This was enforced with zero exception in the data — one claim was denied recoverable depreciation because materials/permit were purchased 3 days past the 2-year mark. Also note: the claim reflects the price list in effect on the date of loss, not the date a supplement is filed — don''t expect price escalation arguments to work.

**Tone:** Generally polite and cooperative on routine items (invoice confirmations, depreciation releases) — "have a great day," emoji use, "always happy to assist" is common, especially from higher-volume associates. But categorical denials are stated flatly as company policy ("Nationwide''s official stance is...") without much room for negotiation in the same message — the difference from American Family is that AmFam''s pushback lines are exclusion-logic-based and somewhat arguable, while Nationwide''s routine denials read as scripted policy positions. The real leverage is documentation-based (codes, ITEL reports, gauged photos) rather than persistence or tone.

**Escalation path:** One internal reference to "a discussion with my manager" preceding a firm denial — this is the only visible internal escalation step, and it''s Nationwide''s own supervisor review, not something the contractor can invoke. No DOI complaint, appraisal-clause invocation, or contractor-initiated supervisor escalation appears anywhere in this data. The most effective lever available in the data was re-inspection + documentation, not schedule pressure.

**Source:** built from 56 real Nationwide claim email threads (MD Roofing book of business, Colorado Springs/Peyton, CO market), spanning roughly May 2025 through June 2026. Four files in the upload batch were excluded as out of scope: one Shelter Insurance claim (Morris, HO3656649), two OneClick Code vendor marketing emails, and one homeowner-side billing clarification email (Bacon Partners) that wasn''t adjuster correspondence.', '2026-08-07T22:08:45Z'),
  ('carrier-usaa-format', 'carrier', 'USAA — Claim Format, Routing & Org Structure', '{"usaa","claim-format","routing"}', '**Claim number format — two variants seen:**
- Full format: 9 digits + dash + 3-digit suffix, e.g. `011609068-800`, `006157399-808`, `002802584-806`, `002095212-801`, `010759054-801`. Regex: `^\d{9}[-–]\d{3}$`
- **Gotcha:** some of these render with an en-dash (–, U+2013) instead of a plain hyphen (-) depending on the email client — confirmed on the same claim number appearing both ways across different emails (011609068–800 vs 011609068-800). If you''re hardcoding a regex for the Outlook extractor, match both characters or normalize dashes before matching.
- Shorter format also appears without the suffix: `006519068`, `014492597` — likely the base claim number before a specific loss/sub-claim suffix gets appended. Don''t assume a 9-digit-only number is malformed; USAA correspondence uses both forms depending on context.

**Routing:** All outbound correspondence comes from `USAA.customer.service@protect.usaa.com`. Each individual claim gets its own unique reply-to alias at `claims.usaa.com` — pattern is usually `3j7` + random alphanumeric (e.g. `3j7px43jkg37w@claims.usaa.com`), though at least one claim used a different prefix (`52h9kmvq2bgw@claims.usaa.com`) — don''t hardcode the `3j7` prefix as a requirement, just match the `@claims.usaa.com` domain.

**Multiple underwriting entities behind the same brand — same process, different legal entity:**
- USAA Casualty Insurance Company
- United Services Automobile Association
- USAA General Indemnity Company
- Garrison Property and Casualty Insurance Company (explicitly noted as "a subsidiary of USAA Casualty Insurance Company, authorized to use the USAA logo")
Correspondence, claim handling, and adjuster behavior all look identical regardless of which entity is named in the signature — but if a dispute ever needs a formal complaint or legal notice, confirm which specific entity actually underwrites the policy before addressing it.

**Team names seen:** "Property Claims Catastrophe" (appears with numbered variants, e.g. "Property Claims Catastrophe 3" — suggests multiple numbered catastrophe-response teams/pods, not one desk).

**Turnaround time — two very different numbers depending on volume:**
- Stated baseline SLA: 3-5 business days for a standard review ("Please allow me 3-5 days," "may take up to 3-5 business days").
- During high storm volume, this stretches dramatically — direct quote from your own correspondence to a homeowner: "USAA has been overwhelmed with claims right now and they are taking weeks to even look at anything I send in." Set homeowner expectations accordingly during active cat season.

**Source:** 34 USAA claim threads, Sep 2025–Jan 2026.', '2026-08-07T22:08:45Z'),
  ('carrier-usaa-denials', 'carrier', 'USAA — Approval/Denial Logic & Documentation', '{"usaa","hail","measurements","permit-fees","documentation"}', '**"Not consistent with hail" — their stock rejection language for cosmetic items.**
On one hail claim, every denied line item carried the identical reasoning: "not consistent with hail." Denied under this exact language: paint door/window trim & jamb (2 coats), paint patio (2 coats), clean siding (wood), seal & paint wood siding, clean with pressure/chemical spray — repeated across multiple line numbers. Meanwhile hail-plausible items on the SAME claim were approved: steep charge (per EagleView), IWS in valleys (per photos), exterior post light fixture R&R + paint, updated wood siding paint quantity, gutter/downspout paint + R&R.
**Read:** USAA draws a hard, mechanical line between impact-consistent damage (steep charges, IWS, hardware R&R tied to actual hail strikes) and general cosmetic refresh items (broad repaint, cleaning, patio finishing) — even on an otherwise-approved claim. If you''re pricing cosmetic items into a hail supplement, expect this exact rejection language unless you can tie the specific item directly to documented impact damage, not general wear.

**Measurement authority — they use Hover, and won''t reconcile against EagleView.**
Direct quote, twice, same claim: "our stucco measurements were added up from our Hover report... we won''t be using eagleview report provided to make changes." This is a flat refusal to reconcile between competing measurement platforms. If you want to dispute a USAA measurement, arguing from a different aerial report doesn''t work — you need either their own Hover data reinterpreted, or ground-truth site measurements/photos, not a rival platform''s number.

**"Already included" denials — check current quantities before disputing.**
Confirmed pattern: "IWS - Not Warranted - IWS is already included on USAA report @853.62 SF." Same logic as State Farm''s "compare to our estimate first" — always check the current estimate''s existing quantity before re-requesting an item, or you''ll get a quick, correct denial that costs you credibility on the next ask.

**Permit fee — base cost only, explicit no-double-tax logic.**
Direct quote: "Permit fee - Approved @ $135.00, not $446.03 — fees/taxes outside of cost of building permit isn''t covered. Tax is already paid on materials in the estimate, will not essentially pay taxes on material twice." Same base-fee-only pattern as State Farm, but USAA states the reasoning explicitly: they consider bundled permit taxes/fees a double-charge against material tax already priced elsewhere in the estimate. If you want the full permit cost covered, itemize what''s actually municipal-fee vs. tax, since they''re reading that distinction literally.

**Documentation asks are specific, not generic.**
Real example: "Please submit the paid receipt for the permit and photos of the damaged OSB requested for review." Always the actual paid receipt (not a quoted fee) plus photos of the specific component in question — matches the general "documentation has to isolate the actual item" pattern seen with other carriers too.

**Signed contract requests happen mid-claim.**
On at least one claim, USAA requested a copy of the signed contract before releasing a revised estimate — not something seen requested by State Farm in this data. If sending a contract copy, note explicitly that contract-stage numbers may not reflect the final agreed price (your own language to them: "we do not update the numbers on the contract, therefore they are not accurate and not to be used as a final price") — worth stating this every time you send a contract copy to any carrier, so an old number doesn''t get treated as authoritative.

**Coverage-type exclusions are non-negotiable — different from a scope dispute.**
Confirmed: "that window as well as the interior water damage from the surface/flood waters is not covered under this claim." This is a POLICY exclusion (surface water/flood typically requires separate flood coverage under a standard homeowners policy), not a pricing or scope argument — don''t spend time building a rebuttal case here; it''s not the same kind of dispute as a denied line item.

**Depreciation is released directly to the homeowner, not the contractor.**
Confirmed: "Just released the depreciation in full to the member for $4,004.83." You will need to collect the recoverable depreciation portion from the homeowner directly — USAA doesn''t route it to the contractor even when the contractor is billing the job.

**Final invoice review checks for a complete RCV figure.**
Confirmed follow-up question on a submitted invoice: "was this the final invoice — if so there is no total RCV." Make sure any final invoice submission states the full RCV total explicitly, or expect a clarifying question before they''ll process it.

**Source:** same 34 USAA claim threads, Sep 2025–Jan 2026.', '2026-08-07T22:08:45Z'),
  ('carrier-progressive', 'carrier', 'Progressive (American Strategic Insurance)', '{"progressive","asi","american-strategic","claim-format","photo-documentation","small-sample"}', '**Small sample flag — only 2 distinct claims in this data.** Read this entry with less confidence than the AmFam/Nationwide entries; revisit once more Progressive claims come through.

**Structure:** Progressive Home routes through American Strategic Insurance (ASI), a Progressive subsidiary. Automated notices come off `claims.americanstrategic.com` while the adjuster works off a personal `@progressive.com` address — that domain mismatch is easy to misread as a phishing red flag if you''re not expecting it.

**What they ask for — documentation-first, itemized:**
- On a full drip edge replacement request: they want either confirmation the drip edge was pre-existing across the full roof, OR code documentation requiring full replacement — plus close-up hail-damage photos of gutters/downspouts specifically (not general roof photos).
- On garage door replacement: they explicitly require documentation of structural damage, discontinuation, OR functional impairment — a repair-vs-replace argument needs to hit one of these three, not just cosmetic damage.
- On felt-layer supplements: photo quality is a real gate, not a formality — a blurry photo showing multiple felt layers was rejected outright and the whole review paused until a clear replacement photo was sent. Confirm photo clarity before submitting, especially for layer-count evidence.
- Adjuster attempted a phone follow-up (two call attempts) before formally requesting missing documentation — Progressive appears to make an active outreach effort rather than only emailing, so a missed call from an unfamiliar number during an open claim may be the adjuster.

**Invoice/completion sequencing:** One clear operational point — the adjuster will not process a final invoice until they''ve sent the revised (post-supplement) estimate; conversely, don''t send your invoice/completion certificate until you have that revised estimate in hand, or you''ll be asked to resend once the estimate catches up. Confirm the revised estimate arrived before submitting completion documents to avoid a redundant round-trip.

**Tone:** Cooperative and procedural in both threads — no denials observed yet in this small sample, only requests for clarifying documentation. Adjusters follow up proactively when documentation is missing or stalled (phone calls, resending emails, explicit reminders) rather than letting a claim go quiet.

**Escalation path:** Not observed in this data — no denial, no supervisor mention, no pushback beyond documentation requests. Nothing here yet to build an escalation script from; revisit once a contested claim comes through.

**Source:** built from 5 real Progressive/American Strategic Insurance claim email files (MD Roofing book of business, Colorado Springs/Peyton, CO market) covering 2 distinct claims, spanning July 2025–May 2026.', '2026-08-07T22:08:45Z'),
  ('script-drip-edge-recover-replacement', 'scripts', 'Drip Edge Eaves — "No Need to Touch It" Denial Rebuttal (IRC R908.3)', '{"drip-edge","irc-code","rebuttal-win","tear-off","recover-vs-replacement"}', '**When to use this:** Adjuster denies R&R on eaves drip edge with some version of "it''s installed correctly under the felt, no need to manipulate it during tear-off" (seen verbatim from multiple Farmers adjusters, and functionally the same reasoning shows up at other carriers). They''re citing an *application-method* code section — how drip edge is installed — not the requirement that triggers your argument.

**The move:** Don''t argue their citation. It''s usually correct on its own terms (something like IRC 905.2.8.5 — drip edge goes under underlayment at eaves, over it at rakes). Instead, invoke the section governing **re-covering vs. replacement**: IRC R908.3, which requires that the existing roof covering and anything secured to the deck be removed before a re-roof passes inspection. On a full tear-off, drip edge comes off the deck along with everything else *by code*, independent of whether the old drip edge shows storm damage.

**Draft language:**

"We understand [carrier]''s position that drip edge at the eaves is installed beneath the underlayment per [their cited section] and does not require replacement for installation-method reasons alone. However, this claim involves a full tear-off and re-cover-to-replacement scope. Per IRC R908.3, the existing roof covering — and any materials secured to the deck, including eave drip edge — must be removed as part of that process. New drip edge at the eaves is therefore a code-required component of the tear-off itself, not a storm-damage claim on the existing material. We''re not asking you to find the old drip edge damaged; we''re asking for the line item that this tear-off scope requires by code."

**Why it works:** Their code citation and yours aren''t in conflict — they answer different questions (how it''s installed vs. what a full tear-off requires). Naming the specific section number, not just "code requires it," is what gets traction; a vague code reference invites a vague denial.

**Documented result:** Reversed a Farmers denial on claim 7010176180-1 (Althea Thompson), June 2026.', '2026-08-07T23:00:00Z'),
  ('script-full-replacement-overturn', 'scripts', 'Full Roof Replacement Denial — Overturn Template (Collateral Damage + Discontinued Match)', '{"full-replacement","rebuttal-win","re-inspection","discontinued-material","mat-fracture"}', '**When to use this:** Carrier denies full roof replacement and instead approves repair-only or partial replacement, when you have multiple independent lines of evidence pointing to full replacement being the correct scope.

**The four-part argument that won this (stack as many as apply — don''t lead with just one):**
1. **Collateral damage on adjacent/connected metal components** — if flashing, vents, or other metal tied into the roof system shows confirmed hail damage, that''s independent evidence of storm force on the roof, not just isolated shingle wear.
2. **Mat fracture argument** — shingle mat fracturing (not just granule loss) is a functional damage indicator, not cosmetic; it affects the shingle''s structural integrity and water-shedding ability going forward, which supports replacement over spot repair.
3. **Discontinued shingle color/line** — if the existing shingle is confirmed discontinued, a repair-only scope creates a visible, unmatchable patch. Get manufacturer confirmation of discontinuation in writing if possible.
4. **Hail-hit test-square counts** — a documented test-square count (hits per 100 SF, per the relevant testing standard) showing damage density above the repair threshold is the hardest data point to argue against. Lead with this if you have it.

**Draft language:**

"We''re requesting reconsideration of the repair-only determination on this claim. Test-square counts documented at inspection show [X] hail hits per 100 SF, consistent with functional damage rather than cosmetic wear. This is corroborated by confirmed hail damage to collateral metal components on the same roof system ([list: flashing/vents/etc.]), and by mat fracturing visible in the attached photos — not simply granule loss, but fracturing that compromises the shingle''s water-shedding function going forward. Additionally, the existing shingle ([manufacturer/line/color]) has been confirmed discontinued [attach manufacturer confirmation if available], meaning a repair-only scope would leave a visibly unmatched patch on the roof. Given the density and functional nature of the documented damage, combined with the inability to match materials for a partial repair, we respectfully request a re-inspection with this documentation in hand to reconsider full replacement."

**Process note:** Some carriers (Nationwide, in the documented case) require the homeowner to explicitly consent to a second inspection before scheduling it — cite the policy''s Duties After Loss clause yourself if the carrier invokes it, rather than waiting for them to raise it first.

**Documented result:** Nationwide claim 872818-GQ (the "Warren" claim) — denied for full replacement, then overturned to full replacement after this combination of arguments plus a re-inspection.', '2026-08-07T23:00:00Z'),
  ('script-op-six-trade-coordination', 'scripts', 'Overhead & Profit — Multi-Trade Coordination Argument', '{"overhead-and-profit","o-and-p","multi-trade","rebuttal-win","general-contractor"}', '**When to use this:** O&P was left off an estimate or denied on a claim involving genuinely multiple trades (roofing + siding + painting + windows + HVAC + interior, etc.) coordinated under one general contractor. Most carriers'' own guidance (State Farm''s Building Estimate Summary Guide explicitly says so) ties O&P eligibility to repair complexity — this argument makes the complexity case affirmatively instead of waiting for the carrier to volunteer it.

**Strengthen it, don''t just ask:** Voluntarily excluding a trade you''re NOT coordinating (e.g., garage doors handled separately) signals a targeted, reasonable request rather than a blanket O&P grab — this credibility signal is doing real work in the version that succeeded.

**Draft language:**

"We are writing to formally request the inclusion of General Contractor Overhead and Profit (O&P) on the above-referenced claim. Upon review of the approved estimate, we note that O&P has not been applied to the scope of loss. We respectfully submit that the complexity and multi-trade nature of this claim clearly warrants its inclusion.

The approved scope encompasses no fewer than [N] distinct trades, including [list trades]. Coordinating this volume and variety of subcontractors requires a general contractor to serve as the primary point of accountability — managing scheduling, sequencing, inspections, subcontractor oversight, material procurement, and quality control across all phases of repair.

It is well established in the claims industry — and supported by Xactimate pricing methodology — that when a loss requires coordination of three or more trades, a general contractor''s involvement is not only reasonable but necessary. This claim meets and exceeds that threshold.

We would also note that [excluded trade] has been excluded from our scope, which further demonstrates that we are not seeking O&P on the full universe of line items, but only on those trades actively being coordinated under a single general contractor.

We respectfully request that General Contractor Overhead at 10% and General Contractor Profit at 10% be added to the recoverable portion of this estimate. Please advise whether this can be processed as a supplement or whether a re-inspection is required."

**If denied anyway:** Request the carrier''s written rationale for denying O&P given the documented trade count — this puts the burden back on them to justify the exclusion rather than leaving it as an unexplained no.

**Know your carrier before you send this:** O&P denial postures vary a lot — American Family ties it to sub-vs-non-sub coordination (approved on subbed trades, denied on the primary trade you''re not subbing out), Liberty Mutual uses a stock "does not fall under that criteria" denial with no elaboration, and Nationwide''s default posture is denial even on legitimate 7-trade jobs (their one documented partial win was 3 supervisory hours in place of full O&P). Check the relevant Carrier Playbook entry before you calibrate how hard to push.

**Documented result:** Drafted for a State Farm claim (Nuessle, Lois — 06-87G9-03K), six-trade job (roofing, siding, painting, windows, HVAC, interior), garage doors voluntarily excluded from the ask.', '2026-08-07T23:00:00Z'),
  ('workflow-client-lifecycle', 'workflow', 'BON Client Workflow — Intake, Approval, Carrier Rounds, Close', '{"workflow","intake","turnaround","contractor-authorization","compliance-boundary"}', 'This is BON''s own locked workflow for delivering supplement work to contractor clients — not MD Roofing''s internal Acculynx/Trello process. This is what actually happens on a job once a contractor becomes a BON client.

**Intake.** The contractor emails the carrier estimate, measurements, and photo report for each claim. BON classifies the pricing tier and confirms the fee before any work begins. Tier classification is locked at intake and does not change based on claim outcome — if a claim turns out more complex than expected once work starts, that''s absorbed at the original tier, not re-billed. This is a deliberate pricing-integrity choice, not an oversight.

**Approval.** No supplement is ever submitted to a carrier until the contractor explicitly approves it — the trigger phrase is "Send it." This is the contractor''s own scope of work, and they sign off on it before it goes out under their identity (see the authorization language below).

**Carrier rounds.** BON handles carrier correspondence within a specific, contractually defined boundary: transmitting scope documentation, explaining the construction/code/manufacturer-spec/measurement/pricing-database basis of line items, answering technical questions about the scope, and resubmitting revised scope documentation as needed. This explicitly **excludes** negotiating payment, disputing coverage determinations, interpreting policy language, or representing any policyholder. **If a carrier''s position concerns coverage rather than scope, BON refers the matter back to the contractor the same business day** — this is a hard rule, not a judgment call, and it''s what keeps BON''s activity inside scope-documentation rather than drifting into public-adjusting territory (see the Legal Framing Guardrail in Detection Framework and the Colorado/Oklahoma entries in State Notes for why this distinction is load-bearing).

**Close.** The contractor makes all final decisions on accepting outcomes, pursuing further documentation rounds, or withdrawing items — the trigger phrase is "Close it." BON doesn''t unilaterally decide a claim is finished; the contractor closes it.

**Turnaround target:** initial supplement drafts are targeted within 24-48 hours of complete intake, subject to complexity and volume. The contractor can view claim status in BON''s shared queue at any point — this isn''t a black box between intake and delivery.

**Ownership language, verbatim from the locked scope-of-work document:** "All supplements, scope documents, and related communications are adopted, owned, and submitted by Contractor under Contractor''s identity. Contractor authorizes BON to prepare and transmit scope documentation and related technical correspondence to insurance carriers on Contractor''s behalf, under Contractor''s company identity, as Contractor''s back-office estimating resource." This authorization is limited to the activities listed above and expressly excludes negotiating payment, disputing coverage, interpreting policy language, or representing any policyholder.

**Source:** BON''s locked scope-of-work document, established during go-to-market strategy work.', '2026-08-10T00:45:00Z'),
  ('workflow-pricing-tiers', 'workflow', 'BON Pricing & Tier Classification', '{"pricing","tiers","volume-ladder","pilot-rate"}', '**Standard tiers:**
- **Simple** — $350, with a volume ladder down to $300 at 5+ per month and $275 at 10+ per month
- **Semi-complex** — $600
- **Complex** — $950

**Pilot rates** (for new contractor clients, presumably to lower the initial trial barrier): $175 / $300 / $475 across the same three tiers.

**Tier is fixed at intake, not renegotiated later.** As noted in the client workflow entry, once a claim is classified, that tier holds regardless of how the work actually plays out — if a "simple" claim turns out to need more rounds of carrier correspondence than expected, that''s still billed at the simple rate. This protects the contractor from scope-creep billing and forces BON''s own pricing discipline to be accurate at intake rather than padded to cover uncertainty.

**Compliance boundary tied directly to pricing structure:** BON''s fee is always flat, never contingent on claim proceeds. This is what keeps the business model as an estimating vendor rather than something that reads like a percentage-of-recovery public-adjusting arrangement — see the State Notes entries on Missouri/Minnesota and Colorado for why this distinction carries real legal weight, not just an ethical preference.

**Source:** BON''s locked scope-of-work document and pricing strategy work.', '2026-08-10T00:45:00Z'),
  ('workflow-bon-contractor-acquisition-pipeline', 'workflow', 'BON''s Own Contractor Acquisition Pipeline (Sales Side)', '{"sales-pipeline","contractor-acquisition","onboarding","crm-stages"}', 'This is the pipeline BON itself moves through to acquire and onboard a new contractor client — distinct from the per-claim workflow (intake → approval → carrier rounds → close) that runs once a contractor is already a client. Built as the "BON Umbrella Admin" super-admin layer inside the BOS CRM, this is effectively a CRM within the CRM: BON''s own sales/success pipeline, tracked the same rigorous way client jobs are tracked.

**Stages:**
1. Prospect Identified
2. Demo Scheduled
3. Demo Completed
4. Proposal Sent
5. Trial Active
6. Contract Signed
7. Onboarding
8. Active Account
9. At Risk

**Why this exists as its own tracked pipeline rather than an ad hoc process:** BON''s stated growth model leans on referrals over paid acquisition (see the "Top of mind" priority on deploying capital toward Deidra''s operational capacity and a referral-based lead system, not paid ads) — a defined pipeline with an "At Risk" stage built in specifically supports catching client dissatisfaction before it becomes churn, which matters more in a referral-driven growth model than in a paid-acquisition one, since a churned client is also a lost referral source, not just lost revenue.

**Practical use:** every new contractor conversation, from first outreach call through active billing relationship, should have a stage in this pipeline — not just informally tracked in someone''s head or a spreadsheet. This is the same discipline applied to BON''s own growth that gets applied to a contractor''s claims.

**Source:** BOS CRM build sessions, BON Umbrella Admin layer specification.', '2026-08-10T00:45:00Z'),
  ('workflow-internal-tracking-system', 'workflow', 'Internal Job/Supplement Tracking — BOS CRM (Not Acculynx/Trello)', '{"bos-crm","supabase","supplement-tracker","job-tracker","not-acculynx"}', '**Explicit note: BON does not run its per-claim tracking through Acculynx or Trello.** Those are MD Roofing and Solar''s internal tools from a prior employer context (see the MD Roofing Supplementing SOP referenced elsewhere for that different, now-superseded workflow). BON''s own tracking runs through the custom-built BOS CRM.

**Current build state:** Vite + React frontend, Supabase backend (project ezfrtcbmyifevyepgoym.supabase.co), deployed via Netlify at boscrm2.netlify.app. Rebuilt from scratch via Claude Code after an earlier Base44 version proved unstable/glitchy — the Base44 experience specifically surfaced the failure mode of chat-based code generation rewriting entire files rather than making surgical edits, which is why the rebuild carries a disciplined CLAUDE.md file with hard rules against full-file rewrites and commit discipline.

**Core tables relevant to the per-claim workflow:** contractors, claims, supplements, actions, reminders — with a leads table added later for landing-page capture. The supplement tracker specifically logs insurer, amount, submission date, and status per claim, with inline status updates as a claim moves through the carrier-rounds process described in the client workflow entry.

**Contractor-facing visibility:** a contractor-facing client portal was built on top of this same Supabase backend, giving contractors login access to see their own supplement queue with stage badges, claim detail with a progress timeline, file upload into the existing claim-docs storage bucket, and a messaging thread — this is the mechanism behind "the contractor can view claim status in BON''s shared queue" referenced in the client workflow entry. An admin portal (Keri''s view) mirrors this with a full contractor sidebar, live stage-update dropdowns that auto-notify contractors on change, and document download.

**Practical implication for day-to-day work:** every claim''s actual state (intake received, draft in progress, submitted, awaiting carrier response, supplement approved, closed) should live in this system, not in an inbox or a mental model — that''s what makes the contractor-visible queue and the "Send it"/"Close it" approval gates in the client workflow entry actually functional rather than just contractual language.

**Source:** BOS CRM build sessions and the client-portal/admin-portal build work.', '2026-08-10T00:45:00Z'),
  ('case-nuessle-statefarm', 'cases', 'Nuessle — State Farm (Claim 06-87G9-03K) — $4,997 Recovery, Two-Tier Catch', '{"state-farm","matched-pair-backtest","tear-off-reconciliation","garage-door","photo-count"}', '**The case:** State Farm claim 06-87G9-03K, Lois Nuessle. Used as the primary positive/quantified validation case for the scope-audit tool''s detection framework — the original carrier estimate was diffed against the final approved supplement to see what a proper audit should have caught.

**Total recovery: ~$4,997, split across two completely different detection mechanisms:**

**Piece 1 — $2,044 from a roof field quantity shortfall (Tier 1, pure measurement math).** The tear-off reconciliation rule caught this independently, with no photo review needed at all — just arithmetic against the measurement report. This is the kind of catch that should never be missed on any job, since it requires no judgment call, just correctly running the numbers.

**Piece 2 — $2,954 from a garage overhead door unit-count miss (Tier 3, photo-based).** This piece was invisible to any measurement report — it only existed in the photos. Ground-truth photo review confirmed both garage doors showed hail damage, three circled impacts each. This is the case that proves photo-based detection isn''t optional even though it''s the least reliable tier — real money lives there that Tier 1/2 logic structurally cannot see.

**Same claim also produced the six-trade O&P argument** (roofing, siding, painting, windows, HVAC, interior) — see the O&P script in Scripts & Rebuttals for the full drafted language, including the credibility move of voluntarily excluding garage doors from that specific ask since they were being argued separately as a damage-count issue, not an O&P scope item.

**Why this case matters beyond its own dollar value:** it''s the clearest real proof that Tier 1 and Tier 3 are complementary, not redundant — each caught money the other structurally could not. A scope audit that only ran measurement math would have found $2,044 and stopped. A scope audit that only reviewed photos might have found the garage doors but missed the cleaner, faster $2,044 math catch. Both were needed for the full $4,997.

**Source:** RSWE/BOS scope-audit tool matched-pair back-test; cross-referenced against the original State Farm correspondence for claim 06-87G9-03K.', '2026-08-10T00:30:00Z'),
  ('case-heckethorn-negative-control', 'cases', 'Heckethorn — Settled Appraisal, Negative Control (Clean Pass)', '{"negative-control","appraisal","false-positive-guard","validation"}', '**The case:** A settled appraisal award, used specifically as a negative control to test whether the scope-audit tool over-flags on a claim that''s already been fully and correctly resolved.

**The result: the tool returned clean — no false positives.** This might look like a boring outcome compared to a big-dollar recovery case, but it''s just as important a validation result. A tool that finds money on every job it touches isn''t trustworthy — it''s just noisy. Heckethorn is the proof that the detection framework can correctly recognize "this claim is already complete" and stay quiet, rather than manufacturing a flag to justify its own existence.

**Directly validates the elevation-gated ice & water false-positive guard** (see Detection Framework, Tier 2 entry) — the broader design principle this case supports is that a scope audit needs negative controls in its validation set just as much as positive ones. Without a case like Heckethorn, there''s no way to know whether the tool''s hit rate reflects real detection skill or just aggressive over-flagging that happens to catch real misses along with a bunch of noise.

**Practical use going forward:** any appraisal-grade estimate that''s already been through a full settlement process is a candidate negative control — worth deliberately running back through the tool periodically as new detection rules get added, to make sure new logic doesn''t introduce new false positives on a claim that''s already known-correct.

**Source:** RSWE/BOS scope-audit tool Truth Set Validation tab, matched-pair back-tests.', '2026-08-10T00:30:00Z'),
  ('case-warren-nationwide-full-replacement', 'cases', 'Warren — Nationwide (Claim 872818-GQ) — Full Replacement Overturn', '{"nationwide","full-replacement","re-inspection","discontinued-material","rebuttal-win"}', '**The case:** Nationwide claim 872818-GQ, the "Warren" claim. Nationwide initially denied full roof replacement in favor of a repair-only or partial-replacement scope — a common carrier posture, but one this case shows is genuinely contestable with the right documentation.

**The rebuttal stacked four independent lines of evidence rather than leading with just one:**
1. Collateral hail damage confirmed on adjacent metal components tied into the roof system — independent proof of storm force beyond the shingles themselves.
2. A mat fracture argument — shingle mat fracturing (not just granule loss) as a functional damage indicator affecting the shingle''s structural water-shedding ability, not merely cosmetic wear.
3. Confirmed discontinued shingle color/line, meaning a repair-only scope would leave a visibly unmatched patch.
4. Documented hail-hit test-square counts showing damage density above the repair threshold.

**Outcome: denial overturned to full replacement, following a re-inspection.** Nationwide required the homeowner to explicitly consent to the second inspection before scheduling it — worth citing the policy''s Duties After Loss clause proactively if the carrier raises it, rather than waiting.

**Why this case is the template, not just a one-off win:** the four-part argument structure is exactly what''s captured as the reusable "Full Roof Replacement Denial — Overturn Template" in Scripts & Rebuttals. This case is the real, worked example behind that template — worth pointing to directly when explaining to a PM or new hire why the template asks for all four evidence types rather than just the strongest one.

**Source:** Nationwide claim correspondence, claim 872818-GQ, cross-referenced against the Carrier Playbook Nationwide entry.', '2026-08-10T00:30:00Z'),
  ('case-jagels-farmers-shingle-classification', 'cases', 'Scott Jagels — Farmers (Claim 7010190417-1) — Shingle Classification Trade-Off', '{"farmers","shingle-classification","itel","concede-vs-fight","quantity-supplement"}', '**The case:** Farmers Insurance Exchange, claim 7010190417-1, Scott Jagels. A Class 4 shingle designation was disputed by the adjuster on the grounds that the "sure nail strip" visible in photos appears on all Duration-line shingles generically, not just the Class 4 variant. The adjuster supplied an Owens Corning website screenshot as support and offered ITEL lab verification (sending a physical shingle sample for testing) if we wanted to contest it further.

**The decision: concede rather than fight, and here''s the actual reasoning that made it correct.** The job was already complete, and ITEL turnaround would have delayed the homeowner''s resolution with no guarantee of a different outcome — the reclassification down to standard Duration shingle (Class 3, product code "400S") was accepted rather than pursued through lab testing.

**The real lesson isn''t "always concede" — it''s about timing.** ITEL is a legitimate fallback Farmers will actually use, not a bluff, but it''s slow. The trade-off calculus flips entirely if shingle class is documented *before* tear-off — clear photos showing full packaging/branding (not just the nail strip, which this case shows is genuinely ambiguous evidence) at initial inspection would have made the classification unambiguous from the start, avoiding the whole dispute. Once the roof is off, a contested classification either gets conceded (as here) or goes through a real, slow ITEL process — there''s no faster third option at that point.

**Same claim also had two clean wins, worth noting for contrast:** a straightforward quantity supplement (+10.08 SQ for an uncounted 2-story section) was approved without pushback once the measurement report was attached, and the standard eaves drip-edge dispute (see the drip-edge rebuttal template in Scripts & Rebuttals) played out the same way it does on other Farmers claims. The shingle classification was the one genuinely hard call on this file — everything else was standard.

**Actionable takeaway for scoping going forward:** get shingle class photo-documented properly (full packaging/branding visible, not just the nail strip) at initial inspection, before tear-off — this is a cheap insurance policy against exactly the kind of dispute this case shows up as expensive and slow to resolve after the fact.

**Source:** Farmers Insurance Exchange correspondence, claim 7010190417-1, June 2026; cross-referenced against the Carrier Playbook Farmers shingle-classification entry.', '2026-08-10T00:30:00Z'),
  ('case-farmers-drip-edge-code-win', 'cases', 'Althea Thompson — Farmers (Claim 7010176180-1) — Drip Edge Code Reversal', '{"farmers","drip-edge","irc-code","rebuttal-win","worked-example"}', '**The case:** Farmers Insurance Exchange, claim 7010176180-1, adjuster Althea Thompson. Standard Farmers denial on eaves drip edge R&R — "installed correctly under the felt, no need to manipulate it" — citing IRC 905.2.8.5 (an application-method code section that''s actually correct on its own terms).

**The rebuttal didn''t dispute the cited code section — it invoked a different one that answers a different question.** IRC R908.3 (Re-covering vs. Replacement) requires that the existing roof covering and any materials secured to the deck, including drip edge, be removed as part of a full tear-off. The argument reframed the ask: not "the old drip edge was storm-damaged," but "this tear-off scope requires new drip edge by code, independent of the old drip edge''s condition."

**Outcome: the denial was reversed.** This is the real, worked example behind the "Drip Edge Eaves Rebuttal (IRC R908.3)" template in Scripts & Rebuttals and the corresponding IRC citation entry in Code & Manufacturer Requirements — worth pointing to directly as proof the argument actually works in practice, not just in theory.

**Why this case is worth keeping as a teaching example specifically:** it demonstrates the general principle that a carrier''s code citation and your code citation aren''t necessarily in conflict — they can be answering different questions entirely. The Farmers adjuster wasn''t wrong about 905.2.8.5; the win came from finding the section that actually governed the specific question at hand (what a tear-off requires) rather than the one the carrier had already anchored on (how drip edge is installed).

**Source:** Farmers Insurance Exchange, claim 7010176180-1, June 2026.', '2026-08-10T00:30:00Z'),
  ('state-eliminated-hostile', 'states', 'Eliminated States — Hostile Compliance Climate (Do Not Launch)', '{"texas","florida","iowa","oregon","louisiana","compliance-risk","do-not-launch"}', 'These five states have either active enforcement history or hostile legislative climate against contractor-side claim-assistance activity. Not workable-with-discipline like Missouri/Minnesota — genuinely eliminated for launch consideration.

**Texas** — settled hostile. The Texas Supreme Court upheld that negotiating claims or loss amounts is considered adjuster work requiring a license. This isn''t an open legal question there; it''s decided.

**Florida** — fines up to $10,000, with felony penalties for repeat violations. The financial and legal exposure here is categorically different from a civil-fine-only state.

**Iowa** — multiple cease-and-desist orders have actually been issued against roofers advertising claim-handling services. This is active enforcement, not just statutory risk on paper.

**Oregon** — expanded UPPA (Unauthorized Practice of Public Adjusting) language, broadening what counts as adjuster-only activity.

**Louisiana** — HB 121 would criminalize claim-assistance activity, up to $5,000 per violation. Even if the bill stalls or doesn''t pass in its current form, the legislative climate itself is the signal — a state actively drafting criminal penalties for this activity isn''t one to enter on the bet that the bill dies.

**Why these matter for BON specifically:** even though BON''s model is contractor-facing (documenting the contractor''s own scope, sold to the contractor, not representing the homeowner to the insurer), some of these states'' enforcement patterns target the activity itself — advertising or performing claim-handling-adjacent work — not just the specific business-model structure. That''s a meaningfully different risk profile than Missouri/Minnesota''s narrower "can''t represent the homeowner" prohibitions.

**Source:** BON go-to-market legal/compliance screening research.', '2026-08-07T23:55:00Z'),
  ('state-arkansas-caution', 'states', 'Arkansas — Total PA Ban, "Practice of Law" Framing', '{"arkansas","public-adjuster-ban","practice-of-law","caution-flag","expansion-later"}', '**Caution flag, not an outright elimination — but don''t launch here first.**

Arkansas has a total ban on public adjusters, and — more structurally significant — Arkansas defines the service public adjusters provide as the **practice of law**, meaning claim advocacy in that state is attorney-only territory. This is a narrower needle to thread for contractor-side scope documentation than in states that simply require a PA license (which BON''s model sidesteps by not representing the homeowner at all) — here, the underlying activity itself is characterized as legal practice, which raises the bar for how carefully any contractor-facing scope-documentation service needs to be worded and scoped.

**Why it''s still on the radar despite the ban:** Arkansas ranks #3 nationally in hail claims paid (~$231M), and the total PA ban creates real structural market differentiation — no dedicated competitor branding was found targeting this market, likely precisely because of the compliance complexity. That''s a real whitespace opportunity, not just a risk.

**Recommendation:** don''t launch in Arkansas first. Treat it as a possible expansion market later, with dedicated legal review of the specific "practice of law" boundary before any activity there — this isn''t a state to enter on the same general compliance posture that works in Missouri or Minnesota.

**Source:** BON go-to-market legal/compliance screening research.', '2026-08-07T23:55:00Z'),
  ('state-workable-with-discipline', 'states', 'Workable With Discipline — Missouri & Minnesota', '{"missouri","minnesota","uppa","contractor-rep-prohibition","scope-documentation"}', 'Both states prohibit a contractor from acting as the homeowner''s policyholder representative — but neither reaches BON''s actual model, which documents the **contractor''s own scope**, sold to the **contractor**, not the homeowner. The key distinction: these laws target contractor-as-homeowner''s-advocate, not contractor-hires-a-vendor-to-document-their-own-scope-of-work.

**Missouri:** prohibits residential contractors from representing their customers to their insurance companies. Real upside: this law is a tailwind, not just a risk — it scares contractors away from DIY supplementing (trying to argue the claim themselves) and makes a compliant third-party documentation service more valuable, not less. **The one real drawback:** carrier attorneys in Missouri actively use UPPA (Unauthorized Practice of [Public] Adjusting) arguments as a defense/pushback tactic — meaning any scripts, templates, or contractor-facing language used in this market need to be airtight on the "we document scope for the contractor, we do not represent the homeowner to the carrier" distinction. Sloppy language here is a real, actively-exploited vulnerability, not a theoretical one.

**Minnesota:** bars contractors from interpreting policy provisions or adjusting claims on behalf of the insured without a PA license. Same logic as Missouri — doesn''t reach BON''s model, and for the same reason (BON''s docs support the contractor''s own scope, not policy interpretation on the homeowner''s behalf).

**Practical takeaway for scripts and marketing copy in these two states specifically:** always frame the service as scope documentation for the contractor''s own work, never as claim advocacy or policy interpretation on the homeowner''s behalf — even in casual language, avoid phrasing that could read as "we''ll fight your insurance company for you" (which sounds like public adjusting) versus "we document what the repair actually requires" (which is scope documentation). This distinction should be reflexive in Missouri and Minnesota specifically, more than in low-friction states.

**Source:** BON go-to-market legal/compliance screening research.', '2026-08-07T23:55:00Z'),
  ('state-low-friction', 'states', 'Lowest Friction — Illinois, Wisconsin, Kansas, Nebraska', '{"illinois","wisconsin","kansas","nebraska","no-licensing","low-friction"}', 'All four states are on the list of states that **don''t license adjusters at all**, and none has the enforcement history seen in the eliminated states (Texas, Florida, Iowa, Oregon, Louisiana). This is the cleanest compliance tier available — worth prioritizing for expansion sequencing over Missouri/Minnesota (workable but requiring script discipline) or Arkansas (caution flag, legal review needed).

**Volume/frequency context, since compliance-friendliness alone doesn''t make a market good:**
- Illinois and Wisconsin both landed in State Farm''s top-5 states for hail claims paid in 2025 (Texas led at $1.4B, followed by Missouri, Illinois, Wisconsin, and Oklahoma).
- Nebraska sees roughly 534 hail events annually — the highest per-capita hail risk in the country.
- Kansas is consistently top-3 nationally in hail event count, and March 2026 storms alone generated 50,000+ claims across the Midwest, hitting Kansas, Missouri, Illinois, and Iowa.

**Data-integrity note worth remembering:** an earlier claim that Kansas restricts public adjusters to commercial claims only was traced back to an unreliable aggregator site and corrected after a direct-source check — Kansas actually does allow residential PA licensing. Worth a reminder to verify licensing-restriction claims against primary sources (state DOI sites, not aggregator roundups) before treating them as settled, since this exact kind of error is easy to propagate.

**Source:** BON go-to-market legal/compliance screening research, cross-referenced against 2025-2026 State Farm hail claims data.', '2026-08-07T23:55:00Z'),
  ('state-licensing-decision-ia-vs-pa', 'states', 'Licensing Decision: Independent Adjuster (IA) vs. Public Adjuster (PA)', '{"licensing","independent-adjuster","public-adjuster","compliance-strategy"}', '**Recommendation across every market analyzed: pursue an Independent Adjuster (IA) license, not a Public Adjuster (PA) license, for BON''s expansion model.**

**Why IA over PA:** an IA license gives carrier-side credibility and technical fluency — useful for marketing against competitors who lean on "we understand how carriers think" as a differentiator — without pulling the business into the obligations that come with PA licensure: homeowner-representation duties, fee caps, and contractor-compensation conflict-of-interest disclosures. Since BON''s actual model is contractor-facing (documenting the contractor''s own scope of work, sold to the contractor, not the homeowner), the IA license keeps the legal structure clean and matched to what the business actually does — it avoids triggering homeowner-representation rules that a PA license would carry, in states where that distinction matters (see Missouri/Minnesota entry — this is exactly the distinction those states'' contractor-rep prohibitions turn on).

**This decision compounds with the state-by-state screening above:** in a low-friction state (Illinois, Wisconsin, Kansas, Nebraska) the IA-vs-PA choice matters less since adjuster licensing isn''t required at all. In Missouri and Minnesota specifically, staying clearly on the IA/scope-documentation side of the line — rather than anything that reads as PA-style homeowner advocacy — is what keeps the business inside the "workable with discipline" category rather than drifting into the contractor-rep prohibition those states actually enforce.

**Source:** BON go-to-market legal/compliance screening research.', '2026-08-07T23:55:00Z'),
  ('state-colorado-home', 'states', 'Colorado — Home Base', '{"colorado","home-market","public-adjuster","crs-10-2-417"}', '**Colorado licenses public adjusters (C.R.S. 10-2-417) but does NOT license independent or company adjusters** — only public adjusters, who work solely for the public (the homeowner), are a licensed category here. There''s no separate independent-adjuster licensing regime to worry about.

**Why this matters for BON''s model specifically:** since BON operates as a contractor-side scope-documentation vendor — not representing the homeowner, not working on contingency against claim proceeds — the contractor-side framing keeps the business outside the licensed activity (public adjusting) in Colorado, provided two things hold: the flat-fee structure (never contingent on proceeds) and the carrier-communication rules (documenting the contractor''s scope of work, never claiming to represent what the homeowner is "owed"). Both of these are already locked into BON''s compliance boundary as standing policy — this is confirmation the compliance boundary is doing real legal work in the home market, not just good practice.

**Practical note:** this is home turf, but it''s still worth periodically reconfirming C.R.S. 10-2-417 hasn''t been amended — insurance regulation in fast-hail-growth states tends to get revisited as claim volume and contractor-side activity increase nationally (see the eliminated-states entry for how quickly other states have moved on this exact issue).

**Source:** BON go-to-market legal/compliance screening research.', '2026-08-10T00:00:00Z'),
  ('state-oklahoma-unresolved', 'states', 'Oklahoma — Primary Launch Market, Compliance Posture UNVERIFIED', '{"oklahoma","tulsa","primary-market","needs-verification","open-question"}', '**Flagging this honestly rather than filling the gap with a guess: Oklahoma''s specific regulatory posture on contractor-side claim assistance has not actually been verified, despite Tulsa being BON''s primary active launch market.** This came up directly in a recent conversation — Colorado''s rule was confirmed (see the Colorado entry: PA-only licensing, no independent/company adjuster license, C.R.S. 10-2-417), but Oklahoma was explicitly noted as "may have different rules — needs actual verification before it''s a real option, not a hypothetical one." That verification hasn''t happened yet as of this entry.

**Why this is worth closing out soon, not just noting:** every other state in this Notes category was screened against the same three questions before any launch activity — does it license adjusters at all, does it prohibit contractor-as-policyholder-rep, and is there active enforcement history. Oklahoma is the one live, revenue-generating market where that screening was never actually completed. Given BON is actively operating there right now (the 38-contractor Tulsa call sheet, live outreach cadence, VGR''s commission work), this is the highest-priority verification gap in the entire compliance picture — not a low-stakes theoretical state like the ones screened for future expansion.

**What to actually check, specifically:**
- Does Oklahoma license public adjusters, independent adjusters, or both? (Colorado, for comparison, only licenses PAs — that''s not a safe assumption to carry over to Oklahoma.)
- Is there an Oklahoma statute or Department of Insurance rule analogous to Missouri''s or Minnesota''s contractor-as-policyholder-rep prohibition?
- Any enforcement history — cease-and-desist orders, DOI actions — against contractors or third-party vendors doing claim-assistance-adjacent work in Oklahoma specifically?
- Does BON''s existing compliance boundary (flat fee, no contingency, contractor''s-scope-not-homeowner''s-claim framing) hold up the same way it does in Colorado, or does Oklahoma law draw the line differently?

**Source:** flagged directly in a recent BON strategy conversation (Aug 2026) as an open, unresolved item — this entry exists to make sure it doesn''t stay silently unresolved just because it''s the market already being worked.', '2026-08-10T00:00:00Z'),
  ('encyclopedia-how-to-use-and-master-rule', 'roofing-encyclopedia-m1', 'How to Use the Encyclopedia + Master Rule', '{"framework","master-rule","how-to-use"}', 'Each line-item entry in this encyclopedia follows the same six-question framework: **What is it? When does it apply? What should I look for? What documentation do I need? What does the carrier commonly say? What should BON do next?** This prevents a specialist from simply memorizing line items — the goal is to teach recognition of **scope gaps**, not recitation of a list.

**MASTER RULE — never add a line item just because it exists in the encyclopedia.** The encyclopedia tells you what to investigate. The claim determines whether it belongs in the supplement.', now()),
  ('encyclopedia-roofing-material', 'roofing-encyclopedia-m1', 'Roofing Material', '{"roof-covering","material","shingles"}', '**What is it?** The primary roofing covering installed on the structure — 3-tab asphalt shingles, architectural shingles, designer/luxury shingles, metal roofing, tile, wood shakes, or other specialty roofing.

**When does it apply?** Whenever the roof covering is being repaired or replaced.

**What should I look for?** Compare the carrier estimate with the actual property. Check:
- Material type
- Manufacturer
- Product line
- Color
- Number of roof sections
- Quantity
- Replacement material specified by contractor

**Red flag:** carrier estimate says 3-tab but the property has architectural shingles (or another roofing system).

**Documentation:** close-up photos, product markings when visible, contractor inspection, existing shingle photos, manufacturer information when available.

**What does the carrier commonly say?** "The roof was estimated using the information available during the inspection."

**What should BON do next?** Determine whether the documentation establishes the actual roofing material. If it does, submit the corrected scope with supporting evidence.

**BON check:** is the carrier estimating the roof that actually exists?', now()),
  ('encyclopedia-additional-roofing-layer', 'roofing-encyclopedia-m1', 'Additional Roofing Layer (Multiple Layers)', '{"multiple-layers","tear-off"}', '**What is it?** An existing roof may contain more than one layer of roofing material.

**When does it apply?** When actual conditions demonstrate that additional roofing layers exist and removal is required.

**What should I look for?**
- Evidence of multiple layers
- Edge visibility
- Existing roof condition
- Tear-off documentation
- Contractor inspection findings

**Documentation:** tear-off photos, edge photos, inspection documentation, jobsite photos showing layers.

**What does the carrier commonly say?** "The original inspection did not identify multiple layers."

**What should BON do next?** Provide documentation showing the actual condition.

**BON warning:** do not assume multiple layers simply because an older roof exists. Verify.', now()),
  ('encyclopedia-roofing-tear-off', 'roofing-encyclopedia-m1', 'Roofing Tear-Off', '{"tear-off","removal"}', '**What is it?** Removal of existing roofing material before installation of the new roof.

**When does it apply?** When the approved repair/replacement requires removal of existing material.

**What should I look for?** Compare existing layers vs. carrier allowance vs. actual removal required:
- Number of layers
- Roofing type
- Quantity
- Underlayment removal
- Specialty materials
- Additional labor

**Documentation:** photos, measurements, tear-off documentation.

**Common miss:** carrier includes removal of one layer when two layers actually require removal.', now()),
  ('encyclopedia-roof-waste', 'roofing-encyclopedia-m1', 'Roof Waste / Material Overage', '{"waste","material-overage"}', '**What is it?** Additional material required because roofing materials cannot be installed with zero waste — roof geometry affects material consumption.

**What should I look for?** Complex roofs may include multiple valleys, hips, rakes, small roof sections, dormers, numerous penetrations, and complex cuts.

**Important:** waste should be evaluated using the estimating methodology and actual roof configuration.

**BON check:** does the carrier''s material quantity reasonably correspond to the measured roof and its configuration?

**Red flag:** never simply increase waste because "the contractor needs more shingles." There must be a defensible basis.', now()),
  ('encyclopedia-underlayment', 'roofing-encyclopedia-m1', 'Underlayment (Synthetic / Felt)', '{"underlayment","synthetic","felt"}', '**What is it?** A protective layer installed beneath the roof covering.

**Review:**
- Existing material
- Required replacement
- Material type
- Quantity
- Installation requirements

**Questions to answer:** Is underlayment already included? Is the quantity sufficient? Does the actual roofing system require a different installation?

**Documentation:** photos, measurements, manufacturer instructions, applicable code documentation.', now()),
  ('encyclopedia-ice-water-barrier', 'roofing-encyclopedia-m1', 'Ice & Water Barrier', '{"ice-and-water","membrane","code"}', '**What is it?** A water-resistant membrane used in specified areas of a roof system.

**When to investigate:** eaves, valleys, roof/wall intersections, penetrations, and other applicable areas.

**Questions:**
- Is it included?
- Is the quantity accurate?
- Does applicable code require it?
- Does manufacturer installation require it?
- Does the property''s configuration trigger additional installation?

**Documentation:** applicable code, jurisdiction requirements, manufacturer instructions, measurements, photos.

**Carrier objection:** "Not required."

**What should BON do next?** Don''t argue — identify the specific requirement and provide the documentation.', now()),
  ('encyclopedia-drip-edge', 'roofing-encyclopedia-m1', 'Drip Edge', '{"drip-edge","flashing","code"}', '**What is it?** Metal edge flashing installed along applicable roof edges.

**Where to look:** eaves, rakes.

**Questions:**
- Is drip edge present?
- Is it included?
- Is the quantity correct?
- Is removal required?
- Is replacement required?
- Does applicable code or installation requirement apply?

**Documentation:** photograph the eave edge, rake edge, existing drip edge, and areas where it is absent. Obtain measurements.

**Common carrier response:** "Drip edge is included in the roofing system."

**What should BON do next?** Determine whether the carrier''s existing line item actually includes the required operation and quantity. Don''t assume a generic roofing line automatically accounts for every accessory.', now()),
  ('encyclopedia-valleys', 'roofing-encyclopedia-m1', 'Valley Material / Valley Work', '{"valleys","roof-geometry"}', '**What is it?** The roof area where two roof planes meet.

**What to look for:**
- Valley count
- Valley length
- Valley type
- Existing treatment
- Replacement method
- Required underlayment/protection

**Documentation:** photograph every valley; measure where appropriate.

**Common miss:** the roof area is included, but the estimate does not adequately reflect the required valley operation.

**BON question:** what exactly is required to rebuild this valley as part of the approved roof replacement?', now()),
  ('encyclopedia-ridge-cap', 'roofing-encyclopedia-m1', 'Ridge Cap', '{"ridge-cap","ridge"}', '**What is it?** Material installed over the roof ridge.

**Check:**
- Ridge length
- Existing material
- Replacement material
- Manufacturer requirements
- Quantity

**Common miss:** carrier estimate may use a generic roofing material while the actual roofing system requires a dedicated ridge-cap product or installation method.

**Documentation:** photos, measurements, product/manufacturer information.', now()),
  ('encyclopedia-hip-cap', 'roofing-encyclopedia-m1', 'Hip Cap', '{"hip","ridge"}', '**What is it?** Roofing material installed over hip lines.

**Check:**
- Hip length
- Existing configuration
- Replacement material
- Quantity

**BON question:** is the carrier estimate properly accounting for the hip installation?', now()),
  ('encyclopedia-pipe-penetrations', 'roofing-encyclopedia-m1', 'Plumbing Vent / Pipe Flashing', '{"pipe-flashing","penetrations","plumbing-vent"}', '**What is it?** Roof penetrations that require flashing and weatherproofing.

**Count them — don''t estimate from memory.** Physically count:
- Pipe vents
- Flashing assemblies
- Specialty penetrations

**Check:**
- Quantity
- Condition
- Material
- Included in estimate?
- Replacement required?

**Documentation:** photograph each penetration.

**Common miss:** the roof is being replaced but required penetration components aren''t adequately addressed.', now()),
  ('encyclopedia-ventilation', 'roofing-encyclopedia-m1', 'Roof Vents / Ventilation', '{"ventilation","vents"}', '**Look for:** ridge vents, box vents, turbine vents, intake vents, soffit ventilation, gable vents.

**Questions:** What exists today? What is being removed? What is being installed? Is the proposed roofing system compatible with the existing ventilation? Is a different configuration required?

**Warning:** do not automatically supplement ventilation simply because vents exist. Determine the actual requirement.', now()),
  ('encyclopedia-step-flashing', 'roofing-encyclopedia-m1', 'Step Flashing', '{"step-flashing","flashing"}', '**Look for:** roof/wall intersections, sidewalls, dormers, additions.

**Question:** can the roofing work be completed while leaving the existing flashing in place? If not, investigate detach/reset, remove/replace, and additional labor.

**Documentation:** photograph the affected areas.', now()),
  ('encyclopedia-wall-flashing', 'roofing-encyclopedia-m1', 'Headwall / Sidewall Flashing', '{"wall-flashing","headwall","sidewall"}', '**Review:**
- Location
- Existing condition
- Installation method
- Required removal
- Required replacement

**BON rule:** do not treat all flashing as the same operation. Identify what type of flashing exists and what the roofing work requires.', now()),
  ('encyclopedia-chimney-flashing', 'roofing-encyclopedia-m1', 'Chimney Flashing', '{"chimney","flashing"}', '**Review:** step flashing, counterflashing, apron flashing, cricket/saddle where applicable, masonry interface, existing condition.

**Documentation:** photograph all four sides of the chimney when accessible.

**Common miss:** only the roof field is estimated while the chimney-related roofing operations are incomplete.', now()),
  ('encyclopedia-skylights', 'roofing-encyclopedia-m1', 'Skylights', '{"skylights"}', '**Review:** number, size, existing condition, flashing, detach/reset, replacement, interior impact.

**Key question:** what must happen to the skylight for the roof work to be completed properly? Document the answer.', now()),
  ('encyclopedia-detach-reset', 'roofing-encyclopedia-m1', 'Detach & Reset — the D&R Test', '{"detach-and-reset","solar","gutters","satellite"}', 'For every item attached to or interfering with the roof, ask:
1. Is it physically in the way?
2. Can the roofing work be completed without removing it?
3. Does removal create additional labor?
4. Does reinstallation require additional labor/material?
5. Is replacement necessary instead?

**Common items:** satellite, solar, gutters, downspouts, exterior fixtures, specialty equipment, other attached components.

**Documentation:** photograph the item in relation to the roof — a close-up alone may not establish why D&R is necessary.', now()),
  ('encyclopedia-gutters', 'roofing-encyclopedia-m1', 'Gutters', '{"gutters"}', '**Review:** length, location, condition, gutter guards, attachment method, interference with roof work.

**Questions:** Does the gutter interfere with installation? Must it be removed? Can it be reset? Is it damaged? Is replacement actually necessary?

Document the specific condition.', now()),
  ('encyclopedia-gutter-guards', 'roofing-encyclopedia-m1', 'Gutter Guards', '{"gutter-guards"}', '**Review:** type, quantity, attachment, removal requirement, reset requirement, replacement condition.

**BON warning:** do not automatically add gutter-guard removal/reset. Verify that the roofing operation actually requires it.', now()),
  ('encyclopedia-fascia', 'roofing-encyclopedia-m1', 'Fascia', '{"fascia"}', '**Look for:** existing damage, roof-edge condition, rot, detachment, replacement requirement, interaction with gutters.

**Documentation:** photographs that establish condition, location, and extent.', now()),
  ('encyclopedia-soffit', 'roofing-encyclopedia-m1', 'Soffit', '{"soffit"}', '**Review:** damage, ventilation, access, removal, replacement.

**BON question:** is the soffit being affected by the roof work, or is this a separate damage issue? Do not mix unrelated scope into the roofing supplement.', now()),
  ('encyclopedia-permits', 'roofing-encyclopedia-m1', 'Permits', '{"permits"}', '**Review:** is a permit required? Who obtains it? What does it cost? Is it already included? Is documentation available?

**Documentation:** use official jurisdiction information whenever possible.', now()),
  ('encyclopedia-code-required-work', 'roofing-encyclopedia-m1', 'Code-Required Work — the BON Code Test', '{"code","irc","jurisdiction"}', 'Never submit "Code requires X" without answering: **What code? What jurisdiction? What condition triggers it? What work is required? What additional cost results?**

**Documentation:** keep the applicable code source in the claim file.', now()),
  ('encyclopedia-manufacturer-requirements', 'roofing-encyclopedia-m1', 'Manufacturer Requirements', '{"manufacturer","installation-instructions"}', '**Investigate when** the installation requirements of the actual roofing product may affect scope.

**Check:** product, manufacturer, installation instructions, accessories, fastening, underlayment, flashing, ventilation.

**BON rule:** if manufacturer requirements are being used to justify scope, save the documentation.', now()),
  ('encyclopedia-steep-roof', 'roofing-encyclopedia-m1', 'Steep Roof', '{"steep-charge","pitch","labor"}', '**Review:** actual pitch, areas affected, carrier allowance, applicable estimating treatment.

**Documentation:** measurements, photos, roof report.

**Warning:** do not apply steep charges simply because the roof "looks steep." Verify the pitch and applicable estimating rules.', now()),
  ('encyclopedia-high-roof-multi-story', 'roofing-encyclopedia-m1', 'High Roof / Multi-Story', '{"multi-story","access","labor"}', '**Look for:** two-story elevations, three-story conditions, difficult access, equipment requirements, labor implications.

**Documentation:** photograph the structure from a perspective that demonstrates the height/access issue.', now()),
  ('encyclopedia-material-handling-access', 'roofing-encyclopedia-m1', 'Material Handling / Access', '{"access","staging","labor"}', '**Review:** long carries, restricted access, difficult staging, specialty equipment, limited material access.

**Key question:** is this condition actually creating an additional estimating operation? Document the condition before requesting the operation.', now()),
  ('encyclopedia-disposal', 'roofing-encyclopedia-m1', 'Disposal', '{"disposal","hauling"}', '**Review:** material quantity, number of layers, tear-off volume, disposal requirements, hauling conditions.

**BON rule:** disposal should reconcile with the actual tear-off scope. If the tear-off increases, determine whether disposal is also affected. Avoid double counting.', now()),
  ('encyclopedia-tax', 'roofing-encyclopedia-m1', 'Tax', '{"tax"}', 'Review whether applicable sales tax is properly reflected in the estimate based on the claim, jurisdiction, and estimating methodology. Don''t assume — verify.', now()),
  ('encyclopedia-overhead-profit', 'roofing-encyclopedia-m1', 'Overhead & Profit', '{"overhead-and-profit","op","multi-trade"}', 'O&P is not an automatic add-on. Evaluate: number of trades, project complexity, coordination, general contractor responsibilities, and applicable estimating/claim practices. Document the basis.', now()),
  ('encyclopedia-decision-framework', 'roofing-encyclopedia-m1', 'Decision Framework — Decision Tree, Stop Rule & Adjuster Test', '{"decision-tree","stop-rule","adjuster-test","master-checklist","framework"}', '**The BON Line-Item Decision Tree** — for every potential supplement, work through in order: (1) Is it actually required? No → don''t supplement. (2) Is it already included? Yes → verify quantity/scope. (3) Can we prove it? No → gather documentation. (4) Is the quantity correct? No → verify measurements. (5) Is the estimating treatment appropriate? No → research. (6) Is the price appropriate? No → research. (7) Submit with documentation.

**The BON "Stop" Rule** — a specialist should STOP before submitting if: they cannot explain why the item is necessary; they cannot document the condition; they don''t know whether it is already included; the quantity hasn''t been verified; the code requirement hasn''t been verified; the manufacturer requirement hasn''t been verified; they are relying solely on the contractor''s statement; or they are unsure whether the item is duplicative. Uncertainty is a reason to investigate — not a reason to submit.

**The BON "Think Like the Adjuster" Test** — before submission, pretend you are the adjuster receiving a $2,400 supplement request. Ask "Why?" Then look at the package: can you immediately determine WHAT → WHY → WHERE → HOW MUCH → PROOF? If not, the supplement needs more work.

**Master Field Checklist** — Roof: material, layers, tear-off, waste, underlayment, ice & water, drip edge, valleys, ridge, hip, pipe penetrations, vents, flashing, chimney, skylights. Exterior: gutters, gutter guards, downspouts, fascia, soffit, siding, trim. Conditions: steep, high, access, staging, material handling, disposal. Requirements: code, manufacturer, permit. Final: quantity verified, existing scope checked, documentation attached, estimate accurate, narrative accurate, QA complete.

**BON Principle:** a line item is not a supplement opportunity. A documented scope difference is.', now());
