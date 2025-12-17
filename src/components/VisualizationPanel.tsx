import { useTranslation } from 'react-i18next'
import type { CelestialObservation, NavigationState } from '../types/celestial'

export type VisualizationPanelProps = {
  navigation: NavigationState
  predictedSun: CelestialObservation
  observedSun: CelestialObservation
}

function pointFor(obs: CelestialObservation, radiusMax: number, cx: number, cy: number) {
  const r = ((90 - obs.elevationDeg) / 90) * radiusMax
  const theta = ((obs.azimuthDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta),
  }
}

export default function VisualizationPanel({ navigation, predictedSun, observedSun }: VisualizationPanelProps) {
  const { t } = useTranslation()

  const size = 260
  const cx = size / 2
  const cy = size / 2
  const radius = 110

  const predicted = pointFor(predictedSun, radius, cx, cy)
  const observed = pointFor(observedSun, radius, cx, cy)

  const time = new Date(navigation.timestampMs)

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="text-sm font-semibold">{t('visualization.title')}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t('visualization.timestamp')}: {time.toUTCString()}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
            <circle cx={cx} cy={cy} r={radius * 0.66} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={radius * 0.33} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />

            <line x1={cx} y1={cy - radius} x2={cx} y2={cy + radius} stroke="hsl(var(--border))" />
            <line x1={cx - radius} y1={cy} x2={cx + radius} y2={cy} stroke="hsl(var(--border))" />

            <circle cx={predicted.x} cy={predicted.y} r={6} fill="#2563eb" />
            <circle cx={observed.x} cy={observed.y} r={6} fill="#f59e0b" />

            <line
              x1={predicted.x}
              y1={predicted.y}
              x2={observed.x}
              y2={observed.y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
          <div>
            {t('visualization.predictedLine', {
              az: predictedSun.azimuthDeg.toFixed(2),
              el: predictedSun.elevationDeg.toFixed(2),
            })}
          </div>
          <div>
            {t('visualization.observedLine', {
              az: observedSun.azimuthDeg.toFixed(2),
              el: observedSun.elevationDeg.toFixed(2),
            })}
          </div>
        </div>

        <div className="mt-3 flex gap-3 text-xs">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span>{t('visualization.legend.predicted')}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>{t('visualization.legend.observed')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
