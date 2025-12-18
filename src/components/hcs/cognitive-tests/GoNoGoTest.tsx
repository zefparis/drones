/**
 * Go/No-Go Test - Inhibitory Control (2 min)
 * Tests response inhibition and impulse control
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { testResultsStore } from '../../../lib/hcs/storage/test-results-store';

const GO_SYMBOL = '🟢';
const NOGO_SYMBOL = '🔴';
const STIMULUS_DURATION = 300;
const ISI_MIN = 800;
const ISI_MAX = 1500;

interface Trial {
  type: 'go' | 'nogo';
  responded: boolean;
  responseTime: number | null;
  correct: boolean;
}

export interface GoNoGoResult {
  goCorrect: number;
  goMissed: number;
  nogoCorrect: number;
  nogoErrors: number;
  accuracy: number;
  avgGoRT: number;
  inhibitionScore: number;
  score: number;
  trials: Trial[];
}

interface GoNoGoTestProps {
  onComplete: (result: GoNoGoResult) => void;
  totalTrials?: number;
  goProbability?: number;
}

export function GoNoGoTest({ onComplete, totalTrials = 50, goProbability = 0.75 }: GoNoGoTestProps) {
  const [phase, setPhase] = useState<'intro' | 'isi' | 'stimulus' | 'complete'>('intro');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentType, setCurrentType] = useState<'go' | 'nogo'>('go');
  const [responded, setResponded] = useState(false);
  const startTimeRef = useRef<number>(0);
  const responseTimeRef = useRef<number | null>(null);

  const handleResponse = useCallback(() => {
    if (responded || phase !== 'stimulus') return;
    responseTimeRef.current = performance.now() - startTimeRef.current;
    setResponded(true);
  }, [responded, phase]);

  const startTrial = useCallback(() => {
    const isGo = Math.random() < goProbability;
    setCurrentType(isGo ? 'go' : 'nogo');
    setResponded(false);
    responseTimeRef.current = null;
    setPhase('stimulus');
    startTimeRef.current = performance.now();
  }, [goProbability]);

  useEffect(() => {
    if (phase !== 'stimulus') return;

    const timer = setTimeout(() => {
      const correct = currentType === 'go' ? responded : !responded;

      const trial: Trial = {
        type: currentType,
        responded,
        responseTime: responseTimeRef.current,
        correct
      };

      setTrials(prev => [...prev, trial]);

      if (currentTrial + 1 >= totalTrials) {
        setPhase('complete');
      } else {
        setCurrentTrial(prev => prev + 1);
        setPhase('isi');
      }
    }, STIMULUS_DURATION);

    return () => clearTimeout(timer);
  }, [phase, currentType, responded, currentTrial, totalTrials]);

  useEffect(() => {
    if (phase !== 'isi') return;

    const isi = ISI_MIN + Math.random() * (ISI_MAX - ISI_MIN);
    const timer = setTimeout(startTrial, isi);

    return () => clearTimeout(timer);
  }, [phase, startTrial]);

  useEffect(() => {
    if (phase !== 'complete' || trials.length !== totalTrials) return;

    const goTrials = trials.filter(t => t.type === 'go');
    const nogoTrials = trials.filter(t => t.type === 'nogo');

    const goCorrect = goTrials.filter(t => t.correct).length;
    const goMissed = goTrials.length - goCorrect;
    const nogoCorrect = nogoTrials.filter(t => t.correct).length;
    const nogoErrors = nogoTrials.length - nogoCorrect;

    const accuracy = (goCorrect + nogoCorrect) / trials.length;

    const goRTs = goTrials.filter(t => t.responseTime !== null).map(t => t.responseTime!);
    const avgGoRT = goRTs.length > 0 ? goRTs.reduce((a, b) => a + b, 0) / goRTs.length : 0;

    const inhibitionScore = nogoTrials.length > 0 
      ? (nogoCorrect / nogoTrials.length) * 100 
      : 100;

    const score = Math.min(100, Math.round(
      accuracy * 50 + 
      inhibitionScore * 0.3 + 
      Math.max(0, (400 - avgGoRT) / 10)
    ));

    const result: GoNoGoResult = {
      goCorrect,
      goMissed,
      nogoCorrect,
      nogoErrors,
      accuracy: Math.round(accuracy * 100),
      avgGoRT: Math.round(avgGoRT),
      inhibitionScore: Math.round(inhibitionScore),
      score,
      trials
    };

    testResultsStore.saveTestResult({
      testType: 'reaction',
      timestamp: Date.now(),
      score,
      metadata: { ...result, testName: 'gonogo' }
    });

    onComplete(result);
  }, [phase, trials, totalTrials, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        handleResponse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResponse]);

  if (phase === 'intro') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🚦</div>
        <h2 className="text-2xl font-bold text-white mb-4">Test Go/No-Go</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Appuyez sur <strong className="text-cyan-400">ESPACE</strong> quand vous voyez 
          le cercle <span className="text-green-400">VERT</span>, mais 
          <strong className="text-red-400"> NE répondez PAS</strong> au cercle 
          <span className="text-red-400"> ROUGE</span>.
        </p>
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-5xl mb-2">{GO_SYMBOL}</div>
            <p className="text-sm text-green-400">→ Appuyer</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-2">{NOGO_SYMBOL}</div>
            <p className="text-sm text-red-400">→ Ne pas appuyer</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6">Durée: ~2 minutes • {totalTrials} essais</p>
        <button
          onClick={() => { setPhase('isi'); }}
          className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold text-lg hover:bg-cyan-400 transition-colors"
        >
          Commencer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-8">
      <div className="text-center mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Essai {currentTrial + 1}/{totalTrials}</span>
          <span className="text-sm text-emerald-400">
            {trials.filter(t => t.correct).length} correct
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-cyan-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentTrial + 1) / totalTrials) * 100}%` }}
          />
        </div>
      </div>

      <div 
        className="h-64 flex items-center justify-center cursor-pointer"
        onClick={handleResponse}
      >
        {phase === 'stimulus' ? (
          <div className={`text-9xl transition-transform ${responded ? 'scale-90' : ''}`}>
            {currentType === 'go' ? GO_SYMBOL : NOGO_SYMBOL}
          </div>
        ) : (
          <div className="text-4xl text-slate-600">+</div>
        )}
      </div>

      <p className="text-center text-sm text-slate-500">
        Appuyez sur ESPACE ou cliquez pour répondre
      </p>
    </div>
  );
}
