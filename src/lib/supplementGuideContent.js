// Content for the Supplement Guide page - transcribed directly from
// "BON SUPPLEMENT SPECIALIST - How to Do Supplements" (the company's
// training/SOP manual). This file is content, not logic: keep new
// sections/checklists in the same shape as the ones already here rather
// than inventing new block types.
//
// Block types used in GUIDE_SECTIONS:
//   paragraph  - { type: 'paragraph', text }
//   quote      - { type: 'quote', text }              (styled callout, for the manual's ">" lines)
//   list       - { type: 'list', ordered, items }
//   table      - { type: 'table', columns, rows }
//   tip        - { type: 'tip', label, text }          (highlighted rule/warning box)
//   checklist  - { type: 'checklist', ref }             (renders the CHECKLISTS entry with this id)

export const WORKFLOW_STAGES = [
  'Intake', 'Review', 'Inspect', 'Identify', 'Document', 'Price',
  'Write', 'Submit', 'Track', 'Respond', 'Resolve', 'Close',
]

export const TIMELINE = [
  { stage: 'Intake & File Setup', target: '0-24 hours' },
  { stage: 'Initial Claim Review', target: 'Within 24 hours' },
  { stage: 'Deep Line-Item Review', target: '1-2 business days' },
  { stage: 'Supplement Preparation', target: '1-2 business days after documentation is complete' },
  { stage: 'Submission', target: 'Same day as completion' },
  { stage: 'Carrier Follow-Up', target: 'According to carrier timeline' },
  { stage: 'Revision / Negotiation', target: 'As needed' },
  { stage: 'Final Approval / Resolution', target: 'Track until complete' },
]

