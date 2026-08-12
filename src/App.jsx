import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/useAuth'
import { useIsDesktop } from './components/NavBar'
import NavBar from './components/NavBar'
import Landing from './screens/Landing'
import Auth from './screens/Auth'
import Discover from './screens/Discover'
import Listing from './screens/Listing'
import PostListing from './screens/PostListing'
import Messages from './screens/Messages'
import Chat from './screens/Chat'
import ConfigureContract from './screens/ConfigureContract'
import Contract from './screens/Contract'
import Signing from './screens/Signing'
import Sealed from './screens/Sealed'
import Vault from './screens/Vault'
import Notifications from './screens/Notifications'
import Profile from './screens/Profile'
import Review from './screens/Review'
import AlertSetup from './screens/AlertSetup'
import { bg } from './theme'

const GLOBAL_CSS = `
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

// ── Layout wrapper for authenticated screens ──────────────────────────────────
function AuthLayout({ children }) {
  const isDesktop = useIsDesktop()
  return (
    <div style={{
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      height: '100svh',
      background: bg,
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {children}
      </div>
      <NavBar />
    </div>
  )
}

// ── Auth guard ────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const user = useAuth(s => s.user)
  if (!user) return <Navigate to="/auth" replace />
  return <AuthLayout>{children}</AuthLayout>
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const user = useAuth(s => s.user)

  return (
    <>
      <GlobalStyles />
      <Routes>
        <Route path="/auth"           element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/"               element={user ? <RequireAuth><Discover /></RequireAuth> : <Landing />} />
        <Route path="/listing/:id"    element={<RequireAuth><Listing /></RequireAuth>} />
        <Route path="/post"           element={<RequireAuth><PostListing /></RequireAuth>} />
        <Route path="/messages"       element={<RequireAuth><Messages /></RequireAuth>} />
        <Route path="/chat/:threadId" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/configure-contract" element={<RequireAuth><ConfigureContract /></RequireAuth>} />
        <Route path="/contract/:id"   element={<RequireAuth><Contract /></RequireAuth>} />
        <Route path="/signing"        element={<RequireAuth><Signing /></RequireAuth>} />
        <Route path="/sealed"         element={<RequireAuth><Sealed /></RequireAuth>} />
        <Route path="/vault"          element={<RequireAuth><Vault /></RequireAuth>} />
        <Route path="/notifications"  element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/profile"        element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/review"         element={<RequireAuth><Review /></RequireAuth>} />
        <Route path="/alert-setup"    element={<RequireAuth><AlertSetup /></RequireAuth>} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
