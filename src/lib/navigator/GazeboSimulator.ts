/**
 * Gazebo Simulator Mock for GPS Burst Testing
 * 
 * Simulates drone navigation with:
 * - VIO drift accumulation
 * - Safe/threat zone transitions
 * - GPS signal quality variations
 * - Realistic position updates
 */

import type {
  GpsPosition,
  VioPosition,
  ThreatZone,
  SafeZone,
  GazeboSimConfig,
  SimulationState,
} from './types';

// ============================================================================
// Default Simulation Config
// ============================================================================

const DEFAULT_SIM_CONFIG: GazeboSimConfig = {
  worldName: 'cortex_test_world',
  droneModel: 'cortex_u7',
  startPosition: { lat: 48.8566, lon: 2.3522, alt: 50 }, // Paris
  threatZones: [
    {
      id: 'radar_1',
      type: 'RADAR',
      center: { lat: 48.8580, lon: 2.3540 },
      radius: 200,
      threatLevel: 0.9,
      active: true,
      lastUpdate: Date.now(),
    },
    {
      id: 'rf_detection_1',
      type: 'RF_DETECTION',
      center: { lat: 48.8550, lon: 2.3500 },
      radius: 150,
      threatLevel: 0.7,
      active: true,
      lastUpdate: Date.now(),
    },
  ],
  safeZones: [
    {
      id: 'terrain_mask_1',
      type: 'TERRAIN_MASKED',
      center: { lat: 48.8560, lon: 2.3510 },
      radius: 100,
      safeScore: 0.9,
      validUntil: Date.now() + 3600000,
    },
    {
      id: 'urban_canyon_1',
      type: 'URBAN_CANYON',
      center: { lat: 48.8575, lon: 2.3530 },
      radius: 80,
      safeScore: 0.85,
      validUntil: Date.now() + 3600000,
    },
  ],
  gpsNoiseStdDev: 2.5,      // meters
  vioNoiseStdDev: 0.1,      // meters
  vioDriftRate: 0.02,       // meters per second
  simulationSpeed: 1.0,
};

// ============================================================================
// Gazebo Simulator Class
// ============================================================================

