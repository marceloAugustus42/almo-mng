import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'
import { Modal, ConfirmModal, Table, StatusBadge, Empty, Spinner, Field, toast } from '../components/UI'

const SENHA_ADMIN = 'mikeobrabo'
const UNIDADES = ['Unidade','Pacote','Caixa','Resma','Litro','Kg','Par','Rolo','Frasco']
const TIPOS_KEY = 'almoxa_tipos'
const TIPOS_PADRAO = ['Limpeza','Higiene','Escritório','Uniforme','Equipamento','Outros']

const getTipos = () => { try { const r = localStorage.getItem(TIPOS_KEY); return r ? JSON.parse(r) : TIPOS_PADRAO } catch { return TIPOS_PADRAO } }
const saveTipos = t => localStorage.setItem(TIPOS_KEY, JSON.stringify(t))

const ORDENACOES = [
  { value:'nome_asc',     label:'Nome (A→Z)' },
  { value:'saldo_desc',   label:'Mais quantidade' },
  { value:'saldo_asc',    label:'Menos quantidade' },
  { value:'valor_desc',   label:'Mais valor acumulado' },
  { value:'valor_asc',    label:'Menos valor acumulado' },
  { value:'recente_desc', label:'Mais recentes' },
  { value:'recente_asc',  label:'Mais antigos' },
]

