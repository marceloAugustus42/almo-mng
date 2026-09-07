import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Search, X, PackagePlus } from 'lucide-react'
import { api } from '../lib/api'
import { Table, Empty, Spinner, Field, ItemCombobox, PeriodFilter, ConfirmModal, toast } from '../components/UI'

const fmtDate = d => d ? d.split('-').reverse().join('/') : ''
const today = () => new Date().toISOString().slice(0,10)
const ITEM_VAZIO = { item_id: '', quantidade: 1, vlr_unit: '' }

export default function Entradas() {
  const [itens, setItens] = useState([])
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')
  const [periodo, setPeriodo] = useState({ de: '', ate: '' })
  const [confirmDel, setConfirmDel] = useState(null)

  const [cabecalho, setCabecalho] = useState({ data: today(), nf: '', fornecedor: '', responsavel: '', obs: '' })
  const setCab = (k, v) => setCabecalho(f => ({ ...f, [k]: v }))

  const [linhas, setLinhas] = useState([{ ...ITEM_VAZIO }])
  const setLinha = (idx, k, v) => setLinhas(ls => ls.map((l, i) => i === idx ? { ...l, [k]: v } : l))
  const addLinha = () => setLinhas(ls => [...ls, { ...ITEM_VAZIO }])
  const removeLinha = idx => setLinhas(ls => ls.filter((_, i) => i !== idx))

  const handleItemChange = (idx, item_id) => {
    const item = itens.find(i => i.id === item_id)
    setLinhas(ls => ls.map((l, i) => i === idx ? { ...l, item_id, vlr_unit: item?.vlr_unit ?? '' } : l))
  }

  const loadItens = useCallback(() => api.get('/itens').then(setItens), [])
  const loadEntradas = useCallback(() => {
    setLoading(true)
    let path = '/entradas?'
    if (periodo.de)  path += `de=${periodo.de}&`
    if (periodo.ate) path += `ate=${periodo.ate}&`
    api.get(path).then(setEntradas).finally(() => setLoading(false))
  }, [periodo])

  useEffect(() => { loadItens() }, [loadItens])
  useEffect(() => { loadEntradas() }, [loadEntradas])

  async function submit(e) {
    e.preventDefault()
    const validas = linhas.filter(l => l.item_id)
    if (validas.length === 0) { toast('Adicione ao menos um item.', 'error'); return }
    if (validas.some(l => !l.quantidade || l.quantidade < 1)) {
      toast('Quantidade deve ser um número inteiro maior que zero.', 'error'); return
    }
    setSaving(true)
    try {
      await Promise.all(validas.map(l =>
        api.post('/entradas', {
          ...cabecalho,
          item_id: l.item_id,
          quantidade: Math.floor(Number(l.quantidade)),
          vlr_unit: Number(l.vlr_unit) || 0,
        })
      ))
      toast(`${validas.length} item(ns) registrado(s)!`)
      setCabecalho({ data: today(), nf: '', fornecedor: '', responsavel: '', obs: '' })
      setLinhas([{ ...ITEM_VAZIO }])
      loadEntradas(); loadItens()
    } catch { toast('Erro ao registrar entrada.', 'error') }
    finally { setSaving(false) }
  }

  async function excluir(id) {
    await api.delete(`/entradas/${id}`)
    toast('Entrada removida.', 'warn')
    loadEntradas(); loadItens()
  }

  const filtered = entradas.filter(e =>
    !busca || e.item_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    e.fornecedor?.toLowerCase().includes(busca.toLowerCase())
  )
  const totQtd = filtered.reduce((s, e) => s + e.quantidade, 0)
  const totVlr = filtered.reduce((s, e) => s + e.quantidade * (e.vlr_unit || 0), 0)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-screen-xl mx-auto">
      <h1 className="page-title">Entradas</h1>

      <div className="card p-6">
        <h2 className="section-title mb-4 text-[#07635b]">Registrar Nova Entrada / Carregamento</h2>
        <form onSubmit={submit} className="flex flex-col gap-5">

          {/* Cabeçalho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
            <Field label="Data" required>
              <input type="date" className="input" value={cabecalho.data}
                onChange={e => setCab('data', e.target.value)} />
            </Field>
            <Field label="Nº Nota Fiscal">
              <input className="input" placeholder="NF-001" value={cabecalho.nf}
                onChange={e => setCab('nf', e.target.value)} />
            </Field>
            <Field label="Fornecedor">
              <input className="input" placeholder="Nome do fornecedor" value={cabecalho.fornecedor}
                onChange={e => setCab('fornecedor', e.target.value)} />
            </Field>
            <Field label="Responsável">
              <input className="input" placeholder="Nome do responsável" value={cabecalho.responsavel}
                onChange={e => setCab('responsavel', e.target.value)} />
            </Field>
            <Field label="Observações">
              <input className="input" placeholder="Opcional" value={cabecalho.obs}
                onChange={e => setCab('obs', e.target.value)} />
            </Field>
          </div>

          {/* Linhas de itens */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="label">Itens do Carregamento</span>
              <button type="button" className="btn-secondary flex items-center gap-1.5 !py-1 !text-xs"
                onClick={addLinha}>
                <Plus size={13} /> Adicionar Item
              </button>
            </div>
            <div className="hidden sm:grid grid-cols-12 gap-2 px-2">
              <span className="col-span-5 label">Item</span>
              <span className="col-span-3 label">Quantidade</span>
              <span className="col-span-3 label">Vlr Unit (R$)</span>
              <span className="col-span-1" />
            </div>
            {linhas.map((linha, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2">
                <div className="col-span-12 sm:col-span-5">
                  <ItemCombobox itens={itens} value={linha.item_id}
                    onChange={v => handleItemChange(idx, v)} />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <input type="number" min="1" step="1" className="input" placeholder="Qtd"
                    value={linha.quantidade}
                    onChange={e => setLinha(idx, 'quantidade', Math.floor(Number(e.target.value)) || 1)} />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <input type="number" min="0" step="0.01" className="input" placeholder="0,00"
                    value={linha.vlr_unit}
                    onChange={e => setLinha(idx, 'vlr_unit', e.target.value)} />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  {linhas.length > 1 && (
                    <button type="button" onClick={() => removeLinha(idx)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              {linhas.filter(l => l.item_id).length} item(ns) adicionado(s)
            </span>
            <button type="submit" className="btn-primary flex items-center gap-2 px-6" disabled={saving}>
              <PackagePlus size={16} /> {saving ? 'Salvando...' : 'Registrar Entrada'}
            </button>
          </div>
        </form>
      </div>

      {/* Histórico */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Histórico de Entradas</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <PeriodFilter de={periodo.de} ate={periodo.ate} onChange={setPeriodo} />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input !pl-8 !py-1.5 !text-xs w-44" placeholder="Buscar..."
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <Table
          cols={['Data','NF','Fornecedor','Item','Qtd','Vlr Unit','Vlr Total','Responsável','Obs','']}
          footer={
            <tr>
              <td colSpan={4} className="td font-bold text-right">Total ({filtered.length} registros)</td>
              <td className="td text-center font-black">{totQtd}</td>
              <td className="td" />
              <td className="td text-center font-bold">R$ {totVlr.toFixed(2)}</td>
              <td colSpan={3} className="td" />
            </tr>
          }
        >
          {filtered.length === 0 ? <Empty /> : filtered.map(e => (
            <tr key={e.id} className="trow">
              <td className="td whitespace-nowrap">{fmtDate(e.data)}</td>
              <td className="td text-slate-500">{e.nf || '—'}</td>
              <td className="td">{e.fornecedor || '—'}</td>
              <td className="td font-medium">{e.item_nome}</td>
              <td className="td text-center font-bold text-emerald-600">{e.quantidade}</td>
              <td className="td text-center">R$ {(e.vlr_unit || 0).toFixed(2)}</td>
              <td className="td text-center font-medium">R$ {(e.quantidade * (e.vlr_unit || 0)).toFixed(2)}</td>
              <td className="td text-slate-500">{e.responsavel || '—'}</td>
              <td className="td text-slate-400 text-xs">{e.obs || ''}</td>
              <td className="td">
                <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setConfirmDel(e)}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <ConfirmModal open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => excluir(confirmDel?.id)}
        title="Remover Entrada"
        message={`Remover a entrada de "${confirmDel?.item_nome}"? O saldo será ajustado.`} />
    </div>
  )
}