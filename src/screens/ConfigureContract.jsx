import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useContracts } from '../store/useContracts'
import { generateContract } from '../lib/contracts'
import { fetchContractsByListing, fetchListingById } from '../lib/supabase'
import { checkAvailability, addDays, daysBetween } from '../lib/availability'
import { diffOptions } from '../lib/contractDiff'
import { CSYM } from '../data/contractTemplates'
import { bg, bg2, bg3, bdr, text, t2, t3, acc, red, redbg, green, sans, serif } from '../theme'

const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
// Local calendar date, not UTC — toISOString() would read the wrong day for
// part of the day in any timezone ahead of UTC (e.g. shows "yesterday" at
// 1am in UTC+2).
const _now = new Date()
const TODAY = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: t2,
  textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6,
}

const inputCss = {
  width: '100%', background: bg3, border: `1px solid ${bdr}`, borderRadius: 8,
  padding: '11px 13px', fontSize: 14, fontFamily: sans, color: text,
  outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none',
}

// Small "?" icon that reveals a plain-language explanation on hover (desktop)
// or tap (touch) — for options like "grace period" whose meaning isn't
// obvious from the label alone.
function InfoTip({ text: tipText }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="More info"
        style={{
          width: 15, height: 15, borderRadius: '50%', border: `1px solid ${t3}`, background: 'transparent',
          color: t3, fontSize: 9.5, fontWeight: 700, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, fontFamily: sans,
        }}
      >
        ?
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', bottom: '135%', left: 0,
            background: text, color: bg2, fontSize: 11.5, lineHeight: 1.45, padding: '8px 10px',
            borderRadius: 8, width: 210, zIndex: 20, boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
            fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', fontFamily: sans,
          }}
        >
          {tipText}
        </div>
      )}
    </span>
  )
}

function Field({ label, children, hint, info }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}{info && <InfoTip text={info} />}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: t3, marginTop: 5 }}>{hint}</div>}
    </div>
  )
}

