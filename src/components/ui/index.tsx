import * as React from 'react'

// ─── Color Tokens ─────────────────────────────────────────────────────────────
// bg-zinc-950   (#09090b)  → page background
// bg-zinc-900   (#18181b)  → card / surface
// bg-zinc-800   (#27272a)  → elevated card
// border-zinc-800          → default border
// text-white               → primary text
// text-zinc-400            → secondary text
// text-zinc-500            → muted text
// text-lime-400  (#a3e635) → accent (primary)
// bg-lime-400              → accent fill

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 active:bg-lime-500 disabled:bg-zinc-700 disabled:text-zinc-500',
  secondary:
    'bg-zinc-800 text-white font-medium hover:bg-zinc-700 active:bg-zinc-600 disabled:bg-zinc-900 disabled:text-zinc-600',
  ghost:
    'bg-transparent text-zinc-300 font-medium hover:bg-zinc-800 hover:text-white active:bg-zinc-700 disabled:text-zinc-600',
  outline:
    'bg-transparent border border-zinc-700 text-zinc-300 font-medium hover:border-zinc-500 hover:text-white active:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800',
  destructive:
    'bg-red-600 text-white font-semibold hover:bg-red-500 active:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer select-none',
          'focus-visible:outline-2 focus-visible:outline-lime-400 focus-visible:outline-offset-2',
          'disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  noPadding?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ elevated = false, noPadding = false, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'rounded-xl border',
        elevated
          ? 'bg-zinc-800 border-zinc-700'
          : 'bg-zinc-900 border-zinc-800',
        noPadding ? '' : 'p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full h-10 rounded-lg border bg-zinc-900 px-3 text-sm text-white placeholder-zinc-600',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-zinc-700 hover:border-zinc-600',
              leftIcon ? 'pl-10' : '',
              rightElement ? 'pr-10' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {rightElement}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  success: 'bg-emerald-950 text-emerald-400 border border-emerald-900',
  warning: 'bg-amber-950 text-amber-400 border border-amber-900',
  danger: 'bg-red-950 text-red-400 border border-red-900',
  info: 'bg-blue-950 text-blue-400 border border-blue-900',
  accent: 'bg-lime-950 text-lime-400 border border-lime-900',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => (
  <span
    className={[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
      badgeVariants[variant],
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </span>
)

// ─── Section Heading ──────────────────────────────────────────────────────────

interface SectionHeadingProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => (
  <div className={`flex items-start justify-between gap-4 ${className}`}>
    <div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  trend?: { value: string; positive?: boolean }
  demo?: boolean
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon,
  trend,
  demo = false,
  className = '',
}) => (
  <Card className={`relative ${className}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{value}</span>
          {unit && <span className="text-sm text-zinc-500">{unit}</span>}
        </div>
        {trend && (
          <p
            className={`text-xs mt-1 font-medium ${
              trend.positive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {trend.value}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-2 rounded-lg bg-zinc-800 text-lime-400" aria-hidden="true">
          {icon}
        </div>
      )}
    </div>
    {demo && (
      <span className="absolute top-3 right-3 text-[10px] text-zinc-600 font-medium uppercase tracking-wide">
        demo
      </span>
    )}
  </Card>
)

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
  >
    {icon && (
      <div className="mb-4 text-zinc-600" aria-hidden="true">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-zinc-300">{title}</h3>
    {description && <p className="text-sm text-zinc-500 mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

// ─── Loading Spinner ──────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const spinnerSizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
}) => (
  <div role="status" className="inline-flex items-center gap-2">
    <svg
      className={`animate-spin text-lime-400 ${spinnerSizes[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <span className="sr-only">{label}</span>
  </div>
)

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr className={`border-zinc-800 ${className}`} />
)

// ─── Modal & Toast ────────────────────────────────────────────────────────────

export { Modal } from './Modal'
export { ToastProvider, useToast } from './Toast'
export type { ToastType, ToastMessage } from './Toast'


