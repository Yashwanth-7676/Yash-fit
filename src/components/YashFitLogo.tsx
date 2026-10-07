import Link from 'next/link'

interface YashFitLogoProps {
  compact?: boolean
  className?: string
}

export function YashFitLogo({ compact = false, className = '' }: YashFitLogoProps) {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold text-lg text-white ${className}`}
        aria-label="YashFit"
      >
        <span className="w-6 h-6 rounded-md bg-lime-400 flex items-center justify-center" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L6 20M18 4L18 20M6 12H18M3 8H9M15 8H21M3 16H9M15 16H21" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-white font-bold">Y</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-2 font-bold text-xl text-white ${className}`}
      aria-label="YashFit"
    >
      <span className="w-7 h-7 rounded-md bg-lime-400 flex items-center justify-center shrink-0" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 4L6 20M18 4L18 20M6 12H18M3 8H9M15 8H21M3 16H9M15 16H21" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </span>
      <span>
        <span className="text-white">Yash</span>
        <span className="text-lime-400">Fit</span>
      </span>
    </span>
  )
}

interface YashFitNavLogoProps {
  href?: string
}

export function YashFitNavLogo({ href = '/' }: YashFitNavLogoProps) {
  return (
    <Link href={href} aria-label="YashFit — Home">
      <YashFitLogo />
    </Link>
  )
}

