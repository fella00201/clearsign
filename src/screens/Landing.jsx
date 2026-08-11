import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsDesktop } from '../components/NavBar'
import { bg, bg2, bg3, bdr, text, t2, t3, acc, acc2, serif, sans } from '../theme'

// Modern blue/white palette — scoped to the step mockups only. The rest of
// the Landing page (and the whole app) stays on the warm Ledger palette;
// these mockups are meant to read like a product screenshot dropped onto
// the page, not a re-theme of the brand.
const M = {
  bg:       '#FFFFFF',
  panel:    '#F3F6FC',
  blue:     '#2F6FEE',
  blueDeep: '#1E54C7',
  blueSoft: '#E8F0FE',
  ink:      '#1B2333',
  sub:      '#6B7688',
  border:   '#E3E8F0',
}

const STEPS = [
  {
    kicker: 'Step 1',
    title: 'Discover, or post what you have',
    body: 'Browse rentals, services and gigs near you — or list your own room, gear, or skills in a few taps.',
    Mockup: DiscoverMockup,
  },
  {
    kicker: 'Step 2',
    title: 'Message and agree on the details',
    body: 'Chat directly with the other person, right in the app, until you’re both happy with the terms.',
    Mockup: MessageMockup,
  },
  {
    kicker: 'Step 3',
    title: 'AI drafts the contract',
    body: 'Claude turns your conversation into a clear, fair agreement — in seconds, no legal jargon.',
    Mockup: ContractMockup,
  },
  {
    kicker: 'Step 4',
    title: 'Sign it, right on your screen',
    body: 'Draw your signature with a finger or a mouse. No printing, no scanning, no back-and-forth.',
    Mockup: SignMockup,
  },
  {
    kicker: 'Step 5',
    title: 'Sealed — and binding',
    body: 'Once both sides have signed, the contract is sealed, stored in your vault, and ready when you need it.',
    Mockup: SealedMockup,
  },
]

const MOCKUP_CSS = `
@keyframes cs-mock-grow { from { width: 0; } to { width: var(--w); } }
@keyframes cs-mock-pop { 0% { transform: scale(.6); opacity:0; } 70% { transform: scale(1.08); opacity:1; } 100% { transform: scale(1); opacity:1; } }
@media (prefers-reduced-motion: reduce) {
  #cs-steps * { animation: none !important; transition: none !important; }
}
`

// Symmetric reveal: toggles both ways at the same ~30% threshold, so a step
// resets as soon as it scrolls out of view (either direction) and replays
// in full — including its staggered entrance timing — next time it's
// scrolled back into view.
function useReveal() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function MockFrame({ children, align }) {
  return (
    <div style={{
      width: '100%', aspectRatio: '4 / 3', borderRadius: 20, overflow: 'hidden',
      background: bg2, border: `1px solid ${bdr}`,
      boxShadow: '0 24px 48px -28px rgba(20,30,50,0.22)',
      display: 'flex', flexDirection: 'column', alignItems: align || 'center', justifyContent: 'center',
      flexShrink: 0, padding: '7%', boxSizing: 'border-box',
    }}>
      {children}
    </div>
  )
}

const SEARCH_QUERY = 'Room in Gothenburg'
const LISTINGS = [
  { icon: '🏠', title: 'Sunny room near center', meta: 'Gothenburg · $850/mo', badge: 'Verified' },
  { icon: '🛏️', title: 'Cozy studio downtown', meta: 'Gothenburg · $720/mo', badge: null },
  { icon: '🔑', title: 'Shared apartment room', meta: 'Gothenburg · $650/mo', badge: 'Verified' },
]

