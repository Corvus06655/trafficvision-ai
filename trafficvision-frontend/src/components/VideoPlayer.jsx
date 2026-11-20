import { useState } from 'react'
import { Download, Film } from 'lucide-react'
import { Card } from './ui'

export default function VideoPlayer({ src }) {
  const [failed, setFailed] = useState(false)
  return (
    <Card
      title="Processed video"
      subtitle="Bounding boxes, tracking IDs, vehicle count and density overlay"
      icon={Film}
      className="h-full"
    >
      {failed ? (
        <div className="grid aspect-video place-items-center rounded-lg bg-ink px-6 text-center text-sm text-muted">
          The processed video could not be loaded. It may have been removed from the server. Run a new analysis.
        </div>
      ) : (
        <video key={src} src={src} controls playsInline preload="metadata" onError={() => setFailed(true)}
          className="aspect-video w-full rounded-lg bg-black" />
      )}
      <a href={src} download
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-signal hover:underline">
        <Download size={16} /> Download MP4
      </a>
    </Card>
  )
}
