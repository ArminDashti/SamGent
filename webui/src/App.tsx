import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { getToken } from '@/lib/api'
import { CallsPage } from '@/pages/calls'
import { DashboardPage } from '@/pages/dashboard'
import { DevicesPage } from '@/pages/devices'
import { EntitiesPage } from '@/pages/entities'
import { LoginPage } from '@/pages/login'
import { SearchPage } from '@/pages/search'
import { SettingsPage } from '@/pages/settings'
import { SmsPage } from '@/pages/sms'
import { TelemetryKindPage } from '@/pages/telemetry/telemetry-kind'
import { TelemetryLayout } from '@/pages/telemetry/telemetry-layout'

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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="sms" element={<SmsPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="entities" element={<EntitiesPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="telemetry" element={<TelemetryLayout />}>
          <Route index element={<Navigate to="gps" replace />} />
          <Route path=":kindSlug" element={<TelemetryKindPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}