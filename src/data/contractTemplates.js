// Deal-type contract templates — the reliable, default path for
// generateContract() in ../lib/contracts.js. Fixed clauses per deal type
// instead of free-form AI authoring: same deal type always produces the
// same structure, same protective terms, same notice/deposit/liability
// language. AI is never used to write a clause here — see contracts.js for
// where (and how narrowly) AI is still used.
//
// Bump TEMPLATE_VERSION whenever a template's clause wording changes —
// existing sealed contracts keep whatever version they were generated
// with (see template_id / template_version on the contracts table).

export const TEMPLATE_VERSION = 1

export const CSYM = { USD:'$',EUR:'€',GBP:'£',SEK:'kr',NOK:'kr',DKK:'kr',CHF:'Fr',CAD:'CA$',AUD:'A$',NZD:'NZ$',JPY:'¥',CNY:'¥',INR:'₹',BRL:'R$',MXN:'MX$',SGD:'S$',HKD:'HK$',ZAR:'R' }

function fmtPrice(listing) {
  if (listing.price) {
    const period = listing.price_period && listing.price_period !== 'one-time'
      ? `/${listing.price_period.replace('per ', '')}` : ''
    return `${CSYM[listing.price_currency] || '$'}${listing.price}${period}`
  }
  return listing.price_per_month || listing.price_per_day || listing.hourly_rate ||
    listing.asking_price || listing.loan_amount || listing.total_fee ||
    listing.max_budget || listing.max_rate || 'Not specified'
}

function fmtField(v) {
  return v && String(v).trim() ? v : 'Not specified'
}

function hasTag(listing, tag) {
  return (listing.tags || []).some(t => t.toLowerCase() === tag.toLowerCase())
}

