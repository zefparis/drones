/**
 * FSM Visualizer - Finite State Machine Real-time Visualization
 * Animated state transitions with military styling
 */

import { useEffect, useState } from 'react';

interface FSMVisualizerProps {
  currentState?: string;
  previousState?: string;
  availableTransitions?: string[];
}

const STATE_CONFIG: Record<string, { color: string; icon: string; description: string }> = {
  IDLE: { color: 'slate', icon: '⏸', description: 'System standby' },
  INITIALIZING: { color: 'blue', icon: '⚡', description: 'Boot sequence' },
  ARMED: { color: 'amber', icon: '🔓', description: 'Ready for takeoff' },
  TAKEOFF: { color: 'cyan', icon: '🚀', description: 'Ascending' },
  HOVER: { color: 'green', icon: '🔄', description: 'Position hold' },
  WAYPOINT: { color: 'purple', icon: '📍', description: 'Navigation active' },
  RTH: { color: 'orange', icon: '🏠', description: 'Return to home' },
  LANDING: { color: 'yellow', icon: '⬇', description: 'Descending' },
  EMERGENCY: { color: 'red', icon: '🚨', description: 'Emergency mode' },
  GPS_DENIED: { color: 'pink', icon: '📡', description: 'Visual navigation' },
  THREAT_EVADE: { color: 'red', icon: '⚠', description: 'Threat evasion' },
};

// State transitions (for future use)
// const STATE_FLOW = [
//   ['IDLE', 'INITIALIZING'],
//   ['INITIALIZING', 'ARMED'],
//   ['ARMED', 'TAKEOFF'],
//   ['TAKEOFF', 'HOVER'],
//   ['HOVER', 'WAYPOINT'],
//   ['WAYPOINT', 'HOVER'],
//   ['HOVER', 'RTH'],
//   ['RTH', 'LANDING'],
//   ['LANDING', 'IDLE'],
// ];

export function FSMVisualizer({ currentState = 'IDLE', previousState, availableTransitions = [] }: FSMVisualizerProps) {
  const [animatingState, setAnimatingState] = useState<string | null>(null);

  useEffect(() => {
    if (previousState && previousState !== currentState) {
      setAnimatingState(currentState);
      const timer = setTimeout(() => setAnimatingState(null), 500);
      return () => clearTimeout(timer);
    }
  }, [currentState, previousState]);

  const config = STATE_CONFIG[currentState] || STATE_CONFIG.IDLE;

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      slate: { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400' },
      blue: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
      amber: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400' },
      cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400' },
      green: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
      purple: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
      orange: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
      yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' },
      red: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' },
      pink: { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-400' },
    };
    const c = colors[color] || colors.slate;
    return isActive ? `${c.bg} ${c.border} ${c.text}` : 'bg-slate-800/50 border-slate-700 text-slate-600';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-cyan-400 tracking-wider">FSM STATE</h3>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${currentState === 'EMERGENCY' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-xs text-slate-500">ACTIVE</span>
        </div>
      </div>

      {/* Current State Display */}
      <div
        className={`
          relative p-4 rounded-lg border-2 mb-4 transition-all duration-300
          ${getColorClasses(config.color, true)}
          ${animatingState ? 'scale-105' : 'scale-100'}
        `}
      >
        {/* Pulse Animation for Active State */}
        <div className={`absolute inset-0 rounded-lg ${getColorClasses(config.color, true).split(' ')[0]} animate-pulse opacity-50`} />
        
        <div className="relative flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <div className={`text-xl font-bold font-mono tracking-wider ${getColorClasses(config.color, true).split(' ')[2]}`}>
              {currentState}
            </div>
            <div className="text-xs text-slate-400">{config.description}</div>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-50" />
      </div>

      {/* State Flow Mini Map */}
      <div className="flex-1 overflow-hidden">
        <div className="text-xs text-slate-500 mb-2">State Flow</div>
        <div className="grid grid-cols-3 gap-1">
          {Object.keys(STATE_CONFIG).slice(0, 9).map((state) => {
            const stateConfig = STATE_CONFIG[state];
            const isActive = state === currentState;
            const isAvailable = availableTransitions.includes(state);

            return (
              <div
                key={state}
                className={`
                  p-1.5 rounded text-center text-xs font-mono border transition-all
                  ${isActive ? getColorClasses(stateConfig.color, true) : ''}
                  ${isAvailable && !isActive ? 'border-dashed border-slate-600 text-slate-500' : ''}
                  ${!isActive && !isAvailable ? 'border-slate-800 text-slate-700' : ''}
                `}
              >
                <div className="text-sm">{stateConfig.icon}</div>
                <div className="truncate">{state}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transition History */}
      {previousState && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{previousState}</span>
            <span>→</span>
            <span className={`font-mono ${getColorClasses(config.color, true).split(' ')[2]}`}>{currentState}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FSMVisualizer;
