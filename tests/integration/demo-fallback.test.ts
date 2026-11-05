import { describe, it, expect, beforeEach } from 'vitest'
import {
  getBodyIntelligenceRecords,
  saveBodyIntelligenceRecord,
  deleteBodyIntelligenceRecord,
  getBodyIntelligenceGoal,
  saveBodyIntelligenceGoal,
} from '@/lib/body-intelligence/bodyIntelligenceService'
import {
  getCompanionConversationHistory,
  saveCompanionConversationHistory,
  INITIAL_COMPANION_MESSAGE,
} from '@/lib/companion/companionService'
import type { BodyIntelligenceRecord } from '@/types/bodyIntelligence'
import type { CompanionMessage } from '@/types/aiCompanion'

describe('Integration: Local Demo Mode & Storage Resilience', () => {
  // In Node environment, window and localStorage can be simulated
  const mockStorage: Record<string, string> = {}

  beforeEach(() => {
    // Provide an in-memory window & localStorage polyfill for Node test environment
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

  it('safely handles empty local records and returns default fallback state', () => {
    const records = getBodyIntelligenceRecords()
    expect(Array.isArray(records)).toBe(true)

    const goal = getBodyIntelligenceGoal()
    expect(goal).toBeDefined()
    expect(goal.targetWeightKg).toBeGreaterThan(0)
  })

  it('saves, retrieves, and deletes body intelligence entries in local demo mode', () => {
    const testEntry: Omit<BodyIntelligenceRecord, 'id' | 'composition'> = {
      userId: 'demo-user',
      recordedDate: '2026-11-05',
      weightKg: 76.5,
      heightCm: 178,
      age: 26,
      gender: 'male',
      waistCm: 81.5,
      neckCm: 37.5,
      notes: 'Demo mode automated test entry',
      createdAt: new Date().toISOString(),
    }

    const savedRecords = saveBodyIntelligenceRecord(testEntry)
    expect(savedRecords.length).toBeGreaterThan(0)
    const createdId = savedRecords[savedRecords.length - 1].id
    expect(createdId).toBeDefined()

    // Retrieve via getter
    const retrieved = getBodyIntelligenceRecords()
    expect(retrieved.some((r) => r.id === createdId)).toBe(true)

    // Delete
    const remaining = deleteBodyIntelligenceRecord(createdId)
    expect(remaining.some((r) => r.id === createdId)).toBe(false)
  })

  it('persists and restores companion conversation history in offline mode', () => {
    const testMessages: CompanionMessage[] = [
      INITIAL_COMPANION_MESSAGE,
      {
        id: 'msg-test-1',
        role: 'user',
        content: 'How much protein in 100g paneer?',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'msg-test-2',
        role: 'assistant',
        content: '100g of fresh low-fat paneer provides roughly 18-20g of high-quality protein.',
        timestamp: new Date().toISOString(),
      },
    ]

    saveCompanionConversationHistory(testMessages)
    const history = getCompanionConversationHistory()
    expect(history).toHaveLength(3)
    expect(history[1].content).toContain('paneer')
  })

  it('recovers gracefully from corrupt JSON in local storage without crashing', () => {
    localStorage.setItem('yashfit_body_intelligence_records', '{malformed_json: true')
    const safeRecords = getBodyIntelligenceRecords()
    // Should fallback to empty array or default without throwing
    expect(Array.isArray(safeRecords)).toBe(true)
  })
})
