import { describe, it, expect } from 'vitest'
import {
  exportMeasurementsToCsv,
  exportMeasurementsToJson,
} from '@/lib/transformation/transformationService'
import { buildFullDataExport } from '@/lib/privacy-center/privacyCenterService'
import type { BodyMeasurementEntry } from '@/types/transformation'

describe('Unit: Data Transformation Utilities & Exporters', () => {
  const sampleEntries: BodyMeasurementEntry[] = [
    {
      id: 'm1',
      userId: 'test-user',
      recordedDate: '2026-10-15',
      weightKg: 78.5,
      waistCm: 84.0,
      chestCm: 102.0,
      hipsCm: 98.0,
      armCm: 36.5,
      thighCm: 58.0,
      neckCm: 38.0,
      notes: 'Morning measurement, fasted',
    },
    {
      id: 'm2',
      userId: 'test-user',
      recordedDate: '2026-11-01',
      weightKg: 77.2,
      waistCm: 82.5,
      chestCm: 102.5,
      hipsCm: 97.5,
      armCm: 37.0,
      thighCm: 57.5,
      neckCm: 38.0,
      notes: 'Feeling energized, "strong" session yesterday',
    },
  ]

  it('transforms body measurements into valid RFC-compliant CSV with header row', () => {
    const csv = exportMeasurementsToCsv(sampleEntries)
    expect(csv).toContain('Date,Weight (kg),Waist (cm),Chest (cm),Hips (cm),Arm (cm),Thigh (cm),Neck (cm),Notes')
    expect(csv).toContain('2026-10-15,78.5,84,102,98,36.5,58,38,"Morning measurement, fasted"')
    // Quotes inside notes should be escaped with double quotes
    expect(csv).toContain('""strong"" session yesterday')
  })

  it('transforms body measurements into valid, formatted JSON string', () => {
    const jsonStr = exportMeasurementsToJson(sampleEntries)
    const parsed = JSON.parse(jsonStr)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].id).toBe('m1')
    expect(parsed[1].weightKg).toBe(77.2)
  })

  it('generates complete GDPR Article 20 data portability export archive', () => {
    const exportData = buildFullDataExport()
    expect(exportData.exportMetadata).toBeDefined()
    const metadata = exportData.exportMetadata as { version: string; gdprCompliance: string }
    expect(metadata.version).toBe('3.0.0')
    expect(metadata.gdprCompliance).toContain('Article 20')
  })
})