export class GazeboSimulator {
  private config: GazeboSimConfig;
  private state: SimulationState;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: SimulationState) => void> = new Set();
  
  // Internal simulation state
  private truePosition: { lat: number; lon: number; alt: number };
  private vioOrigin: { lat: number; lon: number; alt: number };
  private vioCumulative: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private velocity: { vx: number; vy: number; vz: number } = { vx: 0, vy: 0, vz: 0 };
  private heading: number = 0;
  private waypoints: Array<{ lat: number; lon: number; alt: number }> = [];
  private currentWaypointIndex: number = 0;

  constructor(config: Partial<GazeboSimConfig> = {}) {
    this.config = { ...DEFAULT_SIM_CONFIG, ...config };
    this.truePosition = { ...this.config.startPosition };
    this.vioOrigin = { ...this.config.startPosition };
    
    // Initialize state with default values first (before calling methods that depend on state)
    this.state = {
      running: false,
      paused: false,
      elapsedTime: 0,
      currentPosition: this.createInitialGpsPosition(),
      vioPosition: this.createInitialVioPosition(),
      inThreatZone: false,
      inSafeZone: false,
      currentThreatLevel: 0,
      currentSafeScore: 1.0,
    };
  }

  // Initial position creators that don't depend on state
  private createInitialGpsPosition(): GpsPosition {
    return {
      lat: this.truePosition.lat,
      lon: this.truePosition.lon,
      alt: this.truePosition.alt,
      accuracy: this.config.gpsNoiseStdDev,
      satellites: 12,
      hdop: 1.0,
      timestamp: Date.now(),
    };
  }

  private createInitialVioPosition(): VioPosition {
    return {
      x: 0,
      y: 0,
      z: 0,
      drift: 0,
      confidence: 1.0,
      featureCount: 150,
      timestamp: Date.now(),
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Start simulation
   */
  start(): void {
    if (this.state.running) return;
    
    this.state.running = true;
    this.state.paused = false;
    this.state.elapsedTime = 0;
    
    const updateRate = 50 * this.config.simulationSpeed; // 50ms base, adjusted for speed
    
    this.updateInterval = setInterval(() => {
      if (!this.state.paused) {
        this.update(updateRate / 1000);
      }
    }, updateRate);
    
    console.log('[GazeboSimulator] Started simulation:', this.config.worldName);
  }

  /**
   * Stop simulation
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.state.running = false;
    console.log('[GazeboSimulator] Stopped simulation');
  }

  /**
   * Pause/resume simulation
   */
  setPaused(paused: boolean): void {
    this.state.paused = paused;
  }

  /**
   * Set waypoints for autonomous navigation
   */
  setWaypoints(waypoints: Array<{ lat: number; lon: number; alt: number }>): void {
    this.waypoints = waypoints;
    this.currentWaypointIndex = 0;
  }

  /**
   * Teleport drone to position (for testing)
   */
  teleport(lat: number, lon: number, alt: number): void {
    this.truePosition = { lat, lon, alt };
    this.vioOrigin = { lat, lon, alt };
    this.vioCumulative = { x: 0, y: 0, z: 0 };
    this.updateState();
  }

  /**
   * Add a threat zone dynamically
   */
  addThreatZone(zone: ThreatZone): void {
    this.config.threatZones.push(zone);
    this.updateZoneStatus();
  }

  /**
   * Remove a threat zone
   */
  removeThreatZone(id: string): void {
    this.config.threatZones = this.config.threatZones.filter(z => z.id !== id);
    this.updateZoneStatus();
  }

  /**
   * Add a safe zone dynamically
   */
  addSafeZone(zone: SafeZone): void {
    this.config.safeZones.push(zone);
    this.updateZoneStatus();
  }

  /**
   * Get current GPS position (with noise)
   */
  getGpsPosition(): GpsPosition {
    return this.state.currentPosition;
  }

  /**
   * Get current VIO position (with drift)
   */
  getVioPosition(): VioPosition {
    return this.state.vioPosition;
  }

  /**
   * Get threat zones
   */
  getThreatZones(): ThreatZone[] {
    return [...this.config.threatZones];
  }

  /**
   * Get safe zones
   */
  getSafeZones(): SafeZone[] {
    return [...this.config.safeZones];
  }

  /**
   * Get current state
   */
  getState(): SimulationState {
    return { ...this.state };
  }

  /**
   * Get internal navigation state (for debugging/telemetry)
   */
  getInternalState(): {
    vioOrigin: { lat: number; lon: number; alt: number };
    velocity: { vx: number; vy: number; vz: number };
    heading: number;
  } {
    return {
      vioOrigin: { ...this.vioOrigin },
      velocity: { ...this.velocity },
      heading: this.heading,
    };
  }

  /**
   * Subscribe to state updates
   */
  onUpdate(callback: (state: SimulationState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Simulate GPS burst - returns position and resets VIO drift
   */
  simulateGpsBurst(durationMs: number): Promise<{ 
    position: GpsPosition; 
    driftCorrection: number;
    success: boolean;
  }> {
    return new Promise((resolve) => {
      const driftBefore = this.calculateVioOffset();
      
      // Simulate GPS acquisition time
      setTimeout(() => {
        // Check if in threat zone (might fail to acquire)
        if (this.state.inThreatZone && Math.random() < this.state.currentThreatLevel) {
          resolve({
            position: this.state.currentPosition,
            driftCorrection: 0,
            success: false,
          });
          return;
        }
        
        // Reset VIO origin to current GPS position
        this.vioOrigin = { ...this.truePosition };
        this.vioCumulative = { x: 0, y: 0, z: 0 };
        
        resolve({
          position: this.createGpsPosition(),
          driftCorrection: driftBefore,
          success: true,
        });
      }, durationMs);
    });
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private update(deltaTime: number): void {
    this.state.elapsedTime += deltaTime;
    
    // Update position if following waypoints
    if (this.waypoints.length > 0) {
      this.updateWaypointNavigation(deltaTime);
    }
    
    // Accumulate VIO drift
    this.accumulateVioDrift(deltaTime);
    
    // Update state
    this.updateState();
    
    // Notify listeners
    this.notifyListeners();
  }

  private updateWaypointNavigation(deltaTime: number): void {
    if (this.currentWaypointIndex >= this.waypoints.length) return;
    
    const target = this.waypoints[this.currentWaypointIndex];
    const distance = this.haversineDistance(
      this.truePosition.lat, this.truePosition.lon,
      target.lat, target.lon
    );
    
    // Waypoint reached?
    if (distance < 2) {
      this.currentWaypointIndex++;
      return;
    }
    
    // Move towards waypoint
    const speed = 5; // m/s
    const moveDistance = speed * deltaTime;
    const bearing = this.calculateBearing(
      this.truePosition.lat, this.truePosition.lon,
      target.lat, target.lon
    );
    
    this.heading = bearing;
    const newPos = this.movePosition(
      this.truePosition.lat, this.truePosition.lon,
      bearing, moveDistance
    );
    
    this.truePosition.lat = newPos.lat;
    this.truePosition.lon = newPos.lon;
    
    // Altitude interpolation
    const altDiff = target.alt - this.truePosition.alt;
    this.truePosition.alt += Math.sign(altDiff) * Math.min(Math.abs(altDiff), 2 * deltaTime);
    
    // Update velocity estimate
    this.velocity = {
      vx: moveDistance * Math.sin(bearing * Math.PI / 180) / deltaTime,
      vy: moveDistance * Math.cos(bearing * Math.PI / 180) / deltaTime,
      vz: (target.alt - this.truePosition.alt) / deltaTime,
    };
  }

  private accumulateVioDrift(deltaTime: number): void {
    // VIO drift accumulates over time
    const driftRate = this.config.vioDriftRate;
    const noise = this.config.vioNoiseStdDev;
    
    this.vioCumulative.x += driftRate * deltaTime + this.gaussianRandom() * noise * deltaTime;
    this.vioCumulative.y += driftRate * deltaTime + this.gaussianRandom() * noise * deltaTime;
    this.vioCumulative.z += driftRate * deltaTime * 0.5 + this.gaussianRandom() * noise * deltaTime * 0.5;
  }

  private updateState(): void {
    this.state.currentPosition = this.createGpsPosition();
    this.state.vioPosition = this.createVioPosition();
    this.updateZoneStatus();
  }

  private updateZoneStatus(): void {
    // Check threat zones
    let maxThreat = 0;
    let inThreat = false;
    
    for (const zone of this.config.threatZones) {
      if (!zone.active) continue;
      const dist = this.haversineDistance(
        this.truePosition.lat, this.truePosition.lon,
        zone.center.lat, zone.center.lon
      );
      if (dist < zone.radius) {
        inThreat = true;
        maxThreat = Math.max(maxThreat, zone.threatLevel);
      }
    }
    
    this.state.inThreatZone = inThreat;
    this.state.currentThreatLevel = maxThreat;
    
    // Check safe zones
    let maxSafe = 0;
    let inSafe = false;
    
    for (const zone of this.config.safeZones) {
      if (zone.validUntil < Date.now()) continue;
      const dist = this.haversineDistance(
        this.truePosition.lat, this.truePosition.lon,
        zone.center.lat, zone.center.lon
      );
      if (dist < zone.radius) {
        inSafe = true;
        maxSafe = Math.max(maxSafe, zone.safeScore);
      }
    }
    
    this.state.inSafeZone = inSafe;
    
    // Calculate overall safe score
    if (inThreat) {
      this.state.currentSafeScore = Math.max(0, 1 - maxThreat);
    } else if (inSafe) {
      this.state.currentSafeScore = maxSafe;
    } else {
      this.state.currentSafeScore = 0.7; // Default neutral zone
    }
  }

  private createGpsPosition(): GpsPosition {
    const noise = this.config.gpsNoiseStdDev;
    
    // Add noise to true position
    const latNoise = this.gaussianRandom() * noise / 111000; // ~111km per degree
    const lonNoise = this.gaussianRandom() * noise / (111000 * Math.cos(this.truePosition.lat * Math.PI / 180));
    const altNoise = this.gaussianRandom() * noise * 1.5; // Altitude less accurate
    
    // Simulate satellite count based on conditions
    let satellites = 12 + Math.floor(this.gaussianRandom() * 3);
    if (this.state.inThreatZone) {
      // Jamming reduces satellites
      satellites = Math.max(0, satellites - Math.floor(this.state.currentThreatLevel * 8));
    }
    
    // HDOP based on satellites
    const hdop = satellites > 0 ? 1.0 + (12 - satellites) * 0.2 + Math.abs(this.gaussianRandom() * 0.3) : 99;
    
    return {
      lat: this.truePosition.lat + latNoise,
      lon: this.truePosition.lon + lonNoise,
      alt: this.truePosition.alt + altNoise,
      accuracy: noise * (1 + hdop * 0.5),
      satellites,
      hdop,
      timestamp: Date.now(),
    };
  }

  private createVioPosition(): VioPosition {
    const drift = this.calculateVioOffset();
    
    return {
      x: this.vioCumulative.x,
      y: this.vioCumulative.y,
      z: this.vioCumulative.z,
      drift,
      confidence: Math.max(0.3, 1 - drift / 10), // Confidence decreases with drift
      featureCount: 150 + Math.floor(this.gaussianRandom() * 50),
      timestamp: Date.now(),
    };
  }

  private calculateVioOffset(): number {
    return Math.sqrt(
      this.vioCumulative.x ** 2 +
      this.vioCumulative.y ** 2 +
      this.vioCumulative.z ** 2
    );
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(cb => {
      try {
        cb(state);
      } catch (e) {
        console.error('[GazeboSimulator] Listener error:', e);
      }
    });
  }

  // ==========================================================================
  // Math Utilities
  // ==========================================================================

  private gaussianRandom(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  private movePosition(lat: number, lon: number, bearing: number, distance: number): { lat: number; lon: number } {
    const R = 6371000;
    const d = distance / R;
    const brng = bearing * Math.PI / 180;
    const lat1 = lat * Math.PI / 180;
    const lon1 = lon * Math.PI / 180;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    return {
      lat: lat2 * 180 / Math.PI,
      lon: lon2 * 180 / Math.PI,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let simulatorInstance: GazeboSimulator | null = null;

export function getGazeboSimulator(config?: Partial<GazeboSimConfig>): GazeboSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new GazeboSimulator(config);
  }
  return simulatorInstance;
}

export function resetGazeboSimulator(): void {
  if (simulatorInstance) {
    simulatorInstance.stop();
    simulatorInstance = null;
  }
}
