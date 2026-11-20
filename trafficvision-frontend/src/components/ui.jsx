import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

export const Card = ({ title, subtitle, icon: Icon, className = '', children }) => (
  <section className={`rounded-xl border border-line bg-panel p-5 ${className}`}>
    {title && (
      <header className="mb-4 flex items-center gap-3">
        {Icon && <Icon size={20} className="shrink-0 text-signal" />}
        <div className="min-w-0">
          <h2 className="font-semibold text-white">{title}</h2>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        </div>
      </header>
    )}
    {children}
  </section>
)

export function Alert({ type = 'error', title, children, action, onClose }) {
  const ok = type === 'success'
  const Icon = ok ? CheckCircle2 : AlertTriangle
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`flex items-start gap-3 rounded-xl border p-4 ${ok ? 'border-low/40 bg-low/10' : 'border-high/40 bg-high/10'}`}
    >
      <Icon size={20} className={`mt-0.5 shrink-0 ${ok ? 'text-low' : 'text-high'}`} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-slate-300">{children}</p>
        {action}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="text-muted hover:text-white">
          <X size={18} />
        </button>
      )}
    </div>
  )
}
