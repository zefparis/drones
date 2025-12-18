/**
 * React Hook for GPS Burst Manager
 * Provides reactive state and controls for GPS burst functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GpsBurstManager, getGpsBurstManager } from './GpsBurstManager';
import { GazeboSimulator, getGazeboSimulator } from './GazeboSimulator';
import type {
  GpsBurstConfig,
  GpsBurstState,
  BurstMetrics,
  GpsBurstEvent,
  SimulationState,
  ThreatZone,
  SafeZone,
} from './types';

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseGpsBurstReturn {
  // State
  state: GpsBurstState;
  metrics: BurstMetrics;
  simulationState: SimulationState | null;
  events: GpsBurstEvent[];
  isSimulationMode: boolean;
  
  // Actions
  requestBurst: (reason?: string) => boolean;
  emergencyBurst: () => boolean;
  abortBurst: () => void;
  updateConfig: (config: Partial<GpsBurstConfig>) => void;
  
  // Simulation Controls
  startSimulation: () => void;
  stopSimulation: () => void;
  pauseSimulation: (paused: boolean) => void;
  teleportDrone: (lat: number, lon: number, alt: number) => void;
  addThreatZone: (zone: ThreatZone) => void;
  removeThreatZone: (id: string) => void;
  addSafeZone: (zone: SafeZone) => void;
  
  // Manager lifecycle
  start: () => void;
  stop: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGpsBurst(
  initialConfig?: Partial<GpsBurstConfig>,
  enableSimulation: boolean = true
): UseGpsBurstReturn {
  const managerRef = useRef<GpsBurstManager | null>(null);
  const simulatorRef = useRef<GazeboSimulator | null>(null);
  
  const [state, setState] = useState<GpsBurstState>(() => {
    const manager = getGpsBurstManager(initialConfig);
    managerRef.current = manager;
    return manager.getState();
  });
  
  const [metrics, setMetrics] = useState<BurstMetrics>(() => {
    return managerRef.current?.getMetrics() || createEmptyMetrics();
  });
  
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [events, setEvents] = useState<GpsBurstEvent[]>([]);
  const [isSimulationMode, setIsSimulationMode] = useState(enableSimulation);

  // Initialize simulator
  useEffect(() => {
    if (enableSimulation) {
      simulatorRef.current = getGazeboSimulator();
    }
    
    return () => {
      simulatorRef.current?.stop();
    };
  }, [enableSimulation]);

  // Subscribe to manager events
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;
    
    const unsubscribe = manager.on((event) => {
      // Update state on relevant events
      setState(manager.getState());
      setMetrics(manager.getMetrics());
      
      // Track events (keep last 100)
      setEvents(prev => [...prev.slice(-99), event]);
    });
    
    return unsubscribe;
  }, []);

  // Subscribe to simulator updates
  useEffect(() => {
    const simulator = simulatorRef.current;
    const manager = managerRef.current;
    if (!simulator || !manager) return;
    
    const unsubscribe = simulator.onUpdate((simState) => {
      setSimulationState(simState);
      
      // Feed simulation data to manager
      manager.updateVioPosition(simState.vioPosition);
      manager.updateThreatZones(simulator.getThreatZones());
      manager.updateSafeZones(simulator.getSafeZones());
    });
    
    return unsubscribe;
  }, []);

  // ==========================================================================
  // Actions
  // ==========================================================================

  const requestBurst = useCallback((reason?: string) => {
    const manager = managerRef.current;
    if (!manager) return false;
    
    const burstReason = reason === 'DRIFT_THRESHOLD' || reason === 'SCHEDULED' || reason === 'MANUAL' || reason === 'EMERGENCY'
      ? reason
      : 'MANUAL';
    
    return manager.requestBurst(burstReason, 'NORMAL');
  }, []);

  const emergencyBurst = useCallback(() => {
    return managerRef.current?.emergencyBurst() || false;
  }, []);

  const abortBurst = useCallback(() => {
    managerRef.current?.abortBurst('User requested');
  }, []);

  const updateConfig = useCallback((config: Partial<GpsBurstConfig>) => {
    managerRef.current?.updateConfig(config);
    setState(prev => ({ ...prev, config: { ...prev.config, ...config } }));
  }, []);

  // ==========================================================================
  // Simulation Controls
  // ==========================================================================

  const startSimulation = useCallback(() => {
    const simulator = simulatorRef.current;
    const manager = managerRef.current;
    
    if (simulator && manager) {
      simulator.start();
      manager.start();
      setIsSimulationMode(true);
    }
  }, []);

  const stopSimulation = useCallback(() => {
    simulatorRef.current?.stop();
    managerRef.current?.stop();
    setIsSimulationMode(false);
  }, []);

  const pauseSimulation = useCallback((paused: boolean) => {
    simulatorRef.current?.setPaused(paused);
  }, []);

  const teleportDrone = useCallback((lat: number, lon: number, alt: number) => {
    simulatorRef.current?.teleport(lat, lon, alt);
  }, []);

  const addThreatZone = useCallback((zone: ThreatZone) => {
    simulatorRef.current?.addThreatZone(zone);
  }, []);

  const removeThreatZone = useCallback((id: string) => {
    simulatorRef.current?.removeThreatZone(id);
  }, []);

  const addSafeZone = useCallback((zone: SafeZone) => {
    simulatorRef.current?.addSafeZone(zone);
  }, []);

  // ==========================================================================
  // Manager Lifecycle
  // ==========================================================================

  const start = useCallback(() => {
    managerRef.current?.start();
  }, []);

  const stop = useCallback(() => {
    managerRef.current?.stop();
  }, []);

  return {
    state,
    metrics,
    simulationState,
    events,
    isSimulationMode,
    requestBurst,
    emergencyBurst,
    abortBurst,
    updateConfig,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    teleportDrone,
    addThreatZone,
    removeThreatZone,
    addSafeZone,
    start,
    stop,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function createEmptyMetrics(): BurstMetrics {
  return {
    totalBursts: 0,
    successfulBursts: 0,
    failedBursts: 0,
    deniedBursts: 0,
    averageDriftCorrection: 0,
    averageBurstDuration: 0,
    lastBurstTime: null,
    consecutiveDenials: 0,
    totalGpsOnTime: 0,
    totalMissionTime: 0,
    gpsExposureRatio: 0,
  };
}

// ============================================================================
// Preset Scenarios for Testing
// ============================================================================

export const SIMULATION_SCENARIOS = {
  // Safe zone navigation - should allow bursts
  safeZoneTest: {
    name: 'Safe Zone Navigation',
    description: 'Drone navigates through safe zones, bursts should be allowed',
    startPosition: { lat: 48.8560, lon: 2.3510, alt: 50 },
    waypoints: [
      { lat: 48.8565, lon: 2.3515, alt: 50 },
      { lat: 48.8570, lon: 2.3520, alt: 50 },
    ],
  },
  
  // Threat zone avoidance - bursts should be denied
  threatZoneTest: {
    name: 'Threat Zone Test',
    description: 'Drone enters threat zone, bursts should be denied',
    startPosition: { lat: 48.8578, lon: 2.3538, alt: 50 },
    waypoints: [
      { lat: 48.8580, lon: 2.3540, alt: 50 }, // Into radar zone
    ],
  },
  
  // Drift accumulation test
  driftTest: {
    name: 'Drift Accumulation',
    description: 'Long flight without GPS, drift triggers auto-burst',
    startPosition: { lat: 48.8550, lon: 2.3500, alt: 50 },
    waypoints: [
      { lat: 48.8555, lon: 2.3505, alt: 50 },
      { lat: 48.8560, lon: 2.3510, alt: 50 },
      { lat: 48.8565, lon: 2.3515, alt: 50 },
    ],
  },
  
  // Mixed navigation
  mixedTest: {
    name: 'Mixed Environment',
    description: 'Navigation through mixed safe/threat zones',
    startPosition: { lat: 48.8555, lon: 2.3505, alt: 50 },
    waypoints: [
      { lat: 48.8560, lon: 2.3510, alt: 50 }, // Safe zone
      { lat: 48.8575, lon: 2.3530, alt: 50 }, // Urban canyon
      { lat: 48.8578, lon: 2.3538, alt: 50 }, // Near radar
      { lat: 48.8560, lon: 2.3510, alt: 50 }, // Back to safe
    ],
  },
};

export type SimulationScenario = keyof typeof SIMULATION_SCENARIOS;
