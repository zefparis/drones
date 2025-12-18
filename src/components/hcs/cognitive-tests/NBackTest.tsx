/**
 * N-Back Test - Working Memory (3 min)
 * Tests working memory by requiring comparison with N items back
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { testResultsStore } from '../../../lib/hcs/storage/test-results-store';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'];
const STIMULUS_DURATION = 500;
const ISI = 2000; // Inter-stimulus interval

interface Trial {
  letter: string;
  isTarget: boolean;
  responded: boolean;
  correct: boolean;
  responseTime: number | null;
}

export interface NBackResult {
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;
  avgResponseTime: number;
  dPrime: number;
  score: number;
  trials: Trial[];
}

interface NBackTestProps {
  onComplete: (result: NBackResult) => void;
  nBack?: number;
  totalTrials?: number;
}

export function NBackTest({ onComplete, nBack = 2, totalTrials = 30 }: NBackTestProps) {
  const [phase, setPhase] = useState<'intro' | 'running' | 'isi' | 'complete'>('intro');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [responded, setResponded] = useState(false);
  const startTimeRef = useRef<number>(0);
  const responseTimeRef = useRef<number | null>(null);

  const generateSequence = useCallback(() => {
    const seq: string[] = [];
    const targetProbability = 0.3;

    for (let i = 0; i < totalTrials; i++) {
      if (i >= nBack && Math.random() < targetProbability) {
        seq.push(seq[i - nBack]);
      } else {
        let letter;
        do {
          letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        } while (i >= nBack && letter === seq[i - nBack]);
        seq.push(letter);
      }
    }
    return seq;
  }, [nBack, totalTrials]);

  const startTest = useCallback(() => {
    const seq = generateSequence();
    setSequence(seq);
    setCurrentIndex(0);
    setTrials([]);
    setPhase('running');
  }, [generateSequence]);

  const handleMatch = useCallback(() => {
    if (responded || phase !== 'running') return;
    
    responseTimeRef.current = performance.now() - startTimeRef.current;
    setResponded(true);
  }, [responded, phase]);

  useEffect(() => {
    if (phase !== 'running' || currentIndex >= sequence.length) return;

    setCurrentLetter(sequence[currentIndex]);
    setResponded(false);
    responseTimeRef.current = null;
    startTimeRef.current = performance.now();

    const stimulusTimer = setTimeout(() => {
      const isTarget = currentIndex >= nBack && sequence[currentIndex] === sequence[currentIndex - nBack];
      const wasCorrect = responded ? isTarget : !isTarget;

      const trial: Trial = {
        letter: sequence[currentIndex],
        isTarget,
        responded,
        correct: wasCorrect,
        responseTime: responseTimeRef.current
      };

      setTrials(prev => [...prev, trial]);
      setCurrentLetter(null);
      setPhase('isi');
    }, STIMULUS_DURATION);

    return () => clearTimeout(stimulusTimer);
  }, [phase, currentIndex, sequence, nBack, responded]);

  useEffect(() => {
    if (phase !== 'isi') return;

    const isiTimer = setTimeout(() => {
      if (currentIndex + 1 >= sequence.length) {
        setPhase('complete');
      } else {
        setCurrentIndex(prev => prev + 1);
        setPhase('running');
      }
    }, ISI);

    return () => clearTimeout(isiTimer);
  }, [phase, currentIndex, sequence.length]);

  useEffect(() => {
    if (phase !== 'complete' || trials.length !== totalTrials) return;

    const hits = trials.filter(t => t.isTarget && t.responded).length;
    const misses = trials.filter(t => t.isTarget && !t.responded).length;
    const falseAlarms = trials.filter(t => !t.isTarget && t.responded).length;
    const correctRejections = trials.filter(t => !t.isTarget && !t.responded).length;

    const accuracy = (hits + correctRejections) / trials.length;
    const responseTimes = trials.filter(t => t.responseTime !== null).map(t => t.responseTime!);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const hitRate = Math.min(0.99, Math.max(0.01, hits / Math.max(1, hits + misses)));
    const faRate = Math.min(0.99, Math.max(0.01, falseAlarms / Math.max(1, falseAlarms + correctRejections)));
    const zHit = Math.sqrt(2) * inverseErf(2 * hitRate - 1);
    const zFa = Math.sqrt(2) * inverseErf(2 * faRate - 1);
    const dPrime = zHit - zFa;

    const score = Math.min(100, Math.round(accuracy * 80 + Math.max(0, dPrime * 10)));

    const result: NBackResult = {
      hits,
      misses,
      falseAlarms,
      correctRejections,
      accuracy: Math.round(accuracy * 100),
      avgResponseTime: Math.round(avgResponseTime),
      dPrime: Math.round(dPrime * 100) / 100,
      score,
      trials
    };

    testResultsStore.saveTestResult({
      testType: 'memory',
      timestamp: Date.now(),
      score,
      metadata: result as unknown as Record<string, unknown>
    });

    onComplete(result);
  }, [phase, trials, totalTrials, onComplete]);

  if (phase === 'intro') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-2xl font-bold text-white mb-4">Test N-Back ({nBack}-Back)</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Des lettres vont apparaître une par une. Appuyez sur <strong className="text-cyan-400">ESPACE</strong> ou 
          cliquez sur <strong className="text-cyan-400">MATCH</strong> quand la lettre actuelle est 
          identique à celle vue <strong className="text-yellow-400">{nBack} lettres avant</strong>.
        </p>
        <div className="bg-slate-800 rounded-lg p-4 mb-6 max-w-sm mx-auto">
          <p className="text-sm text-slate-400 mb-2">Exemple ({nBack}-Back):</p>
          <p className="font-mono text-lg text-white">A → B → <span className="text-cyan-400">A</span> ← Match!</p>
        </div>
        <p className="text-sm text-slate-500 mb-6">Durée: ~3 minutes • {totalTrials} essais</p>
        <button
          onClick={startTest}
          className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold text-lg hover:bg-cyan-400 transition-colors"
        >
          Commencer
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-slate-900 rounded-xl p-8"
      tabIndex={0}
      onKeyDown={(e) => e.key === ' ' && handleMatch()}
    >
      <div className="text-center mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Essai {currentIndex + 1}/{totalTrials}</span>
          <span className="text-sm text-slate-400">{nBack}-Back</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-cyan-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / totalTrials) * 100}%` }}
          />
        </div>
      </div>

      <div className="h-48 flex items-center justify-center mb-8">
        {currentLetter ? (
          <p className={`text-9xl font-bold transition-all ${responded ? 'text-cyan-400' : 'text-white'}`}>
            {currentLetter}
          </p>
        ) : (
          <p className="text-2xl text-slate-600">+</p>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleMatch}
          disabled={responded || !currentLetter}
          className={`px-12 py-4 rounded-lg font-bold text-lg transition-all ${
            responded 
              ? 'bg-cyan-500 text-white' 
              : 'bg-slate-700 text-white hover:bg-slate-600'
          } disabled:opacity-50`}
        >
          {responded ? '✓ MATCH' : 'MATCH (Espace)'}
        </button>
      </div>
    </div>
  );
}

function inverseErf(x: number): number {
  const a = 0.147;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  
  const ln = Math.log(1 - x * x);
  const t1 = 2 / (Math.PI * a) + ln / 2;
  const t2 = ln / a;
  
  return sign * Math.sqrt(Math.sqrt(t1 * t1 - t2) - t1);
}
