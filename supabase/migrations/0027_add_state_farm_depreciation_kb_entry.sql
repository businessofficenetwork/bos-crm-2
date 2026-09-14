-- Adds a Knowledge Base reference entry to the existing "carrier"
-- (Carrier Playbook) category: the recoverable-depreciation completion
-- deadline found in a real State Farm claim letter (claim-003 in
-- /test-data, revised_estimate.pdf). This is one data point from one
-- real document, not confirmed as a universal State Farm policy across
-- every state/policy form. Same PA/IA-referral framing as the SOL entry
-- added in 0026 - both exist to be checked before a file goes out.

insert into kb_entries (id, category_id, title, tags, body)
values (
  'carrier-state-farm-recoverable-depreciation-deadline',
  'carrier',
  'State Farm - Recoverable Depreciation Deadline (2 Years to Complete, 30 Days to Notify)',
  '{"state-farm","depreciation","recoverable-depreciation","rcv","acv","deadline","pa-referral","ia-referral"}',
  'Found directly in a real State Farm claim letter (claim-003 in test-data, the LANKFORD/SUZANNE file, revised_estimate.pdf) - not researched from a public source, pulled from an actual document this office received. It appeared twice in that letter, once per coverage section (Dwelling and Other Structures), worded identically both times:

"To receive replacement cost benefits you must: 1. Complete the actual repair or replacement of the damaged part of the property within two years of the date of loss; 2. Promptly notify us within 30 days after the work has been completed."

**What this means in practice:** on this file, the homeowner had two years from the date of loss to actually complete repairs, then 30 days from completion to notify State Farm, in order to collect the recoverable depreciation held back on the ACV payment. Missing either deadline risks losing the recoverable depreciation entirely - the payment stays capped at actual cash value.

**Treat this as one confirmed data point, not a universal State Farm rule.** This exact wording came from one specific letter. It has not been confirmed whether every State Farm policy form, in every state, carries the same two-year/30-day language - policy forms and state regulation both affect this. Check the actual letter or policy on each file rather than assuming this number applies automatically.

**Other carriers reviewed did not state a number in the claim letter itself.** USAA and a Team One Insurance Services-issued letter both explained that recoverable depreciation exists and described the general mechanism (complete repairs, then it pays out), but neither stated an explicit day or year count in the correspondence itself - the deadline may live in the full policy document rather than the claim letter. Do not assume "no deadline mentioned in the letter" means "no deadline" - it likely just means the letter did not repeat what the policy already says.

**Before referring a file to a PA or IA:** check the claim correspondence and, where possible, the actual policy for this specific clause and its stated deadline (completion date and notice date), the same way the statute-of-limitations entry in State Notes gets checked. A file that is past its recoverable-depreciation completion window is a materially different referral than one that still has time.

Source: claim-003/estimates/revised_estimate.pdf (test-data). Not attorney- or carrier-confirmed as a general rule - verify against the actual policy or a State Farm claims rep before relying on this for a file where real money is at stake.'
);
