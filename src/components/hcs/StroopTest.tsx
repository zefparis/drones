import { useState, useRef } from 'react';
import { testResultsStore } from '../../lib/hcs/storage/test-results-store';
import { useCognitiveTests } from '../../lib/hcs/store/hcs-store';

const COLOR_CONFIG = [
  { name: 'ROUGE', color: 'text-red-500', actual: 'red' as const },
  { name: 'BLEU', color: 'text-blue-500', actual: 'blue' as const },
  { name: 'VERT', color: 'text-green-500', actual: 'green' as const },
  { name: 'JAUNE', color: 'text-yellow-500', actual: 'yellow' as const },
];

type ColorActual = 'red' | 'blue' | 'green' | 'yellow';

interface StroopTrial {
  round: number;
  word: string;
  displayColor: ColorActual;
  selectedColor: ColorActual;
  isCongruent: boolean;
  isCorrect: boolean;
  reactionTime: number;
}

const TOTAL_ROUNDS = 10;

export function StroopTest({ onComplete }: { onComplete?: () => void }) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'result'>('waiting');
  const [currentRound, setCurrentRound] = useState(0);
  const [trials, setTrials] = useState<StroopTrial[]>([]);
  const [currentWord, setCurrentWord] = useState<{ word: string; displayColor: ColorActual } | null>(null);
  const [isCongruent, setIsCongruent] = useState(true);
  const startTimeRef = useRef(0);
  
  const { addCompletedTest } = useCognitiveTests();

  const startTest = () => {
    setCurrentRound(0);
    setTrials([]);
    setGameState('playing');
    nextTrial();
  };

  const nextTrial = () => {
    const congruent = Math.random() > 0.5;
    const wordItem = COLOR_CONFIG[Math.floor(Math.random() * COLOR_CONFIG.length)];
    
    let displayColor = wordItem.actual;
    if (!congruent) {
      const otherColors = COLOR_CONFIG.filter(c => c.actual !== wordItem.actual);
      displayColor = otherColors[Math.floor(Math.random() * otherColors.length)].actual;
    }

    setCurrentWord({ word: wordItem.name, displayColor });
    setIsCongruent(congruent);
    startTimeRef.current = performance.now();
  };

  const handleColorClick = async (selectedColor: ColorActual) => {
    if (!currentWord) return;

    const endTime = performance.now();
    const reactionTime = endTime - startTimeRef.current;
    
    const isCorrect = selectedColor === currentWord.displayColor;
    
    const trial: StroopTrial = {
      round: currentRound + 1,
      word: currentWord.word,
      displayColor: currentWord.displayColor,
      selectedColor,
      isCongruent,
      isCorrect,
      reactionTime,
    };
    
    const newTrials = [...trials, trial];
    setTrials(newTrials);
    
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      await endTest(newTrials);
    } else {
      setCurrentRound(prev => prev + 1);
      setTimeout(() => nextTrial(), 300);
    }
  };

  const endTest = async (finalTrials: StroopTrial[]) => {
    const congruentTrials = finalTrials.filter(t => t.isCongruent);
    const incongruentTrials = finalTrials.filter(t => !t.isCongruent);
    
    const avgCongruent = congruentTrials.reduce((sum, t) => sum + t.reactionTime, 0) / congruentTrials.length || 0;
    const avgIncongruent = incongruentTrials.reduce((sum, t) => sum + t.reactionTime, 0) / incongruentTrials.length || 0;
    
    const stroopEffect = avgIncongruent - avgCongruent;
    const accuracy = (finalTrials.filter(t => t.isCorrect).length / finalTrials.length) * 100;
    
    try {
      await testResultsStore.saveTestResult({
        testType: 'color',
        timestamp: Date.now(),
        score: Math.round(accuracy),
        metadata: {
          avgCongruent,
          avgIncongruent,
          stroopEffect,
          accuracy,
          trialsCount: finalTrials.length,
        },
      });
      addCompletedTest('color');
    } catch (err) {
      console.error(err);
    }

    setGameState('result');
    onComplete?.();
  };

  const getColorClass = (color: ColorActual) => {
    switch (color) {
      case 'red': return 'text-red-500';
      case 'blue': return 'text-blue-500';
      case 'green': return 'text-green-500';
      case 'yellow': return 'text-yellow-500';
    }
  };

  const getStats = () => {
    const congruentTrials = trials.filter(t => t.isCongruent);
    const incongruentTrials = trials.filter(t => !t.isCongruent);
    
    const avgCongruent = congruentTrials.reduce((sum, t) => sum + t.reactionTime, 0) / congruentTrials.length || 0;
    const avgIncongruent = incongruentTrials.reduce((sum, t) => sum + t.reactionTime, 0) / incongruentTrials.length || 0;
    
    return {
      accuracy: (trials.filter(t => t.isCorrect).length / trials.length) * 100,
      stroopEffect: avgIncongruent - avgCongruent,
      avgCongruent,
      avgIncongruent,
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl border border-slate-700">
      {gameState === 'waiting' && (
        <div className="text-center">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-white mb-4">Test de Stroop</h2>
          <p className="text-slate-400 mb-6">Identifiez la COULEUR du texte, pas le mot</p>
          
          <button
            onClick={startTest}
            className="px-8 py-4 bg-pink-500 text-white rounded-lg font-semibold text-lg hover:bg-pink-400 transition-colors"
          >
            Commencer
          </button>
        </div>
      )}

      {gameState === 'playing' && currentWord && (
        <div className="w-full max-w-md">
          <div className="text-center mb-4">
            <p className="text-slate-400">Round {currentRound + 1}/{TOTAL_ROUNDS}</p>
          </div>

          <h3 className="text-lg font-bold text-white mb-6 text-center">
            Quelle est la COULEUR du texte ?
          </h3>
          
          <div className="bg-slate-800 rounded-lg p-8 mb-6 text-center">
            <p className={`text-5xl font-bold ${getColorClass(currentWord.displayColor)}`}>
              {currentWord.word}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {COLOR_CONFIG.map((color) => (
              <button
                key={color.actual}
                onClick={() => handleColorClick(color.actual)}
                className={`${color.color} bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-pink-500/50 transition-all text-xl font-bold hover:scale-105`}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="text-center w-full max-w-md">
          <h3 className="text-2xl font-bold text-white mb-6">Résultats</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Précision</p>
              <p className="text-xl font-semibold text-white">
                {getStats().accuracy.toFixed(0)}%
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Effet Stroop</p>
              <p className="text-xl font-semibold text-white">
                +{getStats().stroopEffect.toFixed(0)}ms
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Moy. Congruent</p>
              <p className="text-xl font-semibold text-white">
                {getStats().avgCongruent.toFixed(0)}ms
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Moy. Incongruent</p>
              <p className="text-xl font-semibold text-white">
                {getStats().avgIncongruent.toFixed(0)}ms
              </p>
            </div>
          </div>

          <button
            onClick={() => setGameState('waiting')}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-400 transition-colors"
          >
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}
