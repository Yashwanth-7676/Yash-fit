export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6" aria-busy="true" aria-label="Loading YashFit OS">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 rounded-sm bg-lime-400 animate-spin" style={{ animationDuration: '2s' }} />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-zinc-400 tracking-wider uppercase animate-pulse">
        Loading YashFit...
      </p>
    </div>
  )
}

