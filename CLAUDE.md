# ClearSign — Project Guide for AI Agents

## What is ClearSign
A marketplace app where people post rentals, services and gigs, message each other, and sign AI-generated contracts. Built with React + Vite frontend and Supabase backend.

## Stack
- **Frontend:** React 18 + Vite, React Router v6, Zustand, inline styles
- **Backend:** Supabase (Postgres + Auth + Realtime + Edge Functions)
- **AI:** Anthropic Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Hosting:** Vercel (auto-deploys on push to main)
- **CI/CD:** GitHub Actions

## Key file locations
```
src/
  screens/        — one file per screen (Auth, Discover, Listing, etc.)
  components/     — reusable UI (NavBar)
  store/          — Zustand stores (useAuth, useListings, useContracts)
  lib/            — supabase.js, anthropic.js, contracts.js
  data/           — categories.js (CATS, TAGS), seed.js
agents/           — AI agent system prompts
supabase/
  migrations/     — SQL schema files
  functions/      — Edge Functions (Deno)
.github/
  workflows/      — CI/CD and agent automation
```

## Screens already built
- Auth — signup / signin (localStorage, Supabase migration pending)
- Discover — listing feed, search, category chips, tag filters, alert banner
- Listing — detail view, tags, reviews, message + contract buttons
- PostListing — 3-step wizard (category → subtype → fields + tags)
- Messages — thread list
- Chat — individual conversation
- Contract — view contract, sign button
- Signing — canvas signature pad
- Sealed — success screen with review prompt
- Vault — contract history
- Notifications — pending signatures + notification feed
- Profile — my listings, sign out
- Review — star rating + text, verified badge
- AlertSetup — manage location alerts
- AI Assistant — floating chat panel in App.jsx

## Design tokens — always use these exact values

**Source of truth is `src/theme.js` — import tokens from there, do not redefine
them locally in a screen file.** ("Ledger" palette: warm paper + ink, adopted
2026-08 to replace the original all-dark scheme.)

```js
import { bg, bg2, bg3, bg4, bdr, bdr2, text, t2, t3, acc, acc2, accbg, green, amber, red, redbg, serif, sans, CAT_COLORS } from '../theme'

// bg    #F0ECE1   page background — warm paper
// bg2   #FBF9F3   card background — raised paper
// bg3   #F4EFE3   input / recessed surface
// bg4   #E7E0D0   subtle surface — hover states, overflow chips
// bdr   #DDD5C4   border
// bdr2  #C9BEA6   hover border
// text  #2A2420   primary text — ink
// t2    #5C5347   secondary text
// t3    #746A5C   tertiary text
// acc   #9C3B2E   accent — wax-seal red
// acc2  #7E2F24   accent hover / pressed
// accbg #F4E3DD   accent tint background
// green #3E6350   success / verified — ledger green
// amber #855819   warning — ochre
// red   #B8331F   error / destructive (kept visually distinct from acc)
// redbg #F7E3DE   error tint background
// serif "'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
// sans  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
```

All text-on-`bg` pairs above are verified >=4.5:1 WCAG contrast — don't
substitute an ad-hoc lighter tone for "subtle" text; use `t3`, it already
passes.

`CAT_COLORS` (`rental` / `service` / `sale` / `seek`, each `{ tint, ink, border }`)
holds the per-category identity colors used for badges, tag pills, and
category chips — see `src/data/categories.js` for how `TAGS` consumes them.

### Migration status
Migration to the Ledger palette is complete — every screen and component
imports its tokens from `src/theme.js`. There should be no local hardcoded
color consts left; if you find one, replace it with an import from `../theme`
rather than leaving the old dark hex values in place. Status/tint colors
that don't have a direct token (e.g. a "signed" or "pending" badge) are
built from the nearest existing token with an alpha suffix (e.g. `` `${green}22` ``
for background, `` `${green}55` `` for border) rather than inventing new hex
values — see Contract.jsx or Vault.jsx for the pattern.

## State management pattern
```js
// CORRECT — stable primitive selectors + useMemo
const listings = useListings(s => s.listings)
const searchQ  = useListings(s => s.searchQ)
const filtered = useMemo(() => listings.filter(...), [listings, searchQ])

// WRONG — causes infinite re-render loop
const filtered = useListings(s => s.getFiltered())
```

## Current data layer
All data uses localStorage with these key patterns:
- `cs_user` — active session
- `cs_profile_{email}` — user profiles
- `cs_listings_user` — user-posted listings
- `cs_contracts` — all contracts
- `cs_threads` — message threads
- `cs_notifs_{email}` — notifications
- `cs_reviews_{listingId}` — reviews

**Supabase migration is pending** — do not remove localStorage logic yet.

## Agent rules
- Read every file before editing it
- Commit after writing each file — do not wait until the end
- Never modify more than 5 files per session
- If a task needs 6+ files, stop, commit what is done, and comment on the issue explaining what remains
- Never hardcode colors — use the design tokens above
- Never put computed/filtered values in Zustand — use useMemo in the component
- All tap targets must be at least 44px tall
- Every screen needs a topbar and either NavBar or back button

## Token budget rules
- Small task (1-2 files): complete in one session
- Medium task (3-5 files): commit between subtasks
- Large task (6+ files): split into separate GitHub Issues, comment on original issue with the breakdown

## How to run locally
```bash
npm run dev          # start dev server at localhost:5173
npm run build        # production build
git add . && git commit -m "message" && git push   # deploy to Vercel
```

## How to trigger agents
Create a GitHub Issue with a plain English description. The orchestrator agent reads it, plans the work, implements it, and opens a PR. Security and review agents run automatically on every PR.
