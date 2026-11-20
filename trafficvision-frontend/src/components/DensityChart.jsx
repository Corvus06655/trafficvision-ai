import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Activity } from 'lucide-react'
import { Card } from './ui'
import { tooltipStyle } from './VehicleChart'

const LEVELS = [
  { key: 'LOW', hint: '0 to 5 vehicles', color: '#3ecf8e' },
  { key: 'MEDIUM', hint: '6 to 9 vehicles', color: '#f5b83d' },
  { key: 'HIGH', hint: '10+ vehicles', color: '#ef5b5b' },
]

export default function DensityChart({ density = {} }) {
  const data = LEVELS.map((l) => ({ ...l, value: density[l.key] ?? 0 }))
  const total = data.reduce((s, d) => s + d.value, 0)
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0)
  return (
    <Card title="Traffic density" subtitle="Frames per density level" icon={Activity} className="h-full">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="key" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
              {data.map((d) => <Cell key={d.key} fill={d.color} />)}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v) => [`${v} frames`, 'Frames']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink" aria-hidden>
        {data.map((d) => <div key={d.key} style={{ width: `${pct(d.value)}%`, background: d.color }} />)}
      </div>
      <ul className="mt-4 space-y-3">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span className="font-medium text-white">{d.key}</span>
            <span className="text-muted">{d.hint}</span>
            <span className="ml-auto tabular-nums text-white">
              {d.value.toLocaleString()} <span className="text-muted">({pct(d.value)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
