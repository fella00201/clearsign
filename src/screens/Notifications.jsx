import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContracts } from '../store/useContracts'
import { useAuth } from '../store/useAuth'

const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const greenbdr = '#183a28'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const green = '#3ecf7a'
const greenbg = '#0c2018'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 2a6 6 0 016 6c0 3.5 1.5 5 1.5 5h-15s1.5-1.5 1.5-5a6 6 0 016-6z" stroke={acc} strokeWidth="1.4" />
      <path d="M8.5 16a1.5 1.5 0 003 0" stroke={acc} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function MsgIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 4h14v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" stroke={acc} strokeWidth="1.4" />
      <path d="M6 8h8M6 11h5" stroke={acc} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5a5.5 5.5 0 015.5 5.5c0 3.2-5.5 10-5.5 10S3.5 10.2 3.5 7A5.5 5.5 0 019 1.5z" stroke={acc} strokeWidth="1.3" />
      <circle cx="9" cy="7" r="1.5" fill={acc} />
    </svg>
  )
}

function notifIcon(type) {
  if (type === 'message') return <MsgIcon />
  if (type === 'alert_match') return <PinIcon />
  return <BellIcon />
}

export default function Notifications() {
  const navigate       = useNavigate()
  const user           = useAuth(s => s.user)
  const contracts      = useContracts(s => s.contracts)
  const loadContracts  = useContracts(s => s.loadContracts)
  const setActiveDoc   = useContracts(s => s.setActiveDoc)
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    loadContracts(user?.email)
    if (!user) return
    try {
      const raw = localStorage.getItem(`cs_notifs_${user.email}`)
      setNotifs(raw ? JSON.parse(raw) : [])
    } catch {
      setNotifs([])
    }
  }, [loadContracts, user])

  function markRead(notif) {
    if (notif.read) return
    try {
      const key  = `cs_notifs_${user.email}`
      const next = notifs.map(n => n.id === notif.id ? { ...n, read: true } : n)
      localStorage.setItem(key, JSON.stringify(next))
      setNotifs(next)
    } catch {}
  }

  function openNotif(notif) {
    markRead(notif)
    if (notif.type === 'message' && notif.threadId) {
      navigate(`/chat/${encodeURIComponent(notif.threadId)}`)
    } else if (notif.type === 'alert_match' && notif.listingId) {
      navigate(`/listing/${notif.listingId}`)
    } else if (notif.contractId) {
      navigate(`/contract/${notif.contractId}`)
    }
  }

  function openContract(c) {
    setActiveDoc(c)
    navigate(`/contract/${c.id}`)
  }

  const pending = contracts.filter(
    c => c.counterpartyEmail === user?.email && c.status !== 'sealed'
  )

  const isEmpty = pending.length === 0 && notifs.length === 0

  return (
    <div style={{ minHeight: '100svh', background: bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: text }}>
          Clear<b style={{ color: acc, fontWeight: 500 }}>Sign</b>
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 32 }}>

        {/* Needs your signature */}
        {pending.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 16px 8px' }}>
              Needs your signature
            </div>
            <div style={{ padding: '0 16px' }}>
              {pending.map(c => (
                <div
                  key={c.id}
                  onClick={() => openContract(c)}
                  style={{ background: bg2, border: `1px solid ${greenbdr}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 4 }}>
                    Contract awaiting your signature
                  </div>
                  <div style={{ fontSize: 12, color: t2, marginBottom: 10 }}>
                    From {c.creatorName} · "{c.listingTitle || 'Contract'}"
                  </div>
                  <button
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '8px 14px', borderRadius: 8, border: 'none',
                      background: green, color: '#071a0f', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: sans,
                    }}
                  >
                    Review & sign →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notifications */}
        {notifs.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 16px 8px' }}>
              Notifications
            </div>
            <div style={{ padding: '0 16px 8px' }}>
              {notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => openNotif(n)}
                  style={{
                    background: bg2,
                    border: `1px solid ${n.read ? bdr : acc}`,
                    borderRadius: 14, padding: 14, marginBottom: 8,
                    cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#141f3c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {notifIcon(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: t3, marginTop: 3 }}>{fmtDate(n.at)}</div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: acc, flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', gap: 10 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🔔</div>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, color: text }}>All clear</div>
            <div style={{ fontSize: 13, color: t2, maxWidth: 240, lineHeight: 1.6 }}>
              Set up alerts to get notified when listings appear near you.
            </div>
            <button
              onClick={() => navigate('/alert-setup')}
              style={{ marginTop: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: acc, color: '#fff', cursor: 'pointer', fontFamily: sans }}
            >
              Set up alerts
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
