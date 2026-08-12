import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListings } from '../store/useListings'
import { useAuth } from '../store/useAuth'
import { CATS, TAGS } from '../data/categories'
import { supabase } from '../lib/supabase'
import { bg, bg2, bg3, bdr, bdr2, text, t2, t3, acc, accbg, red, sans, serif } from '../theme'

// ── Listing field config ────────────────────────────────────────────────────
const LISTING_FIELDS = {
  room:          ['title', 'location', 'price', 'available_from', 'description'],
  parking:       ['title', 'location', 'price', 'available_from', 'description'],
  storage:       ['title', 'location', 'price', 'description'],
  venue:         ['title', 'location', 'price', 'description'],
  gear:          ['title', 'location', 'price', 'description'],
  babysit:       ['title', 'location', 'price', 'availability', 'description'],
  cleaning:      ['title', 'location', 'price', 'frequency', 'description'],
  tutoring:      ['title', 'location', 'price', 'subject', 'description'],
  petcare:       ['title', 'location', 'price', 'description'],
  handyman:      ['title', 'location', 'price', 'description'],
  car:           ['title', 'location', 'price', 'description'],
  goods:         ['title', 'location', 'price', 'description'],
  loan:          ['title', 'location', 'price', 'repay_by', 'description'],
  freelance:     ['title', 'location', 'price', 'description'],
  seek_room:     ['title', 'location', 'price', 'move_in', 'description'],
  seek_babysit:  ['title', 'location', 'price', 'availability', 'description'],
  seek_cleaning: ['title', 'location', 'price', 'frequency', 'description'],
  seek_parking:  ['title', 'location', 'price', 'description'],
  seek_tutor:    ['title', 'location', 'price', 'subject', 'description'],
}

const DEFAULT_PERIOD = {
  room: 'monthly', parking: 'monthly', storage: 'monthly',
  venue: 'daily',  gear: 'daily',
  babysit: 'hourly', cleaning: 'hourly', tutoring: 'hourly', petcare: 'hourly', handyman: 'hourly',
  car: 'one-time', goods: 'one-time', loan: 'one-time', freelance: 'one-time',
  seek_room: 'monthly', seek_babysit: 'hourly', seek_cleaning: 'hourly',
  seek_parking: 'monthly', seek_tutor: 'hourly',
}

const CURRENCIES = [
  { code: 'USD', symbol: '$' },   { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },   { code: 'SEK', symbol: 'kr' },
  { code: 'NOK', symbol: 'kr' },  { code: 'DKK', symbol: 'kr' },
  { code: 'CHF', symbol: 'Fr' },  { code: 'CAD', symbol: 'CA$' },
  { code: 'AUD', symbol: 'A$' },  { code: 'NZD', symbol: 'NZ$' },
  { code: 'JPY', symbol: '¥' },   { code: 'CNY', symbol: '¥' },
  { code: 'INR', symbol: '₹' },   { code: 'BRL', symbol: 'R$' },
  { code: 'MXN', symbol: 'MX$' }, { code: 'SGD', symbol: 'S$' },
  { code: 'HKD', symbol: 'HK$' }, { code: 'ZAR', symbol: 'R' },
]

const PERIODS = [
  { value: 'hourly',    label: 'Per hour' },
  { value: 'daily',     label: 'Per day' },
  { value: 'weekly',    label: 'Per week' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly',   label: 'Per month' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',    label: 'Per year' },
  { value: 'one-time',  label: 'One-time' },
]

