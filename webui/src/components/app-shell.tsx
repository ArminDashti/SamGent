import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { SidebarNav } from '@/components/sidebar-nav'
import { Button } from '@/components/ui/button'
import { setToken } from '@/lib/api'
import { cn } from '@/lib/utils'

export function AppShell() {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  function signOut() {
    setToken(null)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="border-b border-border px-5 py-4">
          <span className="font-mono text-lg font-semibold text-foreground">SamGent</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t border-border p-3">
          <Button variant="ghost" className="w-full justify-start" aria-label="Sign out" onClick={signOut}>
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </aside>

      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-sidebar transition-transform duration-200 md:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-mono text-lg font-semibold">SamGent</span>
          <Button variant="ghost" className="min-h-9 px-2" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </div>
        <div className="border-t border-border p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Button variant="ghost" className="min-h-9 px-2" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <span className="font-mono font-semibold">SamGent</span>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}