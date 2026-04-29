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
```js
const bg    = '#0d0d11'   // page background
const bg2   = '#141418'   // card background
const bg3   = '#1e1e26'   // input background
const bg4   = '#27272f'   // subtle surface
const bdr   = '#2a2a36'   // border
const bdr2  = '#3a3a4c'   // hover border
const text  = '#eeedf5'   // primary text
const t2    = '#9896b2'   // secondary text
const t3    = '#56546c'   // tertiary text
const acc   = '#5b8fff'   // accent blue
const acc2  = '#3d6ee0'   // accent blue hover
const accbg = '#141f3c'   // accent background
const green = '#3ecf7a'   // success
const amber = '#f5a623'   // warning
const red   = '#ff5b5b'   // error
const serif = "'Fraunces', serif"
const sans  = "'Instrument Sans', sans-serif"
```

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
