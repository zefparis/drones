/**
 * CORTEX-U7 Tactical Dashboard
 * 
 * Real-time drone control interface with:
 * - Navigation map (position, waypoints, trajectory)
 * - Celestial dome (sun, stars, heading validation)
 * - Telemetry panel (altitude, speed, heading)
 * - Sensors status (VIO, LiDAR, GPS, IMU)
 * - FSM state visualizer
 * - Threat detection panel
 */

import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  AlertTriangle,
  Battery,
  CheckCircle2,
  Compass,
  Lock,
  MapPin,
  Navigation,
  Radio,
  Radar,
  Shield,
  ShieldCheck,
  WifiOff,
} from 'lucide-react'

import VisualizationPanel from './components/VisualizationPanel'
import { NavigationMap } from './components/NavigationMap'
import { ShieldAuthModal } from './components/shield'
import { useRosBridge } from './lib/ros'
import { predictSunObservation } from './lib/ephemeris'
import { cn } from './lib/utils'
import type { NavigationState } from './types/celestial'
import type { ShieldResult } from './lib/shield'

// Default position (Paris)
const DEFAULT_POSITION = {
  lat: 48.8566,
  lon: 2.3522,
  alt: 35,
  heading: 0,
  roll: 0,
  pitch: 0,
}

// FSM States
const FSM_STATES = [
  'IDLE',
  'PREFLIGHT',
  'TAKEOFF',
  'NAVIGATE',
  'HOVER',
  'AVOID_OBSTACLE',
  'AVOID_HUMAN',
  'RELOCALIZE',
  'RTH',
  'LAND',
  'EMERGENCY_LAND',
  'FAULT',
] as const

// Threat colors
const THREAT_COLORS = {
  CLEAR: 'bg-emerald-500',
  ELEVATED: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-rose-500',
}

const THREAT_LABELS = {
  CLEAR: 'Nominal',
  ELEVATED: 'Élevé',
  HIGH: 'Haut',
  CRITICAL: 'Critique',
}

