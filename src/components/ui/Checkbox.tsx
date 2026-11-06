import * as React from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  description?: React.ReactNode
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', id, checked, disabled, onChange, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <label
          htmlFor={checkboxId}
          className={`inline-flex items-start gap-3 select-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="sr-only"
              {...props}
            />
            <div
              className={[
                'w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150',
                'focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                checked
                  ? 'bg-lime-400 border-lime-400 text-zinc-950'
                  : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600 text-transparent',
                error ? 'border-red-500' : '',
              ].join(' ')}
              aria-hidden="true"
            >
              <Check size={14} strokeWidth={3} className={checked ? 'opacity-100' : 'opacity-0'} />
            </div>
          </div>
          {(label || description) && (
            <div className="flex flex-col">
              {label && <span className="text-sm font-medium text-zinc-200">{label}</span>}
              {description && <span className="text-xs text-zinc-500 mt-0.5">{description}</span>}
            </div>
          )}
        </label>
        {error && (
          <p className="text-xs text-red-400 pl-8" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
