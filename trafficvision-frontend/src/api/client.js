import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || '/api'

const http = axios.create({ baseURL: API_BASE, timeout: 0 })

export function parseError(err) {
  if (err.response) {
    const d = err.response.data?.detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) return d.map((x) => x.msg).join(', ')
    return `Request failed with status ${err.response.status}.`
  }
  if (err.request) return 'Cannot reach the backend. Start FastAPI on http://127.0.0.1:8001 and try again.'
  return err.message || 'Something went wrong.'
}

export const checkHealth = () => http.get('/health', { timeout: 4000 }).then((r) => r.data)

export function uploadVideo(file, onProgress) {
  const body = new FormData()
  body.append('file', file)
  return http
    .post('/upload-video', body, {
      onUploadProgress: (e) => e.total && onProgress(Math.round((e.loaded * 100) / e.total)),
    })
    .then((r) => r.data)
}

export const processVideo = (uploadId) => http.post(`/process-video/${uploadId}`).then((r) => r.data)
export const processedVideoUrl = (uploadId) => `${API_BASE}/processed-video/${uploadId}`