function ItemModal({ open, onClose, item, onSave, tipos }) {
  const [form, setForm] = useState({ nome:'', tipo:'Limpeza', unidade:'Unidade', vlr_unit:'' })
  useEffect(() => {
    setForm(item
      ? { nome:item.nome, tipo:item.tipo, unidade:item.unidade, vlr_unit:item.vlr_unit||'' }
      : { nome:'', tipo: tipos[0]||'Limpeza', unidade:'Unidade', vlr_unit:'' })
  }, [item, open])
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  async function submit(e) {
    e.preventDefault()
    if (!form.nome.trim()) return
    await onSave({ ...form, vlr_unit: parseFloat(form.vlr_unit)||0 })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Editar Item' : 'Cadastrar Item'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nome do Item" required>
          <input className="input" value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Ex: Água Sanitária" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo" required>
            <select className="input" value={form.tipo} onChange={e=>set('tipo',e.target.value)}>
              {tipos.map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Unidade" required>
            <select className="input" value={form.unidade} onChange={e=>set('unidade',e.target.value)}>
              {UNIDADES.map(u=><option key={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Valor Unitário (R$)">
          <input type="number" step="0.01" min="0" className="input" value={form.vlr_unit}
            placeholder="0,00"
            onChange={e=>set('vlr_unit',e.target.value)}
            onBlur={e=>set('vlr_unit', parseFloat(e.target.value)||'')} />
        </Field>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">{item?'Salvar':'Cadastrar'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Estoque() {
  const [itens, setItens]       = useState([])
  const [tipos, setTipos]       = useState(getTipos)
  const [loading, setLoading]   = useState(true)
  const [busca, setBusca]       = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [ordenacao, setOrdenacao]   = useState('nome_asc')
  const [modal, setModal]       = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/itens').then(setItens).finally(()=>setLoading(false))
  }, [])
  useEffect(()=>{ load() },[load])
  useEffect(()=>{ saveTipos(tipos) },[tipos])

  async function salvar(form) {
    if (editando) { await api.put(`/itens/${editando.id}`, form); toast('Item atualizado!') }
    else { await api.post('/itens', form); toast('Item cadastrado!') }
    load()
  }

  async function excluir(id) {
    await api.delete(`/itens/${id}`)
    toast('Item removido.','warn'); load()
  }

  function cadastrarTipo() {
    const senha = window.prompt('Senha para cadastrar novo tipo:')
    if (senha !== SENHA_ADMIN) { if (senha !== null) toast('Senha incorreta.','error'); return }
    const novo = window.prompt('Nome do novo tipo:')?.trim()
    if (!novo) return
    if (tipos.includes(novo)) { toast('Tipo já existe.','error'); return }
    setTipos(t=>[...t, novo])
    toast(`Tipo "${novo}" cadastrado!`)
  }

  const saldoValor = i => (Number(i.saldo)||0) * (Number(i.vlr_unit)||0)

  const filtered = itens
    .filter(i => !busca || i.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter(i => !filtroTipo || i.tipo === filtroTipo)
    .sort((a,b) => {
      switch(ordenacao) {
        case 'saldo_desc':   return (b.saldo||0) - (a.saldo||0)
        case 'saldo_asc':    return (a.saldo||0) - (b.saldo||0)
        case 'valor_desc':   return saldoValor(b) - saldoValor(a)
        case 'valor_asc':    return saldoValor(a) - saldoValor(b)
        case 'recente_desc': return (b.id||0) - (a.id||0)
        case 'recente_asc':  return (a.id||0) - (b.id||0)
        default:             return a.nome.localeCompare(b.nome)
      }
    })

  const totSaldo = filtered.reduce((s,i)=>s+(i.saldo||0),0)
  const totValor = filtered.reduce((s,i)=>s+Number(saldoValor(i)),0)

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
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="input !pl-9" placeholder="Buscar item..." value={busca}
            onChange={e=>setBusca(e.target.value)}/>
        </div>
        <select className="input w-52" value={filtroTipo} onChange={e=>{ if(e.target.value==='__novo__') cadastrarTipo(); else setFiltroTipo(e.target.value) }}>
          <option value="">Todos os tipos</option>
          {tipos.map(t=><option key={t}>{t}</option>)}
          <option value="__novo__">Cadastrar novo tipo +</option>
        </select>
        <select className="input w-52" value={ordenacao} onChange={e=>setOrdenacao(e.target.value)}>
          {ORDENACOES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(busca||filtroTipo) && <button className="btn-ghost" onClick={()=>{setBusca('');setFiltroTipo('')}}>Limpar</button>}
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full min-w-max">
            <thead className="bg-[#07635b]">
              <tr>
                {['Tipo','Item','Unidade','Entradas','Saídas','Saldo','Vlr Unit','Saldo R$','Status',''].map((h,i)=>(
                  <th key={i} className="th whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? <Empty msg="Nenhum item encontrado."/> : filtered.map(it=>{
                const sv = saldoValor(it)
                const rowCls = it.saldo<=0?'trow-danger':it.saldo<=5?'trow-warn':''
                return (
                  <tr key={it.id} className={`trow ${rowCls}`}>
                    <td className="td"><span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{it.tipo}</span></td>
                    <td className="td font-semibold">{it.nome}</td>
                    <td className="td text-center text-slate-500">{it.unidade}</td>
                    <td className="td text-center text-emerald-600 font-medium">{Math.round(it.total_entradas||0)}</td>
                    <td className="td text-center text-orange-500 font-medium">{Math.round(it.total_saidas||0)}</td>
                    <td className="td text-center font-black text-lg">{Math.round(it.saldo||0)}</td>
                    <td className="td text-center text-slate-500">R$ {Number(it.vlr_unit||0).toFixed(2)}</td>
                    <td className="td text-center font-medium">R$ {Number(sv).toFixed(2)}</td>
                    <td className="td text-center"><StatusBadge saldo={it.saldo||0}/></td>
                    <td className="td">
                      <div className="flex gap-1 justify-center">
                        <button title="Editar" className="btn-ghost p-1.5"
                          onClick={()=>{ setEditando(it); setModal(true) }}>
                          <Pencil size={14}/>
                        </button>
                        <button title="Remover"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={()=>setConfirmDel(it)}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={5} className="td font-bold text-right">Totais ({filtered.length} itens)</td>
                <td className="td text-center font-black">{Math.round(totSaldo)}</td>
                <td className="td"/>
                <td className="td text-center font-bold">R$ {Number(totValor).toFixed(2)}</td>
                <td colSpan={2} className="td"/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <ItemModal open={modal} onClose={()=>setModal(false)} item={editando} onSave={salvar} tipos={tipos}/>
      <ConfirmModal
        open={!!confirmDel} onClose={()=>setConfirmDel(null)}
        onConfirm={()=>excluir(confirmDel?.id)}
        title="Remover Item"
        message={`Remover "${confirmDel?.nome}"? O histórico será mantido.`}/>
    </div>
  )
}