// ── Step 1 — search bar + a few listing suggestions settling in ────────────
function DiscoverMockup({ inView }) {
  const typeDuration = 0.05 * SEARCH_QUERY.length + 0.2
  return (
    <MockFrame align="stretch">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: M.panel, borderRadius: 10, padding: '9px 12px', marginBottom: 12 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><circle cx="6" cy="6" r="4.5" stroke={M.sub} strokeWidth="1.4" /><path d="M9.2 9.2L12 12" stroke={M.sub} strokeWidth="1.4" strokeLinecap="round" /></svg>
        <span style={{
          fontSize: 13, color: M.ink, fontFamily: sans, whiteSpace: 'nowrap', overflow: 'hidden',
          display: 'inline-block', borderRight: inView ? 'none' : `1.5px solid ${M.blue}`,
          width: inView ? `${SEARCH_QUERY.length}ch` : 0,
          animation: inView ? `cs-mock-grow ${typeDuration}s steps(${SEARCH_QUERY.length}) 0.2s forwards` : 'none',
          '--w': `${SEARCH_QUERY.length}ch`,
        }}>
          {SEARCH_QUERY}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LISTINGS.map((l, i) => {
          const delay = typeDuration + 0.35 + i * 0.35
          return (
            <div key={l.title} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px',
              background: i === 0 ? M.blueSoft : M.panel, borderRadius: 12,
              opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(10px)',
              transition: inView
                ? `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`
                : 'opacity 0.2s ease, transform 0.2s ease',
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: M.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{l.icon}</div>
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: M.ink, fontFamily: sans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                <div style={{ fontSize: 10.5, color: M.sub, fontFamily: sans }}>{l.meta}</div>
              </div>
              {l.badge && (
                <div style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: M.blueDeep, background: M.bg, borderRadius: 999, padding: '3px 7px', flexShrink: 0 }}>{l.badge}</div>
              )}
            </div>
          )
        })}
      </div>
    </MockFrame>
  )
}

// ── Step 2 — two-person chat about a room contract ──────────────────────────
function MessageMockup({ inView }) {
  const bubbles = [
    { from: 'them', text: 'Hey! Is the room still available for June?', delay: 0.1 },
    { from: 'me',   text: 'Yes! $850/month, move-in June 1st 🔑', delay: 1.0 },
    { from: 'them', text: 'Perfect, let’s do it 🤝', delay: 1.9 },
  ]
  return (
    <MockFrame align="stretch">
      {bubbles.map((b, i) => (
        <div key={i} style={{
          alignSelf: b.from === 'me' ? 'flex-end' : 'flex-start',
          maxWidth: '78%',
          padding: '8px 12px',
          marginBottom: 8,
          borderRadius: b.from === 'me' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
          background: b.from === 'me' ? M.blue : M.bg,
          border: b.from === 'me' ? 'none' : `1px solid ${M.border}`,
          color: b.from === 'me' ? '#fff' : M.ink,
          fontSize: 13, fontFamily: sans, lineHeight: 1.4, textAlign: 'left',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
          transition: inView
            ? `opacity 0.4s ease ${b.delay}s, transform 0.4s ease ${b.delay}s`
            : 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          {b.text}
        </div>
      ))}
      <div style={{
        alignSelf: 'flex-start', marginTop: 2, fontSize: 11, fontWeight: 700, color: M.blueDeep,
        background: M.blueSoft, borderRadius: 999, padding: '4px 10px', fontFamily: sans,
        opacity: inView ? 1 : 0,
        transition: inView ? 'opacity 0.4s ease 2.6s' : 'opacity 0.2s ease',
      }}>
        Contract ready →
      </div>
    </MockFrame>
  )
}

// ── Step 3 — document lines "typing" themselves out ─────────────────────────
function ContractMockup({ inView }) {
  const lines = [92, 100, 70, 88, 55]
  return (
    <MockFrame align="stretch">
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.4 3 3.3.5-2.4 2.3.6 3.3L7 9l-2.9 1.6.6-3.3L2.3 5l3.3-.5L7 1.5z" fill={M.blue} /></svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: M.blueDeep, fontFamily: sans, letterSpacing: '.3px' }}>AI drafting…</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lines.map((w, i) => (
          <div key={i} style={{
            height: 9, borderRadius: 4, background: i === 0 ? M.blue : M.bg,
            border: i === 0 ? 'none' : `1px solid ${M.border}`,
            width: inView ? `${w}%` : 0,
            animation: inView ? `cs-mock-grow 0.7s ease ${0.15 + i * 0.22}s forwards` : 'none',
            '--w': `${w}%`,
          }} />
        ))}
      </div>
    </MockFrame>
  )
}

