import { NavLink, useLocation } from 'react-router-dom'
import {
  Activity,
  LayoutDashboard,
  MessageSquare,
  Phone,
  Settings,
  Smartphone,
} from 'lucide-react'
import { TELEMETRY_KINDS } from '@/lib/telemetry-kinds'
import { cn } from '@/lib/utils'

const mainLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/devices', label: 'Devices', icon: Smartphone },
  { to: '/sms', label: 'SMS', icon: MessageSquare },
  { to: '/calls', label: 'Calls', icon: Phone },
] as const

type SidebarNavProps = {
  onNavigate?: () => void
  className?: string
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const location = useLocation()
  const telemetryOpen = location.pathname.startsWith('/telemetry')

  return (
    <nav className={cn('flex flex-col gap-1 px-3 py-4', className)} aria-label="Main">
      {mainLinks.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors cursor-pointer',
              isActive
                ? 'bg-muted text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-primary'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )
          }
        >
          <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
          {label}
        </NavLink>
      ))}

      <div className="mt-2">
        <NavLink
          to="/telemetry/gps"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors cursor-pointer',
              isActive || telemetryOpen
                ? 'bg-muted text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-primary'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )
          }
        >
          <Activity className="size-4 shrink-0" aria-hidden />
          Telemetry
        </NavLink>
        {telemetryOpen ? (
          <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
            {TELEMETRY_KINDS.map((k) => (
              <NavLink
                key={k.slug}
                to={`/telemetry/${k.slug}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-2 py-1.5 text-sm cursor-pointer',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {k.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>

      <NavLink
        to="/settings"
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'relative mt-2 flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors cursor-pointer',
            isActive
              ? 'bg-muted text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-primary'
              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
          )
        }
      >
        <Settings className="size-4 shrink-0" aria-hidden />
        Settings
      </NavLink>
    </nav>
  )
}