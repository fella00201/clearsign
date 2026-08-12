import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContracts } from '../store/useContracts'
import { useAuth } from '../store/useAuth'
import { bg, bg2, bg3, bdr, text, t2, t3, acc, green, sans, serif } from '../theme'

function notifyOtherParty({ otherEmail, contractId, listingId, title, body }) {
  try {
    const notifKey = `cs_notifs_${otherEmail}`
    const existing = JSON.parse(localStorage.getItem(notifKey) || '[]')
    const notif = {
      id: Math.random().toString(36).slice(2, 10), type: 'contract_request',
      title, body, at: new Date().toISOString(), read: false, contractId, listingId,
    }
    localStorage.setItem(notifKey, JSON.stringify([notif, ...existing]))
  } catch {}
}

export default function Signing() {
  const navigate      = useNavigate()
  const user          = useAuth(s => s.user)
  const activeDoc     = useContracts(s => s.activeDoc)
  const signContract  = useContracts(s => s.signContract)
  const sealContract  = useContracts(s => s.sealContract)

  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const [hasMark, setHasMark] = useState(false)

  useEffect(() => { if (!activeDoc) navigate(-1) }, [activeDoc, navigate])

  const isCreator = activeDoc?.creatorEmail === user?.email
  const role      = isCreator ? 'creator' : 'counterparty'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = canvas.offsetWidth  * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    const ctx = canvas.getContext('2d')
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.strokeStyle = text
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
  }, [])

  function pos(e, canvas) {
    const r   = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - r.left, y: src.clientY - r.top }
  }

  function onStart(e) {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const { x, y } = pos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function onMove(e) {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const { x, y } = pos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasMark) setHasMark(true)
  }

  function onEnd(e) { e.preventDefault(); drawing.current = false }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    setHasMark(false)
  }

  function confirm() {
    if (!hasMark || !activeDoc) return
    const sigData = canvasRef.current.toDataURL('image/png')
    signContract(activeDoc.id, role, sigData)

    const nowCreatorSigned      = role === 'creator'      ? true : !!activeDoc.creatorSignedAt
    const nowCounterpartySigned = role === 'counterparty' ? true : !!activeDoc.counterpartySignedAt
    const sealed = nowCreatorSigned && nowCounterpartySigned
    const otherEmail = role === 'creator' ? activeDoc.counterpartyEmail : activeDoc.creatorEmail

    notifyOtherParty({
      otherEmail, contractId: activeDoc.id, listingId: activeDoc.listingId,
      title: sealed ? 'Contract sealed!' : 'Contract signed',
      body: sealed
        ? `${user.name} signed — your contract for "${activeDoc.listingTitle}" is now sealed!`
        : `${user.name} signed the contract for "${activeDoc.listingTitle}" — it's ready for your signature.`,
    })

    if (sealed) {
      sealContract(activeDoc.id)
      navigate('/sealed')
    } else {
      navigate(`/contract/${activeDoc.id}`)
    }
  }

  if (!activeDoc) return null

  const avatarInitials = (user?.name || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', fontFamily: sans, fontSize: 15, color: text }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: bg, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t2, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Sign Contract</div>
        <div style={{ width: 44 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '24px 16px 100px' }}>

        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: text, marginBottom: 4 }}>
          Sign the contract
        </div>
        <div style={{ fontSize: 13, color: t2, marginBottom: 22 }}>
          Draw your signature below
        </div>

        {/* Signing as */}
        <div style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: '12px 14px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: `${user?.avatarColor || acc}22`, color: user?.avatarColor || acc,
            fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {avatarInitials}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
              Signing as
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{user?.name}</div>
          </div>
        </div>

        {/* Canvas label + clear */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Your signature
          </div>
          {hasMark && (
            <button onClick={clearCanvas} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: t2, fontFamily: sans, padding: '4px 0' }}>
              Clear
            </button>
          )}
        </div>

        {/* Canvas pad */}
        <div style={{ background: bg3, border: `1px solid ${hasMark ? bdr : bdr}`, borderRadius: 14, overflow: 'hidden', marginBottom: 10, touchAction: 'none' }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: 180, cursor: 'crosshair' }}
            onMouseDown={onStart}
            onMouseMove={onMove}
            onMouseUp={onEnd}
            onMouseLeave={onEnd}
            onTouchStart={onStart}
            onTouchMove={onMove}
            onTouchEnd={onEnd}
          />
        </div>
        <div style={{ fontSize: 11, color: t3, textAlign: 'center' }}>
          Sign using your finger or mouse
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button
          onClick={confirm}
          disabled={!hasMark}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: 14, borderRadius: 14, border: 'none',
            background: hasMark ? green : bg3,
            color: hasMark ? bg2 : t3,
            fontSize: 14, fontWeight: 600,
            cursor: hasMark ? 'pointer' : 'default',
            fontFamily: sans, transition: 'all 0.18s',
          }}
        >
          Confirm signature →
        </button>
      </div>
    </div>
  )
}
