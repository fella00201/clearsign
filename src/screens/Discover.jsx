import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListings } from '../store/useListings'
import { useAuth } from '../store/useAuth'
import { CATS, TAGS, ALL_POPULAR_TAGS } from '../data/categories'
import { useIsDesktop } from '../components/NavBar'

// ── Design tokens ──────────────────────────────────────────────────────────
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
const acc2  = '#3d6ee0'
const accbg = '#141f3c'
const amber = '#f5a623'
const red   = '#ff5b5b'
const redbg = '#220d0d'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

const BADGE = {
  'b-rental':  { bg: '#1a2d4a', color: '#7eb8ff', border: '#1e3560' },
  'b-service': { bg: '#220d18', color: '#ff7eb3', border: '#3a1528' },
  'b-sale':    { bg: '#231a04', color: '#f5a623', border: '#3a2a08' },
  'b-seek':    { bg: '#0c2018', color: '#3ecf7a', border: '#183a28' },
}

// ── Helpers ────────────────────────────────────────────────────────────────
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

function TagPill({ tag, subcat }) {
  const cfg = subcat && TAGS[subcat]
    ? { bg: TAGS[subcat].color, color: TAGS[subcat].text }
    : { bg: '#1e2630', color: '#7eb8ff' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.2px',
      padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
    }}>
      {tag}
    </span>
  )
}

