import { useCallback, useEffect, useState } from 'react'
import { parseError, processVideo, uploadVideo } from '../api/client'

const KEY = 'trafficvision:last'
const loadSaved = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export function useTrafficAnalysis() {
  const [saved] = useState(loadSaved)
  const [phase, setPhase] = useState(saved ? 'done' : 'idle')
  const [uploadPct, setUploadPct] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [uploadId, setUploadId] = useState(saved?.result?.upload_id ?? null)
  const [result, setResult] = useState(saved?.result ?? null)
  const [file, setFile] = useState(saved?.file ?? null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (phase !== 'processing') return
    setElapsed(0)
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const runProcessing = useCallback(async (id, info) => {
    setPhase('processing')
    setError(null)
    try {
      const data = await processVideo(id)
      setResult(data)
      setPhase('done')
      try { localStorage.setItem(KEY, JSON.stringify({ result: data, file: info })) } catch {}
    } catch (e) {
      setError(parseError(e))
      setPhase('error')
    }
  }, [])

  const start = useCallback(async (f) => {
    const info = { name: f.name, size: f.size }
    setFile(info); setResult(null); setError(null); setUploadId(null); setUploadPct(0)
    setPhase('uploading')
    try {
      const up = await uploadVideo(f, setUploadPct)
      setUploadId(up.upload_id)
      await runProcessing(up.upload_id, info)
    } catch (e) {
      setError(parseError(e))
      setPhase('error')
    }
  }, [runProcessing])

  const retryProcessing = () => uploadId && runProcessing(uploadId, file)
  const reset = () => {
    localStorage.removeItem(KEY)
    setPhase('idle'); setResult(null); setUploadId(null); setFile(null); setError(null)
  }

  return {
    phase, uploadPct, elapsed, uploadId, result, file, error,
    busy: phase === 'uploading' || phase === 'processing',
    start, retryProcessing, reset,
    setError, clearError: () => setError(null),
  }
}
