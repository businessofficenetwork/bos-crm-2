// The Supplement Guide's reference content (the narrative steps, tips,
// tables) now lives in the Knowledge Base ("How To Do a Supplement"
// category - see migration 0032). What's left here is the checklist data
// itself: CHECKLISTS is still the source of truth for each checklist's
// items, and PER_SUPPLEMENT_CHECKLIST_IDS still drives the real,
// database-backed checklists on each supplement (SupplementChecklists.jsx)
// - those stay interactive and per-claim, unlike the KB's read-only copy
// of the same item text.

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

// Checklists that belong to one specific supplement, in the order they
// come up while working a file. Excludes the four Daily Workflow
// checklists (Morning / New Files / Active Supplements / End of Day) -
// those are a specialist's personal daily routine, not tied to one claim.
export const PER_SUPPLEMENT_CHECKLIST_IDS = [
  'intake-documents',
  'claim-basics-questions',
  'estimate-review-checklist',
  'line-item-review-questions',
  'photo-verification',
  'quantities-to-verify',
  'code-requirement-checklist',
  'manufacturer-requirements-checklist',
  'detach-reset-checklist',
  'access-labor-difficulty-checklist',
  'pricing-review-checklist',
  'xactimate-quality-checklist',
  'submission-claim-info',
  'submission-scope',
  'submission-package',
  'five-questions',
  'qa-scope',
  'qa-estimate',
  'qa-documentation',
  'qa-submission',
  'closeout-checklist',
]

PER_SUPPLEMENT_CHECKLIST_IDS.forEach((id) => {
  if (!CHECKLISTS.some((c) => c.id === id)) {
    throw new Error(`Unknown checklist id "${id}" in PER_SUPPLEMENT_CHECKLIST_IDS`)
  }
})
