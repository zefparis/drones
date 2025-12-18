/**
 * Digit Span Test - Memory Span (7 sequences max)
 * Tests short-term and working memory capacity
 */

import { useState, useEffect, useCallback } from 'react';
import { testResultsStore } from '../../../lib/hcs/storage/test-results-store';

const SHOW_DIGIT_DURATION = 800;
const PAUSE_BETWEEN_DIGITS = 200;

export interface DigitSpanResult {
  forwardSpan: number;
  backwardSpan: number;
  totalScore: number;
  score: number;
}

interface DigitSpanTestProps {
  onComplete: (result: DigitSpanResult) => void;
}

export function DigitSpanTest({ onComplete }: DigitSpanTestProps) {
  const [phase, setPhase] = useState<'intro' | 'forward-show' | 'forward-input' | 'forward-done' | 'backward-show' | 'backward-input' | 'complete'>('intro');
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [displayDigit, setDisplayDigit] = useState<number | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [currentSpan, setCurrentSpan] = useState(3);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [forwardSpan, setForwardSpan] = useState(0);
  const [backwardSpan, setBackwardSpan] = useState(0);
  const [showingIndex, setShowingIndex] = useState(0);

  const generateSequence = useCallback((length: number): number[] => {
    const sequence: number[] = [];
    for (let i = 0; i < length; i++) {
      let digit;
      do {
        digit = Math.floor(Math.random() * 9) + 1;
      } while (sequence.length > 0 && digit === sequence[sequence.length - 1]);
      sequence.push(digit);
    }
    return sequence;
  }, []);

  const startForward = useCallback(() => {
    setCurrentSpan(3);
    setConsecutiveErrors(0);
    setForwardSpan(0);
    const seq = generateSequence(3);
    setCurrentSequence(seq);
    setShowingIndex(0);
    setPhase('forward-show');
  }, [generateSequence]);

  const startBackward = useCallback(() => {
    setCurrentSpan(2);
    setConsecutiveErrors(0);
    setBackwardSpan(0);
    const seq = generateSequence(2);
    setCurrentSequence(seq);
    setShowingIndex(0);
    setPhase('backward-show');
  }, [generateSequence]);

  useEffect(() => {
    if (phase !== 'forward-show' && phase !== 'backward-show') return;

    if (showingIndex < currentSequence.length) {
      setDisplayDigit(currentSequence[showingIndex]);
      
      const timer = setTimeout(() => {
        setDisplayDigit(null);
        setTimeout(() => {
          setShowingIndex(prev => prev + 1);
        }, PAUSE_BETWEEN_DIGITS);
      }, SHOW_DIGIT_DURATION);

      return () => clearTimeout(timer);
    } else {
      setUserInput('');
      setPhase(phase === 'forward-show' ? 'forward-input' : 'backward-input');
    }
  }, [phase, showingIndex, currentSequence]);

  const handleSubmit = useCallback(() => {
    const userDigits = userInput.split('').map(Number);
    const isForward = phase === 'forward-input';
    const expectedSequence = isForward ? currentSequence : [...currentSequence].reverse();
    
    const isCorrect = userDigits.length === expectedSequence.length &&
      userDigits.every((d, i) => d === expectedSequence[i]);

    if (isCorrect) {
      setConsecutiveErrors(0);
      if (isForward) {
        setForwardSpan(currentSpan);
      } else {
        setBackwardSpan(currentSpan);
      }
      
      const nextSpan = currentSpan + 1;
      if (nextSpan <= 9) {
        setCurrentSpan(nextSpan);
        const newSeq = generateSequence(nextSpan);
        setCurrentSequence(newSeq);
        setShowingIndex(0);
        setPhase(isForward ? 'forward-show' : 'backward-show');
      } else {
        if (isForward) {
          setForwardSpan(9);
          setPhase('forward-done');
        } else {
          setBackwardSpan(9);
          setPhase('complete');
        }
      }
    } else {
      const newErrors = consecutiveErrors + 1;
      setConsecutiveErrors(newErrors);

      if (newErrors >= 2) {
        if (isForward) {
          setPhase('forward-done');
        } else {
          setPhase('complete');
        }
      } else {
        const newSeq = generateSequence(currentSpan);
        setCurrentSequence(newSeq);
        setShowingIndex(0);
        setPhase(isForward ? 'forward-show' : 'backward-show');
      }
    }
  }, [phase, userInput, currentSequence, currentSpan, consecutiveErrors, generateSequence]);

  useEffect(() => {
    if (phase !== 'complete') return;

    const totalScore = forwardSpan + backwardSpan;
    const score = Math.min(100, Math.round((totalScore / 16) * 100));

    const result: DigitSpanResult = {
      forwardSpan,
      backwardSpan,
      totalScore,
      score
    };

    testResultsStore.saveTestResult({
      testType: 'memory',
      timestamp: Date.now(),
      score,
      metadata: result as unknown as Record<string, unknown>
    });

    onComplete(result);
  }, [phase, forwardSpan, backwardSpan, onComplete]);

  const handleDigitClick = (digit: number) => {
    if (userInput.length < currentSpan) {
      setUserInput(prev => prev + digit);
    }
  };

  if (phase === 'intro') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🔢</div>
        <h2 className="text-2xl font-bold text-white mb-4">Test d'Empan de Chiffres</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Des chiffres vont apparaître un par un. Mémorisez-les puis reproduisez-les.
          <br /><br />
          <strong className="text-cyan-400">Partie 1:</strong> Reproduisez dans l'ordre<br />
          <strong className="text-yellow-400">Partie 2:</strong> Reproduisez à l'envers
        </p>
        <p className="text-sm text-slate-500 mb-6">Durée: ~3 minutes</p>
        <button
          onClick={startForward}
          className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold text-lg hover:bg-cyan-400 transition-colors"
        >
          Commencer
        </button>
      </div>
    );
  }

  if (phase === 'forward-done') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-4">Partie 1 Terminée!</h3>
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <p className="text-3xl font-bold text-cyan-400">{forwardSpan} chiffres</p>
          <p className="text-sm text-slate-400">Empan avant</p>
        </div>
        <p className="text-slate-400 mb-6">
          Maintenant, reproduisez les séquences <strong className="text-yellow-400">à l'envers</strong>
        </p>
        <button
          onClick={startBackward}
          className="px-8 py-4 bg-yellow-500 text-white rounded-lg font-semibold text-lg hover:bg-yellow-400 transition-colors"
        >
          Continuer
        </button>
      </div>
    );
  }

  const isShowing = phase === 'forward-show' || phase === 'backward-show';
  const isInputting = phase === 'forward-input' || phase === 'backward-input';
  const isBackward = phase === 'backward-show' || phase === 'backward-input';

  return (
    <div className="bg-slate-900 rounded-xl p-8">
      <div className="text-center mb-4">
        <span className={`text-sm font-medium ${isBackward ? 'text-yellow-400' : 'text-cyan-400'}`}>
          {isBackward ? 'Empan Arrière' : 'Empan Avant'} • {currentSpan} chiffres
        </span>
        {isBackward && (
          <p className="text-xs text-slate-500 mt-1">Reproduisez à l'envers</p>
        )}
      </div>

      <div className="h-32 flex items-center justify-center mb-8">
        {isShowing ? (
          displayDigit !== null ? (
            <p className="text-8xl font-bold text-white">{displayDigit}</p>
          ) : (
            <p className="text-4xl text-slate-600">•</p>
          )
        ) : (
          <div className="text-center">
            <p className="text-4xl font-mono font-bold text-white tracking-widest mb-2">
              {userInput || '_ '.repeat(currentSpan).trim()}
            </p>
            <p className="text-sm text-slate-500">
              {isBackward ? 'Entrez à l\'envers' : 'Entrez la séquence'}
            </p>
          </div>
        )}
      </div>

      {isInputting && (
        <>
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
              <button
                key={digit}
                onClick={() => handleDigitClick(digit)}
                disabled={userInput.length >= currentSpan}
                className="h-14 bg-slate-700 text-white text-2xl font-bold rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                {digit}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setUserInput(prev => prev.slice(0, -1))}
              disabled={userInput.length === 0}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
            >
              ← Effacer
            </button>
            <button
              onClick={handleSubmit}
              disabled={userInput.length !== currentSpan}
              className="px-8 py-2 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-400 disabled:opacity-50"
            >
              Valider
            </button>
          </div>
        </>
      )}
    </div>
  );
}
