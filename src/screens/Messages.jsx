import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { fetchThreadsWithUnread } from '../lib/supabase'
import { bg, bg3, bdr, text, t2, t3, acc, accbg, red, sans, serif } from '../theme'

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

// ── Screen ─────────────────────────────────────────────────────────────────
export default function Messages() {
  const navigate  = useNavigate()
  const user      = useAuth(s => s.user)
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return
    let cancelled = false
    setLoading(true)

    async function load() {
      // Try Supabase first
      try {
        const rows = await fetchThreadsWithUnread(user.email)
        if (!cancelled) { setThreads(rows); setLoading(false); return }
      } catch {}

      // localStorage fallback — messages are embedded per-thread here, so
      // unread count and the last message are derived locally instead of
      // via a second query.
      try {
        const all = JSON.parse(localStorage.getItem('cs_threads') || '[]')
        const mine = all
          .filter(t => t.p1 === user.email || t.p2 === user.email)
          .map(t => {
            const msgs = t.messages || []
            const last = msgs[msgs.length - 1]
            const unreadCount = msgs.filter(m => m.from !== user.email && !m.read).length
            return { ...t, unreadCount, lastMessage: last ? { from: last.from, text: last.text, at: last.at } : null }
          })
          .sort((a, b) => new Date(b.lastMessage?.at || b.lastAt || b.createdAt) - new Date(a.lastMessage?.at || a.lastAt || a.createdAt))
        if (!cancelled) setThreads(mine)
      } catch {
        if (!cancelled) setThreads([])
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [user?.email])

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Messages</div>
        <div style={{ fontSize: 12, color: t3, width: 44, textAlign: 'right' }}>
          {threads.length} chat{threads.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px 24px', color: t3, fontSize: 13 }}>
            Loading…
          </div>
        ) : threads.length > 0 ? threads.map(t => {
          const other = t.p1 === user.email
            ? { name: t.p2Name, color: t.p2Color }
            : { name: t.p1Name, color: t.p1Color }
          const last    = t.lastMessage
          const unreadCount = t.unreadCount || 0
          const unread  = unreadCount > 0
          const preview = last ? last.text : 'New chat'
          const timeStr = last ? fmtTime(last.at) : (t.lastAt ? fmtTime(t.lastAt) : '')

          return (
            <div
              key={t.id}
              onClick={() => navigate(`/chat/${encodeURIComponent(t.id)}`)}
              style={{ display: 'flex', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${bdr}`, cursor: 'pointer', transition: 'all 0.18s', background: unread ? accbg : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = bg3}
              onMouseLeave={e => e.currentTarget.style.background = unread ? accbg : 'transparent'}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: unread ? 700 : 500, color: text }}>{other.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: 11, color: unread ? acc : t3, fontWeight: unread ? 700 : 400 }}>{timeStr}</div>
                    {unread && (
                      <div style={{ minWidth: 18, height: 18, borderRadius: 999, background: red, color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                </div>
                {t.listingId && t.listingTitle && (
                  <div
                    onClick={e => { e.stopPropagation(); navigate(`/listing/${t.listingId}`) }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: acc, cursor: 'pointer', marginBottom: 2 }}
                  >
                    {t.listingTitle} ↗
                  </div>
                )}
                <div style={{ fontSize: 12, color: unread ? text : t2, fontWeight: unread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
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


    </div>
  )
}
