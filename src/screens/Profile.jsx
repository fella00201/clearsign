import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useContracts } from '../store/useContracts'
import { CATS, TAGS } from '../data/categories'

const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bg4   = '#27272f'
const bdr   = '#2a2a36'
const bdr2  = '#3a3a4c'
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
  return (name || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 12, color: rating >= i ? amber : bg4 }}>★</span>
      ))}
    </div>
  )
}

function ListingCard({ listing, onNavigate }) {
  const cfg  = CATS[listing.cat]
  const bs   = BADGE[cfg.badge]
  const price = listing.price_per_month || listing.price_per_day || listing.hourly_rate ||
    listing.asking_price || listing.loan_amount || listing.total_fee ||
    listing.max_budget || listing.max_rate || ''
  const tagCfg = TAGS[listing.subcat] || { color: '#1e2630', text: '#7eb8ff' }
  const shown = (listing.tags || []).slice(0, 3)

  return (
    <div
      onClick={() => onNavigate(`/listing/${listing.id}`)}
      style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = bdr2; e.currentTarget.style.background = bg3 }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = bdr;  e.currentTarget.style.background = bg2 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 999,
          background: bs.bg, color: bs.color, border: `1px solid ${bs.border}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
          {cfg.icon} {cfg.label}
        </div>
        {price && <div style={{ fontSize: 15, fontWeight: 700, color: text }}>{price}</div>}
      </div>
      <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 400, color: text, marginBottom: 3 }}>{listing.title}</div>
      <div style={{ fontSize: 12, color: t2, display: 'flex', alignItems: 'center', gap: 4, marginBottom: shown.length ? 8 : 0 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M6 1C4.3 1 3 2.3 3 4c0 2.5 3 7 3 7s3-4.5 3-7c0-1.7-1.3-3-3-3z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="6" cy="4" r="1" fill="currentColor" />
        </svg>
        {listing.location}
      </div>
      {shown.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {shown.map(t => (
            <span key={t} style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
              background: tagCfg.color, color: tagCfg.text,
              border: `1px solid ${tagCfg.text}33`,
            }}>{t}</span>
          ))}
        </div>
      )}
      {listing.reviewCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
          <Stars rating={listing.avgRating} />
          <span style={{ fontSize: 11, color: t3 }}>({listing.reviewCount})</span>
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const navigate   = useNavigate()
  const user       = useAuth(s => s.user)
  const signout    = useAuth(s => s.signout)
  const contracts  = useContracts(s => s.contracts)
  let myListings = []
  try {
    const all = JSON.parse(localStorage.getItem('cs_listings_user') || '[]')
    myListings = all.filter(l => l.ownerEmail === user?.email)
  } catch {}

  const myContracts = contracts.filter(
    c => c.creatorEmail === user?.email || c.counterpartyEmail === user?.email
  )

  function handleSignOut() {
    signout()
    navigate('/auth', { replace: true })
  }

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Profile</div>
        <div style={{ width: 44 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 100px' }}>

        {/* Avatar + name + email */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 0 24px', textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: `${user?.avatarColor || acc}22`, color: user?.avatarColor || acc,
            fontSize: 20, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {initials(user?.name || '')}
          </div>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: text }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 13, color: t2 }}>{user?.email}</div>
          <div style={{ fontSize: 12, color: t3, marginTop: 4 }}>
            {myListings.length} listing{myListings.length !== 1 ? 's' : ''} · {myContracts.length} contract{myContracts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* My listings */}
        <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
          My listings
        </div>

        {myListings.length > 0 ? (
          myListings.map(l => <ListingCard key={l.id} listing={l} onNavigate={navigate} />)
        ) : (
          <div style={{ background: bg3, border: `1px solid ${bdr}`, borderRadius: 14, padding: '20px 16px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: t3, lineHeight: 1.6 }}>
              No listings yet.<br />Post one from the + tab.
            </div>
          </div>
        )}

        {/* Sign out */}
        <div>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: 14, borderRadius: 14,
              border: `1px solid ${bdr}`, background: bg3, color: t2,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = text}
            onMouseLeave={e => e.currentTarget.style.color = t2}
          >
            Sign out
          </button>
        </div>
      </div>

    </div>
  )
}