// ── Step 4 — signature stroke drawing itself ────────────────────────────────
function SignMockup({ inView }) {
  return (
    <MockFrame align="stretch">
      <div style={{ fontSize: 11.5, fontWeight: 700, color: M.sub, fontFamily: sans, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12, textAlign: 'left' }}>
        Sign here
      </div>
      <svg width="100%" height="90" viewBox="0 0 220 72" fill="none">
        <path d="M10 58 C 30 20, 55 20, 68 44 S 100 66, 118 30 S 150 8, 168 40 S 200 58, 210 22"
          stroke={M.blue} strokeWidth="3.2" strokeLinecap="round" fill="none"
          strokeDasharray="360" strokeDashoffset={inView ? 0 : 360}
          style={{ transition: inView ? 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1) 0.2s' : 'stroke-dashoffset 0.25s ease' }}
        />
        <line x1="4" y1="64" x2="216" y2="64" stroke={M.border} strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
    </MockFrame>
  )
}

// ── Step 5 — sealed confirmation badge ──────────────────────────────────────
function SealedMockup({ inView }) {
  return (
    <MockFrame>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 76, height: 76, borderRadius: '50%',
          background: M.bg, border: `3px solid ${M.blue}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: inView ? 1 : 0,
          animation: inView ? 'cs-mock-pop 0.5s cubic-bezier(.34,1.56,.64,1) 0.2s both' : 'none',
        }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path d="M8 18l6 6 12-14" stroke={M.blue} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="34" strokeDashoffset={inView ? 0 : 34}
              style={{ transition: inView ? 'stroke-dashoffset 0.5s ease 0.6s' : 'stroke-dashoffset 0.2s ease' }}
            />
          </svg>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: M.blueDeep, background: M.blueSoft,
          borderRadius: 999, padding: '6px 14px', fontFamily: sans,
          opacity: inView ? 1 : 0,
          transition: inView ? 'opacity 0.4s ease 0.9s' : 'opacity 0.2s ease',
        }}>
          Contract sealed ✓
        </div>
      </div>
    </MockFrame>
  )
}

function Step({ step, index, isDesktop }) {
  const [ref, inView] = useReveal()
  const flip = isDesktop && index % 2 === 1
  const Mockup = step.Mockup

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: isDesktop ? (flip ? 'row-reverse' : 'row') : 'column',
        alignItems: 'center',
        gap: isDesktop ? 64 : 24,
        padding: isDesktop ? '64px 0' : '36px 0',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <div style={{ flex: isDesktop ? '0 0 46%' : 'none', width: isDesktop ? undefined : '100%' }}>
        <Mockup inView={inView} />
      </div>
      <div style={{ flex: 1, textAlign: isDesktop ? 'left' : 'center' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
          {step.kicker}
        </div>
        <div style={{ fontFamily: serif, fontSize: isDesktop ? 36 : 27, fontWeight: 300, color: text, marginBottom: 14, lineHeight: 1.2 }}>
          {step.title}
        </div>
        <div style={{ fontSize: 17, color: t2, lineHeight: 1.75, maxWidth: 460, margin: isDesktop ? 0 : '0 auto' }}>
          {step.body}
        </div>
      </div>
    </div>
  )
}

function TopBar({ isDesktop }) {
  const navigate = useNavigate()
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isDesktop ? '18px 56px' : '14px 18px',
      background: `${bg}dd`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${bdr}`,
    }}>
      <div style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, color: text }}>
        Clear<b style={{ color: acc, fontWeight: 600 }}>Sign</b>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => navigate('/auth?mode=signin')}
          style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: 'none', color: t2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 40 }}
        >
          Log in
        </button>
        <button
          onClick={() => navigate('/auth?mode=signup')}
          onMouseEnter={e => e.currentTarget.style.background = acc2}
          onMouseLeave={e => e.currentTarget.style.background = acc}
          style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: acc, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: sans, minHeight: 40, transition: 'background 0.18s' }}
        >
          Get started
        </button>
      </div>
    </div>
  )
}

