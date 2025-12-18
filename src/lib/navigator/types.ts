/**
 * Navigator Module Types
 * Types for GPS Burst Manager and Navigation
 */

// ============================================================================
// GPS Burst Manager Types
// ============================================================================

export interface GpsPosition {
  lat: number;
  lon: number;
  alt: number;
  accuracy: number;      // meters
  satellites: number;
  hdop: number;
  timestamp: number;
}

export interface VioPosition {
  x: number;             // meters from origin
  y: number;
  z: number;
  drift: number;         // estimated drift in meters
  confidence: number;    // 0-1
  featureCount: number;
  timestamp: number;
}

export interface ThreatZone {
  id: string;
  type: 'RF_DETECTION' | 'RADAR' | 'VISUAL' | 'ACOUSTIC' | 'CUSTOM';
  center: { lat: number; lon: number };
  radius: number;        // meters
  threatLevel: number;   // 0-1
  active: boolean;
  lastUpdate: number;
}

export interface SafeZone {
  id: string;
  type: 'CLEAR' | 'TERRAIN_MASKED' | 'RF_SHADOW' | 'URBAN_CANYON';
  center: { lat: number; lon: number };
  radius: number;
  safeScore: number;     // 0-1
  validUntil: number;
}

export type BurstState = 
  | 'IDLE'           // GPS off, VIO only
  | 'EVALUATING'     // Checking if burst is safe
  | 'BURST_ACTIVE'   // GPS on, acquiring fix
  | 'COOLDOWN'       // Post-burst cooldown
  | 'DENIED';        // Burst denied (unsafe)

export interface BurstRequest {
  reason: 'DRIFT_THRESHOLD' | 'SCHEDULED' | 'MANUAL' | 'EMERGENCY';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  requestedDuration: number;  // seconds
  timestamp: number;
}

export interface BurstResult {
  success: boolean;
  duration: number;           // actual duration in ms
  positionBefore: VioPosition | null;
  positionAfter: GpsPosition | null;
  driftCorrection: number;    // meters
  satellitesAcquired: number;
  threatDetected: boolean;
  abortReason?: string;
}

export interface GpsBurstConfig {
  // Timing
  burstDuration: number;        // seconds (default: 10)
  minBurstInterval: number;     // seconds between bursts (default: 300)
  maxBurstInterval: number;     // seconds max without burst (default: 1800)
  cooldownDuration: number;     // seconds post-burst (default: 30)
  
  // Thresholds
  driftThreshold: number;       // meters to trigger burst (default: 2.0)
  safeScoreThreshold: number;   // minimum safe score (default: 0.7)
  hdopThreshold: number;        // max acceptable HDOP (default: 2.0)
  minSatellites: number;        // minimum satellites (default: 6)
  
  // Safety
  enableSpoofingDetection: boolean;
  enableJammingDetection: boolean;
  jammingThreshold: number;     // dBm (default: -80)
  maxConsecutiveBursts: number; // (default: 3)
  emergencyBurstEnabled: boolean;
  
  // Automation
  autoBurstEnabled: boolean;
  scheduleEnabled: boolean;
  burstSchedule: number[];      // hours of day for scheduled bursts
}

export interface BurstMetrics {
  totalBursts: number;
  successfulBursts: number;
  failedBursts: number;
  deniedBursts: number;
  averageDriftCorrection: number;
  averageBurstDuration: number;
  lastBurstTime: number | null;
  consecutiveDenials: number;
  totalGpsOnTime: number;       // ms
  totalMissionTime: number;     // ms
  gpsExposureRatio: number;     // totalGpsOnTime / totalMissionTime
}

export interface GpsBurstState {
  currentState: BurstState;
  config: GpsBurstConfig;
  metrics: BurstMetrics;
  lastGpsPosition: GpsPosition | null;
  currentVioPosition: VioPosition | null;
  currentDrift: number;
  threatZones: ThreatZone[];
  safeZones: SafeZone[];
  currentSafeScore: number;
  pendingRequest: BurstRequest | null;
  lastBurstResult: BurstResult | null;
  missionStartTime: number;
}

// ============================================================================
// Events
// ============================================================================

export type GpsBurstEvent =
  | { type: 'BURST_REQUESTED'; request: BurstRequest }
  | { type: 'BURST_APPROVED'; request: BurstRequest }
  | { type: 'BURST_DENIED'; reason: string }
  | { type: 'BURST_STARTED'; timestamp: number }
  | { type: 'BURST_COMPLETED'; result: BurstResult }
  | { type: 'BURST_ABORTED'; reason: string }
  | { type: 'DRIFT_WARNING'; drift: number }
  | { type: 'DRIFT_CRITICAL'; drift: number }
  | { type: 'THREAT_DETECTED'; zone: ThreatZone }
  | { type: 'SAFE_ZONE_ENTERED'; zone: SafeZone }
  | { type: 'JAMMING_DETECTED'; signalStrength: number }
  | { type: 'SPOOFING_SUSPECTED'; reason: string }
  | { type: 'STATE_CHANGED'; from: BurstState; to: BurstState };

export type GpsBurstEventHandler = (event: GpsBurstEvent) => void;

// ============================================================================
// Gazebo Simulation Types
// ============================================================================

export interface GazeboSimConfig {
  worldName: string;
  droneModel: string;
  startPosition: { lat: number; lon: number; alt: number };
  threatZones: ThreatZone[];
  safeZones: SafeZone[];
  gpsNoiseStdDev: number;       // meters
  vioNoiseStdDev: number;       // meters
  vioDriftRate: number;         // meters per second
  simulationSpeed: number;      // 1.0 = realtime
}

export interface SimulationState {
  running: boolean;
  paused: boolean;
  elapsedTime: number;          // seconds
  currentPosition: GpsPosition;
  vioPosition: VioPosition;
  inThreatZone: boolean;
  inSafeZone: boolean;
  currentThreatLevel: number;
  currentSafeScore: number;
}
