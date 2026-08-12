import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useContracts } from '../store/useContracts'
import { generateContract } from '../lib/contracts'
import { fetchContractsByListing } from '../lib/supabase'
import { checkAvailability, addDays, daysBetween } from '../lib/availability'
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

function TriToggle({ label, value, onChange, info }) {
  const opts = [['Not specified', null], ['Allowed', true], ['Not allowed', false]]
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

export default function ConfigureContract() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth(s => s.user)
  const myContracts = useContracts(s => s.contracts)
  const loadContracts = useContracts(s => s.loadContracts)
  const saveContract = useContracts(s => s.saveContract)

  const { listing, otherName, otherEmail, otherColor } = location.state || {}

  const [listingContracts, setListingContracts] = useState([])
  const [reuseId, setReuseId] = useState('')
  const [termType, setTermType] = useState('fixed')
  const [startDate, setStartDate] = useState(TODAY)
  const [endDate, setEndDate] = useState('')
  const [noticePeriodDays, setNoticePeriodDays] = useState(30)
  const [petsAllowed, setPetsAllowed] = useState(null)
  const [smokingAllowed, setSmokingAllowed] = useState(null)
  const [sublettingAllowed, setSublettingAllowed] = useState(null)
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false)
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState(5)
  const [lateFeeAmount, setLateFeeAmount] = useState('')
  const [autoRenew, setAutoRenew] = useState(false)
  const [earlyTerminationFee, setEarlyTerminationFee] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => { if (user?.email) loadContracts(user.email) }, [loadContracts, user?.email])

  useEffect(() => {
    if (!listing?.id || !UUID_RE.test(listing.id)) return
    fetchContractsByListing(listing.id).then(setListingContracts).catch(() => {})
  }, [listing?.id])

  const reuseCandidates = (() => {
    if (!listing?.id) return []
    const mine = myContracts.filter(c => c.creatorEmail === user?.email && c.termType)
    const sameListing = mine.filter(c => c.listingId === listing.id)
    const rest = mine.filter(c => c.listingId !== listing.id)
    return [...sameListing, ...rest].slice(0, 10)
  })()

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
  }

  const candidateEnd = termType === 'fixed' ? endDate : null
  const canCheck = termType === 'fixed' ? !!(startDate && endDate) : !!startDate
  const availability = canCheck
    ? checkAvailability(listingContracts, listing.bookingMarginDays, startDate, candidateEnd)
    : { available: true, conflictingContract: null }

  const readyToGenerate = canCheck && availability.available &&
    (termType === 'fixed' ? endDate > startDate : noticePeriodDays > 0)

  async function handleGenerate() {
    if (!readyToGenerate || generating) return
    setGenerating(true)
    try {
      const options = {
        termType, startDate,
        endDate: termType === 'fixed' ? endDate : null,
        noticePeriodDays: termType === 'open_ended' ? Number(noticePeriodDays) : null,
        petsAllowed, smokingAllowed, sublettingAllowed,
        autoRenew: termType === 'fixed' ? autoRenew : false,
        earlyTerminationFee: termType === 'fixed' && earlyTerminationFee ? Number(earlyTerminationFee) : null,
        lateFee: lateFeeEnabled && lateFeeAmount ? { graceDays: Number(lateFeeGraceDays), amount: Number(lateFeeAmount) } : null,
      }

      const { contractText, templateId, templateVersion } = await generateContract(listing, user.name, otherName, options)
      const doc = {
        id: Math.random().toString(36).slice(2, 12),
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
      try {
        const notifKey = `cs_notifs_${otherEmail}`
        const existing = JSON.parse(localStorage.getItem(notifKey) || '[]')
        const notif = {
          id: Math.random().toString(36).slice(2, 10), type: 'contract_request',
          title: 'New contract request', body: `${user.name} sent you a contract for: "${listing.title}"`,
          at: new Date().toISOString(), read: false, contractId: saved.id, listingId: listing.id,
        }
        localStorage.setItem(notifKey, JSON.stringify([notif, ...existing]))
      } catch {}
      navigate(`/contract/${saved.id}`)
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
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Configure contract</div>
        <div style={{ width: 44 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 24px' }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: text, marginBottom: 4 }}>
          {listing.title}
        </div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 20 }}>
          With {otherName} · before this contract is generated
        </div>

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
          {generating ? 'Generating…' : 'Generate contract →'}
        </button>
      </div>
    </div>
  )
}
