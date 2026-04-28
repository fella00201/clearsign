import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/useAuth'
import Auth from './screens/Auth'
import Discover from './screens/Discover'

const Screen = ({ name }) => (
  <div style={{
    minHeight: '100svh',
    background: '#0d0d11',
    color: '#eeedf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 18,
  }}>
    {name}
  </div>
)

function RequireAuth({ children }) {
  const user = useAuth((s) => s.user)
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  const user = useAuth((s) => s.user)

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={<RequireAuth><Discover /></RequireAuth>} />
      <Route path="/listing/:id" element={<RequireAuth><Screen name="Listing" /></RequireAuth>} />
      <Route path="/post" element={<RequireAuth><Screen name="PostListing" /></RequireAuth>} />
      <Route path="/messages" element={<RequireAuth><Screen name="Messages" /></RequireAuth>} />
      <Route path="/chat/:threadId" element={<RequireAuth><Screen name="Chat" /></RequireAuth>} />
      <Route path="/contract/:id" element={<RequireAuth><Screen name="Contract" /></RequireAuth>} />
      <Route path="/signing" element={<RequireAuth><Screen name="Signing" /></RequireAuth>} />
      <Route path="/vault" element={<RequireAuth><Screen name="Vault" /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><Screen name="Notifications" /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Screen name="Profile" /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
