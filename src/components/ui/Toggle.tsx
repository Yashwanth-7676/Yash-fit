import * as React from 'react'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
  className?: string
  id?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  id,
}) => {
  const toggleId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={toggleId}
              className={`text-sm font-medium ${
                disabled ? 'text-zinc-500 cursor-not-allowed' : 'text-zinc-200 cursor-pointer'
              }`}
            >
              {label}
            </label>
          )}
          {description && <span className="text-xs text-zinc-500">{description}</span>}
        </div>
      )}
      <button
        type="button"
        id={toggleId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          checked ? 'bg-lime-400' : 'bg-zinc-800',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow-md ring-0',
            'transition duration-200 ease-in-out',
            checked ? 'translate-x-5 bg-zinc-950' : 'translate-x-0 bg-zinc-400',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
