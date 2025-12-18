/**
 * CORTEX-U7 RosBridge Client
 * 
 * Connects React dashboard to ROS2 via rosbridge WebSocket.
 * Subscribes to drone navigation, threats, and state topics.
 */

// Note: Install with: npm install roslib @types/roslib
import ROSLIB from 'roslib'

// ============================================================================
// TYPES
// ============================================================================

export interface DronePosition {
  x: number        // Local NED North (meters)
  y: number        // Local NED East (meters)
  z: number        // Local NED Down (meters, negative = altitude)
  lat?: number     // Global latitude (if available)
  lon?: number     // Global longitude (if available)
  alt?: number     // Global altitude (meters)
  heading: number  // Yaw in degrees
  roll: number
  pitch: number
}

export interface DroneVelocity {
  vx: number  // m/s
  vy: number
  vz: number
}

export type ThreatLevelType = 'CLEAR' | 'ELEVATED' | 'HIGH' | 'CRITICAL'

export interface ThreatData {
  level: ThreatLevelType
  levelCode: number
  threats: string[]
  threatScore: number
  gpsSafe: boolean
}

export type DroneStateType = 
  | 'IDLE' | 'PREFLIGHT' | 'TAKEOFF' | 'NAVIGATE' | 'HOVER'
  | 'AVOID_OBSTACLE' | 'AVOID_HUMAN' | 'RELOCALIZE' 
  | 'RTH' | 'LAND' | 'EMERGENCY_LAND' | 'FAULT'

export interface DroneStateData {
  state: DroneStateType
  stateCode: number
  previousState: DroneStateType
  stateDuration: number
}

export type NavigationStatusType = 
  | 'INITIALIZING' | 'NOMINAL' | 'DEGRADED' | 'CELESTIAL_BACKUP' | 'LOST'

export interface NavigationStatusData {
  status: NavigationStatusType
  statusCode: number
  uncertaintyM: number
  vioActive: boolean
  lidarActive: boolean
  gpsActive: boolean
  celestialActive: boolean
  vioConfidence: number
  lidarConfidence: number
  gpsConfidence: number
  celestialConfidence: number
}

export interface CelestialData {
  sunAzimuthDeg: number
  sunElevationDeg: number
  celestialHeadingDeg: number
  integrityScorePct: number
  integrityStatus: 'nominal' | 'degraded' | 'anomalous'
  confidence: number
  hmacSignature: string
  starsCount: number
  nightMode: boolean
}

export interface Waypoint {
  x: number
  y: number
  z: number
}

export interface RosBridgeConfig {
  url?: string
  autoConnect?: boolean
  reconnectInterval?: number
}

// ============================================================================
// ROSBRIDGE CLIENT
// ============================================================================

export class RosBridge {
  private ros: ROSLIB.Ros
  private config: Required<RosBridgeConfig>
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private subscribers: Map<string, ROSLIB.Topic> = new Map()
  
  public connected: boolean = false
  public connecting: boolean = false

  // Event callbacks
  public onConnect?: () => void
  public onDisconnect?: () => void
  public onError?: (error: Error) => void

  constructor(config: RosBridgeConfig = {}) {
    this.config = {
      url: config.url ?? 'ws://localhost:9090',
      autoConnect: config.autoConnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 5000,
    }

    this.ros = new ROSLIB.Ros({})

    // Connection handlers
    this.ros.on('connection', () => {
      console.log('✅ Connected to CORTEX-U7 via ROS2')
      this.connected = true
      this.connecting = false
      this.onConnect?.()
    })

    this.ros.on('error', (error) => {
      console.error('❌ ROS connection error:', error)
      this.connected = false
      this.connecting = false
      this.onError?.(new Error(String(error)))
    })

    this.ros.on('close', () => {
      console.warn('⚠️ ROS connection closed')
      this.connected = false
      this.connecting = false
      this.onDisconnect?.()
      this.scheduleReconnect()
    })

    if (this.config.autoConnect) {
      this.connect()
    }
  }

  // ========================================================================
  // CONNECTION MANAGEMENT
  // ========================================================================

