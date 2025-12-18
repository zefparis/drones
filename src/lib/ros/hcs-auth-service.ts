/**
 * HCS Auth Service - ROS2 integration for QR scanning and mission loading
 * Bridges the web interface with CORTEX drone system
 */

import type { MissionData } from '../../components/hcs/MissionPlanner';

export interface ScanQRRequest {
  timeout_ms?: number;
}

export interface ScanQRResponse {
  success: boolean;
  message: string;
  mission_name?: string;
  waypoint_count?: number;
}

export interface HCSAuthStatus {
  authenticated: boolean;
  hcs_code?: string;
  mission_loaded: boolean;
  mission_name?: string;
  expiration_timestamp?: number;
}

/**
 * HCS Auth Service for ROS2 communication
 * Handles QR scanning requests and mission loading
 */
export class HCSAuthService {
  // @ts-expect-error Reserved for future ROS connection management
  private _ros: ROSLIB.Ros | null = null;
  private scanService: ROSLIB.Service | null = null;
  private statusPublisher: ROSLIB.Topic | null = null;
  private missionPublisher: ROSLIB.Topic | null = null;
  
  private consumedTokens = new Set<string>();
  private currentStatus: HCSAuthStatus = {
    authenticated: false,
    mission_loaded: false
  };

  constructor(ros?: ROSLIB.Ros) {
    if (ros) {
      this.initialize(ros);
    }
  }

  initialize(ros: ROSLIB.Ros) {
    this._ros = ros;

    // Service for QR scanning
    this.scanService = new ROSLIB.Service({
      ros,
      name: '/cortex/auth/scan_qr',
      serviceType: 'cortex_msgs/ScanQR'
    });

    // Status publisher
    this.statusPublisher = new ROSLIB.Topic({
      ros,
      name: '/cortex/auth/status',
      messageType: 'cortex_msgs/HCSAuthStatus'
    });

    // Mission publisher (to Brain node)
    this.missionPublisher = new ROSLIB.Topic({
      ros,
      name: '/cortex/mission/loaded',
      messageType: 'cortex_msgs/Mission'
    });

    console.log('[HCS Auth] Service initialized');
  }

  /**
   * Request QR scan from drone camera
   */
  async scanQR(timeout_ms = 10000): Promise<ScanQRResponse> {
    if (!this.scanService) {
      return { success: false, message: 'ROS not connected' };
    }

    return new Promise((resolve) => {
      const request = new ROSLIB.ServiceRequest({ timeout_ms });

      this.scanService!.callService(request, (response: unknown) => {
        resolve(response as ScanQRResponse);
      }, (error: string) => {
        resolve({ success: false, message: error });
      });
    });
  }

  /**
   * Publish loaded mission to Brain node
   */
  publishMission(mission: MissionData, hcsCode: string) {
    if (!this.missionPublisher) {
      console.error('[HCS Auth] Cannot publish - ROS not connected');
      return;
    }

    const missionMsg = new ROSLIB.Message({
      header: {
        stamp: { sec: Math.floor(Date.now() / 1000), nanosec: 0 },
        frame_id: 'hcs_auth'
      },
      name: mission.name,
      type: mission.type,
      priority: mission.priority,
      gps_allowed: mission.gpsAllowed,
      max_duration_sec: mission.maxDuration * 60,
      hcs_code: hcsCode,
      waypoints: mission.waypoints.map((wp, idx) => ({
        index: idx,
        latitude: wp.lat,
        longitude: wp.lon,
        altitude: wp.alt,
        action: wp.action
      }))
    });

    this.missionPublisher.publish(missionMsg);
    console.log(`[HCS Auth] Mission published: ${mission.name}`);
  }

  /**
   * Update and publish authentication status
   */
  updateStatus(status: Partial<HCSAuthStatus>) {
    this.currentStatus = { ...this.currentStatus, ...status };

    if (this.statusPublisher) {
      const statusMsg = new ROSLIB.Message(this.currentStatus as unknown as Record<string, unknown>);
      this.statusPublisher.publish(statusMsg);
    }
  }

  /**
   * Check if token has been consumed (anti-replay)
   */
  isTokenConsumed(token: string): boolean {
    return this.consumedTokens.has(token);
  }

  /**
   * Mark token as consumed
   */
  consumeToken(token: string) {
    this.consumedTokens.add(token);
  }

  /**
   * Get current auth status
   */
  getStatus(): HCSAuthStatus {
    return { ...this.currentStatus };
  }

  /**
   * Reset authentication
   */
  reset() {
    this.currentStatus = {
      authenticated: false,
      mission_loaded: false
    };
    this.updateStatus(this.currentStatus);
  }
}

// Type definitions for ROSLIB (when not using full @types/roslib)
declare namespace ROSLIB {
  class Ros {
    constructor(options: { url: string });
    on(event: string, callback: (arg?: unknown) => void): void;
  }
  class Service {
    constructor(options: { ros: Ros; name: string; serviceType: string });
    callService(
      request: ServiceRequest, 
      callback: (response: unknown) => void, 
      errorCallback?: (error: string) => void
    ): void;
  }
  class ServiceRequest {
    constructor(values?: Record<string, unknown>);
  }
  class Topic {
    constructor(options: { ros: Ros; name: string; messageType: string });
    publish(message: Message): void;
    subscribe(callback: (message: unknown) => void): void;
  }
  class Message {
    constructor(values?: Record<string, unknown>);
  }
}

export const hcsAuthService = new HCSAuthService();
