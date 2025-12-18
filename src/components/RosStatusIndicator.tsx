/**
 * CORTEX-U7 ROS Connection Status Indicator
 * 
 * Shows connection status and threat level from ROS2.
 */

import { useRosBridge, type ThreatLevelType } from '../lib/ros'
import { cn } from '../lib/utils'

const THREAT_COLORS: Record<ThreatLevelType, string> = {
  CLEAR: 'bg-emerald-500',
  ELEVATED: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-rose-500',
}

const THREAT_LABELS: Record<ThreatLevelType, string> = {
  CLEAR: 'Nominal',
  ELEVATED: 'Élevé',
  HIGH: 'Haut',
  CRITICAL: 'Critique',
}

export function RosStatusIndicator() {
  const { connected, connecting, threat, navigationStatus, state } = useRosBridge()

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            connected
              ? 'bg-emerald-500 animate-pulse'
              : connecting
                ? 'bg-amber-500 animate-pulse'
                : 'bg-rose-500'
          )}
        />
        <span className="text-xs font-medium">
          {connected ? 'ROS2' : connecting ? 'Connexion...' : 'Déconnecté'}
        </span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-border" />

      {/* Threat Level */}
      {threat && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              THREAT_COLORS[threat.level],
              threat.level !== 'CLEAR' && 'animate-pulse'
            )}
          />
          <span className="text-xs font-medium">
            {THREAT_LABELS[threat.level]}
          </span>
          {!threat.gpsSafe && (
            <span className="text-[10px] text-rose-400">GPS OFF</span>
          )}
        </div>
      )}

      {/* Navigation Status */}
      {navigationStatus && (
        <>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">
            Nav: {navigationStatus.status}
          </span>
        </>
      )}

      {/* FSM State */}
      {state && (
        <>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {state.state}
          </span>
        </>
      )}
    </div>
  )
}

/**
 * Compact threat badge for header
 */
export function ThreatBadge() {
  const { connected, threat } = useRosBridge()

  if (!connected || !threat) {
    return null
  }

  if (threat.level === 'CLEAR') {
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white',
        THREAT_COLORS[threat.level],
        'animate-pulse'
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
      {THREAT_LABELS[threat.level]}
    </div>
  )
}

/**
 * Full threat panel with details
 */
export function ThreatPanel() {
  const { connected, threat, navigationStatus } = useRosBridge()

  if (!connected) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Non connecté à CORTEX-U7
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vérifiez que rosbridge_server est lancé
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Threat Level Card */}
      <div
        className={cn(
          'rounded-lg border p-4',
          threat?.level === 'CRITICAL' && 'border-rose-500/50 bg-rose-500/10',
          threat?.level === 'HIGH' && 'border-orange-500/50 bg-orange-500/10',
          threat?.level === 'ELEVATED' && 'border-amber-500/50 bg-amber-500/10',
          threat?.level === 'CLEAR' && 'border-emerald-500/50 bg-emerald-500/10'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-4 w-4 rounded-full',
                threat && THREAT_COLORS[threat.level]
              )}
            />
            <div>
              <div className="font-semibold">
                Niveau de menace: {threat ? THREAT_LABELS[threat.level] : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                Score: {threat?.threatScore.toFixed(0) ?? 0}/100
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn(
              'text-sm font-medium',
              threat?.gpsSafe ? 'text-emerald-400' : 'text-rose-400'
            )}>
              GPS: {threat?.gpsSafe ? 'SAFE' : 'UNSAFE'}
            </div>
          </div>
        </div>

        {/* Threat list */}
        {threat && threat.threats.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <div className="text-xs font-medium text-muted-foreground">
              Menaces détectées:
            </div>
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
      </div>

      {/* Navigation Status */}
      {navigationStatus && (
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-semibold">Navigation</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-2 w-2 rounded-full',
                navigationStatus.vioActive ? 'bg-emerald-500' : 'bg-slate-600'
              )} />
              VIO
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-2 w-2 rounded-full',
                navigationStatus.lidarActive ? 'bg-emerald-500' : 'bg-slate-600'
              )} />
              LiDAR
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-2 w-2 rounded-full',
                navigationStatus.gpsActive ? 'bg-emerald-500' : 'bg-slate-600'
              )} />
              GPS
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-2 w-2 rounded-full',
                navigationStatus.celestialActive ? 'bg-emerald-500' : 'bg-slate-600'
              )} />
              Celestial
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Incertitude: {navigationStatus.uncertaintyM.toFixed(2)}m
          </div>
        </div>
      )}
    </div>
  )
}
