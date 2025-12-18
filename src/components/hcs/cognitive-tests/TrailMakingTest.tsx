/**
 * Trail Making Test - Cognitive Flexibility (3 min)
 * Tests visual attention, processing speed, and task switching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { testResultsStore } from '../../../lib/hcs/storage/test-results-store';

interface Point {
  id: number;
  x: number;
  y: number;
  label: string;
  type: 'number' | 'letter';
}

export interface TrailMakingResult {
  partATime: number;
  partBTime: number;
  partAErrors: number;
  partBErrors: number;
  switchCost: number;
  score: number;
}

interface TrailMakingTestProps {
  onComplete: (result: TrailMakingResult) => void;
}

const generatePoints = (count: number, type: 'A' | 'B'): Point[] => {
  const points: Point[] = [];
  const margin = 60;
  const usedPositions: { x: number; y: number }[] = [];

  const getLabel = (i: number): { label: string; type: 'number' | 'letter' } => {
    if (type === 'A') {
      return { label: String(i + 1), type: 'number' };
    } else {
      if (i % 2 === 0) {
        return { label: String(Math.floor(i / 2) + 1), type: 'number' };
      } else {
        return { label: String.fromCharCode(65 + Math.floor(i / 2)), type: 'letter' };
      }
    }
  };

  for (let i = 0; i < count; i++) {
    let x: number = 0, y: number = 0;
    let attempts = 0;
    do {
      x = margin + Math.random() * (400 - margin * 2);
      y = margin + Math.random() * (400 - margin * 2);
      attempts++;
    } while (
      attempts < 100 &&
      usedPositions.some((p: { x: number; y: number }) => Math.hypot(p.x - x, p.y - y) < 60)
    );

    usedPositions.push({ x, y });
    const { label, type: pointType } = getLabel(i);
    points.push({ id: i, x, y, label, type: pointType });
  }

  return points;
};

export function TrailMakingTest({ onComplete }: TrailMakingTestProps) {
  const [phase, setPhase] = useState<'intro' | 'partA' | 'partA-done' | 'partB' | 'complete'>('intro');
  const [points, setPoints] = useState<Point[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [trail, setTrail] = useState<number[]>([]);
  const [partATime, setPartATime] = useState(0);
  const [partAErrors, setPartAErrors] = useState(0);
  const [partBTime, setPartBTime] = useState(0);
  const [partBErrors, setPartBErrors] = useState(0);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const startPartA = useCallback(() => {
    setPoints(generatePoints(8, 'A'));
    setCurrentIndex(0);
    setErrors(0);
    setTrail([]);
    startTimeRef.current = performance.now();
    setPhase('partA');
  }, []);

  const startPartB = useCallback(() => {
    setPoints(generatePoints(10, 'B'));
    setCurrentIndex(0);
    setErrors(0);
    setTrail([]);
    startTimeRef.current = performance.now();
    setPhase('partB');
  }, []);

  const handlePointClick = useCallback((pointId: number) => {
    if (phase !== 'partA' && phase !== 'partB') return;

    if (pointId === currentIndex) {
      setTrail(prev => [...prev, pointId]);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= points.length) {
        const elapsed = performance.now() - startTimeRef.current;
        
        if (phase === 'partA') {
          setPartATime(elapsed);
          setPartAErrors(errors);
          setPhase('partA-done');
        } else {
          setPartBTime(elapsed);
          setPartBErrors(errors);
          setPhase('complete');
        }
      } else {
        setCurrentIndex(nextIndex);
      }
    } else {
      setErrors(prev => prev + 1);
    }
  }, [phase, currentIndex, points.length, errors]);

  useEffect(() => {
    if (phase !== 'complete') return;

    const switchCost = partBTime - partATime;
    const timeScore = Math.max(0, 50 - (partATime + partBTime) / 1000);
    const errorPenalty = (partAErrors + partBErrors) * 5;
    const score = Math.min(100, Math.max(0, Math.round(50 + timeScore - errorPenalty)));

    const result: TrailMakingResult = {
      partATime: Math.round(partATime),
      partBTime: Math.round(partBTime),
      partAErrors,
      partBErrors,
      switchCost: Math.round(switchCost),
      score
    };

    testResultsStore.saveTestResult({
      testType: 'tracing',
      timestamp: Date.now(),
      score,
      metadata: result as unknown as Record<string, unknown>
    });

    onComplete(result);
  }, [phase, partATime, partBTime, partAErrors, partBErrors, onComplete]);

  if (phase === 'intro') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🔗</div>
        <h2 className="text-2xl font-bold text-white mb-4">Trail Making Test</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Connectez les points dans l'ordre. <br />
          <strong className="text-cyan-400">Partie A:</strong> 1 → 2 → 3 → ... <br />
          <strong className="text-yellow-400">Partie B:</strong> 1 → A → 2 → B → 3 → C → ...
        </p>
        <p className="text-sm text-slate-500 mb-6">Durée: ~3 minutes</p>
        <button
          onClick={startPartA}
          className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold text-lg hover:bg-cyan-400 transition-colors"
        >
          Commencer Partie A
        </button>
      </div>
    );
  }

  if (phase === 'partA-done') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-4">Partie A Terminée!</h3>
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <p className="text-2xl font-bold text-cyan-400">{(partATime / 1000).toFixed(1)}s</p>
          <p className="text-sm text-slate-400">Erreurs: {partAErrors}</p>
        </div>
        <p className="text-slate-400 mb-6">
          Maintenant la Partie B: alternez entre chiffres et lettres<br />
          <span className="text-yellow-400">1 → A → 2 → B → 3 → C → ...</span>
        </p>
        <button
          onClick={startPartB}
          className="px-8 py-4 bg-yellow-500 text-white rounded-lg font-semibold text-lg hover:bg-yellow-400 transition-colors"
        >
          Commencer Partie B
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-white">
          {phase === 'partA' ? 'Partie A' : 'Partie B'}
        </span>
        <div className="flex gap-4 text-sm">
          <span className="text-slate-400">
            Point: {currentIndex + 1}/{points.length}
          </span>
          <span className="text-red-400">
            Erreurs: {errors}
          </span>
        </div>
      </div>

      <div 
        ref={canvasRef}
        className="relative bg-slate-800 rounded-lg"
        style={{ width: 400, height: 400 }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {trail.map((pointId, idx) => {
            if (idx === 0) return null;
            const prev = points[trail[idx - 1]];
            const curr = points[pointId];
            return (
              <line
                key={idx}
                x1={prev.x}
                y1={prev.y}
                x2={curr.x}
                y2={curr.y}
                stroke="#22d3ee"
                strokeWidth="3"
              />
            );
          })}
        </svg>

        {points.map((point, idx) => {
          const isCompleted = trail.includes(point.id);
          const isCurrent = idx === currentIndex;
          const isNumber = point.type === 'number';

          return (
            <button
              key={point.id}
              onClick={() => handlePointClick(point.id)}
              className={`absolute w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                isCompleted
                  ? 'bg-cyan-500 text-white scale-90'
                  : isCurrent
                    ? 'bg-white text-slate-900 ring-2 ring-cyan-400 animate-pulse'
                    : isNumber
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : 'bg-yellow-600 text-white hover:bg-yellow-500'
              }`}
              style={{ left: point.x, top: point.y }}
            >
              {point.label}
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-slate-500 mt-4">
        {phase === 'partA' 
          ? 'Cliquez sur les nombres dans l\'ordre croissant'
          : 'Alternez: 1 → A → 2 → B → 3 → C → ...'}
      </p>
    </div>
  );
}
