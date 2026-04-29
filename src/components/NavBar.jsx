import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useMessages } from '../store/useMessages'
import { supabase } from '../lib/supabase'

const t3  = '#56546c'
const acc = '#5b8fff'
const bdr = '#2a2a36'
const bg  = '#0d0d11'
const red = '#ff5b5b'
const sans = "'Inter', sans-serif"

const TABS = [
  {
    id: 'discover', path: '/', label: 'Find',
    icon: on => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="6" stroke={on ? acc : t3} strokeWidth="1.4" />
        <path d="M14 14l3 3" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'messages', path: '/messages', label: 'Messages',
    icon: on => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 4h14v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" stroke={on ? acc : t3} strokeWidth="1.4" />
        <path d="M6 8h8M6 11h5" stroke={on ? acc : t3} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'post', path: '/post', label: 'Post',
    icon: on => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke={on ? acc : t3} strokeWidth="1.4" />
        <path d="M10 6v8M6 10h8" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'vault', path: '/vault', label: 'Vault',
    icon: on => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke={on ? acc : t3} strokeWidth="1.4" />
        <path d="M7 10l2.5 2.5L13 8" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'profile', path: '/profile', label: 'Profile',
    icon: on => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.5" stroke={on ? acc : t3} strokeWidth="1.4" />
        <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={on ? acc : t3} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function NavBar({ active }) {
  const navigate        = useNavigate()
  const user            = useAuth(s => s.user)
  const unreadCount     = useMessages(s => s.unreadCount)
  const loadUnreadCount = useMessages(s => s.loadUnreadCount)

  useEffect(() => {
    if (!user?.email) return

    loadUnreadCount(user.email)

    const channel = supabase
      .channel('unread-badge')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, payload => {
        const msg = payload.new
        if (msg.from_email !== user.email) {
          useMessages.setState(s => ({ unreadCount: s.unreadCount + 1 }))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.email])

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      borderTop: `1px solid ${bdr}`, background: bg, flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(({ id, path, label, icon }) => {
        const on         = active === id
        const showBadge  = id === 'messages' && unreadCount > 0
        return (
          <button key={id} onClick={() => navigate(path)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, padding: '8px 4px',
            border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: sans,
          }}>
            <div style={{ position: 'relative' }}>
              {icon(on)}
              {showBadge && (
                <div style={{
                  position: 'absolute', top: -4, right: -6,
                  minWidth: 16, height: 16, borderRadius: 999,
                  background: red, color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: on ? acc : t3 }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