const CITY_LIST = [
  'New York, US','Los Angeles, US','Chicago, US','Houston, US','Phoenix, US',
  'Philadelphia, US','San Antonio, US','San Diego, US','Dallas, US','Austin, US',
  'San Francisco, US','Seattle, US','Denver, US','Boston, US','Miami, US',
  'London, UK','Manchester, UK','Birmingham, UK','Glasgow, UK','Edinburgh, UK',
  'Toronto, Canada','Vancouver, Canada','Montreal, Canada','Calgary, Canada',
  'Sydney, Australia','Melbourne, Australia','Brisbane, Australia','Perth, Australia',
  'Dublin, Ireland','Paris, France','Berlin, Germany','Munich, Germany','Hamburg, Germany',
  'Amsterdam, Netherlands','Brussels, Belgium','Zurich, Switzerland','Vienna, Austria',
  'Stockholm, Sweden','Gothenburg, Sweden','Malmö, Sweden','Oslo, Norway','Copenhagen, Denmark',
  'Helsinki, Finland','Madrid, Spain','Barcelona, Spain','Lisbon, Portugal',
  'Rome, Italy','Milan, Italy','Warsaw, Poland','Prague, Czech Republic',
  'Singapore','Tokyo, Japan','Osaka, Japan','Seoul, South Korea','Hong Kong',
  'Shanghai, China','Beijing, China','Mumbai, India','Delhi, India','Bangalore, India',
  'Dubai, UAE','Abu Dhabi, UAE','São Paulo, Brazil','Buenos Aires, Argentina',
  'Mexico City, Mexico','Lagos, Nigeria','Nairobi, Kenya','Cairo, Egypt',
  'Johannesburg, South Africa','Cape Town, South Africa','Auckland, New Zealand',
]

const FIELD_META = {
  title:          { label: 'Listing title',  ph: 'e.g. Sunny room near city centre' },
  location:       { label: 'City or area',   ph: 'e.g. Austin, TX', autocomplete: true },
  availability:   { label: 'Availability',   ph: 'e.g. Weekdays 8am–4pm' },
  frequency:      { label: 'How often',      ph: 'e.g. Weekly' },
  available_from: { label: 'Available from', date: true },
  move_in:        { label: 'Ideal move-in',  date: true },
  repay_by:       { label: 'Repay by',       date: true },
  subject:        { label: 'Subject / skill', ph: 'e.g. Math, Piano' },
  description:    { label: 'Description',    ph: 'Tell people more…', textarea: true },
}

// ── Shared sub-components ─────────────────────────────────────────────────
function Topbar({ onBack, right, rightEl }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 16px', background: bg,
      borderBottom: `1px solid ${bdr}`, flexShrink: 0,
    }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {rightEl !== undefined ? rightEl : (
        <div style={{ width: 60, fontSize: 12, color: t3, fontWeight: 600, textAlign: 'right' }}>
          {right}
        </div>
      )}
    </div>
  )
}

function FooterBtn({ label, disabled, onClick }) {
  return (
    <div style={{
      padding: '14px 16px',
      paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
      background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0,
    }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: 14, borderRadius: 14, border: 'none',
          background: acc, color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
          fontFamily: sans, transition: 'all 0.18s',
        }}
      >
        {label}
      </button>
    </div>
  )
}

const TODAY = new Date().toISOString().split('T')[0]

const baseInput = {
  width: '100%', background: bg3, border: `1px solid ${bdr}`,
  borderRadius: 8, padding: '11px 13px', fontSize: 14,
  fontFamily: sans, color: text, outline: 'none',
  transition: 'border-color 0.18s', resize: 'none',
  WebkitAppearance: 'none', boxSizing: 'border-box', colorScheme: 'light',
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: t2,
  textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6,
}

const selectStyle = {
  background: bg3, border: `1px solid ${bdr}`, borderRadius: 8,
  padding: '11px 10px', fontSize: 13, fontFamily: sans, color: text,
  outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
  colorScheme: 'light',
}

