import { useState, useEffect, useCallback } from 'react'
import { ArrowUpCircle, Trash2, Search, X, Plus, AlertTriangle, Edit2 } from 'lucide-react'
import { api, getDestinos } from '../lib/api'
import { Table, Empty, Spinner, Field, ItemCombobox, PeriodFilter, ConfirmModal, toast } from '../components/UI'
import { useAdmin, AdminButton } from '../components/AdminContext'
import { exportSaidasRelatorio } from '../lib/export'

const fmtDate = d => { if (!d) return '—'; const s = String(d).slice(0,10); const [y,m,di]=s.split('-'); return `${di}/${m}/${y}` }
const today   = () => new Date().toISOString().slice(0,10)

// Gera número de pedido automático
function gerarPedido(saidas) {
  const d    = new Date()
  const ano  = d.getFullYear()
  const mes  = String(d.getMonth()+1).padStart(2,'0')
  const dia  = String(d.getDate()).padStart(2,'0')
  const base = 'PED-' + ano + mes + dia
  const seq  = String(saidas.filter(s => s.pedido && s.pedido.startsWith(base)).length + 1).padStart(3,'0')
  return base + '-' + seq
}

const LINHA_VAZIA = { item_id: '', quantidade: '' }

export default function Saidas() {
  const { ativo: modoAdmin } = useAdmin()
  const [destinos]    = useState(getDestinos)
  const [estoqueSaida, setEstoqueSaida] = useState('PATRIMÔNIO')
  const [itens, setItens]     = useState([])
  const [saidas, setSaidas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [busca, setBusca]     = useState('')
  const [filtroDest, setFiltroDest] = useState('')
  const [periodo, setPeriodo] = useState({ de:'', ate:'' })
  const [confirmDel, setConfirmDel] = useState(null)
  const [editandoItem, setEditandoItem] = useState(null)
  const [formEdit, setFormEdit] = useState({})

  // Formulário — cabeçalho e linhas de itens
  const [cab, setCab] = useState({
    data: today(), pedido: '', destino: getDestinos()[0] || '',
    solicitante: '', responsavel: '', obs: ''
  })
  const setCabField = (k, v) => setCab(f => ({ ...f, [k]: v }))

  // Uma única linha por vez para evitar multiplicação
  const [linhas, setLinhas] = useState([{ ...LINHA_VAZIA }])

  const setLinha = (idx, k, v) =>
    setLinhas(ls => ls.map((l, i) => i === idx ? { ...l, [k]: v } : l))

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
  useEffect(() => {
    if (saidas.length >= 0 && !cab.pedido)
      setCabField('pedido', gerarPedido(saidas))
  }, [saidas])

  async function submit(e) {
    e.preventDefault()

    // Filtra apenas linhas com item selecionado
    const validas = linhas.filter(l => l.item_id)
    if (!validas.length) { toast('Adicione ao menos um item.', 'error'); return }

    // Valida quantidades
    for (const l of validas) {
      const qtd = parseInt(l.quantidade)
      if (!l.quantidade || isNaN(qtd) || qtd < 1) {
        toast('Preencha a quantidade de todos os itens.', 'error'); return
      }
    }

    // Busca saldo atualizado do servidor antes de qualquer registro
    const itensAtuais = await api.get('/itens')

    // Valida saldo — bloqueia se insuficiente
    for (const l of validas) {
      const itemAtual = itensAtuais.find(i => i.id === l.item_id)
      const saldo     = Math.round(Number(itemAtual?.saldo) || 0)
      const qtd       = parseInt(l.quantidade)
      if (qtd > saldo) {
        toast(`Saldo insuficiente para "${itemAtual?.nome}": disponível ${saldo}, solicitado ${qtd}.`, 'error')
        return
      }
    }

    setSaving(true)
    try {
      // Registra UMA entrada por linha — sem loop duplicado
      for (const l of validas) {
        await api.post('/saidas', {
          item_id:     l.item_id,
          data:        cab.data,
          pedido:      cab.pedido,
          destino:     cab.destino,
          quantidade:  parseInt(l.quantidade),
          solicitante: cab.solicitante,
          responsavel: cab.responsavel,
          obs:         cab.obs,
        })
      }

      toast(`${validas.length} item(ns) registrado(s)!`)
      const novosPedido = gerarPedido([...saidas, ...validas])
      setCab({ data: today(), pedido: novosPedido, destino: getDestinos()[0] || '', solicitante: '', responsavel: '', obs: '' })
      setLinhas([{ ...LINHA_VAZIA }])
      loadSaidas()
      loadItens()
    } catch {
      toast('Erro ao registrar saída.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function excluir(id) {
    await api.delete(`/saidas/${id}`)
    toast('Saída removida.', 'warn')
    loadSaidas(); loadItens()
  }

  async function salvarEdicao() {
    if (!editandoItem) return
    await api.put(`/saidas/${editandoItem.id}`, {
      item_id:     editandoItem.item_id,
      data:        formEdit.data        ?? String(editandoItem.data).slice(0,10),
      pedido:      editandoItem.pedido  ?? '',
      destino:     formEdit.destino     ?? editandoItem.destino,
      quantidade:  parseInt(formEdit.quantidade ?? editandoItem.quantidade),
      solicitante: formEdit.solicitante ?? editandoItem.solicitante ?? '',
      responsavel: formEdit.responsavel ?? editandoItem.responsavel ?? '',
      obs:         formEdit.obs         ?? editandoItem.obs         ?? '',
    })
    toast('Saída atualizada!')
    setEditandoItem(null); setFormEdit({})
    loadSaidas(); loadItens()
  }

  // Filtra itens pelo estoque selecionado
  const itensFiltrados = itens.filter(i => (i.estoque||'PATRIMÔNIO') === estoqueSaida)

  // Saldo do item pelo estado local (para preview em tempo real)
  const getSaldo = item_id => {
    const item = itens.find(i => i.id === item_id)
    return item ? Math.round(Number(item.saldo) || 0) : null
  }

  const filtered = saidas.filter(s =>
    !busca ||
    s.item_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    s.destino?.toLowerCase().includes(busca.toLowerCase())
  )
  const totQtd = filtered.reduce((s, e) => s + Number(e.quantidade), 0)
  const totVlr = filtered.reduce((s, e) => s + Number(e.quantidade) * Number(e.vlr_unit||0), 0)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-screen-xl mx-auto">
      <h1 className="page-title">Saídas</h1>

      {/* Formulário */}
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
            <Field label="Estoque de Origem" required>
              <select className="input" value={estoqueSaida}
                onChange={e => { setEstoqueSaida(e.target.value); setLinhas([{ ...LINHA_VAZIA }]) }}>
                {['PATRIMÔNIO','CALAMIDADE','CEGONHA SOCIAL'].map(op=><option key={op}>{op}</option>)}
              </select>
            </Field>
          </div>

          {/* Linhas de itens */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="label">Itens do Carregamento</span>
              <button type="button" className="btn-secondary flex items-center gap-1.5 !py-1 !text-xs"
                onClick={() => setLinhas(ls => [...ls, { ...LINHA_VAZIA }])}>
                <Plus size={13} /> Adicionar Item
              </button>
            </div>

            <div className="hidden sm:grid grid-cols-12 gap-2 px-2">
              <span className="col-span-6 label">Item</span>
              <span className="col-span-4 label">Quantidade</span>
              <span className="col-span-2 label">Saldo</span>
            </div>

            {linhas.map((linha, idx) => {
              const saldo = getSaldo(linha.item_id)
              const qtd   = parseInt(linha.quantidade) || 0
              const insuf = saldo !== null && qtd > saldo
              const saldoCor = saldo === null ? 'text-slate-400'
                             : saldo <= 0     ? 'text-red-600'
                             : saldo <= 5     ? 'text-amber-500'
                                              : 'text-emerald-600'
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2">
                  <div className="col-span-12 sm:col-span-6">
                    <ItemCombobox itens={itensFiltrados} value={linha.item_id}
                      onChange={v => setLinha(idx, 'item_id', v)} />
                  </div>
                  <div className="col-span-9 sm:col-span-4">
                    <input type="number" min="1" step="1" placeholder="Qtd"
                      value={linha.quantidade}
                      className={`input ${!linha.quantidade ? 'border-red-400' : insuf ? 'border-amber-400' : ''}`}
                      onChange={e => {
                        const v = e.target.value
                        setLinha(idx, 'quantidade', v === '' ? '' : Math.floor(Number(v)))
                      }} />
                  </div>
                  <div className={`col-span-2 sm:col-span-1 text-xs font-bold flex items-center gap-1 ${saldoCor}`}>
                    {insuf && <AlertTriangle size={11} />}
                    {saldo !== null ? saldo : '—'}
                  </div>
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

      {/* Histórico */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="section-title">Histórico de Saídas</h2>
          <button className="btn-secondary flex items-center gap-1.5 !py-1 !text-xs"
            onClick={() => exportSaidasRelatorio(filtered, periodo)}>
            ⬇ Exportar período (.xlsx)
          </button>
        </div>
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
          cols={['Data','Pedido','Item','Qtd','Vlr Total','Destino','Solicitante','Responsável','Obs',...(modoAdmin?['Ações']:[])]}
          footer={
            <tr>
              <td colSpan={3} className="td font-bold text-right">Total ({filtered.length} registros)</td>
              <td className="td text-center font-black text-orange-600">{Math.round(totQtd)}</td>
              <td className="td text-right font-bold">R$ {Number(totVlr).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
              <td colSpan={modoAdmin?5:4} className="td" />
            </tr>
          }
        >
          {filtered.length === 0 ? <Empty /> : filtered.map(s => (
            <tr key={s.id} className="trow">
              <td className="td whitespace-nowrap">{fmtDate(s.data)}</td>
              <td className="td text-slate-500 text-xs">{s.pedido || '—'}</td>
              <td className="td font-medium">{s.item_nome}</td>
              <td className="td text-center font-bold text-orange-500">{s.quantidade}</td>
              <td className="td text-right">{(Number(s.quantidade)*Number(s.vlr_unit||0)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
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
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg text-[#07635b] hover:bg-[#dbf1ef] transition-colors"
                      onClick={() => { setEditandoItem(s); setFormEdit({}) }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      onClick={() => setConfirmDel(s)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </Table>
      )}

      {/* Modal edição */}
      {editandoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditandoItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Editar Saída — {editandoItem.item_nome}</h2>
            <Field label="Data">
              <input type="date" className="input" defaultValue={String(editandoItem.data).slice(0,10)}
                onChange={e => setFormEdit(f => ({...f, data: e.target.value}))} />
            </Field>
            <Field label="Destino">
              <select className="input" defaultValue={editandoItem.destino}
                onChange={e => setFormEdit(f => ({...f, destino: e.target.value}))}>
                {destinos.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Quantidade">
              <input type="number" min="1" step="1" className="input" defaultValue={editandoItem.quantidade}
                onChange={e => setFormEdit(f => ({...f, quantidade: e.target.value}))} />
            </Field>
            <Field label="Solicitante">
              <input className="input" defaultValue={editandoItem.solicitante || ''}
                onChange={e => setFormEdit(f => ({...f, solicitante: e.target.value}))} />
            </Field>
            <Field label="Responsável">
              <input className="input" defaultValue={editandoItem.responsavel || ''}
                onChange={e => setFormEdit(f => ({...f, responsavel: e.target.value}))} />
            </Field>
            <Field label="Observações">
              <input className="input" defaultValue={editandoItem.obs || ''}
                onChange={e => setFormEdit(f => ({...f, obs: e.target.value}))} />
            </Field>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setEditandoItem(null)}>Cancelar</button>
              <button className="btn-primary" onClick={salvarEdicao}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <AdminButton />

      <ConfirmModal open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => excluir(confirmDel?.id)}
        title="Remover Saída"
        message={`Remover saída de "${confirmDel?.item_nome}" para ${confirmDel?.destino}?`} />
    </div>
  )
}