import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useListings } from '../store/useListings'

const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const amber = '#f5a623'
const green = '#3ecf7a'
const greenbg  = '#0c2018'
const greenbdr = '#183a28'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!']

export default function Review() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const user         = useAuth(s => s.user)
  const updateListing = useListings(s => s.updateListing)

  const { contractId, listingId, targetName } = location.state || {}

  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!contractId || !listingId) {
    navigate('/vault', { replace: true })
    return null
  }

  function submit() {
    if (!rating) return
    if (!reviewText.trim()) return
    setSubmitting(true)

    const review = {
      id: Math.random().toString(36).slice(2, 10),
      listingId,
      contractId,
      reviewerName:  user.name,
      reviewerEmail: user.email,
      reviewerColor: user.avatarColor,
      rating,
      text: reviewText.trim(),
      at: new Date().toISOString(),
    }

    try {
      const key      = `cs_reviews_${listingId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const next     = [review, ...existing]
      localStorage.setItem(key, JSON.stringify(next))

      const avgRating   = next.reduce((s, r) => s + r.rating, 0) / next.length
      const reviewCount = next.length
      updateListing(listingId, { avgRating, reviewCount })
    } catch {}

    navigate('/vault')
  }

  const displayed = hover || rating

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Review</div>
        <div style={{ width: 44 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '24px 16px 100px' }}>

        {/* Tag + heading */}
        <div style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
          Verified review
        </div>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 300, color: text, marginBottom: 6, lineHeight: 1.2 }}>
          How was it?
        </div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 24, lineHeight: 1.5 }}>
          Only possible after a sealed contract — so everyone knows it's real.
        </div>

        {/* Stars */}
        <div style={{ textAlign: 'center', padding: '0 0 24px' }}>
          <div style={{ fontSize: 14, color: t2, marginBottom: 14 }}>
            Rate your experience with <strong style={{ color: text }}>{targetName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <span
                key={i}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                style={{
                  fontSize: 36, cursor: 'pointer',
                  color: displayed >= i ? amber : bg3,
                  transition: 'color 0.1s',
                  lineHeight: 1,
                }}
              >
                ★
              </span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: displayed ? amber : t3, marginTop: 10, minHeight: 20 }}>
            {LABELS[displayed] || 'Tap to rate'}
          </div>
        </div>

        {/* Review text */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t2, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
            Your review
          </label>
          <textarea
            rows={4}
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Tell others what it was like…"
            onFocus={e => e.target.style.borderColor = acc}
            onBlur={e => e.target.style.borderColor = bdr}
            style={{
              width: '100%', background: bg3, border: `1px solid ${bdr}`, borderRadius: 8,
              padding: '11px 13px', fontSize: 14, fontFamily: sans, color: text,
              outline: 'none', resize: 'none', transition: 'border-color 0.18s',
            }}
          />
        </div>

        {/* Verified badge */}
        <div style={{ background: greenbg, border: `1px solid ${greenbdr}`, borderRadius: 8, padding: '11px 13px', fontSize: 12, color: green, lineHeight: 1.5, marginBottom: 8 }}>
          ✓ Verified — only possible after both parties signed on ClearSign.
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button
          onClick={submit}
          disabled={!rating || !reviewText.trim() || submitting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: 14, borderRadius: 14, border: 'none',
            background: rating && reviewText.trim() ? acc : bg3,
            color: rating && reviewText.trim() ? '#fff' : t3,
            fontSize: 14, fontWeight: 600,
            cursor: rating && reviewText.trim() ? 'pointer' : 'default',
            fontFamily: sans, transition: 'all 0.18s',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit review →'}
        </button>
      </div>
    </div>
  )
}
