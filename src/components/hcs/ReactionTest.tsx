import { useState } from 'react';
import { testResultsStore } from '../../lib/hcs/storage/test-results-store';
import { useCognitiveTests } from '../../lib/hcs/store/hcs-store';

interface TestResult {
  reactionTime: number;
  timestamp: number;
}

interface ReactionStats {
  mean: number;
  std: number;
  best: number;
  worst: number;
  consistency: number;
  count: number;
}

const TOTAL_TRIALS = 5;

export function ReactionTest({ onComplete }: { onComplete?: () => void }) {
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'tap' | 'result' | 'final'>('waiting');
  const [showTime, setShowTime] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [stats, setStats] = useState<ReactionStats | null>(null);
  
  const { addCompletedTest } = useCognitiveTests();

  const startTest = () => {
    setResults([]);
    setCurrentTrial(0);
    setStats(null);
    startTrial();
  };

  const startTrial = () => {
    setGameState('ready');
    
    const delay = 1000 + Math.random() * 2000;
    
    setTimeout(() => {
      setShowTime(performance.now());
      setGameState('tap');
    }, delay);
  };

  const calculateStats = (allResults: TestResult[]): ReactionStats => {
    const times = allResults.map(r => r.reactionTime);
    const n = times.length;
    const mean = times.reduce((a, b) => a + b, 0) / n;
    const best = Math.min(...times);
    const worst = Math.max(...times);
    const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    const consistency = Math.max(0, Math.min(100, (1 - std / mean) * 100));

    return { mean, std, best, worst, consistency, count: n };
  };

  const saveResults = async (allResults: TestResult[], finalStats: ReactionStats) => {
    try {
      for (const r of allResults) {
        await testResultsStore.saveTestResult({
          testType: 'reaction',
          timestamp: r.timestamp,
          duration: r.reactionTime,
          score: Math.round(finalStats.consistency),
          metadata: {
            reactionTime: r.reactionTime,
          },
        });
      }
      addCompletedTest('reaction');
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  };

  const handleTap = async () => {
    if (gameState !== 'tap') return;

    const now = performance.now();
    const timestamp = Date.now();
    const reactionTime = now - showTime;

    const testResult: TestResult = {
      reactionTime,
      timestamp,
    };

    setResult(testResult);
    const newResults = [...results, testResult];
    setResults(newResults);
    
    const nextTrial = currentTrial + 1;
    setCurrentTrial(nextTrial);
    
    if (nextTrial >= TOTAL_TRIALS) {
      const finalStats = calculateStats(newResults);
      setStats(finalStats);
      await saveResults(newResults, finalStats);
      setGameState('final');
      onComplete?.();
    } else {
      setGameState('result');
    }
  };

  const continueToNextTrial = () => {
    startTrial();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl border border-slate-700">
      {gameState === 'waiting' && (
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-4">Test de Réaction</h2>
          <p className="text-slate-400 mb-6">Tapez dès que le cercle devient vert</p>
          
          <button
            onClick={startTest}
            className="px-8 py-4 bg-emerald-500 text-white rounded-lg font-semibold text-lg hover:bg-emerald-400 transition-colors"
          >
            Commencer
          </button>
        </div>
      )}

      {gameState === 'ready' && (
        <div className="text-center">
          <p className="text-3xl text-slate-400 animate-pulse">Attendez...</p>
        </div>
      )}

      {gameState === 'tap' && (
        <button
          onClick={handleTap}
          className="w-48 h-48 bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🎯</div>
            <p className="text-xl font-bold text-white">TAP!</p>
          </div>
        </button>
      )}

      {gameState === 'result' && result && (
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Essai {currentTrial}/{TOTAL_TRIALS}
          </h3>
          
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="text-4xl font-bold text-emerald-400 mb-2">
              {result.reactionTime.toFixed(0)} ms
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {results.map((r, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  r.reactionTime < 250 ? 'bg-emerald-500' :
                  r.reactionTime < 350 ? 'bg-blue-500' : 'bg-orange-500'
                } text-white`}
              >
                {r.reactionTime.toFixed(0)}
              </div>
            ))}
          </div>

          <button
            onClick={continueToNextTrial}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}

      {gameState === 'final' && stats && (
        <div className="text-center w-full max-w-md">
          <h3 className="text-2xl font-bold text-white mb-4">🏆 Résultats Finaux</h3>
          
          <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg p-6 mb-6 border border-emerald-500/30">
            <div className="text-4xl font-bold text-emerald-400 mb-2">
              {stats.mean.toFixed(0)} ms
            </div>
            <p className="text-slate-400">Temps moyen</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">⚡ Meilleur</p>
              <p className="text-xl font-bold text-emerald-400">{stats.best.toFixed(0)} ms</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">🐢 Plus lent</p>
              <p className="text-xl font-bold text-orange-400">{stats.worst.toFixed(0)} ms</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">📊 Écart-type</p>
              <p className="text-xl font-bold text-white">±{stats.std.toFixed(0)} ms</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">🎯 Consistance</p>
              <p className={`text-xl font-bold ${
                stats.consistency > 80 ? 'text-emerald-400' :
                stats.consistency > 60 ? 'text-blue-400' : 'text-orange-400'
              }`}>{stats.consistency.toFixed(0)}%</p>
            </div>
          </div>

          <button
            onClick={() => setGameState('waiting')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors"
          >
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}