function Hero({ isDesktop }) {
  const navigate = useNavigate()
  function scrollToSteps() {
    document.getElementById('cs-steps')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div style={{
      minHeight: '82vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: isDesktop ? '40px 56px 80px' : '48px 20px 72px',
      position: 'relative',
      background: `radial-gradient(120% 65% at 50% -10%, ${bg2}, ${bg} 62%)`,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: acc, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 18 }}>
        Find. Agree. Sign.
      </div>
      <div style={{ fontFamily: serif, fontSize: isDesktop ? 'clamp(44px, 6vw, 72px)' : 38, fontWeight: 300, lineHeight: 1.15, color: text, maxWidth: 880, marginBottom: 24 }}>
        The marketplace where every deal ends with a <b style={{ color: acc, fontWeight: 500 }}>signature</b>
      </div>
      <div style={{ fontSize: 18, color: t2, maxWidth: 580, lineHeight: 1.75, marginBottom: 36 }}>
        Post rentals, services and gigs. Message the people you're dealing with.
        Let AI draft a fair contract. Sign it, seal it, done.
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/auth?mode=signup')}
          onMouseEnter={e => e.currentTarget.style.background = acc2}
          onMouseLeave={e => e.currentTarget.style.background = acc}
          style={{ padding: '15px 28px', borderRadius: 14, border: 'none', background: acc, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: sans, minHeight: 50, transition: 'background 0.18s' }}
        >
          Get started →
        </button>
        <button
          onClick={scrollToSteps}
          style={{ padding: '15px 28px', borderRadius: 14, border: `1px solid ${bdr}`, background: bg2, color: text, fontSize: 15.5, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 50 }}
        >
          See how it works
        </button>
      </div>
      <button
        onClick={scrollToSteps}
        aria-label="Scroll to learn more"
        style={{ position: 'absolute', bottom: 24, background: 'none', border: 'none', cursor: 'pointer', color: t3, animation: 'cs-bounce 1.6s ease infinite', padding: 8 }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 8l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

function ClosingCTA({ isDesktop }) {
  const navigate = useNavigate()
  return (
    <div style={{
      padding: isDesktop ? '96px 56px' : '64px 20px',
      textAlign: 'center', borderTop: `1px solid ${bdr}`, background: bg2,
    }}>
      <div style={{ fontFamily: serif, fontSize: isDesktop ? 40 : 28, fontWeight: 300, color: text, marginBottom: 14 }}>
        Ready to make it official?
      </div>
      <div style={{ fontSize: 17, color: t2, marginBottom: 30 }}>
        Create a free account and post your first listing in minutes.
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/auth?mode=signup')}
          onMouseEnter={e => e.currentTarget.style.background = acc2}
          onMouseLeave={e => e.currentTarget.style.background = acc}
          style={{ padding: '15px 28px', borderRadius: 14, border: 'none', background: acc, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: sans, minHeight: 50, transition: 'background 0.18s' }}
        >
          Create free account →
        </button>
        <button
          onClick={() => navigate('/auth?mode=signin')}
          style={{ padding: '15px 28px', borderRadius: 14, border: `1px solid ${bdr}`, background: bg3, color: text, fontSize: 15.5, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 50 }}
        >
          Sign in
        </button>
      </div>
      <div style={{ fontSize: 12, color: t3, marginTop: 26 }}>
        Not a law firm. AI-assisted informal agreements only.
      </div>
    </div>
  )
}

export default function Landing() {
  const isDesktop = useIsDesktop()

  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = MOCKUP_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  return (
    <div style={{ background: bg, color: text, fontFamily: sans, fontSize: 15, flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <TopBar isDesktop={isDesktop} />
      <Hero isDesktop={isDesktop} />

      <div id="cs-steps" style={{ padding: isDesktop ? '0 64px' : '0 20px' }}>
        {STEPS.map((step, i) => (
          <Step key={step.title} step={step} index={i} isDesktop={isDesktop} />
        ))}
      </div>

      <ClosingCTA isDesktop={isDesktop} />
    </div>
  )
}