export const CHECKLISTS = [
  {
    id: 'intake-documents',
    title: 'Intake — Documents to Request/Locate',
    items: [
      'Homeowner information', 'Property address', 'Insurance carrier', 'Claim number',
      'Date of loss', 'Policy information when available', 'Original carrier estimate',
      'Contractor estimate', 'Photos', 'Inspection report', 'Roof measurements',
      'Exterior measurements', 'Scope of work', 'Previous supplements',
      'Carrier correspondence', 'Denial letters', 'Partial approvals',
      'Depreciation information when relevant', 'Invoices or receipts when relevant',
      'Required permits', 'Local building/code information when applicable',
      'Manufacturer documentation when applicable',
    ],
  },
  {
    id: 'claim-basics-questions',
    title: 'Understand the Claim — Questions to Answer',
    items: [
      'What is the date of loss?', 'What caused the damage?', 'What areas are claimed?',
      'What did the carrier inspect?', 'What did the carrier approve?',
      'What did the carrier deny?', 'What did the contractor inspect?',
      'Are there differences between the inspections?',
    ],
  },
  {
    id: 'estimate-review-checklist',
    title: 'Carrier Estimate Review — What to Look For',
    items: [
      'Missing trades', 'Missing elevations', 'Missing roof sections', 'Missing quantities',
      'Incorrect quantities', 'Incorrect materials', 'Missing labor', 'Missing tear-off',
      'Missing disposal', 'Missing accessories', 'Missing code-required work',
      'Missing manufacturer requirements', 'Missing preparation',
      'Missing installation requirements', 'Incorrect waste', 'Incorrect unit pricing',
      'Incorrect labor assumptions', 'Missing equipment', 'Missing permits',
      'Missing detach/reset items', 'Missing interior damage',
      'Missing siding/gutter/fascia/soffit work', 'Missing painting', 'Missing drywall',
      'Missing contents or protection', 'Incorrect depreciation treatment',
      'Scope items overlooked during the original inspection',
    ],
  },
  {
    id: 'line-item-review-questions',
    title: 'Line-Item Review — Ask for Every Line',
    items: [
      'Is it actually required?',
      'Is the quantity correct? (compare vs. roof report, measurements, photos, contractor measurements, site inspection)',
      'Is the correct material included?',
      'Is the correct labor included?',
      'Are supporting operations included? (detach, reset, remove, replace, prep, flash, seal, prime, paint, dispose, haul, protect, clean)',
      "Is something required that isn't listed at all?",
    ],
  },
  {
    id: 'photo-verification',
    title: 'Photos Should Demonstrate',
    items: [
      'Damage', 'Existing materials', 'Missing components', 'Configuration', 'Access issues',
      'Roof pitch', 'Elevations', 'Quantity', 'Obstructions', 'Specialty conditions',
      'Code-related conditions when visible', 'Detach/reset requirements',
      'Pre-existing conditions when relevant',
    ],
  },
  {
    id: 'quantities-to-verify',
    title: 'Quantities to Verify (Carrier Estimate vs. Measurements vs. Photos vs. Contractor Scope)',
    items: [
      'Roofing squares', 'Ridge', 'Hip', 'Valleys', 'Eave', 'Rake', 'Drip edge',
      'Pipe penetrations', 'Vents', 'Skylights', 'Chimneys', 'Gutters', 'Downspouts',
      'Siding', 'Fascia', 'Soffit',
    ],
  },
  {
    id: 'code-requirement-checklist',
    title: 'Code Requirements — Determine',
    items: [
      'What requirement applies?', 'What jurisdiction applies?',
      'What code provision supports the requirement?',
      'Does the requirement apply to this specific property/project?',
      'Is there documentation available?',
      'Is the requirement triggered by the work being performed?',
      'What additional cost results?',
    ],
  },
  {
    id: 'manufacturer-requirements-checklist',
    title: 'Manufacturer Requirements — Verify',
    items: [
      'Installation instructions', 'Product requirements', 'Required accessories',
      'Underlayment', 'Flashing', 'Ventilation', 'Fastening requirements',
      'Compatibility requirements', 'Warranty requirements',
    ],
  },
  {
    id: 'detach-reset-checklist',
    title: 'Detach & Reset — Look For',
    items: [
      'Satellite dishes', 'Solar equipment', 'Gutters', 'Downspouts', 'Flashing',
      'Exterior fixtures', 'Fencing', 'HVAC components', 'Accessories',
      'Specialty equipment',
    ],
  },
  {
    id: 'access-labor-difficulty-checklist',
    title: 'Access, Labor & Difficulty — Look For',
    items: [
      'Steep roof', 'Multiple roof levels', 'Limited access', 'Long material carries',
      'Difficult staging', 'Specialty equipment', 'Additional protection',
      'Difficult tear-off', 'Multi-story conditions', 'Restricted access',
      'Additional labor requirements',
    ],
  },
  {
    id: 'pricing-review-checklist',
    title: 'Pricing Review',
    items: [
      'Applicable estimating database pricing', 'Labor', 'Material', 'Equipment', 'Waste',
      'Disposal', 'Overhead and profit where applicable', 'Tax where applicable',
      'Local conditions', 'Specialty operations',
    ],
  },
  {
    id: 'xactimate-quality-checklist',
    title: 'Xactimate Quality Standards',
    items: [
      'Uses appropriate line items', 'Uses accurate quantities', 'Includes appropriate labor',
      'Includes applicable material', 'Avoids duplicate charges', 'Clearly identifies added scope',
      'Matches supporting documentation', 'Is internally consistent',
      'Is easy for an adjuster to audit',
    ],
  },
  {
    id: 'submission-claim-info',
    title: 'Before Submitting — Claim Information',
    items: [
      'Correct insured', 'Correct address', 'Correct claim number', 'Correct date of loss',
      'Correct carrier',
    ],
  },
  {
    id: 'submission-scope',
    title: 'Before Submitting — Scope',
    items: [
      'Every requested item is supported', 'Quantities are verified', 'Photos support the request',
      'No duplicate line items', 'Code items documented', 'Manufacturer items documented',
      'Pricing reviewed',
    ],
  },
  {
    id: 'submission-package',
    title: 'Before Submitting — Package',
    items: [
      'Estimate attached', 'Photos attached', 'Supporting documents attached',
      'Narrative included', 'File naming standardized',
    ],
  },
  {
    id: 'closeout-checklist',
    title: 'Closeout Checklist',
    items: [
      'Final carrier response received', 'Approved amount recorded', 'Denied amount recorded',
      'Remaining disputes identified', 'Contractor notified', 'Estimate updated',
      'Claim notes updated', 'Supporting correspondence saved', 'Final documents filed',
      'Financial impact recorded',
    ],
  },
  {
    id: 'five-questions',
    title: 'The BON "5 Questions" Test — Before Submitting Any Item',
    items: [
      'Is it necessary?', 'Is it actually missing or under-scoped?', 'Can we prove it?',
      'Is the quantity accurate?', 'Is the price appropriate?',
    ],
  },
  {
    id: 'daily-morning',
    title: 'Daily Workflow — Morning',
    items: [
      'Review open supplements', 'Review carrier responses', "Identify today's follow-ups",
      'Check new files', 'Prioritize urgent claims',
    ],
  },
  {
    id: 'daily-new-files',
    title: 'Daily Workflow — New Files',
    items: [
      'Complete intake', 'Obtain carrier estimate', 'Review scope',
      'Identify missing documentation', 'Assign priority',
    ],
  },
  {
    id: 'daily-active-supplements',
    title: 'Daily Workflow — Active Supplements',
    items: [
      'Complete line-item review', 'Verify quantities', 'Research documentation',
      'Build estimate', 'Write narrative', 'Submit', 'Log submission',
    ],
  },
  {
    id: 'daily-end-of-day',
    title: 'Daily Workflow — End of Day',
    items: [
      'Update every active claim', 'Schedule follow-ups', 'Save correspondence',
      'Identify blocked files', 'Escalate anything requiring management attention',
    ],
  },
  {
    id: 'qa-scope',
    title: 'Quality Control — Scope QA',
    items: [
      'Did we review the entire carrier estimate?', 'Did we compare measurements?',
      'Did we inspect photographs?', 'Did we look for missed trades?',
      'Did we check accessories?', 'Did we check detach/reset?', 'Did we check code?',
      'Did we check manufacturer requirements?',
    ],
  },
  {
    id: 'qa-estimate',
    title: 'Quality Control — Estimate QA',
    items: [
      'Quantities correct?', 'Units correct?', 'Line items correct?', 'No duplicates?',
      'Pricing reviewed?', 'Narrative matches estimate?',
    ],
  },
  {
    id: 'qa-documentation',
    title: 'Quality Control — Documentation QA',
    items: [
      'Every major request supported?', 'Photos labeled?', 'Documents readable?',
      'Claim information correct?',
    ],
  },
  {
    id: 'qa-submission',
    title: 'Quality Control — Submission QA',
    items: [
      'Correct carrier?', 'Correct adjuster?', 'Correct claim number?',
      'Correct email/portal?', 'Amount requested verified?',
    ],
  },
]

