import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import MetricsPanel from './components/MetricsPanel'
import SimulationPanel from './components/SimulationPanel'
import VisualizationPanel from './components/VisualizationPanel'
import { createDefaultValidator } from './lib/celestialValidator'
import { predictSunObservation } from './lib/ephemeris'
import { isNightTime } from './lib/stars'
import type {
  CelestialObservation,
  IntegrityResult,
  MagneticHeadingObservation,
  MultiSensorObservations,
  NavigationState,
  StarObservationInput,
} from './types/celestial'

const NOMINAL_NAVIGATION: NavigationState = {
  timestampMs: Date.parse('2025-06-21T12:00:00Z'),
  latitudeDeg: 48.8566,
  longitudeDeg: 2.3522,
  altitudeM: 35,
}

export default function App() {
  const { t } = useTranslation()

  const validator = useMemo(() => createDefaultValidator(), [])

  const [navigation, setNavigation] = useState<NavigationState>(NOMINAL_NAVIGATION)

  const predictedSun = useMemo(
    () => predictSunObservation(navigation, { refraction: 'normal' }),
    [navigation],
  )

  const [observedSun, setObservedSun] = useState<CelestialObservation>(() =>
    predictSunObservation(NOMINAL_NAVIGATION, { refraction: 'normal' }),
  )

  const [observedStars, setObservedStars] = useState<StarObservationInput[]>([])
  const [observedMagnetometer, setObservedMagnetometer] = useState<MagneticHeadingObservation | null>(null)

  const [result, setResult] = useState<IntegrityResult | null>(null)

  function applyNominalScenario(): void {
    setNavigation(NOMINAL_NAVIGATION)
    setObservedSun(predictSunObservation(NOMINAL_NAVIGATION, { refraction: 'normal' }))
    setObservedStars([])
    setObservedMagnetometer(null)
    setResult(null)
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-[340px_1fr_340px]">
          <SimulationPanel
            navigation={navigation}
            observedSun={observedSun}
            observedStars={observedStars}
            observedMagnetometer={observedMagnetometer}
            predictedSun={predictedSun}
            onChangeNavigation={(next) => {
              setNavigation(next)
              setResult(null)
            }}
            onChangeObservedSun={(next) => {
              setObservedSun(next)
              setResult(null)
            }}
            onChangeObservedStars={(next) => {
              setObservedStars(next)
              setResult(null)
            }}
            onChangeObservedMagnetometer={(next) => {
              setObservedMagnetometer(next)
              setResult(null)
            }}
            onApplyNominalScenario={applyNominalScenario}
            onSetObservedToPredicted={() => {
              setObservedSun(predictedSun)
              setResult(null)
            }}
            onRunValidation={() => {
              const hasExtraSensors = observedStars.length > 0 || observedMagnetometer !== null
              if (!hasExtraSensors) {
                const r = validator.validate(navigation, observedSun)
                setResult(r)
                return
              }

              const time = new Date(navigation.timestampMs)
              const observations: MultiSensorObservations = {
                sun: isNightTime(navigation.latitudeDeg, navigation.longitudeDeg, navigation.altitudeM, time)
                  ? undefined
                  : observedSun,
                stars: observedStars.length > 0 ? observedStars : undefined,
                magnetometer: observedMagnetometer ?? undefined,
              }

              void (async () => {
                const r = await validator.validateMultiSensor(navigation, observations)
                setResult(r)
              })()
            }}
          />

          <div className="grid gap-6">
            <VisualizationPanel
              navigation={navigation}
              predictedSun={result?.predictedSun ?? predictedSun}
              observedSun={result?.observedSun ?? observedSun}
              fusion={result?.multiSensor}
            />

            <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
              {t('app.placeholder')}
            </div>
          </div>

          <MetricsPanel result={result} />
        </div>
      </main>
    </div>
  )
}