function TriToggle({ label, value, onChange, info, labels }) {
  const [unsetLabel, onLabel, offLabel] = labels || ['Not specified', 'Allowed', 'Not allowed']
  const opts = [[unsetLabel, null], [onLabel, true], [offLabel, false]]
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}{info && <InfoTip text={info} />}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        {opts.map(([text_, val]) => {
          const on = value === val
          return (
            <button
              key={text_} type="button" onClick={() => onChange(val)}
              style={{
                flex: 1, padding: '9px 6px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${on ? acc : bdr}`, background: on ? `${acc}18` : bg3,
                color: on ? acc : t2, cursor: 'pointer', fontFamily: sans,
              }}
            >
              {text_}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Section({ title, children, info }) {
  return (
    <div style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center' }}>
        {title}{info && <InfoTip text={info} />}
      </div>
      {children}
    </div>
  )
}

function newId(len = 12) {
  return Math.random().toString(36).slice(2, len)
}

function notifyOtherParty({ otherEmail, contractId, listingId, title, body }) {
  try {
    const notifKey = `cs_notifs_${otherEmail}`
    const existing = JSON.parse(localStorage.getItem(notifKey) || '[]')
    const notif = {
      id: Math.random().toString(36).slice(2, 10), type: 'contract_request',
      title, body, at: new Date().toISOString(), read: false, contractId, listingId,
    }
    localStorage.setItem(notifKey, JSON.stringify([notif, ...existing]))
  } catch {}
}

export default function ConfigureContract() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth(s => s.user)
  const myContracts = useContracts(s => s.contracts)
  const loadContracts = useContracts(s => s.loadContracts)
  const saveContract = useContracts(s => s.saveContract)
  const reviseContract = useContracts(s => s.reviseContract)

  const {
    listing: listingFromState, listingId, otherName, otherEmail, otherColor,
    editingContract, threadId,
  } = location.state || {}

  const isEditing = !!editingContract

  // Creation is handed the full listing object already; "suggest changes"
  // (from Contract.jsx) only has listingId, so resolve it here — same
  // Supabase-then-local-cache fallback used elsewhere in the app.
  const [listing, setListing] = useState(listingFromState || null)
  const [listingLoading, setListingLoading] = useState(!listingFromState && !!listingId)

  useEffect(() => {
    if (listingFromState || !listingId) return
    fetchListingById(listingId).then(l => { setListing(l); setListingLoading(false) }).catch(() => {
      try {
        const local = JSON.parse(localStorage.getItem('cs_listings_user') || '[]')
        setListing(local.find(l => l.id === listingId) || null)
      } catch { setListing(null) }
      setListingLoading(false)
    })
  }, [listingFromState, listingId])

  // Seed from the contract being revised, else the listing's default rental
  // terms (set by the owner when posting) — everything below stays fully
  // editable, this is only a starting point.
  const seed = editingContract?.options || listing?.defaultOptions || {}
  const hasSeed = Object.keys(seed).length > 0

  const [listingContracts, setListingContracts] = useState([])
  const [reuseId, setReuseId] = useState('')
  const [termType, setTermType] = useState(seed.termType || 'fixed')
  const [startDate, setStartDate] = useState(editingContract?.startDate || TODAY)
  const [endDate, setEndDate] = useState(editingContract?.endDate || '')
  const [noticePeriodDays, setNoticePeriodDays] = useState(seed.noticePeriodDays || 30)
  const [petsAllowed, setPetsAllowed] = useState(seed.petsAllowed ?? null)
  const [smokingAllowed, setSmokingAllowed] = useState(seed.smokingAllowed ?? null)
  const [sublettingAllowed, setSublettingAllowed] = useState(seed.sublettingAllowed ?? null)
  const [lateFeeEnabled, setLateFeeEnabled] = useState(!!seed.lateFee?.amount)
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState(seed.lateFee?.graceDays || 5)
  const [lateFeeAmount, setLateFeeAmount] = useState(seed.lateFee?.amount ? String(seed.lateFee.amount) : '')
  const [autoRenew, setAutoRenew] = useState(!!seed.autoRenew)
  const [earlyTerminationFee, setEarlyTerminationFee] = useState(seed.earlyTerminationFee ? String(seed.earlyTerminationFee) : '')
  const [rentAmount, setRentAmount] = useState(seed.rentAmount ? String(seed.rentAmount) : (listingFromState?.price || ''))
  const [rentCurrency, setRentCurrency] = useState(seed.rentCurrency || listingFromState?.price_currency || 'USD')
  const [rentPeriod, setRentPeriod] = useState(seed.rentPeriod || listingFromState?.price_period || 'monthly')
  const [dueDay, setDueDay] = useState(seed.dueDay || '')
  const [prorateFirstPeriod, setProrateFirstPeriod] = useState(!!seed.prorateFirstPeriod)
  const [paymentMethod, setPaymentMethod] = useState(seed.paymentMethod || '')
  const [depositAmount, setDepositAmount] = useState(seed.depositAmount ? String(seed.depositAmount) : '')
  const [depositReturnDays, setDepositReturnDays] = useState(seed.depositReturnDays || 14)
  const [guestsAllowed, setGuestsAllowed] = useState(seed.guestsAllowed ?? null)
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(seed.utilitiesIncluded ?? null)
  const [utilitiesResponsibility, setUtilitiesResponsibility] = useState(seed.utilitiesResponsibility || '')
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(!!seed.quietHoursEnabled)
  const [quietHoursStart, setQuietHoursStart] = useState(seed.quietHoursStart || '22:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState(seed.quietHoursEnd || '08:00')
  const [governingLaw, setGoverningLaw] = useState(seed.governingLaw || '')
  const [disputeResolution, setDisputeResolution] = useState(seed.disputeResolution || '')
  const [noticeDeliveryMethod, setNoticeDeliveryMethod] = useState(seed.noticeDeliveryMethod || '')
  const [additionalRules, setAdditionalRules] = useState(seed.additionalRules || '')
  const [generating, setGenerating] = useState(false)

  useEffect(() => { if (user?.email) loadContracts(user.email) }, [loadContracts, user?.email])

  useEffect(() => {
    if (!listing?.id || !UUID_RE.test(listing.id)) return
    fetchContractsByListing(listing.id).then(setListingContracts).catch(() => {})
  }, [listing?.id])

  const reuseCandidates = (() => {
    if (!listing?.id || isEditing) return []
    const mine = myContracts.filter(c => c.creatorEmail === user?.email && c.termType)
    const sameListing = mine.filter(c => c.listingId === listing.id)
    const rest = mine.filter(c => c.listingId !== listing.id)
    return [...sameListing, ...rest].slice(0, 10)
  })()

  if (listingLoading) {
    return (
      <div style={{ flex: 1, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t2, fontFamily: sans, fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  if (!listing || !otherEmail) {
    navigate('/', { replace: true })
    return null
  }

  function applyReuse(id) {
    setReuseId(id)
    const prev = reuseCandidates.find(c => c.id === id)
    if (!prev) return
    setTermType(prev.termType || 'fixed')
    if (prev.termType === 'fixed' && prev.startDate && prev.endDate) {
      const duration = daysBetween(prev.startDate, prev.endDate)
      setStartDate(TODAY)
      setEndDate(addDays(TODAY, duration))
    } else {
      setStartDate(TODAY)
      setNoticePeriodDays(prev.noticePeriodDays || 30)
    }
    const o = prev.options || {}
    setPetsAllowed(o.petsAllowed ?? null)
    setSmokingAllowed(o.smokingAllowed ?? null)
    setSublettingAllowed(o.sublettingAllowed ?? null)
    setAutoRenew(!!o.autoRenew)
    setEarlyTerminationFee(o.earlyTerminationFee ? String(o.earlyTerminationFee) : '')
    if (o.lateFee?.amount) {
      setLateFeeEnabled(true)
      setLateFeeGraceDays(o.lateFee.graceDays || 5)
      setLateFeeAmount(String(o.lateFee.amount))
    } else {
      setLateFeeEnabled(false)
    }
    if (o.rentAmount) setRentAmount(String(o.rentAmount))
    setRentCurrency(o.rentCurrency || rentCurrency)
    setRentPeriod(o.rentPeriod || rentPeriod)
    setDueDay(o.dueDay || '')
    setProrateFirstPeriod(!!o.prorateFirstPeriod)
    setPaymentMethod(o.paymentMethod || '')
    setDepositAmount(o.depositAmount ? String(o.depositAmount) : '')
    setDepositReturnDays(o.depositReturnDays || 14)
    setGuestsAllowed(o.guestsAllowed ?? null)
    setUtilitiesIncluded(o.utilitiesIncluded ?? null)
    setUtilitiesResponsibility(o.utilitiesResponsibility || '')
    setQuietHoursEnabled(!!o.quietHoursEnabled)
    setQuietHoursStart(o.quietHoursStart || '22:00')
    setQuietHoursEnd(o.quietHoursEnd || '08:00')
    setGoverningLaw(o.governingLaw || '')
    setDisputeResolution(o.disputeResolution || '')
    setNoticeDeliveryMethod(o.noticeDeliveryMethod || '')
    setAdditionalRules(o.additionalRules || '')
  }

  const candidateEnd = termType === 'fixed' ? endDate : null
  const canCheck = termType === 'fixed' ? !!(startDate && endDate) : !!startDate
  // Exclude the contract being revised from its own collision check —
  // otherwise it would always appear to conflict with itself.
  const collisionContracts = isEditing
    ? listingContracts.filter(c => c.id !== editingContract.id)
    : listingContracts
  const availability = canCheck
    ? checkAvailability(collisionContracts, listing.bookingMarginDays, startDate, candidateEnd)
    : { available: true, conflictingContract: null }

  const readyToGenerate = canCheck && availability.available &&
    (termType === 'fixed' ? endDate > startDate : noticePeriodDays > 0)

  const liveOptions = {
    termType, startDate,
    endDate: termType === 'fixed' ? endDate : null,
    noticePeriodDays: termType === 'open_ended' ? Number(noticePeriodDays) : null,
    petsAllowed, smokingAllowed, sublettingAllowed,
    autoRenew: termType === 'fixed' ? autoRenew : false,
    earlyTerminationFee: termType === 'fixed' && earlyTerminationFee ? Number(earlyTerminationFee) : null,
    lateFee: lateFeeEnabled && lateFeeAmount ? { graceDays: Number(lateFeeGraceDays), amount: Number(lateFeeAmount) } : null,
    rentAmount: rentAmount ? Number(rentAmount) : null,
    rentCurrency, rentPeriod,
    dueDay: dueDay ? Number(dueDay) : null,
    prorateFirstPeriod,
    paymentMethod: paymentMethod || null,
    depositAmount: depositAmount ? Number(depositAmount) : null,
    depositReturnDays: Number(depositReturnDays) || 14,
    guestsAllowed, utilitiesIncluded,
    utilitiesResponsibility: utilitiesIncluded === false ? (utilitiesResponsibility || null) : null,
    quietHoursEnabled, quietHoursStart, quietHoursEnd,
    governingLaw: governingLaw.trim() || null,
    disputeResolution: disputeResolution || null,
    noticeDeliveryMethod: noticeDeliveryMethod || null,
    additionalRules: additionalRules.trim() || null,
  }
  const liveDiff = isEditing ? diffOptions(editingContract.options, liveOptions) : []

  async function handleGenerate() {
    if (!readyToGenerate || generating) return
    setGenerating(true)
    try {
      const options = liveOptions
      const { contractText, templateId, templateVersion } = await generateContract(listing, user.name, otherName, options)

      if (isEditing) {
        const revised = await reviseContract(editingContract.id, {
          options, contractText, templateId, templateVersion,
          byEmail: user.email, byName: user.name,
        })
        notifyOtherParty({
          otherEmail, contractId: revised.id, listingId: listing.id,
          title: 'Contract terms updated',
          body: `${user.name} proposed changes to the contract for: "${listing.title}"`,
        })
        navigate(`/contract/${revised.id}`, { state: { threadId } })
        return
      }

      const doc = {
        id: newId(),
        listingId: listing.id,
        listingTitle: listing.title,
        contractText, templateId, templateVersion,
        termType: options.termType, startDate: options.startDate, endDate: options.endDate,
        noticePeriodDays: options.noticePeriodDays, options,
        status: 'pending_counterparty',
        creatorEmail: user.email, creatorName: user.name, creatorColor: user.avatarColor, creatorRole: 'provider',
        counterpartyEmail: otherEmail, counterpartyName: otherName, counterpartyColor: otherColor, counterpartyRole: 'seeker',
        createdAt: new Date().toISOString(),
      }
      const saved = await saveContract(doc)
      notifyOtherParty({
        otherEmail, contractId: saved.id, listingId: listing.id,
        title: 'New contract request',
        body: `${user.name} sent you a contract for: "${listing.title}"`,
      })
      navigate(`/contract/${saved.id}`, { state: { threadId } })
    } catch {
      setGenerating(false)
    }
  }

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: sans, fontSize: 15, color: text }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{isEditing ? 'Suggest changes' : 'Configure contract'}</div>
        <div style={{ width: 44 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 24px' }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: text, marginBottom: 4 }}>
          {listing.title}
        </div>
        <div style={{ fontSize: 13, color: t2, marginBottom: hasSeed ? 8 : 20 }}>
          With {otherName} · {isEditing ? 'propose changed terms' : 'before this contract is generated'}
        </div>

        {isEditing ? (
          <div style={{ fontSize: 12, color: t3, marginBottom: 20, lineHeight: 1.5 }}>
            Editing the current terms — {otherName} will see exactly what changed and can accept, sign, or propose further changes.
          </div>
        ) : hasSeed && (
          <div style={{ fontSize: 12, color: t3, marginBottom: 20, lineHeight: 1.5 }}>
            Pre-filled from this listing's default terms — adjust anything below to match what you and {otherName} actually agree on.
          </div>
        )}

        {reuseCandidates.length > 0 && (
          <Section title="Start from a previous contract">
            <select
              value={reuseId}
              onChange={e => applyReuse(e.target.value)}
              style={{ ...inputCss, cursor: 'pointer', appearance: 'none' }}
            >
              <option value="">Start fresh</option>
              {reuseCandidates.map(c => (
                <option key={c.id} value={c.id}>
                  {c.listingTitle} — {c.termType === 'fixed' ? `${c.startDate} → ${c.endDate}` : 'open-ended'}
                </option>
              ))}
            </select>
          </Section>
        )}

        <Section title="Rent & payment">
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Rent</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={rentCurrency} onChange={e => setRentCurrency(e.target.value)} style={{ ...inputCss, flexShrink: 0, width: 90, cursor: 'pointer', appearance: 'none' }}>
                {Object.keys(CSYM).map(code => <option key={code} value={code}>{code} {CSYM[code]}</option>)}
              </select>
              <input type="number" min="0" placeholder="0" value={rentAmount} onChange={e => setRentAmount(e.target.value)} style={{ ...inputCss, flex: 1 }} />
              <select value={rentPeriod} onChange={e => setRentPeriod(e.target.value)} style={{ ...inputCss, flexShrink: 0, width: 120, cursor: 'pointer', appearance: 'none' }}>
                {[['hourly', 'Per hour'], ['daily', 'Per day'], ['weekly', 'Per week'], ['monthly', 'Per month'], ['one-time', 'One-time']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Field
                label="Due day (optional)"
                hint="Day of the period rent is due, e.g. 1."
                info="Which day of each billing period the rent must be paid by, e.g. 1 means the 1st of every month. Leave blank if there's no fixed due day (e.g. a one-off booking fee)."
              >
                <input type="number" min="1" max="31" placeholder="e.g. 1" value={dueDay} onChange={e => setDueDay(e.target.value)} style={inputCss} />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Payment method">
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...inputCss, cursor: 'pointer', appearance: 'none' }}>
                  <option value="">Not specified</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="app">Payment app</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <input type="checkbox" id="prorate" checked={prorateFirstPeriod} onChange={e => setProrateFirstPeriod(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="prorate" style={{ fontSize: 13, color: text, cursor: 'pointer' }}>Prorate first period if start date is mid-period</label>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Field label="Security deposit (optional)">
                <input type="number" min="0" placeholder="Leave blank for none" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} style={inputCss} />
              </Field>
            </div>
            {depositAmount && (
              <div style={{ flex: 1 }}>
                <Field label="Returned within (days)">
                  <input type="number" min="0" value={depositReturnDays} onChange={e => setDepositReturnDays(e.target.value)} style={inputCss} />
                </Field>
              </div>
            )}
          </div>
        </Section>

        <Section title="Term" info="Fixed dates lock in an exact end date, like a lease. Open-ended keeps the rental going indefinitely until either side gives the required notice to end it.">
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['fixed', 'Fixed dates'], ['open_ended', 'Open-ended']].map(([val, lbl]) => {
              const on = termType === val
              return (
                <button
                  key={val} type="button" onClick={() => setTermType(val)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${on ? acc : bdr}`, background: on ? `${acc}18` : bg3,
                    color: on ? acc : t2, cursor: 'pointer', fontFamily: sans,
                  }}
                >
                  {lbl}
                </button>
              )
            })}
          </div>

          <Field label="Start date">
            <input type="date" min={TODAY} value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputCss, colorScheme: 'light' }} />
          </Field>

          {termType === 'fixed' ? (
            <Field label="End date">
              <input type="date" min={startDate} value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputCss, colorScheme: 'light' }} />
            </Field>
          ) : (
            <Field label="Notice period to end (days)" hint="How many days' notice either side must give to end this rental.">
              <input type="number" min="1" value={noticePeriodDays} onChange={e => setNoticePeriodDays(e.target.value)} style={inputCss} />
            </Field>
          )}

          {!availability.available && (
            <div style={{ background: redbg, border: `1px solid ${red}55`, borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: red, lineHeight: 1.5 }}>
              These dates overlap an existing contract on this listing
              {availability.conflictingContract ? ` (${availability.conflictingContract.startDate} → ${availability.conflictingContract.endDate || 'open-ended'})` : ''}.
              {listing.bookingMarginDays > 0 ? ` A ${listing.bookingMarginDays}-day margin is required between bookings.` : ''}
            </div>
          )}
        </Section>

        <Section title="Optional terms" info="Leave any of these as “Not specified” to leave it unaddressed in the contract — only set one if you want it explicitly allowed or forbidden.">
          <TriToggle label="Pets" value={petsAllowed} onChange={setPetsAllowed} />
          <TriToggle label="Smoking" value={smokingAllowed} onChange={setSmokingAllowed} />
          <TriToggle label="Subletting" value={sublettingAllowed} onChange={setSublettingAllowed} info="Whether the tenant is allowed to rent out the room/space to someone else during their stay." />
          <TriToggle label="Overnight guests" value={guestsAllowed} onChange={setGuestsAllowed} />
          <TriToggle
            label="Utilities included"
            value={utilitiesIncluded}
            onChange={v => { setUtilitiesIncluded(v); if (v !== false) setUtilitiesResponsibility('') }}
            labels={['Not specified', 'Included', 'Not included']}
            info="Whether electricity, water, internet, and similar bills are included in the rent, or billed separately. If billed separately, you can specify below whose job it is to pay them."
          />
          {utilitiesIncluded === false && (
            <div style={{ marginBottom: 14, marginTop: -6 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>Who pays the utility bills?</label>
              <select value={utilitiesResponsibility} onChange={e => setUtilitiesResponsibility(e.target.value)} style={{ ...inputCss, cursor: 'pointer', appearance: 'none' }}>
                <option value="">Not specified</option>
                <option value="tenant">Tenant/Renter</option>
                <option value="landlord">Landlord/Owner</option>
                <option value="split">Split between both</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: quietHoursEnabled ? 10 : 14 }}>
            <input type="checkbox" id="quiethours" checked={quietHoursEnabled} onChange={e => setQuietHoursEnabled(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="quiethours" style={{ fontSize: 13, color: text, cursor: 'pointer' }}>Quiet hours</label>
            <InfoTip text="Hours during which noise (loud music, parties, etc.) should be kept to a minimum, e.g. 22:00 to 08:00 overnight." />
          </div>
          {quietHoursEnabled && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
              <input type="time" value={quietHoursStart} onChange={e => setQuietHoursStart(e.target.value)} style={{ ...inputCss, flex: 1, colorScheme: 'light' }} />
              <span style={{ color: t3, fontSize: 12 }}>to</span>
              <input type="time" value={quietHoursEnd} onChange={e => setQuietHoursEnd(e.target.value)} style={{ ...inputCss, flex: 1, colorScheme: 'light' }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: lateFeeEnabled ? 10 : 0 }}>
            <input type="checkbox" id="latefee" checked={lateFeeEnabled} onChange={e => setLateFeeEnabled(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="latefee" style={{ fontSize: 13, color: text, cursor: 'pointer' }}>Late payment fee</label>
            <InfoTip text="Charges the tenant an extra fee if a payment is late, after the grace period below has passed." />
          </div>
          {lateFeeEnabled && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Grace period (days)<InfoTip text="How many days after the due date the tenant has before the late fee applies. E.g. rent due the 1st with a 5-day grace period means the fee only kicks in from the 6th onward." /></label>
                <input type="number" min="0" value={lateFeeGraceDays} onChange={e => setLateFeeGraceDays(e.target.value)} style={inputCss} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Fee amount</label>
                <input type="number" min="0" placeholder="e.g. 25" value={lateFeeAmount} onChange={e => setLateFeeAmount(e.target.value)} style={inputCss} />
              </div>
            </div>
          )}

          {termType === 'fixed' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input type="checkbox" id="autorenew" checked={autoRenew} onChange={e => setAutoRenew(e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="autorenew" style={{ fontSize: 13, color: text, cursor: 'pointer' }}>Auto-renew month-to-month after end date</label>
                <InfoTip text="If neither side ends the contract by the end date, it automatically keeps going on a month-to-month basis until either party gives 30 days' notice to stop." />
              </div>
              <Field
                label="Early termination fee (optional)"
                info="A fee either party agrees to pay if they end the contract before the agreed end date. Leave blank if you don't want one."
              >
                <input type="number" min="0" placeholder="Leave blank for none" value={earlyTerminationFee} onChange={e => setEarlyTerminationFee(e.target.value)} style={inputCss} />
              </Field>
            </>
          )}
        </Section>

        <Section title="Legal (optional)">
          <Field
            label="Governing law"
            hint="e.g. the State of Texas, USA — leave blank to omit."
            info="Which region's laws apply if there's ever a legal dispute — normally wherever the rental property is located. This only matters if things go wrong; most rentals never need it."
          >
            <input type="text" placeholder="Leave blank to omit" value={governingLaw} onChange={e => setGoverningLaw(e.target.value)} style={inputCss} />
          </Field>
          <Field
            label="Dispute resolution"
            info="How the two of you agree to try to resolve a disagreement. Direct negotiation means just talking it out; mediation brings in a neutral third party; small claims court is the formal legal route for smaller amounts."
          >
            <select value={disputeResolution} onChange={e => setDisputeResolution(e.target.value)} style={{ ...inputCss, cursor: 'pointer', appearance: 'none' }}>
              <option value="">Not specified</option>
              <option value="direct_negotiation">Direct negotiation</option>
              <option value="mediation">Mediation</option>
              <option value="small_claims">Small claims court</option>
            </select>
          </Field>
          <Field
            label="Notice delivery method"
            info="How official notices — like ending the contract or a late-payment warning — must be delivered to count as valid under this agreement."
          >
            <select value={noticeDeliveryMethod} onChange={e => setNoticeDeliveryMethod(e.target.value)} style={{ ...inputCss, cursor: 'pointer', appearance: 'none' }}>
              <option value="">Not specified</option>
              <option value="email">Email</option>
              <option value="written">Written (in person or by mail)</option>
              <option value="in_app">In-app message</option>
            </select>
          </Field>
          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Additional rules (optional)</label>
            <textarea
              rows={3} placeholder="Any other rules or terms you want in writing — e.g. no smoking on the balcony, shared laundry schedule…"
              value={additionalRules} onChange={e => setAdditionalRules(e.target.value)}
              style={{ ...inputCss, resize: 'vertical', fontFamily: sans }}
            />
          </div>
        </Section>

        {isEditing && liveDiff.length > 0 && (
          <Section title={`What you're changing (${liveDiff.length})`}>
            {liveDiff.map(d => (
              <div key={d.key} style={{ fontSize: 12.5, marginBottom: 8, lineHeight: 1.5 }}>
                <span style={{ color: t2, fontWeight: 600 }}>{d.label}: </span>
                <span style={{ color: red, textDecoration: 'line-through' }}>{d.before}</span>
                {' → '}
                <span style={{ color: green, fontWeight: 600 }}>{d.after}</span>
              </div>
            ))}
          </Section>
        )}
      </div>

      <div style={{ padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button
          onClick={handleGenerate}
          disabled={!readyToGenerate || generating}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 14, borderRadius: 14, border: 'none',
            background: green, color: bg2, fontSize: 14, fontWeight: 700,
            opacity: (!readyToGenerate || generating) ? 0.45 : 1,
            cursor: (!readyToGenerate || generating) ? 'default' : 'pointer',
            fontFamily: sans, transition: 'opacity 0.18s',
          }}
        >
          {generating ? 'Sending…' : isEditing ? 'Send proposed changes →' : 'Generate contract →'}
        </button>
      </div>
    </div>
  )
}