export default function App() {
  const { t } = useTranslation()

  // ROS2 Bridge connection
  const {
    connected,
    connecting,
    position,
    velocity,
    state: droneState,
    navigationStatus,
    celestial,
    threat,
  } = useRosBridge()

  // Mission state (mock for now)
  const [mission] = useState<{ name: string; waypoints: Array<{ lat: number; lon: number; alt: number }> } | null>(null)

  // HCS-SHIELD Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pilotScore, setPilotScore] = useState<number | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'full' | 'quick'>('full')
  const [authTitle, setAuthTitle] = useState('Authentification Pilote')
  const [authDescription, setAuthDescription] = useState('Vérification cognitive HCS-SHIELD requise')
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  // Shield authentication handlers
  const handleAuthSuccess = useCallback((result: ShieldResult) => {
    setIsAuthenticated(true)
    setPilotScore(result.humanScore)
    setShowAuthModal(false)
    console.log('✅ Pilote authentifié:', result)
    
    // Execute pending action if any
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  const handleAuthFailure = useCallback((result: ShieldResult) => {
    setIsAuthenticated(false)
    setPilotScore(null)
    setShowAuthModal(false)
    console.log('❌ Authentification échouée:', result)
  }, [])

  // Request authentication before sensitive action (exported for future use)
  // Usage: requireAuth(() => doSensitiveAction(), 'quick', 'Proof-of-Presence')
  const _requireAuth = useCallback((
    action: () => void,
    mode: 'full' | 'quick' = 'quick',
    title?: string,
    description?: string
  ) => {
    if (isAuthenticated && mode === 'quick') {
      setAuthMode('quick')
      setAuthTitle(title || 'Proof-of-Presence')
      setAuthDescription(description || 'Vérification cognitive avant action sensible')
    } else {
      setAuthMode(mode)
      setAuthTitle(title || 'Authentification Pilote')
      setAuthDescription(description || 'Vérification cognitive HCS-SHIELD requise')
    }
    setPendingAction(() => action)
    setShowAuthModal(true)
  }, [isAuthenticated])
  void _requireAuth // Suppress unused warning - reserved for QR mission unlock

  // For celestial visualization (existing component)
  const navState: NavigationState = {
    timestampMs: Date.now(),
    latitudeDeg: position?.lat ?? DEFAULT_POSITION.lat,
    longitudeDeg: position?.lon ?? DEFAULT_POSITION.lon,
    altitudeM: position?.alt ?? DEFAULT_POSITION.alt,
  }
  const predictedSun = useMemo(
    () => predictSunObservation(navState, { refraction: 'normal' }),
    [navState.latitudeDeg, navState.longitudeDeg, navState.timestampMs],
  )

  // Current FSM state
  const currentState = droneState?.state ?? 'IDLE'

  // Current threat level
  const threatLevel = threat?.level ?? 'CLEAR'

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground">
      {/* Header Tactique */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo + Mission */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-cyan-400" />
              <div>
                <h1 className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-xl font-bold text-transparent">
                  CORTEX-U7
                </h1>
                <p className="text-xs text-slate-400">
                  {mission?.name ?? 'No Mission Loaded'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {/* GPS Status */}
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                navigationStatus?.gpsActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700/50 text-slate-400',
              )}
            >
              <MapPin className="h-3 w-3" />
              GPS {navigationStatus?.gpsActive ? 'ON' : 'OFF'}
            </div>

            {/* Battery (mock) */}
            <div className="flex items-center gap-1.5 rounded-full bg-slate-700/50 px-2.5 py-1 text-xs font-medium text-slate-300">
              <Battery className="h-3 w-3" />
              87%
            </div>

            {/* Threat Level */}
            {threatLevel !== 'CLEAR' && (
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white animate-pulse',
                  THREAT_COLORS[threatLevel],
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                {THREAT_LABELS[threatLevel]}
              </div>
            )}

            {/* Pilot Authentication Status */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setAuthMode('full')
                  setAuthTitle('Authentification Pilote')
                  setAuthDescription('Vérification cognitive HCS-SHIELD requise')
                  setShowAuthModal(true)
                }
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                isAuthenticated
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer',
              )}
            >
              {isAuthenticated ? (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Pilote {pilotScore ? `(${(pilotScore * 100).toFixed(0)}%)` : ''}
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Non authentifié
                </>
              )}
            </button>

            {/* ROS Connection */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  connected
                    ? 'bg-emerald-500 animate-pulse'
                    : connecting
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500',
                )}
              />
              <span className="text-xs text-slate-400">
                {connected ? 'ROS2' : connecting ? '...' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Navigation Map */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Navigation className="h-5 w-5 text-cyan-400" />
                Navigation
              </h2>
              <div className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                {position
                  ? `${(position.lat ?? DEFAULT_POSITION.lat).toFixed(5)}, ${(position.lon ?? DEFAULT_POSITION.lon).toFixed(5)}`
                  : 'No Fix'}
              </div>
            </div>
            <div className="h-80 overflow-hidden rounded-lg">
              <NavigationMap
                position={position ?? { ...DEFAULT_POSITION, x: 0, y: 0, z: 0 }}
                waypoints={mission?.waypoints ?? []}
              />
            </div>
          </section>

          {/* Celestial Dome */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Compass className="h-5 w-5 text-cyan-400" />
                {t('visualization.title')}
              </h2>
              <div
                className={cn(
                  'rounded-full px-3 py-1 text-xs',
                  (celestial?.confidence ?? 0) > 0.8
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : (celestial?.confidence ?? 0) > 0.5
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800/80 text-slate-400',
                )}
              >
                {((celestial?.integrityScorePct ?? 100)).toFixed(0)}% Integrity
              </div>
            </div>
            <VisualizationPanel
              navigation={navState}
              predictedSun={predictedSun}
              observedSun={celestial ? { azimuthDeg: celestial.sunAzimuthDeg, elevationDeg: celestial.sunElevationDeg } : predictedSun}
              fusion={undefined}
            />
          </section>

          {/* Telemetry Panel */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Activity className="h-5 w-5 text-cyan-400" />
              Telemetry
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <TelemetryItem
                label="Altitude"
                value={`${(position?.alt ?? 0).toFixed(1)} m`}
                icon={<Navigation className="h-4 w-4" />}
              />
              <TelemetryItem
                label="Speed"
                value={`${Math.sqrt((velocity?.vx ?? 0) ** 2 + (velocity?.vy ?? 0) ** 2).toFixed(1)} m/s`}
                icon={<Activity className="h-4 w-4" />}
              />
              <TelemetryItem
                label="Heading"
                value={`${(position?.heading ?? 0).toFixed(0)}°`}
                icon={<Compass className="h-4 w-4" />}
              />
              <TelemetryItem
                label="Uncertainty"
                value={`${(navigationStatus?.uncertaintyM ?? 0).toFixed(2)} m`}
                icon={<Radar className="h-4 w-4" />}
              />
              <TelemetryItem
                label="Status"
                value={navigationStatus?.status ?? 'N/A'}
                icon={<Radio className="h-4 w-4" />}
              />
            </div>
          </section>

          {/* Sensors Status */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Radar className="h-5 w-5 text-cyan-400" />
              Sensors
            </h2>
            <div className="space-y-2">
              <SensorStatus name="VIO (Visual-Inertial)" active={navigationStatus?.vioActive ?? false} confidence={navigationStatus?.vioConfidence} />
              <SensorStatus name="LiDAR SLAM" active={navigationStatus?.lidarActive ?? false} confidence={navigationStatus?.lidarConfidence} />
              <SensorStatus name="GPS" active={navigationStatus?.gpsActive ?? false} confidence={navigationStatus?.gpsConfidence} />
              <SensorStatus name="IMU" active={true} confidence={0.95} />
              <SensorStatus name="Celestial" active={navigationStatus?.celestialActive ?? false} confidence={navigationStatus?.celestialConfidence} />
            </div>
          </section>

          {/* FSM State Visualizer */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Shield className="h-5 w-5 text-cyan-400" />
              FSM State
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {FSM_STATES.map((state) => (
                <div
                  key={state}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-all',
                    currentState === state
                      ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500'
                      : 'bg-slate-800/50 text-slate-500',
                  )}
                >
                  {state}
                </div>
              ))}
            </div>
          </section>

          {/* Threat Panel */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <AlertTriangle className="h-5 w-5 text-cyan-400" />
              Threat Assessment
            </h2>
            <div
              className={cn(
                'rounded-lg border p-4',
                threatLevel === 'CRITICAL' && 'border-rose-500/50 bg-rose-500/10',
                threatLevel === 'HIGH' && 'border-orange-500/50 bg-orange-500/10',
                threatLevel === 'ELEVATED' && 'border-amber-500/50 bg-amber-500/10',
                threatLevel === 'CLEAR' && 'border-emerald-500/50 bg-emerald-500/10',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('h-4 w-4 rounded-full', THREAT_COLORS[threatLevel])} />
                  <div>
                    <div className="font-semibold text-white">
                      Threat Level: {THREAT_LABELS[threatLevel]}
                    </div>
                    <div className="text-xs text-slate-400">
                      Score: {(threat?.threatScore ?? 0).toFixed(0)}/100
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      threat?.gpsSafe ? 'text-emerald-400' : 'text-rose-400',
                    )}
                  >
                    GPS: {threat?.gpsSafe !== false ? 'SAFE' : 'UNSAFE'}
                  </div>
                </div>
              </div>

              {/* Threat list */}
              {threat && threat.threats.length > 0 && (
                <div className="mt-3 border-t border-slate-700 pt-3">
                  <div className="text-xs font-medium text-slate-400">Detected Threats:</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {threat.threats.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {threatLevel === 'CLEAR' && (
                <div className="mt-2 text-xs text-emerald-400">
                  ✓ No threats detected - All systems nominal
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Connection Banner */}
        {!connected && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            <WifiOff className="h-4 w-4" />
            ROS2 not connected - Dashboard in offline mode
          </div>
        )}

        {/* Authentication Required Banner */}
        {!isAuthenticated && (
          <div className="mt-6 flex items-center justify-between rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
            <div className="flex items-center gap-2 text-sm text-cyan-300">
              <Shield className="h-4 w-4" />
              Authentification pilote requise pour accéder aux commandes
            </div>
            <button
              onClick={() => {
                setAuthMode('full')
                setAuthTitle('Authentification Pilote')
                setAuthDescription('Vérification cognitive HCS-SHIELD requise')
                setShowAuthModal(true)
              }}
              className="rounded-lg bg-cyan-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-cyan-500"
            >
              S'authentifier
            </button>
          </div>
        )}
      </main>

      {/* HCS-SHIELD Authentication Modal */}
      <ShieldAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        onFailure={handleAuthFailure}
        mode={authMode}
        title={authTitle}
        description={authDescription}
      />
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TelemetryItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-slate-800/50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-xl text-white">{value}</div>
    </div>
  )
}

function SensorStatus({
  name,
  active,
  confidence,
}: {
  name: string
  active: boolean
  confidence?: number
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-2">
      <div className="flex items-center gap-2">
        {active ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
        <span className="text-sm text-slate-300">{name}</span>
      </div>
      {confidence !== undefined && (
        <span
          className={cn(
            'text-xs',
            confidence > 0.7 ? 'text-emerald-400' : confidence > 0.4 ? 'text-amber-400' : 'text-slate-500',
          )}
        >
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </div>
  )
}