function fmtDate(iso) {
  if (!iso) return 'Not specified'
  const d = new Date(`${iso}T00:00:00`)
  return isNaN(d) ? iso : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function ordinal(n) {
  n = Number(n)
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

const PAYMENT_LABELS = {
  bank_transfer: 'bank transfer',
  cash: 'cash',
  app: 'an in-app or third-party payment app',
  other: 'a method agreed between the parties',
}

const DISPUTE_LABELS = {
  direct_negotiation: 'Any dispute arising under this agreement will first be addressed through direct, good-faith negotiation between the parties.',
  mediation: 'Any dispute arising under this agreement that cannot be resolved directly will be submitted to mediation before either party pursues other remedies.',
  small_claims: 'Any dispute arising under this agreement that cannot be resolved directly may be brought in small claims court.',
}

const NOTICE_LABELS = {
  email: 'email to the address on file',
  written: 'written notice delivered in person or by mail',
  in_app: 'a message through ClearSign',
}

// Rent amount — pulled from the listing's advertised price by default, but
// overridden by a per-contract rentAmount when the parties negotiated a
// different figure via Configure Contract.
function rentAmountStr(options, listing) {
  if (options?.rentAmount) {
    const period = options.rentPeriod && options.rentPeriod !== 'one-time'
      ? `/${options.rentPeriod.replace('per ', '')}` : ''
    return `${CSYM[options.rentCurrency] || options.rentCurrency || '$'}${options.rentAmount}${period}`
  }
  return fmtPrice(listing)
}

// Only meaningful for recurring rentals (room/parking/storage) — venue/gear
// keep their own per-booking suffix wording and never call this.
function dueDaySuffix(options) {
  return options?.dueDay
    ? `, due on the ${ordinal(options.dueDay)} of each period`
    : ', due in advance for each period'
}

// Deposit — a real per-contract amount when set, falling back to the old
// tag-based "some deposit is required" wording, then to "none required".
function depositClause(options, listing, { before, after, returnDefault }) {
  if (options?.depositAmount) {
    const code = options.depositCurrency || options.rentCurrency
    const cur = CSYM[code] || code || '$'
    return `A security deposit of ${cur}${options.depositAmount} is due ${before} and will be returned within ${options.depositReturnDays || returnDefault} days of ${after}, less any deduction for damage beyond normal wear and tear.`
  }
  if (hasTag(listing, 'Deposit required')) {
    return `A security deposit is due ${before} and will be returned within ${returnDefault} days of ${after}, less any deduction for damage beyond normal wear and tear.`
  }
  return 'No security deposit is required unless separately agreed in writing.'
}

// Deterministic term/options clauses for the 5 rental deal types — built
// from the structured fields set on the ConfigureContract screen, never by
// AI. `options` is undefined for contracts created outside that screen
// (non-rental deal types, or any caller that skips it), in which case this
// falls back to `fallbackLine` so every template still reads as complete.
function termClauses(options, fallbackLine) {
  if (!options || !options.termType) return [fallbackLine]

  const lines = []
  if (options.termType === 'fixed') {
    lines.push(`This agreement runs from ${fmtDate(options.startDate)} to ${fmtDate(options.endDate)} and ends automatically on that date unless renewed by mutual agreement.`)
    if (options.autoRenew) {
      lines.push('After the end date, this agreement automatically continues on a month-to-month basis unless either party gives at least 30 days’ written notice to end it.')
    }
    if (options.earlyTerminationFee) {
      lines.push(`Either party ending this agreement before ${fmtDate(options.endDate)} agrees to pay an early termination fee of ${options.earlyTerminationFee}.`)
    }
  } else {
    lines.push(`This agreement begins on ${fmtDate(options.startDate)} and continues until either party ends it by giving at least ${options.noticePeriodDays || 30} days’ written notice.`)
  }

  if (options.prorateFirstPeriod) {
    lines.push('If the start date falls partway through a rental period, the amount due for that first period is prorated based on the number of days remaining in the period.')
  }
  if (options.paymentMethod && PAYMENT_LABELS[options.paymentMethod]) {
    lines.push(`Payment is made via ${PAYMENT_LABELS[options.paymentMethod]}.`)
  }

  if (options.petsAllowed === true)  lines.push('Pets are permitted, subject to reasonable house rules.')
  if (options.petsAllowed === false) lines.push('Pets are not permitted.')
  if (options.smokingAllowed === true)  lines.push('Smoking is permitted in designated areas only.')
  if (options.smokingAllowed === false) lines.push('Smoking is not permitted on the property.')
  if (options.sublettingAllowed === true)  lines.push('Subletting is permitted with the Landlord’s/Owner’s prior written consent.')
  if (options.sublettingAllowed === false) lines.push('Subletting is not permitted.')
  if (options.guestsAllowed === true)  lines.push('Overnight guests are permitted, subject to reasonable house rules.')
  if (options.guestsAllowed === false) lines.push('Overnight guests are not permitted without the other party’s prior consent.')
  if (options.utilitiesIncluded === true)  lines.push('Utilities are included in the rent/fee stated above.')
  if (options.utilitiesIncluded === false) lines.push('Utilities are billed separately and are not included in the rent/fee stated above.')
  if (options.quietHoursEnabled && options.quietHoursStart && options.quietHoursEnd) {
    lines.push(`Quiet hours apply from ${options.quietHoursStart} to ${options.quietHoursEnd}.`)
  }
  if (options.lateFee?.amount) {
    lines.push(`Payment not received within ${options.lateFee.graceDays || 0} days of the due date incurs a late fee of ${options.lateFee.amount}.`)
  }

  if (options.governingLaw) {
    lines.push(`This agreement is governed by the laws of ${options.governingLaw}.`)
  }
  if (options.disputeResolution && DISPUTE_LABELS[options.disputeResolution]) {
    lines.push(DISPUTE_LABELS[options.disputeResolution])
  }
  if (options.noticeDeliveryMethod && NOTICE_LABELS[options.noticeDeliveryMethod]) {
    lines.push(`Formal notices under this agreement must be given via ${NOTICE_LABELS[options.noticeDeliveryMethod]}.`)
  }

  return lines
}

function assemble({ titleLabel, today, providerName, seekerName, providerRole, seekerRole, location, clauses }) {
  const numbered = clauses.map((c, i) => `${i + 1}. ${c}`).join('\n\n')
  return [
    `${titleLabel.toUpperCase()}`,
    `Date: ${today}`,
    `PARTIES\n${providerRole}: ${providerName}\n${seekerRole}: ${seekerName}\nLocation: ${location}`,
    `TERMS\n${numbered}`,
    `DISCLAIMER\nThis is a standard-form agreement generated by ClearSign, not a substitute for legal advice. For complex or high-value situations, consult an attorney.`,
    `${providerRole.toUpperCase()} SIGNATURE\n${providerName}: _________________________ Date: [DATE SIGNED]\n\n${seekerRole.toUpperCase()} SIGNATURE\n${seekerName}: _________________________ Date: [DATE SIGNED]`,
  ].join('\n\n')
}

// ── Templates ────────────────────────────────────────────────────────────
const TEMPLATES = {
  room: (ctx) => assemble({
    ...ctx, titleLabel: 'Room Rental Agreement', providerRole: 'Landlord', seekerRole: 'Tenant',
    clauses: [
      `Rent: ${rentAmountStr(ctx.options, ctx.listing)}${dueDaySuffix(ctx.options)}.`,
      `Move-in date: ${fmtField(ctx.listing.available_from)}.`,
      depositClause(ctx.options, ctx.listing, { before: 'before move-in', after: 'move-out', returnDefault: 14 }),
      ...termClauses(ctx.options, 'Either party may end this agreement by giving at least 30 days’ written notice, or as otherwise agreed.'),
      'The Tenant agrees to keep the room in reasonable condition and report damage promptly. The Landlord agrees to keep the property safe and habitable.',
      'Utilities, bills, and shared-space rules are as described in the listing unless otherwise agreed in writing.',
    ],
  }),

  parking: (ctx) => assemble({
    ...ctx, titleLabel: 'Parking Space Rental Agreement', providerRole: 'Owner', seekerRole: 'Renter',
    clauses: [
      `Fee: ${rentAmountStr(ctx.options, ctx.listing)}${dueDaySuffix(ctx.options)}.`,
      `Available from: ${fmtField(ctx.listing.available_from)}.`,
      depositClause(ctx.options, ctx.listing, { before: 'before the start date', after: 'the end date', returnDefault: 14 }),
      'The Renter may park only the vehicle(s) agreed between the parties and must not sublet the space.',
      ...termClauses(ctx.options, 'Either party may end this agreement with at least 7 days’ written notice.'),
      'The Owner is not responsible for damage, theft, or loss affecting the Renter’s vehicle while parked.',
    ],
  }),

  storage: (ctx) => assemble({
    ...ctx, titleLabel: 'Storage Space Rental Agreement', providerRole: 'Owner', seekerRole: 'Renter',
    clauses: [
      `Fee: ${rentAmountStr(ctx.options, ctx.listing)}${dueDaySuffix(ctx.options)}.`,
      depositClause(ctx.options, ctx.listing, { before: 'before the start date', after: 'the end date', returnDefault: 14 }),
      'The Renter may store only lawful, non-hazardous, non-perishable items and must not exceed the space’s stated capacity.',
      ...termClauses(ctx.options, 'Either party may end this agreement with at least 14 days’ written notice; the Renter must remove all belongings by the end date.'),
      'The Owner is not responsible for loss or damage to stored items unless caused by the Owner’s negligence.',
    ],
  }),

  venue: (ctx) => assemble({
    ...ctx, titleLabel: 'Venue Booking Agreement', providerRole: 'Host', seekerRole: 'Renter',
    clauses: [
      `Fee: ${rentAmountStr(ctx.options, ctx.listing)} for the booked date/duration.`,
      depositClause(ctx.options, ctx.listing, { before: 'before the event', after: 'the event', returnDefault: 7 }),
      'Cancellations made at least 7 days before the booking are eligible for a full refund of any amount paid; later cancellations are non-refundable unless the Host agrees otherwise.',
      ...termClauses(ctx.options, 'The booking covers the date/duration stated above only; any extension must be agreed separately.'),
      'The Renter is responsible for the conduct of their guests and for leaving the venue in the condition it was received.',
    ],
  }),

  gear: (ctx) => assemble({
    ...ctx, titleLabel: 'Equipment Rental Agreement', providerRole: 'Owner', seekerRole: 'Renter',
    clauses: [
      `Fee: ${rentAmountStr(ctx.options, ctx.listing)} for the rental period.`,
      depositClause(ctx.options, ctx.listing, { before: 'at pickup', after: 'return of the equipment', returnDefault: 7 }),
      'The Renter is responsible for loss, theft, or damage to the equipment while in their possession, normal wear and tear excepted.',
      ...termClauses(ctx.options, 'The equipment must be returned by the agreed return date and time; late returns may incur an additional daily fee.'),
    ],
  }),

  babysit: (ctx) => assemble({
    ...ctx, titleLabel: 'Childcare Services Agreement', providerRole: 'Caregiver', seekerRole: 'Parent/Guardian',
    clauses: [
      `Rate: ${fmtPrice(ctx.listing)}.`,
      `Schedule: ${fmtField(ctx.listing.availability)}.`,
      'The Parent/Guardian will provide emergency contact information, relevant medical/allergy details, and any house rules before the first booking.',
      'The Caregiver agrees to supervise the child(ren) at all times and to contact the Parent/Guardian immediately in the event of an emergency.',
      'Either party may cancel a scheduled booking by giving as much notice as reasonably possible; repeated late cancellations may end the arrangement.',
    ],
  }),

  cleaning: (ctx) => assemble({
    ...ctx, titleLabel: 'Cleaning Services Agreement', providerRole: 'Cleaner', seekerRole: 'Client',
    clauses: [
      `Rate: ${fmtPrice(ctx.listing)}.`,
      `Frequency: ${fmtField(ctx.listing.frequency)}.`,
      'The scope of work (rooms/areas covered, tasks included) is as described in the listing unless otherwise agreed in writing.',
      'The Client will provide reasonable access to the property at the agreed time. The Cleaner will use reasonable care and report any pre-existing damage before starting work.',
      'Either party may cancel a scheduled visit with at least 24 hours’ notice without charge; later cancellations may incur a fee.',
    ],
  }),

  tutoring: (ctx) => assemble({
    ...ctx, titleLabel: 'Tutoring Services Agreement', providerRole: 'Tutor', seekerRole: 'Student/Guardian',
    clauses: [
      `Rate: ${fmtPrice(ctx.listing)}.`,
      `Subject: ${fmtField(ctx.listing.subject)}.`,
      'Sessions will be scheduled by mutual agreement between the parties.',
      'Either party may cancel a scheduled session with at least 24 hours’ notice without charge; later cancellations may incur a fee.',
      'Either party may end this arrangement at any time by giving reasonable notice to the other.',
    ],
  }),

  petcare: (ctx) => assemble({
    ...ctx, titleLabel: 'Pet Care Services Agreement', providerRole: 'Pet Sitter', seekerRole: 'Pet Owner',
    clauses: [
      `Rate: ${fmtPrice(ctx.listing)}.`,
      'The Pet Owner will provide feeding instructions, medical/behavioral notes, and emergency/vet contact information before the booking begins.',
      'The Pet Sitter agrees to provide reasonable care and supervision and to contact the Pet Owner promptly if the pet becomes ill or injured.',
      'The Pet Owner remains responsible for veterinary costs arising during the booking, except where caused by the Pet Sitter’s negligence.',
    ],
  }),

  handyman: (ctx) => assemble({
    ...ctx, titleLabel: 'Handyman Services Agreement', providerRole: 'Handyman', seekerRole: 'Client',
    clauses: [
      `Fee: ${fmtPrice(ctx.listing)}.`,
      'The scope of work is as described in the listing and any additional terms agreed between the parties before work begins.',
      'Unless stated otherwise, the Client will supply or pay for materials; the Handyman will supply labor and tools.',
      'The Handyman will carry out work with reasonable skill and care and will inform the Client promptly of any issue discovered during the job.',
      'Either party may cancel a scheduled job with at least 24 hours’ notice without charge.',
    ],
  }),

  car: (ctx) => assemble({
    ...ctx, titleLabel: 'Vehicle Sale Agreement', providerRole: 'Seller', seekerRole: 'Buyer',
    clauses: [
      `Price: ${fmtPrice(ctx.listing)}.`,
      'The vehicle is sold as described in the listing, "as-is," with no warranty express or implied beyond what the Seller has stated in writing.',
      'The Seller confirms they are the legal owner (or authorized to sell) and will transfer title/ownership documentation to the Buyer at the time of sale.',
      'The Buyer is responsible for inspecting the vehicle (or arranging an independent inspection) before completing payment.',
      'Payment is due in full before the vehicle and its documentation are handed over, unless otherwise agreed in writing.',
    ],
  }),

  goods: (ctx) => assemble({
    ...ctx, titleLabel: 'Sale of Goods Agreement', providerRole: 'Seller', seekerRole: 'Buyer',
    clauses: [
      `Price: ${fmtPrice(ctx.listing)}.`,
      'The item(s) are sold as described in the listing, "as-is," with no warranty beyond what the Seller has stated in writing.',
      'The Buyer is responsible for inspecting the item(s) before completing payment where collection/inspection is possible before sale.',
      'Payment is due in full before or at the point of collection/delivery, unless otherwise agreed in writing.',
    ],
  }),

  loan: (ctx) => assemble({
    ...ctx, titleLabel: 'Personal Loan Agreement', providerRole: 'Lender', seekerRole: 'Borrower',
    clauses: [
      `Principal amount: ${fmtPrice(ctx.listing)}.`,
      hasTag(ctx.listing, 'Interest free')
        ? 'This loan is interest-free.'
        : 'Interest terms (if any) are as separately agreed between the parties in writing; if none are stated, the loan is treated as interest-free.',
      `Repayment due by: ${fmtField(ctx.listing.repay_by)}.`,
      'The Borrower agrees to repay the full principal (plus any agreed interest) by the repayment date above.',
      'If repayment is late, the parties will discuss a revised schedule in good faith before pursuing any other remedy.',
    ],
  }),

  freelance: (ctx) => assemble({
    ...ctx, titleLabel: 'Freelance Services Agreement', providerRole: 'Freelancer', seekerRole: 'Client',
    clauses: [
      `Fee: ${fmtPrice(ctx.listing)}.`,
      'The scope of work and deliverables are as described in the listing and any additional terms agreed between the parties before work begins.',
      'Unless otherwise agreed, payment is due on completion and delivery of the agreed work; for larger projects the parties may agree to milestone payments.',
      'Ownership of the final deliverables transfers to the Client upon full payment, unless otherwise agreed in writing.',
      'Either party may end this agreement by giving written notice; the Client remains liable for any work already completed up to that point.',
    ],
  }),
}

// Human-readable names for the small-print "Template: X · vN" shown on the
// Contract screen — keep in sync with each template's titleLabel above.
export const TEMPLATE_LABELS = {
  room: 'Room Rental Agreement',
  parking: 'Parking Space Rental Agreement',
  storage: 'Storage Space Rental Agreement',
  venue: 'Venue Booking Agreement',
  gear: 'Equipment Rental Agreement',
  babysit: 'Childcare Services Agreement',
  cleaning: 'Cleaning Services Agreement',
  tutoring: 'Tutoring Services Agreement',
  petcare: 'Pet Care Services Agreement',
  handyman: 'Handyman Services Agreement',
  car: 'Vehicle Sale Agreement',
  goods: 'Sale of Goods Agreement',
  loan: 'Personal Loan Agreement',
  freelance: 'Freelance Services Agreement',
}

function genericTemplate(ctx) {
  return assemble({
    ...ctx, titleLabel: `${ctx.listing.title || 'Agreement'}`, providerRole: 'Provider', seekerRole: 'Seeker',
    clauses: [
      `Fee: ${fmtPrice(ctx.listing)}.`,
      'The terms of this agreement are as described in the listing.',
      'Both parties agree to act in good faith and to communicate promptly if either side needs to change or end the arrangement.',
    ],
  })
}

// seek_* subcats are the same deal type from the other side — same template.
export const SEEK_TO_DEAL_TYPE = {
  seek_room:     'room',
  seek_babysit:  'babysit',
  seek_cleaning: 'cleaning',
  seek_parking:  'parking',
  seek_tutor:    'tutoring',
}

export function resolveTemplate(subcat) {
  const dealType = SEEK_TO_DEAL_TYPE[subcat] ?? subcat
  return { dealType, render: TEMPLATES[dealType] ?? genericTemplate }
}
