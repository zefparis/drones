/**
 * Visual Search Test - Selective Attention (3 min)
 * Tests visual attention and target detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { testResultsStore } from '../../../lib/hcs/storage/test-results-store';

const GRID_SIZE = 6;
const TOTAL_TRIALS = 20;
const MAX_TIME_PER_TRIAL = 10000;

interface Target {
  row: number;
  col: number;
}

interface Trial {
  targetPresent: boolean;
  responseCorrect: boolean;
  responseTime: number;
  setSize: number;
}

export interface VisualSearchResult {
  accuracy: number;
  avgRT: number;
  targetPresentRT: number;
  targetAbsentRT: number;
  searchSlope: number;
  score: number;
  trials: Trial[];
}

interface VisualSearchTestProps {
  onComplete: (result: VisualSearchResult) => void;
  totalTrials?: number;
}

const DISTRACTOR_SHAPES = ['◇', '○', '□', '△'];
const TARGET_SHAPE = '◆';

export function VisualSearchTest({ onComplete, totalTrials = TOTAL_TRIALS }: VisualSearchTestProps) {
  const [phase, setPhase] = useState<'intro' | 'fixation' | 'search' | 'feedback' | 'complete'>('intro');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [grid, setGrid] = useState<string[][]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);
  const [setSize, setSetSize] = useState(12);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateGrid = useCallback((hasTarget: boolean, distractorCount: number) => {
    const newGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    const positions: { row: number; col: number }[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        positions.push({ row: r, col: c });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let targetPos: Target | null = null;
    let posIndex = 0;

    if (hasTarget) {
      const pos = positions[posIndex++];
      newGrid[pos.row][pos.col] = TARGET_SHAPE;
      targetPos = pos;
    }

    for (let i = 0; i < distractorCount && posIndex < positions.length; i++) {
      const pos = positions[posIndex++];
      const shape = DISTRACTOR_SHAPES[Math.floor(Math.random() * DISTRACTOR_SHAPES.length)];
      newGrid[pos.row][pos.col] = shape;
    }

    return { grid: newGrid, target: targetPos };
  }, []);

  const startTrial = useCallback(() => {
    setPhase('fixation');
    
    setTimeout(() => {
      const hasTarget = Math.random() > 0.5;
      const distractorCount = setSize + Math.floor(Math.random() * 6) - 3;
      const { grid: newGrid, target: newTarget } = generateGrid(hasTarget, Math.max(6, distractorCount));
      
      setGrid(newGrid);
      setTarget(newTarget);
      startTimeRef.current = performance.now();
      setPhase('search');

      timeoutRef.current = setTimeout(() => {
        handleResponse(false, true);
      }, MAX_TIME_PER_TRIAL);
    }, 500);
  }, [generateGrid, setSize]);

  const handleResponse = useCallback((userSaysPresent: boolean, isTimeout = false) => {
    if (phase !== 'search') return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const rt = performance.now() - startTimeRef.current;
    const targetPresent = target !== null;
    const isCorrect = !isTimeout && (userSaysPresent === targetPresent);

    const trial: Trial = {
      targetPresent,
      responseCorrect: isCorrect,
      responseTime: isTimeout ? MAX_TIME_PER_TRIAL : rt,
      setSize
    };

    setTrials(prev => [...prev, trial]);
    setFeedback(isTimeout ? 'timeout' : isCorrect ? 'correct' : 'incorrect');
    setPhase('feedback');

    setTimeout(() => {
      if (currentTrial + 1 >= totalTrials) {
        setPhase('complete');
      } else {
        const newSetSize = isCorrect ? Math.min(24, setSize + 1) : Math.max(8, setSize - 1);
        setSetSize(newSetSize);
        setCurrentTrial(prev => prev + 1);
        startTrial();
      }
    }, 800);
  }, [phase, target, setSize, currentTrial, totalTrials, startTrial]);

  useEffect(() => {
    if (phase !== 'complete' || trials.length !== totalTrials) return;

    const correctTrials = trials.filter(t => t.responseCorrect);
    const accuracy = correctTrials.length / trials.length;
    const avgRT = trials.reduce((sum, t) => sum + t.responseTime, 0) / trials.length;

    const presentTrials = trials.filter(t => t.targetPresent && t.responseCorrect);
    const absentTrials = trials.filter(t => !t.targetPresent && t.responseCorrect);
    
    const targetPresentRT = presentTrials.length > 0 
      ? presentTrials.reduce((sum, t) => sum + t.responseTime, 0) / presentTrials.length 
      : 0;
    const targetAbsentRT = absentTrials.length > 0 
      ? absentTrials.reduce((sum, t) => sum + t.responseTime, 0) / absentTrials.length 
      : 0;

    const searchSlope = (targetAbsentRT - targetPresentRT) / 10;

    const accuracyScore = accuracy * 60;
    const speedScore = Math.max(0, 40 - (avgRT - 500) / 50);
    const score = Math.min(100, Math.round(accuracyScore + speedScore));

    const result: VisualSearchResult = {
      accuracy: Math.round(accuracy * 100),
      avgRT: Math.round(avgRT),
      targetPresentRT: Math.round(targetPresentRT),
      targetAbsentRT: Math.round(targetAbsentRT),
      searchSlope: Math.round(searchSlope * 10) / 10,
      score,
      trials
    };

    testResultsStore.saveTestResult({
      testType: 'pattern',
      timestamp: Date.now(),
      score,
      metadata: result as unknown as Record<string, unknown>
    });

    onComplete(result);
  }, [phase, trials, totalTrials, onComplete]);

  if (phase === 'intro') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-white mb-4">Test de Recherche Visuelle</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Trouvez le <strong className="text-cyan-400">losange plein ◆</strong> parmi les 
          formes vides. Indiquez s'il est <strong className="text-green-400">PRÉSENT</strong> ou 
          <strong className="text-red-400"> ABSENT</strong>.
        </p>
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl text-cyan-400 mb-1">{TARGET_SHAPE}</div>
            <p className="text-sm text-slate-400">Cible</p>
          </div>
          <div className="text-center">
            <div className="text-4xl text-slate-500 mb-1">◇ ○ □ △</div>
            <p className="text-sm text-slate-400">Distracteurs</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6">Durée: ~3 minutes • {totalTrials} essais</p>
        <button
          onClick={startTrial}
          className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold text-lg hover:bg-cyan-400 transition-colors"
        >
          Commencer
        </button>
      </div>
    );
  }

  if (phase === 'fixation') {
    return (
      <div className="bg-slate-900 rounded-xl p-8">
        <div className="h-80 flex items-center justify-center">
          <p className="text-4xl text-slate-500">+</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6">
      <div className="text-center mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Essai {currentTrial + 1}/{totalTrials}</span>
          <span className="text-sm text-emerald-400">
            {trials.filter(t => t.responseCorrect).length} correct
          </span>
        </div>
      </div>

      {phase === 'search' && (
        <>
          <div className="grid gap-1 mb-6" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`h-12 flex items-center justify-center text-2xl ${
                    cell === TARGET_SHAPE ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                >
                  {cell}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleResponse(true)}
              className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-400 transition-colors"
            >
              PRÉSENT ◆
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="px-8 py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-400 transition-colors"
            >
              ABSENT
            </button>
          </div>
        </>
      )}

      {phase === 'feedback' && (
        <div className="h-64 flex items-center justify-center">
          <div className={`text-4xl font-bold ${
            feedback === 'correct' ? 'text-green-400' : 
            feedback === 'timeout' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {feedback === 'correct' ? '✓ Correct!' : 
             feedback === 'timeout' ? '⏱ Temps écoulé' : '✗ Incorrect'}
          </div>
        </div>
      )}
    </div>
  );
}
