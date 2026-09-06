import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

// ── Badge de status ──────────────────────────────────────────────────────────
export function StatusBadge({ saldo }) {
  if (saldo <= 0)  return <span className="badge-danger">🔴 Zerado</span>
  if (saldo <= 5)  return <span className="badge-warn">🟡 Crítico</span>
  return               <span className="badge-ok">🟢 OK</span>
}

// ── Modal genérico ───────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width='max-w-lg' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Toast / Notificação ──────────────────────────────────────────────────────
let toastFn = null
export function setToastFn(fn) { toastFn = fn }
export function toast(msg, type='success') { toastFn?.(msg, type) }

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    setToastFn((msg, type) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    })
  }, [])
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
          ${t.type==='success'?'bg-emerald-600 text-white':t.type==='error'?'bg-red-600 text-white':'bg-amber-500 text-white'}`}>
          {t.type==='success'?<CheckCircle size={16}/>:t.type==='error'?<X size={16}/>:<AlertTriangle size={16}/>}
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, color='text-brand-500', icon, sub }) {
  return (
    <div className="card p-5 flex flex-col gap-1 min-w-0">
      <div className="flex items-start justify-between">
        <span className={`text-3xl font-black ${color}`}>{value}</span>
        {icon && <span className="text-2xl opacity-60">{icon}</span>}
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

// ── Campo de formulário ──────────────────────────────────────────────────────
export function Field({ label, children, required }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

// ── Tabela base ──────────────────────────────────────────────────────────────
export function Table({ cols, children, footer }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full min-w-max">
        <thead className="bg-navy-700">
          <tr>
            {cols.map((c,i) => (
              <th key={i} className="th whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
        {footer && (
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            {footer}
          </tfoot>
        )}
      </table>
    </div>
  )
}

// ── Confirmação destrutiva ───────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-danger !px-4 !py-2 !text-sm !font-semibold" onClick={() => { onConfirm(); onClose() }}>
          Confirmar
        </button>
      </div>
    </Modal>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ msg='Nenhum registro encontrado.' }) {
  return (
    <tr>
      <td colSpan={99} className="py-12 text-center text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-2">
          <Info size={32} className="opacity-30" />
          {msg}
        </div>
      </td>
    </tr>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ── Item Combobox ────────────────────────────────────────────────────────────
export function ItemCombobox({ itens, value, onChange, placeholder='Selecione um item...' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = itens.find(i => i.id === value)

  const filtered = itens.filter(i =>
    i.nome.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="relative">
      <input
        className="input"
        placeholder={placeholder}
        value={open ? query : (selected?.nome || '')}
        onFocus={() => { setOpen(true); setQuery('') }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
      />
      {open && (
        <div className="absolute z-30 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
          {filtered.length === 0
            ? <div className="px-3 py-2 text-sm text-slate-400">Nenhum item encontrado</div>
            : filtered.map(i => (
                <div
                  key={i.id}
                  className="px-3 py-2 hover:bg-brand-50 cursor-pointer text-sm flex justify-between"
                  onMouseDown={() => { onChange(i.id); setOpen(false) }}
                >
                  <span className="font-medium">{i.nome}</span>
                  <span className="text-slate-400 text-xs">{i.unidade}</span>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}

// ── Filtros de período ───────────────────────────────────────────────────────
export function PeriodFilter({ de, ate, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-500 font-semibold">Período:</span>
      <input type="date" className="input !py-1 !text-xs w-36"
        value={de} onChange={e => onChange({ de: e.target.value, ate })} />
      <span className="text-xs text-slate-400">até</span>
      <input type="date" className="input !py-1 !text-xs w-36"
        value={ate} onChange={e => onChange({ de, ate: e.target.value })} />
      <button className="btn-ghost text-xs"
        onClick={() => onChange({ de:'', ate:'' })}>Limpar</button>
    </div>
  )
}
