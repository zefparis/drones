/**
 * CORTEX-U7 RosBridge Client
 * 
 * Connects React dashboard to ROS2 via rosbridge WebSocket.
 * Uses native WebSocket API for browser compatibility (no roslib dependency).
 * Compatible with rosbridge_server JSON protocol.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DronePosition {
  x: number
  y: number
  z: number
  lat?: number
  lon?: number
  alt?: number
  heading: number
  roll: number
  pitch: number
}

export interface DroneVelocity {
  vx: number
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

// Internal types for rosbridge protocol
interface RosBridgeMessage {
  op: string
  topic?: string
  type?: string
  msg?: unknown
  id?: string
  service?: string
  args?: unknown
}

type MessageHandler = (msg: unknown) => void

// ============================================================================
// ROSBRIDGE CLIENT (Native WebSocket)
// ============================================================================

export class RosBridge {
  private ws: WebSocket | null = null
  private config: Required<RosBridgeConfig>
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private subscribers: Map<string, Set<MessageHandler>> = new Map()
  private messageId = 0
  
  public connected = false
  public connecting = false

  public onConnect?: () => void
  public onDisconnect?: () => void
  public onError?: (error: Error) => void

  constructor(config: RosBridgeConfig = {}) {
    this.config = {
      url: config.url ?? 'ws://localhost:9090',
      autoConnect: config.autoConnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 5000,
    }

    if (this.config.autoConnect) {
      this.connect()
    }
  }

  connect(): void {
    if (this.connected || this.connecting) return
    if (typeof window === 'undefined') return // SSR guard

    this.connecting = true
    console.log(`🔄 Connecting to ROS2 at ${this.config.url}...`)

    try {
      this.ws = new WebSocket(this.config.url)

      this.ws.onopen = () => {
        console.log('✅ Connected to CORTEX-U7 via ROS2')
        this.connected = true
        this.connecting = false
        this.resubscribeAll()
        this.onConnect?.()
      }

      this.ws.onclose = () => {
        console.warn('⚠️ ROS connection closed')
        this.connected = false
        this.connecting = false
        this.onDisconnect?.()
        this.scheduleReconnect()
      }

      this.ws.onerror = (event) => {
        console.error('❌ ROS connection error:', event)
        this.connected = false
        this.connecting = false
        this.onError?.(new Error('WebSocket error'))
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RosBridgeMessage
          if (data.op === 'publish' && data.topic) {
            const handlers = this.subscribers.get(data.topic)
            handlers?.forEach((handler) => handler(data.msg))
          }
        } catch (e) {
          console.error('Failed to parse ROS message:', e)
        }
      }
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
    this.ws?.close()
    this.ws = null
    this.connected = false
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.connected) this.connect()
    }, this.config.reconnectInterval)
  }

  private send(msg: RosBridgeMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private subscribe(topic: string, type: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set())
      if (this.connected) {
        this.send({ op: 'subscribe', topic, type, id: `sub_${++this.messageId}` })
      }
    }
    this.subscribers.get(topic)!.add(handler)

    return () => {
      const handlers = this.subscribers.get(topic)
      handlers?.delete(handler)
      if (handlers?.size === 0) {
        this.subscribers.delete(topic)
        this.send({ op: 'unsubscribe', topic, id: `unsub_${++this.messageId}` })
      }
    }
  }

  private resubscribeAll(): void {
    this.subscribers.forEach((_, topic) => {
      this.send({ op: 'subscribe', topic, id: `sub_${++this.messageId}` })
    })
  }

  // ========================================================================
  // SUBSCRIPTIONS
  // ========================================================================

  subscribeToPosition(callback: (pos: DronePosition) => void): () => void {
    return this.subscribe('/cortex/navigation/pose', 'geometry_msgs/PoseStamped', (msg: any) => {
      const q = msg?.pose?.orientation ?? { x: 0, y: 0, z: 0, w: 1 }
      const { roll, pitch, yaw } = this.quaternionToEuler(q)
      callback({
        x: msg?.pose?.position?.x ?? 0,
        y: msg?.pose?.position?.y ?? 0,
        z: msg?.pose?.position?.z ?? 0,
        heading: yaw * 180 / Math.PI,
        roll: roll * 180 / Math.PI,
        pitch: pitch * 180 / Math.PI,
      })
    })
  }

  subscribeToVelocity(callback: (vel: DroneVelocity) => void): () => void {
    return this.subscribe('/cortex/navigation/velocity', 'geometry_msgs/TwistStamped', (msg: any) => {
      callback({
        vx: msg?.twist?.linear?.x ?? 0,
        vy: msg?.twist?.linear?.y ?? 0,
        vz: msg?.twist?.linear?.z ?? 0,
      })
    })
  }

  subscribeToThreats(callback: (threat: ThreatData) => void): () => void {
    return this.subscribe('/cortex/security/threat_level', 'std_msgs/Float32', (msg: any) => {
      const score = typeof msg?.data === 'number' ? msg.data : (msg?.threat_score ?? 0)
      let level: ThreatLevelType = 'CLEAR'
      if (score >= 80) level = 'CRITICAL'
      else if (score >= 50) level = 'HIGH'
      else if (score >= 20) level = 'ELEVATED'

      callback({
        level,
        levelCode: ['CLEAR', 'ELEVATED', 'HIGH', 'CRITICAL'].indexOf(level),
        threats: msg?.threats ?? [],
        threatScore: score,
        gpsSafe: msg?.gps_safe ?? score < 20,
      })
    })
  }

  subscribeToState(callback: (state: DroneStateData) => void): () => void {
    const states: DroneStateType[] = [
      'IDLE', 'PREFLIGHT', 'TAKEOFF', 'NAVIGATE', 'HOVER',
      'AVOID_OBSTACLE', 'AVOID_HUMAN', 'RELOCALIZE',
      'RTH', 'LAND', 'EMERGENCY_LAND', 'FAULT'
    ]

    return this.subscribe('/cortex/brain/state', 'std_msgs/String', (msg: any) => {
      const stateName = typeof msg?.data === 'string' ? msg.data : (states[msg?.state] ?? 'IDLE')
      callback({
        state: stateName as DroneStateType,
        stateCode: states.indexOf(stateName as DroneStateType),
        previousState: 'IDLE',
        stateDuration: msg?.state_duration ?? 0,
      })
    })
  }

  subscribeToNavigationStatus(callback: (status: NavigationStatusData) => void): () => void {
    const statuses: NavigationStatusType[] = [
      'INITIALIZING', 'NOMINAL', 'DEGRADED', 'CELESTIAL_BACKUP', 'LOST'
    ]

    return this.subscribe('/cortex/navigation/status', 'std_msgs/String', (msg: any) => {
      const statusName = typeof msg?.data === 'string' ? msg.data : (statuses[msg?.status] ?? 'INITIALIZING')
      callback({
        status: statusName as NavigationStatusType,
        statusCode: statuses.indexOf(statusName as NavigationStatusType),
        uncertaintyM: msg?.uncertainty_m ?? 0,
        vioActive: msg?.vio_active ?? statusName === 'NOMINAL',
        lidarActive: msg?.lidar_active ?? statusName === 'NOMINAL',
        gpsActive: msg?.gps_active ?? false,
        celestialActive: msg?.celestial_active ?? statusName === 'CELESTIAL_BACKUP',
        vioConfidence: msg?.vio_confidence ?? (statusName === 'NOMINAL' ? 0.9 : 0),
        lidarConfidence: msg?.lidar_confidence ?? (statusName === 'NOMINAL' ? 0.9 : 0),
        gpsConfidence: msg?.gps_confidence ?? 0,
        celestialConfidence: msg?.celestial_confidence ?? (statusName === 'CELESTIAL_BACKUP' ? 0.8 : 0),
      })
    })
  }

  subscribeToCelestial(callback: (data: CelestialData) => void): () => void {
    return this.subscribe('/cortex/navigation/integrity', 'std_msgs/Float32', (msg: any) => {
      const score = typeof msg?.data === 'number' ? msg.data : (msg?.integrity_score_pct ?? 100)
      callback({
        sunAzimuthDeg: msg?.sun_azimuth_deg ?? 0,
        sunElevationDeg: msg?.sun_elevation_deg ?? 0,
        celestialHeadingDeg: msg?.celestial_heading_deg ?? 0,
        integrityScorePct: score,
        integrityStatus: score >= 95 ? 'nominal' : score >= 80 ? 'degraded' : 'anomalous',
        confidence: msg?.confidence ?? score / 100,
        hmacSignature: msg?.hmac_signature ?? '',
        starsCount: msg?.stars_count ?? 0,
        nightMode: msg?.night_mode ?? false,
      })
    })
  }

  // ========================================================================
  // PUBLISHING
  // ========================================================================

  publishMission(waypoints: Waypoint[], missionName = 'Manual Mission'): void {
    this.send({
      op: 'publish',
      topic: '/cortex/mission/loaded',
      msg: { data: JSON.stringify({ name: missionName, waypoints }) },
    })
    console.log(`📤 Published mission: ${missionName} (${waypoints.length} waypoints)`)
  }

  // ========================================================================
  // SERVICES
  // ========================================================================

  async setGPSEnabled(enable: boolean, reason = ''): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const id = `call_${++this.messageId}`
      
      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.op === 'service_response' && data.id === id) {
            this.ws?.removeEventListener('message', handler)
            resolve({ success: data.result?.success ?? false, message: data.result?.message ?? '' })
          }
        } catch { /* ignore */ }
      }

      this.ws?.addEventListener('message', handler)
      this.send({
        op: 'call_service',
        service: '/cortex/security/set_gps_enabled',
        args: { enable, reason },
        id,
      })

      // Timeout after 5s
      setTimeout(() => {
        this.ws?.removeEventListener('message', handler)
        resolve({ success: false, message: 'Service call timeout' })
      }, 5000)
    })
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  private quaternionToEuler(q: { x: number; y: number; z: number; w: number }) {
    const sinr_cosp = 2 * (q.w * q.x + q.y * q.z)
    const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y)
    const roll = Math.atan2(sinr_cosp, cosr_cosp)

    const sinp = 2 * (q.w * q.y - q.z * q.x)
    const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp)

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
