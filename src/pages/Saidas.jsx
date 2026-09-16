import { useState, useEffect, useCallback } from 'react'
import { ArrowUpCircle, Trash2, Search, X, Plus, AlertTriangle } from 'lucide-react'
import { api, getDestinos } from '../lib/api'
import { Table, Empty, Spinner, Field, ItemCombobox, PeriodFilter, ConfirmModal, toast } from '../components/UI'
import { useAdmin, AdminButton } from '../components/AdminContext'

const fmtDate = d => { if (!d) return '—'; const s = String(d).slice(0,10); const [y,m,di]=s.split('-'); return `${di}/${m}/${y}` }
const today   = () => new Date().toISOString().slice(0,10)
const ITEM_VAZIO = { item_id: '', quantidade: '' }

// Gera número de pedido automático
function gerarPedido(saidas) {
  const d   = new Date()
  const base = `PED-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const seq  = String(saidas.filter(s => s.pedido?.startsWith(base)).length + 1).padStart(3,'0')
  return `${base}-${seq}`
}

export default function Saidas() {
  const [itens, setItens]       = useState([])
  const [saidas, setSaidas]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [busca, setBusca]       = useState('')
  const [filtroDest, setFiltroDest] = useState('')
  const [periodo, setPeriodo]   = useState({ de:'', ate:'' })
  const { ativo: modoAdmin } = useAdmin()
  const [confirmDel, setConfirmDel] = useState(null)
  const [destinos] = useState(getDestinos)

  const [cab, setCab] = useState({
    data: today(), pedido: '', destino: getDestinos()[0] || '',
    solicitante: '', responsavel: '', obs: ''
  })
  const setCabField = (k, v) => setCab(f => ({ ...f, [k]: v }))

  const [linhas, setLinhas] = useState([{ ...ITEM_VAZIO }])
  const setLinha = (idx, k, v) => setLinhas(ls => ls.map((l, i) => i === idx ? { ...l, [k]: v } : l))

  // Retorna saldo atual do item a partir da lista carregada
  const getSaldo = (item_id) => {
    const item = itens.find(i => i.id === item_id)
    return item ? Math.round(Number(item.saldo) || 0) : null
  }

  const loadItens = useCallback(() => api.get('/itens').then(setItens), [])

  const loadSaidas = useCallback(() => {
    setLoading(true)
    let path = '/saidas?'
    if (periodo.de)  path += `de=${periodo.de}&`
    if (periodo.ate) path += `ate=${periodo.ate}&`
    if (filtroDest)  path += `destino=${encodeURIComponent(filtroDest)}&`
    api.get(path).then(setSaidas).finally(() => setLoading(false))
  }, [periodo, filtroDest])

  useEffect(() => { loadItens() }, [loadItens])
  useEffect(() => { loadSaidas() }, [loadSaidas])

  // Gera número do pedido assim que as saídas carregam
  useEffect(() => {
    if (!cab.pedido) setCabField('pedido', gerarPedido(saidas))
  }, [saidas])

  async function submit(e) {
    e.preventDefault()

    const validas = linhas.filter(l => l.item_id)
    if (!validas.length) { toast('Adicione ao menos um item.', 'error'); return }

    // Valida quantidade
    for (const l of validas) {
      const qtd = parseInt(l.quantidade)
      if (!l.quantidade || isNaN(qtd) || qtd < 1) {
        toast('Preencha a quantidade de todos os itens.', 'error'); return
      }
    }

    // Busca saldo fresco da API para garantir valores atualizados
    const itensAtuais = await api.get('/itens')

    // Valida saldo — BLOQUEIA se insuficiente (não pergunta, apenas avisa)
    for (const l of validas) {
      const itemAtual = itensAtuais.find(i => i.id === l.item_id)
      const saldo     = Math.round(Number(itemAtual?.saldo) || 0)
      const qtd       = parseInt(l.quantidade)
      if (qtd > saldo) {
        const nome = itemAtual?.nome || 'Item'
        toast(`Saldo insuficiente para "${nome}": disponível ${saldo}, solicitado ${qtd}.`, 'error')
        return // BLOQUEIA — não registra nada
      }
    }

    setSaving(true)
    try {
      for (const l of validas) {
        await api.post('/saidas', {
          ...cab,
          item_id:    l.item_id,
          quantidade: parseInt(l.quantidade),
        })
      }
      toast(`${validas.length} item(ns) registrado(s)!`)
      const novosPedido = gerarPedido([...saidas, ...validas])
      setCab({ data: today(), pedido: novosPedido, destino: getDestinos()[0] || '', solicitante: '', responsavel: '', obs: '' })
      setLinhas([{ ...ITEM_VAZIO }])
      loadSaidas()
      loadItens()
    } catch (err) {
      toast('Erro ao registrar saída.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function excluir(id) {
    await api.delete(`/saidas/${id}`)
    toast('Saída removida.', 'warn')
    loadSaidas()
    loadItens()
  }

  const filtered = saidas.filter(s =>
    !busca ||
    s.item_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    s.destino?.toLowerCase().includes(busca.toLowerCase())
  )
  const totQtd = filtered.reduce((s, e) => s + Number(e.quantidade), 0)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-screen-xl mx-auto">
      <h1 className="page-title">Saídas</h1>

      <div className="card p-6">
        <h2 className="section-title mb-4 text-[#07635b]">Registrar Nova Saída / Carregamento</h2>
        <form onSubmit={submit} className="flex flex-col gap-5">

          {/* Cabeçalho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
            <Field label="Data" required>
              <input type="date" className="input" value={cab.data}
                onChange={e => setCabField('data', e.target.value)} />
            </Field>
            <Field label="Nº Pedido (automático)">
              <input className="input bg-slate-50 text-slate-500 cursor-not-allowed"
                value={cab.pedido} readOnly />
            </Field>
            <Field label="Destino" required>
              <select className="input" value={cab.destino}
                onChange={e => setCabField('destino', e.target.value)}>
                {destinos.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Solicitante">
              <input className="input" placeholder="Quem solicitou" value={cab.solicitante}
                onChange={e => setCabField('solicitante', e.target.value)} />
            </Field>
            <Field label="Responsável">
              <input className="input" placeholder="Responsável pela entrega" value={cab.responsavel}
                onChange={e => setCabField('responsavel', e.target.value)} />
            </Field>
            <Field label="Observações">
              <input className="input" placeholder="Opcional" value={cab.obs}
                onChange={e => setCabField('obs', e.target.value)} />
            </Field>
          </div>

          {/* Linhas de itens */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="label">Itens do Carregamento</span>
              <button type="button" className="btn-secondary flex items-center gap-1.5 !py-1 !text-xs"
                onClick={() => setLinhas(ls => [...ls, { ...ITEM_VAZIO }])}>
                <Plus size={13} /> Adicionar Item
              </button>
            </div>

            {/* Cabeçalho colunas */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-2">
              <span className="col-span-6 label">Item</span>
              <span className="col-span-4 label">Quantidade</span>
              <span className="col-span-2 label">Saldo</span>
            </div>

            {linhas.map((linha, idx) => {
              const saldo  = getSaldo(linha.item_id)
              const qtd    = parseInt(linha.quantidade) || 0
              const insuf  = saldo !== null && qtd > saldo
              const saldoCor = saldo === null   ? 'text-slate-400'
                             : saldo <= 0       ? 'text-red-600'
                             : saldo <= 5       ? 'text-amber-500'
                                                : 'text-emerald-600'
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2">
                  <div className="col-span-12 sm:col-span-6">
                    <ItemCombobox itens={itens} value={linha.item_id}
                      onChange={v => setLinha(idx, 'item_id', v)} />
                  </div>
                  <div className="col-span-9 sm:col-span-4">
                    <input
                      type="number" min="1" step="1" placeholder="Qtd"
                      value={linha.quantidade}
                      className={`input ${!linha.quantidade ? 'border-red-400' : insuf ? 'border-amber-400' : ''}`}
                      onChange={e => {
                        const v = e.target.value
                        setLinha(idx, 'quantidade', v === '' ? '' : Math.floor(Number(v)))
                      }}
                    />
                  </div>
                  {/* Saldo disponível */}
                  <div className={`col-span-2 sm:col-span-1 text-xs font-bold flex items-center gap-1 ${saldoCor}`}>
                    {insuf && <AlertTriangle size={11} />}
                    {saldo !== null ? saldo : '—'}
                  </div>
                  {/* Remover linha */}
                  <div className="col-span-1 flex justify-center">
                    {linhas.length > 1 && (
                      <button type="button"
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                        onClick={() => setLinhas(ls => ls.filter((_, i) => i !== idx))}>
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              {linhas.filter(l => l.item_id).length} item(ns) adicionado(s)
            </span>
            <button type="submit" className="btn-primary flex items-center gap-2 px-6" disabled={saving}>
              <ArrowUpCircle size={16} /> {saving ? 'Salvando...' : 'Registrar Saída'}
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
            onChange={e => setFiltroDest(e.target.value)}>
            <option value="">Todos os destinos</option>
            {destinos.map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input !pl-8 !py-1.5 !text-xs w-44" placeholder="Buscar..."
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <Table
          cols={['Data','Pedido','Item','Qtd','Destino','Solicitante','Responsável','Obs',...(modoAdmin?['']:[])]}
          footer={
            <tr>
              <td colSpan={3} className="td font-bold text-right">Total ({filtered.length} registros)</td>
              <td className="td text-center font-black text-orange-600">{Math.round(totQtd)}</td>
              <td colSpan={5} className="td" />
            </tr>
          }
        >
          {filtered.length === 0 ? <Empty /> : filtered.map(s => (
            <tr key={s.id} className="trow">
              <td className="td whitespace-nowrap">{fmtDate(s.data)}</td>
              <td className="td text-slate-500 text-xs">{s.pedido || '—'}</td>
              <td className="td font-medium">{s.item_nome}</td>
              <td className="td text-center font-bold text-orange-500">{s.quantidade}</td>
              <td className="td">
                <span className="text-xs font-medium bg-[#dbf1ef] text-[#07635b] px-2 py-0.5 rounded-full">
                  {s.destino}
                </span>
              </td>
              <td className="td text-slate-500">{s.solicitante || '—'}</td>
              <td className="td text-slate-500">{s.responsavel || '—'}</td>
              <td className="td text-slate-400 text-xs">{s.obs || ''}</td>
              {modoAdmin && (
                <td className="td">
                  <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    onClick={() => setConfirmDel(s)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </Table>
      )}

      <AdminButton />
      <ConfirmModal open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => excluir(confirmDel?.id)}
        title="Remover Saída"
        message={`Remover saída de "${confirmDel?.item_nome}" para ${confirmDel?.destino}?`} />
    </div>
  )
}