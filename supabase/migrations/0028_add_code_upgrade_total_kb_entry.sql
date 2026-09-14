-- Adds a Knowledge Base reference entry to the existing "code" (Code &
-- Manufacturer Requirements) category: whether code-upgrade/building-
-- ordinance dollars are already folded into an estimate''s headline Total,
-- found by reading the actual Grand Total / Coverage recap pages of real
-- uploaded estimates (test-data claims 003, 004, 007). Behavior varies by
-- carrier/administrator - this is reporting what was found, not a rule
-- that applies to every estimate.

insert into kb_entries (id, category_id, title, tags, body)
values (
  'code-upgrade-total-inclusion-varies-by-carrier',
  'code',
  'Are Code-Upgrade Dollars Already in the Total? Check for "Paid When Incurred" (Varies by Carrier)',
  '{"code-upgrade","building-ordinance-or-law","grand-total","paid-when-incurred","usaa","reconciliation"}',
  'Whether a code-required item''s dollar amount is already counted in an estimate''s headline Total, or sitting outside it waiting to be added in separately, is not consistent across carriers - it has to be checked per file on the Grand Total / Coverage Item recap page, not assumed.

**USAA (claim-003 in test-data) - code items are a separate coverage bucket, summed into the total.** The Grand Total recap breaks the claim into coverage rows that add up to the final Total: Dwelling 24,507.14 + Dwelling - Building Ordinance or Law 0.00 + Other Structures 9,270.23 = Total 33,777.37. The math checks out - Building Ordinance or Law is structurally part of the total, it was just $0 because no code items were actually priced on that particular file.

**USAA (claim-007 in test-data) - code items existed, and were NOT in the visible Total.** This file had a "Dwelling - Code Upgrade" coverage with its own $43,700 sublimit. Inside it: "Summary for Dwelling - Code Upgrade" showed RCV $0.00, but a separate "Dwelling - Code Upgrade Paid When Incurred" line showed RCV $393.73, with "Total Paid When Incurred $393.73" confirmed further down the document. The final Grand Total page still showed "Dwelling - Code Upgrade 0.00 0.00%" and the headline Total ($25,912.08) did not include the $393.73 anywhere. That money is structured exactly like recoverable depreciation - real, available, but only paid out once repairs are actually completed and the code-required work is proven. A specialist reading only the bottom-line Total on this file would miss $393.73 entirely.

**A National Catastrophe Team-administered claim (claim-004 in test-data) - code items were folded directly into the total.** "BC-Building Codes" appeared as a normal coverage-recap line (134.33, 0.24% of the total) with no "Paid When Incurred" language, already summed into the overall Grand Total. Nothing needed to be added in separately on this one.

**What to actually do on a real file:** open the Grand Total / Coverage Item recap page (usually near the end of the estimate) and look for a "Code Upgrade," "Building Ordinance or Law," or similarly named building-code coverage line. If it has a nonzero dollar figure, check specifically for "Paid When Incurred" or "Additional Amount Available If Incurred" wording near it - that phrase is the tell that the dollar figure is being held back, the same way recoverable depreciation is held back, and is not already reflected in the bottom-line Total. If that wording is absent and the coverage line''s percentage adds up cleanly into the 100% recap, it is very likely already included.

**Source:** test-data/claim-003/estimates/original_estimate.pdf, test-data/claim-007/estimates/revised_estimate.pdf, test-data/claim-004/estimates/revised_estimate.pdf. Pulled directly from real uploaded estimate documents, not general research - carrier behavior may differ on other files or other carriers not yet reviewed.'
);
