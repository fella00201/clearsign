import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContracts } from '../store/useContracts'
import { useAuth } from '../store/useAuth'

// ── Design tokens ──────────────────────────────────────────────────────────
const bg    = '#0d0d11'
const bg2   = '#141418'
const bg3   = '#1e1e26'
const bdr   = '#2a2a36'
const text  = '#eeedf5'
const t2    = '#9896b2'
const t3    = '#56546c'
const acc   = '#5b8fff'
const green = '#3ecf7a'
const greenbg  = '#0c2018'
const greenbdr = '#183a28'
const amber = '#f5a623'
const sans  = "'Inter', sans-serif"
const serif = "'Sora', sans-serif"

function initials(n) {
  return n.split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

function Avatar({ name, color, size = 32 }) {
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

export default function Contract() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const user            = useAuth(s => s.user)
  const loadContracts   = useContracts(s => s.loadContracts)
  const contracts       = useContracts(s => s.contracts)
  const activeDoc       = useContracts(s => s.activeDoc)

  useEffect(() => { loadContracts(user?.email) }, [loadContracts, user?.email])

  const contract = (activeDoc?.id === id ? activeDoc : null)
    ?? contracts.find(c => c.id === id)

  if (!contract) {
    return (
      <div style={{ flex: 1, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t2, fontFamily: sans, fontSize: 14 }}>
        Contract not found
      </div>
    )
  }

  const isCreator = contract.creatorEmail === user?.email
  const mySigned  = isCreator ? !!contract.creatorSignedAt : !!contract.counterpartySignedAt
  const canSign   = !mySigned && contract.status !== 'sealed'
  const sealed    = contract.status === 'sealed'

  const parties = [
    { name: contract.creatorName,      color: contract.creatorColor,      email: contract.creatorEmail,      signed: contract.creatorSignedAt },
    { name: contract.counterpartyName, color: contract.counterpartyColor, email: contract.counterpartyEmail, signed: contract.counterpartySignedAt },
  ]

  function copyText() {
    navigator.clipboard?.writeText(contract.contractText)
  }

  function printDoc() {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>ClearSign Contract</title><style>body{font-family:Georgia,serif;max-width:660px;margin:48px auto;font-size:13px;line-height:1.9;padding:0 40px}pre{white-space:pre-wrap;font-family:Georgia,serif}.seal{background:#f0fbf7;border:1px solid #b8e8d0;padding:14px;border-radius:8px;margin-top:28px;font-size:12px}@media print{body{margin:0}}</style></head><body><pre>${contract.contractText}</pre><div class="seal"><strong>ClearSign Seal</strong><br>Ref: ${contract.id}</div><script>window.onload=()=>window.print()<\/script></body></html>`)
    w.document.close()
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: text }}>Contract</div>
          {contract.listingTitle && (
            <div style={{ fontSize: 11, color: t2 }}>Re: {contract.listingTitle}</div>
          )}
        </div>
        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 999,
          background: sealed ? greenbg : '#1a2d4a',
          color: sealed ? green : acc,
          border: `1px solid ${sealed ? greenbdr : '#1e3560'}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
          {sealed ? 'Sealed' : 'Pending'}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 90px' }}>

        {/* Listing title */}
        {contract.listingTitle && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, color: text, marginBottom: 4 }}>
              {contract.listingTitle}
            </div>
            {contract.listingId && (
              <div
                onClick={() => navigate(`/listing/${contract.listingId}`)}
                style={{ fontSize: 12, color: acc, cursor: 'pointer' }}
              >
                View listing →
              </div>
            )}
          </div>
        )}

        {/* Parties card */}
        <div style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Parties</div>
          {parties.map(p => (
            <div key={p.email} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <Avatar name={p.name} color={p.color} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: text }}>
                  {p.name}
                  {p.email === user?.email && (
                    <span style={{ fontSize: 10, color: acc, marginLeft: 5 }}>(you)</span>
                  )}
                </div>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 999,
                background: p.signed ? greenbg : '#1a2d4a',
                color: p.signed ? green : acc,
                border: `1px solid ${p.signed ? greenbdr : '#1e3560'}`,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                {p.signed ? 'Signed' : 'Unsigned'}
              </div>
            </div>
          ))}
        </div>

        {/* Amber disclaimer */}
        <div style={{ background: '#231a04', border: '1px solid #3a2a08', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: amber, lineHeight: 1.5 }}>
          AI-generated. For complex situations, consult an attorney.
        </div>

        {/* Contract text */}
        <div style={{ background: bg2, border: `1px solid ${bdr}`, borderRadius: 14, padding: 16, fontSize: 12, lineHeight: 1.9, color: t2, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}>
          {contract.contractText}
        </div>
      </div>

      {/* Bottom bar */}
      {canSign ? (
        <div style={{ padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0 }}>
          <button
            onClick={() => navigate('/signing')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 14, borderRadius: 14, border: 'none', background: green, color: '#071a0f', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans, transition: 'all 0.18s' }}
          >
            Sign this contract →
          </button>
        </div>
      ) : sealed ? (
        <div style={{ padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <button onClick={copyText} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, border: `1px solid ${bdr}`, background: bg3, color: text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans }}>
            Copy
          </button>
          <button onClick={printDoc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, border: `1px solid ${bdr}`, background: bg3, color: text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans }}>
            Print / PDF
          </button>
        </div>
      ) : (
        <div style={{ padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', background: bg, borderTop: `1px solid ${bdr}`, flexShrink: 0, textAlign: 'center', fontSize: 13, color: t2 }}>
          {mySigned ? "You've signed — waiting for the other party." : 'Waiting.'}
        </div>
      )}
    </div>
  )
}