function PriceField({ answers, setAnswer, subtype }) {
  const currency = answers.price_currency || 'USD'
  const period   = answers.price_period   || DEFAULT_PERIOD[subtype] || 'monthly'
  const amount   = answers.price || ''
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>Price</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          value={currency}
          onChange={e => setAnswer('price_currency', e.target.value)}
          style={{ ...selectStyle, flexShrink: 0, width: 90 }}
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>
          ))}
        </select>
        <input
          type="number" min="0" step="any" placeholder="0"
          value={amount}
          onChange={e => setAnswer('price', e.target.value)}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          style={{ ...baseInput, flex: 1 }}
        />
        <select
          value={period}
          onChange={e => setAnswer('price_period', e.target.value)}
          style={{ ...selectStyle, flexShrink: 0, width: 120 }}
        >
          {PERIODS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function Field({ fieldKey, meta, value, onChange }) {
  if (meta.date) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{meta.label}</label>
        <input
          type="date" min={TODAY} value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          style={{ ...baseInput, display: 'block' }}
        />
      </div>
    )
  }
  if (meta.autocomplete) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{meta.label}</label>
        <input
          type="text" list="cs-cities" placeholder={meta.ph} value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          autoComplete="off"
          style={{ ...baseInput, display: 'block' }}
        />
        <datalist id="cs-cities">
          {CITY_LIST.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{meta.label}</label>
      {meta.textarea ? (
        <textarea
          rows={4} placeholder={meta.ph} value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          style={{ ...baseInput, display: 'block' }}
        />
      ) : (
        <input
          type="text" placeholder={meta.ph} value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          autoComplete="off"
          style={{ ...baseInput, display: 'block' }}
        />
      )}
    </div>
  )
}

// Small "?" icon that reveals a plain-language explanation on hover/tap —
// same pattern as Configure Contract's InfoTip, for the same concepts.
function InfoTip({ tip }) {
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
          {tip}
        </div>
      )}
    </span>
  )
}

