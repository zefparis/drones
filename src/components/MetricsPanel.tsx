import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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

 type HistoryPoint = {
   time: number
   score: number
 }

export default function MetricsPanel({ result }: MetricsPanelProps) {
  const { t } = useTranslation()

   const [history, setHistory] = useState<HistoryPoint[]>([])

   const [copiedExpected, setCopiedExpected] = useState(false)
   const [copiedObserved, setCopiedObserved] = useState(false)

   useEffect(() => {
     if (!result) return

     setHistory((prev) => {
       const nextEntry: HistoryPoint = {
         time: Date.now(),
         score: result.integrityScorePct / 100,
       }

       return [...prev.slice(-59), nextEntry]
     })
   }, [result])

  function copySignature(hex: string, which: 'expected' | 'observed'): void {
    if (!navigator.clipboard) return

    void navigator.clipboard.writeText(hex)

    if (which === 'expected') {
      setCopiedExpected(true)
      window.setTimeout(() => setCopiedExpected(false), 2000)
    } else {
      setCopiedObserved(true)
      window.setTimeout(() => setCopiedObserved(false), 2000)
    }
  }

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

            {result.multiSensor ? (
              <div className="rounded-md border bg-background p-4">
                <div className="text-xs font-medium text-muted-foreground">{t('metrics.fusion.title')}</div>

                <div className="mt-3 grid gap-3">
                  <MetricRow label={t('metrics.fusion.consensusScore')} value={`${result.multiSensor.consensusScorePct.toFixed(2)}%`} />
                  <MetricRow label={t('metrics.fusion.sensorCount')} value={`${result.multiSensor.sensorCount}`} />
                </div>

                <div className="mt-3 space-y-2">
                  {result.multiSensor.signatures.map((sig) => {
                    const label =
                      sig.sensor === 'sun'
                        ? t('metrics.fusion.sun')
                        : sig.sensor === 'magnetometer'
                          ? t('metrics.fusion.magnetometer')
                          : `${t('metrics.fusion.star')}: ${sig.name ?? sig.id}`

                    return (
                      <div
                        key={`${sig.sensor}-${sig.id}`}
                        className="rounded-md border bg-card/30 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-xs font-medium">{label}</div>
                          <div className="text-xs font-semibold">{sig.integrityScorePct.toFixed(2)}%</div>
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                          <div>
                            {t('metrics.fusion.delta')}: {sig.deltaDeg.toFixed(2)}°
                          </div>
                          <div>
                            {t('metrics.fusion.weight')}: {sig.weight.toFixed(2)}
                          </div>
                          <div>
                            {t('metrics.fusion.confidence')}: {sig.confidence.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

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
              <div className="mt-3 space-y-3">
                <SignatureBlock
                  label={t('metrics.signature.expected')}
                  hex={result.expectedSignatureHex}
                  copied={copiedExpected}
                  onCopy={() => copySignature(result.expectedSignatureHex, 'expected')}
                  copyLabel={t('metrics.signature.copy')}
                  copiedLabel={t('metrics.signature.copied')}
                />
                <SignatureBlock
                  label={t('metrics.signature.observed')}
                  hex={result.observedSignatureHex}
                  copied={copiedObserved}
                  onCopy={() => copySignature(result.observedSignatureHex, 'observed')}
                  copyLabel={t('metrics.signature.copy')}
                  copiedLabel={t('metrics.signature.copied')}
                />
              </div>
            </div>

            <div className="rounded-md border bg-background p-4">
              <div className="flex items-baseline justify-between gap-4">
                <div className="text-xs font-medium text-muted-foreground">{t('metrics.historyTitle')}</div>
                <div className="text-xs text-muted-foreground">
                  {history.length} {t('metrics.samples')}
                </div>
              </div>

              <div className="mt-3">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="time"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />

                      <ReferenceLine
                        y={0.95}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        label={{
                          value: t('status.nominal'),
                          position: 'right',
                          fill: '#10b981',
                          fontSize: 10,
                        }}
                      />
                      <ReferenceLine
                        y={0.8}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        label={{
                          value: t('status.degraded'),
                          position: 'right',
                          fill: '#f59e0b',
                          fontSize: 10,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        isAnimationActive={false}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          padding: '8px 12px',
                        }}
                        formatter={(value) => {
                          const numeric = typeof value === 'number' ? value : Number(value)
                          return [`${(numeric * 100).toFixed(2)}%`, t('metrics.integrityScore')]
                        }}
                        labelFormatter={(label) => {
                          const numeric = typeof label === 'number' ? label : Number(label)
                          return new Date(numeric).toLocaleString()
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">{t('metrics.historyEmpty')}</p>
                  </div>
                )}
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

type SignatureBlockProps = SignatureRowProps & {
  copied: boolean
  onCopy: () => void
  copyLabel: string
  copiedLabel: string
}

function SignatureBlock({ label, hex, copied, onCopy, copyLabel, copiedLabel }: SignatureBlockProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>

      <code className="mt-2 block break-all rounded bg-muted/50 p-2 text-xs font-mono">{hex}</code>
    </div>
  )
}
