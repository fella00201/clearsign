import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContracts } from '../store/useContracts'
import { useAuth } from '../store/useAuth'

const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const green = '#3ecf7a'
const greenbg  = '#0c2018'
const greenbdr = '#183a28'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

function initials(n) {
  return (n || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

function Avatar({ name, color, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, color,
      fontSize: Math.round(size * 0.33), fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {initials(name)}
    </div>
  )
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Vault() {
  const navigate       = useNavigate()
  const user           = useAuth(s => s.user)
  const contracts      = useContracts(s => s.contracts)
  const loadContracts  = useContracts(s => s.loadContracts)
  const setActiveDoc   = useContracts(s => s.setActiveDoc)
  useEffect(() => { loadContracts(user?.email) }, [loadContracts, user?.email])

  const mine = contracts.filter(c =>
    c.creatorEmail === user?.email || c.counterpartyEmail === user?.email
  )

  function open(c) {
    setActiveDoc(c)
    navigate(`/contract/${c.id}`)
  }

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Vault</div>
        <div style={{ fontSize: 12, color: t3, width: 44, textAlign: 'right' }}>{mine.length} doc{mine.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 16px 40px' }}>

        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: text, marginBottom: 4 }}>
          My Vault
        </div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 20 }}>
          {mine.length} contract{mine.length !== 1 ? 's' : ''}
        </div>

        {mine.length === 0 ? (
          <div style={{ background: bg3, border: `1px solid ${bdr}`, borderRadius: 14, padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: t3, lineHeight: 1.6 }}>
              No contracts yet.<br />Create one from a listing.
            </div>
          </div>
        ) : (
          mine.map(c => {
            const sealed = c.status === 'sealed'
            const other  = c.creatorEmail === user?.email
              ? { name: c.counterpartyName, color: c.counterpartyColor }
              : { name: c.creatorName,      color: c.creatorColor }
            const mySigned = c.creatorEmail === user?.email
              ? !!c.creatorSignedAt
              : !!c.counterpartySignedAt

            return (
              <div
                key={c.id}
                onClick={() => open(c)}
                style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <Avatar name={other.name} color={other.color} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.listingTitle || 'Contract'}
                    </div>
                    <div style={{ fontSize: 11, color: t2 }}>with {other.name}</div>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 999,
                    background: sealed ? greenbg : '#1a2d4a',
                    color: sealed ? green : acc,
                    border: `1px solid ${sealed ? greenbdr : '#1e3560'}`,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    {sealed ? 'Sealed' : 'Pending'}
                  </div>
                </div>
                {c.listingId && c.listingTitle && (
                  <div
                    onClick={e => { e.stopPropagation(); navigate(`/listing/${c.listingId}`) }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 9px', borderRadius: 999, marginBottom: 8,
                      background: bg3, color: t2, fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    Re: {c.listingTitle} ↗
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, color: t3 }}>
                    {fmtDate(sealed ? c.sealedAt : c.createdAt)}
                  </div>
                  {!sealed && (
                    <div style={{ fontSize: 11, color: mySigned ? green : acc }}>
                      {mySigned ? 'You signed · waiting' : 'Awaiting your signature'}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
