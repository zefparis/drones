/**
 * GPS Burst Manager Panel
 * Real-time monitoring and control of stealth GPS burst system
 */

import { useEffect, useState } from 'react';
import { 
  Satellite, 
  Shield, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  Zap,
  MapPin,
  Activity,
  Clock,
  Radio,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useGpsBurst, SIMULATION_SCENARIOS } from '../../lib/navigator';
import type { BurstState, GpsBurstEvent } from '../../lib/navigator';

// ============================================================================
// State Badge Component
// ============================================================================

function StateBadge({ state }: { state: BurstState }) {
  const config: Record<BurstState, { color: string; bg: string; icon: React.ReactNode }> = {
    IDLE: { color: 'text-slate-400', bg: 'bg-slate-700', icon: <Clock className="w-3 h-3" /> },
    EVALUATING: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: <Eye className="w-3 h-3" /> },
    BURST_ACTIVE: { color: 'text-green-400', bg: 'bg-green-500/20', icon: <Satellite className="w-3 h-3 animate-pulse" /> },
    COOLDOWN: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: <Clock className="w-3 h-3" /> },
    DENIED: { color: 'text-red-400', bg: 'bg-red-500/20', icon: <XCircle className="w-3 h-3" /> },
  };

  const { color, bg, icon } = config[state];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-mono ${color} ${bg}`}>
      {icon}
      {state}
    </span>
  );
}

// ============================================================================
// Metric Card Component
// ============================================================================

function MetricCard({ 
  label, 
  value, 
  unit, 
  icon, 
  color = 'cyan' 
}: { 
  label: string; 
  value: string | number; 
  unit?: string; 
  icon: React.ReactNode;
  color?: 'cyan' | 'green' | 'yellow' | 'red';
}) {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-lg font-mono font-bold">
        {value}
        {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

// ============================================================================
// Event Log Component
// ============================================================================

function EventLog({ events }: { events: GpsBurstEvent[] }) {
  const getEventConfig = (event: GpsBurstEvent) => {
    switch (event.type) {
      case 'BURST_STARTED':
        return { icon: <Satellite className="w-3 h-3" />, color: 'text-green-400', label: 'GPS Burst Started' };
      case 'BURST_COMPLETED':
        return { icon: <CheckCircle className="w-3 h-3" />, color: 'text-cyan-400', label: `Burst Complete (${event.result.driftCorrection.toFixed(1)}m corrected)` };
      case 'BURST_DENIED':
        return { icon: <XCircle className="w-3 h-3" />, color: 'text-red-400', label: `Denied: ${event.reason}` };
      case 'BURST_ABORTED':
        return { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-yellow-400', label: `Aborted: ${event.reason}` };
      case 'DRIFT_WARNING':
        return { icon: <AlertCircle className="w-3 h-3" />, color: 'text-yellow-400', label: `Drift Warning: ${event.drift.toFixed(1)}m` };
      case 'DRIFT_CRITICAL':
        return { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-400', label: `DRIFT CRITICAL: ${event.drift.toFixed(1)}m` };
      case 'THREAT_DETECTED':
        return { icon: <Shield className="w-3 h-3" />, color: 'text-red-400', label: `Threat: ${event.zone.type}` };
      case 'SAFE_ZONE_ENTERED':
        return { icon: <CheckCircle className="w-3 h-3" />, color: 'text-green-400', label: `Safe Zone: ${event.zone.type}` };
      case 'JAMMING_DETECTED':
        return { icon: <Radio className="w-3 h-3" />, color: 'text-red-400', label: `Jamming: ${event.signalStrength}dBm` };
      case 'SPOOFING_SUSPECTED':
        return { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-400', label: `Spoofing: ${event.reason}` };
      default:
        return { icon: <Activity className="w-3 h-3" />, color: 'text-slate-400', label: event.type };
    }
  };

  return (
    <div className="h-40 overflow-y-auto space-y-1 font-mono text-xs">
      {events.length === 0 ? (
        <div className="text-slate-500 text-center py-4">No events yet</div>
      ) : (
        [...events].reverse().map((event, i) => {
          const { icon, color, label } = getEventConfig(event);
          return (
            <div key={i} className={`flex items-center gap-2 ${color}`}>
              {icon}
              <span>{label}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

// ============================================================================
// Main GPS Burst Panel Component
// ============================================================================

export function GpsBurstPanel() {
  const {
    state,
    metrics,
    simulationState,
    events,
    requestBurst,
    emergencyBurst,
    abortBurst,
    updateConfig,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    teleportDrone,
  } = useGpsBurst();

  const [selectedScenario, setSelectedScenario] = useState<string>('safeZoneTest');
  const [isRunning, setIsRunning] = useState(false);

  // Start simulation on mount
  useEffect(() => {
    return () => {
      stopSimulation();
    };
  }, [stopSimulation]);

  const handleStartSimulation = () => {
    startSimulation();
    setIsRunning(true);
  };

  const handleStopSimulation = () => {
    stopSimulation();
    setIsRunning(false);
  };

  const handleScenarioChange = (scenario: string) => {
    setSelectedScenario(scenario);
    const config = SIMULATION_SCENARIOS[scenario as keyof typeof SIMULATION_SCENARIOS];
    if (config) {
      teleportDrone(config.startPosition.lat, config.startPosition.lon, config.startPosition.alt);
    }
  };

  const safeScoreColor = state.currentSafeScore >= 0.7 ? 'green' : state.currentSafeScore >= 0.4 ? 'yellow' : 'red';
  const driftColor = state.currentDrift < 1 ? 'green' : state.currentDrift < 2 ? 'yellow' : 'red';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Satellite className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">GPS Burst Manager</h3>
            <p className="text-xs text-slate-400">Stealth GPS activation control</p>
          </div>
        </div>
        <StateBadge state={state.currentState} />
      </div>

      {/* Simulation Controls */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">Gazebo Simulation</span>
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={handleStartSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition-colors"
              >
                <Play className="w-3 h-3" />
                Start
              </button>
            ) : (
              <>
                <button
                  onClick={() => pauseSimulation(!simulationState?.paused)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30 transition-colors"
                >
                  <Pause className="w-3 h-3" />
                  {simulationState?.paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleStopSimulation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="mb-3">
          <label className="text-xs text-slate-400 block mb-1">Test Scenario</label>
          <select
            value={selectedScenario}
            onChange={(e) => handleScenarioChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            {Object.entries(SIMULATION_SCENARIOS).map(([key, scenario]) => (
              <option key={key} value={key}>{scenario.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {SIMULATION_SCENARIOS[selectedScenario as keyof typeof SIMULATION_SCENARIOS]?.description}
          </p>
        </div>

        {/* Simulation Status */}
        {simulationState && (
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900/50 rounded p-2">
              <span className="text-slate-500">Time</span>
              <div className="font-mono text-cyan-400">{simulationState.elapsedTime.toFixed(1)}s</div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <span className="text-slate-500">Position</span>
              <div className="font-mono text-cyan-400">
                {simulationState.currentPosition.lat.toFixed(4)}°
              </div>
            </div>
            <div className={`bg-slate-900/50 rounded p-2 ${simulationState.inThreatZone ? 'border border-red-500/50' : ''}`}>
              <span className="text-slate-500">Zone</span>
              <div className={`font-mono ${simulationState.inThreatZone ? 'text-red-400' : simulationState.inSafeZone ? 'text-green-400' : 'text-slate-400'}`}>
                {simulationState.inThreatZone ? 'THREAT' : simulationState.inSafeZone ? 'SAFE' : 'NEUTRAL'}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <span className="text-slate-500">Satellites</span>
              <div className="font-mono text-cyan-400">{simulationState.currentPosition.satellites}</div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Safe Score"
          value={(state.currentSafeScore * 100).toFixed(0)}
          unit="%"
          icon={<Shield className="w-4 h-4" />}
          color={safeScoreColor}
        />
        <MetricCard
          label="VIO Drift"
          value={state.currentDrift.toFixed(2)}
          unit="m"
          icon={<MapPin className="w-4 h-4" />}
          color={driftColor}
        />
        <MetricCard
          label="Bursts"
          value={`${metrics.successfulBursts}/${metrics.totalBursts}`}
          icon={<Satellite className="w-4 h-4" />}
          color="cyan"
        />
        <MetricCard
          label="GPS Exposure"
          value={(metrics.gpsExposureRatio * 100).toFixed(1)}
          unit="%"
          icon={<Radio className="w-4 h-4" />}
          color={metrics.gpsExposureRatio < 0.05 ? 'green' : metrics.gpsExposureRatio < 0.1 ? 'yellow' : 'red'}
        />
      </div>

      {/* Burst Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => requestBurst('MANUAL')}
          disabled={state.currentState !== 'IDLE'}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Satellite className="w-4 h-4" />
          Request Burst
        </button>
        <button
          onClick={emergencyBurst}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Emergency
        </button>
        {state.currentState === 'BURST_ACTIVE' && (
          <button
            onClick={abortBurst}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Abort
          </button>
        )}
      </div>

      {/* Configuration */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Burst Duration (s)</label>
            <input
              type="number"
              value={state.config.burstDuration}
              onChange={(e) => updateConfig({ burstDuration: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
              min={1}
              max={60}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Min Interval (s)</label>
            <input
              type="number"
              value={state.config.minBurstInterval}
              onChange={(e) => updateConfig({ minBurstInterval: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
              min={10}
              max={3600}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Drift Threshold (m)</label>
            <input
              type="number"
              value={state.config.driftThreshold}
              onChange={(e) => updateConfig({ driftThreshold: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
              min={0.5}
              max={10}
              step={0.5}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Safe Score Threshold</label>
            <input
              type="number"
              value={state.config.safeScoreThreshold}
              onChange={(e) => updateConfig({ safeScoreThreshold: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
              min={0}
              max={1}
              step={0.1}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={state.config.autoBurstEnabled}
              onChange={(e) => updateConfig({ autoBurstEnabled: e.target.checked })}
              className="rounded border-slate-600"
            />
            Auto-burst on drift
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={state.config.enableSpoofingDetection}
              onChange={(e) => updateConfig({ enableSpoofingDetection: e.target.checked })}
              className="rounded border-slate-600"
            />
            Spoofing detection
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={state.config.enableJammingDetection}
              onChange={(e) => updateConfig({ enableJammingDetection: e.target.checked })}
              className="rounded border-slate-600"
            />
            Jamming detection
          </label>
        </div>
      </div>

      {/* Event Log */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Event Log</h4>
        <EventLog events={events} />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-slate-400 mb-1">Avg Drift Correction</div>
          <div className="font-mono text-lg text-cyan-400">
            {metrics.averageDriftCorrection.toFixed(2)}m
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-slate-400 mb-1">Avg Burst Duration</div>
          <div className="font-mono text-lg text-cyan-400">
            {(metrics.averageBurstDuration / 1000).toFixed(1)}s
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-slate-400 mb-1">Denied Bursts</div>
          <div className="font-mono text-lg text-red-400">
            {metrics.deniedBursts}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GpsBurstPanel;
