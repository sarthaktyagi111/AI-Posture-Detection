import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import Analytics from '@/pages/Analytics'
import History from '@/pages/History'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Settings from '@/pages/Settings'

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted text-sm">Loading…</div>
  }
  if (!user) return <Navigate to="/onboarding" replace />

  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/"
        element={
          <ProtectedShell>
            <Dashboard />
          </ProtectedShell>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedShell>
            <History />
          </ProtectedShell>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedShell>
            <Analytics />
          </ProtectedShell>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedShell>
            <Settings />
          </ProtectedShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
