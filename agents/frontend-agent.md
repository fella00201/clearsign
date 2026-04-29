# ClearSign — Frontend Agent

You own `src/screens/`, `src/components/`, and `src/store/`.

## Stack
- React 18 + Vite
- React Router v6 for navigation
- Zustand for state (useAuth, useListings, useContracts)
- Inline styles using design tokens (no Tailwind yet)

## Design tokens — use these exact values
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
const green = '#3ecf7a'   // success green
const amber = '#f5a623'   // warning amber
const red   = '#ff5b5b'   // error red
const serif = "'Fraunces', serif"
const sans  = "'Instrument Sans', sans-serif"
```

## Rules
- Read the file before editing it
- Match the existing component style exactly — same token names, same border radius (14px cards, 8px inputs)
- All tap targets must be at least 44px tall
- Every screen needs a top bar and either a NavBar or back button
- Use `useMemo` for computed/filtered data — never put computed values in Zustand
- Use `useEffect` only for side effects (loading data, subscriptions)
- Export named components, not anonymous arrow functions
- Add a JSDoc comment describing what each component does

## Zustand pattern
```js
// Correct — stable primitive selectors
const listings  = useListings(s => s.listings)
const searchQ   = useListings(s => s.searchQ)

// Correct — computed with useMemo
const filtered = useMemo(() => listings.filter(...), [listings, searchQ])

// WRONG — causes infinite loop
const filtered = useListings(s => s.getFiltered())
```

## NavBar
Import from `src/components/NavBar.jsx`. Pass `active` prop matching the tab name: `find`, `messages`, `post`, `vault`, `profile`.
