import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useIsDesktop } from '../components/NavBar'
import { bg, bg2, bg3, bdr, text, t2, t3, acc, acc2, accbg, red, sans, serif } from '../theme'

const r  = '14px'
const rs = '8px'

const FEATURES = [
  ['🏠', 'Discover rentals & services'],
  ['💬', 'Message owners directly'],
  ['📄', 'AI-generated contracts'],
  ['⭐', 'Verified reviews after signing'],
  ['🤖', 'AI assistant to guide you'],
]

// Two-step hero: a handshake plays once, then hands off to a wax-seal
// stamp — "they shook on it, then it was sealed." One-way, not a loop.
function Hero({ desktop }) {
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [stage, setStage] = useState('handshake')
  const waxsealRef = useRef(null)

  function onHandshakeEnd() {
    setStage('waxseal')
    waxsealRef.current?.play().catch(() => {})
  }

  const frame = {
    position: 'relative', overflow: 'hidden',
    height: desktop ? '100%' : 150,
    borderRadius: desktop ? 0 : `0 0 ${r} ${r}`,
    background: `linear-gradient(160deg, ${accbg}, ${bg3})`,
    flexShrink: 0,
  }

  if (reducedMotion) {
    return (
      <div style={frame}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="30" fill={`${acc}18`} stroke={acc} strokeWidth="2" />
            <path d="M22 37l9 9 19-19" stroke={acc} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <HeroCaption desktop={desktop} />
      </div>
    )
  }

  return (
    <div style={frame}>
      <video
        autoPlay muted playsInline preload="auto"
        onEnded={onHandshakeEnd}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: stage === 'handshake' ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <source src="/video/auth-handshake.mp4" type="video/mp4" />
      </video>
      <video
        ref={waxsealRef}
        muted playsInline preload="auto"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: stage === 'waxseal' ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <source src="/video/auth-waxseal.mp4" type="video/mp4" />
      </video>
      {/* Vignette so the clip blends into the paper background instead of a hard edge */}
      <div style={{
        position: 'absolute', inset: 0,
        background: desktop
          ? `linear-gradient(90deg, transparent 55%, ${bg} 100%)`
          : `linear-gradient(to bottom, transparent 55%, ${bg} 100%)`,
        pointerEvents: 'none',
      }} />
      <HeroCaption desktop={desktop} />
    </div>
  )
}

function HeroCaption({ desktop }) {
  return (
    <div style={{
      position: 'absolute', left: desktop ? 36 : 18, bottom: desktop ? 44 : 16,
      right: desktop ? 36 : 18,
      pointerEvents: 'none',
    }}>
      <div style={{ fontFamily: serif, fontSize: desktop ? 34 : 24, fontWeight: 300, color: text, marginBottom: 4 }}>
        Clear<b style={{ color: acc, fontWeight: 500 }}>Sign</b>
      </div>
      {desktop && (
        <div style={{ fontSize: 14, color: t2, maxWidth: 280, lineHeight: 1.6 }}>
          Find, agree, and sign — all in one place.
        </div>
      )}
    </div>
  )
}

export default function Auth() {
  const [mode, setMode] = useState('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signup, signin } = useAuth()
  const navigate  = useNavigate()
  const isDesktop = useIsDesktop()

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

  const formPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: isDesktop ? '40px 56px' : '16px 20px 24px' }}>
      <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>

        {!isDesktop && (
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: t2, lineHeight: 1.5 }}>
              Find, agree, and sign — all in one place.
            </div>
          </div>
        )}

        {isDesktop && (
          <div style={{ fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </div>
        )}

        {/* Feature cards — compact scrolling chips on mobile so the form
            stays above the fold on short viewports; full cards on desktop
            where the split layout has room to spare. */}
        {isDesktop ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            {FEATURES.map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg2, border: `1px solid ${bdr}`, borderRadius: r, padding: '10px 14px' }}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: text }}>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px 18px', padding: '0 20px 2px' }}>
            {FEATURES.map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap', background: bg2, border: `1px solid ${bdr}`, borderRadius: 999, padding: '7px 12px' }}>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: text }}>{label}</span>
              </div>
            ))}
          </div>
        )}

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
                onFocus={e => e.target.style.borderColor = acc}
                onBlur={e => e.target.style.borderColor = bdr}
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
              onFocus={e => e.target.style.borderColor = acc}
              onBlur={e => e.target.style.borderColor = bdr}
              style={inputCss}
            />
          </Field>

          {error && (
            <p style={{ fontSize: 13, color: red, marginBottom: 10, marginTop: -4 }}>{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            style={{ ...btnBase, background: acc, color: '#fff', marginBottom: 10, opacity: loading ? 0.4 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = acc2 }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = acc }}
          >
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

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100svh', background: bg, display: 'flex', fontFamily: sans, fontSize: 15, color: text }}>
        <div style={{ width: '46%', flexShrink: 0 }}>
          <Hero desktop />
        </div>
        {formPanel}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100svh', background: bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: sans, fontSize: 15, color: text }}>
      <Hero desktop={false} />
      {formPanel}
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
  transition: 'border-color 0.18s',
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
