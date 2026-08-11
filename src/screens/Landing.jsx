import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsDesktop } from '../components/NavBar'
import { bg, bg2, bg3, bdr, text, t2, t3, acc, acc2, accbg, serif, sans } from '../theme'

const STEPS = [
  {
    icon: '🔍',
    kicker: 'Step 1',
    title: 'Discover, or post what you have',
    body: 'Browse rentals, services and gigs near you — or list your own room, gear, or skills in a few taps.',
    video: '/video/step-discover.mp4',
  },
  {
    icon: '💬',
    kicker: 'Step 2',
    title: 'Message and agree on the details',
    body: 'Chat directly with the other person, right in the app, until you’re both happy with the terms.',
    video: '/video/step-message.mp4',
  },
  {
    icon: '📄',
    kicker: 'Step 3',
    title: 'AI drafts the contract',
    body: 'Claude turns your conversation into a clear, fair agreement — in seconds, no legal jargon.',
    video: '/video/step-contract.mp4',
  },
  {
    icon: '✍️',
    kicker: 'Step 4',
    title: 'Sign it, right on your screen',
    body: 'Draw your signature with a finger or a mouse. No printing, no scanning, no back-and-forth.',
    video: '/video/step-sign.mp4',
  },
  {
    icon: '🔴',
    kicker: 'Step 5',
    title: 'Sealed — and binding',
    body: 'Once both sides have signed, the contract is sealed, stored in your vault, and ready when you need it.',
    video: '/video/auth-waxseal.mp4',
  },
]

function useReveal() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function StepMedia({ icon, src, inView, reducedMotion }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v || reducedMotion) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [inView, reducedMotion])

  const frame = {
    width: '100%', aspectRatio: '1 / 1', borderRadius: 20, overflow: 'hidden',
    background: `linear-gradient(160deg, ${accbg}, ${bg3})`,
    border: `1px solid ${bdr}`,
    boxShadow: '0 20px 40px -24px rgba(42,36,32,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }

  if (reducedMotion) {
    return <div style={frame}><span style={{ fontSize: 56 }}>{icon}</span></div>
  }

  return (
    <div style={frame}>
      <video ref={videoRef} muted loop playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
        <source src={src} type="video/mp4" />
      </video>
    </div>
  )
}

function Step({ step, index, isDesktop, reducedMotion }) {
  const [ref, inView] = useReveal()
  const flip = isDesktop && index % 2 === 1

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: isDesktop ? (flip ? 'row-reverse' : 'row') : 'column',
        alignItems: 'center',
        gap: isDesktop ? 56 : 20,
        padding: isDesktop ? '56px 0' : '32px 0',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <div style={{ flex: isDesktop ? '0 0 40%' : 'none', width: isDesktop ? undefined : '72%', maxWidth: isDesktop ? undefined : 280 }}>
        <StepMedia icon={step.icon} src={step.video} inView={inView} reducedMotion={reducedMotion} />
      </div>
      <div style={{ flex: 1, textAlign: isDesktop ? 'left' : 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
          {step.kicker}
        </div>
        <div style={{ fontFamily: serif, fontSize: isDesktop ? 28 : 22, fontWeight: 300, color: text, marginBottom: 10, lineHeight: 1.2 }}>
          {step.title}
        </div>
        <div style={{ fontSize: 14.5, color: t2, lineHeight: 1.7, maxWidth: 420, margin: isDesktop ? 0 : '0 auto' }}>
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
      background: `radial-gradient(120% 65% at 50% -10%, ${accbg}, ${bg} 62%)`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: acc, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>
        Find. Agree. Sign.
      </div>
      <div style={{ fontFamily: serif, fontSize: isDesktop ? 'clamp(38px, 5.2vw, 60px)' : 32, fontWeight: 300, lineHeight: 1.15, color: text, maxWidth: 780, marginBottom: 20 }}>
        The marketplace where every deal ends with a <b style={{ color: acc, fontWeight: 500 }}>signature</b>
      </div>
      <div style={{ fontSize: 15.5, color: t2, maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}>
        Post rentals, services and gigs. Message the people you're dealing with.
        Let AI draft a fair contract. Sign it, seal it, done.
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/auth?mode=signup')}
          onMouseEnter={e => e.currentTarget.style.background = acc2}
          onMouseLeave={e => e.currentTarget.style.background = acc}
          style={{ padding: '14px 26px', borderRadius: 14, border: 'none', background: acc, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: sans, minHeight: 48, transition: 'background 0.18s' }}
        >
          Get started →
        </button>
        <button
          onClick={scrollToSteps}
          style={{ padding: '14px 26px', borderRadius: 14, border: `1px solid ${bdr}`, background: bg2, color: text, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 48 }}
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
      padding: isDesktop ? '88px 56px' : '56px 20px',
      textAlign: 'center', borderTop: `1px solid ${bdr}`, background: bg2,
    }}>
      <div style={{ fontFamily: serif, fontSize: isDesktop ? 34 : 25, fontWeight: 300, color: text, marginBottom: 12 }}>
        Ready to make it official?
      </div>
      <div style={{ fontSize: 14.5, color: t2, marginBottom: 26 }}>
        Create a free account and post your first listing in minutes.
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/auth?mode=signup')}
          onMouseEnter={e => e.currentTarget.style.background = acc2}
          onMouseLeave={e => e.currentTarget.style.background = acc}
          style={{ padding: '14px 26px', borderRadius: 14, border: 'none', background: acc, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: sans, minHeight: 48, transition: 'background 0.18s' }}
        >
          Create free account →
        </button>
        <button
          onClick={() => navigate('/auth?mode=signin')}
          style={{ padding: '14px 26px', borderRadius: 14, border: `1px solid ${bdr}`, background: bg3, color: text, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: sans, minHeight: 48 }}
        >
          Sign in
        </button>
      </div>
      <div style={{ fontSize: 11, color: t3, marginTop: 24 }}>
        Not a law firm. AI-assisted informal agreements only.
      </div>
    </div>
  )
}

export default function Landing() {
  const isDesktop = useIsDesktop()
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  return (
    <div style={{ background: bg, color: text, fontFamily: sans, fontSize: 15, flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <TopBar isDesktop={isDesktop} />
      <Hero isDesktop={isDesktop} />

      <div id="cs-steps" style={{ maxWidth: 980, margin: '0 auto', padding: isDesktop ? '0 56px' : '0 20px' }}>
        {STEPS.map((step, i) => (
          <Step key={step.title} step={step} index={i} isDesktop={isDesktop} reducedMotion={reducedMotion} />
        ))}
      </div>

      <ClosingCTA isDesktop={isDesktop} />
    </div>
  )
}
