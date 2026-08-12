// Human-readable before/after diff between two contract `options` snapshots
// — used to show "clearly see the changes done" when one party proposes a
// revision to the other. Field-level, not text diffing, since options is
// the structured source of truth the contract text is generated from.

import { CSYM } from '../data/contractTemplates'

function fmtTri(v) {
  return v === true ? 'Allowed' : v === false ? 'Not allowed' : 'Not specified'
}

function fmtTerm(v) {
  return v === 'open_ended' ? 'Open-ended' : 'Fixed dates'
}

function fmtLateFee(lf) {
  if (!lf?.amount) return 'None'
  return `${lf.amount} (grace period: ${lf.graceDays ?? 0} day${lf.graceDays === 1 ? '' : 's'})`
}

function fmtMoney(v) {
  return v ? String(v) : 'None'
}

function fmtRent(options) {
  if (!options?.rentAmount) return 'Listing price'
  const period = options.rentPeriod && options.rentPeriod !== 'one-time' ? `/${options.rentPeriod}` : ''
  return `${CSYM[options.rentCurrency] || options.rentCurrency || '$'}${options.rentAmount}${period}`
}

const PAYMENT_METHOD_LABELS = { bank_transfer: 'Bank transfer', cash: 'Cash', app: 'Payment app', other: 'Other' }
const DISPUTE_RESOLUTION_LABELS = { direct_negotiation: 'Direct negotiation', mediation: 'Mediation', small_claims: 'Small claims court' }
const NOTICE_METHOD_LABELS = { email: 'Email', written: 'Written', in_app: 'In-app message' }

const FIELDS = [
  ['termType',             'Term type',                fmtTerm],
  ['startDate',            'Start date',                v => v || '—'],
  ['endDate',              'End date',                  v => v || '—'],
  ['noticePeriodDays',     'Notice period (days)',      v => v ?? '—'],
  ['rent',                 'Rent',                      (v, o) => fmtRent(o)],
  ['dueDay',               'Rent due day',               v => v || 'Not specified'],
  ['prorateFirstPeriod',   'Prorate first period',       v => v ? 'On' : 'Off'],
  ['paymentMethod',        'Payment method',             v => PAYMENT_METHOD_LABELS[v] || 'Not specified'],
  ['depositAmount',        'Security deposit',           fmtMoney],
  ['depositReturnDays',    'Deposit return window (days)', v => v || 'Not specified'],
  ['petsAllowed',          'Pets',                       fmtTri],
  ['smokingAllowed',       'Smoking',                    fmtTri],
  ['sublettingAllowed',    'Subletting',                 fmtTri],
  ['guestsAllowed',        'Overnight guests',           fmtTri],
  ['utilitiesIncluded',    'Utilities included',         fmtTri],
  ['quietHoursEnabled',    'Quiet hours',                 (v, o) => v && o.quietHoursStart && o.quietHoursEnd ? `${o.quietHoursStart}–${o.quietHoursEnd}` : 'Off'],
  ['autoRenew',            'Auto-renew',                v => v ? 'On' : 'Off'],
  ['earlyTerminationFee',  'Early termination fee',      fmtMoney],
  ['lateFee',              'Late payment fee',           fmtLateFee],
  ['governingLaw',         'Governing law',              v => v || 'Not specified'],
  ['disputeResolution',    'Dispute resolution',         v => DISPUTE_RESOLUTION_LABELS[v] || 'Not specified'],
  ['noticeDeliveryMethod', 'Notice delivery',            v => NOTICE_METHOD_LABELS[v] || 'Not specified'],
]

/**
 * Compare two `options` objects field-by-field and return only the fields
 * that actually changed, each with a plain-English label and formatted
 * before/after values.
 * @param {Object|null|undefined} prev
 * @param {Object|null|undefined} next
 * @returns {Array<{key: string, label: string, before: string, after: string}>}
 */
export function diffOptions(prev, next) {
  if (!prev || !next) return []
  const changes = []
  for (const [key, label, fmt] of FIELDS) {
    const before = fmt(prev[key], prev)
    const after  = fmt(next[key], next)
    if (before !== after) changes.push({ key, label, before, after })
  }
  return changes
}