const checklistTitle = (id) => CHECKLISTS.find((c) => c.id === id)?.title || id

export const GUIDE_SECTIONS = [
  {
    id: 'mission',
    number: 1,
    title: 'The BON Supplement Mission',
    blocks: [
      { type: 'paragraph', text: 'A supplement is not simply a request for "more money."' },
      {
        type: 'quote',
        text: 'The original estimate does not accurately reflect the documented scope, materials, labor, or requirements necessary to complete the covered work.',
      },
      { type: 'paragraph', text: "The BON Supplement Specialist's job is to:" },
      {
        type: 'list',
        ordered: true,
        items: [
          'Understand what happened at the property.',
          'Understand what the insurance carrier originally allowed.',
          'Determine what is actually required to complete the work.',
          'Identify legitimate differences between the two.',
          'Support those differences with documentation.',
          'Price the missing scope accurately.',
          'Submit a professional, easy-to-review supplement.',
          'Track the claim through resolution.',
          'Document every decision and communication.',
        ],
      },
      {
        type: 'tip',
        label: 'The BON Standard',
        text: "Don't supplement because an item can be supplemented. Supplement because the documentation supports the additional scope.",
      },
    ],
  },
  {
    id: 'process-overview',
    number: 2,
    title: 'The Supplement Process at a Glance',
    blocks: [
      { type: 'paragraph', text: 'Every supplement follows this basic workflow:' },
      { type: 'list', ordered: false, items: WORKFLOW_STAGES },
      { type: 'paragraph', text: 'Standard BON timeline (internal service targets, not promises regarding carrier response times):' },
      { type: 'table', columns: ['Stage', 'Target'], rows: TIMELINE.map((t) => [t.stage, t.target]) },
    ],
  },
  {
    id: 'step-1-intake',
    number: 3,
    title: 'Step One — Intake the File',
    blocks: [
      { type: 'paragraph', text: 'Objective: get everything needed to understand the claim before beginning the supplement.' },
      { type: 'checklist', ref: 'intake-documents' },
      { type: 'paragraph', text: 'Create the BON file using a standardized folder structure:' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Claim Information', 'Carrier Estimate', 'Contractor Estimate', 'Photos',
          'Measurements', 'Supplement', 'Carrier Correspondence', 'Documentation / Evidence',
          'Approval / Final', 'Notes',
        ],
      },
    ],
  },
  {
    id: 'step-2-understand',
    number: 4,
    title: 'Step Two — Understand the Claim',
    blocks: [
      { type: 'paragraph', text: 'Before looking for supplement items, understand the claim.' },
      { type: 'checklist', ref: 'claim-basics-questions' },
      { type: 'paragraph', text: 'Scope questions - ask:' },
      { type: 'quote', text: 'What does the carrier think needs to be done?' },
      { type: 'paragraph', text: 'Then ask:' },
      { type: 'quote', text: 'What does the contractor actually need to do to complete the job?' },
      { type: 'tip', label: 'Where opportunities live', text: 'The difference between those two answers is where supplement opportunities may exist.' },
    ],
  },
  {
    id: 'step-3-review-estimate',
    number: 5,
    title: 'Step Three — Review the Carrier Estimate',
    blocks: [
      { type: 'tip', label: 'Do not skip this', text: 'Do not immediately start writing a supplement. First, read the estimate from beginning to end.' },
      { type: 'checklist', ref: 'estimate-review-checklist' },
    ],
  },
  {
    id: 'step-4-line-item-review',
    number: 6,
    title: 'Step Four — Perform the Line-Item Review',
    blocks: [
      { type: 'tip', label: 'One of the most important BON skills', text: 'Review the estimate line by line.' },
      { type: 'checklist', ref: 'line-item-review-questions' },
      {
        type: 'tip',
        label: 'Biggest opportunities',
        text: "Something required that isn't listed at all is often where the biggest supplement opportunities are found.",
      },
    ],
  },
  {
    id: 'step-5-opportunity-list',
    number: 7,
    title: 'Step Five — Build the Supplement Opportunity List',
    blocks: [
      { type: 'paragraph', text: 'Create a working list before writing the supplement.' },
      {
        type: 'table',
        columns: ['Item', 'Carrier Allowed', 'Required', 'Difference', 'Documentation'],
        rows: [
          ['Starter', 'No', 'Yes', 'Missing', 'Photos / estimate'],
          ['Drip edge', 'Partial', 'Full', 'Quantity', 'Photos'],
          ['Pipe flashing', 'No', 'Yes', 'Missing', 'Photos'],
          ['Permit', 'No', 'Yes', 'Missing', 'Building department'],
          ['Steep charge', 'No', 'Yes', 'Missing', 'Measurements'],
          ['Code item', 'No', 'Yes', 'Missing', 'Code documentation'],
        ],
      },
      { type: 'paragraph', text: 'Every potential supplement item should answer:' },
      { type: 'quote', text: 'Why should this item be added?' },
      {
        type: 'tip',
        label: 'If you cannot answer that',
        text: 'If the answer cannot be clearly documented, stop and investigate before adding it.',
      },
    ],
  },
  {
    id: 'step-6-classify',
    number: 8,
    title: 'Step Six — Classify Each Supplement Item',
    blocks: [
      { type: 'paragraph', text: 'BON uses three priority levels.' },
      {
        type: 'list', ordered: false,
        items: [
          'PRIORITY 1 — Critical: items that can prevent the contractor from properly completing the work or materially affect the scope. Examples: missing required scope, structural issues, code-required work, incorrect material assumptions, major quantity discrepancies, missing required components.',
          'PRIORITY 2 — Significant: items that materially affect the cost of completing the approved scope. Examples: missing accessories, incorrect quantities, additional labor, detach/reset, additional preparation, additional disposal.',
          'PRIORITY 3 — Documentation / Financial: items that should be addressed but generally do not prevent work from proceeding. Examples: pricing discrepancies, administrative documentation, certain permit costs, minor missed operations, supporting documentation.',
        ],
      },
      {
        type: 'tip',
        label: 'Priority is not legitimacy',
        text: 'Priority does not determine whether an item is legitimate. It determines how urgently BON should resolve the issue.',
      },
    ],
  },
  {
    id: 'step-7-verify-condition',
    number: 9,
    title: 'Step Seven — Verify the Physical Condition',
    blocks: [
      { type: 'tip', label: 'Never assume', text: 'Never rely solely on the original estimate. Use photographs and inspection documentation to verify the actual property condition.' },
      { type: 'checklist', ref: 'photo-verification' },
      { type: 'paragraph', text: 'Photo rule - a photo should answer:' },
      { type: 'quote', text: 'What am I looking at, and why does it matter?' },
      {
        type: 'tip',
        label: 'Organized evidence, not a photo dump',
        text: 'Avoid submitting hundreds of random photographs. BON should submit organized evidence.',
      },
    ],
  },
  {
    id: 'step-8-verify-quantities',
    number: 10,
    title: 'Step Eight — Verify Quantities',
    blocks: [
      { type: 'paragraph', text: 'Quantities are one of the easiest areas to challenge and one of the easiest areas to get wrong. Compare carrier estimate against actual measurements, against photos, against contractor scope.' },
      { type: 'checklist', ref: 'quantities-to-verify' },
      {
        type: 'tip',
        label: 'BON Rule',
        text: 'Never increase a quantity simply because the contractor says it is higher. Document the reason for the difference.',
      },
    ],
  },
  {
    id: 'step-9-code',
    number: 11,
    title: 'Step Nine — Check Code Requirements',
    blocks: [
      { type: 'paragraph', text: 'Code-related supplements require special care. Do not simply write:' },
      { type: 'quote', text: '"Code requires this."' },
      { type: 'paragraph', text: 'Determine:' },
      { type: 'checklist', ref: 'code-requirement-checklist' },
      {
        type: 'paragraph',
        text: 'Documentation may include: applicable code section, building department information, permit requirements, jurisdiction documentation, manufacturer installation requirements, official correspondence, other reliable supporting documentation.',
      },
      { type: 'tip', label: 'Never', text: 'Never invent or exaggerate a code requirement.' },
    ],
  },
  {
    id: 'step-10-manufacturer',
    number: 12,
    title: 'Step Ten — Check Manufacturer Requirements',
    blocks: [
      { type: 'paragraph', text: "Sometimes the issue isn't the building code. It may be the manufacturer's installation requirements. Verify:" },
      { type: 'checklist', ref: 'manufacturer-requirements-checklist' },
      { type: 'paragraph', text: "If a manufacturer's requirement materially changes the scope, document it." },
    ],
  },
  {
    id: 'step-11-detach-reset',
    number: 13,
    title: 'Step Eleven — Check for Detach & Reset',
    blocks: [
      { type: 'paragraph', text: 'One of the most commonly missed areas is the work necessary to temporarily remove and reinstall existing components. Look for:' },
      { type: 'checklist', ref: 'detach-reset-checklist' },
      { type: 'paragraph', text: 'Ask:' },
      { type: 'quote', text: 'Can the contractor perform the approved work without removing this item?' },
      { type: 'paragraph', text: 'If not, ask what operation is required, and document it.' },
    ],
  },
  {
    id: 'step-12-access-labor',
    number: 14,
    title: 'Step Twelve — Check Access, Labor & Difficulty',
    blocks: [
      { type: 'paragraph', text: 'The original estimate may assume standard conditions. Look for:' },
      { type: 'checklist', ref: 'access-labor-difficulty-checklist' },
      { type: 'tip', label: 'Again', text: 'Document the condition before requesting the additional cost.' },
    ],
  },
  {
    id: 'step-13-pricing',
    number: 15,
    title: 'Step Thirteen — Review Pricing',
    blocks: [
      { type: 'paragraph', text: 'Once scope is established, review pricing. The question is not "Can we charge more?" The question is:' },
      { type: 'quote', text: 'What is the appropriate cost for the documented scope?' },
      { type: 'checklist', ref: 'pricing-review-checklist' },
      {
        type: 'tip',
        label: 'Keep these separate',
        text: 'Keep scope disputes separate from pricing disputes. A carrier may agree the work is necessary but disagree with the price - that becomes a pricing discussion, not a scope discussion.',
      },
    ],
  },
  {
    id: 'step-14-build-scope',
    number: 16,
    title: 'Step Fourteen — Build the Xactimate Scope',
    blocks: [
      { type: 'paragraph', text: 'Build the supplement in a clean, organized manner.' },
      { type: 'checklist', ref: 'xactimate-quality-checklist' },
      { type: 'paragraph', text: 'Before submission, perform a second review and ask:' },
      { type: 'quote', text: 'If someone who has never seen this claim opened this estimate, would they understand exactly what we are requesting?' },
      { type: 'paragraph', text: 'If not, improve it.' },
    ],
  },
  {
    id: 'step-15-narrative',
    number: 17,
    title: 'Step Fifteen — Write the Supplement Narrative',
    blocks: [
      { type: 'paragraph', text: "The narrative should make the adjuster's job easier. For each item explain:" },
      {
        type: 'list', ordered: false,
        items: [
          'WHAT — What additional work/material is being requested?',
          'WHY — Why is it necessary?',
          'WHERE — Where does it occur?',
          'EVIDENCE — What documentation supports it?',
          'COST — Where is the additional cost reflected?',
        ],
      },
      {
        type: 'paragraph',
        text: 'Example — Item: Drip Edge. Carrier Estimate: Not included. Requested: Add drip edge to applicable roof perimeter. Reason: Existing conditions and installation requirements require drip edge at the roof perimeter. Documentation: Site photographs and roof measurements attached. Estimate: Added as applicable Xactimate line item.',
      },
    ],
  },
  {
    id: 'step-16-package',
    number: 18,
    title: 'Step Sixteen — Create the Supplement Package',
    blocks: [
      { type: 'paragraph', text: 'The supplement should be packaged professionally, in this order:' },
      {
        type: 'list', ordered: true,
        items: [
          'Cover letter / supplement summary', 'Supplemental estimate', 'Original carrier estimate',
          'Contractor estimate', 'Photographs', 'Measurements', 'Code documentation',
          'Manufacturer documentation', 'Receipts / invoices when applicable',
          'Other supporting documents',
        ],
      },
      { type: 'tip', label: 'The goal', text: "Make the adjuster's review fast and obvious." },
    ],
  },
  {
    id: 'step-17-submit',
    number: 19,
    title: 'Step Seventeen — Submit',
    blocks: [
      { type: 'paragraph', text: 'Before submitting, verify:' },
      { type: 'checklist', ref: 'submission-claim-info' },
      { type: 'checklist', ref: 'submission-scope' },
      { type: 'checklist', ref: 'submission-package' },
    ],
  },
  {
    id: 'step-18-log',
    number: 20,
    title: 'Step Eighteen — Log the Submission',
    blocks: [
      { type: 'tip', label: 'Every supplement must be tracked', text: 'Record the following for every submission:' },
      {
        type: 'list', ordered: false,
        items: [
          'Date submitted', 'Submitted to', 'Method of submission', 'Claim number',
          'Amount requested', 'Items requested', 'Supporting documentation',
          'Expected response date', 'Follow-up date', 'Carrier response',
          'Amount approved', 'Amount denied', 'Remaining disputed items',
        ],
      },
    ],
  },
  {
    id: 'step-19-followup',
    number: 21,
    title: 'Step Nineteen — Follow Up',
    blocks: [
      { type: 'paragraph', text: 'Never assume:' },
      { type: 'quote', text: '"No response means they\'re working on it."' },
      { type: 'paragraph', text: 'Follow up according to the BON tracking schedule and carrier process. Every follow-up should be documented as: DATE → PERSON → METHOD → RESULT → NEXT ACTION.' },
      {
        type: 'quote',
        text: '8/12 — Email sent to adjuster requesting status on supplement submitted 8/5. No response. Follow up scheduled 8/15.',
      },
    ],
  },
  {
    id: 'step-20-review-response',
    number: 22,
    title: 'Step Twenty — Review the Carrier Response',
    blocks: [
      { type: 'tip', label: "Don't just mark it Approved or Denied", text: 'Break the response down item by item.' },
      {
        type: 'table',
        columns: ['Item', 'Requested', 'Carrier Decision', 'Approved', 'Denied', 'Next Action'],
        rows: [
          ['Drip edge', '$450', 'Approved', '$450', '$0', 'Close'],
          ['Permit', '$275', 'Denied', '$0', '$275', 'Review'],
          ['Flashing', '$650', 'Partial', '$300', '$350', 'Rebuttal'],
        ],
      },
      {
        type: 'tip',
        label: 'Why this matters',
        text: 'This prevents money from being lost inside a generic "denied" response.',
      },
    ],
  },
  {
    id: 'step-21-denials',
    number: 23,
    title: 'Step Twenty-One — Handle Denials',
    blocks: [
      { type: 'paragraph', text: 'A denial is not necessarily the end of the conversation. First determine why the carrier denied the item. Common reasons include:' },
      {
        type: 'list', ordered: false,
        items: [
          'Not covered', 'Not observed', 'Not required', 'Already included',
          'Pricing disagreement', 'Quantity disagreement', 'Code disagreement',
          'Documentation insufficient', 'Depreciation issue', 'Policy limitation',
          'Duplicate item',
        ],
      },
      { type: 'paragraph', text: 'BON response process:' },
      {
        type: 'list', ordered: true,
        items: [
          'Identify the reason.', 'Determine whether the denial is valid.',
          'Gather additional documentation if necessary.',
          "Respond specifically to the carrier's stated reason.",
          'Resubmit or escalate when appropriate.',
        ],
      },
      { type: 'paragraph', text: 'Never send a generic:' },
      { type: 'quote', text: '"Please reconsider."' },
      { type: 'paragraph', text: 'Instead, address the actual issue.' },
    ],
  },
  {
    id: 'step-22-negotiation',
    number: 24,
    title: 'Step Twenty-Two — Negotiation',
    blocks: [
      { type: 'paragraph', text: 'Professional supplementing is not arguing. The objective is to reach an accurate scope agreement.' },
      {
        type: 'tip',
        label: 'Good communication example',
        text: 'We understand the concern regarding the flashing item. The attached photograph shows the existing flashing configuration. Because the existing component cannot remain in place while the approved work is completed, detach and reset is required. We have included the applicable documentation and revised the estimate accordingly.',
      },
      { type: 'paragraph', text: 'Avoid:' },
      {
        type: 'list', ordered: false,
        items: [
          'Emotional language', 'Threats', 'Accusations', '"You have to pay this."',
          'Unsupported code claims', 'Inflated quantities',
          'Repeated submissions with no new information',
        ],
      },
    ],
  },
  {
    id: 'step-23-escalation',
    number: 25,
    title: 'Step Twenty-Three — Escalation',
    blocks: [
      { type: 'paragraph', text: 'Escalate only when appropriate. Potential escalation levels:' },
      {
        type: 'list', ordered: false,
        items: [
          'Level 1: Adjuster discussion', 'Level 2: Written reconsideration',
          'Level 3: Supervisor / desk adjuster', 'Level 4: Carrier escalation process',
          'Level 5: Contractor / insured involvement when appropriate',
        ],
      },
      { type: 'tip', label: 'Always', text: 'BON should document the reason for every escalation.' },
    ],
  },
  {
    id: 'step-24-close',
    number: 26,
    title: 'Step Twenty-Four — Close the Supplement',
    blocks: [
      { type: 'tip', label: 'Not done until documented', text: 'A supplement is not complete when it is submitted. It is complete when the outcome is documented.' },
      { type: 'checklist', ref: 'closeout-checklist' },
    ],
  },
  {
    id: 'five-questions-section',
    number: 27,
    title: 'The BON "5 Questions" Test',
    blocks: [
      { type: 'paragraph', text: 'Before submitting any supplement item, ask:' },
      { type: 'checklist', ref: 'five-questions' },
      {
        type: 'tip',
        label: 'Result',
        text: 'If the answer to all five is yes, the item is a strong supplement candidate. If one answer is no, investigate before submitting.',
      },
    ],
  },
  {
    id: 'never-do',
    number: 28,
    title: 'What BON Should Never Do',
    blocks: [
      { type: 'paragraph', text: 'BON does not:' },
      {
        type: 'list', ordered: false,
        items: [
          'Manufacture damage', 'Exaggerate quantities', 'Create false documentation',
          'Misrepresent code', 'Add unsupported line items', 'Duplicate existing scope',
          'Manipulate photographs', 'Misrepresent pre-existing damage',
          'Claim something is required when it has not been verified',
          'Submit knowingly inaccurate information',
        ],
      },
      {
        type: 'tip',
        label: 'The long-term value of BON',
        text: 'Built on accuracy and credibility. A supplement specialist who gets everything approved because they ask for everything is not necessarily good at supplementing. A good supplement specialist knows what should be requested — and what should not.',
      },
    ],
  },
  {
    id: 'daily-workflow',
    number: 29,
    title: 'Supplement Specialist Daily Workflow',
    blocks: [
      { type: 'checklist', ref: 'daily-morning' },
      { type: 'checklist', ref: 'daily-new-files' },
      { type: 'checklist', ref: 'daily-active-supplements' },
      { type: 'checklist', ref: 'daily-end-of-day' },
    ],
  },
  {
    id: 'file-status-system',
    number: 30,
    title: 'BON Supplement File Status System',
    blocks: [
      { type: 'paragraph', text: 'Every claim should have a clearly defined status:' },
      {
        type: 'list', ordered: false,
        items: [
          'NEW — File received but not reviewed.',
          'IN REVIEW — Claim and estimate are being analyzed.',
          'WAITING ON DOCS — Additional information is required.',
          'READY TO WRITE — Scope has been identified and documentation is sufficient.',
          'READY TO SUBMIT — Supplement is complete and undergoing final QA.',
          'SUBMITTED — Supplement sent to carrier.',
          'CARRIER REVIEW — Waiting for carrier response.',
          'PARTIAL APPROVAL — Some items approved; others remain unresolved.',
          'REBUTTAL — Additional documentation or argument submitted.',
          'ESCALATED — Issue requires higher-level review.',
          'APPROVED — Supplement resolved.',
          'CLOSED — Final documentation completed.',
        ],
      },
    ],
  },
  {
    id: 'quality-control',
    number: 31,
    title: 'BON Quality Control — Second Set of Eyes',
    blocks: [
      { type: 'tip', label: 'Before a supplement leaves BON', text: 'Perform a QA review.' },
      { type: 'checklist', ref: 'qa-scope' },
      { type: 'checklist', ref: 'qa-estimate' },
      { type: 'checklist', ref: 'qa-documentation' },
      { type: 'checklist', ref: 'qa-submission' },
    ],
  },
  {
    id: 'golden-rule',
    number: 32,
    title: 'The Golden Rule of BON Supplementing',
    blocks: [
      { type: 'tip', label: 'DOCUMENT FIRST. WRITE SECOND.', text: '' },
      { type: 'paragraph', text: 'Do not start with:' },
      { type: 'quote', text: '"What can we add?"' },
      { type: 'paragraph', text: 'Start with:' },
      { type: 'quote', text: '"What actually needs to be done?"' },
      { type: 'paragraph', text: 'Then determine:' },
      { type: 'quote', text: '"What did the carrier allow?"' },
      { type: 'paragraph', text: 'Then:' },
      { type: 'quote', text: '"What is missing?"' },
      { type: 'paragraph', text: 'Then:' },
      { type: 'quote', text: '"How can we prove it?"' },
      { type: 'paragraph', text: 'Only after those questions are answered should the supplement be written.' },
    ],
  },
  {
    id: 'formula',
    number: 33,
    title: 'The BON Supplement Formula',
    blocks: [
      {
        type: 'list', ordered: true,
        items: [
          'ACTUAL SCOPE — What must be done?',
          'CARRIER SCOPE — What did the carrier allow?',
          'SCOPE GAP — What is missing?',
          'DOCUMENTATION — Can we prove the difference?',
          'PRICING — What is the appropriate cost?',
          'SUPPLEMENT — Clearly communicate the difference.',
          'FOLLOW-UP — Track every requested dollar.',
          'RESOLUTION — Approved, denied, partially approved, or escalated.',
          'CLOSEOUT — Document the final outcome.',
        ],
      },
    ],
  },
  {
    id: 'real-value',
    number: 34,
    title: 'The Real Value of a BON Supplement Specialist',
    blocks: [
      { type: 'paragraph', text: 'The best supplement specialist is not the person who knows the most Xactimate codes. It is the person who can look at a claim and recognize:' },
      { type: 'quote', text: 'Something doesn\'t make sense here.' },
      { type: 'paragraph', text: 'Then they know how to investigate it. They can connect photos, measurements, estimate, code, manufacturer requirements, and actual work into a defensible scope.' },
      {
        type: 'tip',
        label: 'BON Standard',
        text: 'Accurate. Documented. Defensible. Trackable. Every supplement that leaves BON should meet all four standards.',
      },
    ],
  },
]

// Sanity check used only during development - every checklist block must
// reference a real entry in CHECKLISTS, or the page would silently render
// nothing for that block.
GUIDE_SECTIONS.forEach((section) => {
  section.blocks.forEach((block) => {
    if (block.type === 'checklist' && !checklistTitle(block.ref)) {
      throw new Error(`Unknown checklist ref "${block.ref}" in section "${section.id}"`)
    }
  })
})
