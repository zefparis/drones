/**
 * Navigator Module - GPS Burst Manager
 * 
 * Stealth GPS management for autonomous drones.
 * Minimizes RF exposure while maintaining navigation accuracy.
 */

// Core Manager
export { GpsBurstManager, getGpsBurstManager, resetGpsBurstManager } from './GpsBurstManager';

// Gazebo Simulator
export { GazeboSimulator, getGazeboSimulator, resetGazeboSimulator } from './GazeboSimulator';

// React Hook
export { useGpsBurst, SIMULATION_SCENARIOS } from './useGpsBurst';
export type { UseGpsBurstReturn, SimulationScenario } from './useGpsBurst';

// Types
export type {
  // GPS & VIO
  GpsPosition,
  VioPosition,
  
  // Zones
  ThreatZone,
  SafeZone,
  
  // Burst State
  BurstState,
  BurstRequest,
  BurstResult,
  
  // Configuration
  GpsBurstConfig,
  BurstMetrics,
  GpsBurstState,
  
  // Events
  GpsBurstEvent,
  GpsBurstEventHandler,
  
  // Simulation
  GazeboSimConfig,
  SimulationState,
} from './types';
