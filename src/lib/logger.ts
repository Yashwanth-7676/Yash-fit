/**
 * YashFit Production Structured Logger
 * Provides structured JSON logging in production, readable output in development,
 * and automatic scrubbing of PII, authorization tokens, and API keys.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[-_]?key/i,
  /authorization/i,
  /cookie/i,
  /bearer\s+[a-zA-Z0-9_\-\.]+/i,
]

function scrubValue(key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    // Check if key name matches sensitive patterns
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
      return '[REDACTED]'
    }
    // Check if value itself looks like an API key or bearer token
    if (/AIza[0-9A-Za-z-_]{35}/.test(value)) {
      return '[REDACTED_GEMINI_KEY]'
    }
    if (/sk-[a-zA-Z0-9]{20,}/.test(value)) {
      return '[REDACTED_OPENAI_KEY]'
    }
    if (/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}/.test(value)) {
      return '[REDACTED_JWT]'
    }
    // Scrub URL query params containing key=
    if (value.includes('key=') || value.includes('token=')) {
      return value.replace(/([?&](?:key|token)=)[^&]+/gi, '$1[REDACTED]')
    }
    return value
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((item, index) => scrubValue(String(index), item))
    }
    const cleanObj: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      cleanObj[k] = scrubValue(k, v)
    }
    return cleanObj
  }

  return value
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production'

  private formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>, err?: unknown): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }

    if (context && Object.keys(context).length > 0) {
      entry.context = scrubValue('context', context) as Record<string, unknown>
    }

    if (err) {
      if (err instanceof Error) {
        entry.error = {
          name: err.name,
          message: err.message,
          stack: this.isProduction ? undefined : err.stack,
        }
      } else {
        entry.error = {
          name: 'UnknownError',
          message: String(err),
        }
      }
    }

    return entry
  }

  public debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'test') return
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }

  public info(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'test') return
    const entry = this.formatEntry('info', message, context)
    if (this.isProduction) {
      console.log(JSON.stringify(entry))
    } else {
      console.log(`[INFO] ${message}`, context || '')
    }
  }

  public warn(message: string, context?: Record<string, unknown>, error?: unknown) {
    const entry = this.formatEntry('warn', message, context, error)
    if (this.isProduction) {
      console.warn(JSON.stringify(entry))
    } else {
      console.warn(`[WARN] ${message}`, context || '', error || '')
    }
  }

  public error(message: string, context?: Record<string, unknown>, error?: unknown) {
    const entry = this.formatEntry('error', message, context, error)
    if (this.isProduction) {
      console.error(JSON.stringify(entry))
    } else {
      console.error(`[ERROR] ${message}`, context || '', error || '')
    }
  }
}

export const logger = new Logger()
export default logger

