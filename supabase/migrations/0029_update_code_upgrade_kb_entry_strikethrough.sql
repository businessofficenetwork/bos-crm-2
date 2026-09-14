-- Updates the KB entry added in 0028 with a more precise finding:
-- strikethrough formatting on a line item is the visual signal (at
-- least for USAA) that its dollar amount is excluded from the section
-- Totals line - confirmed by actually summing the visible line items
-- against the stated Totals on two real USAA estimates (claim-007,
-- claim-003 in test-data). Explicitly scoped to USAA only, per the
-- reminder that carrier formatting conventions are not assumed to be
-- universal - this has not been checked against any other carrier.

update kb_entries
set
  title = 'Are Code-Upgrade Dollars Already in the Total? Strikethrough = Excluded (Confirmed for USAA Only)',
  tags = '{"code-upgrade","building-ordinance-or-law","grand-total","paid-when-incurred","strikethrough","usaa","reconciliation"}',
  body = 'Whether a code-required item''s dollar amount is already counted in an estimate''s headline Total, or sitting outside it waiting to be added in separately, is not consistent across carriers - it has to be checked per file, not assumed. Everything below with real numbers was confirmed on USAA estimates specifically. It has not been checked against any other carrier - do not assume the same visual convention (strikethrough) or structure applies elsewhere until it has actually been verified on that carrier''s own documents.

**USAA - strikethrough on a line item means its dollar amount is excluded from the section total, confirmed by actual arithmetic.** On claim-007 in test-data, line item 11 ("Drip edge," under the Roof section) is struck through with RCV $393.73. Summing every other line item in that Roof section (items 1-10 and 19-21, deliberately skipping item 11) gives $23,854.45 - which matches the document''s own stated "Totals: Roof RCV 23,854.45" exactly. If item 11 had been included, the total would have been $24,248.18 instead. The math confirms it: the struck-through dollar amount is not in the section total. That $393.73 does not disappear - it reappears separately on the Grand Total recap page under "Dwelling - Code Upgrade Paid When Incurred," outside the main Dwelling total.

**USAA - the same pattern holds even when the struck item is $0.** On claim-003 in test-data, line item 13 ("Taxes, insurance, permits & fees (Bid Item)," under Dwelling Roof) is struck through with RCV $0.00, accompanied by the same "required by current building codes... payable when incurred, subject to limits" note. Summing items 1-13 (including the struck item 13''s $0.00) gives $23,766.21, matching the stated "Totals: Dwelling Roof RCV 23,766.21." Whether $0 is technically included or excluded does not change the arithmetic, but the formatting convention is identical to claim-007 - it is the same placeholder pattern, just not yet priced.

**A National Catastrophe Team-administered claim (claim-004 in test-data) - different carrier, no strikethrough seen, code items folded into the total.** "BC-Building Codes" appeared as a normal coverage-recap line (134.33, 0.24% of the total), already summed into the overall Grand Total, with no strikethrough or "Paid When Incurred" language anywhere. This is a different administrator with a different structure - it is the clearest evidence in hand that this is not a universal insurance-industry convention, only something confirmed for USAA so far.

**What to actually do on a real file:** if a line item is struck through, treat that as a strong signal - confirmed for USAA by direct arithmetic - that its dollar amount is being held out of the section Totals line as a separate "payable when incurred" amount, and will need to be tracked and added in when repairs are complete and the code requirement is proven. For carriers other than USAA, do not assume strikethrough means the same thing, or that it will appear at all - check that carrier''s own Grand Total / Coverage Item recap page and line-item formatting on the actual file before assuming either way.

**Source:** test-data/claim-007/estimates/revised_estimate.pdf (item 11, Roof section - arithmetic-verified), test-data/claim-003/estimates/original_estimate.pdf (item 13, Dwelling Roof section - arithmetic-verified), test-data/claim-004/estimates/revised_estimate.pdf (contrast example, different administrator). Pulled directly from real uploaded estimate documents, not general research or a stated carrier policy - USAA-specific until proven otherwise on other carriers'' files.'
where id = 'code-upgrade-total-inclusion-varies-by-carrier';
