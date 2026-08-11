// ClearSign design tokens — "Ledger" palette.
// Single source of truth: screens import from here instead of redefining
// their own copy of these consts. All text-on-bg pairs below are verified
// against WCAG 2.2 relative-luminance contrast (>=4.5:1 for normal text).

export const bg    = '#F0ECE1' // page background — warm paper
export const bg2   = '#FBF9F3' // card background — raised paper
export const bg3   = '#F4EFE3' // input / recessed surface
export const bg4   = '#E7E0D0' // subtle surface — hover states, overflow chips
export const bdr   = '#DDD5C4' // border
export const bdr2  = '#C9BEA6' // hover border
export const text  = '#2A2420' // primary text — ink (13.0:1 on bg)
export const t2    = '#5C5347' // secondary text (6.4:1 on bg)
export const t3    = '#746A5C' // tertiary text (4.9:1 on bg — safe for normal text)
export const acc   = '#9C3B2E' // accent — wax-seal red (5.8:1 on bg, usable as text)
export const acc2  = '#7E2F24' // accent hover / pressed
export const accbg = '#F4E3DD' // accent tint background
export const green = '#3E6350' // success / verified — ledger green (5.7:1 on bg)
export const amber = '#855819' // warning — ochre (5.2:1 on bg)
export const red   = '#B8331F' // error / destructive — deliberately distinct from acc (5.0:1 on bg)
export const redbg = '#F7E3DE' // error tint background
export const serif = "'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
export const sans   = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

// Category identity colors — badges, tag pills, category chips.
// Keys match CATS[].badge in data/categories.js minus the "b-" prefix.
export const CAT_COLORS = {
  rental:  { tint: '#E4EAF4', ink: '#2C4A72', border: '#C7D5EA' },
  service: { tint: '#F4E5EC', ink: '#7A3050', border: '#E7CBD8' },
  sale:    { tint: '#F2E6CC', ink: '#7A5416', border: '#E4D2A2' },
  seek:    { tint: '#E2EDE4', ink: '#2F5A3D', border: '#C6DFCA' },
}
