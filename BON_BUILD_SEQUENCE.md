# BON AI Build Sequence

Scope: Steps 1–3 from the corrected roadmap — scope audit agent, lead-to-supplement pipeline, daily digest. All of it runs on the existing stack (Vite + React, Supabase, Netlify Background Functions, Resend) against the existing five-table schema plus the new `leads` table. No new frameworks, no orchestration layer, no vector DB.

Companion doc to CLAUDE.md. Each phase below is scoped to be buildable in disciplined Claude Code sessions with a testable deliverable at the end of each.

---

## Phase 0 — Discipline first (already planned, do not skip)

Update CLAUDE.md before any build session:

- Testing rules: every Netlify function gets a local invocation test before commit (`netlify dev` + curl fixture). No function ships untested.
- Commit discipline: one function or one migration per commit. No "misc fixes" commits.
- Surgical-edit rule: Claude Code must use targeted edits, never rewrite whole files. (This is the Base44 failure mode — encode it explicitly.)
- Schema-change rule: all schema changes go through a numbered SQL migration file committed to the repo. Never mutate the Supabase dashboard directly.
- Compliance rule (new — add this): any AI-generated text that will be seen by a carrier, adjuster, or homeowner must pass the human QA gate. AI output stays in technical scope documentation. No coverage-opinion language. This mirrors the attorney-cleared operating model and belongs in CLAUDE.md so every session inherits it.

---

## Phase A — Scope Audit Agent (finish what's in flight)

### A1. Schema additions

Two migrations:

**`audits` table** (don't overload `supplements` — an audit exists before a supplement does, and some audits won't convert):

