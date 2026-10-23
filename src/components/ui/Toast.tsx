'use client'

import * as React from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastMessage {
  id: string
  title: string
  message?: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = React.useCallback(
    ({ title, message, type = 'info' }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      setToasts((prev) => [...prev, { id, title, message, type }])
      setTimeout(() => {
        removeToast(id)
      }, 4000)
    },
    [removeToast]
  )

  const success = React.useCallback(
    (title: string, message?: string) => showToast({ title, message, type: 'success' }),
    [showToast]
  )
  const error = React.useCallback(
    (title: string, message?: string) => showToast({ title, message, type: 'error' }),
    [showToast]
  )
  const warning = React.useCallback(
    (title: string, message?: string) => showToast({ title, message, type: 'warning' }),
    [showToast]
  )
  const info = React.useCallback(
    (title: string, message?: string) => showToast({ title, message, type: 'info' }),
    [showToast]
  )

  const value = React.useMemo(
    () => ({ showToast, success, error, warning, info }),
    [showToast, success, error, warning, info]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              className={[
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-200 backdrop-blur-md',
                toast.type === 'success' && 'bg-zinc-900/95 border-lime-400/40 text-white',
                toast.type === 'error' && 'bg-zinc-900/95 border-red-500/40 text-white',
                toast.type === 'warning' && 'bg-zinc-900/95 border-amber-500/40 text-white',
                toast.type === 'info' && 'bg-zinc-900/95 border-zinc-700 text-white',
              ]
                .filter(Boolean)
                .join(' ')}
              role="alert"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 size={18} className="text-lime-400" />}
                {toast.type === 'error' && <AlertCircle size={18} className="text-red-400" />}
                {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-400" />}
                {toast.type === 'info' && <Info size={18} className="text-blue-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors"
                aria-label="Dismiss toast"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    }
  }
  return context
}

