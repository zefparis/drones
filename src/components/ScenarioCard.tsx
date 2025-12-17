import { cn } from '../lib/utils'

export type ScenarioCardProps = {
  title: string
  description: string
  onSelect: () => void
}

export default function ScenarioCard({ title, description, onSelect }: ScenarioCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border bg-card p-4 text-left transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </button>
  )
}
