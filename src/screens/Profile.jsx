import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { CATS, TAGS } from '../data/categories'
import NavBar from '../components/NavBar'

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

// Light-mode surface colours (applied via body.light CSS)
const LIGHT = {
  bg:   '#f8f8f5',
  bg2:  '#ffffff',
  bg3:  '#f0f0ec',
  text: '#0f0e17',
}

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

// ── Theme helpers ──────────────────────────────────────────────────────────
function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'light') {
    document.body.classList.add('light')
    root.style.setProperty('--cs-bg',   LIGHT.bg)
    root.style.setProperty('--cs-bg2',  LIGHT.bg2)
    root.style.setProperty('--cs-bg3',  LIGHT.bg3)
    root.style.setProperty('--cs-text', LIGHT.text)
  } else {
    document.body.classList.remove('light')
    root.style.removeProperty('--cs-bg')
    root.style.removeProperty('--cs-bg2')
    root.style.removeProperty('--cs-bg3')
    root.style.removeProperty('--cs-text')
  }
}

export default function Profile() {
  const navigate = useNavigate()
  const user     = useAuth(s => s.user)
  const signout  = useAuth(s => s.signout)

  const [theme, setTheme] = useState(
    () => localStorage.getItem('cs_theme') || 'dark'
  )

  let myListings = []
  try {
    const all = JSON.parse(localStorage.getItem('cs_listings_user') || '[]')
    myListings = all.filter(l => l.ownerEmail === user?.email)
  } catch {}

  function handleSignOut() {
    signout()
    navigate('/auth', { replace: true })
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('cs_theme', next)
    applyTheme(next)
  }

  return (
    <div style={{ minHeight: '100svh', background: bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', fontFamily: serif, fontSize: 20, fontWeight: 600, color: text }}>
          Clear<b style={{ color: acc, fontWeight: 600 }}>Sign</b>
        </div>
        <div style={{ width: 34 }} />
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

        {/* ── Settings ── */}
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
            Appearance
          </div>
          <div style={{ background: bg3, border: `1px solid ${bdr}`, borderRadius: 14, padding: '0 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0', minHeight: 44,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Theme</div>
                <div style={{ fontSize: 12, color: t2, marginTop: 2 }}>
                  {theme === 'light' ? 'Light mode' : 'Dark mode'}
                </div>
              </div>
              {/* Sun / Moon toggle */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 48, height: 48, borderRadius: 12,
                  border: `1px solid ${bdr}`,
                  background: theme === 'light' ? '#f5a62322' : bg4,
                  cursor: 'pointer', fontSize: 22,
                  transition: 'all 0.22s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = bdr2 }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = bdr }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </div>

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

      <NavBar active="profile" />
    </div>
  )
}
