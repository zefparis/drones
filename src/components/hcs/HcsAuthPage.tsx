/**
 * HCS-SHIELD Authentication Page
 * Complete workflow: 7 Tests → Profile → Mission → QR
 */

import { useState, useCallback } from 'react';
import { Shield, ChevronLeft, CheckCircle, Clock, Copy } from 'lucide-react';

import {
  StroopTestFull,
  MemoryCardsTest,
  GoNoGoTest,
  TrailMakingTest,
  DigitSpanTest,
  ReactionTimeTest,
  VisualSearchTest,
  type StroopResult,
  type MemoryCardsResult,
  type GoNoGoResult,
  type TrailMakingResult,
  type DigitSpanResult,
  type ReactionTimeResult,
  type VisualSearchResult,
} from './cognitive-tests';

import { MissionPlanner, type MissionData } from './MissionPlanner';
import { QRCodeDisplay } from './QRCodeDisplay';
import { 
  generateHCSCode, 
  encryptMission, 
  generateQRData,
  type CognitiveTestResults 
} from '../../lib/hcs/crypto/mission-encryption';

type TestPhase = 
  | 'welcome'
  | 'stroop' 
  | 'memory' 
  | 'gonogo'
  | 'trail'
  | 'digit'
  | 'reaction'
  | 'visual'
  | 'generating'
  | 'profile'
  | 'mission'
  | 'qr';

const TEST_SEQUENCE: { phase: TestPhase; name: string; duration: string; icon: string }[] = [
  { phase: 'stroop', name: 'Stroop Test', duration: '30s', icon: '🎨' },
  { phase: 'memory', name: 'Memory Cards', duration: '45s', icon: '🎴' },
  { phase: 'gonogo', name: 'Go/No-Go', duration: '20s', icon: '🚦' },
  { phase: 'trail', name: 'Trail Making', duration: '40s', icon: '🔗' },
  { phase: 'digit', name: 'Digit Span', duration: '45s', icon: '🔢' },
  { phase: 'reaction', name: 'Reaction Time', duration: '20s', icon: '⚡' },
  { phase: 'visual', name: 'Visual Search', duration: '30s', icon: '🔍' },
];

interface HcsAuthPageProps {
  onClose?: () => void;
  onComplete?: (hcsCode: string) => void;
}

