-- 0028 (insert), 0029 and 0030 (updates) were meant to be run in
-- sequence, but only 0030 was actually run - since the 0028 insert
-- never happened, that UPDATE matched zero rows and silently no-opped
-- (no error, but nothing written). This migration inserts the row
-- directly with the final, full-carrier-census content from 0030, in
-- one step, using ON CONFLICT so it is safe to run even if 0028 did
-- land after all.

insert into kb_entries (id, category_id, title, tags, body)
values (
  'code-upgrade-total-inclusion-varies-by-carrier',
  'code',
  'Are Code-Upgrade Dollars Already in the Total? Carrier-by-Carrier Findings',
  '{"code-upgrade","building-ordinance-or-law","grand-total","paid-when-incurred","strikethrough","usaa","state-farm","allstate","reconciliation"}',
  'Whether a code-required item''s dollar amount is already counted in an estimate''s headline Total, or sitting outside it waiting to be added in separately, is not consistent across carriers - it has to be checked per file, not assumed. Every carrier/administrator actually present in the uploaded test-data claims was checked (USAA, State Farm, Allstate, and CoAction Specialty/Gotham Insurance) - this is the full picture from what has been uploaded so far, not a USAA-only sample.

**USAA - strikethrough on a line item means its dollar amount is excluded from the section total, confirmed by actual arithmetic.** On claim-007 in test-data, line item 11 ("Drip edge," under the Roof section) is struck through with RCV $393.73. Summing every other line item in that Roof section (items 1-10 and 19-21, deliberately skipping item 11) gives $23,854.45 - matching the document''s own stated "Totals: Roof RCV 23,854.45" exactly. If item 11 had been included, the total would have been $24,248.18 instead. That $393.73 reappears separately on the Grand Total recap page under "Dwelling - Code Upgrade Paid When Incurred," outside the main Dwelling total. The same placeholder pattern (struck through, "required by current building codes... payable when incurred, subject to limits") also appears on claim-003, item 13, there at $0.00 - same convention, just not yet priced. Confirmed on two separate USAA claims.

**State Farm - no priced code-upgrade line item found to test, across three separate claims.** Every State Farm estimate in test-data (claim-001/revised - McDonald, claim-003/revised - Lankford, claim-006/revised - Vigil) carries the same generic disclaimer ("There may be building codes, ordinances, laws, or regulations that affect the repairs of your property... may or may not be covered by your policy") but none of the three actually inserts a specific priced or struck-through code-upgrade line item the way USAA does. There is nothing to reconcile against a Totals line on any of them. This is a real gap, not a confirmed "State Farm includes it" or "State Farm excludes it" - it simply has not come up yet in what has been uploaded. Check the next real State Farm file that actually has a code item before assuming either way.

**Allstate (branded "National Catastrophe Team" in the letterhead) - a completely different mechanism, no strikethrough at all.** On claim-004 in test-data, "BC-Building Codes" gets its own full category - its own "Summary for BC-Building Codes" page with RCV $135.91, ACV $135.91, prior payment and net claim remaining, structured exactly like "Summary for AA-Dwelling" would be. It is a normal, fully-priced coverage-recap line (134.33, 0.24% of the total) that sums cleanly into the overall Grand Total. No strikethrough, no "paid when incurred" language anywhere on this file. Nothing needs to be added in separately here - confirmed by the same recap-percentage arithmetic used on the USAA files.

**CoAction Specialty (administering for Gotham Insurance Company) - not an estimate at all, nothing to test.** The claim-005/revised_estimate.pdf file in test-data is actually a coverage-denial letter quoting policy language (including Gotham''s own "Increased Cost Of Construction" ordinance-or-law clause), not a priced Xactimate-style estimate. There are no line items or a Totals line to reconcile. Worth keeping as a reference for what a real "Increased Cost of Construction" policy clause looks like, but it does not answer the total-inclusion question.

**What to actually do on a real file:** if a line item is struck through, treat that as a strong signal - confirmed for USAA by direct arithmetic on two claims - that its dollar amount is held out of the section Totals line as a separate "payable when incurred" amount needing to be tracked and added in later. For Allstate, check the Grand Total recap for a dedicated Building Codes category instead - if it is there with a nonzero figure and no "paid when incurred" language, it is very likely already included. For State Farm and CoAction/Gotham, there is not yet a real example to check against - read that carrier''s own Grand Total recap and line-item formatting directly on the actual file, since neither confirmed behavior can be assumed from what has been reviewed so far.

**Source:** test-data/claim-007/estimates/revised_estimate.pdf (USAA, item 11 - arithmetic-verified), test-data/claim-003/estimates/original_estimate.pdf (USAA, item 13 - arithmetic-verified), test-data/claim-001/estimates/revised_estimate.pdf, test-data/claim-003/estimates/revised_estimate.pdf, test-data/claim-006/estimates/revised_estimate.pdf (State Farm, three separate claims, no code item present), test-data/claim-004/estimates/revised_estimate.pdf (Allstate/National Catastrophe Team - arithmetic-verified), test-data/claim-005/estimates/revised_estimate.pdf (CoAction Specialty/Gotham - denial letter, not an estimate). Pulled directly from real uploaded documents, not general research.'
)
on conflict (id) do update set
  category_id = excluded.category_id,
  title = excluded.title,
  tags = excluded.tags,
  body = excluded.body,
  updated_at = now();
