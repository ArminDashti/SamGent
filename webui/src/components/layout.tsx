import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, MessageSquare, Phone, Search, Smartphone, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setToken } from '@/lib/api'
import { cn } from '@/lib/utils'

const links = [
  { to: '/devices', label: 'Devices', icon: Smartphone },
  { to: '/sms', label: 'SMS', icon: MessageSquare },
  { to: '/calls', label: 'Calls', icon: Phone },
  { to: '/entities', label: 'Parsed', icon: Tags },
  { to: '/search', label: 'Search', icon: Search },
]

export function Layout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-card/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <NavLink to="/devices" className="font-mono text-xl font-bold tracking-tight text-primary">
              SamGent
            </NavLink>
            <nav className="hidden gap-1 md:flex" aria-label="Main">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors cursor-pointer',
                      isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    )
                  }
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <Button
            variant="ghost"
            aria-label="Sign out"
            onClick={() => {
              setToken(null)
              navigate('/login')
            }}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:hidden" aria-label="Mobile">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm cursor-pointer',
                  isActive ? 'bg-muted' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
