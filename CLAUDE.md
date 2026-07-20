# BOS CRM — Project Rules for Claude Code

## What this project is
A supplement operations CRM for BON (Business Office Network). BON writes
insurance supplements for roofing/restoration contractors. This CRM tracks
contractor clients, their claims, and each supplement through the pipeline
from intake to paid.

The owner (Keri) is a P&C-licensed insurance agent and Xactimate expert.
She is NOT a developer. Explain changes in plain language. Never assume
she will debug code herself.

## Hard rules — never violate these
1. NEVER rewrite an entire file when a small edit will do. Make surgical,
   targeted changes only. (This is the Base44 failure mode — the system
   this CRM replaced was lost to exactly this kind of uncontrolled
   full-file rewriting. Never repeat it.)
2. NEVER touch code unrelated to the current request.
3. After every working change: run the app locally, verify it works,
   then `git commit` with a clear message. Small commits, always.
4. NEVER delete or restructure database tables without explicitly asking
   first. Data preservation is the #1 priority — this replaced a system
   that lost work.
5. One feature per session/request. If asked for multiple things, do them
   one at a time, verifying each before moving on.
6. If something breaks, revert to the last working commit first, then
   diagnose. Never pile fixes on top of broken code.
7. Every schema change goes through a numbered SQL migration file
   committed to the repo (/supabase/migrations). Never make an ad-hoc
   change in the Supabase dashboard that isn't captured in a migration
   file first — the migration file is the source of truth, the dashboard
   SQL editor is just how it gets applied.

## Stack
- Frontend: Vite + React, plain CSS or Tailwind (pick one early, stay consistent)
- Backend: Supabase (PostgreSQL) — existing project, do not create a new one
- Hosting: Netlify, auto-deploy from GitHub main branch
- No other frameworks, no state management libraries unless truly needed

## Code organization
- Small files. One component per file. No file over ~300 lines.
- /src/components — UI components
- /src/pages — one file per screen (Dashboard, Contractors, Jobs, Pipeline, Settings)
- /src/lib/supabase.js — the ONLY place database credentials and client live
- /src/lib/queries.js — all database read/write functions live here, named clearly

## Environment / secrets
- Supabase URL and anon key go in a `.env` file, never hardcoded
- `.env` is in `.gitignore`, always

## v1 scope — do not build beyond this
1. Contractors (client companies): name, contacts, phone, email, market
   (MO / WI / other), pricing tier, status, notes
2. Claims/Jobs: linked to contractor — property address, homeowner name,
   carrier, claim #, adjuster name/contact, date of loss
3. Supplements: linked to claim — pipeline stage (Intake → Docs Received →
   Reviewed → Supplement Written → Submitted → Carrier Response →
   Approved → Paid → Invoiced → Closed), dollar fields (original estimate
   RCV, supplement requested, supplement approved, BON fee), dates for
   each stage change, notes
4. Next actions: simple task per supplement with due date
5. Dashboard: pipeline counts, dollars in each stage, overdue actions
6. CSV export button for contractors, claims, and supplements (data escape
   hatch — this is required in v1)

## Explicitly OUT of scope for v1 (do not build even if it seems helpful)
Calendar, HR/pay, sales board, client portal, mobile app, e-signature,
material orders, labor tickets, integrations (EagleView, QuickBooks,
storm data, etc.), multi-company/franchise permissions. These come later.

## Data migration
Existing data lives in a Supabase project with a 22-table schema
(bos_supabase_schema.sql) and possibly in a Base44 CRM. Before building
new tables, ASK which existing data needs to come over, then write a
one-time migration script. Do not silently drop old tables.

## Compliance Rules
- Any AI-generated text that will be seen by a carrier, adjuster, or
  homeowner must pass a human QA gate before it goes out. There is no
  code path from AI-drafted to submitted/sent without a human action
  stamping the record first.
- AI output stays in technical scope documentation: line items,
  quantities, code requirements, measurements. No coverage-opinion
  language — never phrase findings as "the carrier should cover" or
  "this is owed." This mirrors BON's attorney-cleared operating model
  and applies everywhere, not just in one feature.

## Testing & Verification Rules

- Every pipeline stage must be a standalone script runnable from the
  command line with a test input before it is wired into anything else.
- Every Netlify function gets a local invocation test before commit
  (`netlify dev` + a curl fixture, or equivalent). No function ships
  untested.
- No feature is "done" until it has been run against the truth-set data
  in /test-data and the output has been shown to me for verification.
- Never claim code works without running it. If you cannot run it,
  say so explicitly.
- When a test fails, fix the failing code only. Do not refactor,
  "improve," or touch unrelated files while fixing a bug.
- Extraction outputs (line items, totals, metadata) must pass
  reconciliation math before being written to the database. Failures
  set status = 'manual_review', never silently proceed.

## Commit Discipline

- Commit after every working, tested unit. One logical change per commit.
- One function or one migration per commit. No "misc fixes" commits.
- Commit messages state what changed and why in one line.
- Never commit code that fails its own test.
- Before starting a new stage, confirm the previous stage is committed
  and its test passes.

## Session Scope

- One pipeline stage per session. When it's tested and committed,
  stop and summarize. Do not start the next stage unprompted.