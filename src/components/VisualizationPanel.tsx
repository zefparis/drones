import { useTranslation } from 'react-i18next'
import type { CelestialObservation, MultiSensorFusion, NavigationState } from '../types/celestial'

export type VisualizationPanelProps = {
  navigation: NavigationState
  predictedSun: CelestialObservation
  observedSun: CelestialObservation
  fusion?: MultiSensorFusion
}

function pointFor(obs: CelestialObservation, radiusMax: number, cx: number, cy: number) {
  const r = ((90 - obs.elevationDeg) / 90) * radiusMax
  const theta = ((obs.azimuthDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta),
  }
}

function headingPointFor(headingDeg: number, radiusMax: number, cx: number, cy: number) {
  const theta = ((headingDeg - 90) * Math.PI) / 180
  return {
    x: cx + radiusMax * Math.cos(theta),
    y: cy + radiusMax * Math.sin(theta),
  }
}

export default function VisualizationPanel({ navigation, predictedSun, observedSun, fusion }: VisualizationPanelProps) {
  const { t } = useTranslation()

  const size = 260
  const cx = size / 2
  const cy = size / 2
  const radius = 110

  const predicted = pointFor(predictedSun, radius, cx, cy)
  const observed = pointFor(observedSun, radius, cx, cy)

  const signatures = fusion?.signatures ?? []

  const starPairs = signatures
    .filter((sig) => sig.sensor === 'star')
    .flatMap((sig) => {
      const pAz = sig.predicted.azimuthDeg
      const pEl = sig.predicted.elevationDeg
      const oAz = sig.observed.azimuthDeg
      const oEl = sig.observed.elevationDeg

      if (pAz === undefined || pEl === undefined || oAz === undefined || oEl === undefined) return []

      return [
        {
          key: sig.id,
          predicted: pointFor({ azimuthDeg: pAz, elevationDeg: pEl }, radius, cx, cy),
          observed: pointFor({ azimuthDeg: oAz, elevationDeg: oEl }, radius, cx, cy),
        },
      ]
    })

  const magnetometerSignature = signatures.find((sig) => sig.sensor === 'magnetometer')
  const magnetometerPredHeadingDeg = magnetometerSignature?.predicted.headingDeg
  const magnetometerObsHeadingDeg = magnetometerSignature?.observed.headingDeg
  const magnetometerPred =
    magnetometerPredHeadingDeg === undefined
      ? null
      : headingPointFor(magnetometerPredHeadingDeg, radius, cx, cy)
  const magnetometerObs =
    magnetometerObsHeadingDeg === undefined ? null : headingPointFor(magnetometerObsHeadingDeg, radius, cx, cy)

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
            {/* Elevation circles (30°, 60°, 90°) */}
            {[30, 60, 90].map((deg) => {
              const r = (radius * (90 - deg)) / 90
              return (
                <g key={`elev-${deg}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.2"
                    className="text-slate-600"
                  />
                  <text x={cx + r - 15} y={cy - 5} className="fill-slate-500 text-[10px]">
                    {deg}°
                  </text>
                </g>
              )
            })}

            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="2" />

            <line x1={cx} y1={cy - radius} x2={cx} y2={cy + radius} stroke="hsl(var(--border))" />
            <line x1={cx - radius} y1={cy} x2={cx + radius} y2={cy} stroke="hsl(var(--border))" />

            {/* Cardinal direction labels */}
            <text
              x={cx}
              y={cy - radius - 15}
              textAnchor="middle"
              className="fill-slate-200 text-sm font-bold"
            >
              N
            </text>
            <text
              x={cx + radius + 15}
              y={cy + 5}
              textAnchor="start"
              className="fill-slate-200 text-sm font-bold"
            >
              E
            </text>
            <text
              x={cx}
              y={cy + radius + 20}
              textAnchor="middle"
              className="fill-slate-200 text-sm font-bold"
            >
              S
            </text>
            <text
              x={cx - radius - 15}
              y={cy + 5}
              textAnchor="end"
              className="fill-slate-200 text-sm font-bold"
            >
              W
            </text>

            {/* Azimuth degree markers every 30° */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((az) => {
              const rad = ((az - 90) * Math.PI) / 180
              const x = cx + (radius + 25) * Math.cos(rad)
              const y = cy + (radius + 25) * Math.sin(rad)
              return (
                <text
                  key={`az-${az}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-500 text-[9px]"
                >
                  {az}°
                </text>
              )
            })}

            {/* Center dot */}
            <circle cx={cx} cy={cy} r={3} fill="#64748b" />

            {magnetometerPred ? (
              <line
                x1={cx}
                y1={cy}
                x2={magnetometerPred.x}
                y2={magnetometerPred.y}
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity="0.8"
              />
            ) : null}
            {magnetometerObs ? (
              <line
                x1={cx}
                y1={cy}
                x2={magnetometerObs.x}
                y2={magnetometerObs.y}
                stroke="#f97316"
                strokeWidth="2"
                opacity="0.85"
              />
            ) : null}

            {starPairs.map((star) => (
              <g key={`star-${star.key}`}>
                <line
                  x1={star.predicted.x}
                  y1={star.predicted.y}
                  x2={star.observed.x}
                  y2={star.observed.y}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                  opacity="0.35"
                />
                <circle cx={star.predicted.x} cy={star.predicted.y} r={3} fill="none" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx={star.observed.x} cy={star.observed.y} r={3} fill="#a855f7" opacity="0.8" />
              </g>
            ))}

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
          {fusion ? (
            <>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#a855f7' }} />
                <span>{t('visualization.legend.stars')}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-0.5 w-4" style={{ backgroundColor: '#10b981' }} />
                <span>{t('visualization.legend.magnetometer')}</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
