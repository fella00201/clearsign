import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/useAuth'
import { callClaude } from './lib/anthropic'
import Auth from './screens/Auth'
import Discover from './screens/Discover'
import Listing from './screens/Listing'
import PostListing from './screens/PostListing'
import Messages from './screens/Messages'
import Chat from './screens/Chat'
import Contract from './screens/Contract'
import Signing from './screens/Signing'
import Sealed from './screens/Sealed'
import Vault from './screens/Vault'
import Notifications from './screens/Notifications'
import Profile from './screens/Profile'
import Review from './screens/Review'
import AlertSetup from './screens/AlertSetup'

// ── Design tokens (shared with AI panel) ────────────────────────────────────
const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const bdr2  = '#3a3a4c'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const acc2  = '#3d6ee0'
const accbg = '#141f3c'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

const AI_SYSTEM = `You are the ClearSign assistant. ClearSign is a marketplace where people post rentals, services and gigs and sign AI-generated contracts. Help users navigate the app, find listings, understand contracts, and answer questions. Keep answers short and friendly.`

const QUICK_CHIPS = [
  'How do I post a listing?',
  'How do contracts work?',
  'What is the vault?',
]

// ── Global keyframe styles injected once ────────────────────────────────────
const GLOBAL_CSS = `
@keyframes cs-pulse-glow {
  0%,100% { box-shadow: 0 4px 20px rgba(91,143,255,.4); }
  50%      { box-shadow: 0 4px 32px rgba(91,143,255,.7); }
}
@keyframes cs-bounce {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
`

function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = GLOBAL_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])
  return null
}