function TriToggle({ label, value, onChange, info, labels }) {
  const [unsetLabel, onLabel, offLabel] = labels || ['Not specified', 'Allowed', 'Not allowed']
  const opts = [[unsetLabel, null], [onLabel, true], [offLabel, false]]
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}{info && <InfoTip tip={info} />}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        {opts.map(([lbl, val]) => {
          const on = value === val
          return (
            <button
              key={lbl} type="button" onClick={() => onChange(val)}
              style={{
                flex: 1, padding: '9px 6px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${on ? acc : bdr}`, background: on ? `${acc}18` : bg3,
                color: on ? acc : t2, cursor: 'pointer', fontFamily: sans,
              }}
            >
              {lbl}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Rental default terms (optional, rentals only) ──────────────────────────
// These pre-fill the Configure Contract screen when a renter and owner sit
// down to make a contract for this listing — the contract itself stays
// fully editable, this is just a starting point so common terms don't have
// to be re-entered from scratch on every contract.
function RentalTerms({ state }) {
  const [open, setOpen] = useState(false)
  const {
    marginDays, setMarginDays,
    termType, setTermType,
    noticeDays, setNoticeDays,
    pets, setPets, smoking, setSmoking, subletting, setSubletting,
    lateFeeOn, setLateFeeOn, graceDays, setGraceDays, lateFeeAmt, setLateFeeAmt,
    autoRenew, setAutoRenew, earlyFee, setEarlyFee,
    dueDay, setDueDay, prorate, setProrate, paymentMethod, setPaymentMethod,
    depositAmt, setDepositAmt, depositReturnDays, setDepositReturnDays,
    guests, setGuests, utilities, setUtilities, utilitiesResp, setUtilitiesResp,
    quietHoursOn, setQuietHoursOn, quietStart, setQuietStart, quietEnd, setQuietEnd,
    governingLaw, setGoverningLaw, disputeResolution, setDisputeResolution, noticeMethod, setNoticeMethod,
    additionalRules, setAdditionalRules,
  } = state

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', color: acc, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: sans, padding: 0, marginBottom: open ? 12 : 0 }}
      >
        {open ? 'Hide default rental terms' : 'Set default rental terms →'}
      </button>
      {!open && (
        <div style={{ fontSize: 11.5, color: t3, marginTop: 4, lineHeight: 1.4 }}>
          Optional — pre-fills these into any contract made for this listing. Still adjustable per-contract.
        </div>
      )}

      {open && (
        <div style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Margin between bookings (days)
              <InfoTip tip="Minimum gap enforced between one rental ending and the next starting on this listing — e.g. for cleaning/turnover time." />
            </label>
            <input
              type="number" min="0" value={marginDays}
              onChange={e => setMarginDays(e.target.value)}
              style={{ ...baseInput, width: 100 }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Preferred term type
              <InfoTip tip="Fixed dates locks in an exact end date, like a lease. Open-ended keeps the rental going until either side gives notice. Whoever makes the contract can still change this." />
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
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
            {termType === 'open_ended' && (
              <div style={{ marginTop: 10 }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Notice period (days)</label>
                <input type="number" min="1" value={noticeDays} onChange={e => setNoticeDays(e.target.value)} style={{ ...baseInput, width: 100 }} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>
                Rent due day (optional)
                <InfoTip tip="Which day of each billing period the rent must be paid by, e.g. 1 means the 1st of every month. Leave blank if there's no fixed due day." />
              </label>
              <input type="number" min="1" max="31" placeholder="e.g. 1" value={dueDay} onChange={e => setDueDay(e.target.value)} style={baseInput} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>Payment method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                <option value="">Not specified</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="app">Payment app</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <input type="checkbox" id="def-prorate" checked={prorate} onChange={e => setProrate(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="def-prorate" style={{ fontSize: 13, color: text, cursor: 'pointer' }}>Prorate first period if start date is mid-period</label>
          </div>

          <TriToggle label="Pets" value={pets} onChange={setPets} />
          <TriToggle label="Smoking" value={smoking} onChange={setSmoking} />
          <TriToggle label="Subletting" value={subletting} onChange={setSubletting} info="Whether the tenant is allowed to rent out the room/space to someone else during their stay." />
          <TriToggle label="Overnight guests" value={guests} onChange={setGuests} />
          <TriToggle
            label="Utilities included"
            value={utilities}
            onChange={v => { setUtilities(v); if (v !== false) setUtilitiesResp('') }}
            labels={['Not specified', 'Included', 'Not included']}
            info="Whether electricity, water, internet, and similar bills are included in the rent, or billed separately. If billed separately, specify below whose job it is to pay them."
          />
          {utilities === false && (
            <div style={{ marginBottom: 14, marginTop: -6 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>Who pays the utility bills?</label>
              <select value={utilitiesResp} onChange={e => setUtilitiesResp(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                <option value="">Not specified</option>
                <option value="tenant">Tenant/Renter</option>
                <option value="landlord">Landlord/Owner</option>
                <option value="split">Split between both</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: quietHoursOn ? 10 : 14 }}>
            <input type="checkbox" id="def-quiethours" checked={quietHoursOn} onChange={e => setQuietHoursOn(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="def-quiethours" style={{ fontSize: 13, color: text, cursor: 'pointer' }}>Quiet hours</label>
            <InfoTip tip="Hours during which noise (loud music, parties, etc.) should be kept to a minimum, e.g. 22:00 to 08:00 overnight." />
          </div>
          {quietHoursOn && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
              <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} style={{ ...baseInput, flex: 1, colorScheme: 'light' }} />
              <span style={{ color: t3, fontSize: 12 }}>to</span>
              <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} style={{ ...baseInput, flex: 1, colorScheme: 'light' }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: lateFeeOn ? 10 : 0 }}>
            <input type="checkbox" id="def-latefee" checked={lateFeeOn} onChange={e => setLateFeeOn(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="def-latefee" style={{ fontSize: 13, color: text, cursor: 'pointer' }}>Late payment fee</label>
            <InfoTip tip="Charges the tenant an extra fee if a payment is late, after the grace period below has passed." />
          </div>
          {lateFeeOn && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Grace period (days)</label>
                <input type="number" min="0" value={graceDays} onChange={e => setGraceDays(e.target.value)} style={baseInput} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Fee amount</label>
                <input type="number" min="0" placeholder="e.g. 25" value={lateFeeAmt} onChange={e => setLateFeeAmt(e.target.value)} style={baseInput} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>Security deposit (optional)</label>
              <input type="number" min="0" placeholder="Leave blank for none" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} style={baseInput} />
            </div>
            {depositAmt && (
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: 10 }}>Returned within (days)</label>
                <input type="number" min="0" value={depositReturnDays} onChange={e => setDepositReturnDays(e.target.value)} style={baseInput} />
              </div>
            )}
          </div>

          {termType === 'fixed' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input type="checkbox" id="def-autorenew" checked={autoRenew} onChange={e => setAutoRenew(e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="def-autorenew" style={{ fontSize: 13, color: text, cursor: 'pointer' }}>Auto-renew month-to-month after end date</label>
                <InfoTip tip="If neither side ends the contract by the end date, it automatically keeps going on a month-to-month basis until either party gives 30 days' notice to stop." />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  Early termination fee (optional)
                  <InfoTip tip="A fee either party agrees to pay if they end the contract before the agreed end date. Leave blank if you don't want one." />
                </label>
                <input type="number" min="0" placeholder="Leave blank for none" value={earlyFee} onChange={e => setEarlyFee(e.target.value)} style={baseInput} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Governing law (optional)
              <InfoTip tip="Which region's laws apply if there's ever a legal dispute — normally wherever the rental property is located. Most rentals never need it." />
            </label>
            <input type="text" placeholder="e.g. the State of Texas, USA" value={governingLaw} onChange={e => setGoverningLaw(e.target.value)} style={baseInput} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>
                Dispute resolution
                <InfoTip tip="How the two of you agree to try to resolve a disagreement. Direct negotiation means just talking it out; mediation brings in a neutral third party; small claims court is the formal legal route." />
              </label>
              <select value={disputeResolution} onChange={e => setDisputeResolution(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                <option value="">Not specified</option>
                <option value="direct_negotiation">Direct negotiation</option>
                <option value="mediation">Mediation</option>
                <option value="small_claims">Small claims court</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>
                Notice delivery
                <InfoTip tip="How official notices — like ending the contract — must be delivered to count as valid under this agreement." />
              </label>
              <select value={noticeMethod} onChange={e => setNoticeMethod(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                <option value="">Not specified</option>
                <option value="email">Email</option>
                <option value="written">Written</option>
                <option value="in_app">In-app message</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Additional rules (optional)</label>
            <textarea
              rows={3} placeholder="Any other rules or terms you want in writing — e.g. no smoking on the balcony, shared laundry schedule…"
              value={additionalRules} onChange={e => setAdditionalRules(e.target.value)}
              style={{ ...baseInput, resize: 'vertical' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function alertMatches(alerts, listing) {
  return (alerts ?? []).some(al => {
    const locMatch = !al.location ||
      listing.location.toLowerCase().includes(al.location.toLowerCase())
    const catMatch = !al.cat || al.cat === 'all' || al.cat === listing.cat
    return locMatch && catMatch
  })
}

async function fireAlerts(listing) {
  // ── 1. localStorage path (keeps legacy users who never signed up in Supabase) ──
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('cs_profile_'))
      .forEach(key => {
        try {
          const u = JSON.parse(localStorage.getItem(key))
          if (!u?.alerts || u.email === listing.ownerEmail) return
          if (!alertMatches(u.alerts, listing)) return
          const notifKey = `cs_notifs_${u.email}`
          const existing = JSON.parse(localStorage.getItem(notifKey) || '[]')
          localStorage.setItem(notifKey, JSON.stringify([{
            id:        Math.random().toString(36).slice(2, 10),
            type:      'alert_match',
            title:     'New listing near you!',
            body:      `${listing.title} in ${listing.location}`,
            at:        new Date().toISOString(),
            read:      false,
            listingId: listing.id,
          }, ...existing]))
        } catch {}
      })
  } catch {}

  // ── 2. Supabase path — read users table, insert notifications rows ────────
  try {
    const { data: sbUsers, error } = await supabase
      .from('users')
      .select('id, email, alerts')
      .neq('email', listing.ownerEmail)

    if (error || !sbUsers?.length) return

    const notifRows = sbUsers
      .filter(u => alertMatches(u.alerts, listing))
      .map(u => ({
        user_id:    u.id,
        type:       'alert_match',
        title:      'New listing near you!',
        body:       `${listing.title} in ${listing.location}`,
        // listing not yet in Supabase with its UUID at this point — set null.
        listing_id: null,
      }))

    if (notifRows.length) {
      const { error: nErr } = await supabase
        .from('notifications')
        .insert(notifRows)
      if (nErr) console.warn('[Supabase] notification insert failed:', nErr.message)
    }
  } catch (err) {
    console.warn('[Supabase] fireAlerts failed:', err.message)
  }
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function PostListing() {
  const [step, setStep]               = useState(1)
  const [cat, setCat]                 = useState(null)
  const [subtype, setSubtype]         = useState(null)
  const [answers, setAnswers]         = useState({})
  const [selectedTags, setSelectedTags] = useState([])
  const [error, setError]             = useState('')

  // Default rental terms (rentals only) — pre-fill Configure Contract.
  const [marginDays, setMarginDays]   = useState(0)
  const [termType, setTermType]       = useState('fixed')
  const [noticeDays, setNoticeDays]   = useState(30)
  const [pets, setPets]               = useState(null)
  const [smoking, setSmoking]         = useState(null)
  const [subletting, setSubletting]   = useState(null)
  const [lateFeeOn, setLateFeeOn]     = useState(false)
  const [graceDays, setGraceDays]     = useState(5)
  const [lateFeeAmt, setLateFeeAmt]   = useState('')
  const [autoRenew, setAutoRenew]     = useState(false)
  const [earlyFee, setEarlyFee]       = useState('')
  const [dueDay, setDueDay]           = useState('')
  const [prorate, setProrate]         = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [depositAmt, setDepositAmt]   = useState('')
  const [depositReturnDays, setDepositReturnDays] = useState(14)
  const [guests, setGuests]           = useState(null)
  const [utilities, setUtilities]     = useState(null)
  const [utilitiesResp, setUtilitiesResp] = useState('')
  const [quietHoursOn, setQuietHoursOn] = useState(false)
  const [quietStart, setQuietStart]   = useState('22:00')
  const [quietEnd, setQuietEnd]       = useState('08:00')
  const [governingLaw, setGoverningLaw] = useState('')
  const [disputeResolution, setDisputeResolution] = useState('')
  const [noticeMethod, setNoticeMethod] = useState('')
  const [additionalRules, setAdditionalRules] = useState('')

  const rentalTermsState = {
    marginDays, setMarginDays, termType, setTermType, noticeDays, setNoticeDays,
    pets, setPets, smoking, setSmoking, subletting, setSubletting,
    lateFeeOn, setLateFeeOn, graceDays, setGraceDays, lateFeeAmt, setLateFeeAmt,
    autoRenew, setAutoRenew, earlyFee, setEarlyFee,
    dueDay, setDueDay, prorate, setProrate, paymentMethod, setPaymentMethod,
    depositAmt, setDepositAmt, depositReturnDays, setDepositReturnDays,
    guests, setGuests, utilities, setUtilities, utilitiesResp, setUtilitiesResp,
    quietHoursOn, setQuietHoursOn, quietStart, setQuietStart, quietEnd, setQuietEnd,
    governingLaw, setGoverningLaw, disputeResolution, setDisputeResolution, noticeMethod, setNoticeMethod,
    additionalRules, setAdditionalRules,
  }

  const navigate   = useNavigate()
  const user       = useAuth(s => s.user)
  const addListing = useListings(s => s.addListing)
  function pickCat(k) {
    setCat(k)
    setSubtype(null)
    setSelectedTags([])
    setAnswers({})
    setMarginDays(0)
    setTermType('fixed')
    setNoticeDays(30)
    setPets(null); setSmoking(null); setSubletting(null)
    setLateFeeOn(false); setGraceDays(5); setLateFeeAmt('')
    setAutoRenew(false); setEarlyFee('')
    setDueDay(''); setProrate(false); setPaymentMethod('')
    setDepositAmt(''); setDepositReturnDays(14)
    setGuests(null); setUtilities(null); setUtilitiesResp('')
    setQuietHoursOn(false); setQuietStart('22:00'); setQuietEnd('08:00')
    setGoverningLaw(''); setDisputeResolution(''); setNoticeMethod('')
    setAdditionalRules('')
    setStep(2)
  }

  function pickSub(k) {
    setSubtype(k)
    setSelectedTags([])
    setAnswers(prev => ({ ...prev, price_period: DEFAULT_PERIOD[k] || 'monthly' }))
  }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function setAnswer(field, val) {
    setAnswers(prev => ({ ...prev, [field]: val }))
  }

  function submit() {
    if (!answers.title?.trim() || !answers.location?.trim()) {
      setError('Title and location are required.')
      return
    }
    setError('')
    const fields = LISTING_FIELDS[subtype] || ['title', 'location', 'description']
    const id = Math.random().toString(36).slice(2, 10)
    const isRental = cat === 'rental'
    const listing = {
      id,
      ...Object.fromEntries(fields.filter(f => f !== 'price').map(f => [f, answers[f]?.trim() || ''])),
      price:          answers.price?.trim() || '',
      price_currency: answers.price_currency || 'USD',
      price_period:   answers.price_period || DEFAULT_PERIOD[subtype] || 'monthly',
      cat,
      subcat:     subtype,
      tags:       selectedTags,
      ownerName:  user.name,
      ownerEmail: user.email,
      ownerColor: user.avatarColor,
      ownerId:    user.id,
      createdAt:  new Date().toISOString(),
      status:     'active',
      reviewCount: 0,
      avgRating:   0,
      bookingMarginDays: isRental ? Math.max(0, Number(marginDays) || 0) : 0,
      defaultOptions: isRental ? {
        termType,
        noticePeriodDays: termType === 'open_ended' ? (Number(noticeDays) || 30) : null,
        petsAllowed: pets, smokingAllowed: smoking, sublettingAllowed: subletting,
        autoRenew: termType === 'fixed' ? autoRenew : false,
        earlyTerminationFee: termType === 'fixed' && earlyFee ? Number(earlyFee) : null,
        lateFee: lateFeeOn && lateFeeAmt ? { graceDays: Number(graceDays), amount: Number(lateFeeAmt) } : null,
        dueDay: dueDay ? Number(dueDay) : null,
        prorateFirstPeriod: prorate,
        paymentMethod: paymentMethod || null,
        depositAmount: depositAmt ? Number(depositAmt) : null,
        depositReturnDays: Number(depositReturnDays) || 14,
        guestsAllowed: guests, utilitiesIncluded: utilities,
        utilitiesResponsibility: utilities === false ? (utilitiesResp || null) : null,
        quietHoursEnabled: quietHoursOn, quietHoursStart: quietStart, quietHoursEnd: quietEnd,
        governingLaw: governingLaw.trim() || null,
        disputeResolution: disputeResolution || null,
        noticeDeliveryMethod: noticeMethod || null,
        additionalRules: additionalRules.trim() || null,
      } : {},
    }
    addListing(listing)         // optimistic + async Supabase insert
    fireAlerts(listing)         // async, fire-and-forget notification fan-out
    navigate('/')
  }

  const wrap = (children, footer) => (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: sans, fontSize: 15, color: text }}>
      {children}
      {footer}
    </div>
  )

  // ── Step 1: Pick category ────────────────────────────────────────────────
  if (step === 1) return wrap(
    <>
      <Topbar onBack={() => navigate('/')} right={null} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Step 1 of 3</div>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 300, lineHeight: 1.2, color: text, marginBottom: 7 }}>What are you posting?</div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 22, lineHeight: 1.5 }}>Pick the category that best fits.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 16 }}>
          {Object.entries(CATS).map(([k, c]) => (
            <div
              key={k}
              onClick={() => pickCat(k)}
              style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: '16px 14px', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = bdr2; e.currentTarget.style.background = bg3 }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = bdr; e.currentTarget.style.background = bg2 }}
            >
              <div style={{ fontSize: 26, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  // ── Step 2: Pick subtype ─────────────────────────────────────────────────
  const catCfg = CATS[cat]

  if (step === 2) return wrap(
    <>
      <Topbar onBack={() => setStep(1)} right={null} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Step 2 of 3</div>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 300, lineHeight: 1.2, color: text, marginBottom: 7 }}>{catCfg.icon} {catCfg.label}</div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 22, lineHeight: 1.5 }}>Pick the closest match.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {Object.entries(catCfg.sub).map(([k, s]) => {
            const sel = subtype === k
            return (
              <div
                key={k}
                onClick={() => pickSub(k)}
                style={{
                  background: sel ? accbg : bg3,
                  border: `1px solid ${sel ? acc : bdr}`,
                  borderRadius: 8, padding: '11px 12px',
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{s.label}</div>
                <div style={{ fontSize: 11, color: t2, marginTop: 2 }}>{s.desc}</div>
              </div>
            )
          })}
        </div>
      </div>
    </>,
    <FooterBtn label="Continue →" disabled={!subtype} onClick={() => subtype && setStep(3)} />
  )

  // ── Step 3: Fill details ─────────────────────────────────────────────────
  const fields  = LISTING_FIELDS[subtype] || ['title', 'location', 'description']
  const tagCfg  = TAGS[subtype]

  return wrap(
    <>
      <Topbar
        onBack={() => setStep(2)}
        rightEl={
          <button
            onClick={submit}
            style={{
              background: acc, color: '#fff', border: 'none',
              borderRadius: 10, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: sans, minHeight: 36,
            }}
          >
            Post listing →
          </button>
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Step 3 of 3 — details</div>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 300, lineHeight: 1.2, color: text, marginBottom: 7 }}>Tell people more</div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 22, lineHeight: 1.5 }}>More detail means more responses. Tags help people find you.</div>

        {fields.map(f =>
          f === 'price'
            ? <PriceField key="price" answers={answers} setAnswer={setAnswer} subtype={subtype} />
            : <Field key={f} fieldKey={f} meta={FIELD_META[f] || { label: f, ph: '' }} value={answers[f] || ''} onChange={setAnswer} />
        )}

        {cat === 'rental' && <RentalTerms state={rentalTermsState} />}

        {tagCfg && (
          <>
            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t2, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                Tags{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: t3 }}>
                  (pick all that apply)
                </span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 4 }}>
                {tagCfg.tags.map(t => {
                  const on = selectedTags.includes(t)
                  return (
                    <div
                      key={t}
                      onClick={() => toggleTag(t)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 600, padding: '6px 12px',
                        borderRadius: 999, cursor: 'pointer', transition: 'all 0.18s',
                        whiteSpace: 'nowrap',
                        border: `1.5px solid ${on ? tagCfg.text : bdr}`,
                        background: on ? tagCfg.color + '44' : bg3,
                        color: on ? tagCfg.text : t2,
                      }}
                    >
                      {on && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {t}
                    </div>
                  )
                })}
              </div>
            </div>
            {selectedTags.length > 0 && (
              <div style={{ fontSize: 12, color: acc, marginBottom: 14 }}>
                {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </>
        )}

        {error && (
          <p style={{ fontSize: 13, color: red, marginBottom: 10 }}>{error}</p>
        )}
      </div>
    </>
  )
}
