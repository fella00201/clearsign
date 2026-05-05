import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useContracts } from '../store/useContracts'

const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

function initials(name) {
  return (name || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

export default function Profile() {
  const navigate   = useNavigate()
  const user       = useAuth(s => s.user)
  const signout    = useAuth(s => s.signout)
  const contracts  = useContracts(s => s.contracts)

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
            {myContracts.length} contract{myContracts.length !== 1 ? 's' : ''} in vault
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

    </div>
  )
}
