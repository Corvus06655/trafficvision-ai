import { Car, Film, Gauge, TrafficCone } from 'lucide-react'

export default function KpiCards({ analytics: a }) {
  const total = a.total_frames || 0
  const highShare = total ? Math.round(((a.density_count?.HIGH ?? 0) / total) * 100) : 0
  const items = [
    { label: 'Total vehicles', value: a.total_vehicles, hint: 'Unique tracked IDs', icon: Car },
    { label: 'Total frames', value: a.total_frames, hint: 'Frames analyzed', icon: Film },
    { label: 'Maximum vehicles', value: a.max_vehicles, hint: 'Peak count in a single frame', icon: Gauge },
    { label: 'High-density time', value: `${highShare}%`, hint: 'Share of frames rated HIGH', icon: TrafficCone },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ label, value, hint, icon: Icon }) => (
        <div key={label} className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between text-sm text-muted">
            {label} <Icon size={18} className="text-signal" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-white sm:text-4xl">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="mt-1 text-sm text-muted">{hint}</p>
        </div>
      ))}
    </div>
  )
}
