/**
 * HCS-SHIELD Stroop Test Component
 * Cognitive interference test - humans slow down on incongruent stimuli
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { STROOP_COLORS } from '../../lib/shield'
import { cn } from '../../lib/utils'

interface StroopTestProps {
  onComplete: (result: {
    reactionTime: number
    isCorrect: boolean
    isCongruent: boolean
    stroopEffect: number
    touches: Array<{ x: number; y: number; pressure: number; timestamp: number; deltaTime: number }>
  }) => void
  disabled?: boolean
}

export function StroopTest({ onComplete, disabled }: StroopTestProps) {
  const [phase, setPhase] = useState<'ready' | 'showing' | 'done'>('ready')
  const [startTime, setStartTime] = useState(0)
  const [word, setWord] = useState<typeof STROOP_COLORS[number] | null>(null)
  const [displayColor, setDisplayColor] = useState('')
  const [isCongruent, setIsCongruent] = useState(true)
  const [result, setResult] = useState<{ time: number; correct: boolean } | null>(null)
  
  // Track congruent vs incongruent times for Stroop effect calculation
  const congruentTimesRef = useRef<number[]>([])
  const incongruentTimesRef = useRef<number[]>([])

  const startTest = useCallback(() => {
    if (disabled) return

    // Randomly choose congruent (50%) or incongruent (50%)
    const congruent = Math.random() > 0.5
    const wordItem = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    
    let color = wordItem.color
    if (!congruent) {
      // Pick a different color
      const otherColors = STROOP_COLORS.filter(c => c.actual !== wordItem.actual)
      color = otherColors[Math.floor(Math.random() * otherColors.length)].color
    }

    setWord(wordItem)
    setDisplayColor(color)
    setIsCongruent(congruent)
    setPhase('showing')
    setStartTime(performance.now())
    setResult(null)
  }, [disabled])

  const handleColorSelect = useCallback(
    (selectedColor: string, event: React.MouseEvent | React.TouchEvent) => {
      if (phase !== 'showing' || !word) return

      const now = performance.now()
      const rt = now - startTime
      const correct = selectedColor === displayColor

      // Track times for Stroop effect
      if (isCongruent) {
        congruentTimesRef.current.push(rt)
      } else {
        incongruentTimesRef.current.push(rt)
      }

      // Calculate Stroop effect (incongruent - congruent average)
      let stroopEffect = 0
      if (congruentTimesRef.current.length > 0 && incongruentTimesRef.current.length > 0) {
        const avgCongruent = congruentTimesRef.current.reduce((a, b) => a + b, 0) / congruentTimesRef.current.length
        const avgIncongruent = incongruentTimesRef.current.reduce((a, b) => a + b, 0) / incongruentTimesRef.current.length
        stroopEffect = avgIncongruent - avgCongruent
      } else if (!isCongruent) {
        // First incongruent test - estimate effect from this single test
        stroopEffect = rt > 400 ? rt - 350 : 0
      }

      setResult({ time: rt, correct })
      setPhase('done')

      // Get touch position
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
        isCorrect: correct,
        isCongruent,
        stroopEffect: Math.max(0, stroopEffect),
        touches: [{
          x,
          y,
          pressure,
          timestamp: now,
          deltaTime: rt,
        }],
      })
    },
    [phase, word, startTime, displayColor, isCongruent, onComplete]
  )

  const reset = useCallback(() => {
    setPhase('ready')
    setWord(null)
    setResult(null)
  }, [])

  // Auto-start after done
  useEffect(() => {
    if (phase === 'done') {
      const timer = setTimeout(reset, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase, reset])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Instructions */}
      <div className="text-center text-sm text-slate-400">
        {phase === 'ready' && 'Tapez sur la COULEUR du texte (pas le mot)'}
        {phase === 'showing' && 'Quelle est la COULEUR?'}
        {phase === 'done' && (result?.correct ? '✓ Correct!' : '✗ Erreur')}
      </div>

      {/* Word display */}
      <div className="flex h-24 w-full items-center justify-center rounded-lg bg-slate-800">
        {phase === 'ready' && (
          <button
            onClick={startTest}
            disabled={disabled}
            className={cn(
              'rounded-lg bg-cyan-600 px-8 py-3 text-lg font-bold text-white hover:bg-cyan-500',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            COMMENCER
          </button>
        )}
        {phase === 'showing' && word && (
          <span
            className="text-4xl font-black"
            style={{ color: displayColor }}
          >
            {word.word}
          </span>
        )}
        {phase === 'done' && result && (
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold',
              result.correct ? 'text-emerald-400' : 'text-rose-400',
            )}>
              {result.time.toFixed(0)}ms
            </div>
            <div className="text-xs text-slate-500">
              {isCongruent ? 'Congruent' : 'Incongruent'}
            </div>
          </div>
        )}
      </div>

      {/* Color buttons */}
      {phase === 'showing' && (
        <div className="grid grid-cols-2 gap-3">
          {STROOP_COLORS.map((color) => (
            <button
              key={color.actual}
              onClick={(e) => handleColorSelect(color.color, e)}
              onTouchStart={(e) => handleColorSelect(color.color, e)}
              className="h-16 w-24 rounded-lg transition-transform active:scale-95"
              style={{ backgroundColor: color.color }}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span>Congruents: {congruentTimesRef.current.length}</span>
        <span>Incongruents: {incongruentTimesRef.current.length}</span>
      </div>
    </div>
  )
}
