/**
 * Memory Cards Test - Visual Memory (7 trials)
 * Simpler alternative to N-Back, tests visual memory recall
 */

import { useState, useEffect, useCallback } from 'react';
import { testResultsStore } from '../../../lib/hcs/storage/test-results-store';

const EMOJIS = ['💎', '🎨', '🎯', '⭐', '🔥', '🌟', '🎪', '🎭', '🎵', '🎲', '🎸', '🎺'];
const TOTAL_TRIALS = 7;
const GRID_SIZE = 12;
const CARDS_TO_REMEMBER = 4;
const MEMORIZE_TIME = 3000;

interface Trial {
  correct: boolean;
  time: number;
  correctCards: number;
  selectedCards: number;
}

export interface MemoryCardsResult {
  correct: number;
  incorrect: number;
  score: number;
  avgTime: number;
  accuracy: number;
  trials: Trial[];
}

interface MemoryCardsTestProps {
  onComplete: (result: MemoryCardsResult) => void;
}

export function MemoryCardsTest({ onComplete }: MemoryCardsTestProps) {
  const [phase, setPhase] = useState<'intro' | 'memorize' | 'recall' | 'feedback' | 'complete'>('intro');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [cards, setCards] = useState<string[]>([]);
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const generateTrial = useCallback(() => {
    // Generate random cards
    const grid = Array(GRID_SIZE).fill(null).map(() => 
      EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    );
    
    // Select random positions to highlight
    const positions: number[] = [];
    while (positions.length < CARDS_TO_REMEMBER) {
      const pos = Math.floor(Math.random() * GRID_SIZE);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    
    setCards(grid);
    setHighlightedIndices(positions);
    setSelectedCards([]);
    setPhase('memorize');
    
    // After memorize time, switch to recall
    setTimeout(() => {
      setPhase('recall');
      setStartTime(Date.now());
    }, MEMORIZE_TIME);
  }, []);

  const handleCardClick = useCallback((index: number) => {
    if (phase !== 'recall') return;
    if (selectedCards.includes(index)) {
      setSelectedCards(prev => prev.filter(i => i !== index));
      return;
    }
    
    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);
    
    // If 4 cards selected, evaluate
    if (newSelected.length === CARDS_TO_REMEMBER) {
      const time = Date.now() - startTime;
      
      // Count correct selections
      const correctCount = newSelected.filter(i => highlightedIndices.includes(i)).length;
      const isCorrect = correctCount === CARDS_TO_REMEMBER;
      
      const trial: Trial = {
        correct: isCorrect,
        time,
        correctCards: correctCount,
        selectedCards: CARDS_TO_REMEMBER
      };
      
      setTrials(prev => [...prev, trial]);
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      setPhase('feedback');
      
      setTimeout(() => {
        if (currentTrial + 1 >= TOTAL_TRIALS) {
          setPhase('complete');
        } else {
          setCurrentTrial(prev => prev + 1);
          setFeedback(null);
          generateTrial();
        }
      }, 1000);
    }
  }, [phase, selectedCards, startTime, highlightedIndices, currentTrial, generateTrial]);

  // Complete test
  useEffect(() => {
    if (phase !== 'complete') return;
    
    const correct = trials.filter(t => t.correct).length;
    const incorrect = trials.length - correct;
    const avgTime = trials.reduce((sum, t) => sum + t.time, 0) / trials.length;
    const totalCorrectCards = trials.reduce((sum, t) => sum + t.correctCards, 0);
    const totalPossible = trials.length * CARDS_TO_REMEMBER;
    const accuracy = (totalCorrectCards / totalPossible) * 100;
    
    // Score: weighted combination of accuracy and speed
    const speedBonus = Math.max(0, 100 - avgTime / 50);
    const score = Math.round((accuracy * 0.7 + speedBonus * 0.3));
    
    const result: MemoryCardsResult = {
      correct,
      incorrect,
      score,
      avgTime: Math.round(avgTime),
      accuracy: Math.round(accuracy),
      trials
    };

    testResultsStore.saveTestResult({
      testType: 'memory',
      timestamp: Date.now(),
      score,
      metadata: result as unknown as Record<string, unknown>
    });

    onComplete(result);
  }, [phase, trials, onComplete]);

  if (phase === 'intro') {
    return (
      <div className="bg-slate-900 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🎴</div>
        <h2 className="text-2xl font-bold text-white mb-4">Memory Cards Test</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Memorize the position of 4 highlighted cards, then select them from memory.
          You have 3 seconds to memorize.
        </p>
        <div className="bg-slate-800 rounded-lg p-4 mb-6 max-w-sm mx-auto">
          <div className="text-sm text-slate-400 mb-2">Test Parameters</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-500">Trials:</div>
            <div className="text-white">{TOTAL_TRIALS}</div>
            <div className="text-slate-500">Cards to remember:</div>
            <div className="text-white">{CARDS_TO_REMEMBER}</div>
            <div className="text-slate-500">Memorize time:</div>
            <div className="text-white">{MEMORIZE_TIME / 1000}s</div>
          </div>
        </div>
        <button
          onClick={generateTrial}
          className="px-8 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
        >
          Start Test
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Memory Cards</h3>
        <div className="text-sm text-slate-400">
          Trial {currentTrial + 1} / {TOTAL_TRIALS}
        </div>
      </div>

      <div className="text-center mb-4">
        <p className={`text-sm font-medium ${
          phase === 'memorize' ? 'text-yellow-400' : 
          phase === 'recall' ? 'text-cyan-400' : 
          'text-slate-400'
        }`}>
          {phase === 'memorize' && '👀 Memorize the highlighted cards...'}
          {phase === 'recall' && `🎯 Select the ${CARDS_TO_REMEMBER} cards you saw (${selectedCards.length}/${CARDS_TO_REMEMBER})`}
          {phase === 'feedback' && (feedback === 'correct' ? '✅ Correct!' : '❌ Incorrect')}
        </p>
      </div>

      {/* Grid 4x3 */}
      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto mb-4">
        {cards.map((emoji, idx) => {
          const isHighlighted = highlightedIndices.includes(idx);
          const isSelected = selectedCards.includes(idx);
          const showHighlight = phase === 'memorize' || (phase === 'feedback' && isHighlighted);
          
          return (
            <button
              key={idx}
              onClick={() => handleCardClick(idx)}
              disabled={phase !== 'recall'}
              className={`
                aspect-square rounded-lg text-3xl
                transition-all duration-200
                flex items-center justify-center
                ${showHighlight 
                  ? 'bg-purple-500 ring-4 ring-purple-400 shadow-lg shadow-purple-500/50' 
                  : 'bg-slate-800'
                }
                ${isSelected ? 'ring-4 ring-cyan-400 bg-cyan-900/50' : ''}
                ${phase === 'recall' && !isSelected ? 'hover:bg-slate-700 cursor-pointer' : ''}
                ${phase !== 'recall' ? 'cursor-default' : ''}
              `}
            >
              {phase === 'memorize' ? emoji : (showHighlight || isSelected ? emoji : '?')}
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="flex justify-center gap-1 mt-4">
        {Array(TOTAL_TRIALS).fill(0).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < currentTrial 
                ? trials[i]?.correct ? 'bg-emerald-500' : 'bg-red-500'
                : i === currentTrial 
                  ? 'bg-cyan-400' 
                  : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
