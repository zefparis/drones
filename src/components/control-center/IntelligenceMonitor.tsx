/**
 * Intelligence Monitor
 * Real-time decision monitoring and statistics
 */

import { useEffect, useState } from 'react';
import { Brain, Zap, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';

interface Decision {
  id: string;
  type: string;
  timestamp: string;
  duration: number;
  reasoning: string;
  confidence: number;
  outcome?: 'success' | 'pending' | 'failed';
}

export function IntelligenceMonitor() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState({
    total_decisions: 0,
    avg_decision_time: 0,
    successful_decisions: 0,
    failed_decisions: 0,
  });
  const [context] = useState({
    state: 'HOVER',
    position_uncertainty: 0.8,
    threat_level: 'CLEAR',
    battery: 85,
    gps_status: 'OFF (Stealth)',
    mission_progress: 45,
  });

  // Simulate real-time decisions
  useEffect(() => {
    const decisionTypes = [
      { type: 'GPS_ACTIVATION', reasoning: 'Position drift exceeded threshold (2.1m). Activating GPS for 10s burst.' },
      { type: 'AVOID_OBSTACLE', reasoning: 'Obstacle detected at 15m. Executing avoidance maneuver.' },
      { type: 'RELOCALIZE', reasoning: 'VIO tracking quality degraded. Triggering SLAM loop closure.' },
      { type: 'STATE_CHANGE', reasoning: 'Waypoint reached. Transitioning from NAVIGATE to HOVER.' },
      { type: 'THREAT_RESPONSE', reasoning: 'RF emission detected at bearing 045. Adjusting flight path.' },
      { type: 'BATTERY_MANAGEMENT', reasoning: 'Battery at 25%. Calculating RTH requirements.' },
      { type: 'PATH_REPLAN', reasoning: 'New obstacle in planned path. Computing alternative route.' },
    ];

    const interval = setInterval(() => {
      const randomDecision = decisionTypes[Math.floor(Math.random() * decisionTypes.length)];
      const newDecision: Decision = {
        id: Date.now().toString(),
        type: randomDecision.type,
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 50) + 5,
        reasoning: randomDecision.reasoning,
        confidence: 0.7 + Math.random() * 0.25,
        outcome: Math.random() > 0.1 ? 'success' : 'pending',
      };

      setDecisions(prev => [newDecision, ...prev].slice(0, 50));
      setStats(prev => ({
        total_decisions: prev.total_decisions + 1,
        avg_decision_time: (prev.avg_decision_time * prev.total_decisions + newDecision.duration) / (prev.total_decisions + 1),
        successful_decisions: prev.successful_decisions + (newDecision.outcome === 'success' ? 1 : 0),
        failed_decisions: prev.failed_decisions + (newDecision.outcome === 'failed' ? 1 : 0),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-6 mt-4">
      
      {/* Left: Decision Stream */}
      <div className="col-span-2 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Real-Time Decisions
            <span className="ml-auto text-xs text-slate-500 font-normal">
              {decisions.length} decisions in buffer
            </span>
          </h2>

          <div className="space-y-2 max-h-[500px] overflow-auto pr-2">
            {decisions.map((decision) => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}

            {decisions.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Waiting for brain decisions...</p>
                <p className="text-xs mt-1">Start a mission to see intelligence in action</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Stats + Context */}
      <div className="space-y-4">
        
        {/* Decision Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Decision Statistics
          </h3>
          <div className="space-y-3">
            <StatItem
              label="Total Decisions"
              value={stats.total_decisions.toString()}
              icon={<Target className="w-4 h-4 text-cyan-400" />}
            />
            <StatItem
              label="Avg Decision Time"
              value={`${stats.avg_decision_time.toFixed(1)}ms`}
              icon={<Clock className="w-4 h-4 text-cyan-400" />}
            />
            <StatItem
              label="Success Rate"
              value={`${((stats.successful_decisions / (stats.total_decisions || 1)) * 100).toFixed(1)}%`}
              icon={<CheckCircle className="w-4 h-4 text-green-400" />}
            />
            <StatItem
              label="Failed"
              value={stats.failed_decisions.toString()}
              icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            />
          </div>
        </div>

        {/* Current Context */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Decision Context
          </h3>
          <div className="space-y-2 text-sm">
            <ContextItem label="State" value={context.state} />
            <ContextItem label="Position Uncertainty" value={`${context.position_uncertainty}m`} />
            <ContextItem label="Threat Level" value={context.threat_level} />
            <ContextItem label="Battery" value={`${context.battery}%`} />
            <ContextItem label="GPS Status" value={context.gps_status} />
            <ContextItem label="Mission Progress" value={`${context.mission_progress}%`} />
          </div>
        </div>

        {/* Intelligence Modes */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Intelligence Modes
          </h3>
          <div className="space-y-2">
            <ModeToggle label="Autonomous Decision" enabled={true} />
            <ModeToggle label="Threat Avoidance" enabled={true} />
            <ModeToggle label="GPS Auto-Activation" enabled={false} />
            <ModeToggle label="Human Detection" enabled={true} />
            <ModeToggle label="Self-Correction" enabled={true} />
            <ModeToggle label="Swarm Coordination" enabled={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Decision Card
function DecisionCard({ decision }: { decision: Decision }) {
  const typeColors: Record<string, string> = {
    'GPS_ACTIVATION': 'border-amber-500/50 bg-amber-500/10',
    'AVOID_OBSTACLE': 'border-red-500/50 bg-red-500/10',
    'RELOCALIZE': 'border-cyan-500/50 bg-cyan-500/10',
    'STATE_CHANGE': 'border-green-500/50 bg-green-500/10',
    'THREAT_RESPONSE': 'border-orange-500/50 bg-orange-500/10',
    'BATTERY_MANAGEMENT': 'border-yellow-500/50 bg-yellow-500/10',
    'PATH_REPLAN': 'border-purple-500/50 bg-purple-500/10',
  };

  const typeIcons: Record<string, string> = {
    'GPS_ACTIVATION': '📡',
    'AVOID_OBSTACLE': '🚧',
    'RELOCALIZE': '🎯',
    'STATE_CHANGE': '🔄',
    'THREAT_RESPONSE': '⚠️',
    'BATTERY_MANAGEMENT': '🔋',
    'PATH_REPLAN': '🗺️',
  };

  return (
    <div className={`border rounded-lg p-4 ${typeColors[decision.type] || 'border-slate-700 bg-slate-800/30'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcons[decision.type] || '🧠'}</span>
          <div>
            <div className="font-semibold text-sm text-slate-200">{decision.type}</div>
            <div className="text-xs text-slate-500">
              {new Date(decision.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-950/50 px-2 py-1 rounded text-slate-400">
            {decision.duration}ms
          </span>
          {decision.outcome === 'success' && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
          {decision.outcome === 'pending' && (
            <Clock className="w-4 h-4 text-amber-400" />
          )}
          {decision.outcome === 'failed' && (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>
      
      <div className="text-sm text-slate-300 mb-3">
        {decision.reasoning}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className="text-slate-500">Confidence:</span>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{ width: `${decision.confidence * 100}%` }}
          />
        </div>
        <span className="font-mono text-cyan-400">
          {(decision.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// Helper Components
function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-mono font-bold text-cyan-400">{value}</span>
    </div>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between p-2 bg-slate-800/30 rounded">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-slate-200">{value}</span>
    </div>
  );
}

function ModeToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
      <span className="text-sm text-slate-300">{label}</span>
      <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
    </div>
  );
}

export default IntelligenceMonitor;
