import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Security: Sensitive Data & Secret Exposure Audit', () => {
  function getAllSourceFiles(dir: string): string[] {
    const files: string[] = []
    const items = fs.readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      if (item.isDirectory()) {
        if (item.name !== 'node_modules' && item.name !== '.next') {
          files.push(...getAllSourceFiles(fullPath))
        }
      } else if (/\.(ts|tsx|js|mjs)$/.test(item.name)) {
        files.push(fullPath)
      }
    }
    return files
  }

  const srcFiles = getAllSourceFiles(path.resolve(process.cwd(), 'src'))

  it('scans all src files to ensure private AI secrets are never prefixed with NEXT_PUBLIC_', () => {
    const forbiddenPrefixes = [
      'NEXT_PUBLIC_GEMINI_API_KEY',
      'NEXT_PUBLIC_OPENAI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_JWT_SECRET',
      'NEXT_PUBLIC_DATABASE_URL',
    ]

    const violations: { file: string; forbidden: string }[] = []

    srcFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8')
      forbiddenPrefixes.forEach((forbidden) => {
        if (content.includes(forbidden)) {
          violations.push({ file: path.relative(process.cwd(), file), forbidden })
        }
      })
    })

    expect(violations).toEqual([])
  })

  it('ensures AI API keys are strictly accessed within server route handlers or lib/ai', () => {
    const geminiAccessFiles: string[] = []

    srcFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes('process.env.GEMINI_API_KEY')) {
        const relative = path.relative(process.cwd(), file).replace(/\\/g, '/')
        geminiAccessFiles.push(relative)
      }
    })

    // Must strictly be inside src/app/api/... or src/lib/ai/...
    geminiAccessFiles.forEach((filePath) => {
      const isServerOnly =
        filePath.startsWith('src/app/api/') ||
        filePath.startsWith('src/lib/ai/')
      expect(isServerOnly).toBe(true)
    })
  })

  it('verifies hardcoded API key patterns do not exist in source code', () => {
    // Patterns matching typical live API keys
    const rawKeyPatterns = [
      /AIzaSy[A-Za-z0-9_-]{33}/, // Google Gemini key format
      /sk-[A-Za-z0-9]{32,}/, // OpenAI live key format
    ]

    const leaks: { file: string; pattern: string }[] = []

    srcFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8')
      rawKeyPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          leaks.push({ file: path.relative(process.cwd(), file), pattern: pattern.toString() })
        }
      })
    })

    expect(leaks).toEqual([])
  })
})

