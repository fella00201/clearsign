import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useListings } from '../store/useListings'
import { useAuth } from '../store/useAuth'
import { useContracts } from '../store/useContracts'
import { generateContract } from '../lib/contracts'
import { findThread, insertThread } from '../lib/supabase'
import { CATS, TAGS } from '../data/categories'

// ── Design tokens ──────────────────────────────────────────────────────────
const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const amber = '#f5a623'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

const BADGE = {
  'b-rental':  { bg: '#1a2d4a', color: '#7eb8ff', border: '#1e3560' },
  'b-service': { bg: '#220d18', color: '#ff7eb3', border: '#3a1528' },
  'b-sale':    { bg: '#231a04', color: '#f5a623', border: '#3a2a08' },
  'b-seek':    { bg: '#0c2018', color: '#3ecf7a', border: '#183a28' },
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
        <span key={i} style={{ fontSize: size, color: rating >= i ? amber : '#27272f' }}>★</span>
      ))}
    </div>
  )
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  const tagCfg = TAGS[listing.subcat] || { color: '#1e2630', text: '#7eb8ff' }
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
      display: 'flex', flexDirection: 'column',
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
              setGenerating(true)
              try {
                const contractText = await generateContract(listing, user.name, 'provider')
                const doc = {
                  id: Math.random().toString(36).slice(2, 12),
                  listingId: listing.id,
                  listingTitle: listing.title,
                  contractText,
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 14, borderRadius: 14, border: 'none', background: generating ? '#3a4a6a' : acc, color: '#fff', fontSize: 14, fontWeight: 600, cursor: generating ? 'default' : 'pointer', fontFamily: sans, transition: 'all 0.18s' }}
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
