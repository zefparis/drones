/**
 * GPS Burst Manager for CORTEX-U7 Navigator Module
 * 
 * Manages stealth GPS activation in short bursts to minimize RF exposure
 * while maintaining navigation accuracy through VIO drift correction.
 * 
 * Key Features:
 * - Safe zone evaluation before GPS activation
 * - Configurable burst duration and intervals
 * - Threat zone avoidance
 * - Spoofing/jamming detection
 * - VIO drift monitoring and automatic burst triggering
 */

import type {
  GpsPosition,
  VioPosition,
  ThreatZone,
  SafeZone,
  BurstState,
  BurstRequest,
  BurstResult,
  GpsBurstConfig,
  BurstMetrics,
  GpsBurstState,
  GpsBurstEvent,
  GpsBurstEventHandler,
} from './types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: GpsBurstConfig = {
  // Timing
  burstDuration: 10,           // 10 seconds
  minBurstInterval: 300,       // 5 minutes minimum between bursts
  maxBurstInterval: 1800,      // 30 minutes max without burst
  cooldownDuration: 30,        // 30 seconds cooldown
  
  // Thresholds
  driftThreshold: 2.0,         // 2 meters drift triggers burst
  safeScoreThreshold: 0.7,     // 70% safe score required
  hdopThreshold: 2.0,          // HDOP must be < 2.0
  minSatellites: 6,            // At least 6 satellites
  
  // Safety
  enableSpoofingDetection: true,
  enableJammingDetection: true,
  jammingThreshold: -80,       // -80 dBm
  maxConsecutiveBursts: 3,
  emergencyBurstEnabled: true,
  
  // Automation
  autoBurstEnabled: true,
  scheduleEnabled: false,
  burstSchedule: [],
};

// ============================================================================
// GPS Burst Manager Class
// ============================================================================

