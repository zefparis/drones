/**
 * React hook for CORTEX-U7 RosBridge
 * 
 * Provides reactive state for ROS2 topics.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  RosBridge,
  getRosBridge,
  type DronePosition,
  type DroneVelocity,
  type ThreatData,
  type DroneStateData,
  type NavigationStatusData,
  type CelestialData,
  type Waypoint,
  type RosBridgeConfig,
} from './rosbridge'

export interface UseRosBridgeReturn {
  // Connection state
  connected: boolean
  connecting: boolean
  
  // Drone data
  position: DronePosition | null
  velocity: DroneVelocity | null
  state: DroneStateData | null
  navigationStatus: NavigationStatusData | null
  celestial: CelestialData | null
  threat: ThreatData | null
  
  // Actions
  publishMission: (waypoints: Waypoint[], name?: string) => void
  setGPSEnabled: (enable: boolean, reason?: string) => Promise<{ success: boolean; message: string }>
  reconnect: () => void
}

export function useRosBridge(config?: RosBridgeConfig): UseRosBridgeReturn {
  const rosRef = useRef<RosBridge | null>(null)
  
  // Connection state
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  
  // Data state
  const [position, setPosition] = useState<DronePosition | null>(null)
  const [velocity, setVelocity] = useState<DroneVelocity | null>(null)
  const [state, setState] = useState<DroneStateData | null>(null)
  const [navigationStatus, setNavigationStatus] = useState<NavigationStatusData | null>(null)
  const [celestial, setCelestial] = useState<CelestialData | null>(null)
  const [threat, setThreat] = useState<ThreatData | null>(null)

  // Initialize RosBridge
  useEffect(() => {
    const ros = getRosBridge(config)
    rosRef.current = ros

    // Set up connection callbacks
    ros.onConnect = () => {
      setConnected(true)
      setConnecting(false)
    }

    ros.onDisconnect = () => {
      setConnected(false)
      setConnecting(false)
    }

    ros.onError = () => {
      setConnecting(false)
    }

    // Update initial state
    setConnected(ros.connected)
    setConnecting(ros.connecting)

    // Subscribe to topics
    const unsubPosition = ros.subscribeToPosition(setPosition)
    const unsubVelocity = ros.subscribeToVelocity(setVelocity)
    const unsubState = ros.subscribeToState(setState)
    const unsubNavStatus = ros.subscribeToNavigationStatus(setNavigationStatus)
    const unsubCelestial = ros.subscribeToCelestial(setCelestial)
    const unsubThreat = ros.subscribeToThreats(setThreat)

    // Cleanup
    return () => {
      unsubPosition()
      unsubVelocity()
      unsubState()
      unsubNavStatus()
      unsubCelestial()
      unsubThreat()
    }
  }, [])

  // Actions
  const publishMission = useCallback((waypoints: Waypoint[], name?: string) => {
    rosRef.current?.publishMission(waypoints, name)
  }, [])

  const setGPSEnabled = useCallback(async (enable: boolean, reason?: string) => {
    if (!rosRef.current) {
      return { success: false, message: 'RosBridge not initialized' }
    }
    return rosRef.current.setGPSEnabled(enable, reason)
  }, [])

  const reconnect = useCallback(() => {
    setConnecting(true)
    rosRef.current?.connect()
  }, [])

  return {
    connected,
    connecting,
    position,
    velocity,
    state,
    navigationStatus,
    celestial,
    threat,
    publishMission,
    setGPSEnabled,
    reconnect,
  }
}

// Re-export types
export type {
  DronePosition,
  DroneVelocity,
  ThreatData,
  DroneStateData,
  NavigationStatusData,
  CelestialData,
  Waypoint,
  ThreatLevelType,
  DroneStateType,
  NavigationStatusType,
} from './rosbridge'