export function HcsAuthPage({ onClose, onComplete }: HcsAuthPageProps) {
  const [phase, setPhase] = useState<TestPhase>('welcome');
  const [testResults, setTestResults] = useState<CognitiveTestResults>({});
  const [hcsCode, setHcsCode] = useState<string>('');
  const [mission, setMission] = useState<MissionData | null>(null);
  const [qrData, setQrData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const getCurrentTestIndex = () => {
    const idx = TEST_SEQUENCE.findIndex(t => t.phase === phase);
    return idx >= 0 ? idx : -1;
  };

  const getProgress = () => {
    const idx = getCurrentTestIndex();
    if (idx < 0) return phase === 'qr' ? 100 : 0;
    return Math.round((idx / TEST_SEQUENCE.length) * 80);
  };

  const handleTestComplete = useCallback(async <T extends object>(testName: keyof CognitiveTestResults, result: T) => {
    const newResults = { ...testResults, [testName]: result };
    setTestResults(newResults);

    const currentIdx = TEST_SEQUENCE.findIndex(t => t.phase === phase);
    
    if (currentIdx < TEST_SEQUENCE.length - 1) {
      setPhase(TEST_SEQUENCE[currentIdx + 1].phase);
    } else {
      setPhase('generating');
      
      try {
        const code = await generateHCSCode(newResults);
        setHcsCode(code);
        setPhase('profile');
        onComplete?.(code);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate HCS code');
        setPhase('profile');
      }
    }
  }, [testResults, phase, onComplete]);

  const handleMissionComplete = useCallback(async (missionData: MissionData) => {
    setMission(missionData);
    
    try {
      const encrypted = await encryptMission(missionData, hcsCode);
      const qr = generateQRData(encrypted);
      setQrData(qr);
      setPhase('qr');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to encrypt mission');
    }
  }, [hcsCode]);

  const handleQRDestroy = useCallback(() => {
    setQrData('');
    setMission(null);
    setPhase('mission');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Shield className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-white">HCS-SHIELD</h1>
              <p className="text-xs text-slate-400">Human Cognitive Signature Authentication</p>
            </div>
          </div>
          
          {phase !== 'welcome' && phase !== 'qr' && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              ~15-20 min
            </div>
          )}
        </header>

        {/* Progress Bar */}
        {phase !== 'welcome' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm text-cyan-400">{getProgress()}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            
            {/* Test indicators */}
            <div className="flex justify-between mt-3">
              {TEST_SEQUENCE.map((test, idx) => {
                const currentIdx = getCurrentTestIndex();
                const isComplete = currentIdx > idx || phase === 'profile' || phase === 'mission' || phase === 'qr';
                const isCurrent = currentIdx === idx;
                
                return (
                  <div 
                    key={test.phase}
                    className={`flex flex-col items-center ${
                      isComplete ? 'text-cyan-400' : 
                      isCurrent ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      isComplete ? 'bg-cyan-500/20' :
                      isCurrent ? 'bg-slate-700 ring-2 ring-cyan-500' : 'bg-slate-800'
                    }`}>
                      {isComplete ? <CheckCircle className="w-4 h-4" /> : test.icon}
                    </div>
                    <span className="text-xs mt-1 hidden md:block">{test.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <main>
          {/* Welcome */}
          {phase === 'welcome' && (
            <div className="bg-slate-900 rounded-xl p-8 text-center">
              <div className="text-7xl mb-6">🛡️</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Welcome to HCS-SHIELD
              </h2>
              <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                You will complete <strong className="text-cyan-400">7 cognitive tests</strong> to generate 
                your unique behavioral authentication profile. This profile is used to encrypt 
                mission data that only you can authorize.
              </p>
              
              <div className="bg-slate-800/50 rounded-lg p-4 mb-8 max-w-md mx-auto">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Test Battery</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {TEST_SEQUENCE.map(test => (
                    <div key={test.phase} className="flex items-center gap-2 text-slate-400">
                      <span>{test.icon}</span>
                      <span>{test.name}</span>
                      <span className="text-slate-600">({test.duration})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
                <Clock className="w-4 h-4" />
                Total duration: ~4 minutes
              </div>

              <button
                onClick={() => setPhase('stroop')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold text-lg hover:from-cyan-400 hover:to-blue-400 transition-all"
              >
                Begin Authentication
              </button>
            </div>
          )}

          {/* Cognitive Tests */}
          {phase === 'stroop' && (
            <StroopTestFull 
              onComplete={(result: StroopResult) => handleTestComplete('stroop', result)} 
            />
          )}
          {phase === 'memory' && (
            <MemoryCardsTest 
              onComplete={(result: MemoryCardsResult) => handleTestComplete('nback', result)} 
            />
          )}
          {phase === 'gonogo' && (
            <GoNoGoTest 
              onComplete={(result: GoNoGoResult) => handleTestComplete('gonogo', result)} 
            />
          )}
          {phase === 'trail' && (
            <TrailMakingTest 
              onComplete={(result: TrailMakingResult) => handleTestComplete('trail', result)} 
            />
          )}
          {phase === 'digit' && (
            <DigitSpanTest 
              onComplete={(result: DigitSpanResult) => handleTestComplete('digit', result)} 
            />
          )}
          {phase === 'reaction' && (
            <ReactionTimeTest 
              onComplete={(result: ReactionTimeResult) => handleTestComplete('reaction', result)} 
            />
          )}
          {phase === 'visual' && (
            <VisualSearchTest 
              onComplete={(result: VisualSearchResult) => handleTestComplete('visual', result)} 
            />
          )}

          {/* Generating */}
          {phase === 'generating' && (
            <div className="bg-slate-900 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4 animate-pulse">⚙️</div>
              <h2 className="text-2xl font-bold text-white mb-4">Generating HCS Profile</h2>
              <p className="text-slate-400">Analyzing cognitive signatures...</p>
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}

          {/* Profile Generated */}
          {phase === 'profile' && (
            <div className="bg-slate-900 rounded-xl p-8">
              {/* Header with success icon */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Profile Generated</h2>
                <p className="text-slate-400">Your unique cognitive authentication code</p>
              </div>
              
              {/* Code HCS-U7 - OPAQUE (pas de décomposition) */}
              <div className="bg-slate-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-slate-500">HCS-U7 Code</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(hcsCode);
                      alert('Code copied to clipboard');
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                
                {/* Code en UN SEUL BLOC - pas de sections révélées */}
                <div className="relative">
                  <div className="font-mono text-xs md:text-sm text-cyan-400 break-all leading-relaxed p-4 bg-slate-950 rounded border border-slate-700">
                    {hcsCode}
                  </div>
                  {/* Overlay de sécurité */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse pointer-events-none rounded" />
                </div>
                
                {/* Avertissement sécurité */}
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-400">
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Keep this code confidential. It's hardware-bound to this device and cannot be used elsewhere.
                  </span>
                </div>
              </div>

              {/* Scores Cognitifs (grid propre) */}
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-8">
                {Object.entries(testResults).map(([key, result]) => (
                  <div key={key} className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                    <p className="text-xs text-slate-400 capitalize mb-1 truncate">{key}</p>
                    <p className="text-xl md:text-2xl font-bold text-cyan-400">{(result as { score: number }).score}</p>
                  </div>
                ))}
              </div>

              <p className="text-slate-400 mb-6 text-center">
                Your cognitive profile has been generated. Next: plan your mission.
              </p>

              <button
                onClick={() => setPhase('mission')}
                className="w-full px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold text-lg hover:bg-cyan-400 transition-colors"
              >
                Plan Mission →
              </button>
            </div>
          )}

          {/* Mission Planner */}
          {phase === 'mission' && (
            <MissionPlanner onComplete={handleMissionComplete} />
          )}

          {/* QR Code Display */}
          {phase === 'qr' && mission && (
            <QRCodeDisplay 
              data={qrData}
              mission={mission}
              expiresIn={30 * 60}
              onDestroy={handleQRDestroy}
            />
          )}
        </main>
      </div>
    </div>
  );
}

