import type { Metadata } from 'next'
import { IntegrationsContent } from './IntegrationsContent'

export const metadata: Metadata = {
  title: 'Wearable Intelligence Hub & Health Bridges | YashFit',
  description: 'Connect Apple Health, Google Health Connect, Garmin, Whoop, and Oura with real telemetry verification and honest disconnected states.',
}

export default function IntegrationsPage() {
  return <IntegrationsContent />
}

