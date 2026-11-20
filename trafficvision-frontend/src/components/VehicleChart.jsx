
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import { BarChart3, ScanText } from 'lucide-react'
import { Card } from './ui'

const CLASSES = [
  { key: 'car', name: 'Cars', color: '#5ab0ff' },
  { key: 'motorcycle', name: 'Motorcycles', color: '#c58bff' },
  { key: 'bus', name: 'Buses', color: '#f5b83d' },
  { key: 'truck', name: 'Trucks', color: '#3ecf8e' },
]

export const tooltipStyle = {
  contentStyle: {
    background: '#0b1118',
    border: '1px solid #223041',
    borderRadius: 8,
    color: '#e6edf5'
  },
  itemStyle: { color: '#e6edf5' },
}

export default function VehicleChart({
  counts = {},
  plates = []
}) {
  const data = CLASSES.map((c) => ({
    ...c,
    value: counts[c.key] ?? 0
  }))

  const sum = data.reduce((s, d) => s + d.value, 0)

  const avgConfidence = plates.length
    ? plates.reduce((s, p) => s + p.confidence, 0) / plates.length
    : 0

  return (
    <div className="space-y-6">

      <Card title="Vehicle categories" subtitle="Unique vehicles per class" icon={BarChart3}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#223041" vertical={false} />
              <XAxis dataKey="name" stroke="#8a9bb0" tickLine={false} axisLine={false} />
              <YAxis stroke="#8a9bb0" allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} cursor={{ fill: '#ffffff0d' }} />
              <Bar dataKey="value" name="Vehicles" radius={[6, 6, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.map((d) => (
            <li key={d.key} className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
              <span className="text-muted">{d.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-white">
                {d.value} ({sum ? Math.round((d.value / sum) * 100) : 0}%)
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="License Plate Detection" subtitle="Detected registration numbers" icon={ScanText}>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-ink p-4">
            <p className="text-2xl font-bold text-white">{plates.length}</p>
            <p className="text-sm text-muted">Plates detected</p>
          </div>

          <div className="rounded-lg bg-ink p-4">
            <p className="text-2xl font-bold text-white">
              {plates.length ? (avgConfidence * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-muted">Average confidence</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="p-3">Vehicle ID</th>
                <th className="p-3">Number Plate</th>
                <th className="p-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {plates.length > 0 ? plates.map((p, i) => (
                <tr key={i} className="border-b border-line text-white">
                  <td className="p-3">#{p.vehicle_id ?? i + 1}</td>
                  <td className="p-3 font-semibold">{p.number}</td>
                  <td className="p-3 text-low">
                    {(p.confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="p-5 text-center text-muted">
                    No license plates detected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  )
}
