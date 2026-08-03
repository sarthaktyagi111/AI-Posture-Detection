import { motion } from 'framer-motion'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Card } from '@/components/ui/primitives'
import { useAuth } from '@/hooks/useAuth'

export default function Onboarding() {
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'register') await register(username, email, password)
      else await login(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-16 lg:px-16 bg-ink text-paper">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="h-10 w-px bg-plumb mb-6" />
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight max-w-md">
            Posture intelligence for your workday.
          </h1>
          <p className="mt-4 text-paper/70 max-w-md">
            Postura watches your alignment through your webcam, calibrated to your own body — not a generic
            threshold — and tells you when something's drifted before it becomes a habit.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-paper/60">
            <li>· Everything runs on-device — video never leaves your laptop</li>
            <li>· Calibrated to your posture, not a universal average</li>
            <li>· Real-time score, session history, and trends over time</li>
          </ul>
        </motion.div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center px-8 py-16">
        <Card className="w-full max-w-sm p-6">
          <div className="flex rounded-md border border-line dark:border-line-dark p-0.5 mb-5">
            {(['register', 'login'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm rounded-sm font-medium transition-colors ${
                  mode === m ? 'bg-ink text-paper dark:bg-plumb dark:text-white' : 'text-muted'
                }`}
              >
                {m === 'register' ? 'Create account' : 'Sign in'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-md border border-line dark:border-line-dark bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-plumb outline-none"
              />
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-muted" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line dark:border-line-dark bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-plumb outline-none"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-line dark:border-line-dark bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-plumb outline-none"
              />
            </div>

            {error && <p className="text-sm text-attention">{error}</p>}

            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="text-xs text-muted mt-4 text-center">
            Demo data? Seed it on the backend, then sign in with <span className="font-data">demo</span> /{' '}
            <span className="font-data">demo1234</span>.
          </p>
        </Card>
      </div>
    </div>
  )
}