// ── AI assistant ─────────────────────────────────────────────────────────────
function AIAssistant({ user }) {
  const [open, setOpen]   = useState(false)
  const [msgs, setMsgs]   = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy]   = useState(false)
  const msgsRef  = useRef(null)
  const inputRef = useRef(null)

  function toggle() {
    if (!open && msgs.length === 0) {
      setMsgs([{ from: 'bot', text: `Hi ${user.name.split(' ')[0]}! 👋 I'm your ClearSign assistant. Ask me anything about finding listings, creating contracts, or how the app works.` }])
    }
    setOpen(o => !o)
  }

  async function send(text) {
    const txt = (text ?? input).trim()
    if (!txt || busy) return
    setInput('')
    if (inputRef.current) { inputRef.current.style.height = 'auto' }
    const next = [...msgs.filter(m => m.from !== 'typing'), { from: 'user', text: txt }]
    setMsgs([...next, { from: 'typing' }])
    setBusy(true)
    try {
      const history = next.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
      const reply   = await callClaude({ system: AI_SYSTEM, messages: history, max_tokens: 300 })
      setMsgs([...next, { from: 'bot', text: reply || 'Try browsing the listings or use the search bar!' }])
    } catch {
      setMsgs([...next, { from: 'bot', text: 'Having trouble connecting — try searching for listings directly!' }])
    }
    setBusy(false)
  }

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  if (!user) return null

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={toggle}
          title="AI Assistant"
          style={{
            position: 'fixed', bottom: 80, right: 16,
            width: 52, height: 52, borderRadius: '50%',
            background: acc, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50,
            animation: 'cs-pulse-glow 2.5s ease infinite',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = acc2; e.currentTarget.style.transform = 'scale(1.07)' }}
          onMouseLeave={e => { e.currentTarget.style.background = acc;  e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a4 4 0 014 4c0 1-.3 1.9-.8 2.6A6 6 0 0118 14v1h-2v-1a4 4 0 00-8 0v1H6v-1a6 6 0 012.8-5.4A4 4 0 018 6a4 4 0 014-4z" fill="rgba(255,255,255,.9)" />
            <circle cx="12" cy="19" r="2" fill="rgba(255,255,255,.9)" />
          </svg>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          height: '68%',
          background: bg2, borderTop: `1px solid ${bdr}`,
          borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          zIndex: 60,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: accbg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5a3 3 0 013 3c0 .75-.22 1.43-.6 2A4.5 4.5 0 0113.5 10v.75h-1.5V10A3 3 0 006 10v.75H4.5V10a4.5 4.5 0 012.1-3.8A3 3 0 016 4.5a3 3 0 013-3z" fill={acc} />
                  <circle cx="9" cy="14.25" r="1.5" fill={acc} />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: text }}>ClearSign AI</div>
                <div style={{ fontSize: 11, color: t2 }}>Ask me anything</div>
              </div>
            </div>
            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, fontSize: 22, lineHeight: 1, padding: '4px 6px', fontFamily: sans }}>
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            ref={msgsRef}
            style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'none' }}
          >
            {msgs.map((m, i) => {
              if (m.from === 'typing') return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: '14px 14px 14px 4px', background: bg3, alignSelf: 'flex-start', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 150, 300].map(d => (
                    <span key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: t3, display: 'inline-block', animation: `cs-bounce 0.8s ease ${d}ms infinite` }} />
                  ))}
                </div>
              )
              return (
                <div key={i} style={{
                  padding: '10px 13px',
                  borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.from === 'user' ? acc : bg3,
                  color: m.from === 'user' ? '#fff' : text,
                  fontSize: 13, lineHeight: 1.6,
                  maxWidth: '86%', wordWrap: 'break-word',
                  alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {m.text}
                </div>
              )
            })}
          </div>

          {/* Quick chips */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
            {QUICK_CHIPS.map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                style={{
                  background: bg3, border: `1px solid ${bdr2}`, borderRadius: 999,
                  padding: '7px 13px', fontSize: 12, color: t2,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  fontFamily: sans, transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = acc; e.currentTarget.style.color = acc }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = bdr2; e.currentTarget.style.color = t2 }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div style={{
            display: 'flex', gap: 8, padding: '10px 14px',
            paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            borderTop: `1px solid ${bdr}`, background: bg2, flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              placeholder="Ask anything…"
              value={input}
              rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px' }}
              onFocus={e => e.target.style.borderColor = acc}
              onBlur={e => e.target.style.borderColor = bdr}
              style={{
                flex: 1, background: bg3, border: `1px solid ${bdr}`, borderRadius: 14,
                padding: '10px 13px', fontSize: 13, fontFamily: sans, color: text,
                outline: 'none', resize: 'none', maxHeight: 80, transition: 'border-color 0.18s',
              }}
            />
            <button
              onClick={() => send()}
              style={{
                width: 38, height: 38, borderRadius: '50%', background: acc, border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, alignSelf: 'flex-end', transition: 'background 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = acc2}
              onMouseLeave={e => e.currentTarget.style.background = acc}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 2.5L2 7l4.5 2.5L9 14l4.5-11.5z" fill="#fff" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── Auth guard ────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const user = useAuth(s => s.user)
  return user ? children : <Navigate to="/auth" replace />
}

const Screen = ({ name }) => (
  <div style={{
    minHeight: '100svh', background: '#0d0d11', color: '#eeedf5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: sans, fontSize: 18,
  }}>
    {name}
  </div>
)

// ── Theme initialiser (runs once on cold start) ───────────────────────────────
function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem('cs_theme')
    if (saved === 'light') {
      document.body.classList.add('light')
      const root = document.documentElement
      root.style.setProperty('--cs-bg',   '#f8f8f5')
      root.style.setProperty('--cs-bg2',  '#ffffff')
      root.style.setProperty('--cs-bg3',  '#f0f0ec')
      root.style.setProperty('--cs-text', '#0f0e17')
    }
  }, [])
  return null
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const user = useAuth(s => s.user)

  return (
    <>
      <GlobalStyles />
      <ThemeInit />
      <Routes>
        <Route path="/auth"          element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/"              element={<RequireAuth><Discover /></RequireAuth>} />
        <Route path="/listing/:id"   element={<RequireAuth><Listing /></RequireAuth>} />
        <Route path="/post"          element={<RequireAuth><PostListing /></RequireAuth>} />
        <Route path="/messages"      element={<RequireAuth><Messages /></RequireAuth>} />
        <Route path="/chat/:threadId" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/contract/:id"  element={<RequireAuth><Contract /></RequireAuth>} />
        <Route path="/signing"       element={<RequireAuth><Signing /></RequireAuth>} />
        <Route path="/sealed"        element={<RequireAuth><Sealed /></RequireAuth>} />
        <Route path="/vault"         element={<RequireAuth><Vault /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/profile"       element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/review"        element={<RequireAuth><Review /></RequireAuth>} />
        <Route path="/alert-setup"   element={<RequireAuth><AlertSetup /></RequireAuth>} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
      <AIAssistant user={user} />
    </>
  )
}