export class GpsBurstManager {
  private state: GpsBurstState;
  private eventHandlers: Set<GpsBurstEventHandler> = new Set();
  private burstTimer: ReturnType<typeof setTimeout> | null = null;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private driftCheckInterval: ReturnType<typeof setInterval> | null = null;
  private scheduledBurstTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<GpsBurstConfig> = {}) {
    this.state = {
      currentState: 'IDLE',
      config: { ...DEFAULT_CONFIG, ...config },
      metrics: this.createInitialMetrics(),
      lastGpsPosition: null,
      currentVioPosition: null,
      currentDrift: 0,
      threatZones: [],
      safeZones: [],
      currentSafeScore: 1.0,
      pendingRequest: null,
      lastBurstResult: null,
      missionStartTime: Date.now(),
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Start the GPS Burst Manager
   */
  start(): void {
    this.state.missionStartTime = Date.now();
    this.startDriftMonitoring();
    
    if (this.state.config.scheduleEnabled) {
      this.startScheduledBursts();
    }
    
    console.log('[GpsBurstManager] Started with config:', this.state.config);
  }

  /**
   * Stop the GPS Burst Manager
   */
  stop(): void {
    this.stopDriftMonitoring();
    this.stopScheduledBursts();
    this.cancelPendingBurst();
    this.setState('IDLE');
    console.log('[GpsBurstManager] Stopped');
  }

  /**
   * Request a GPS burst
   */
  requestBurst(
    reason: BurstRequest['reason'] = 'MANUAL',
    priority: BurstRequest['priority'] = 'NORMAL'
  ): boolean {
    const request: BurstRequest = {
      reason,
      priority,
      requestedDuration: this.state.config.burstDuration,
      timestamp: Date.now(),
    };

    this.emit({ type: 'BURST_REQUESTED', request });

    // Check if burst is allowed
    const evaluation = this.evaluateBurstRequest(request);
    
    if (!evaluation.allowed) {
      this.state.metrics.deniedBursts++;
      this.state.metrics.consecutiveDenials++;
      this.emit({ type: 'BURST_DENIED', reason: evaluation.reason });
      this.setState('DENIED');
      
      // Auto-recover from DENIED state after short delay
      setTimeout(() => {
        if (this.state.currentState === 'DENIED') {
          this.setState('IDLE');
        }
      }, 2000);
      
      return false;
    }

    this.state.metrics.consecutiveDenials = 0;
    this.state.pendingRequest = request;
    this.emit({ type: 'BURST_APPROVED', request });
    
    return this.executeBurst(request);
  }

  /**
   * Emergency burst - bypasses most safety checks
   */
  emergencyBurst(): boolean {
    if (!this.state.config.emergencyBurstEnabled) {
      console.warn('[GpsBurstManager] Emergency burst disabled');
      return false;
    }

    return this.requestBurst('EMERGENCY', 'CRITICAL');
  }

  /**
   * Abort current burst
   */
  abortBurst(reason: string = 'User requested'): void {
    if (this.state.currentState !== 'BURST_ACTIVE') {
      return;
    }

    if (this.burstTimer) {
      clearTimeout(this.burstTimer);
      this.burstTimer = null;
    }

    this.emit({ type: 'BURST_ABORTED', reason });
    this.startCooldown();
  }

  /**
   * Update VIO position (call this frequently)
   */
  updateVioPosition(position: VioPosition): void {
    this.state.currentVioPosition = position;
    this.state.currentDrift = position.drift;

    // Check drift thresholds
    if (position.drift >= this.state.config.driftThreshold) {
      this.emit({ type: 'DRIFT_WARNING', drift: position.drift });
      
      // Auto-burst if enabled and conditions met
      if (this.state.config.autoBurstEnabled && this.state.currentState === 'IDLE') {
        this.requestBurst('DRIFT_THRESHOLD', 'HIGH');
      }
    }

    if (position.drift >= this.state.config.driftThreshold * 2) {
      this.emit({ type: 'DRIFT_CRITICAL', drift: position.drift });
    }
  }

  /**
   * Update threat zones
   */
  updateThreatZones(zones: ThreatZone[]): void {
    this.state.threatZones = zones;
    this.recalculateSafeScore();

    // Check if we entered a threat zone during burst
    if (this.state.currentState === 'BURST_ACTIVE') {
      const inThreat = this.isInThreatZone();
      if (inThreat) {
        const zone = this.getCurrentThreatZone();
        if (zone) {
          this.emit({ type: 'THREAT_DETECTED', zone });
          this.abortBurst('Entered threat zone');
        }
      }
    }
  }

  /**
   * Update safe zones
   */
  updateSafeZones(zones: SafeZone[]): void {
    this.state.safeZones = zones;
    this.recalculateSafeScore();

    // Check if we entered a safe zone
    const safeZone = this.getCurrentSafeZone();
    if (safeZone && this.state.currentSafeScore >= this.state.config.safeScoreThreshold) {
      this.emit({ type: 'SAFE_ZONE_ENTERED', zone: safeZone });
    }
  }

  /**
   * Report GPS fix received (call from GPS receiver)
   */
  reportGpsFix(position: GpsPosition): void {
    if (this.state.currentState !== 'BURST_ACTIVE') {
      console.warn('[GpsBurstManager] GPS fix received but not in BURST_ACTIVE state');
      return;
    }

    // Spoofing detection
    if (this.state.config.enableSpoofingDetection) {
      const spoofing = this.detectSpoofing(position);
      if (spoofing.detected) {
        this.emit({ type: 'SPOOFING_SUSPECTED', reason: spoofing.reason });
        this.abortBurst('Spoofing detected: ' + spoofing.reason);
        return;
      }
    }

    this.state.lastGpsPosition = position;
  }

  /**
   * Report signal strength (for jamming detection)
   */
  reportSignalStrength(rssi: number): void {
    if (this.state.config.enableJammingDetection) {
      if (rssi < this.state.config.jammingThreshold) {
        this.emit({ type: 'JAMMING_DETECTED', signalStrength: rssi });
        
        if (this.state.currentState === 'BURST_ACTIVE') {
          this.abortBurst('Jamming detected');
        }
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GpsBurstConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    
    // Restart scheduled bursts if schedule changed
    if (config.scheduleEnabled !== undefined || config.burstSchedule !== undefined) {
      this.stopScheduledBursts();
      if (this.state.config.scheduleEnabled) {
        this.startScheduledBursts();
      }
    }
  }

  /**
   * Get current state
   */
  getState(): Readonly<GpsBurstState> {
    return { ...this.state };
  }

  /**
   * Get metrics
   */
  getMetrics(): Readonly<BurstMetrics> {
    // Update exposure ratio
    const missionTime = Date.now() - this.state.missionStartTime;
    this.state.metrics.totalMissionTime = missionTime;
    this.state.metrics.gpsExposureRatio = 
      missionTime > 0 ? this.state.metrics.totalGpsOnTime / missionTime : 0;
    
    return { ...this.state.metrics };
  }

  /**
   * Subscribe to events
   */
  on(handler: GpsBurstEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private createInitialMetrics(): BurstMetrics {
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

  private emit(event: GpsBurstEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[GpsBurstManager] Event handler error:', e);
      }
    });
  }

  private setState(newState: BurstState): void {
    const oldState = this.state.currentState;
    if (oldState !== newState) {
      this.state.currentState = newState;
      this.emit({ type: 'STATE_CHANGED', from: oldState, to: newState });
    }
  }

  private evaluateBurstRequest(request: BurstRequest): { allowed: boolean; reason: string } {
    // Emergency requests bypass most checks
    if (request.priority === 'CRITICAL' && request.reason === 'EMERGENCY') {
      // Only check for active jamming
      if (this.state.currentState === 'BURST_ACTIVE') {
        return { allowed: false, reason: 'Burst already active' };
      }
      return { allowed: true, reason: 'Emergency burst approved' };
    }

    // Check current state
    if (this.state.currentState === 'BURST_ACTIVE') {
      return { allowed: false, reason: 'Burst already active' };
    }
    if (this.state.currentState === 'COOLDOWN') {
      return { allowed: false, reason: 'In cooldown period' };
    }

    // Check minimum interval
    if (this.state.metrics.lastBurstTime) {
      const timeSinceLastBurst = (Date.now() - this.state.metrics.lastBurstTime) / 1000;
      if (timeSinceLastBurst < this.state.config.minBurstInterval) {
        return { 
          allowed: false, 
          reason: `Minimum interval not met (${Math.round(this.state.config.minBurstInterval - timeSinceLastBurst)}s remaining)` 
        };
      }
    }

    // Check safe score
    if (this.state.currentSafeScore < this.state.config.safeScoreThreshold) {
      return { 
        allowed: false, 
        reason: `Safe score too low (${(this.state.currentSafeScore * 100).toFixed(0)}% < ${(this.state.config.safeScoreThreshold * 100).toFixed(0)}%)` 
      };
    }

    // Check threat zones
    if (this.isInThreatZone()) {
      const zone = this.getCurrentThreatZone();
      return { 
        allowed: false, 
        reason: `In threat zone: ${zone?.type || 'unknown'}` 
      };
    }

    // Check consecutive bursts limit
    if (this.state.metrics.totalBursts >= this.state.config.maxConsecutiveBursts) {
      const recentBursts = this.countRecentBursts(60000); // Last minute
      if (recentBursts >= this.state.config.maxConsecutiveBursts) {
        return { 
          allowed: false, 
          reason: `Max consecutive bursts reached (${recentBursts}/${this.state.config.maxConsecutiveBursts})` 
        };
      }
    }

    return { allowed: true, reason: 'All checks passed' };
  }

  private executeBurst(request: BurstRequest): boolean {
    this.setState('BURST_ACTIVE');
    const burstStartTime = Date.now();
    const positionBefore = this.state.currentVioPosition 
      ? { ...this.state.currentVioPosition } 
      : null;

    this.emit({ type: 'BURST_STARTED', timestamp: burstStartTime });
    this.state.metrics.totalBursts++;

    // Set burst timeout
    this.burstTimer = setTimeout(() => {
      this.completeBurst(burstStartTime, positionBefore, request);
    }, request.requestedDuration * 1000);

    return true;
  }

  private completeBurst(
    startTime: number,
    positionBefore: VioPosition | null,
    _request: BurstRequest
  ): void {
    const duration = Date.now() - startTime;
    const gpsPosition = this.state.lastGpsPosition;
    
    // Calculate drift correction
    let driftCorrection = 0;
    if (positionBefore && gpsPosition) {
      driftCorrection = positionBefore.drift;
    }

    const result: BurstResult = {
      success: gpsPosition !== null && gpsPosition.satellites >= this.state.config.minSatellites,
      duration,
      positionBefore,
      positionAfter: gpsPosition,
      driftCorrection,
      satellitesAcquired: gpsPosition?.satellites || 0,
      threatDetected: false,
    };

    // Update metrics
    this.state.metrics.totalGpsOnTime += duration;
    this.state.metrics.lastBurstTime = Date.now();
    
    if (result.success) {
      this.state.metrics.successfulBursts++;
      
      // Update average drift correction
      const totalCorrections = this.state.metrics.successfulBursts;
      this.state.metrics.averageDriftCorrection = 
        (this.state.metrics.averageDriftCorrection * (totalCorrections - 1) + driftCorrection) / totalCorrections;
      
      // Update average duration
      this.state.metrics.averageBurstDuration = 
        (this.state.metrics.averageBurstDuration * (totalCorrections - 1) + duration) / totalCorrections;
      
      // Reset VIO drift after successful fix
      if (this.state.currentVioPosition) {
        this.state.currentVioPosition.drift = 0;
        this.state.currentDrift = 0;
      }
    } else {
      this.state.metrics.failedBursts++;
      result.abortReason = 'Insufficient satellites or GPS fix';
    }

    this.state.lastBurstResult = result;
    this.state.pendingRequest = null;
    this.burstTimer = null;

    this.emit({ type: 'BURST_COMPLETED', result });
    this.startCooldown();
  }

  private startCooldown(): void {
    this.setState('COOLDOWN');
    
    this.cooldownTimer = setTimeout(() => {
      this.cooldownTimer = null;
      this.setState('IDLE');
    }, this.state.config.cooldownDuration * 1000);
  }

  private cancelPendingBurst(): void {
    if (this.burstTimer) {
      clearTimeout(this.burstTimer);
      this.burstTimer = null;
    }
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    this.state.pendingRequest = null;
  }

  private startDriftMonitoring(): void {
    // Check drift every second
    this.driftCheckInterval = setInterval(() => {
      // Simulate drift increase when GPS is off
      if (this.state.currentVioPosition && this.state.currentState === 'IDLE') {
        // This would normally come from the actual VIO system
        // Here we just monitor and react
        
        // Check max interval without burst
        if (this.state.metrics.lastBurstTime) {
          const timeSinceLastBurst = (Date.now() - this.state.metrics.lastBurstTime) / 1000;
          if (timeSinceLastBurst >= this.state.config.maxBurstInterval) {
            console.log('[GpsBurstManager] Max interval reached, requesting scheduled burst');
            this.requestBurst('SCHEDULED', 'NORMAL');
          }
        }
      }
    }, 1000);
  }

  private stopDriftMonitoring(): void {
    if (this.driftCheckInterval) {
      clearInterval(this.driftCheckInterval);
      this.driftCheckInterval = null;
    }
  }

  private startScheduledBursts(): void {
    // Check every minute if it's time for a scheduled burst
    this.scheduledBurstTimer = setInterval(() => {
      const currentHour = new Date().getHours();
      if (this.state.config.burstSchedule.includes(currentHour)) {
        const lastBurst = this.state.metrics.lastBurstTime;
        // Only burst once per hour
        if (!lastBurst || (Date.now() - lastBurst) > 3600000) {
          this.requestBurst('SCHEDULED', 'LOW');
        }
      }
    }, 60000);
  }

  private stopScheduledBursts(): void {
    if (this.scheduledBurstTimer) {
      clearInterval(this.scheduledBurstTimer);
      this.scheduledBurstTimer = null;
    }
  }

  private recalculateSafeScore(): void {
    let score = 1.0;
    const position = this.state.currentVioPosition || this.state.lastGpsPosition;
    
    if (!position) {
      this.state.currentSafeScore = 0.5; // Unknown position = moderate risk
      return;
    }

    const currentLat = 'lat' in position ? position.lat : 0;
    const currentLon = 'lon' in position ? position.lon : 0;

    // Reduce score based on threat zones
    for (const zone of this.state.threatZones) {
      if (!zone.active) continue;
      
      const distance = this.haversineDistance(
        currentLat, currentLon,
        zone.center.lat, zone.center.lon
      );
      
      if (distance < zone.radius) {
        // Inside threat zone
        score *= (1 - zone.threatLevel);
      } else if (distance < zone.radius * 2) {
        // Near threat zone
        const proximity = 1 - (distance - zone.radius) / zone.radius;
        score *= (1 - zone.threatLevel * proximity * 0.5);
      }
    }

    // Increase score based on safe zones
    for (const zone of this.state.safeZones) {
      if (zone.validUntil < Date.now()) continue;
      
      const distance = this.haversineDistance(
        currentLat, currentLon,
        zone.center.lat, zone.center.lon
      );
      
      if (distance < zone.radius) {
        // Inside safe zone - boost score
        score = Math.min(1.0, score + zone.safeScore * 0.3);
      }
    }

    this.state.currentSafeScore = Math.max(0, Math.min(1, score));
  }

  private isInThreatZone(): boolean {
    const position = this.state.currentVioPosition || this.state.lastGpsPosition;
    if (!position) return false;

    const currentLat = 'lat' in position ? position.lat : 0;
    const currentLon = 'lon' in position ? position.lon : 0;

    return this.state.threatZones.some(zone => {
      if (!zone.active) return false;
      const distance = this.haversineDistance(
        currentLat, currentLon,
        zone.center.lat, zone.center.lon
      );
      return distance < zone.radius;
    });
  }

  private getCurrentThreatZone(): ThreatZone | null {
    const position = this.state.currentVioPosition || this.state.lastGpsPosition;
    if (!position) return null;

    const currentLat = 'lat' in position ? position.lat : 0;
    const currentLon = 'lon' in position ? position.lon : 0;

    for (const zone of this.state.threatZones) {
      if (!zone.active) continue;
      const distance = this.haversineDistance(
        currentLat, currentLon,
        zone.center.lat, zone.center.lon
      );
      if (distance < zone.radius) {
        return zone;
      }
    }
    return null;
  }

  private getCurrentSafeZone(): SafeZone | null {
    const position = this.state.currentVioPosition || this.state.lastGpsPosition;
    if (!position) return null;

    const currentLat = 'lat' in position ? position.lat : 0;
    const currentLon = 'lon' in position ? position.lon : 0;

    for (const zone of this.state.safeZones) {
      if (zone.validUntil < Date.now()) continue;
      const distance = this.haversineDistance(
        currentLat, currentLon,
        zone.center.lat, zone.center.lon
      );
      if (distance < zone.radius) {
        return zone;
      }
    }
    return null;
  }

  private countRecentBursts(_windowMs: number): number {
    // In a real implementation, this would track burst timestamps
    // For now, we just use total bursts as approximation
    return this.state.metrics.totalBursts;
  }

  private detectSpoofing(position: GpsPosition): { detected: boolean; reason: string } {
    // Check for common spoofing indicators
    
    // 1. Check HDOP - spoofed signals often have perfect HDOP
    if (position.hdop < 0.5) {
      return { detected: true, reason: 'Suspiciously low HDOP' };
    }

    // 2. Check for position jump
    if (this.state.lastGpsPosition) {
      const timeDelta = (position.timestamp - this.state.lastGpsPosition.timestamp) / 1000;
      const distance = this.haversineDistance(
        this.state.lastGpsPosition.lat, this.state.lastGpsPosition.lon,
        position.lat, position.lon
      );
      
      // Max reasonable speed: 50 m/s for a drone
      const maxDistance = timeDelta * 50;
      if (distance > maxDistance && timeDelta > 0) {
        return { detected: true, reason: `Position jump of ${distance.toFixed(0)}m in ${timeDelta.toFixed(1)}s` };
      }
    }

    // 3. Cross-validate with VIO if available
    if (this.state.currentVioPosition) {
      // VIO gives relative position, but large discrepancies are suspicious
      // This is a simplified check - real implementation would be more sophisticated
      const vioDrift = this.state.currentVioPosition.drift;
      if (vioDrift > 10 && position.accuracy < 1) {
        return { detected: true, reason: 'GPS accuracy inconsistent with VIO drift' };
      }
    }

    return { detected: false, reason: '' };
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: GpsBurstManager | null = null;

export function getGpsBurstManager(config?: Partial<GpsBurstConfig>): GpsBurstManager {
  if (!instance) {
    instance = new GpsBurstManager(config);
  } else if (config) {
    instance.updateConfig(config);
  }
  return instance;
}

export function resetGpsBurstManager(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}
