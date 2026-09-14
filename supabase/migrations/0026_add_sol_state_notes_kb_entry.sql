-- Adds a Knowledge Base reference entry to the existing "states" (State
-- Notes) category: the statute-of-limitations research pulled together
-- while discussing the SOL Countdown feature (see 0025_add_statute_of_
-- limitations.sql). Framed for the moment a file is about to be referred
-- to a Public Adjuster (PA) or Independent Adjuster (IA) - that referral
-- decision needs to account for whether the filing deadline has already
-- passed. NOT attorney-verified - same caveat as the placeholder SOL
-- rules this cross-references.

insert into kb_entries (id, category_id, title, tags, body)
values (
  'states-sol-deadlines-co-ok-mo',
  'states',
  'Statute of Limitations Deadlines - CO / OK / MO (Check Before PA/IA Referral)',
  '{"statute-of-limitations","sol","deadline","pa-referral","ia-referral","colorado","oklahoma","missouri"}',
  'Why this matters: Before a supplement file gets referred out to a Public Adjuster (PA) or Independent Adjuster (IA), confirm the claim is not already past its filing deadline. Referring a claim that has already expired is a wasted referral and a missed opportunity to flag the deadline risk to the contractor and homeowner earlier.

Two different deadlines can apply - check both. The state statute of limitations is the default ceiling if the policy is silent. But many property insurance policies contain their own contractual "suit against us" clause, and where state law allows it, that clause can require a lawsuit to be filed much sooner than the general statute allows. The policy language controls when it is shorter and enforceable - do not assume the general contract statute is the real deadline without checking the policy.

**Colorado.** General breach of contract (including insurance policy claims): 3 years from the date the breach is discovered or should have been discovered, per C.R.S. Section 13-80-101. A bad-faith or tortious breach of insurance contract claim carries a shorter 2-year period under C.R.S. Section 13-80-102. Whether Colorado law permits a policy to contractually shorten the 3-year period below that has not been confirmed - treat this as open until an attorney weighs in.

**Oklahoma.** General written contract claims: 5 years, per 12 O.S. Section 95(A)(1). Property and marine insurance policies specifically may contractually limit the time to file suit to as little as 1 year from the date of loss - this is expressly permitted under 36 O.S. Section 3617, and is common in real Oklahoma property policies. For other lines of insurance, the contractual floor is 2 years. Also note: the clock is often treated as starting when the carrier denies or underpays the claim, not necessarily the date of loss itself - confirm which trigger date actually applies to a given file.

**Missouri.** Courts have applied the 10-year written-contract statute of limitations (RSMo Section 516.110) to suits on insurance policies, since a policy is a written contract for payment of money. A separate 5-year catch-all exists under RSMo Section 516.120 for other contract obligations, but case law supports the 10-year period for policy suits specifically. Whether Missouri law permits a policy to contractually shorten this has not been confirmed - treat as open until an attorney weighs in.

**Not attorney-verified.** These are statutory citations pulled from public legal research, not a substitute for an attorney reviewing the actual policy and file. The CRM''s own Statute of Limitations Rules (Settings - Statute of Limitations Rules) are deliberately left as unverified placeholders for the same reason - do not mark either this entry or those rules as verified until a real attorney confirms the controlling number for each state, including whether the specific policy''s suit clause shortens it.

**Before referring a file to a PA or IA:** pull the date of loss, check elapsed time against both the general statute above and the file''s actual policy language for a shorter suit clause, and flag anything close to or past the deadline before the referral goes out, not after.

**Source:** C.R.S. Section 13-80-101 and Section 13-80-102 (Colorado); 12 O.S. Section 95(A)(1) and 36 O.S. Section 3617 (Oklahoma); RSMo Section 516.110 and Section 516.120 (Missouri). Pulled via legal research, September 2026 - re-verify before relying on these citations for a real filing decision.'
);
