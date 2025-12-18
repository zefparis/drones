/**
 * Stroop Test - Quick Version (7 trials)
 * Tests cognitive inhibition and interference control
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { testResultsStore } from '../../../lib/hcs/storage/test-results-store';

const COLORS = ['red', 'blue', 'green', 'yellow'] as const;
const COLOR_NAMES = { red: 'ROUGE', blue: 'BLEU', green: 'VERT', yellow: 'JAUNE' } as const;
const COLOR_STYLES = {
  red: 'text-red-500',
  blue: 'text-blue-500', 
  green: 'text-green-500',
  yellow: 'text-yellow-400'
} as const;

type ColorType = typeof COLORS[number];

interface Trial {
  congruent: boolean;
  responseTime: number;
  correct: boolean;
  inkColor: ColorType;
  wordText: string;
}

export interface StroopResult {
  correct: number;
  incorrect: number;
  avgReactionTime: number;
  congruentAvg: number;
  incongruentAvg: number;
  stroopEffect: number;
  score: number;
  trials: Trial[];
}

interface StroopTestFullProps {
  onComplete: (result: StroopResult) => void;
  totalTrials?: number;
}

export function StroopTestFull({ onComplete, totalTrials = 7 }: StroopTestFullProps) {
  const [phase, setPhase] = useState<'intro' | 'ready' | 'stimulus' | 'feedback' | 'complete'>('intro');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState<{ inkColor: ColorType; wordText: string; congruent: boolean } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const startTimeRef = useRef<number>(0);

  const generateStimulus = useCallback(() => {
    const isCongruent = Math.random() > 0.5;
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    const inkColor = COLORS[colorIndex];
    
    let wordText: string;
    if (isCongruent) {
      wordText = COLOR_NAMES[inkColor];
    } else {
      let textIndex;
      do {
        textIndex = Math.floor(Math.random() * COLORS.length);
      } while (textIndex === colorIndex);
      wordText = COLOR_NAMES[COLORS[textIndex]];
    }
    
    return { inkColor, wordText, congruent: isCongruent };
  }, []);

  const startTrial = useCallback(() => {
    const stimulus = generateStimulus();
    setCurrentStimulus(stimulus);
    setPhase('stimulus');
    startTimeRef.current = performance.now();
  }, [generateStimulus]);

  const handleResponse = useCallback((selectedColor: ColorType) => {
    if (!currentStimulus || phase !== 'stimulus') return;

    const responseTime = performance.now() - startTimeRef.current;
    const correct = selectedColor === currentStimulus.inkColor;

    const trial: Trial = {
      congruent: currentStimulus.congruent,
      responseTime,
      correct,
      inkColor: currentStimulus.inkColor,
      wordText: currentStimulus.wordText
    };

    setTrials(prev => [...prev, trial]);
    setFeedback(correct ? 'correct' : 'incorrect');
    setPhase('feedback');

    setTimeout(() => {
      if (currentTrial + 1 >= totalTrials) {
        setPhase('complete');
      } else {
        setCurrentTrial(prev => prev + 1);
        startTrial();
      }
    }, 300);
  }, [currentStimulus, phase, currentTrial, totalTrials, startTrial]);

  useEffect(() => {
    if (phase === 'complete' && trials.length === totalTrials) {
      const congruentTrials = trials.filter(t => t.congruent);
      const incongruentTrials = trials.filter(t => !t.congruent);
      
      const correct = trials.filter(t => t.correct).length;
      const avgReactionTime = trials.reduce((sum, t) => sum + t.responseTime, 0) / trials.length;
      const congruentAvg = congruentTrials.length > 0 
        ? congruentTrials.reduce((sum, t) => sum + t.responseTime, 0) / congruentTrials.length 
        : 0;
      const incongruentAvg = incongruentTrials.length > 0 
        ? incongruentTrials.reduce((sum, t) => sum + t.responseTime, 0) / incongruentTrials.length 
        : 0;
      const stroopEffect = incongruentAvg - congruentAvg;

      const accuracyScore = (correct / trials.length) * 70;
      const speedBonus = Math.max(0, 30 - (avgReactionTime - 500) / 50);
      const score = Math.min(100, Math.round(accuracyScore + speedBonus));

      const result: StroopResult = {
        correct,
        incorrect: trials.length - correct,
        avgReactionTime: Math.round(avgReactionTime),
        congruentAvg: Math.round(congruentAvg),
        incongruentAvg: Math.round(incongruentAvg),
        stroopEffect: Math.round(stroopEffect),
        score,
        trials
      };

      testResultsStore.saveTestResult({
        testType: 'color',
        timestamp: Date.now(),
        duration: trials.reduce((sum, t) => sum + t.responseTime, 0),
        score,
        metadata: result as unknown as Record<string, unknown>
      });

      onComplete(result);
    }
  }, [phase, trials, totalTrials, onComplete]);

  if (phase === 'intro') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-2xl font-bold text-white mb-4">Test de Stroop</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Des mots de couleurs vont apparaître. Cliquez sur le bouton correspondant à la 
          <strong className="text-cyan-400"> COULEUR de l'encre</strong>, pas le mot lui-même.
        </p>
        <div className="bg-slate-800 rounded-lg p-4 mb-6 max-w-sm mx-auto">
          <p className="text-sm text-slate-400 mb-2">Exemple:</p>
          <p className="text-4xl font-bold text-blue-500 mb-2">ROUGE</p>
          <p className="text-sm text-slate-400">→ Réponse correcte: <span className="text-blue-400">BLEU</span></p>
        </div>
        <p className="text-sm text-slate-500 mb-6">Durée: ~2 minutes • {totalTrials} essais</p>
        <button
          onClick={() => { setPhase('ready'); setTimeout(startTrial, 1000); }}
          className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold text-lg hover:bg-cyan-400 transition-colors"
        >
          Commencer
        </button>
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <p className="text-3xl text-cyan-400 animate-pulse">Préparez-vous...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-8">
      <div className="text-center mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Essai {currentTrial + 1}/{totalTrials}</span>
          <span className="text-sm text-slate-400">
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

      {phase === 'stimulus' && currentStimulus && (
        <>
          <div className="h-40 flex items-center justify-center mb-8">
            <p className={`text-7xl font-bold ${COLOR_STYLES[currentStimulus.inkColor]}`}>
              {currentStimulus.wordText}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleResponse(color)}
                className={`h-16 rounded-lg font-bold text-lg text-white transition-transform hover:scale-105 ${
                  color === 'red' ? 'bg-red-500 hover:bg-red-400' :
                  color === 'blue' ? 'bg-blue-500 hover:bg-blue-400' :
                  color === 'green' ? 'bg-green-500 hover:bg-green-400' :
                  'bg-yellow-500 hover:bg-yellow-400'
                }`}
              >
                {COLOR_NAMES[color]}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'feedback' && (
        <div className="h-40 flex items-center justify-center">
          <div className={`text-4xl ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
            {feedback === 'correct' ? '✓' : '✗'}
          </div>
        </div>
      )}
    </div>
  );
}
