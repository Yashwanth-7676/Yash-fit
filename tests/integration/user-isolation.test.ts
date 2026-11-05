import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveBodyMeasurementsLocally,
  getBodyMeasurements,
} from '@/lib/transformation/transformationService'
import type { BodyMeasurementEntry } from '@/types/transformation'

describe('Integration: User Data Partitioning & Isolation', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    global.window = {} as unknown as Window & typeof globalThis
    global.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k])
      },
      key: (i: number) => Object.keys(store)[i] || null,
      length: Object.keys(store).length,
    }
  })

  it('partitions measurement records strictly by user ID namespace', async () => {
    const userA = 'athlete-alpha-123'
    const userB = 'athlete-beta-456'

    const entriesA: BodyMeasurementEntry[] = [
      {
        id: 'm-a1',
        userId: userA,
        recordedDate: '2026-11-01',
        weightKg: 85.0,
        waistCm: 88.0,
        notes: 'User A confidential data',
      },
    ]

    const entriesB: BodyMeasurementEntry[] = [
      {
        id: 'm-b1',
        userId: userB,
        recordedDate: '2026-11-01',
        weightKg: 65.0,
        waistCm: 72.0,
        notes: 'User B confidential data',
      },
    ]

    // Save for User A
    saveBodyMeasurementsLocally(userA, entriesA)
    // Save for User B
    saveBodyMeasurementsLocally(userB, entriesB)

    // Retrieve User A records
    const recordsA = await getBodyMeasurements(userA)
    expect(recordsA).toHaveLength(1)
    expect(recordsA[0].id).toBe('m-a1')
    expect(recordsA[0].weightKg).toBe(85.0)

    // Retrieve User B records
    const recordsB = await getBodyMeasurements(userB)
    expect(recordsB).toHaveLength(1)
    expect(recordsB[0].id).toBe('m-b1')
    expect(recordsB[0].weightKg).toBe(65.0)

    // Verify User A cannot see User B's entries
    expect(recordsA.some((r) => r.id === 'm-b1')).toBe(false)
    expect(recordsB.some((r) => r.id === 'm-a1')).toBe(false)
  })
})
