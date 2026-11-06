import * as React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse rounded-md bg-zinc-800/60 ${className}`}
    aria-hidden="true"
    {...props}
  />
)

export const CardSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => (
  <div
    className={`p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 animate-pulse ${className}`}
    aria-label="Loading content"
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === rows - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  </div>
)

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 animate-pulse ${className}`}
    aria-label="Loading statistic"
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-7 w-28" />
    <Skeleton className="h-3 w-16" />
  </div>
)
