import { useTranslation } from 'react-i18next'
import type { IntegrityResult } from '../types/celestial'
import { cn } from '../lib/utils'

export type MetricsPanelProps = {
  result: IntegrityResult | null
}

function statusColor(status: IntegrityResult['status']): string {
  switch (status) {
    case 'nominal':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'degraded':
      return 'text-amber-600 dark:text-amber-400'
    case 'anomalous':
      return 'text-rose-600 dark:text-rose-400'
  }
}

export default function MetricsPanel({ result }: MetricsPanelProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="text-sm font-semibold">{t('metrics.title')}</div>
        <div className="mt-1 text-xs text-muted-foreground">{t('metrics.subtitle')}</div>
      </div>

      <div className="p-4">
        {!result ? (
          <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
            {t('metrics.empty')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-background p-4">
              <div className="text-xs font-medium text-muted-foreground">{t('metrics.integrityScore')}</div>
              <div className="mt-1 flex items-baseline justify-between gap-4">
                <div className={cn('text-4xl font-semibold tracking-tight', statusColor(result.status))}>
                  {result.integrityScorePct.toFixed(2)}%
                </div>
                <div className={cn('text-sm font-semibold', statusColor(result.status))}>
                  {t(`status.${result.status}`)}
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <MetricRow label={t('metrics.deltaAngle')} value={`${result.deltaAngleDeg.toFixed(3)}°`} />
              <MetricRow label={t('metrics.deltaAzimuth')} value={`${result.deltaAzDeg.toFixed(3)}°`} />
              <MetricRow label={t('metrics.deltaElevation')} value={`${result.deltaElDeg.toFixed(3)}°`} />
              <MetricRow label={t('metrics.hammingDistance')} value={`${result.hammingDistanceBits} bits`} />
              <MetricRow label={t('metrics.prediction')} value={`${result.timingsMs.prediction.toFixed(1)} ms`} />
              <MetricRow label={t('metrics.crypto')} value={`${result.timingsMs.crypto.toFixed(1)} ms`} />
              <MetricRow label={t('metrics.total')} value={`${result.timingsMs.total.toFixed(1)} ms`} />
            </div>

            <div className="rounded-md border bg-background p-4">
              <div className="text-xs font-medium text-muted-foreground">{t('metrics.signatures')}</div>
              <div className="mt-2 grid gap-2 text-xs font-mono">
                <SignatureRow label={t('metrics.signature.expected')} hex={result.expectedSignatureHex} />
                <SignatureRow label={t('metrics.signature.observed')} hex={result.observedSignatureHex} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

type MetricRowProps = {
  label: string
  value: string
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  )
}

type SignatureRowProps = {
  label: string
  hex: string
}

function SignatureRow({ label, hex }: SignatureRowProps) {
  const short = hex.length > 32 ? `${hex.slice(0, 16)}…${hex.slice(-16)}` : hex
  return (
    <div className="grid grid-cols-[84px_1fr] items-center gap-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="truncate" title={hex}>
        {short}
      </div>
    </div>
  )
}
