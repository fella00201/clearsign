import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContracts } from '../store/useContracts'
import { useAuth } from '../store/useAuth'

const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const green = '#3ecf7a'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

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

    if (nowCreatorSigned && nowCounterpartySigned) {
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
            color: hasMark ? '#071a0f' : t3,
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
