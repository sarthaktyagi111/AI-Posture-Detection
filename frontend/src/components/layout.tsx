import { BarChart3, History, LayoutDashboard, LogOut, Moon, Settings, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('postura_theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('postura_theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Navbar() {
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()

  return (
    <nav className="sticky top-0 z-40 border-b border-line dark:border-line-dark bg-paper/90 dark:bg-paper-dark/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-px bg-plumb" />
          <span className="font-semibold tracking-tight">Postura</span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-ink text-paper dark:bg-plumb dark:text-white'
                    : 'text-muted hover:text-ink dark:hover:text-ink-dark'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="rounded-md p-2 text-muted hover:text-ink dark:hover:text-ink-dark"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user && (
            <button
              onClick={logout}
              aria-label="Log out"
              className="rounded-md p-2 text-muted hover:text-attention"
              title={`Signed in as ${user.username}`}
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </div>

      {/* mobile nav */}
      <div className="flex sm:hidden items-center justify-around border-t border-line dark:border-line-dark px-2 py-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-[11px]', isActive ? 'text-plumb' : 'text-muted')
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
