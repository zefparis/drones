/**
 * Reaction Time Test - Processing Speed (2 min)
 * Measures simple and choice reaction time
 */

import { useState, useCallback, useRef } from 'react';
import { testResultsStore } from '../../../lib/hcs/storage/test-results-store';

const TOTAL_TRIALS = 20;
const MIN_DELAY = 1000;
const MAX_DELAY = 3000;

interface Trial {
  reactionTime: number;
  timestamp: number;
  premature: boolean;
}

export interface ReactionTimeResult {
  meanRT: number;
  medianRT: number;
  minRT: number;
  maxRT: number;
  stdRT: number;
  prematureCount: number;
  validTrials: number;
  score: number;
  trials: Trial[];
}

interface ReactionTimeTestProps {
  onComplete: (result: ReactionTimeResult) => void;
  totalTrials?: number;
}

export function ReactionTimeTest({ onComplete, totalTrials = TOTAL_TRIALS }: ReactionTimeTestProps) {
  const [phase, setPhase] = useState<'intro' | 'waiting' | 'ready' | 'premature' | 'result' | 'complete'>('intro');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [lastRT, setLastRT] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTrial = useCallback(() => {
    setPhase('waiting');
    
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setPhase('ready');
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === 'waiting') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const trial: Trial = {
        reactionTime: 0,
        timestamp: Date.now(),
        premature: true
      };
      setTrials(prev => [...prev, trial]);
      setPhase('premature');
      
      setTimeout(() => {
        if (currentTrial + 1 >= totalTrials) {
          setPhase('complete');
        } else {
          setCurrentTrial(prev => prev + 1);
          startTrial();
        }
      }, 1500);
    } else if (phase === 'ready') {
      const rt = performance.now() - startTimeRef.current;
      setLastRT(rt);
      
      const trial: Trial = {
        reactionTime: rt,
        timestamp: Date.now(),
        premature: false
      };
      setTrials(prev => [...prev, trial]);
      setPhase('result');
      
      setTimeout(() => {
        if (currentTrial + 1 >= totalTrials) {
          setPhase('complete');
        } else {
          setCurrentTrial(prev => prev + 1);
          startTrial();
        }
      }, 800);
    }
  }, [phase, currentTrial, totalTrials, startTrial]);

  const calculateResults = useCallback((): ReactionTimeResult => {
    const validTrials = trials.filter(t => !t.premature);
    const rts = validTrials.map(t => t.reactionTime);
    
    if (rts.length === 0) {
      return {
        meanRT: 0,
        medianRT: 0,
        minRT: 0,
        maxRT: 0,
        stdRT: 0,
        prematureCount: trials.filter(t => t.premature).length,
        validTrials: 0,
        score: 0,
        trials
      };
    }

    const sorted = [...rts].sort((a, b) => a - b);
    const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const variance = rts.reduce((sum, rt) => sum + Math.pow(rt - mean, 2), 0) / rts.length;
    const std = Math.sqrt(variance);

    const speedScore = Math.max(0, 50 - (mean - 200) / 10);
    const consistencyScore = Math.max(0, 30 - std / 10);
    const validityScore = (validTrials.length / trials.length) * 20;
    const score = Math.min(100, Math.round(speedScore + consistencyScore + validityScore));

    return {
      meanRT: Math.round(mean),
      medianRT: Math.round(median),
      minRT: Math.round(min),
      maxRT: Math.round(max),
      stdRT: Math.round(std),
      prematureCount: trials.filter(t => t.premature).length,
      validTrials: validTrials.length,
      score,
      trials
    };
  }, [trials]);

  if (phase === 'complete') {
    const result = calculateResults();
    
    testResultsStore.saveTestResult({
      testType: 'reaction',
      timestamp: Date.now(),
      duration: result.meanRT,
      score: result.score,
      metadata: result as unknown as Record<string, unknown>
    });

    onComplete(result);
    return null;
  }

  if (phase === 'intro') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">⚡</div>
        <h2 className="text-2xl font-bold text-white mb-4">Test de Temps de Réaction</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Attendez que l'écran devienne <strong className="text-green-400">VERT</strong>, 
          puis cliquez le plus vite possible.
          <br /><br />
          ⚠️ Ne cliquez pas avant que l'écran ne soit vert!
        </p>
        <p className="text-sm text-slate-500 mb-6">Durée: ~2 minutes • {totalTrials} essais</p>
        <button
          onClick={startTrial}
          className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold text-lg hover:bg-cyan-400 transition-colors"
        >
          Commencer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <div className="text-center mb-2">
        <span className="text-sm text-slate-400">
          Essai {currentTrial + 1}/{totalTrials}
        </span>
      </div>

      <button
        onClick={handleClick}
        className={`w-full h-64 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
          phase === 'waiting' 
            ? 'bg-red-500' 
            : phase === 'ready'
              ? 'bg-green-500'
              : phase === 'premature'
                ? 'bg-yellow-500'
                : 'bg-cyan-500'
        }`}
      >
        <div className="text-center text-white">
          {phase === 'waiting' && (
            <>
              <p className="text-4xl font-bold mb-2">Attendez...</p>
              <p className="text-lg opacity-75">Ne cliquez pas encore!</p>
            </>
          )}
          {phase === 'ready' && (
            <>
              <p className="text-6xl font-bold mb-2">GO!</p>
              <p className="text-lg">Cliquez maintenant!</p>
            </>
          )}
          {phase === 'premature' && (
            <>
              <p className="text-3xl font-bold mb-2">Trop tôt! ⚠️</p>
              <p className="text-lg">Attendez le signal vert</p>
            </>
          )}
          {phase === 'result' && lastRT && (
            <>
              <p className="text-5xl font-bold mb-2">{lastRT.toFixed(0)} ms</p>
              <p className="text-lg">
                {lastRT < 200 ? '⚡ Excellent!' : 
                 lastRT < 300 ? '✓ Bon' : 
                 lastRT < 400 ? '○ Correct' : '△ À améliorer'}
              </p>
            </>
          )}
        </div>
      </button>

      <div className="flex justify-center gap-2 mt-4">
        {trials.slice(-10).map((trial, idx) => (
          <div
            key={idx}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              trial.premature 
                ? 'bg-yellow-500/30 text-yellow-400' 
                : trial.reactionTime < 250 
                  ? 'bg-green-500/30 text-green-400'
                  : trial.reactionTime < 350
                    ? 'bg-cyan-500/30 text-cyan-400'
                    : 'bg-slate-700 text-slate-400'
            }`}
          >
            {trial.premature ? '!' : Math.round(trial.reactionTime / 10)}
          </div>
        ))}
      </div>
    </div>
  );
}
