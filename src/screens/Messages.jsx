import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

// ── Design tokens ──────────────────────────────────────────────────────────
const bg   = '#0d0d11'
const bg3  = '#1e1e26'
const bdr  = '#2a2a36'
const text = '#eeedf5'
const t2   = '#9896b2'
const t3   = '#56546c'
const acc  = '#5b8fff'
const sans = "'Instrument Sans', sans-serif"
const serif = "'Fraunces', serif"

function initials(name) {
  return name.split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

function Avatar({ name, color, size = 40 }) {
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

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── NavBar ─────────────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'discover', path: '/',         label: 'Find',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M14 14l3 3" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { id: 'messages', path: '/messages', label: 'Messages',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M6 8h8M6 11h5" stroke={on ? acc : t3} strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { id: 'post',     path: '/post',     label: 'Post',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M10 6v8M6 10h8" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { id: 'vault',    path: '/vault',    label: 'Vault',
    icon: (on) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke={on ? acc : t3} strokeWidth="1.4"/><path d="M7 10l2.5 2.5L13 8" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'profile',  path: '/profile',  label: 'Profile',
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

// ── Screen ─────────────────────────────────────────────────────────────────
export default function Messages() {
  const navigate = useNavigate()
  const user     = useAuth(s => s.user)
  const [threads, setThreads] = useState([])

  useEffect(() => {
    if (!user?.email) return
    try {
      const all = JSON.parse(localStorage.getItem('cs_threads') || '[]')
      const mine = all
        .filter(t => t.p1 === user.email || t.p2 === user.email)
        .sort((a, b) => new Date(b.lastAt || b.createdAt) - new Date(a.lastAt || a.createdAt))
      setThreads(mine)
    } catch {
      setThreads([])
    }
  }, [user?.email])

  return (
    <div style={{ minHeight: '100svh', background: bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, color: text }}>
          Clear<b style={{ color: acc, fontWeight: 500 }}>Sign</b>
        </div>
        <div style={{ fontSize: 12, color: t3 }}>
          {threads.length} chat{threads.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {threads.length > 0 ? threads.map(t => {
          const other = t.p1 === user.email
            ? { name: t.p2Name, color: t.p2Color }
            : { name: t.p1Name, color: t.p1Color }
          const msgs   = t.messages || []
          const last   = msgs[msgs.length - 1]
          const unread = last && last.from !== user.email && !last.read
          const preview = t.listingTitle ? `Re: ${t.listingTitle}` : last ? last.text : 'New chat'

          return (
            <div
              key={t.id}
              onClick={() => navigate(`/chat/${encodeURIComponent(t.id)}`)}
              style={{ display: 'flex', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${bdr}`, cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.background = bg3}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Avatar with unread dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={other.name} color={other.color} size={40} />
                {unread && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: acc, border: `2px solid ${bg}` }} />
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: unread ? 700 : 500, color: text }}>{other.name}</div>
                  <div style={{ fontSize: 11, color: t3 }}>{last ? fmtTime(last.at) : ''}</div>
                </div>
                <div style={{ fontSize: 12, color: t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                  {preview}
                </div>
              </div>
            </div>
          )
        }) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 24px', textAlign: 'center', gap: 10 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>💬</div>
            <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, color: text, margin: 0 }}>No messages yet</h3>
            <p style={{ fontSize: 13, color: t2, maxWidth: 240, lineHeight: 1.6, margin: 0 }}>
              Message a listing owner and your chat appears here.
            </p>
          </div>
        )}
      </div>

      <NavBar active="messages" />
    </div>
  )
}
