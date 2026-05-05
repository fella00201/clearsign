import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useMessages } from '../store/useMessages'
import { supabase } from '../lib/supabase'
import { callClaude } from '../lib/anthropic'

const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const acc2  = '#3d6ee0'
const bdr   = '#2a2a36'
const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const accbg = '#141f3c'
const text  = '#eeedf5'
const red   = '#ff5b5b'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

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

const AI_ICON = on => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2a3.5 3.5 0 013.5 3.5c0 .9-.3 1.7-.8 2.3A5 5 0 0115 12v.5h-2V12a3 3 0 00-6 0v.5H5V12a5 5 0 012.3-4.2A3.5 3.5 0 016.5 5.5 3.5 3.5 0 0110 2z" fill={on ? acc : t3} />
    <circle cx="10" cy="16.5" r="2" fill={on ? acc : t3} />
  </svg>
)

const AI_SYSTEM = `You are the ClearSign assistant. ClearSign is a marketplace where people post rentals, services and gigs and sign AI-generated contracts. Help users navigate the app, find listings, understand contracts, and answer questions. Keep answers short and friendly.`

const QUICK_CHIPS = ['How do I post a listing?', 'How do contracts work?', 'What is the vault?']

export function useIsDesktop() {
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
  useEffect(() => {
    const fn = () => setD(window.innerWidth >= 1024)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return d
}

function AIPanel({ msgs, msgsRef, input, setInput, onSend, inputRef, onClose, style }) {
  return (
    <div style={{
      background: bg2, borderTop: `1px solid ${bdr}`,
      borderRadius: '20px 20px 0 0',
      display: 'flex', flexDirection: 'column',
      zIndex: 200,
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: accbg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {AI_ICON(true)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: text }}>ClearSign AI</div>
            <div style={{ fontSize: 11, color: t2 }}>Ask me anything</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, fontSize: 22, lineHeight: 1, padding: '4px 6px', fontFamily: sans }}>×</button>
      </div>
      <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'none' }}>
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
      <div style={{ display: 'flex', gap: 6, padding: '8px 14px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {QUICK_CHIPS.map(q => (
          <button key={q} onClick={() => onSend(q)} style={{ background: bg3, border: `1px solid ${bdr}`, borderRadius: 999, padding: '7px 13px', fontSize: 12, color: t2, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: sans }}>
            {q}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', borderTop: `1px solid ${bdr}`, background: bg2, flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          placeholder="Ask anything…"
          value={input}
          rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px' }}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          style={{ flex: 1, background: bg3, border: `1px solid ${bdr}`, borderRadius: 14, padding: '10px 13px', fontSize: 13, fontFamily: sans, color: text, outline: 'none', resize: 'none', maxHeight: 80, transition: 'border-color 0.18s' }}
        />
        <button
          onClick={() => onSend()}
          style={{ width: 38, height: 38, borderRadius: '50%', background: acc, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 2.5L2 7l4.5 2.5L9 14l4.5-11.5z" fill="#fff" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function NavBar() {
  const navigate        = useNavigate()
  const { pathname }    = useLocation()
  const user            = useAuth(s => s.user)
  const unreadCount     = useMessages(s => s.unreadCount)
  const loadUnreadCount = useMessages(s => s.loadUnreadCount)
  const isDesktop       = useIsDesktop()

  const [aiOpen, setAiOpen] = useState(false)
  const [msgs, setMsgs]     = useState([])
  const [input, setInput]   = useState('')
  const [busy, setBusy]     = useState(false)
  const msgsRef  = useRef(null)
  const inputRef = useRef(null)

  const active = pathname === '/'                    ? 'discover'
    : pathname.startsWith('/messages')              ? 'messages'
    : pathname.startsWith('/post')                  ? 'post'
    : pathname.startsWith('/vault')                 ? 'vault'
    : pathname.startsWith('/profile')               ? 'profile'
    : null

  useEffect(() => {
    if (!user?.email) return
    loadUnreadCount(user.email)
    const channel = supabase
      .channel('unread-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.from_email !== user.email) {
          useMessages.getState().loadUnreadCount(user.email)
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.email])

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  function toggleAI() {
    if (!aiOpen && msgs.length === 0) {
      setMsgs([{ from: 'bot', text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your ClearSign assistant. Ask me anything about listings, contracts, or how the app works.` }])
    }
    setAiOpen(o => !o)
  }

  async function sendAI(text) {
    const txt = (text ?? input).trim()
    if (!txt || busy) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    const next = [...msgs.filter(m => m.from !== 'typing'), { from: 'user', text: txt }]
    setMsgs([...next, { from: 'typing' }])
    setBusy(true)
    try {
      const history = next.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
      const reply = await callClaude({ system: AI_SYSTEM, messages: history, max_tokens: 300 })
      setMsgs([...next, { from: 'bot', text: reply || 'Try browsing the listings or use the search bar!' }])
    } catch {
      setMsgs([...next, { from: 'bot', text: 'Having trouble connecting — try searching for listings directly!' }])
    }
    setBusy(false)
  }

  // ── Desktop sidebar ──────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <>
        <div style={{
          width: 220, flexShrink: 0,
          background: bg, borderLeft: `1px solid ${bdr}`,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            style={{ padding: '18px 20px 16px', fontFamily: serif, fontSize: 20, fontWeight: 600, color: text, cursor: 'pointer', borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}
          >
            Clear<b style={{ color: acc, fontWeight: 600 }}>Sign</b>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, padding: 8, overflowY: 'auto' }}>
            {TABS.map(({ id, path, label, icon }) => {
              const on        = active === id
              const showBadge = id === 'messages' && unreadCount > 0
              return (
                <button
                  key={id}
                  onClick={() => navigate(path)}
                  onMouseEnter={e => { if (!on) { e.currentTarget.style.background = bg3; e.currentTarget.style.color = text } }}
                  onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t2 } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: 'none', background: on ? accbg : 'transparent',
                    color: on ? acc : t2, cursor: 'pointer', fontFamily: sans,
                    minHeight: 44, marginBottom: 2, transition: 'all 0.18s', textAlign: 'left',
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {icon(on)}
                    {showBadge && (
                      <div style={{ position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 999, background: red, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Bottom actions */}
          <div style={{ padding: 12, borderTop: `1px solid ${bdr}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={toggleAI}
              onMouseEnter={e => { if (!aiOpen) { e.currentTarget.style.background = bg3; e.currentTarget.style.color = text } }}
              onMouseLeave={e => { if (!aiOpen) { e.currentTarget.style.background = aiOpen ? accbg : 'transparent'; e.currentTarget.style.color = aiOpen ? acc : t2 } }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${aiOpen ? acc : bdr}`,
                background: aiOpen ? accbg : 'transparent',
                color: aiOpen ? acc : t2,
                cursor: 'pointer', fontFamily: sans, minHeight: 44,
                transition: 'all 0.18s', textAlign: 'left',
              }}
            >
              {AI_ICON(aiOpen)}
              <span style={{ fontSize: 14, fontWeight: 600 }}>AI Assistant</span>
            </button>

            <button
              onClick={() => navigate('/post')}
              onMouseEnter={e => e.currentTarget.style.background = acc2}
              onMouseLeave={e => e.currentTarget.style.background = acc}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '11px 12px', borderRadius: 10,
                border: 'none', background: acc, color: '#fff',
                cursor: 'pointer', fontFamily: sans, minHeight: 44,
                fontSize: 14, fontWeight: 700, transition: 'background 0.18s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New Listing
            </button>
          </div>
        </div>

        {aiOpen && (
          <AIPanel
            msgs={msgs} msgsRef={msgsRef}
            input={input} setInput={setInput}
            onSend={sendAI} inputRef={inputRef}
            onClose={() => setAiOpen(false)}
            style={{ position: 'fixed', right: 220, bottom: 0, width: 380, height: '60vh' }}
          />
        )}
      </>
    )
  }

  // ── Mobile bottom bar ────────────────────────────────────────────────────
  return (
    <>
      {aiOpen && (
        <AIPanel
          msgs={msgs} msgsRef={msgsRef}
          input={input} setInput={setInput}
          onSend={sendAI} inputRef={inputRef}
          onClose={() => setAiOpen(false)}
          style={{ position: 'fixed', bottom: 58, left: 0, right: 0, height: '65vh' }}
        />
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        borderTop: `1px solid ${bdr}`, background: bg, flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(({ id, path, label, icon }) => {
          const on        = active === id
          const showBadge = id === 'messages' && unreadCount > 0
          return (
            <button key={id} onClick={() => navigate(path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 4px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: sans }}>
              <div style={{ position: 'relative' }}>
                {icon(on)}
                {showBadge && (
                  <div style={{ position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 999, background: red, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: on ? acc : t3 }}>{label}</span>
            </button>
          )
        })}
        <button onClick={toggleAI} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 4px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: sans }}>
          {AI_ICON(aiOpen)}
          <span style={{ fontSize: 9, fontWeight: 600, color: aiOpen ? acc : t3 }}>AI</span>
        </button>
      </div>
    </>
  )
}
