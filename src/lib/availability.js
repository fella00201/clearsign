// Pure, side-effect-free availability logic shared by ConfigureContract.jsx
// (pre-flight collision check before generating a contract) and the
// calendar in Listing.jsx (rendering booked/margin/blocked days). Mirrors
// the database's own guarantee in supabase/migrations/007_booking_system.sql
// + 008_booking_margin_fix.sql (the EXCLUDE constraint there is the real
// backstop — this is the fast, friendly client-side check that warns the
// user before they'd ever hit it).
//
// Margin semantics: "N-day margin" means at least N days must separate the
// end of one booking from the start of the next. This is enforced by
// projecting each booking's blocked range forward only (end + margin), never
// backward from its own start — expanding both ends would double-count the
// gap between two adjacent bookings (each side pushing margin days into the
// same gap), requiring 2×margin days of separation instead of margin days.

const ACTIVE_STATUSES = ['pending_counterparty', 'sealed']

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function daysBetween(startIso, endIso) {
  const [ay, am, ad] = startIso.split('-').map(Number)
  const [by, bm, bd] = endIso.split('-').map(Number)
  const a = Date.UTC(ay, am - 1, ad)
  const b = Date.UTC(by, bm - 1, bd)
  return Math.round((b - a) / 86400000)
}

function isActive(c) {
  return !!c.startDate && !c.endedAt && ACTIVE_STATUSES.includes(c.status)
}

// null end = unbounded ("open-ended" / "infinity")
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const aEndOk = aEnd === null || bStart <= aEnd
  const bEndOk = bEnd === null || aStart <= bEnd
  return aEndOk && bEndOk
}

/**
 * Would a candidate [start, end] booking collide with any of this listing's
 * other active contracts, once the listing's margin is applied? end === null
 * means open-ended (unbounded). Margin is applied by extending each
 * booking's end forward only (see file header) — the candidate's own start
 * is left as-is, and existing contracts' ends are pushed out by margin days.
 */
export function checkAvailability(contracts, marginDays, candidateStart, candidateEnd, excludeContractId) {
  const margin = marginDays || 0
  const candBlockedEnd = candidateEnd ? addDays(candidateEnd, margin) : null

  for (const c of (contracts || [])) {
    if (!isActive(c) || c.id === excludeContractId) continue
    const exBlockedEnd = c.endDate ? addDays(c.endDate, margin) : null
    if (rangesOverlap(candidateStart, candBlockedEnd, c.startDate, exBlockedEnd)) {
      return { available: false, conflictingContract: c }
    }
  }
  return { available: true, conflictingContract: null }
}

function classifyDay(date, activeContracts, blockedDates, margin) {
  for (const c of activeContracts) {
    if (date >= c.startDate && (c.endDate === null || c.endDate === undefined || date <= c.endDate)) {
      return { date, status: 'booked', contract: c }
    }
  }
  for (const c of activeContracts) {
    if (!c.endDate) continue
    const marginEnd = addDays(c.endDate, margin)
    if (date > c.endDate && date <= marginEnd) return { date, status: 'margin', contract: c }
  }
  for (const b of blockedDates) {
    if (date >= b.start && date <= b.end) return { date, status: 'blocked', reason: b.reason }
  }
  return { date, status: 'available' }
}

/**
 * Per-day status for one calendar month.
 * @param {Object} listing  needs bookingMarginDays, blockedDates
 * @param {Array}  contracts  this listing's contracts (any status; filtered internally)
 * @param {number} year
 * @param {number} month  0-indexed (JS Date convention)
 * @returns {Array<{date:string, status:'available'|'booked'|'margin'|'blocked', contract?, reason?}>}
 */
export function computeCalendarDays(listing, contracts, year, month) {
  const margin = listing?.bookingMarginDays || 0
  const active = (contracts || []).filter(isActive)
  const blocked = listing?.blockedDates || []

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push(classifyDay(date, active, blocked, margin))
  }
  return days
}
