import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'
import { Modal, ConfirmModal, Table, StatusBadge, Empty, Spinner, Field, toast } from '../components/UI'

const TIPOS = ['Limpeza','Higiene','Escritório','Uniforme','Equipamento','Outros']
const UNIDADES = ['Unidade','Pacote','Caixa','Resma','Litro','Kg','Par','Rolo','Frasco']

function ItemModal({ open, onClose, item, onSave }) {
  const [form, setForm] = useState({ nome:'', tipo:'Limpeza', unidade:'Unidade', vlr_unit:0 })
  useEffect(() => {
    if (item) setForm({ nome:item.nome, tipo:item.tipo, unidade:item.unidade, vlr_unit:item.vlr_unit||0 })
    else setForm({ nome:'', tipo:'Limpeza', unidade:'Unidade', vlr_unit:0 })
  }, [item, open])

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  async function submit(e) {
    e.preventDefault()
    if (!form.nome.trim()) return
    await onSave(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Editar Item' : 'Cadastrar Item'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nome do Item" required>
          <input className="input" value={form.nome} onChange={e=>set('nome',e.target.value)}
            placeholder="Ex: Água Sanitária" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo" required>
            <select className="input" value={form.tipo} onChange={e=>set('tipo',e.target.value)}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Unidade" required>
            <select className="input" value={form.unidade} onChange={e=>set('unidade',e.target.value)}>
              {UNIDADES.map(u => <option key={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Valor Unitário (R$)">
          <input type="number" step="0.01" min="0" className="input" value={form.vlr_unit}
            onChange={e=>set('vlr_unit',parseFloat(e.target.value)||0)} />
        </Field>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">{item?'Salvar Alterações':'Cadastrar Item'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Estoque() {
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [sort, setSort] = useState({ col:'nome', dir:'asc' })
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/itens').then(setItens).finally(()=>setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function salvar(form) {
    if (editando) {
      await api.put(`/itens/${editando.id}`, form)
      toast('Item atualizado!')
    } else {
      await api.post('/itens', form)
      toast('Item cadastrado!')
    }
    load()
  }

  async function excluir(id) {
    await api.delete(`/itens/${id}`)
    toast('Item removido.', 'warn')
    load()
  }

  const filtered = itens
    .filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter(i => !filtroTipo || i.tipo === filtroTipo)
    .sort((a,b) => {
      const va = a[sort.col] ?? 0, vb = b[sort.col] ?? 0
      const cmp = typeof va==='string' ? va.localeCompare(vb) : va-vb
      return sort.dir==='asc' ? cmp : -cmp
    })

  function Th({ col, label }) {
    const active = sort.col===col
    return (
      <th className="th whitespace-nowrap cursor-pointer select-none"
        onClick={()=>setSort(s=>({col,dir:s.col===col&&s.dir==='asc'?'desc':'asc'}))}>
        <span className="flex items-center gap-1">
          {label}
          {active ? (sort.dir==='asc'?<ChevronUp size={12}/>:<ChevronDown size={12}/>) : null}
        </span>
      </th>
    )
  }

  const totSaldo = filtered.reduce((s,i)=>s+(i.saldo||0),0)
  const totValor = filtered.reduce((s,i)=>s+(i.saldo||0)*(i.vlr_unit||0),0)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Estoque Atual</h1>
        <button className="btn-primary flex items-center gap-2"
          onClick={()=>{ setEditando(null); setModal(true) }}>
          <Plus size={16}/> Cadastrar Item
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-9" placeholder="Buscar item..." value={busca}
            onChange={e=>setBusca(e.target.value)} />
        </div>
        <select className="input w-44" value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {TIPOS.map(t=><option key={t}>{t}</option>)}
        </select>
        {(busca||filtroTipo) && (
          <button className="btn-ghost" onClick={()=>{setBusca('');setFiltroTipo('')}}>Limpar</button>
        )}
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full min-w-max">
            <thead className="bg-navy-700">
              <tr>
                <Th col="tipo"  label="Tipo" />
                <Th col="nome"  label="Item" />
                <Th col="unidade" label="Unidade" />
                <Th col="total_entradas" label="Entradas" />
                <Th col="total_saidas"   label="Saídas" />
                <Th col="saldo"      label="Saldo" />
                <Th col="vlr_unit"   label="Vlr Unit" />
                <Th col="saldo_vlr"  label="Saldo R$" />
                <th className="th">Status</th>
                <th className="th">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <Empty msg="Nenhum item encontrado." />
                : filtered.map(it => {
                    const saldoVlr = (it.saldo||0)*(it.vlr_unit||0)
                    const rowCls = it.saldo<=0?'trow-danger':it.saldo<=5?'trow-warn':''
                    return (
                      <tr key={it.id} className={`trow ${rowCls}`}
                        onDoubleClick={()=>{ setEditando(it); setModal(true) }}>
                        <td className="td">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{it.tipo}</span>
                        </td>
                        <td className="td font-semibold">{it.nome}</td>
                        <td className="td text-center text-slate-500">{it.unidade}</td>
                        <td className="td text-center text-emerald-600 font-medium">{Math.round(it.total_entradas||0)}</td>
                        <td className="td text-center text-orange-500 font-medium">{Math.round(it.total_saidas||0)}</td>
                        <td className="td text-center font-black text-lg">{Math.round(it.saldo||0)}</td>
                        <td className="td text-center text-slate-500">R$ {(it.vlr_unit||0).toFixed(2)}</td>
                        <td className="td text-center font-medium">R$ {saldoVlr.toFixed(2)}</td>
                        <td className="td text-center"><StatusBadge saldo={it.saldo||0} /></td>
                        <td className="td">
                          <div className="flex gap-1 justify-center">
                            <button title="Editar" className="btn-ghost p-1.5"
                              onClick={()=>{ setEditando(it); setModal(true) }}>
                              <Edit2 size={14}/>
                            </button>
                            <button title="Remover" className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              onClick={()=>setConfirmDel(it)}>
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={5} className="td font-bold text-right">Totais ({filtered.length} itens)</td>
                <td className="td text-center font-black">{Math.round(totSaldo)}</td>
                <td className="td" />
                <td className="td text-center font-bold">R$ {totValor.toFixed(2)}</td>
                <td colSpan={2} className="td" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <ItemModal open={modal} onClose={()=>setModal(false)} item={editando} onSave={salvar} />
      <ConfirmModal
        open={!!confirmDel}
        onClose={()=>setConfirmDel(null)}
        onConfirm={()=>excluir(confirmDel?.id)}
        title="Remover Item"
        message={`Remover "${confirmDel?.nome}"? O histórico de movimentações será mantido.`}
      />
    </div>
  )
}
