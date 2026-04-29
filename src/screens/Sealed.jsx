import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContracts } from '../store/useContracts'
import { useAuth } from '../store/useAuth'

const bg       = '#0d0d11'
const bg2      = '#141418'
const bdr      = '#2a2a36'
const text     = '#eeedf5'
const t2       = '#9896b2'
const t3       = '#56546c'
const acc      = '#5b8fff'
const green    = '#3ecf7a'
const greenbg  = '#0c2018'
const greenbdr = '#183a28'
const sans     = "'Instrument Sans', sans-serif"
const serif    = "'Fraunces', serif"

function initials(n) {
  return (n || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

export default function Sealed() {
  const navigate  = useNavigate()
  const user      = useAuth(s => s.user)
  const activeDoc = useContracts(s => s.activeDoc)

  useEffect(() => { if (!activeDoc) navigate('/') }, [activeDoc, navigate])

  useEffect(() => {
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
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  if (!activeDoc) return null

  const parties = [
    { name: activeDoc.creatorName,      color: activeDoc.creatorColor,      email: activeDoc.creatorEmail },
    { name: activeDoc.counterpartyName, color: activeDoc.counterpartyColor, email: activeDoc.counterpartyEmail },
  ]

  return (
    <div style={{ minHeight: '100svh', background: bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Body — vertically centered */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 24px' }}>

        {/* Animated ring + checkmark */}
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ marginBottom: 24, overflow: 'visible' }}>
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

        {/* Heading */}
        <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 300, color: text, marginBottom: 6, animation: 'cs-fade-up 0.5s ease-out 0.4s both' }}>
          Contract Sealed
        </div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 28, textAlign: 'center', lineHeight: 1.5, animation: 'cs-fade-up 0.5s ease-out 0.5s both' }}>
          Both parties have signed. This contract is now binding.
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
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, animation: 'cs-fade-up 0.5s ease-out 0.7s both' }}>
          <button
            onClick={() => navigate(`/contract/${activeDoc.id}`)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, border: `1px solid ${bdr}`, background: bg2, color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: sans }}
          >
            View contract
          </button>
          <button
            onClick={() => navigate('/vault')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, border: 'none', background: green, color: '#071a0f', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: sans }}
          >
            My vault →
          </button>
        </div>
      </div>
    </div>
  )
}
