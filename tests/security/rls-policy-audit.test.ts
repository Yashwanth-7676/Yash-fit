import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Security: Supabase Row Level Security (RLS) Policy Audit', () => {
  const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql')
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8')

  it('verifies that schema.sql exists and is non-empty', () => {
    expect(fs.existsSync(schemaPath)).toBe(true)
    expect(schemaContent.length).toBeGreaterThan(1000)
  })

  it('asserts 100% of defined tables have ENABLE ROW LEVEL SECURITY enforced', () => {
    // Extract all table names from CREATE TABLE [IF NOT EXISTS] [public.]table_name
    const createTableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?([a-zA-Z0-9_]+)/gi
    const tableNames: string[] = []
    let match: RegExpExecArray | null

    while ((match = createTableRegex.exec(schemaContent)) !== null) {
      tableNames.push(match[1])
    }

    expect(tableNames.length).toBeGreaterThan(30)

    // Check each table has ALTER TABLE [public.]<table> ENABLE ROW LEVEL SECURITY
    const unshieldedTables: string[] = []

    tableNames.forEach((table) => {
      const rlsRegex = new RegExp(
        `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        'i'
      )
      if (!rlsRegex.test(schemaContent)) {
        unshieldedTables.push(table)
      }
    })

    expect(unshieldedTables).toEqual([])
  })

  it('verifies that tenant isolation policies bind to auth.uid() = user_id', () => {
    // Personal user data tables must have policies referencing auth.uid()
    const sensitiveTables = [
      'profiles',
      'workout_logs',
      'recovery_logs',
      'coach_conversations',
      'transformation_photos',
      'trainer_client_notes',
      'user_privacy_preferences',
      'body_intelligence_records',
      'companion_conversations',
    ]

    sensitiveTables.forEach((table) => {
      // Look for policies created on this table: ON [public.]<table> ... auth.uid()
      const policyRegex = new RegExp(
        `CREATE\\s+POLICY[\\s\\S]*?ON\\s+(?:public\\.)?${table}[\\s\\S]*?auth\\.uid\\(\\)`,
        'i'
      )
      expect(policyRegex.test(schemaContent)).toBe(true)
    })
  })
})
