import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useListings } from '../store/useListings'
import { useAuth } from '../store/useAuth'
import { useContracts } from '../store/useContracts'
import { generateContract } from '../lib/contracts'
import { findThread, insertThread, fetchContractsByListing } from '../lib/supabase'
import { computeCalendarDays } from '../lib/availability'
import { CATS, TAGS } from '../data/categories'
import { bg, bg2, bg3, bg4, bdr, text, t2, t3, acc, amber, red, sans, serif, CAT_COLORS } from '../theme'

const LISTING_UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

const BADGE = {
  'b-rental':  { bg: CAT_COLORS.rental.tint,  color: CAT_COLORS.rental.ink,  border: CAT_COLORS.rental.border },
  'b-service': { bg: CAT_COLORS.service.tint, color: CAT_COLORS.service.ink, border: CAT_COLORS.service.border },
  'b-sale':    { bg: CAT_COLORS.sale.tint,    color: CAT_COLORS.sale.ink,    border: CAT_COLORS.sale.border },
  'b-seek':    { bg: CAT_COLORS.seek.tint,    color: CAT_COLORS.seek.ink,    border: CAT_COLORS.seek.border },
}

function initials(name) {
  return name.split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

function Avatar({ name, color, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}22`, color, flexShrink: 0,
      fontSize: Math.round(size * 0.33), fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {initials(name)}
    </div>
  )
}

function Stars({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: rating >= i ? amber : bg4 }}>★</span>
      ))}
    </div>
  )
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const DAY_STYLE = {
  available: { background: bg3, color: t2, border: `1px solid ${bdr}` },
  booked:    { background: null, color: '#fff', border: 'none' }, // color computed per-contract
  margin:    { background: bg4, color: t3, border: 'none' },
  blocked:   { background: `${t3}33`, color: t3, border: 'none' },
}

function AvailabilityCalendar({ listing, isOwn }) {
  const updateListing = useListings(s => s.updateListing)
  const [contracts, setContracts] = useState([])
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [showManage, setShowManage] = useState(false)
  const [marginInput, setMarginInput] = useState(listing.bookingMarginDays || 0)
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')

  useEffect(() => {
    if (!LISTING_UUID_RE.test(listing.id)) return
    fetchContractsByListing(listing.id).then(setContracts).catch(() => {})
  }, [listing.id])

  const days = computeCalendarDays(listing, contracts, cursor.year, cursor.month)
  const firstDow = new Date(cursor.year, cursor.month, 1).getDay()
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function shiftMonth(delta) {
    setCursor(c => {
      const m = c.month + delta
      if (m < 0) return { year: c.year - 1, month: 11 }
      if (m > 11) return { year: c.year + 1, month: 0 }
      return { year: c.year, month: m }
    })
  }

  function saveMargin() {
    const n = Math.max(0, Number(marginInput) || 0)
    setMarginInput(n)
    updateListing(listing.id, { bookingMarginDays: n })
  }

  function addBlock() {
    if (!blockStart || !blockEnd || blockEnd < blockStart) return
    const next = [...(listing.blockedDates || []), { start: blockStart, end: blockEnd, reason: blockReason.trim() }]
    updateListing(listing.id, { blockedDates: next })
    setBlockStart(''); setBlockEnd(''); setBlockReason('')
  }

  function removeBlock(i) {
    const next = (listing.blockedDates || []).filter((_, idx) => idx !== i)
    updateListing(listing.id, { blockedDates: next })
  }

  return (
    <div style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Availability
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => shiftMonth(-1)} style={{ background: 'none', border: 'none', color: t2, cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>‹</button>
          <span style={{ fontSize: 12, fontWeight: 600, color: text, minWidth: 92, textAlign: 'center' }}>{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} style={{ background: 'none', border: 'none', color: t2, cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ fontSize: 10, color: t3, textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(day => {
          const s = DAY_STYLE[day.status]
          const bookedColor = day.status === 'booked' ? (day.contract?.counterpartyColor || acc) : null
          return (
            <div
              key={day.date}
              title={day.status === 'blocked' ? (day.reason || 'Blocked') : day.status}
              style={{
                aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600,
                background: bookedColor || s.background,
                color: s.color, border: s.border,
              }}
            >
              {Number(day.date.slice(-2))}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        {[['Booked', acc], ['Margin buffer', bg4], ['Blocked', `${t3}66`]].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: color, display: 'inline-block' }} />
            <span style={{ fontSize: 10.5, color: t3 }}>{label}</span>
          </div>
        ))}
      </div>

      {isOwn && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${bdr}`, paddingTop: 12 }}>
          <button
            onClick={() => setShowManage(s => !s)}
            style={{ background: 'none', border: 'none', color: acc, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: sans, padding: 0 }}
          >
            {showManage ? 'Hide availability settings' : 'Manage availability →'}
          </button>

          {showManage && (
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: t2, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Margin between bookings (days)
                </label>
                <input
                  type="number" min="0" value={marginInput}
                  onChange={e => setMarginInput(e.target.value)}
                  onBlur={saveMargin}
                  style={{ width: 100, background: bg3, border: `1px solid ${bdr}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: sans, color: text, outline: 'none' }}
                />
              </div>

              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: t2, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Block specific dates
              </label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <input type="date" value={blockStart} onChange={e => setBlockStart(e.target.value)} style={{ flex: 1, minWidth: 120, background: bg3, border: `1px solid ${bdr}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: sans, color: text, outline: 'none', colorScheme: 'light' }} />
                <input type="date" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} style={{ flex: 1, minWidth: 120, background: bg3, border: `1px solid ${bdr}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: sans, color: text, outline: 'none', colorScheme: 'light' }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" placeholder="Reason (optional)" value={blockReason} onChange={e => setBlockReason(e.target.value)} style={{ flex: 1, background: bg3, border: `1px solid ${bdr}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontFamily: sans, color: text, outline: 'none' }} />
                <button onClick={addBlock} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: acc, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: sans, flexShrink: 0 }}>Add</button>
              </div>

              {(listing.blockedDates || []).length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {listing.blockedDates.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bg3, border: `1px solid ${bdr}`, borderRadius: 8, padding: '7px 10px' }}>
                      <span style={{ fontSize: 11.5, color: t2 }}>{b.start} → {b.end}{b.reason ? ` · ${b.reason}` : ''}</span>
                      <button onClick={() => removeBlock(i)} style={{ background: 'none', border: 'none', color: red, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: sans }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function Listing() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const user        = useAuth(s => s.user)
  const listings    = useListings(s => s.listings)
  const loadListings = useListings(s => s.loadListings)
  const setFilter   = useListings(s => s.setFilter)
  const toggleTag   = useListings(s => s.toggleFilterTag)

  const saveContract = useContracts(s => s.saveContract)
  const [reviews, setReviews]     = useState([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => { if (!listings.length) loadListings() }, [listings.length, loadListings])

  useEffect(() => {
    if (!id) return
    try {
      const raw = localStorage.getItem(`cs_reviews_${id}`)
      setReviews(raw ? JSON.parse(raw) : [])
    } catch {
      setReviews([])
    }
  }, [id])

  const listing = listings.find(l => l.id === id)

  if (!listing) {
    return (
      <div style={{ flex: 1, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t2, fontFamily: sans, fontSize: 14 }}>
        Listing not found
      </div>
    )
  }

  const cfg    = CATS[listing.cat]
  const bs     = BADGE[cfg.badge]
  const tagCfg = TAGS[listing.subcat] || { color: bg4, text: t2 }
  const isOwn  = user && listing.ownerEmail === user.email
  const price  = listing.price_per_month || listing.price_per_day || listing.hourly_rate ||
    listing.asking_price || listing.loan_amount || listing.total_fee ||
    listing.max_budget || listing.max_rate || ''

  function searchByTag(tag) {
    setFilter('all')    // also clears tag filters
    toggleTag(tag)
    navigate('/')
  }

  async function startMessage() {
    if (!user) return
    if (user.email === listing.ownerEmail) return
    const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

    // Try Supabase when listing has a real UUID (inserted post-migration)
    if (UUID_RE.test(listing.id ?? '')) {
      try {
        // Reuse existing thread if one already exists for this listing + pair
        const existing = await findThread(listing.id, user.email, listing.ownerEmail)
        if (existing) {
          navigate(`/chat/${encodeURIComponent(existing.id)}`)
          return
        }
        // Create a new thread in Supabase
        const thread = await insertThread({
          listingId:    listing.id,
          listingTitle: listing.title,
          p1:           user.email,
          p1Id:         user.id,
          p1Name:       user.name,
          p1Color:      user.avatarColor,
          p2:           listing.ownerEmail,
          p2Id:         listing.ownerId,
          p2Name:       listing.ownerName,
          p2Color:      listing.ownerColor,
        })
        navigate(`/chat/${encodeURIComponent(thread.id)}`)
        return
      } catch (err) {
        console.warn('[Supabase] startMessage failed:', err.message)
      }
    }

    // localStorage fallback
    const tid = 'thread:' + [user.email, listing.ownerEmail].sort().join(':') + '::' + listing.id
    try {
      const all = JSON.parse(localStorage.getItem('cs_threads') || '[]')
      if (!all.find(t => t.id === tid)) {
        const now = new Date().toISOString()
        all.push({
          id: tid,
          listingId: listing.id, listingTitle: listing.title,
          p1: user.email, p1Name: user.name, p1Color: user.avatarColor,
          p2: listing.ownerEmail, p2Name: listing.ownerName, p2Color: listing.ownerColor,
          messages: [], createdAt: now, lastAt: now,
        })
        localStorage.setItem('cs_threads', JSON.stringify(all))
      }
    } catch {}
    navigate(`/chat/${encodeURIComponent(tid)}`)
  }

  return (
    <div style={{
      flex: 1, background: bg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: sans, fontSize: 15, color: text,
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px', background: bg,
        borderBottom: `1px solid ${bdr}`, flexShrink: 0,
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s', minHeight: 44, minWidth: 44 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Listing</div>
        <div style={{ width: 44 }} />
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 100px' }}>

        {/* Category color gradient tint */}
        <div style={{
          margin: '-16px -16px 14px',
          height: 52,
          background: `linear-gradient(to bottom, ${bs.color}20, transparent)`,
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 10,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 999,
          background: bs.bg, color: bs.color, border: `1px solid ${bs.border}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
          {cfg.icon} {cfg.label}
        </div>

        {/* Title */}
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 300, color: text, marginBottom: 6 }}>
          {listing.title}
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: price ? 8 : 14 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1C4.6 1 3 2.6 3 4.5c0 2.7 3.5 7.5 3.5 7.5S10 7.2 10 4.5C10 2.6 8.4 1 6.5 1z" stroke={t2} strokeWidth="1.2" />
            <circle cx="6.5" cy="4.5" r="1.2" fill={t2} />
          </svg>
          <span style={{ fontSize: 13, color: t2 }}>{listing.location}</span>
        </div>

        {/* Price */}
        {price && (
          <div style={{ fontSize: 26, fontWeight: 700, color: text, marginBottom: 14 }}>
            {price}
          </div>
        )}

        {/* Tags */}
        {listing.tags?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
              Tags
            </div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2, margin: '0 -16px', padding: '0 16px 2px' }}>
              {listing.tags.map(t => (
                <span
                  key={t}
                  onClick={() => searchByTag(t)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.2px',
                    padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
                    background: tagCfg.color, color: tagCfg.text,
                    border: `1px solid ${tagCfg.text}33`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: t3, marginTop: 6 }}>
              Tap a tag to browse similar listings
            </div>
          </div>
        )}

        {/* About */}
        <div style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
            About
          </div>
          <div style={{ fontSize: 14, color: t2, lineHeight: 1.7 }}>
            {listing.description || 'No description.'}
          </div>
        </div>

        {/* Availability calendar — rentals only, the only category with real date-range semantics */}
        {listing.cat === 'rental' && <AvailabilityCalendar listing={listing} isOwn={isOwn} />}

        {/* Owner card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 13, background: bg3, border: `1px solid ${acc}33`,
          borderRadius: 14, marginBottom: 12,
        }}>
          <Avatar name={listing.ownerName} color={listing.ownerColor} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Posted by</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{listing.ownerName}</div>
            <div style={{ fontSize: 12, color: t2 }}>{fmtDate(listing.createdAt)}</div>
            {listing.avgRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                <Stars rating={listing.avgRating} size={15} />
                <span style={{ fontSize: 12, fontWeight: 700, color: text }}>
                  {listing.avgRating.toFixed(1)}
                </span>
                <span style={{ fontSize: 11, color: t3 }}>({listing.reviewCount} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            {/* Rating summary bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, marginBottom: 10 }}>
              <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 300, color: text, lineHeight: 1 }}>
                {listing.avgRating?.toFixed(1) || '—'}
              </div>
              <div>
                <Stars rating={listing.avgRating || 0} size={16} />
                <div style={{ fontSize: 12, color: t2, marginTop: 4 }}>
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: text }}>Reviews</div>
              {reviews.length > 2 && (
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: acc, fontFamily: sans, padding: 0 }}>
                  See all {reviews.length}
                </button>
              )}
            </div>
            {reviews.slice(0, 2).map(rv => (
              <div key={rv.id} style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Avatar name={rv.reviewerName} color={rv.reviewerColor} size={28} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{rv.reviewerName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Stars rating={rv.rating} />
                      <span style={{ fontSize: 11, color: t3 }}>{fmtDate(rv.at)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: t2, lineHeight: 1.55 }}>{rv.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: bg3, border: `1px solid ${bdr}`, borderRadius: 14,
            padding: '12px 14px', marginBottom: 12,
            textAlign: 'center', fontSize: 13, color: t3,
          }}>
            No reviews yet — be the first to sign and review!
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      {isOwn ? (
        <div style={{
          padding: '14px 16px',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
          background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0,
          textAlign: 'center', fontSize: 13, color: t2,
          boxShadow: `0 -16px 24px ${bg}`,
        }}>
          Your listing
        </div>
      ) : listing.cat === 'seek' ? (
        /* Seek listing: visitor is offering help — show Message + "I can help →" */
        <div style={{
          padding: '14px 16px',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
          background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9,
          boxShadow: `0 -16px 24px ${bg}`,
        }}>
          <button
            onClick={startMessage}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 14, borderRadius: 14, border: `1px solid ${bdr}`, background: bg3, color: text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans, transition: 'all 0.18s' }}
          >
            💬 Message
          </button>
          <button
            disabled={generating}
            onClick={async () => {
              if (generating || !user) return

              // Same split as Chat.jsx: rental-backed seek listings (looking
              // for a room / parking) get the configure step; other seek
              // types keep today's immediate generation.
              if (['seek_room', 'seek_parking'].includes(listing.subcat)) {
                navigate('/configure-contract', {
                  state: { listing, otherName: listing.ownerName, otherEmail: listing.ownerEmail, otherColor: listing.ownerColor },
                })
                return
              }

              setGenerating(true)
              try {
                const { contractText, templateId, templateVersion } = await generateContract(listing, user.name, listing.ownerName)
                const doc = {
                  id: Math.random().toString(36).slice(2, 12),
                  listingId: listing.id,
                  listingTitle: listing.title,
                  contractText,
                  templateId,
                  templateVersion,
                  status: 'pending_counterparty',
                  creatorEmail: user.email,
                  creatorName: user.name,
                  creatorColor: user.avatarColor,
                  creatorRole: 'provider',
                  counterpartyEmail: listing.ownerEmail,
                  counterpartyName: listing.ownerName,
                  counterpartyColor: listing.ownerColor,
                  counterpartyRole: 'seeker',
                  createdAt: new Date().toISOString(),
                }
                const saved = await saveContract(doc)
                try {
                  const notifKey = `cs_notifs_${listing.ownerEmail}`
                  const existing = JSON.parse(localStorage.getItem(notifKey) || '[]')
                  localStorage.setItem(notifKey, JSON.stringify([{
                    id: Math.random().toString(36).slice(2, 10),
                    type: 'contract_request',
                    title: 'New contract offer',
                    body: `${user.name} can help with: "${listing.title}"`,
                    at: new Date().toISOString(),
                    read: false,
                    contractId: saved.id,
                  }, ...existing]))
                } catch {}
                navigate(`/contract/${saved.id}`)
              } catch {
                setGenerating(false)
              }
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 14, borderRadius: 14, border: 'none', background: acc, color: '#fff', opacity: generating ? 0.6 : 1, fontSize: 14, fontWeight: 600, cursor: generating ? 'default' : 'pointer', fontFamily: sans, transition: 'all 0.18s' }}
          >
            {generating ? 'Generating…' : 'I can help →'}
          </button>
        </div>
      ) : (
        /* Rental / service / sale: contract flows through Chat (owner initiates) */
        <div style={{
          padding: '14px 16px',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
          background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0,
          boxShadow: `0 -16px 24px ${bg}`,
        }}>
          <button
            onClick={startMessage}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 14, borderRadius: 14, border: `1px solid ${bdr}`, background: bg3, color: text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans, width: '100%', transition: 'all 0.18s' }}
          >
            💬 Message
          </button>
        </div>
      )}
    </div>
  )
}
