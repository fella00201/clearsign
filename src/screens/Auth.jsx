import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

const bg   = '#0d0d11'
const bg2  = '#141418'
const bg3  = '#1e1e26'
const bdr  = '#2a2a36'
const text = '#eeedf5'
const t2   = '#9896b2'
const t3   = '#56546c'
const acc  = '#5b8fff'
const r    = '14px'
const rs   = '8px'
const sans = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

const FEATURES = [
  ['🏠', 'Discover rentals & services'],
  ['💬', 'Message owners directly'],
  ['📄', 'AI-generated contracts'],
  ['⭐', 'Verified reviews after signing'],
  ['🤖', 'AI assistant to guide you'],
]

export default function Auth() {
  const [mode, setMode] = useState('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signup, signin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signup(name.trim(), email.trim())
      } else {
        await signin(email.trim())
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode(m => m === 'signup' ? 'signin' : 'signup')
    setError('')
  }

  return (
    <div style={{ minHeight: '100svh', background: bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: sans, fontSize: 15, color: text }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: serif, fontSize: 40, fontWeight: 300, marginBottom: 6, color: text }}>
            Clear<b style={{ color: acc, fontWeight: 500 }}>Sign</b>
          </div>
          <div style={{ fontSize: 14, color: t2, maxWidth: 240, margin: '0 auto', lineHeight: 1.6 }}>
            Find, agree, and sign — all in one place.
          </div>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
          {FEATURES.map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg2, border: `1px solid ${bdr}`, borderRadius: r, padding: '10px 14px' }}>
              <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: text }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <Field label="Your name">
              <input
                type="text"
                placeholder="e.g. Sarah Johnson"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={inputCss}
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              placeholder="e.g. sarah@email.com"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputCss}
            />
          </Field>

          {error && (
            <p style={{ fontSize: 13, color: '#ff5b5b', marginBottom: 10, marginTop: -4 }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{ ...btnBase, background: acc, color: '#fff', marginBottom: 10, opacity: loading ? 0.4 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '…' : mode === 'signup' ? 'Create free account →' : 'Sign in →'}
          </button>
          <button type="button" onClick={toggleMode} style={{ ...btnBase, background: bg3, color: text, border: `1px solid ${bdr}` }}>
            {mode === 'signup' ? 'Sign in instead' : 'Create account instead'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: t3, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          Not a law firm. AI-assisted informal agreements only.
        </p>

      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t2, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCss = {
  width: '100%',
  background: bg3,
  border: `1px solid ${bdr}`,
  borderRadius: rs,
  padding: '11px 13px',
  fontSize: 14,
  fontFamily: sans,
  color: text,
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
}

const btnBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  width: '100%',
  padding: 14,
  borderRadius: r,
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: sans,
  cursor: 'pointer',
  transition: 'all 0.18s ease',
}
