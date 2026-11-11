import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { getToken } from '@/lib/api'
import { CallsPage } from '@/pages/calls'
import { DevicesPage } from '@/pages/devices'
import { EntitiesPage } from '@/pages/entities'
import { LoginPage } from '@/pages/login'
import { SearchPage } from '@/pages/search'
import { SmsPage } from '@/pages/sms'

function RequireAuth({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/devices" replace />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="sms" element={<SmsPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="entities" element={<EntitiesPage />} />
        <Route path="search" element={<SearchPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/devices" replace />} />
    </Routes>
  )
}
