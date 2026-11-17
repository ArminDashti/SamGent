import { Outlet } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'

export function TelemetryLayout() {
  return (
    <div>
      <PageHeader
        title="Telemetry"
        description="Sensor samples uploaded from phones. Pick a channel below and a time range on each page."
      />
      <Outlet />
    </div>
  )
}