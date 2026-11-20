
import { useEffect, useState } from 'react'
import { RotateCcw, ScanEye } from 'lucide-react'
import { checkHealth, processedVideoUrl } from './api/client'
import { useTrafficAnalysis } from './hooks/useTrafficAnalysis'
import { Alert } from './components/ui'
import UploadZone from './components/UploadZone'
import ProgressPanel from './components/ProgressPanel'
import VideoPlayer from './components/VideoPlayer'
import KpiCards from './components/KpiCards'
import VehicleChart from './components/VehicleChart'
import DensityChart from './components/DensityChart'

function BackendStatus() {
  const [ok, setOk] = useState(null)

  useEffect(() => {
    const ping = () =>
      checkHealth()
        .then(() => setOk(true))
        .catch(() => setOk(false))

    ping()

    const t = setInterval(ping, 15000)

    return () => clearInterval(t)
  }, [])

  const color =
    ok === null ? 'bg-muted' : ok ? 'bg-low' : 'bg-high'

  return (
    <span className="flex items-center gap-2 text-sm text-muted">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {ok === null
        ? 'Checking API'
        : ok
          ? 'API online'
          : 'API offline'}
    </span>
  )
}

export default function App() {
  const t = useTrafficAnalysis()

  const a = t.result?.analytics

  const videoSrc = t.result
    ? processedVideoUrl(t.result.upload_id)
    : null

  const licensePlates = a?.license_plates || []

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-line bg-ink/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">

          <div className="flex items-center gap-3">
            <ScanEye size={28} className="text-signal" />

            <div>
              <h1 className="text-lg font-bold leading-tight text-white">
                TrafficVision AI
              </h1>

              <p className="hidden text-sm text-muted sm:block">
                Intelligent traffic monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">

            <BackendStatus />

            {t.result && !t.busy && (
              <button
                onClick={t.reset}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-white"
              >
                <RotateCcw size={15} />
                Clear
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">

        {/* Error Alert */}
        {t.error && (
          <Alert
            title={
              t.phase === 'error' && t.uploadId
                ? 'Processing failed'
                : 'Something went wrong'
            }
            onClose={t.clearError}
            action={
              t.phase === 'error' && t.uploadId && (
                <button
                  onClick={t.retryProcessing}
                  className="mt-3 rounded-lg bg-signal px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  Retry processing
                </button>
              )
            }
          >
            {t.error}
          </Alert>
        )}

        {/* Success Alert */}
        {t.phase === 'done' && !t.error && (
          <Alert type="success" title="Analysis complete">
            {t.file?.name
              ? `${t.file.name} was processed.`
              : 'The video was processed.'}
            {' '}Results are below.
          </Alert>
        )}

        {/* Video Upload */}
        <UploadZone
          onSelect={t.start}
          onInvalid={t.setError}
          disabled={t.busy}
          hasResult={!!t.result}
        />

        {/* Processing Progress */}
        {t.busy && (
          <ProgressPanel
            phase={t.phase}
            uploadPct={t.uploadPct}
            elapsed={t.elapsed}
            file={t.file}
          />
        )}

        {/* Analytics Dashboard */}
        {a && !t.busy && (
          <>

            {/* KPI Cards */}
            <KpiCards analytics={a} />

            {/* Processed Video + Density */}
            <div className="grid gap-6 lg:grid-cols-3">

              <div className="lg:col-span-2">
                <VideoPlayer src={videoSrc} />
              </div>

              <DensityChart density={a.density_count} />

            </div>

            {/* Vehicle Analytics + License Plate Detection */}
            <VehicleChart
              counts={a.vehicle_counts}
              plates={licensePlates}
            />

          </>
        )}

        {/* Empty State */}
        {!a && !t.busy && (
          <p className="py-6 text-center text-muted">
            Upload a video to see vehicle counts, categories,
            license plates and traffic density.
          </p>
        )}

      </main>
    </div>
  )
}
