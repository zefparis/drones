/**
 * HCS-SHIELD Reaction Test Component
 * Measures reaction time for cognitive authentication
 */

import { useState, useCallback, useRef } from 'react'
import { cn } from '../../lib/utils'

interface ReactionTestProps {
  onComplete: (result: {
    reactionTime: number
    touches: Array<{ x: number; y: number; pressure: number; timestamp: number; deltaTime: number }>
  }) => void
  disabled?: boolean
}

export function ReactionTest({ onComplete, disabled }: ReactionTestProps) {
  const [phase, setPhase] = useState<'ready' | 'waiting' | 'go' | 'done'>('ready')
  const [startTime, setStartTime] = useState(0)
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startTest = useCallback(() => {
    if (disabled) return
    
    setPhase('waiting')
    setReactionTime(null)

    // Random delay between 1-3 seconds
    const delay = 1000 + Math.random() * 2000

    timeoutRef.current = setTimeout(() => {
      setPhase('go')
      setStartTime(performance.now())
    }, delay)
  }, [disabled])

  const handleTap = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (phase === 'waiting') {
        // Too early!
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setPhase('ready')
        return
      }

      if (phase !== 'go') return

      const now = performance.now()
      const rt = now - startTime
      setReactionTime(rt)
      setPhase('done')

      // Get touch/mouse position and pressure
      let x = 0, y = 0, pressure = 0.5
      if ('touches' in event && event.touches[0]) {
        x = event.touches[0].clientX
        y = event.touches[0].clientY
        pressure = (event.touches[0] as unknown as { force?: number }).force ?? 0.5
      } else if ('clientX' in event) {
        x = event.clientX
        y = event.clientY
      }

      onComplete({
        reactionTime: rt,
        touches: [{
          x,
          y,
          pressure,
          timestamp: now,
          deltaTime: rt,
        }],
      })
    },
    [phase, startTime, onComplete]
  )

  const reset = useCallback(() => {
    setPhase('ready')
    setReactionTime(null)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          'flex h-40 w-40 cursor-pointer items-center justify-center rounded-full text-white text-xl font-bold transition-all select-none',
          phase === 'ready' && 'bg-slate-600 hover:bg-slate-500',
          phase === 'waiting' && 'bg-amber-500 animate-pulse cursor-wait',
          phase === 'go' && 'bg-emerald-500 scale-110',
          phase === 'done' && 'bg-cyan-500',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onClick={phase === 'ready' ? startTest : handleTap}
        onTouchStart={phase === 'ready' ? startTest : handleTap}
      >
        {phase === 'ready' && 'DÉMARRER'}
        {phase === 'waiting' && 'ATTENDRE...'}
        {phase === 'go' && 'TAP!'}
        {phase === 'done' && `${reactionTime?.toFixed(0)}ms`}
      </div>

      <div className="text-center text-sm text-slate-400">
        {phase === 'ready' && 'Tapez pour commencer le test'}
        {phase === 'waiting' && 'Attendez que le cercle devienne vert'}
        {phase === 'go' && 'Tapez maintenant!'}
        {phase === 'done' && (
          <button
            onClick={reset}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Recommencer
          </button>
        )}
      </div>
    </div>
  )
}
