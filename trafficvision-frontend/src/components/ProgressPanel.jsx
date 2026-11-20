import { Circle, CheckCircle2, Loader2 } from 'lucide-react'
import { Card } from './ui'

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const StepIcon = ({ state }) =>
  state === 'done' ? <CheckCircle2 size={20} className="text-low" />
  : state === 'active' ? <Loader2 size={20} className="animate-spin text-signal" />
  : <Circle size={20} className="text-line" />

export default function ProgressPanel({ phase, uploadPct, elapsed, file }) {
  const uploading = phase === 'uploading'
  return (
    <Card title="Analysis in progress" subtitle={file?.name}>
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center gap-3 text-sm">
            <StepIcon state={uploading ? 'active' : 'done'} />
            <span className="font-medium text-white">Uploading video</span>
            <span className="ml-auto tabular-nums text-muted">{uploading ? uploadPct : 100}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink">
            <div className="h-full rounded-full bg-signal transition-all" style={{ width: `${uploading ? uploadPct : 100}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-3 text-sm">
            <StepIcon state={uploading ? 'idle' : 'active'} />
            <span className="font-medium text-white">Detecting and tracking vehicles</span>
            <span className="ml-auto tabular-nums text-muted">{uploading ? 'Waiting' : fmt(elapsed)}</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-ink">
            {!uploading && <div className="animate-sweep absolute inset-y-0 w-2/5 rounded-full bg-signal" />}
          </div>
          {!uploading && (
            <p className="mt-2 text-sm text-muted">
              The server does not report frame-by-frame progress, so this bar keeps moving until YOLO11 and
              ByteTrack finish. Longer videos take longer.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