```sql
create table audits (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references claims(id),
  lead_id uuid references leads(id),        -- nullable; audits can originate from either
  status text not null default 'queued',    -- queued | parsing | analyzing | findings_ready | failed
  estimate_pdf_path text,                   -- Supabase Storage path
  photos_paths text[],
  carrier text,
  parsed_estimate jsonb,                    -- normalized line items from the Xactimate PDF
  findings jsonb,                           -- array of {rule_id, tier, line_item, shortfall_type, est_value, confidence, rationale}
  est_total_recovery numeric,
  reviewed_by text,                          -- human QA sign-off, null until reviewed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**`audit_rules` table** — encode the workbook, don't hardcode it:

```sql
create table audit_rules (
  id text primary key,                      -- e.g. 'ridge_cap_three_tab'
  tier int not null,                        -- 1/2/3 from the workbook
  category text,                            -- roofing | elevation | code | quantity | unit_count
  carrier_filter text[],                    -- null = all carriers; else applies to listed carriers
  region_filter jsonb,                      -- e.g. {"state":"CO","min_elevation_ft":6000} for I&W barrier gates
  detection_prompt text not null,           -- the rule expressed as an instruction to the model
  reference_value numeric,                  -- typical recovery value for prioritization
  active boolean default true
);
```

Seeding the rules table IS the moat-transfer step: three-tab-as-ridge-cap, Farmers/Foremost leanness patterns, CO elevation ice & water gates, quantity shorts, unit-count misses (garage door pattern from Nuessle). Each row is one rule from the Tier 1/2/3 workbook. First seed migration should cover Tier 1 only; Tiers 2–3 follow after Tier 1 is validated end-to-end.

### A2. Storage

Supabase Storage bucket `claim-docs` with RLS. Path convention: `{contractor_id}/{claim_id}/{audit_id}/estimate.pdf` and `/photos/*`. Upload happens client-side via signed URLs; the function never handles multipart uploads.

### A3. The audit function

One Netlify Background Function: `audit-run.ts`. Triggered by an insert into `audits` (client calls the function with the audit id after upload completes — simpler and more debuggable than DB webhooks at this stage).

Internal sequence (all in one function; these are steps, not "agents"):

1. **Fetch + parse.** Pull the PDF from Storage. Extract text; Xactimate PDFs are text-layer PDFs, so straight extraction works — no OCR dependency for v1. Normalize into line items: `{code, description, qty, unit, unit_price, rcv}`. Store as `parsed_estimate`. Set status `analyzing`.
2. **Rule pass.** Load active `audit_rules` filtered by carrier and region. Batch rules into one model call (or a few, grouped by category) with the parsed estimate + rules as context. Ask for JSON findings only: rule hit/miss, affected line items, estimated value, confidence, one-line rationale. Photos go in as image inputs for rules that need them (e.g., ridge cap verification) — but photo-dependent rules can be Tier 2, keep v1 estimate-only if it accelerates shipping.
3. **Write findings.** Store `findings` jsonb, compute `est_total_recovery`, set status `findings_ready`, `updated_at` now.
4. **Notify.** Resend email to the reviewing human (you): "Audit ready — {address} — est. ${X} recoverable — {n} findings." Link into the CRM audit view.

Failure path: any step that throws sets status `failed` with the error captured in a `error_detail` column. Never silent-fail.

**Model prompt compliance guard:** the system prompt for step 2 instructs the model to frame every finding as scope/quantity/code documentation — pricing and measurement facts only. Explicitly forbid coverage-opinion phrasing ("the carrier should cover," "this is owed"). This makes the attorney-cleared boundary structural, not just procedural.

### A4. CRM audit view

React route in the BOS CRM: audit list (Realtime subscription on `audits`) + detail view showing findings table with per-finding accept/reject toggles and a "Reviewed" action that stamps `reviewed_by`. Accepted findings become the supplement worksheet — which feeds Phase B.

### A5. Validation gate before Phase B

Re-run the Nuessle matched pair through the pipeline. Target: the agent surfaces the quantity short + garage door unit-count miss (~$5K) without being told. If it does, Tier 1 rules are validated and the pipeline is trustworthy enough to put paying-lead traffic through. If not, fix rules before building anything downstream.

---

## Phase B — Lead-to-Supplement Pipeline

### B1. Status machine (single source of truth)

Add `status` to `leads` and standardize `supplements.status`. The full journey:

```
lead: new → contacted → qualified → converted | dead
audit: queued → parsing → analyzing → findings_ready → failed
supplement: drafting → qa_review → submitted → carrier_response → approved | partial | denied → invoiced → paid
```

Every status transition is written by exactly one function or one UI action. No transition happens in two places. Document the owner of each transition in a comment block at the top of the migration.

### B2. Intake endpoint

Netlify function `lead-intake.ts` (regular function, not background — it's fast):

- POST from the supplement audit landing page. Fields: contractor name, company, phone, email, market, est. monthly claim volume, plus honeypot field + basic rate limit by IP.
- Insert into `leads` with status `new`, source tag (`meta_stl`, `angi_vgr`, `organic`, etc. — source attribution from day one, you'll want CAC by channel).
- Resend: instant notification to you, and an auto-reply to the lead confirming receipt with the fee structure one-liner ($375/$600/$950 flat fee — the flat-fee framing is a compliance asset, put it in writing early and every time).
- Realtime pushes the new lead into the CRM leads board.

### B3. Lead → claim → audit conversion

CRM UI action, not automation: "Convert lead." Creates/links `contractors` row, creates `claims` row, opens the upload flow (signed URL to `claim-docs`), inserts `audits` row, fires `audit-run`. One click from qualified lead to running audit. Keep conversion human-triggered — you're qualifying fit and compliance posture on the call anyway.

### B4. Supplement drafting function

`supplement-draft.ts` (background function). Triggered from the audit detail view once findings are reviewed and accepted:

1. Input: accepted findings + parsed estimate + claim context.
2. Model call produces the supplement package draft: itemized added/adjusted line items with quantities and justification language (technical scope documentation framing, same compliance system prompt as the audit agent).
3. Output lands in `supplements` with status `qa_review` — never `submitted`. The QA gate is structural: there is no code path from draft to submitted without a human action stamping the record.
4. Resend notification: "Supplement draft ready for QA — {claim}."

You edit/approve in the CRM, then mark `submitted` manually (submission itself stays manual for now — carrier portals aren't worth automating yet).

### B5. Follow-up automation (the 20% that makes fees mostly margin)

Scheduled Netlify function `supplement-followups.ts`, daily:

- Supplements in `submitted` > 7 days with no carrier response → draft follow-up email to the contractor (they nudge the adjuster — BON works under contractor identity, so follow-ups route through the contractor, consistent with the operating model), queue in `actions` for your one-click send.
- Supplements `approved` but not `invoiced` → reminder to invoice.
- Invoices > 30 days → collections reminder into `actions`.

Nothing sends autonomously. Everything is drafted and queued; you approve. Autonomy can be earned per-action-type later once error rates are known.

### B6. Economics instrumentation

Add `fee_charged`, `recovered_amount`, `time_spent_min` to `supplements`. From supplement #1, you're accumulating the dataset that proves the model: fee vs. recovery vs. your hours. This is also the raw material for the daily digest and, eventually, the contractor-facing ROI reporting that sells the service.

---

## Phase C — Daily Digest

One scheduled function `daily-digest.ts`, weekday mornings:

1. Queries (plain SQL, no AI needed for retrieval):
   - New leads yesterday, by source
   - Leads in `new`/`contacted` > 48h (going stale)
   - Audits `findings_ready` awaiting review
   - Supplements in `qa_review`
   - Supplements `submitted` > 7 days (aging)
   - Approved-not-invoiced; invoices > 30 days
   - Reminders due today; overdue `actions`
   - Rolling 30-day: audits run, supplements submitted, total est. recovery identified, fees invoiced
2. One model call: compose the digest from the query results. Prompt for prioritized, terse, no-fluff output — lead with the three things that most need action today.
3. Resend to your inbox.

Build cost: a weekend once Phase B has data flowing. This is the seed of the "Executive Agent" — same queries later power a contractor-facing version, which becomes a genuine platform feature. But it starts as your own morning email.

---

## Build order and session plan

| # | Deliverable | Depends on | Est. effort |
|---|------------|------------|-------------|
| 0 | CLAUDE.md update (testing, commits, compliance rule) | — | 1 session |
| 1 | Migrations: `audits`, `audit_rules`, leads status/source, storage bucket | 0 | 1 session |
| 2 | Tier 1 rule seed migration | 1 | 1 session (mostly your workbook transcription) |
| 3 | `audit-run.ts` parse step + fixture test on a real Xactimate PDF | 1 | 1–2 sessions |
| 4 | `audit-run.ts` rule pass + findings write + Resend notify | 2, 3 | 1–2 sessions |
| 5 | CRM audit list/detail view with review actions | 4 | 1–2 sessions |
| 6 | **Nuessle validation gate** | 5 | half session — go/no-go |
| 7 | `lead-intake.ts` + landing page wire-up + leads board | 1 | 1 session |
| 8 | Convert-lead flow (contractor/claim/audit creation + upload) | 5, 7 | 1 session |
| 9 | `supplement-draft.ts` + QA view | 6 | 1–2 sessions |
| 10 | `supplement-followups.ts` scheduled | 9 | 1 session |
| 11 | Economics columns + capture in QA flow | 9 | half session |
| 12 | `daily-digest.ts` | 10, 11 | 1 session |

Items 7 can run in parallel with 3–6 if you want the St. Louis landing page capturing leads before the audit agent is finished — leads can sit in the board and be audited manually until item 6 passes.

## What deliberately isn't here

- No LangGraph/CrewAI/orchestrator — one background function per job, shared state in Postgres. Revisit only when two functions genuinely need to hand work to each other mid-run.
- No vector DB — data is relational; pgvector is already in Supabase if semantic search over SOPs ever matters.
- No voice/reception agent — commodity, and not the moat.
- No autonomous sending — every external-facing artifact passes the human QA gate. Loosen per action type only with error-rate data.
- No multi-tenant platform features — the schema choices above (contractor_id in paths, rules table, status machine) keep the door open without building it now.
