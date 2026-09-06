import { useState, useEffect, useCallback } from 'react'
import { ArrowUpCircle, Trash2, Search, AlertTriangle } from 'lucide-react'
import { api, DESTINOS } from '../lib/api'
import { Table, Empty, Spinner, Field, ItemCombobox, PeriodFilter, ConfirmModal, toast } from '../components/UI'

const fmtDate = d => d ? d.split('-').reverse().join('/') : ''
const today = () => new Date().toISOString().slice(0,10)

export default function Saidas() {
  const [itens, setItens] = useState([])
  const [saidas, setSaidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroDest, setFiltroDest] = useState('')
  const [periodo, setPeriodo] = useState({ de:'', ate:'' })
  const [confirmDel, setConfirmDel] = useState(null)
  const [saldoAtual, setSaldoAtual] = useState(null)

  const [form, setForm] = useState({
    item_id:'', data:today(), pedido:'', destino:DESTINOS[0],
    quantidade:1, solicitante:'', responsavel:'', obs:''
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Atualiza saldo disponível ao trocar item
  useEffect(() => {
    if (!form.item_id) { setSaldoAtual(null); return }
    const item = itens.find(i=>i.id===form.item_id)
    setSaldoAtual(item ? (item.saldo||0) : null)
  }, [form.item_id, itens])

  const loadItens = useCallback(() => api.get('/itens').then(setItens), [])

  const loadSaidas = useCallback(() => {
    setLoading(true)
    let path = '/saidas?'
    if (periodo.de)    path += `de=${periodo.de}&`
    if (periodo.ate)   path += `ate=${periodo.ate}&`
    if (filtroDest)    path += `destino=${encodeURIComponent(filtroDest)}&`
    api.get(path).then(setSaidas).finally(()=>setLoading(false))
  }, [periodo, filtroDest])

  useEffect(() => { loadItens() }, [loadItens])
  useEffect(() => { loadSaidas() }, [loadSaidas])

  async function submit(e) {
    e.preventDefault()
    if (!form.item_id) { toast('Selecione um item.','error'); return }
    if (form.quantidade <= 0) { toast('Quantidade inválida.','error'); return }

    if (saldoAtual !== null && Number(form.quantidade) > saldoAtual) {
      const ok = window.confirm(
        `⚠️ Saldo insuficiente!\n\nDisponível: ${saldoAtual}\nSolicitado: ${form.quantidade}\n\nDeseja registrar mesmo assim?`
      )
      if (!ok) return
    }

    setSaving(true)
    try {
      await api.post('/saidas', { ...form, quantidade: Number(form.quantidade) })
      toast('Saída registrada com sucesso!')
      setForm(f=>({...f, pedido:'', quantidade:1, solicitante:'', responsavel:'', obs:'', item_id:''}))
      setSaldoAtual(null)
      loadSaidas()
      loadItens()
    } catch { toast('Erro ao registrar saída.','error') }
    finally { setSaving(false) }
  }

  async function excluir(id) {
    await api.delete(`/saidas/${id}`)
    toast('Saída removida.','warn')
    loadSaidas()
    loadItens()
  }

  const filtered = saidas.filter(s =>
    !busca || s.item_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    s.destino?.toLowerCase().includes(busca.toLowerCase())
  )

  const totQtd = filtered.reduce((s,e)=>s+e.quantidade,0)

  // Saldo badge color
  const saldoColor = saldoAtual === null ? '' : saldoAtual <= 0
    ? 'text-red-600 bg-red-50' : saldoAtual <= 5
    ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'

  const itemSelecionado = itens.find(i=>i.id===form.item_id)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-screen-xl mx-auto">
      <h1 className="page-title">Saídas</h1>

      {/* Formulário */}
      <div className="card p-6">
        <h2 className="section-title mb-4 text-brand-500">Registrar Nova Saída</h2>
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Data" required>
              <input type="date" className="input" value={form.data}
                onChange={e=>set('data',e.target.value)} />
            </Field>
            <Field label="Nº Pedido">
              <input className="input" placeholder="PED-001" value={form.pedido}
                onChange={e=>set('pedido',e.target.value)} />
            </Field>
            <Field label="Destino" required>
              <select className="input" value={form.destino}
                onChange={e=>set('destino',e.target.value)}>
                {DESTINOS.map(d=><option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Item" required>
              <ItemCombobox itens={itens} value={form.item_id} onChange={v=>set('item_id',v)} />
            </Field>
            <Field label="Quantidade" required>
              <input type="number" min="0.01" step="0.01" className="input" value={form.quantidade}
                onChange={e=>set('quantidade',e.target.value)} />
            </Field>

            {/* Saldo disponível */}
            <div className="flex flex-col justify-end">
              {saldoAtual !== null ? (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm ${saldoColor}`}>
                  {saldoAtual <= 5 && <AlertTriangle size={15}/>}
                  Saldo disponível: <strong>{Math.round(saldoAtual)}</strong>
                  {itemSelecionado && <span className="font-normal text-xs">{itemSelecionado.unidade}</span>}
                </div>
              ) : (
                <div className="flex items-center px-4 py-2.5 rounded-lg bg-slate-50 text-slate-400 text-sm">
                  Selecione um item para ver o saldo
                </div>
              )}
            </div>

            <Field label="Solicitante">
              <input className="input" placeholder="Quem solicitou" value={form.solicitante}
                onChange={e=>set('solicitante',e.target.value)} />
            </Field>
            <Field label="Responsável pela Entrega">
              <input className="input" placeholder="Responsável" value={form.responsavel}
                onChange={e=>set('responsavel',e.target.value)} />
            </Field>
            <Field label="Observações">
              <input className="input" placeholder="Opcional" value={form.obs}
                onChange={e=>set('obs',e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn-primary flex items-center gap-2 px-6"
              disabled={saving}>
              <ArrowUpCircle size={16}/> {saving ? 'Salvando...' : 'Registrar Saída'}
            </button>
          </div>
        </form>
      </div>

      {/* Filtros histórico */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Histórico de Saídas</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <PeriodFilter de={periodo.de} ate={periodo.ate} onChange={setPeriodo} />
          <select className="input !py-1.5 !text-xs w-44" value={filtroDest}
            onChange={e=>setFiltroDest(e.target.value)}>
            <option value="">Todos os destinos</option>
            {DESTINOS.map(d=><option key={d}>{d}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="input !pl-8 !py-1.5 !text-xs w-44" placeholder="Buscar..."
              value={busca} onChange={e=>setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <Table
          cols={['Data','Pedido','Item','Qtd','Destino','Solicitante','Responsável','Obs','']}
          footer={
            <tr>
              <td colSpan={3} className="td font-bold text-right">Total ({filtered.length} registros)</td>
              <td className="td text-center font-black text-orange-600">{Math.round(totQtd)}</td>
              <td colSpan={5} className="td"/>
            </tr>
          }
        >
          {filtered.length===0 ? <Empty /> : filtered.map(s=>(
            <tr key={s.id} className="trow">
              <td className="td whitespace-nowrap">{fmtDate(s.data)}</td>
              <td className="td text-slate-500">{s.pedido||'—'}</td>
              <td className="td font-medium">{s.item_nome}</td>
              <td className="td text-center font-bold text-orange-500">{s.quantidade}</td>
              <td className="td">
                <span className="text-xs font-medium bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                  {s.destino}
                </span>
              </td>
              <td className="td text-slate-500">{s.solicitante||'—'}</td>
              <td className="td text-slate-500">{s.responsavel||'—'}</td>
              <td className="td text-slate-400 text-xs">{s.obs||''}</td>
              <td className="td">
                <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={()=>setConfirmDel(s)}>
                  <Trash2 size={14}/>
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <ConfirmModal open={!!confirmDel} onClose={()=>setConfirmDel(null)}
        onConfirm={()=>excluir(confirmDel?.id)}
        title="Remover Saída"
        message={`Remover a saída de "${confirmDel?.item_nome}" para ${confirmDel?.destino}? O saldo será ajustado.`} />
    </div>
  )
}
