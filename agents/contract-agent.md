# ClearSign — Contract AI Agent

You own the contract generation logic in `src/lib/contracts.js`, the templates in
`src/data/contractTemplates.js`, and the AI assistant system prompt in `src/App.jsx`.

## Contract generation model — template-first, AI-polish-only

Contracts are **not** free-form AI output. `generateContract()` always renders a
fixed template for the listing's deal type first — same deal type always
produces the same clause structure, same protective terms, same
notice/deposit/liability language. This is deliberate: consistent, reviewable
clauses are worth more than a fresh AI essay per contract, and it removes the
risk of hallucinated legal terms in anything that matters.

AI has exactly one job here: turn the listing's own free-text `description`
into a short "Additional terms" paragraph appended after the template. It
**never** authors, rewrites, or is asked to opine on a core clause (payment,
deposit, cancellation, liability, notice period — those all live in the
template). If the AI call fails or is skipped, the contract is already
complete without that paragraph — nothing about contract generation should
ever depend on an AI call succeeding.

## Editing templates

- Templates live in `src/data/contractTemplates.js`, one function per *deal
  type* (`room`, `babysit`, `loan`, etc. — see `TEMPLATES`). The `seek_*`
  listing subcats reuse the matching provider template via
  `SEEK_TO_DEAL_TYPE` — don't add separate templates for them.
- Every template uses the shared `assemble()` helper: title, parties block,
  numbered clauses, disclaimer, signature blocks. Keep that structure —
  UPPERCASE section headers, numbered clauses, plain English, protective
  terms for both parties, signature blocks with `[DATE SIGNED]` placeholders.
- If you change a template's clause wording, bump `TEMPLATE_VERSION` at the
  top of the file. Existing sealed contracts keep the `template_id` /
  `template_version` they were generated with (see `Contract.jsx`'s
  small-print attribution) — never rewrite a template in place in a way that
  would silently change what an already-sealed contract's clauses "mean."
- Keep `TEMPLATE_LABELS` (human-readable names shown on the Contract screen)
  in sync with each template's `titleLabel`.
- `genericTemplate` is the defensive fallback for any subcat without a
  dedicated template — it should stay minimal but always produce a valid,
  complete contract.

## The AI-polish step (`polishAdditionalTerms` in `contracts.js`)

- System prompt must instruct the model to only restate details already
  present in the description — never invent prices, dates, policies, or
  obligations that aren't there.
- Wrap the call in try/catch; on failure, return `''` and let the contract
  ship without the "Additional terms" section. Never block or fail contract
  generation because this call failed.
- Keep `max_tokens` small (this is a 1-3 sentence summary, not a document).

## Data integrity (see migration `006_contract_integrity.sql`)

Once a contract's `status` is `sealed`, the database itself rejects any
further update to it (contract text, signatures, status — everything) via a
trigger, and rejects sealing unless both `creator_signed_at` and
`counterparty_signed_at` are already set. Don't write app code that assumes
you can "fix up" a sealed contract after the fact — you can't, by design.
Reversing that would require an explicit, separate migration decision, not a
one-off app change.

## AI assistant system prompt

```
You are the ClearSign assistant. ClearSign is a marketplace where people 
post rentals, services and gigs and sign AI-generated contracts.

Help users:
- Find listings (explain search and tag filters)
- Post their own listing (explain the 3-step wizard)
- Understand contracts (explain the signing flow)
- Navigate the app (explain each tab)

Keep answers SHORT — 2-4 sentences maximum.
Be friendly and direct. Never make up specific listings or prices.
```

## Rules

- Never hallucinate legal facts, in the template or the AI-polish step.
- Always include both party names from the actual data.
- The template path must never be blank or produce an error screen — it has
  no external dependency (no API call), so this should never fail in
  practice; treat any failure there as a bug, not something to add a
  fallback for.
- Test that long listing descriptions don't cause the AI-polish prompt to
  exceed `max_tokens`.
