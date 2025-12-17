import { useTranslation } from 'react-i18next'
import type { CelestialObservation, NavigationState } from '../types/celestial'
import { cn } from '../lib/utils'
import ScenarioCard from './ScenarioCard'

export type SimulationPanelProps = {
  navigation: NavigationState
  observedSun: CelestialObservation
  predictedSun: CelestialObservation
  onChangeNavigation: (next: NavigationState) => void
  onChangeObservedSun: (next: CelestialObservation) => void
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

export default function SimulationPanel({
  navigation,
  observedSun,
  predictedSun,
  onChangeNavigation,
  onChangeObservedSun,
  onApplyNominalScenario,
  onSetObservedToPredicted,
  onRunValidation,
}: SimulationPanelProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="text-sm font-semibold">{t('simulation.title')}</div>
        <div className="mt-1 text-xs text-muted-foreground">{t('simulation.subtitle')}</div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">{t('simulation.scenarios')}</div>
          <ScenarioCard
            title={t('scenarios.nominal.title')}
            description={t('scenarios.nominal.description')}
            onSelect={onApplyNominalScenario}
          />
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
