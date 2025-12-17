import { useTranslation } from 'react-i18next'
import { predictSunObservation } from '../lib/ephemeris'
import { computeMagneticField, computeMagneticHeading } from '../lib/magnetometer'
import { findVisibleStars } from '../lib/stars'
import type {
  CelestialObservation,
  MagneticHeadingObservation,
  NavigationState,
  StarObservationInput,
} from '../types/celestial'
import { cn } from '../lib/utils'

export type SimulationPanelProps = {
  navigation: NavigationState
  observedSun: CelestialObservation
  observedStars: StarObservationInput[]
  observedMagnetometer: MagneticHeadingObservation | null
  predictedSun: CelestialObservation
  onChangeNavigation: (next: NavigationState) => void
  onChangeObservedSun: (next: CelestialObservation) => void
  onChangeObservedStars: (next: StarObservationInput[]) => void
  onChangeObservedMagnetometer: (next: MagneticHeadingObservation | null) => void
  onApplyNominalScenario: () => void
  onSetObservedToPredicted: () => void
  onRunValidation: () => void
}

function toDateTimeLocalValue(timestampMs: number): string {
  const date = new Date(timestampMs)
  if (Number.isNaN(date.getTime())) return ''

  const pad2 = (n: number) => String(n).padStart(2, '0')

  const yyyy = date.getFullYear()
  const mm = pad2(date.getMonth() + 1)
  const dd = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const min = pad2(date.getMinutes())

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function parseNumber(value: string): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const SCENARIO_TIME_MS = Date.parse('2025-06-21T12:00:00Z')

const TRUE_STATE: NavigationState = {
  timestampMs: SCENARIO_TIME_MS,
  latitudeDeg: 48.8566,
  longitudeDeg: 2.3522,
  altitudeM: 35,
}

const TRUE_SUN: CelestialObservation = predictSunObservation(TRUE_STATE, { refraction: 'normal' })

const NIGHT_TIME_MS = Date.parse('2025-12-21T00:00:00Z')

const NIGHT_STATE: NavigationState = {
  ...TRUE_STATE,
  timestampMs: NIGHT_TIME_MS,
}

const NIGHT_SUN: CelestialObservation = predictSunObservation(NIGHT_STATE, { refraction: 'normal' })

export default function SimulationPanel({
  navigation,
  observedSun,
  observedStars,
  observedMagnetometer,
  predictedSun,
  onChangeNavigation,
  onChangeObservedSun,
  onChangeObservedStars,
  onChangeObservedMagnetometer,
  onApplyNominalScenario,
  onSetObservedToPredicted,
  onRunValidation,
}: SimulationPanelProps) {
  const { t } = useTranslation()

  function populateStars(count: number): void {
    const visible = findVisibleStars(
      navigation.latitudeDeg,
      navigation.longitudeDeg,
      navigation.altitudeM,
      new Date(navigation.timestampMs),
      15,
    ).slice(0, count)

    onChangeObservedStars(
      visible.map((obs) => ({
        id: obs.star.id,
        name: obs.star.name,
        azimuthDeg: obs.azimuthDeg,
        elevationDeg: obs.elevationDeg,
        confidence: obs.confidence,
      })),
    )
  }

  function populateMagnetometer(): void {
    const time = new Date(navigation.timestampMs)
    const field = computeMagneticField(navigation.latitudeDeg, navigation.longitudeDeg, navigation.altitudeM, time)
    const predictedHeading = computeMagneticHeading(field)

    onChangeObservedMagnetometer({
      headingDeg: wrap360(predictedHeading.headingDeg + 0.8),
      confidence: clamp(predictedHeading.confidence * 0.95, 0, 1),
    })
  }

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="text-sm font-semibold">{t('simulation.title')}</div>
        <div className="mt-1 text-xs text-muted-foreground">{t('simulation.subtitle')}</div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">{t('simulation.scenarios')}</div>

          {/* Scenario Presets */}
          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={onApplyNominalScenario}
              className={cn(
                'group w-full rounded-lg border px-4 py-3 text-left transition-colors',
                'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-emerald-400 group-hover:text-emerald-300">
                    {t('scenarios.nominal.title')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('scenarios.nominal.description')}</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeNavigation({
                  ...TRUE_STATE,
                  latitudeDeg: 48.8575,
                })
                onChangeObservedSun(TRUE_SUN)
                onChangeObservedStars([])
                onChangeObservedMagnetometer(null)
              }}
              className={cn(
                'group w-full rounded-lg border px-4 py-3 text-left transition-colors',
                'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-amber-400 group-hover:text-amber-300">
                    {t('scenarios.drift100.title')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('scenarios.drift100.description')}</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeNavigation({
                  ...TRUE_STATE,
                  latitudeDeg: 48.8766,
                })
                onChangeObservedSun(TRUE_SUN)
                onChangeObservedStars([])
                onChangeObservedMagnetometer(null)
              }}
              className={cn(
                'group w-full rounded-lg border px-4 py-3 text-left transition-colors',
                'border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-rose-400 group-hover:text-rose-300">
                    {t('scenarios.spoofing.title')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('scenarios.spoofing.description')}</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeNavigation(TRUE_STATE)
                onChangeObservedSun(TRUE_SUN)
                onChangeObservedStars([])

                const time = new Date(TRUE_STATE.timestampMs)
                const field = computeMagneticField(TRUE_STATE.latitudeDeg, TRUE_STATE.longitudeDeg, TRUE_STATE.altitudeM, time)
                const predictedHeading = computeMagneticHeading(field)

                onChangeObservedMagnetometer({
                  headingDeg: wrap360(predictedHeading.headingDeg + 0.8),
                  confidence: clamp(predictedHeading.confidence * 0.95, 0, 1),
                })
              }}
              className={cn(
                'group w-full rounded-lg border px-4 py-3 text-left transition-colors',
                'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧭</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-blue-400 group-hover:text-blue-300">
                    {t('scenarios.multiSensorDay.title')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('scenarios.multiSensorDay.description')}</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeNavigation(NIGHT_STATE)
                onChangeObservedSun(NIGHT_SUN)

                const time = new Date(NIGHT_STATE.timestampMs)
                const visible = findVisibleStars(
                  NIGHT_STATE.latitudeDeg,
                  NIGHT_STATE.longitudeDeg,
                  NIGHT_STATE.altitudeM,
                  time,
                  15,
                ).slice(0, 3)

                onChangeObservedStars(
                  visible.map((obs) => ({
                    id: obs.star.id,
                    name: obs.star.name,
                    azimuthDeg: obs.azimuthDeg,
                    elevationDeg: obs.elevationDeg,
                    confidence: obs.confidence,
                  })),
                )

                const field = computeMagneticField(
                  NIGHT_STATE.latitudeDeg,
                  NIGHT_STATE.longitudeDeg,
                  NIGHT_STATE.altitudeM,
                  time,
                )
                const predictedHeading = computeMagneticHeading(field)

                onChangeObservedMagnetometer({
                  headingDeg: wrap360(predictedHeading.headingDeg + 0.8),
                  confidence: clamp(predictedHeading.confidence * 0.95, 0, 1),
                })
              }}
              className={cn(
                'group w-full rounded-lg border px-4 py-3 text-left transition-colors',
                'border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌙</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-indigo-400 group-hover:text-indigo-300">
                    {t('scenarios.night.title')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('scenarios.night.description')}</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeNavigation(NIGHT_STATE)
                onChangeObservedSun(NIGHT_SUN)

                const time = new Date(NIGHT_STATE.timestampMs)
                const visible = findVisibleStars(
                  NIGHT_STATE.latitudeDeg,
                  NIGHT_STATE.longitudeDeg,
                  NIGHT_STATE.altitudeM,
                  time,
                  15,
                ).slice(0, 5)

                onChangeObservedStars(
                  visible.map((obs) => ({
                    id: obs.star.id,
                    name: obs.star.name,
                    azimuthDeg: obs.azimuthDeg,
                    elevationDeg: obs.elevationDeg,
                    confidence: obs.confidence,
                  })),
                )

                const field = computeMagneticField(
                  NIGHT_STATE.latitudeDeg,
                  NIGHT_STATE.longitudeDeg,
                  NIGHT_STATE.altitudeM,
                  time,
                )
                const predictedHeading = computeMagneticHeading(field)

                onChangeObservedMagnetometer({
                  headingDeg: wrap360(predictedHeading.headingDeg + 0.8),
                  confidence: clamp(predictedHeading.confidence * 0.95, 0, 1),
                })
              }}
              className={cn(
                'group w-full rounded-lg border px-4 py-3 text-left transition-colors',
                'border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/20',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛰️</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-violet-400 group-hover:text-violet-300">
                    {t('scenarios.consensus.title')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('scenarios.consensus.description')}</div>
                </div>
              </div>
            </button>
          </div>

          {/* Add visual separator */}
          <div className="mb-4 border-t border-border pt-4">
            <p className="text-xs italic text-muted-foreground">{t('scenarios.manualHint')}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <Field
            label={t('simulation.timestamp')}
            value={toDateTimeLocalValue(navigation.timestampMs)}
            onChange={(v) => {
              const ts = new Date(v).getTime()
              if (Number.isNaN(ts)) return
              onChangeNavigation({ ...navigation, timestampMs: ts })
            }}
            type="datetime-local"
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t('simulation.latitude')}
              value={navigation.latitudeDeg}
              onChange={(v) => {
                const n = parseNumber(v)
                if (n === null) return
                onChangeNavigation({ ...navigation, latitudeDeg: n })
              }}
              type="number"
              step="0.0001"
            />
            <Field
              label={t('simulation.longitude')}
              value={navigation.longitudeDeg}
              onChange={(v) => {
                const n = parseNumber(v)
                if (n === null) return
                onChangeNavigation({ ...navigation, longitudeDeg: n })
              }}
              type="number"
              step="0.0001"
            />
          </div>

          <Field
            label={t('simulation.altitude')}
            value={navigation.altitudeM}
            onChange={(v) => {
              const n = parseNumber(v)
              if (n === null) return
              onChangeNavigation({ ...navigation, altitudeM: n })
            }}
            type="number"
            step="1"
          />

          <div className="rounded-md border bg-background p-3">
            <div className="text-xs font-medium">{t('simulation.predictedSun')}</div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                {t('simulation.azimuth')}: {predictedSun.azimuthDeg.toFixed(2)}°
              </div>
              <div>
                {t('simulation.elevation')}: {predictedSun.elevationDeg.toFixed(2)}°
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium">{t('simulation.observedStars')}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-medium',
                    'bg-card hover:bg-accent hover:text-accent-foreground',
                  )}
                  onClick={() => populateStars(3)}
                >
                  {t('simulation.autoStars')}
                </button>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-medium',
                    'bg-card hover:bg-accent hover:text-accent-foreground',
                  )}
                  onClick={() => onChangeObservedStars([])}
                >
                  {t('simulation.clear')}
                </button>
              </div>
            </div>

            {observedStars.length === 0 ? (
              <div className="mt-2 text-xs text-muted-foreground">{t('simulation.starsEmpty')}</div>
            ) : (
              <div className="mt-2 space-y-3">
                {observedStars.map((star, index) => (
                  <div key={`${star.id}-${index}`} className="rounded-md border bg-card/30 p-2">
                    <div className="text-xs font-medium">{star.name ?? star.id}</div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Field
                        label={t('simulation.azimuth')}
                        value={star.azimuthDeg}
                        onChange={(v) => {
                          const n = parseNumber(v)
                          if (n === null) return
                          onChangeObservedStars(
                            observedStars.map((s, i) => (i === index ? { ...s, azimuthDeg: n } : s)),
                          )
                        }}
                        type="number"
                        step="0.01"
                      />
                      <Field
                        label={t('simulation.elevation')}
                        value={star.elevationDeg}
                        onChange={(v) => {
                          const n = parseNumber(v)
                          if (n === null) return
                          onChangeObservedStars(
                            observedStars.map((s, i) => (i === index ? { ...s, elevationDeg: n } : s)),
                          )
                        }}
                        type="number"
                        step="0.01"
                      />
                      <Field
                        label={t('simulation.confidence')}
                        value={star.confidence}
                        onChange={(v) => {
                          const n = parseNumber(v)
                          if (n === null) return
                          onChangeObservedStars(
                            observedStars.map((s, i) => (i === index ? { ...s, confidence: n } : s)),
                          )
                        }}
                        type="number"
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium">{t('simulation.observedMagnetometer')}</div>
              {observedMagnetometer ? (
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-medium',
                    'bg-card hover:bg-accent hover:text-accent-foreground',
                  )}
                  onClick={() => onChangeObservedMagnetometer(null)}
                >
                  {t('simulation.clear')}
                </button>
              ) : (
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-medium',
                    'bg-card hover:bg-accent hover:text-accent-foreground',
                  )}
                  onClick={populateMagnetometer}
                >
                  {t('simulation.autoMagnetometer')}
                </button>
              )}
            </div>

            {!observedMagnetometer ? (
              <div className="mt-2 text-xs text-muted-foreground">{t('simulation.magnetometerEmpty')}</div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Field
                  label={t('simulation.heading')}
                  value={observedMagnetometer.headingDeg}
                  onChange={(v) => {
                    const n = parseNumber(v)
                    if (n === null) return
                    onChangeObservedMagnetometer({ ...observedMagnetometer, headingDeg: n })
                  }}
                  type="number"
                  step="0.01"
                />
                <Field
                  label={t('simulation.confidence')}
                  value={observedMagnetometer.confidence}
                  onChange={(v) => {
                    const n = parseNumber(v)
                    if (n === null) return
                    onChangeObservedMagnetometer({ ...observedMagnetometer, confidence: n })
                  }}
                  type="number"
                  step="0.01"
                />
              </div>
            )}
          </div>

          <div className="rounded-md border bg-background p-3">
            <div className="text-xs font-medium">{t('simulation.observedSun')}</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Field
                label={t('simulation.azimuth')}
                value={observedSun.azimuthDeg}
                onChange={(v) => {
                  const n = parseNumber(v)
                  if (n === null) return
                  onChangeObservedSun({ ...observedSun, azimuthDeg: n })
                }}
                type="number"
                step="0.01"
              />
              <Field
                label={t('simulation.elevation')}
                value={observedSun.elevationDeg}
                onChange={(v) => {
                  const n = parseNumber(v)
                  if (n === null) return
                  onChangeObservedSun({ ...observedSun, elevationDeg: n })
                }}
                type="number"
                step="0.01"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className={cn(
                  'inline-flex flex-1 items-center justify-center rounded-md border px-3 py-2 text-xs font-medium',
                  'bg-card hover:bg-accent hover:text-accent-foreground',
                )}
                onClick={onSetObservedToPredicted}
              >
                {t('simulation.setObservedToPredicted')}
              </button>
            </div>
          </div>

          <button
            type="button"
            className={cn(
              'inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold',
              'bg-primary text-primary-foreground hover:opacity-95',
            )}
            onClick={onRunValidation}
          >
            {t('simulation.run')}
          </button>
        </div>
      </div>
    </section>
  )
}

type FieldProps = {
  label: string
  value: string | number
  onChange: (value: string) => void
  type: 'number' | 'datetime-local'
  step?: string
}

function Field({ label, value, onChange, type, step }: FieldProps) {
  return (
    <label className="grid gap-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        className={cn(
          'h-9 rounded-md border bg-background px-3 text-sm text-foreground',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
        )}
        type={type}
        step={step}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function wrap360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
