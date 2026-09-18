-- Migrates the standalone Supplement Guide page's reference content
-- (BON SUPPLEMENT SPECIALIST - How to Do Supplements) into the Knowledge
-- Base as one click-to-expand entry per section, matching the KB's
-- existing click-to-expand pattern instead of a separate "read it like a
-- book" page. Generated programmatically from the same GUIDE_SECTIONS/
-- CHECKLISTS data the page itself rendered, so the wording is unchanged.
--
-- The 21 per-supplement checklists (intake-documents, estimate-review-
-- checklist, etc.) stay real, interactive, database-backed checklists on
-- each actual supplement via SupplementChecklists.jsx - untouched by this
-- migration. What's added here is the reference material itself (every
-- checklist's item text is included, but as read-only reference text, not
-- a duplicate interactive copy).

insert into kb_categories (id, label, description, sort_order) values
  ('supplement-process', 'How To Do a Supplement (Step-by-Step)', 'BON''s internal training/SOP manual for working a supplement from intake through close, in order - read it top to bottom once, then use it as a reference.', 9)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into kb_entries (id, category_id, title, tags, body) values
  ('supplement-process-mission', 'supplement-process', '1. The BON Supplement Mission', '{"supplement-process","mission"}', 'A supplement is not simply a request for "more money."

**The original estimate does not accurately reflect the documented scope, materials, labor, or requirements necessary to complete the covered work.**

The BON Supplement Specialist''s job is to:

- 1. Understand what happened at the property.
- 2. Understand what the insurance carrier originally allowed.
- 3. Determine what is actually required to complete the work.
- 4. Identify legitimate differences between the two.
- 5. Support those differences with documentation.
- 6. Price the missing scope accurately.
- 7. Submit a professional, easy-to-review supplement.
- 8. Track the claim through resolution.
- 9. Document every decision and communication.

**The BON Standard.** Don''t supplement because an item can be supplemented. Supplement because the documentation supports the additional scope.'),
  ('supplement-process-process-overview', 'supplement-process', '2. The Supplement Process at a Glance', '{"supplement-process","process-overview"}', 'Every supplement follows this basic workflow:

- Intake
- Review
- Inspect
- Identify
- Document
- Price
- Write
- Submit
- Track
- Respond
- Resolve
- Close

Standard BON timeline (internal service targets, not promises regarding carrier response times):

- **Intake & File Setup** — Target: 0-24 hours
- **Initial Claim Review** — Target: Within 24 hours
- **Deep Line-Item Review** — Target: 1-2 business days
- **Supplement Preparation** — Target: 1-2 business days after documentation is complete
- **Submission** — Target: Same day as completion
- **Carrier Follow-Up** — Target: According to carrier timeline
- **Revision / Negotiation** — Target: As needed
- **Final Approval / Resolution** — Target: Track until complete'),
  ('supplement-process-step-1-intake', 'supplement-process', '3. Step One — Intake the File', '{"supplement-process","step-1-intake"}', 'Objective: get everything needed to understand the claim before beginning the supplement.

**Checklist — Intake — Documents to Request/Locate:**

- Homeowner information
- Property address
- Insurance carrier
- Claim number
- Date of loss
- Policy information when available
- Original carrier estimate
- Contractor estimate
- Photos
- Inspection report
- Roof measurements
- Exterior measurements
- Scope of work
- Previous supplements
- Carrier correspondence
- Denial letters
- Partial approvals
- Depreciation information when relevant
- Invoices or receipts when relevant
- Required permits
- Local building/code information when applicable
- Manufacturer documentation when applicable

Create the BON file using a standardized folder structure:

- 1. Claim Information
- 2. Carrier Estimate
- 3. Contractor Estimate
- 4. Photos
- 5. Measurements
- 6. Supplement
- 7. Carrier Correspondence
- 8. Documentation / Evidence
- 9. Approval / Final
- 10. Notes'),
  ('supplement-process-step-2-understand', 'supplement-process', '4. Step Two — Understand the Claim', '{"supplement-process","step-2-understand"}', 'Before looking for supplement items, understand the claim.

**Checklist — Understand the Claim — Questions to Answer:**

- What is the date of loss?
- What caused the damage?
- What areas are claimed?
- What did the carrier inspect?
- What did the carrier approve?
- What did the carrier deny?
- What did the contractor inspect?
- Are there differences between the inspections?

Scope questions - ask:

**What does the carrier think needs to be done?**

Then ask:

**What does the contractor actually need to do to complete the job?**

**Where opportunities live.** The difference between those two answers is where supplement opportunities may exist.'),
  ('supplement-process-step-3-review-estimate', 'supplement-process', '5. Step Three — Review the Carrier Estimate', '{"supplement-process","step-3-review-estimate"}', '**Do not skip this.** Do not immediately start writing a supplement. First, read the estimate from beginning to end.

**Checklist — Carrier Estimate Review — What to Look For:**

- Missing trades
- Missing elevations
- Missing roof sections
- Missing quantities
- Incorrect quantities
- Incorrect materials
- Missing labor
- Missing tear-off
- Missing disposal
- Missing accessories
- Missing code-required work
- Missing manufacturer requirements
- Missing preparation
- Missing installation requirements
- Incorrect waste
- Incorrect unit pricing
- Incorrect labor assumptions
- Missing equipment
- Missing permits
- Missing detach/reset items
- Missing interior damage
- Missing siding/gutter/fascia/soffit work
- Missing painting
- Missing drywall
- Missing contents or protection
- Incorrect depreciation treatment
- Scope items overlooked during the original inspection'),
  ('supplement-process-step-4-line-item-review', 'supplement-process', '6. Step Four — Perform the Line-Item Review', '{"supplement-process","step-4-line-item-review"}', '**One of the most important BON skills.** Review the estimate line by line.

**Checklist — Line-Item Review — Ask for Every Line:**

- Is it actually required?
- Is the quantity correct? (compare vs. roof report, measurements, photos, contractor measurements, site inspection)
- Is the correct material included?
- Is the correct labor included?
- Are supporting operations included? (detach, reset, remove, replace, prep, flash, seal, prime, paint, dispose, haul, protect, clean)
- Is something required that isn''t listed at all?

**Biggest opportunities.** Something required that isn''t listed at all is often where the biggest supplement opportunities are found.'),
  ('supplement-process-step-5-opportunity-list', 'supplement-process', '7. Step Five — Build the Supplement Opportunity List', '{"supplement-process","step-5-opportunity-list"}', 'Create a working list before writing the supplement.

- **Starter** — Carrier Allowed: No, Required: Yes, Difference: Missing, Documentation: Photos / estimate
- **Drip edge** — Carrier Allowed: Partial, Required: Full, Difference: Quantity, Documentation: Photos
- **Pipe flashing** — Carrier Allowed: No, Required: Yes, Difference: Missing, Documentation: Photos
- **Permit** — Carrier Allowed: No, Required: Yes, Difference: Missing, Documentation: Building department
- **Steep charge** — Carrier Allowed: No, Required: Yes, Difference: Missing, Documentation: Measurements
- **Code item** — Carrier Allowed: No, Required: Yes, Difference: Missing, Documentation: Code documentation

Every potential supplement item should answer:

**Why should this item be added?**

**If you cannot answer that.** If the answer cannot be clearly documented, stop and investigate before adding it.'),
  ('supplement-process-step-6-classify', 'supplement-process', '8. Step Six — Classify Each Supplement Item', '{"supplement-process","step-6-classify"}', 'BON uses three priority levels.

- PRIORITY 1 — Critical: items that can prevent the contractor from properly completing the work or materially affect the scope. Examples: missing required scope, structural issues, code-required work, incorrect material assumptions, major quantity discrepancies, missing required components.
- PRIORITY 2 — Significant: items that materially affect the cost of completing the approved scope. Examples: missing accessories, incorrect quantities, additional labor, detach/reset, additional preparation, additional disposal.
- PRIORITY 3 — Documentation / Financial: items that should be addressed but generally do not prevent work from proceeding. Examples: pricing discrepancies, administrative documentation, certain permit costs, minor missed operations, supporting documentation.

**Priority is not legitimacy.** Priority does not determine whether an item is legitimate. It determines how urgently BON should resolve the issue.'),
  ('supplement-process-step-7-verify-condition', 'supplement-process', '9. Step Seven — Verify the Physical Condition', '{"supplement-process","step-7-verify-condition"}', '**Never assume.** Never rely solely on the original estimate. Use photographs and inspection documentation to verify the actual property condition.

**Checklist — Photos Should Demonstrate:**

- Damage
- Existing materials
- Missing components
- Configuration
- Access issues
- Roof pitch
- Elevations
- Quantity
- Obstructions
- Specialty conditions
- Code-related conditions when visible
- Detach/reset requirements
- Pre-existing conditions when relevant

Photo rule - a photo should answer:

**What am I looking at, and why does it matter?**

**Organized evidence, not a photo dump.** Avoid submitting hundreds of random photographs. BON should submit organized evidence.'),
  ('supplement-process-step-8-verify-quantities', 'supplement-process', '10. Step Eight — Verify Quantities', '{"supplement-process","step-8-verify-quantities"}', 'Quantities are one of the easiest areas to challenge and one of the easiest areas to get wrong. Compare carrier estimate against actual measurements, against photos, against contractor scope.

**Checklist — Quantities to Verify (Carrier Estimate vs. Measurements vs. Photos vs. Contractor Scope):**

- Roofing squares
- Ridge
- Hip
- Valleys
- Eave
- Rake
- Drip edge
- Pipe penetrations
- Vents
- Skylights
- Chimneys
- Gutters
- Downspouts
- Siding
- Fascia
- Soffit

**BON Rule.** Never increase a quantity simply because the contractor says it is higher. Document the reason for the difference.'),
  ('supplement-process-step-9-code', 'supplement-process', '11. Step Nine — Check Code Requirements', '{"supplement-process","step-9-code"}', 'Code-related supplements require special care. Do not simply write:

**"Code requires this."**

Determine:

**Checklist — Code Requirements — Determine:**

- What requirement applies?
- What jurisdiction applies?
- What code provision supports the requirement?
- Does the requirement apply to this specific property/project?
- Is there documentation available?
- Is the requirement triggered by the work being performed?
- What additional cost results?

Documentation may include: applicable code section, building department information, permit requirements, jurisdiction documentation, manufacturer installation requirements, official correspondence, other reliable supporting documentation.

**Never.** Never invent or exaggerate a code requirement.'),
  ('supplement-process-step-10-manufacturer', 'supplement-process', '12. Step Ten — Check Manufacturer Requirements', '{"supplement-process","step-10-manufacturer"}', 'Sometimes the issue isn''t the building code. It may be the manufacturer''s installation requirements. Verify:

**Checklist — Manufacturer Requirements — Verify:**

- Installation instructions
- Product requirements
- Required accessories
- Underlayment
- Flashing
- Ventilation
- Fastening requirements
- Compatibility requirements
- Warranty requirements

If a manufacturer''s requirement materially changes the scope, document it.'),
  ('supplement-process-step-11-detach-reset', 'supplement-process', '13. Step Eleven — Check for Detach & Reset', '{"supplement-process","step-11-detach-reset"}', 'One of the most commonly missed areas is the work necessary to temporarily remove and reinstall existing components. Look for:

**Checklist — Detach & Reset — Look For:**

- Satellite dishes
- Solar equipment
- Gutters
- Downspouts
- Flashing
- Exterior fixtures
- Fencing
- HVAC components
- Accessories
- Specialty equipment

Ask:

**Can the contractor perform the approved work without removing this item?**

If not, ask what operation is required, and document it.'),
  ('supplement-process-step-12-access-labor', 'supplement-process', '14. Step Twelve — Check Access, Labor & Difficulty', '{"supplement-process","step-12-access-labor"}', 'The original estimate may assume standard conditions. Look for:

**Checklist — Access, Labor & Difficulty — Look For:**

- Steep roof
- Multiple roof levels
- Limited access
- Long material carries
- Difficult staging
- Specialty equipment
- Additional protection
- Difficult tear-off
- Multi-story conditions
- Restricted access
- Additional labor requirements

**Again.** Document the condition before requesting the additional cost.'),
  ('supplement-process-step-13-pricing', 'supplement-process', '15. Step Thirteen — Review Pricing', '{"supplement-process","step-13-pricing"}', 'Once scope is established, review pricing. The question is not "Can we charge more?" The question is:

**What is the appropriate cost for the documented scope?**

**Checklist — Pricing Review:**

- Applicable estimating database pricing
- Labor
- Material
- Equipment
- Waste
- Disposal
- Overhead and profit where applicable
- Tax where applicable
- Local conditions
- Specialty operations

**Keep these separate.** Keep scope disputes separate from pricing disputes. A carrier may agree the work is necessary but disagree with the price - that becomes a pricing discussion, not a scope discussion.'),
  ('supplement-process-step-14-build-scope', 'supplement-process', '16. Step Fourteen — Build the Xactimate Scope', '{"supplement-process","step-14-build-scope"}', 'Build the supplement in a clean, organized manner.

**Checklist — Xactimate Quality Standards:**

- Uses appropriate line items
- Uses accurate quantities
- Includes appropriate labor
- Includes applicable material
- Avoids duplicate charges
- Clearly identifies added scope
- Matches supporting documentation
- Is internally consistent
- Is easy for an adjuster to audit

Before submission, perform a second review and ask:

**If someone who has never seen this claim opened this estimate, would they understand exactly what we are requesting?**

If not, improve it.'),
  ('supplement-process-step-15-narrative', 'supplement-process', '17. Step Fifteen — Write the Supplement Narrative', '{"supplement-process","step-15-narrative"}', 'The narrative should make the adjuster''s job easier. For each item explain:

- WHAT — What additional work/material is being requested?
- WHY — Why is it necessary?
- WHERE — Where does it occur?
- EVIDENCE — What documentation supports it?
- COST — Where is the additional cost reflected?

Example — Item: Drip Edge. Carrier Estimate: Not included. Requested: Add drip edge to applicable roof perimeter. Reason: Existing conditions and installation requirements require drip edge at the roof perimeter. Documentation: Site photographs and roof measurements attached. Estimate: Added as applicable Xactimate line item.'),
  ('supplement-process-step-16-package', 'supplement-process', '18. Step Sixteen — Create the Supplement Package', '{"supplement-process","step-16-package"}', 'The supplement should be packaged professionally, in this order:

- 1. Cover letter / supplement summary
- 2. Supplemental estimate
- 3. Original carrier estimate
- 4. Contractor estimate
- 5. Photographs
- 6. Measurements
- 7. Code documentation
- 8. Manufacturer documentation
- 9. Receipts / invoices when applicable
- 10. Other supporting documents

**The goal.** Make the adjuster''s review fast and obvious.'),
  ('supplement-process-step-17-submit', 'supplement-process', '19. Step Seventeen — Submit', '{"supplement-process","step-17-submit"}', 'Before submitting, verify:

**Checklist — Before Submitting — Claim Information:**

- Correct insured
- Correct address
- Correct claim number
- Correct date of loss
- Correct carrier

**Checklist — Before Submitting — Scope:**

- Every requested item is supported
- Quantities are verified
- Photos support the request
- No duplicate line items
- Code items documented
- Manufacturer items documented
- Pricing reviewed

**Checklist — Before Submitting — Package:**

- Estimate attached
- Photos attached
- Supporting documents attached
- Narrative included
- File naming standardized'),
  ('supplement-process-step-18-log', 'supplement-process', '20. Step Eighteen — Log the Submission', '{"supplement-process","step-18-log"}', '**Every supplement must be tracked.** Record the following for every submission:

- Date submitted
- Submitted to
- Method of submission
- Claim number
- Amount requested
- Items requested
- Supporting documentation
- Expected response date
- Follow-up date
- Carrier response
- Amount approved
- Amount denied
- Remaining disputed items'),
  ('supplement-process-step-19-followup', 'supplement-process', '21. Step Nineteen — Follow Up', '{"supplement-process","step-19-followup"}', 'Never assume:

**"No response means they''re working on it."**

Follow up according to the BON tracking schedule and carrier process. Every follow-up should be documented as: DATE → PERSON → METHOD → RESULT → NEXT ACTION.

**8/12 — Email sent to adjuster requesting status on supplement submitted 8/5. No response. Follow up scheduled 8/15.**'),
  ('supplement-process-step-20-review-response', 'supplement-process', '22. Step Twenty — Review the Carrier Response', '{"supplement-process","step-20-review-response"}', '**Don''t just mark it Approved or Denied.** Break the response down item by item.

- **Drip edge** — Requested: $450, Carrier Decision: Approved, Approved: $450, Denied: $0, Next Action: Close
- **Permit** — Requested: $275, Carrier Decision: Denied, Approved: $0, Denied: $275, Next Action: Review
- **Flashing** — Requested: $650, Carrier Decision: Partial, Approved: $300, Denied: $350, Next Action: Rebuttal

**Why this matters.** This prevents money from being lost inside a generic "denied" response.'),
  ('supplement-process-step-21-denials', 'supplement-process', '23. Step Twenty-One — Handle Denials', '{"supplement-process","step-21-denials"}', 'A denial is not necessarily the end of the conversation. First determine why the carrier denied the item. Common reasons include:

- Not covered
- Not observed
- Not required
- Already included
- Pricing disagreement
- Quantity disagreement
- Code disagreement
- Documentation insufficient
- Depreciation issue
- Policy limitation
- Duplicate item

BON response process:

- 1. Identify the reason.
- 2. Determine whether the denial is valid.
- 3. Gather additional documentation if necessary.
- 4. Respond specifically to the carrier''s stated reason.
- 5. Resubmit or escalate when appropriate.

Never send a generic:

**"Please reconsider."**

Instead, address the actual issue.'),
  ('supplement-process-step-22-negotiation', 'supplement-process', '24. Step Twenty-Two — Negotiation', '{"supplement-process","step-22-negotiation"}', 'Professional supplementing is not arguing. The objective is to reach an accurate scope agreement.

**Good communication example.** We understand the concern regarding the flashing item. The attached photograph shows the existing flashing configuration. Because the existing component cannot remain in place while the approved work is completed, detach and reset is required. We have included the applicable documentation and revised the estimate accordingly.

Avoid:

- Emotional language
- Threats
- Accusations
- "You have to pay this."
- Unsupported code claims
- Inflated quantities
- Repeated submissions with no new information'),
  ('supplement-process-step-23-escalation', 'supplement-process', '25. Step Twenty-Three — Escalation', '{"supplement-process","step-23-escalation"}', 'Escalate only when appropriate. Potential escalation levels:

- Level 1: Adjuster discussion
- Level 2: Written reconsideration
- Level 3: Supervisor / desk adjuster
- Level 4: Carrier escalation process
- Level 5: Contractor / insured involvement when appropriate

**Always.** BON should document the reason for every escalation.'),
  ('supplement-process-step-24-close', 'supplement-process', '26. Step Twenty-Four — Close the Supplement', '{"supplement-process","step-24-close"}', '**Not done until documented.** A supplement is not complete when it is submitted. It is complete when the outcome is documented.

**Checklist — Closeout Checklist:**

- Final carrier response received
- Approved amount recorded
- Denied amount recorded
- Remaining disputes identified
- Contractor notified
- Estimate updated
- Claim notes updated
- Supporting correspondence saved
- Final documents filed
- Financial impact recorded'),
  ('supplement-process-five-questions-section', 'supplement-process', '27. The BON "5 Questions" Test', '{"supplement-process","five-questions-section"}', 'Before submitting any supplement item, ask:

**Checklist — The BON "5 Questions" Test — Before Submitting Any Item:**

- Is it necessary?
- Is it actually missing or under-scoped?
- Can we prove it?
- Is the quantity accurate?
- Is the price appropriate?

**Result.** If the answer to all five is yes, the item is a strong supplement candidate. If one answer is no, investigate before submitting.'),
  ('supplement-process-never-do', 'supplement-process', '28. What BON Should Never Do', '{"supplement-process","never-do"}', 'BON does not:

- Manufacture damage
- Exaggerate quantities
- Create false documentation
- Misrepresent code
- Add unsupported line items
- Duplicate existing scope
- Manipulate photographs
- Misrepresent pre-existing damage
- Claim something is required when it has not been verified
- Submit knowingly inaccurate information

**The long-term value of BON.** Built on accuracy and credibility. A supplement specialist who gets everything approved because they ask for everything is not necessarily good at supplementing. A good supplement specialist knows what should be requested — and what should not.'),
  ('supplement-process-daily-workflow', 'supplement-process', '29. Supplement Specialist Daily Workflow', '{"supplement-process","daily-workflow"}', '**Checklist — Daily Workflow — Morning:**

- Review open supplements
- Review carrier responses
- Identify today''s follow-ups
- Check new files
- Prioritize urgent claims

**Checklist — Daily Workflow — New Files:**

- Complete intake
- Obtain carrier estimate
- Review scope
- Identify missing documentation
- Assign priority

**Checklist — Daily Workflow — Active Supplements:**

- Complete line-item review
- Verify quantities
- Research documentation
- Build estimate
- Write narrative
- Submit
- Log submission

**Checklist — Daily Workflow — End of Day:**

- Update every active claim
- Schedule follow-ups
- Save correspondence
- Identify blocked files
- Escalate anything requiring management attention'),
  ('supplement-process-file-status-system', 'supplement-process', '30. BON Supplement File Status System', '{"supplement-process","file-status-system"}', 'Every claim should have a clearly defined status:

- NEW — File received but not reviewed.
- IN REVIEW — Claim and estimate are being analyzed.
- WAITING ON DOCS — Additional information is required.
- READY TO WRITE — Scope has been identified and documentation is sufficient.
- READY TO SUBMIT — Supplement is complete and undergoing final QA.
- SUBMITTED — Supplement sent to carrier.
- CARRIER REVIEW — Waiting for carrier response.
- PARTIAL APPROVAL — Some items approved; others remain unresolved.
- REBUTTAL — Additional documentation or argument submitted.
- ESCALATED — Issue requires higher-level review.
- APPROVED — Supplement resolved.
- CLOSED — Final documentation completed.'),
  ('supplement-process-quality-control', 'supplement-process', '31. BON Quality Control — Second Set of Eyes', '{"supplement-process","quality-control"}', '**Before a supplement leaves BON.** Perform a QA review.

**Checklist — Quality Control — Scope QA:**

- Did we review the entire carrier estimate?
- Did we compare measurements?
- Did we inspect photographs?
- Did we look for missed trades?
- Did we check accessories?
- Did we check detach/reset?
- Did we check code?
- Did we check manufacturer requirements?

**Checklist — Quality Control — Estimate QA:**

- Quantities correct?
- Units correct?
- Line items correct?
- No duplicates?
- Pricing reviewed?
- Narrative matches estimate?

**Checklist — Quality Control — Documentation QA:**

- Every major request supported?
- Photos labeled?
- Documents readable?
- Claim information correct?

**Checklist — Quality Control — Submission QA:**

- Correct carrier?
- Correct adjuster?
- Correct claim number?
- Correct email/portal?
- Amount requested verified?'),
  ('supplement-process-golden-rule', 'supplement-process', '32. The Golden Rule of BON Supplementing', '{"supplement-process","golden-rule"}', '**DOCUMENT FIRST. WRITE SECOND.**

Do not start with:

**"What can we add?"**

Start with:

**"What actually needs to be done?"**

Then determine:

**"What did the carrier allow?"**

Then:

**"What is missing?"**

Then:

**"How can we prove it?"**

Only after those questions are answered should the supplement be written.'),
  ('supplement-process-formula', 'supplement-process', '33. The BON Supplement Formula', '{"supplement-process","formula"}', '- 1. ACTUAL SCOPE — What must be done?
- 2. CARRIER SCOPE — What did the carrier allow?
- 3. SCOPE GAP — What is missing?
- 4. DOCUMENTATION — Can we prove the difference?
- 5. PRICING — What is the appropriate cost?
- 6. SUPPLEMENT — Clearly communicate the difference.
- 7. FOLLOW-UP — Track every requested dollar.
- 8. RESOLUTION — Approved, denied, partially approved, or escalated.
- 9. CLOSEOUT — Document the final outcome.'),
  ('supplement-process-real-value', 'supplement-process', '34. The Real Value of a BON Supplement Specialist', '{"supplement-process","real-value"}', 'The best supplement specialist is not the person who knows the most Xactimate codes. It is the person who can look at a claim and recognize:

**Something doesn''t make sense here.**

Then they know how to investigate it. They can connect photos, measurements, estimate, code, manufacturer requirements, and actual work into a defensible scope.

**BON Standard.** Accurate. Documented. Defensible. Trackable. Every supplement that leaves BON should meet all four standards.')
on conflict (id) do update set
  category_id = excluded.category_id,
  title = excluded.title,
  tags = excluded.tags,
  body = excluded.body,
  updated_at = now();