  connect(): void {
    if (this.connected || this.connecting) return

    this.connecting = true
    console.log(`🔄 Connecting to ROS2 at ${this.config.url}...`)
    
    try {
      this.ros.connect(this.config.url)
    } catch (error) {
      console.error('Failed to connect:', error)
      this.connecting = false
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.subscribers.forEach((topic) => topic.unsubscribe())
    this.subscribers.clear()
    
    this.ros.close()
    this.connected = false
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.connected) {
        this.connect()
      }
    }, this.config.reconnectInterval)
  }

  // ========================================================================
  // SUBSCRIPTIONS
  // ========================================================================

  /**
   * Subscribe to drone pose (position + orientation)
   */
  subscribeToPosition(callback: (pos: DronePosition) => void): () => void {
    const topic = this.getOrCreateTopic(
      '/cortex/navigation/pose',
      'geometry_msgs/PoseStamped'
    )

    const handler = (message: any) => {
      const { roll, pitch, yaw } = this.quaternionToEuler(message.pose.orientation)
      callback({
        x: message.pose.position.x,
        y: message.pose.position.y,
        z: message.pose.position.z,
        heading: yaw * 180 / Math.PI,
        roll: roll * 180 / Math.PI,
        pitch: pitch * 180 / Math.PI,
      })
    }

    topic.subscribe(handler)
    return () => topic.unsubscribe(handler)
  }

  /**
   * Subscribe to drone velocity
   */
  subscribeToVelocity(callback: (vel: DroneVelocity) => void): () => void {
    const topic = this.getOrCreateTopic(
      '/cortex/navigation/velocity',
      'geometry_msgs/TwistStamped'
    )

    const handler = (message: any) => {
      callback({
        vx: message.twist.linear.x,
        vy: message.twist.linear.y,
        vz: message.twist.linear.z,
      })
    }

    topic.subscribe(handler)
    return () => topic.unsubscribe(handler)
  }

  /**
   * Subscribe to threat level
   */
  subscribeToThreats(callback: (threat: ThreatData) => void): () => void {
    const topic = this.getOrCreateTopic(
      '/cortex/security/threat_level',
      'std_msgs/Float32'  // Fallback to Float32 if custom msg not available
    )

    const handler = (message: any) => {
      // Handle both custom ThreatLevel msg and simple Float32
      if (typeof message.data === 'number') {
        // Simple Float32 format
        const score = message.data
        let level: ThreatLevelType = 'CLEAR'
        if (score >= 80) level = 'CRITICAL'
        else if (score >= 50) level = 'HIGH'
        else if (score >= 20) level = 'ELEVATED'

        callback({
          level,
          levelCode: ['CLEAR', 'ELEVATED', 'HIGH', 'CRITICAL'].indexOf(level),
          threats: [],
          threatScore: score,
          gpsSafe: score < 20,
        })
      } else {
        // Full ThreatLevel message
        const levels: ThreatLevelType[] = ['CLEAR', 'ELEVATED', 'HIGH', 'CRITICAL']
        callback({
          level: levels[message.level] ?? 'CLEAR',
          levelCode: message.level,
          threats: message.threats ?? [],
          threatScore: message.threat_score ?? 0,
          gpsSafe: message.gps_safe ?? true,
        })
      }
    }

    topic.subscribe(handler)
    return () => topic.unsubscribe(handler)
  }

  /**
   * Subscribe to drone FSM state
   */
  subscribeToState(callback: (state: DroneStateData) => void): () => void {
    const topic = this.getOrCreateTopic(
      '/cortex/brain/state',
      'std_msgs/String'  // Fallback to String if custom msg not available
    )

    const handler = (message: any) => {
      const states: DroneStateType[] = [
        'IDLE', 'PREFLIGHT', 'TAKEOFF', 'NAVIGATE', 'HOVER',
        'AVOID_OBSTACLE', 'AVOID_HUMAN', 'RELOCALIZE',
        'RTH', 'LAND', 'EMERGENCY_LAND', 'FAULT'
      ]

      if (typeof message.data === 'string') {
        // Simple String format
        const state = message.data as DroneStateType
        callback({
          state,
          stateCode: states.indexOf(state),
          previousState: 'IDLE',
          stateDuration: 0,
        })
      } else {
        // Full DroneState message
        callback({
          state: states[message.state] ?? 'IDLE',
          stateCode: message.state,
          previousState: states[message.previous_state] ?? 'IDLE',
          stateDuration: message.state_duration ?? 0,
        })
      }
    }

    topic.subscribe(handler)
    return () => topic.unsubscribe(handler)
  }

  /**
   * Subscribe to navigation status
   */
  subscribeToNavigationStatus(callback: (status: NavigationStatusData) => void): () => void {
    const topic = this.getOrCreateTopic(
      '/cortex/navigation/status',
      'std_msgs/String'
    )

    const handler = (message: any) => {
      const statuses: NavigationStatusType[] = [
        'INITIALIZING', 'NOMINAL', 'DEGRADED', 'CELESTIAL_BACKUP', 'LOST'
      ]

      if (typeof message.data === 'string') {
        const status = message.data as NavigationStatusType
        callback({
          status,
          statusCode: statuses.indexOf(status),
          uncertaintyM: 0,
          vioActive: status === 'NOMINAL',
          lidarActive: status === 'NOMINAL',
          gpsActive: false,
          celestialActive: status === 'CELESTIAL_BACKUP',
          vioConfidence: status === 'NOMINAL' ? 0.9 : 0,
          lidarConfidence: status === 'NOMINAL' ? 0.9 : 0,
          gpsConfidence: 0,
          celestialConfidence: status === 'CELESTIAL_BACKUP' ? 0.8 : 0,
        })
      } else {
        callback({
          status: statuses[message.status] ?? 'INITIALIZING',
          statusCode: message.status,
          uncertaintyM: message.uncertainty_m ?? 0,
          vioActive: message.vio_active ?? false,
          lidarActive: message.lidar_active ?? false,
          gpsActive: message.gps_active ?? false,
          celestialActive: message.celestial_active ?? false,
          vioConfidence: message.vio_confidence ?? 0,
          lidarConfidence: message.lidar_confidence ?? 0,
          gpsConfidence: message.gps_confidence ?? 0,
          celestialConfidence: message.celestial_confidence ?? 0,
        })
      }
    }

    topic.subscribe(handler)
    return () => topic.unsubscribe(handler)
  }

  /**
   * Subscribe to celestial integrity data
   */
  subscribeToCelestial(callback: (data: CelestialData) => void): () => void {
    const topic = this.getOrCreateTopic(
      '/cortex/navigation/integrity',
      'std_msgs/Float32'
    )

    const handler = (message: any) => {
      if (typeof message.data === 'number') {
        // Simple Float32 (integrity score only)
        const score = message.data
        callback({
          sunAzimuthDeg: 0,
          sunElevationDeg: 0,
          celestialHeadingDeg: 0,
          integrityScorePct: score,
          integrityStatus: score >= 95 ? 'nominal' : score >= 80 ? 'degraded' : 'anomalous',
          confidence: score / 100,
          hmacSignature: '',
          starsCount: 0,
          nightMode: false,
        })
      } else {
        // Full CelestialData message
        callback({
          sunAzimuthDeg: message.sun_azimuth_deg ?? 0,
          sunElevationDeg: message.sun_elevation_deg ?? 0,
          celestialHeadingDeg: message.celestial_heading_deg ?? 0,
          integrityScorePct: message.integrity_score_pct ?? 0,
          integrityStatus: message.integrity_status ?? 'anomalous',
          confidence: message.confidence ?? 0,
          hmacSignature: message.hmac_signature ?? '',
          starsCount: message.stars_count ?? 0,
          nightMode: message.night_mode ?? false,
        })
      }
    }

    topic.subscribe(handler)
    return () => topic.unsubscribe(handler)
  }

  // ========================================================================
  // PUBLISHING
  // ========================================================================

  /**
   * Publish mission waypoints
   */
  publishMission(waypoints: Waypoint[], missionName: string = 'Manual Mission'): void {
    const topic = this.getOrCreateTopic(
      '/cortex/mission/loaded',
      'std_msgs/String'
    )

    const missionData = {
      name: missionName,
      waypoints: waypoints.map(wp => ({
        x: wp.x,
        y: wp.y,
        z: wp.z,
      })),
    }

    const message = new ROSLIB.Message({
      data: JSON.stringify(missionData)
    })

    topic.publish(message)
    console.log(`📤 Published mission: ${missionName} (${waypoints.length} waypoints)`)
  }

  // ========================================================================
  // SERVICES
  // ========================================================================

  /**
   * Call GPS enable/disable service
   */
  async setGPSEnabled(enable: boolean, reason: string = ''): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const service = new ROSLIB.Service({
        ros: this.ros,
        name: '/cortex/security/set_gps_enabled',
        serviceType: 'cortex_msgs/SetGPSEnabled',
      })

      const request = new ROSLIB.ServiceRequest({
        enable,
        reason,
      })

      service.callService(request, (response: any) => {
        resolve({
          success: response.success,
          message: response.message,
        })
      }, (error: string) => {
        resolve({
          success: false,
          message: `Service call failed: ${error}`,
        })
      })
    })
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  private getOrCreateTopic(name: string, messageType: string): ROSLIB.Topic {
    let topic = this.subscribers.get(name)
    if (!topic) {
      topic = new ROSLIB.Topic({
        ros: this.ros,
        name,
        messageType,
      })
      this.subscribers.set(name, topic)
    }
    return topic
  }

  private quaternionToEuler(q: { x: number; y: number; z: number; w: number }) {
    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (q.w * q.x + q.y * q.z)
    const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y)
    const roll = Math.atan2(sinr_cosp, cosr_cosp)

    // Pitch (y-axis rotation)
    const sinp = 2 * (q.w * q.y - q.z * q.x)
    const pitch = Math.abs(sinp) >= 1 
      ? Math.sign(sinp) * Math.PI / 2 
      : Math.asin(sinp)

    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (q.w * q.z + q.x * q.y)
    const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z)
    const yaw = Math.atan2(siny_cosp, cosy_cosp)

    return { roll, pitch, yaw }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let rosBridgeInstance: RosBridge | null = null

export function getRosBridge(config?: RosBridgeConfig): RosBridge {
  if (!rosBridgeInstance) {
    rosBridgeInstance = new RosBridge(config)
  }
  return rosBridgeInstance
}

export function disconnectRosBridge(): void {
  if (rosBridgeInstance) {
    rosBridgeInstance.disconnect()
    rosBridgeInstance = null
  }
}
