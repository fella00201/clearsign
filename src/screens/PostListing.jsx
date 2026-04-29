import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListings } from '../store/useListings'
import { useAuth } from '../store/useAuth'
import { CATS, TAGS } from '../data/categories'
import { supabase } from '../lib/supabase'

// ── Design tokens ──────────────────────────────────────────────────────────
const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const accbg = '#141f3c'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

// ── Listing field config (mirrors HTML LISTING_FIELDS + FIELD_META) ────────
const LISTING_FIELDS = {
  room:          ['title', 'location', 'price_per_month', 'available_from', 'description'],
  parking:       ['title', 'location', 'price_per_month', 'available_from', 'description'],
  storage:       ['title', 'location', 'price_per_month', 'description'],
  venue:         ['title', 'location', 'price_per_day', 'description'],
  gear:          ['title', 'location', 'price_per_day', 'description'],
  babysit:       ['title', 'location', 'hourly_rate', 'availability', 'description'],
  cleaning:      ['title', 'location', 'hourly_rate', 'frequency', 'description'],
  tutoring:      ['title', 'location', 'hourly_rate', 'subject', 'description'],
  petcare:       ['title', 'location', 'hourly_rate', 'description'],
  handyman:      ['title', 'location', 'hourly_rate', 'description'],
  car:           ['title', 'location', 'asking_price', 'description'],
  goods:         ['title', 'location', 'asking_price', 'description'],
  loan:          ['title', 'location', 'loan_amount', 'repay_by', 'description'],
  freelance:     ['title', 'location', 'total_fee', 'description'],
  seek_room:     ['title', 'location', 'max_budget', 'move_in', 'description'],
  seek_babysit:  ['title', 'location', 'max_rate', 'availability', 'description'],
  seek_cleaning: ['title', 'location', 'max_rate', 'frequency', 'description'],
  seek_parking:  ['title', 'location', 'max_budget', 'description'],
  seek_tutor:    ['title', 'location', 'max_rate', 'subject', 'description'],
}

const FIELD_META = {
  title:           { label: 'Listing title',     ph: 'e.g. Sunny room near city centre' },
  location:        { label: 'City or area',       ph: 'e.g. Austin, TX' },
  price_per_month: { label: 'Monthly price',      ph: 'e.g. $750/month' },
  price_per_day:   { label: 'Price per day',      ph: 'e.g. $120/day' },
  hourly_rate:     { label: 'Hourly rate',        ph: 'e.g. $18/hr' },
  asking_price:    { label: 'Asking price',       ph: 'e.g. $8,500' },
  loan_amount:     { label: 'Loan amount',        ph: 'e.g. $2,000' },
  total_fee:       { label: 'Total project fee',  ph: 'e.g. $1,500' },
  max_budget:      { label: 'Max budget',         ph: 'e.g. $800/month' },
  max_rate:        { label: 'Max hourly rate',    ph: 'e.g. $20/hr' },
  available_from:  { label: 'Available from',     ph: 'e.g. July 1, 2026' },
  move_in:         { label: 'Ideal move-in',      ph: 'e.g. July 1, 2026' },
  availability:    { label: 'Availability',       ph: 'e.g. Weekdays 8am–4pm' },
  frequency:       { label: 'How often',          ph: 'e.g. Weekly' },
  repay_by:        { label: 'Repay by',           ph: 'e.g. December 1, 2026' },
  subject:         { label: 'Subject / skill',    ph: 'e.g. Math, Piano' },
  description:     { label: 'Description',        ph: 'Tell people more…', textarea: true },
}

// ── Shared sub-components ─────────────────────────────────────────────────
function Topbar({ onBack, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 16px', background: bg,
      borderBottom: `1px solid ${bdr}`, flexShrink: 0,
    }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: text }}>
        Clear<b style={{ color: acc, fontWeight: 500 }}>Sign</b>
      </div>
      <div style={{ width: 34, fontSize: 12, color: t3, fontWeight: 600, textAlign: 'right' }}>
        {right}
      </div>
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

