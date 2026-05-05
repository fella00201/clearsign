import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContracts } from '../store/useContracts'
import { useAuth } from '../store/useAuth'

const bg       = '#0d0d11'
const bg2      = '#141418'
const bdr      = '#2a2a36'
const text     = '#eeedf5'
const t2       = '#9896b2'
const acc      = '#5b8fff'
const green    = '#3ecf7a'
const greenbg  = '#0c2018'
const greenbdr = '#183a28'
const amber    = '#f5a623'
const pink     = '#ff7eb3'
const sans     = "'Inter', sans-serif"
const serif    = "'Sora', sans-serif"

const CONFETTI = [
  { color: acc,   dx: -52, dy: -70 },
  { color: green, dx:  56, dy: -66 },
  { color: amber, dx: -78, dy: -28 },
  { color: acc,   dx:  78, dy: -22 },
  { color: green, dx: -48, dy:  58 },
  { color: amber, dx:  52, dy:  62 },
  { color: pink,  dx: -28, dy: -88 },
  { color: pink,  dx:  32, dy: -84 },
  { color: acc,   dx: -88, dy:  18 },
  { color: green, dx:  88, dy:  22 },
  { color: amber, dx: -18, dy:  90 },
  { color: pink,  dx:  22, dy:  90 },
  { color: green, dx: -62, dy: -50 },
  { color: acc,   dx:  66, dy: -46 },
  { color: amber, dx: -90, dy: -6 },
  { color: pink,  dx:  90, dy:  2 },
]

function initials(n) {
  return (n || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

export default function Sealed() {
  const navigate  = useNavigate()
  const user      = useAuth(s => s.user)
  const activeDoc = useContracts(s => s.activeDoc)

  useEffect(() => { if (!activeDoc) navigate('/') }, [activeDoc, navigate])

  useEffect(() => {
    const keyframes = CONFETTI.map((p, i) => `
      @keyframes cs-c${i} {
        0%   { opacity: 0; transform: translate(0,0) scale(0) rotate(0deg); }
        15%  { opacity: 1; }
        100% { opacity: 0; transform: translate(${p.dx}px,${p.dy}px) scale(1.3) rotate(${p.dx * 2}deg); }
      }
    `).join('')

    const style = document.createElement('style')
    style.textContent = `
      @keyframes cs-ring {
        from { stroke-dashoffset: 220; }
        to   { stroke-dashoffset: 0; }
      }
      @keyframes cs-check {
        from { stroke-dashoffset: 60; }
        to   { stroke-dashoffset: 0; }
      }
      @keyframes cs-fade-up {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes cs-pulse {
        0%, 100% { box-shadow: 0 0 0 0 ${green}33; }
        50%      { box-shadow: 0 0 0 12px ${green}00; }
      }
      ${keyframes}
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  if (!activeDoc) return null

  const isCreator  = activeDoc.creatorEmail === user?.email
  const otherName  = isCreator ? activeDoc.counterpartyName  : activeDoc.creatorName
  const otherEmail = isCreator ? activeDoc.counterpartyEmail : activeDoc.creatorEmail

  const parties = [
    { name: activeDoc.creatorName,      color: activeDoc.creatorColor,      email: activeDoc.creatorEmail },
    { name: activeDoc.counterpartyName, color: activeDoc.counterpartyColor, email: activeDoc.counterpartyEmail },
  ]

  function goMessage() {
    const tid = 'thread:' + [user?.email, otherEmail].sort().join(':') + '::' + activeDoc.listingId
    try {
      const threads = JSON.parse(localStorage.getItem('cs_threads') || '[]')
      if (threads.find(t => t.id === tid)) {
        navigate(`/chat/${encodeURIComponent(tid)}`)
        return
      }
    } catch {}
    navigate('/messages')
  }

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: sans, fontSize: 15, color: text }}>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 40px' }}>

        {/* Animated seal + confetti burst */}
        <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 28 }}>
          {CONFETTI.map((p, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: i % 3 === 0 ? 9 : 7,
              height: i % 3 === 0 ? 9 : 7,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              background: p.color,
              animation: `cs-c${i} 1s cubic-bezier(0.15,0.8,0.35,1) ${0.6 + i * 0.03}s both`,
            }} />
          ))}
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ overflow: 'visible', animation: 'cs-pulse 2s ease-in-out 1.5s infinite' }}>
            <circle
              cx="45" cy="45" r="35"
              fill={greenbg}
              stroke={green} strokeWidth="3"
              strokeDasharray="220" strokeDashoffset="220"
              transform="rotate(-90 45 45)"
              style={{ animation: 'cs-ring 0.65s cubic-bezier(0.4,0,0.2,1) 0.1s forwards' }}
            />
            <path
              d="M28 46l11 11 23-23"
              stroke={green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              fill="none"
              strokeDasharray="60" strokeDashoffset="60"
              style={{ animation: 'cs-check 0.35s ease-out 0.7s forwards' }}
            />
          </svg>
        </div>

        {/* Heading */}
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, color: text, marginBottom: 6, animation: 'cs-fade-up 0.5s ease-out 0.4s both' }}>
          Contract Sealed
        </div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 28, textAlign: 'center', lineHeight: 1.6, animation: 'cs-fade-up 0.5s ease-out 0.5s both' }}>
          Both parties have signed.<br />This contract is now binding.
        </div>

        {/* Parties */}
        <div style={{ width: '100%', background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16, marginBottom: 24, animation: 'cs-fade-up 0.5s ease-out 0.6s both' }}>
          {parties.map((p, i) => (
            <div key={p.email} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: i < parties.length - 1 ? 10 : 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: `${p.color}22`, color: p.color,
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {initials(p.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: text }}>
                  {p.name}
                  {p.email === user?.email && (
                    <span style={{ fontSize: 10, color: acc, marginLeft: 5 }}>(you)</span>
                  )}
                </div>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 999,
                background: greenbg, color: green, border: `1px solid ${greenbdr}`,
              }}>
                ✓ Signed
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 9, animation: 'cs-fade-up 0.5s ease-out 0.7s both' }}>
          <button
            onClick={() => navigate('/review', { state: { contractId: activeDoc.id, listingId: activeDoc.listingId, targetName: otherName } })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 14, borderRadius: 14, border: 'none', background: green, color: '#071a0f', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans, width: '100%', minHeight: 44 }}
          >
            ⭐ Leave a review →
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <button
              onClick={goMessage}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 14, border: `1px solid ${bdr}`, background: bg2, color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 44 }}
            >
              💬 Message
            </button>
            <button
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 14, border: `1px solid ${bdr}`, background: bg2, color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 44 }}
            >
              🏠 Home
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            <button
              onClick={() => navigate(`/contract/${activeDoc.id}`)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 14, border: `1px solid ${bdr}`, background: 'none', color: t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 44 }}
            >
              View contract
            </button>
            <button
              onClick={() => navigate('/vault')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 14, border: `1px solid ${bdr}`, background: 'none', color: t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 44 }}
            >
              My vault →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
