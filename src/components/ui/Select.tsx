import * as React from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options?: SelectOption[]
  leftIcon?: React.ReactNode
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, leftIcon, className = '', id, children, disabled, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={[
              'w-full h-10 rounded-lg border bg-zinc-900 px-3 pr-10 text-sm text-white appearance-none',
              'transition-all duration-150 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-zinc-700 hover:border-zinc-600',
              leftIcon ? 'pl-10' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-zinc-900 text-white"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </span>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