function ListingCard({ listing, onNavigate }) {
  const cfg = CATS[listing.cat]
  const bs  = BADGE[cfg.badge]
  const CSYM = { USD:'$',EUR:'€',GBP:'£',SEK:'kr',NOK:'kr',DKK:'kr',CHF:'Fr',CAD:'CA$',AUD:'A$',NZD:'NZ$',JPY:'¥',CNY:'¥',INR:'₹',BRL:'R$',MXN:'MX$',SGD:'S$',HKD:'HK$',ZAR:'R' }
  const legacyPrice = listing.price_per_month || listing.price_per_day || listing.hourly_rate ||
    listing.asking_price || listing.loan_amount || listing.total_fee ||
    listing.max_budget || listing.max_rate || ''
  const price = listing.price
    ? `${CSYM[listing.price_currency] || '$'}${listing.price}${listing.price_period && listing.price_period !== 'one-time' ? '/' + listing.price_period.replace('per ', '') : ''}`
    : legacyPrice
  const tags      = listing.tags || []
  const shownTags = tags.slice(0, 3)

  return (
    <div
      onClick={() => onNavigate(`/listing/${listing.id}`)}
      style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.18s ease', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = bdr2; e.currentTarget.style.background = bg3; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.32)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = bdr; e.currentTarget.style.background = bg2; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Badge + price */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
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

      {/* Title */}
      <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 400, color: text, marginBottom: 3 }}>
        {listing.title}
      </div>

      {/* Location */}
      <div style={{ fontSize: 12, color: t2, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1C4.3 1 3 2.3 3 4c0 2.5 3 7 3 7s3-4.5 3-7c0-1.7-1.3-3-3-3z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="6" cy="4" r="1" fill="currentColor" />
        </svg>
        {listing.location}
      </div>

      {/* Description preview */}
      {listing.description && (
        <div style={{ fontSize: 12, color: t2, lineHeight: 1.5, marginBottom: 8, flex: 1 }}>
          {listing.description.length > 80 ? listing.description.slice(0, 80) + '…' : listing.description}
        </div>
      )}

      {/* Tags */}
      {shownTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {shownTags.map(t => <TagPill key={t} tag={t} subcat={listing.subcat} />)}
          {tags.length > 3 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
              background: bg4, color: t3, border: `1px solid ${bdr}`,
            }}>
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Owner + rating */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Avatar name={listing.ownerName} color={listing.ownerColor} size={26} />
        {listing.reviewCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Stars rating={listing.avgRating} />
            <span style={{ fontSize: 11, color: t3 }}>({listing.reviewCount})</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function Discover() {
  const navigate = useNavigate()
  const user = useAuth(s => s.user)
  const isDesktop = useIsDesktop()

  const listings     = useListings(s => s.listings)
  const searchQ      = useListings(s => s.searchQ)
  const filterCat    = useListings(s => s.filterCat)
  const filterTags   = useListings(s => s.filterTags)
  const loadListings = useListings(s => s.loadListings)
  const setSearch    = useListings(s => s.setSearch)
  const setFilter    = useListings(s => s.setFilter)
  const toggleTag    = useListings(s => s.toggleFilterTag)
  const clearTags    = useListings(s => s.clearTagFilters)

  useEffect(() => { loadListings() }, [loadListings])

  const filtered = useMemo(() => {
    const q = searchQ.toLowerCase()
    return listings.filter(l => {
      if (filterCat !== 'all' && l.cat !== filterCat) return false
      if (filterTags.length > 0) {
        const lt = l.tags ?? []
        if (!filterTags.every(t => lt.includes(t))) return false
      }
      if (q) {
        const hay = [l.title, l.location, l.description ?? '', ...(l.tags ?? [])]
          .join(' ').toLowerCase()
        return hay.includes(q)
      }
      return true
    })
  }, [listings, searchQ, filterCat, filterTags])

  // Smart tag suggestions: category-scoped or global popular
  const suggestedTags = filterCat !== 'all'
    ? (() => {
        const seen = new Set()
        Object.keys(CATS[filterCat]?.sub || {}).forEach(st => {
          if (TAGS[st]) TAGS[st].tags.slice(0, 8).forEach(t => seen.add(t))
        })
        return [...seen].slice(0, 16)
      })()
    : ALL_POPULAR_TAGS

  const noAlerts = user && (!user.alerts || !user.alerts.length)
  const [searchFocused, setSearchFocused] = useState(false)

  // ── Shared search bar ──────────────────────────────────────────────────
  const searchBar = (
    <div
      onFocus={() => setSearchFocused(true)}
      onBlur={() => setSearchFocused(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: bg3, border: `1px solid ${searchFocused ? acc : bdr}`,
        borderRadius: 8, padding: '10px 13px',
        transition: 'border-color 0.18s',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="6.5" cy="6.5" r="4.5" stroke={searchFocused ? acc : t3} strokeWidth="1.3" />
        <path d="M10 10l3 3" stroke={searchFocused ? acc : t3} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        placeholder="Search location, type, tag, keyword…"
        value={searchQ}
        onChange={e => setSearch(e.target.value)}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          fontFamily: sans, fontSize: 14, color: text,
        }}
      />
      {searchQ && (
        <button
          onClick={() => setSearch('')}
          style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
        >
          ✕
        </button>
      )}
    </div>
  )

  // ── Shared alert banner ────────────────────────────────────────────────
  const alertBanner = noAlerts ? (
    <div onClick={() => navigate('/alert-setup')} style={{
      background: accbg, border: `1px solid ${acc}`, borderRadius: 14,
      padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5a5.5 5.5 0 015.5 5.5c0 3.2-5.5 10-5.5 10S3.5 10.2 3.5 7A5.5 5.5 0 019 1.5z" stroke={acc} strokeWidth="1.3" />
        <circle cx="9" cy="7" r="1.5" fill={acc} />
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: acc }}>Set up location alerts</div>
        <div style={{ fontSize: 11, color: t2, marginTop: 1 }}>Get notified when listings appear near you</div>
      </div>
    </div>
  ) : null

  // ── Empty state ────────────────────────────────────────────────────────
  const hasFilters = searchQ || filterTags.length > 0
  const emptyState = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 24px', textAlign: 'center', gap: 10 }}>
      <div style={{ fontSize: 48, marginBottom: 4 }}>🔍</div>
      <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: text, margin: 0 }}>No listings found</h3>
      <p style={{ fontSize: 13, color: t2, maxWidth: 260, lineHeight: 1.6, margin: 0 }}>
        {hasFilters
          ? 'No listings match your filters — try different keywords or clear all filters.'
          : 'No listings yet. Be the first to post!'}
      </p>
      {hasFilters && (
        <button onClick={() => { clearTags(); setSearch('') }} style={{
          marginTop: 8, padding: '9px 18px', fontSize: 12, borderRadius: 8,
          border: `1px solid ${bdr}`, background: bg3, color: text,
          cursor: 'pointer', fontFamily: sans, fontWeight: 600,
        }}>
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div style={{
      flex: 1, background: bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: sans, fontSize: 15, color: text,
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '13px 16px', background: bg,
        borderBottom: `1px solid ${bdr}`, flexShrink: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/notifications')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.18s' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 016 6c0 3.5 1.5 5 1.5 5h-15s1.5-1.5 1.5-5a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8.5 16a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {isDesktop ? (
        // ── Desktop layout ──────────────────────────────────────────────────
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Sidebar */}
          <div style={{
            width: 260, flexShrink: 0,
            borderRight: `1px solid ${bdr}`,
            overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            background: bg,
          }}>
            {/* Category section */}
            <div style={{ padding: '20px 12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, padding: '0 4px' }}>
                Category
              </div>
              {[['all', null, 'All'], ...Object.entries(CATS).map(([k, c]) => [k, c.icon, c.label])].map(([k, icon, label]) => {
                const on = filterCat === k
                return (
                  <div key={k} onClick={() => setFilter(k)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                    background: on ? accbg : 'transparent',
                    border: `1px solid ${on ? acc : 'transparent'}`,
                    color: on ? acc : t2,
                    transition: 'all 0.18s',
                    minHeight: 44,
                  }}
                  onMouseEnter={e => { if (!on) { e.currentTarget.style.background = bg3; e.currentTarget.style.color = text } }}
                  onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t2 } }}
                  >
                    {icon && <span>{icon}</span>}
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                  </div>
                )
              })}
            </div>

            {/* Tag section */}
            <div style={{ borderTop: `1px solid ${bdr}`, padding: '16px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Tags
                </div>
                {filterTags.length > 0 && (
                  <div onClick={clearTags} style={{ fontSize: 11, color: red, cursor: 'pointer', fontWeight: 700 }}>
                    Clear
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {suggestedTags.slice(0, 24).map(t => {
                  const on = filterTags.includes(t)
                  return (
                    <div key={t} onClick={() => toggleTag(t)} style={{
                      display: 'inline-flex', alignItems: 'center',
                      fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 999,
                      cursor: 'pointer', transition: 'all 0.18s',
                      border: `1.5px solid ${on ? acc : bdr}`,
                      background: on ? accbg : bg3, color: on ? acc : t2,
                    }}>
                      {t}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column' }}>
            {/* Search bar */}
            <div style={{ padding: '16px 20px 8px' }}>
              {searchBar}
            </div>

            {/* Alert banner */}
            {noAlerts && (
              <div style={{ padding: '4px 20px 8px' }}>
                {alertBanner}
              </div>
            )}

            {/* Active tag filter summary */}
            {filterTags.length > 0 && (
              <div style={{ padding: '2px 20px 6px', fontSize: 12, color: acc }}>
                Filtering by: {filterTags.map((t, i) => (
                  <span key={t}>{i > 0 && ', '}<strong>{t}</strong></span>
                ))}
              </div>
            )}

            {/* Count header */}
            <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '10px 20px 12px' }}>
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
            </div>

            {/* 2-column grid */}
            {filtered.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 14,
                padding: '0 20px 40px',
                alignItems: 'start',
              }}>
                {filtered.map(l => <ListingCard key={l.id} listing={l} onNavigate={navigate} />)}
              </div>
            ) : (
              emptyState
            )}
          </div>
        </div>
      ) : (
        // ── Mobile layout ───────────────────────────────────────────────────
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* Search bar */}
          <div style={{ margin: '12px 16px 4px' }}>
            {searchBar}
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 7, padding: '10px 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[['all', null, 'All'], ...Object.entries(CATS).map(([k, c]) => [k, c.icon, c.label])].map(([k, icon, label]) => {
              const on = filterCat === k
              return (
                <div key={k} onClick={() => setFilter(k)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  background: on ? accbg : bg3,
                  border: `1px solid ${on ? acc : bdr}`,
                  borderRadius: 999, padding: on ? '6px 13px 5px' : '6px 13px',
                  fontSize: 12, fontWeight: 600, color: on ? acc : t2,
                  cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {icon && <span>{icon}</span>}{label}
                  </div>
                  {on && <div style={{ width: 4, height: 4, borderRadius: '50%', background: acc }} />}
                </div>
              )
            })}
          </div>

          {/* Tag filter row */}
          <div style={{ display: 'flex', gap: 6, padding: '4px 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {filterTags.length > 0 && (
              <div onClick={clearTags} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 999,
                cursor: 'pointer', border: `1.5px solid ${red}`,
                background: redbg, color: red, whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                ✕ Clear tags
              </div>
            )}
            {suggestedTags.map(t => {
              const on = filterTags.includes(t)
              return (
                <div key={t} onClick={() => toggleTag(t)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 999,
                  cursor: 'pointer', transition: 'all 0.18s',
                  border: `1.5px solid ${on ? acc : bdr}`,
                  background: on ? accbg : bg3, color: on ? acc : t2,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {t}
                </div>
              )
            })}
          </div>

          {/* Active filter summary */}
          {filterTags.length > 0 && (
            <div style={{ padding: '2px 16px 6px', fontSize: 12, color: acc }}>
              Filtering by: {filterTags.map((t, i) => (
                <span key={t}>{i > 0 && ', '}<strong>{t}</strong></span>
              ))}
            </div>
          )}

          {/* Location alert banner */}
          {noAlerts && (
            <div style={{ margin: '6px 16px' }}>
              {alertBanner}
            </div>
          )}

          {/* Count header */}
          <div style={{ fontSize: 12, color: t3, padding: '4px 16px 8px' }}>
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''} near you
          </div>

          {/* Listing cards / empty state */}
          <div style={{ padding: '0 16px 90px' }}>
            {filtered.length > 0
              ? filtered.map(l => <ListingCard key={l.id} listing={l} onNavigate={navigate} />)
              : emptyState
            }
          </div>
        </div>
      )}

    </div>
  )
}