// ── Bottom nav (mirrors Discover, post tab active) ─────────────────────────
const NAV_TABS = [
  { id: 'discover', path: '/',            label: 'Find',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M14 14l3 3" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { id: 'messages', path: '/messages',    label: 'Messages',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M6 8h8M6 11h5" stroke={on ? acc : t3} strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { id: 'post',     path: '/post',        label: 'Post',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M10 6v8M6 10h8" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { id: 'vault',    path: '/vault',       label: 'Vault',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M7 10l2.5 2.5L13 8" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'profile',  path: '/profile',     label: 'Profile',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round"/></svg> },
]

function NavBar({ active }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: `1px solid ${bdr}`, background: bg, flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_TABS.map(({ id, path, label, icon }) => {
        const on = active === id
        return (
          <button key={id} onClick={() => navigate(path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 4px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: sans }}>
            {icon(on)}
            <span style={{ fontSize: 10, fontWeight: 600, color: on ? acc : t3 }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Field input ────────────────────────────────────────────────────────────
function Field({ fieldKey, meta, value, onChange }) {
  const inputStyle = {
    width: '100%', background: bg3, border: `1px solid ${bdr}`,
    borderRadius: 8, padding: '11px 13px', fontSize: 14,
    fontFamily: sans, color: text, outline: 'none',
    transition: 'border-color 0.18s', resize: 'none',
    WebkitAppearance: 'none', boxSizing: 'border-box',
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t2, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
        {meta.label}
      </label>
      {meta.textarea ? (
        <textarea
          rows={4}
          placeholder={meta.ph}
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          style={{ ...inputStyle, display: 'block' }}
        />
      ) : (
        <input
          type="text"
          placeholder={meta.ph}
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          autoComplete="off"
          style={inputStyle}
        />
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

  const navigate   = useNavigate()
  const user       = useAuth(s => s.user)
  const addListing = useListings(s => s.addListing)

  function pickCat(k) {
    setCat(k)
    setSubtype(null)
    setSelectedTags([])
    setAnswers({})
    setStep(2)
  }

  function pickSub(k) {
    setSubtype(k)
    setSelectedTags([])
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
    const listing = {
      id,           // temporary local id; replaced by Supabase UUID after insert
      ...Object.fromEntries(fields.map(f => [f, answers[f]?.trim() || ''])),
      cat,
      subcat:     subtype,
      tags:       selectedTags,
      ownerName:  user.name,
      ownerEmail: user.email,
      ownerColor: user.avatarColor,
      ownerId:    user.id,  // UUID (crypto.randomUUID()) for Supabase FK
      createdAt:  new Date().toISOString(),
      status:     'active',
      reviewCount: 0,
      avgRating:   0,
    }
    addListing(listing)         // optimistic + async Supabase insert
    fireAlerts(listing)         // async, fire-and-forget notification fan-out
    navigate('/')
  }

  const wrap = (children, footer) => (
    <div style={{ minHeight: '100svh', background: bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: sans, fontSize: 15, color: text }}>
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
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a4c'; e.currentTarget.style.background = bg3 }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = bdr; e.currentTarget.style.background = bg2 }}
            >
              <div style={{ fontSize: 26, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>
      <NavBar active="post" />
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
      <Topbar onBack={() => setStep(2)} right="Step 3 of 3" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Step 3 of 3 — details</div>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 300, lineHeight: 1.2, color: text, marginBottom: 7 }}>Tell people more</div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 22, lineHeight: 1.5 }}>More detail means more responses. Tags help people find you.</div>

        {fields.map(f => (
          <Field
            key={f}
            fieldKey={f}
            meta={FIELD_META[f] || { label: f, ph: '' }}
            value={answers[f] || ''}
            onChange={setAnswer}
          />
        ))}

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
          <p style={{ fontSize: 13, color: '#ff5b5b', marginBottom: 10 }}>{error}</p>
        )}
      </div>
    </>,
    <FooterBtn label="Post listing →" disabled={false} onClick={submit} />
  )
}
