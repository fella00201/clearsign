import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { CATS } from '../data/categories'

const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const red   = '#ff5b5b'
const redbg = '#220d0d'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

function useToast() {
  const [toast, setToast] = useState(null)
  function show(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }
  return { toast, show }
}

export default function AlertSetup() {
  const navigate        = useNavigate()
  const user            = useAuth(s => s.user)
  const updateAlerts    = useAuth(s => s.updateAlerts)
  const { toast, show } = useToast()

  const [loc, setLoc]   = useState('')
  const [cat, setCat]   = useState('all')

  const alerts = user?.alerts || []

  function add() {
    if (!loc.trim()) { show('Enter a location'); return }
    const next = [
      ...alerts,
      { location: loc.trim(), cat, createdAt: new Date().toISOString() },
    ]
    updateAlerts(next)
    setLoc('')
    setCat('all')
    show('Alert added!')
  }

  function remove(i) {
    const next = alerts.filter((_, idx) => idx !== i)
    updateAlerts(next)
    show('Alert removed')
  }

  return (
    <div style={{ minHeight: '100svh', background: bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', fontFamily: serif, fontSize: 17, fontWeight: 500, color: text }}>
          Clear<b style={{ color: acc, fontWeight: 500 }}>Sign</b>
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 40px' }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
          Location alerts
        </div>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: text, marginBottom: 6 }}>
          Get notified near you
        </div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 20, lineHeight: 1.5 }}>
          We alert you instantly when matching listings appear.
        </div>

        {/* Active alerts */}
        {alerts.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
              Active alerts
            </div>
            {alerts.map((al, i) => (
              <div key={i} style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: text }}>
                  {al.location} · {al.cat === 'all' ? 'All' : CATS[al.cat]?.label || al.cat}
                </div>
                <button
                  onClick={() => remove(i)}
                  style={{
                    background: redbg, border: `1px solid #3a0d0d`,
                    borderRadius: 6, color: red, fontSize: 11, fontWeight: 700,
                    padding: '4px 9px', cursor: 'pointer', fontFamily: sans,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </>
        )}

        {/* Add alert */}
        <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, marginTop: alerts.length ? 16 : 0 }}>
          Add alert
        </div>
        <div style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t2, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              City or area
            </label>
            <input
              type="text"
              value={loc}
              onChange={e => setLoc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="e.g. Austin, TX"
              onFocus={e => e.target.style.borderColor = acc}
              onBlur={e => e.target.style.borderColor = bdr}
              style={{
                width: '100%', background: bg3, border: `1px solid ${bdr}`, borderRadius: 8,
                padding: '11px 13px', fontSize: 14, fontFamily: sans, color: text,
                outline: 'none', transition: 'border-color 0.18s',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t2, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              Category
            </label>
            <select
              value={cat}
              onChange={e => setCat(e.target.value)}
              style={{
                width: '100%', background: bg3, border: `1px solid ${bdr}`, borderRadius: 8,
                padding: '11px 13px', fontSize: 14, fontFamily: sans, color: text,
                outline: 'none', appearance: 'none', WebkitAppearance: 'none',
                transition: 'border-color 0.18s',
              }}
            >
              <option value="all">All categories</option>
              {Object.entries(CATS).map(([k, c]) => (
                <option key={k} value={k}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={add}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: 14, borderRadius: 14, border: 'none',
            background: acc, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: sans, transition: 'all 0.18s',
          }}
        >
          Add alert →
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#27272f', color: text, border: `1px solid ${bdr}`,
          fontSize: 13, fontWeight: 500, padding: '9px 18px', borderRadius: 999,
          zIndex: 200, whiteSpace: 'nowrap', fontFamily: sans, pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
