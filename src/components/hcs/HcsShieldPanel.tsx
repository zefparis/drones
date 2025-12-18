import { useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle, Fingerprint, Trash2 } from 'lucide-react';
import { useHcsStore, useCognitiveTests, useSecurity } from '../../lib/hcs/store/hcs-store';
import { tamperDetector, type TamperReport } from '../../lib/hcs';
import { hcsGenerator } from '../../lib/hcs/crypto/hcs-generator';
import { cryptoShredder } from '../../lib/hcs/security/crypto-shredder';
import { ReactionTest } from './ReactionTest';
import { StroopTest } from './StroopTest';

type TestType = 'reaction' | 'stroop' | null;

export function HcsShieldPanel() {
  const [activeTest, setActiveTest] = useState<TestType>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  
  const { hcsCode, setHcsCode, setTamperReport } = useHcsStore();
  const { completedTests, completedCount, allTestsCompleted } = useCognitiveTests();
  const { tamperReport, isLocked } = useSecurity();

  const runSecurityScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      const report = await tamperDetector.performFullScan((progress, checkName) => {
        setScanProgress(progress);
        console.log(`[SCAN] ${progress}% - ${checkName}`);
      });
      
      setTamperReport(report);
    } catch (error) {
      console.error('Security scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const generateHcsCode = async () => {
    if (!allTestsCompleted) return;
    
    setGeneratingCode(true);
    try {
      const code = await hcsGenerator.generateHcsCode();
      setHcsCode(code);
    } catch (error) {
      console.error('Failed to generate HCS code:', error);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handlePanicWipe = async () => {
    if (!showPanicConfirm) {
      setShowPanicConfirm(true);
      return;
    }
    
    await cryptoShredder.panicWipe();
    window.location.reload();
  };

  const getRiskColor = (risk: TamperReport['overallRisk']) => {
    switch (risk) {
      case 'SAFE': return 'text-emerald-400';
      case 'SUSPICIOUS': return 'text-yellow-400';
      case 'COMPROMISED': return 'text-red-400';
    }
  };

  const getRiskIcon = (risk: TamperReport['overallRisk']) => {
    switch (risk) {
      case 'SAFE': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'SUSPICIOUS': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'COMPROMISED': return <Lock className="w-5 h-5 text-red-400" />;
    }
  };

  if (isLocked) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 text-center">
        <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-400 mb-2">Système Verrouillé</h2>
        <p className="text-slate-400">Intégrité compromise détectée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-cyan-400" />
        <div>
          <h2 className="text-xl font-bold text-white">HCS-SHIELD</h2>
          <p className="text-sm text-slate-400">Human Cognitive Signature</p>
        </div>
      </div>

      {/* Security Status */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Statut Sécurité</h3>
          {tamperReport && getRiskIcon(tamperReport.overallRisk)}
        </div>
        
        {tamperReport ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Risque</span>
              <span className={getRiskColor(tamperReport.overallRisk)}>
                {tamperReport.overallRisk}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Action</span>
              <span className="text-white">{tamperReport.recommendedAction}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Checks</span>
              <span className="text-white">
                {tamperReport.checks.filter(c => !c.detected).length}/{tamperReport.checks.length} OK
              </span>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Non scanné</p>
        )}

        <button
          onClick={runSecurityScan}
          disabled={isScanning}
          className="w-full mt-3 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
        >
          {isScanning ? `Scan ${scanProgress}%...` : 'Scanner Intégrité'}
        </button>
      </div>

      {/* Cognitive Tests */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Tests Cognitifs</h3>
          <span className="text-xs text-slate-400">{completedCount}/5 minimum</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setActiveTest('reaction')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              completedTests.includes('reaction')
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            🎯 Réaction
          </button>
          <button
            onClick={() => setActiveTest('stroop')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              completedTests.includes('color')
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            🎨 Stroop
          </button>
        </div>

        {/* Active Test */}
        {activeTest === 'reaction' && (
          <div className="mt-4">
            <ReactionTest onComplete={() => setActiveTest(null)} />
          </div>
        )}
        {activeTest === 'stroop' && (
          <div className="mt-4">
            <StroopTest onComplete={() => setActiveTest(null)} />
          </div>
        )}
      </div>

      {/* HCS Code */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Fingerprint className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-300">Code HCS-U7</h3>
        </div>

        {hcsCode ? (
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-cyan-400 break-all">
            {hcsCode}
          </div>
        ) : (
          <div>
            <p className="text-slate-400 text-sm mb-3">
              {allTestsCompleted 
                ? 'Prêt à générer votre signature cognitive'
                : `Complétez encore ${5 - completedCount} test(s)`
              }
            </p>
            <button
              onClick={generateHcsCode}
              disabled={!allTestsCompleted || generatingCode}
              className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingCode ? 'Génération...' : 'Générer Code HCS'}
            </button>
          </div>
        )}
      </div>

      {/* Panic Button */}
      <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-semibold text-red-400">Destruction d'Urgence</h3>
        </div>

        {showPanicConfirm ? (
          <div className="space-y-2">
            <p className="text-red-400 text-sm">Confirmer la destruction totale ?</p>
            <div className="flex gap-2">
              <button
                onClick={handlePanicWipe}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-400"
              >
                DÉTRUIRE
              </button>
              <button
                onClick={() => setShowPanicConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPanicConfirm(true)}
            className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            🚨 Panic Wipe
          </button>
        )}
      </div>
    </div>
  );
}
