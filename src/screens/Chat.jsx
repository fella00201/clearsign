import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { useMessages } from '../store/useMessages'
import { useContracts } from '../store/useContracts'
import { generateContract } from '../lib/contracts'
import {
  supabase,
  fetchThreadById,
  fetchMessages,
  fetchListingById,
  insertMessage,
  updateThreadLastAt,
} from '../lib/supabase'

// ── Design tokens ──────────────────────────────────────────────────────────
const bg   = '#0d0d11'
const bg3  = '#1e1e26'
const bdr  = '#2a2a36'
const text = '#eeedf5'
const t2   = '#9896b2'
const t3   = '#56546c'
const acc  = '#5b8fff'
const acc2 = '#3d6ee0'
const green = '#3ecf7a'
const sans = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

function initials(name) {
  return name.split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

function Avatar({ name, color, size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, color,
      fontSize: Math.round(size * 0.33), fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {initials(name)}
    </div>
  )
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function Chat() {
  const { threadId } = useParams()
  const navigate     = useNavigate()
  const user         = useAuth(s => s.user)

  const loadUnreadCount = useMessages(s => s.loadUnreadCount)
  const saveContract    = useContracts(s => s.saveContract)

  const [thread, setThread]       = useState(null)
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [listing, setListing]     = useState(null)
  const [generating, setGenerating] = useState(false)

  const scrollRef   = useRef(null)
  const textareaRef = useRef(null)

  // Load thread + messages on mount / threadId change
  useEffect(() => {
    if (!threadId || !user?.email) return
    const decoded = decodeURIComponent(threadId)
    let cancelled = false

    async function load() {
      // Try Supabase if the ID looks like a UUID
      if (UUID_RE.test(decoded)) {
        try {
          const [t, msgs] = await Promise.all([
            fetchThreadById(decoded),
            fetchMessages(decoded),
          ])
          if (!cancelled) { setThread(t); setMessages(msgs); return }
        } catch {}
      }

      // localStorage fallback
      try {
        const all = JSON.parse(localStorage.getItem('cs_threads') || '[]')
        const t = all.find(x => x.id === decoded)
        if (!t || cancelled) return

        let changed = false
        ;(t.messages || []).forEach(m => {
          if (m.from !== user.email && !m.read) { m.read = true; changed = true }
        })
        if (changed) {
          localStorage.setItem('cs_threads', JSON.stringify(all.map(x => x.id === decoded ? t : x)))
        }
        setThread(t)
        setMessages(t.messages || [])
      } catch {}
    }

    load()
    return () => { cancelled = true }
  }, [threadId, user?.email])

  // Fetch the listing so we can determine if current user is the owner
  useEffect(() => {
    if (!thread?.listingId) return
    fetchListingById(thread.listingId).then(setListing).catch(() => {})
  }, [thread?.listingId])

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  // Realtime subscription — append incoming messages from the other party
  useEffect(() => {
    if (!threadId || !user?.email) return
    const decoded = decodeURIComponent(threadId)
    if (!UUID_RE.test(decoded)) return  // only for Supabase threads

    const channel = supabase
      .channel('messages-' + decoded)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'thread_id=eq.' + decoded,
      }, payload => {
        const row = payload.new
        // Skip messages sent by this user (already added optimistically)
        if (row.from_email !== user.email) {
          setMessages(prev => [...prev, {
            id:       row.id,
            threadId: row.thread_id,
            from:     row.from_email  ?? '',
            fromName: row.from_name   ?? '',
            text:     row.text,
            read:     false,
            at:       row.created_at,
          }])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [threadId, user?.email])

  // Mark all unread messages from the other party as read, then refresh badge
  useEffect(() => {
    if (!threadId || !user?.email) return
    const decoded = decodeURIComponent(threadId)
    if (!UUID_RE.test(decoded)) return

    async function markRead() {
      try {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('thread_id', decoded)
          .neq('from_email', user.email)
        loadUnreadCount(user.email)
      } catch {}
    }

    markRead()
  }, [threadId, user?.email])

  async function sendMessage() {
    const txt = input.trim()
    if (!txt || !thread || !user) return

    const decoded = decodeURIComponent(threadId)
    const msg = { id: uid(), from: user.email, fromName: user.name, text: txt, at: new Date().toISOString(), read: false }

    // Optimistic update
    setMessages(prev => [...prev, msg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Try Supabase if thread ID is a UUID
    if (UUID_RE.test(thread.id)) {
      try {
        await insertMessage({
          threadId: thread.id,
          fromId:   user.id,
          from:     user.email,
          fromName: user.name,
          text:     txt,
        })
        await updateThreadLastAt(thread.id)
        notifyOther(thread, user, msg, decoded)
        return
      } catch (err) {
        console.warn('[Supabase] insertMessage failed:', err.message)
      }
    }

    // localStorage fallback — `messages` is the pre-update closure value
    const lsMsgs = [...messages, msg]
    const updatedThread = { ...thread, messages: lsMsgs, lastAt: msg.at }
    try {
      const all = JSON.parse(localStorage.getItem('cs_threads') || '[]')
      const exists = all.some(x => x.id === decoded)
      const next = exists
        ? all.map(x => x.id === decoded ? updatedThread : x)
        : [...all, updatedThread]
      localStorage.setItem('cs_threads', JSON.stringify(next))
    } catch {}
    notifyOther(thread, user, msg, decoded)
  }

  function notifyOther(thread, user, msg, decodedThreadId) {
    const otherEmail = thread.p1 === user.email ? thread.p2 : thread.p1
    try {
      const key = `cs_notifs_${otherEmail}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const notif = {
        id: uid(), type: 'message',
        title: `New message from ${user.name}`,
        body: msg.text.slice(0, 60),
        at: msg.at, read: false,
        threadId: decodedThreadId,
      }
      localStorage.setItem(key, JSON.stringify([notif, ...existing]))
    } catch {}
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function handleInput(e) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 100) + 'px'
  }

  if (!thread) {
    return (
      <div style={{ flex: 1, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t2, fontFamily: sans, fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  const other = thread.p1 === user?.email
    ? { name: thread.p2Name, color: thread.p2Color, email: thread.p2 }
    : { name: thread.p1Name, color: thread.p1Color, email: thread.p1 }

  const isListingOwner = listing && user && listing.ownerEmail === user.email

  async function createContract() {
    if (generating || !listing || !user) return
    setGenerating(true)
    try {
      const contractText = await generateContract(listing, user.name, other.name)
      const doc = {
        id: Math.random().toString(36).slice(2, 12),
        listingId: listing.id,
        listingTitle: listing.title,
        contractText,
        status: 'pending_counterparty',
        creatorEmail: user.email,
        creatorName: user.name,
        creatorColor: user.avatarColor,
        creatorRole: 'provider',
        counterpartyEmail: other.email,
        counterpartyName: other.name,
        counterpartyColor: other.color,
        counterpartyRole: 'seeker',
        createdAt: new Date().toISOString(),
      }
      const saved = await saveContract(doc)
      try {
        const notifKey = `cs_notifs_${other.email}`
        const existing = JSON.parse(localStorage.getItem(notifKey) || '[]')
        const notif = {
          id: Math.random().toString(36).slice(2, 10),
          type: 'contract_request',
          title: 'New contract request',
          body: `${user.name} sent you a contract for: "${listing.title}"`,
          at: new Date().toISOString(),
          read: false,
          contractId: saved.id,
          listingId: listing.id,
        }
        localStorage.setItem(notifKey, JSON.stringify([notif, ...existing]))
      } catch {}
      navigate(`/contract/${saved.id}`)
    } catch {
      setGenerating(false)
    }
  }

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={other.name} color={other.color} size={30} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{other.name}</div>
            <div
              style={{ fontSize: 11, color: t2, cursor: 'pointer' }}
              onClick={() => thread.listingId && navigate(`/listing/${thread.listingId}`)}
            >
              {thread.listingTitle || 'Conversation'}
            </div>
          </div>
        </div>

        <div style={{ width: 34 }} />
      </div>

      {/* Message bubbles */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 14, display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 13, color: t3 }}>
            Start the conversation!
          </div>
        )}
        {messages.map(m => {
          const me = m.from === user?.email
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: me ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '72%', padding: '10px 13px', fontSize: 13, lineHeight: 1.55,
                marginBottom: 4, wordWrap: 'break-word',
                background: me ? acc : bg3,
                color: me ? '#fff' : text,
                borderRadius: me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              }}>
                {m.text}
              </div>
              <div style={{ fontSize: 10, color: t3, marginBottom: 8, alignSelf: me ? 'flex-end' : 'flex-start' }}>
                {fmtTime(m.at)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create contract banner — visible to listing owner only */}
      {isListingOwner && (
        <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
          <button
            disabled={generating}
            onClick={createContract}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 14,
              border: 'none', background: generating ? '#236644' : green,
              color: '#0d0d11', fontSize: 14, fontWeight: 700,
              cursor: generating ? 'default' : 'pointer',
              fontFamily: sans, transition: 'all 0.18s',
            }}
          >
            {generating ? 'Generating contract…' : `Create contract with ${other.name} →`}
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        padding: '12px 14px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        borderTop: `1px solid ${bdr}`, background: bg, flexShrink: 0,
      }}>
        <textarea
          ref={textareaRef}
          placeholder={`Message ${other.name}…`}
          value={input}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onChange={e => setInput(e.target.value)}
          onFocus={e => e.target.style.borderColor = acc}
          onBlur={e => e.target.style.borderColor = bdr}
          style={{
            flex: 1, background: bg3, border: `1px solid ${bdr}`, borderRadius: 14,
            padding: '10px 13px', fontSize: 14, fontFamily: sans, color: text,
            outline: 'none', resize: 'none', maxHeight: 100,
            transition: 'border-color 0.18s',
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            width: 40, height: 40, borderRadius: '50%', background: acc,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, transition: 'background 0.18s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = acc2}
          onMouseLeave={e => e.currentTarget.style.background = acc}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M15 3L2 8l5 3 3 5 5-13z" fill="#fff" />
          </svg>
        </button>
      </div>
    </div>
  )
}
