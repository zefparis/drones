/**
 * HCS-SHIELD Authentication Modal
 * Cognitive authentication flow for pilot verification
 */

import { useState, useCallback, useRef } from 'react'
import { Shield, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { ReactionTest } from './ReactionTest'
import { StroopTest } from './StroopTest'
import { shieldDetector } from '../../lib/shield'
import type { ShieldResult, QuickTestData } from '../../lib/shield'
import { cn } from '../../lib/utils'

type AuthMode = 'full' | 'quick' // full = reaction + stroop, quick = stroop only

interface ShieldAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: ShieldResult) => void
  onFailure: (result: ShieldResult) => void
  mode?: AuthMode
  title?: string
  description?: string
}

export function ShieldAuthModal({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  mode = 'full',
  title = 'Authentification Pilote',
  description = 'Vérification cognitive HCS-SHIELD requise',
}: ShieldAuthModalProps) {
  const [step, setStep] = useState<'reaction' | 'stroop' | 'analyzing' | 'result'>('reaction')
  const [result, setResult] = useState<ShieldResult | null>(null)
  const sessionIdRef = useRef(crypto.randomUUID())
  const testCountRef = useRef(0)

  const handleReactionComplete = useCallback(async (data: {
    reactionTime: number
    touches: Array<{ x: number; y: number; pressure: number; timestamp: number; deltaTime: number }>
  }) => {
    testCountRef.current++

    const testData: QuickTestData = {
      testType: 'reaction',
      duration: data.reactionTime,
      touches: data.touches,
      results: {
        reactionTime: data.reactionTime,
      },
    }

    await shieldDetector.analyze(testData, sessionIdRef.current)

    // Move to Stroop test
    setStep('stroop')
  }, [])

  const handleStroopComplete = useCallback(async (data: {
    reactionTime: number
    isCorrect: boolean
    isCongruent: boolean
    stroopEffect: number
    touches: Array<{ x: number; y: number; pressure: number; timestamp: number; deltaTime: number }>
  }) => {
    testCountRef.current++

    const testData: QuickTestData = {
      testType: 'stroop',
      duration: data.reactionTime,
      touches: data.touches,
      results: {
        reactionTime: data.reactionTime,
        accuracy: data.isCorrect ? 100 : 0,
        errors: data.isCorrect ? 0 : 1,
        stroopEffect: data.stroopEffect,
      },
    }

    setStep('analyzing')

    // Analyze with accumulated session data
    const analysisResult = await shieldDetector.analyze(testData, sessionIdRef.current)
    setResult(analysisResult)

    // Need more tests?
    if (!analysisResult.isReliable && testCountRef.current < 4) {
      // Continue with another Stroop test
      setTimeout(() => setStep('stroop'), 1000)
      return
    }

    setStep('result')

    // Callback based on result
    setTimeout(() => {
      if (analysisResult.classification === 'HUMAN') {
        onSuccess(analysisResult)
      } else {
        onFailure(analysisResult)
      }
    }, 2000)
  }, [onSuccess, onFailure])

  const handleQuickStroopComplete = useCallback(async (data: {
    reactionTime: number
    isCorrect: boolean
    isCongruent: boolean
    stroopEffect: number
    touches: Array<{ x: number; y: number; pressure: number; timestamp: number; deltaTime: number }>
  }) => {
    testCountRef.current++

    const testData: QuickTestData = {
      testType: 'stroop',
      duration: data.reactionTime,
      touches: data.touches,
      results: {
        reactionTime: data.reactionTime,
        accuracy: data.isCorrect ? 100 : 0,
        errors: data.isCorrect ? 0 : 1,
        stroopEffect: data.stroopEffect,
      },
    }

    const analysisResult = await shieldDetector.analyze(testData, sessionIdRef.current)
    setResult(analysisResult)

    // For quick mode, need at least 2 tests
    if (!analysisResult.isReliable && testCountRef.current < 3) {
      return // StroopTest auto-continues
    }

    setStep('result')

    setTimeout(() => {
      if (analysisResult.classification === 'HUMAN' || analysisResult.humanScore >= 0.7) {
        onSuccess(analysisResult)
      } else {
        onFailure(analysisResult)
      }
    }, 1500)
  }, [onSuccess, onFailure])

  const reset = useCallback(() => {
    setStep(mode === 'quick' ? 'stroop' : 'reaction')
    setResult(null)
    testCountRef.current = 0
    sessionIdRef.current = crypto.randomUUID()
    shieldDetector.clearSession(sessionIdRef.current)
  }, [mode])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-8 w-8 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>

        {/* Progress indicator */}
        {step !== 'result' && (
          <div className="mb-6 flex items-center justify-center gap-2">
            {mode === 'full' && (
              <>
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  step === 'reaction' ? 'bg-cyan-400' : 'bg-slate-600',
                )} />
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  step === 'stroop' ? 'bg-cyan-400' : 'bg-slate-600',
                )} />
              </>
            )}
            <span className="ml-2 text-xs text-slate-500">
              Test {testCountRef.current + 1}
            </span>
          </div>
        )}

        {/* Test content */}
        <div className="min-h-[300px]">
          {step === 'reaction' && mode === 'full' && (
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-semibold text-white">Test de Réaction</h3>
              <ReactionTest onComplete={handleReactionComplete} />
            </div>
          )}

          {step === 'stroop' && (
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-semibold text-white">Test Stroop</h3>
              <StroopTest
                onComplete={mode === 'quick' ? handleQuickStroopComplete : handleStroopComplete}
              />
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              <p className="mt-4 text-slate-400">Analyse cognitive en cours...</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="flex flex-col items-center py-8">
              {result.classification === 'HUMAN' ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                  <h3 className="mt-4 text-xl font-bold text-emerald-400">
                    Pilote Vérifié
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Score humain: {(result.humanScore * 100).toFixed(0)}%
                  </p>
                </>
              ) : result.classification === 'BOT' ? (
                <>
                  <XCircle className="h-16 w-16 text-rose-400" />
                  <h3 className="mt-4 text-xl font-bold text-rose-400">
                    Authentification Échouée
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Comportement suspect détecté
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 text-amber-400" />
                  <h3 className="mt-4 text-xl font-bold text-amber-400">
                    Résultat Incertain
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Tests supplémentaires recommandés
                  </p>
                </>
              )}

              {/* Indicators */}
              <div className="mt-6 w-full space-y-2">
                {result.humanIndicators.map((ind, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {ind}
                  </div>
                ))}
                {result.botIndicators.map((ind, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-rose-400">
                    <XCircle className="h-3 w-3" />
                    {ind}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Annuler
          </button>
          {step === 'result' && (
            <button
              onClick={reset}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
