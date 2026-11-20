import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

const EXT = ['.mp4', '.avi', '.mov', '.mkv']
const MAX = 500 * 1024 * 1024

export default function UploadZone({ onSelect, onInvalid, disabled, hasResult }) {
  const input = useRef(null)
  const [drag, setDrag] = useState(false)

  const pick = (f) => {
    if (!f || disabled) return
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!EXT.includes(ext)) return onInvalid('Only MP4, AVI, MOV and MKV videos are allowed.')
    if (f.size > MAX) return onInvalid('File size exceeds 500 MB.')
    onSelect(f)
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
      className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14 ${
        drag ? 'border-signal bg-signal/10' : 'border-line bg-panel hover:border-signal/60'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input
        ref={input}
        type="file"
        hidden
        accept=".mp4,.avi,.mov,.mkv,video/*"
        onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }}
      />
      <UploadCloud size={36} className="mx-auto text-signal" />
      <p className="mt-3 text-lg font-semibold text-white">
        {hasResult ? 'Analyze another video' : 'Drop a traffic video here, or click to browse'}
      </p>
      <p className="mt-1 text-sm text-muted">MP4, AVI, MOV or MKV, up to 500 MB. Analysis starts right after upload.</p>
    </div>
  )
}
