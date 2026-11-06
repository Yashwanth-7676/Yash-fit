import * as React from 'react'
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export interface InlineErrorBannerProps {
  title?: string
  message: string
  variant?: 'error' | 'warning' | 'info' | 'success'
  onDismiss?: () => void
  action?: React.ReactNode
  className?: string
}

const variantStyles = {
  error: {
    container: 'bg-red-950/40 border-red-800/60 text-red-300',
    icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
  },
  warning: {
    container: 'bg-amber-950/40 border-amber-800/60 text-amber-300',
    icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  },
  info: {
    container: 'bg-blue-950/40 border-blue-800/60 text-blue-300',
    icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  },
  success: {
    container: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  },
}

export const InlineErrorBanner: React.FC<InlineErrorBannerProps> = ({
  title,
  message,
  variant = 'error',
  onDismiss,
  action,
  className = '',
}) => {
  const { container, icon } = variantStyles[variant]

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 ${container} ${className}`}
    >
      <div className="mt-0.5" aria-hidden="true">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold text-white mb-0.5">{title}</h4>}
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
        {action && <div className="mt-2.5">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  children,
  className = '',
}) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    {label && (
      <label className="text-sm font-medium text-zinc-300 flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-lime-400 font-bold">*</span>}
      </label>
    )}
    {children}
    {error && (
      <p className="text-xs text-red-400" role="alert">
        {error}
      </p>
    )}
    {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
  </div>
)
