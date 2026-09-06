import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { api } from '../lib/api'
import { Table, Empty, Spinner, Field, ItemCombobox, PeriodFilter, ConfirmModal, toast } from '../components/UI'

const fmtDate = d => d ? d.split('-').reverse().join('/') : ''
const today = () => new Date().toISOString().slice(0,10)

export default function Entradas() {
  const [itens, setItens] = useState([])
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')
  const [periodo, setPeriodo] = useState({ de:'', ate:'' })
  const [confirmDel, setConfirmDel] = useState(null)

  const [form, setForm] = useState({
    item_id:'', data:today(), nf:'', fornecedor:'',
    quantidade:1, vlr_unit:0, responsavel:'', obs:''
  })

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Quando item muda, preenche vlr_unit automaticamente
  useEffect(() => {
    const item = itens.find(i=>i.id===form.item_id)
    if (item) set('vlr_unit', item.vlr_unit||0)
  }, [form.item_id])

  const loadItens = useCallback(() => api.get('/itens').then(setItens), [])

  const loadEntradas = useCallback(() => {
    setLoading(true)
    let path = '/entradas?'
    if (periodo.de)  path += `de=${periodo.de}&`
    if (periodo.ate) path += `ate=${periodo.ate}&`
    api.get(path).then(setEntradas).finally(()=>setLoading(false))
  }, [periodo])

  useEffect(() => { loadItens() }, [loadItens])
  useEffect(() => { loadEntradas() }, [loadEntradas])

  async function submit(e) {
    e.preventDefault()
    if (!form.item_id) { toast('Selecione um item.','error'); return }
    if (form.quantidade <= 0) { toast('Quantidade inválida.','error'); return }
    setSaving(true)
    try {
      await api.post('/entradas', { ...form, quantidade: Number(form.quantidade), vlr_unit: Number(form.vlr_unit) })
      toast('Entrada registrada com sucesso!')
      setForm(f=>({...f, nf:'', fornecedor:'', quantidade:1, vlr_unit:0, responsavel:'', obs:'', item_id:''}))
      loadEntradas()
      loadItens()
    } catch { toast('Erro ao registrar entrada.','error') }
    finally { setSaving(false) }
  }

  async function excluir(id) {
    await api.delete(`/entradas/${id}`)
    toast('Entrada removida.','warn')
    loadEntradas()
    loadItens()
  }

  const filtered = entradas.filter(e =>
    !busca || e.item_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    e.fornecedor?.toLowerCase().includes(busca.toLowerCase())
  )

  const totQtd = filtered.reduce((s,e)=>s+e.quantidade,0)
  const totVlr = filtered.reduce((s,e)=>s+(e.quantidade*(e.vlr_unit||0)),0)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-screen-xl mx-auto">
      <h1 className="page-title">Entradas</h1>

      {/* Formulário */}
      <div className="card p-6">
        <h2 className="section-title mb-4 text-brand-500">Registrar Nova Entrada</h2>
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Data" required>
              <input type="date" className="input" value={form.data}
                onChange={e=>set('data',e.target.value)} />
            </Field>
            <Field label="Nº Nota Fiscal">
              <input className="input" placeholder="NF-001" value={form.nf}
                onChange={e=>set('nf',e.target.value)} />
            </Field>
            <Field label="Fornecedor">
              <input className="input" placeholder="Nome do fornecedor" value={form.fornecedor}
                onChange={e=>set('fornecedor',e.target.value)} />
            </Field>
            <Field label="Item" required>
              <ItemCombobox itens={itens} value={form.item_id}
                onChange={v=>set('item_id',v)} />
            </Field>
            <Field label="Quantidade" required>
              <input type="number" min="0.01" step="0.01" className="input" value={form.quantidade}
                onChange={e=>set('quantidade',e.target.value)} />
            </Field>
            <Field label="Valor Unitário (R$)">
              <input type="number" min="0" step="0.01" className="input" value={form.vlr_unit}
                onChange={e=>set('vlr_unit',e.target.value)} />
            </Field>
            <Field label="Responsável">
              <input className="input" placeholder="Nome do responsável" value={form.responsavel}
                onChange={e=>set('responsavel',e.target.value)} />
            </Field>
            <Field label="Observações">
              <input className="input" placeholder="Opcional" value={form.obs}
                onChange={e=>set('obs',e.target.value)} />
            </Field>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={saving}>
                <Plus size={16}/> {saving ? 'Salvando...' : 'Registrar Entrada'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Histórico */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Histórico de Entradas</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <PeriodFilter de={periodo.de} ate={periodo.ate} onChange={setPeriodo} />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="input !pl-8 !py-1.5 !text-xs w-44" placeholder="Buscar..."
              value={busca} onChange={e=>setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <Table
          cols={['Data','NF','Fornecedor','Item','Qtd','Vlr Unit','Vlr Total','Responsável','Obs','']}
          footer={
            <tr>
              <td colSpan={4} className="td font-bold text-right">Total ({filtered.length} registros)</td>
              <td className="td text-center font-black">{totQtd.toFixed(0)}</td>
              <td className="td"/>
              <td className="td text-center font-bold">R$ {totVlr.toFixed(2)}</td>
              <td colSpan={3} className="td"/>
            </tr>
          }
        >
          {filtered.length===0 ? <Empty /> : filtered.map(e=>(
            <tr key={e.id} className="trow">
              <td className="td whitespace-nowrap">{fmtDate(e.data)}</td>
              <td className="td text-slate-500">{e.nf||'—'}</td>
              <td className="td">{e.fornecedor||'—'}</td>
              <td className="td font-medium">{e.item_nome}</td>
              <td className="td text-center font-bold text-emerald-600">{e.quantidade}</td>
              <td className="td text-center">R$ {(e.vlr_unit||0).toFixed(2)}</td>
              <td className="td text-center font-medium">R$ {(e.quantidade*(e.vlr_unit||0)).toFixed(2)}</td>
              <td className="td text-slate-500">{e.responsavel||'—'}</td>
              <td className="td text-slate-400 text-xs">{e.obs||''}</td>
              <td className="td">
                <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={()=>setConfirmDel(e)}>
                  <Trash2 size={14}/>
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <ConfirmModal open={!!confirmDel} onClose={()=>setConfirmDel(null)}
        onConfirm={()=>excluir(confirmDel?.id)}
        title="Remover Entrada"
        message={`Remover a entrada de "${confirmDel?.item_nome}"? O saldo será ajustado.`} />
    </div>
  )
}
