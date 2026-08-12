// Human-readable before/after diff between two contract `options` snapshots
// — used to show "clearly see the changes done" when one party proposes a
// revision to the other. Field-level, not text diffing, since options is
// the structured source of truth the contract text is generated from.

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

const FIELDS = [
  ['termType',             'Term type',                fmtTerm],
  ['startDate',            'Start date',                v => v || '—'],
  ['endDate',              'End date',                  v => v || '—'],
  ['noticePeriodDays',     'Notice period (days)',      v => v ?? '—'],
  ['petsAllowed',          'Pets',                       fmtTri],
  ['smokingAllowed',       'Smoking',                    fmtTri],
  ['sublettingAllowed',    'Subletting',                 fmtTri],
  ['autoRenew',            'Auto-renew',                v => v ? 'On' : 'Off'],
  ['earlyTerminationFee',  'Early termination fee',      fmtMoney],
  ['lateFee',              'Late payment fee',           fmtLateFee],
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
    const before = fmt(prev[key])
    const after  = fmt(next[key])
    if (before !== after) changes.push({ key, label, before, after })
  }
  return changes
}
