import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Search, X, PackagePlus } from 'lucide-react'
import { api } from '../lib/api'
import { Table, Empty, Spinner, Field, ItemCombobox, PeriodFilter, ConfirmModal, toast } from '../components/UI'

const fmtDate = d => { if (!d) return '—'; const s = String(d).slice(0,10); const [y,m,di]=s.split('-'); return `${di}/${m}/${y}` }
const today   = () => new Date().toISOString().slice(0,10)

const UNIDADES    = ['Unidade','Pacote','Caixa','Resma','Litro','Kg','Par','Rolo','Frasco']
const TIPOS_KEY   = 'almoxa_tipos'
const TIPOS_PAD   = ['Limpeza','Higiene','Escritório','Uniforme','Equipamento','Outros']
const getTipos    = () => { try { const r=localStorage.getItem(TIPOS_KEY); return r?JSON.parse(r):TIPOS_PAD } catch { return TIPOS_PAD } }

const LINHA_VAZIA = { item_id:'', quantidade:'', vlr_unit:'', novo:false, nome:'', tipo:'', unidade:'Unidade' }

export default function Entradas() {
  const [itens, setItens]       = useState([])
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [busca, setBusca]       = useState('')
  const [periodo, setPeriodo]   = useState({ de:'', ate:'' })
  const [confirmDel, setConfirmDel] = useState(null)
  const [tipos] = useState(getTipos)

  const [cab, setCab] = useState({ data:today(), nf:'', fornecedor:'', responsavel:'', obs:'' })
  const setC = (k,v) => setCab(f=>({...f,[k]:v}))

  const [linhas, setLinhas] = useState([{ ...LINHA_VAZIA }])
  const setL = (idx,k,v) => setLinhas(ls=>ls.map((l,i)=>i===idx?{...l,[k]:v}:l))

  function toggleNovo(idx, checked) {
    setLinhas(ls=>ls.map((l,i)=>i===idx
      ? { ...l, novo:checked, item_id:'', nome:'', tipo:tipos[0]||'', unidade:'Unidade', vlr_unit:'' }
      : l))
  }

  function handleItemChange(idx, item_id) {
    const item = itens.find(i=>i.id===item_id)
    setL(idx,'item_id',item_id)
    if (item) setL(idx,'vlr_unit',item.vlr_unit||'')
  }

  const loadItens    = useCallback(()=>api.get('/itens').then(setItens),[])
  const loadEntradas = useCallback(()=>{
    setLoading(true)
    let p='/entradas?'
    if(periodo.de)  p+=`de=${periodo.de}&`
    if(periodo.ate) p+=`ate=${periodo.ate}&`
    api.get(p).then(setEntradas).finally(()=>setLoading(false))
  },[periodo])

  useEffect(()=>{ loadItens() },[loadItens])
  useEffect(()=>{ loadEntradas() },[loadEntradas])

  async function submit(e) {
    e.preventDefault()
    const validas = linhas.filter(l=>l.novo ? l.nome.trim() : l.item_id)
    if (!validas.length) { toast('Adicione ao menos um item.','error'); return }
    if (validas.some(l=>!l.quantidade||Number(l.quantidade)<1)) { toast('Preencha a quantidade de todos os itens.','error'); return }

    setSaving(true)
    try {
      // Persiste novos tipos no localStorage
      const tiposKey = 'almoxa_tipos'
      const tiposAtuais = JSON.parse(localStorage.getItem(tiposKey)||'[]')
      validas.filter(l=>l.novo&&l.novoTipo&&l.tipoNovo?.trim()).forEach(l=>{
        const t = l.tipoNovo.trim()
        if (!tiposAtuais.includes(t)) tiposAtuais.push(t)
      })
      localStorage.setItem(tiposKey, JSON.stringify(tiposAtuais))

      for (const l of validas) {
        let item_id = l.item_id
        // Se novo cadastro, cria o item primeiro
        if (l.novo) {
          if (itens.some(i=>i.nome.toLowerCase()===l.nome.toLowerCase())) {
            toast(`"${l.nome}" já existe. Desmarque "Novo cadastro".`,'error'); setSaving(false); return
          }
          const novo = await api.post('/itens', { nome:l.nome, tipo:l.tipo||tipos[0], unidade:l.unidade, vlr_unit:parseFloat(l.vlr_unit)||0 })
          item_id = novo.id
        }
        await api.post('/entradas', { ...cab, item_id, quantidade:Math.floor(Number(l.quantidade)), vlr_unit:parseFloat(l.vlr_unit)||0 })
      }
      toast(`${validas.length} item(ns) registrado(s)!`)
      setCab({ data:today(), nf:'', fornecedor:'', responsavel:'', obs:'' })
      setLinhas([{ ...LINHA_VAZIA }])
      loadEntradas(); loadItens()
    } catch { toast('Erro ao registrar.','error') }
    finally { setSaving(false) }
  }

  async function excluir(id) {
    await api.delete(`/entradas/${id}`)
    toast('Entrada removida.','warn')
    loadEntradas(); loadItens()
  }

  const filtered = entradas.filter(e=>
    !busca||e.item_nome?.toLowerCase().includes(busca.toLowerCase())||
    e.fornecedor?.toLowerCase().includes(busca.toLowerCase())
  )
  const totQtd = filtered.reduce((s,e)=>s+e.quantidade,0)
  const totVlr = filtered.reduce((s,e)=>s+e.quantidade*(e.vlr_unit||0),0)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-screen-xl mx-auto">
      <h1 className="page-title">Entradas</h1>

      <div className="card p-6">
        <h2 className="section-title mb-4 text-[#07635b]">Registrar Nova Entrada / Carregamento</h2>
        <form onSubmit={submit} className="flex flex-col gap-5">

          {/* Cabeçalho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
            <Field label="Data" required><input type="date" className="input" value={cab.data} onChange={e=>setC('data',e.target.value)}/></Field>
            <Field label="Nº Nota Fiscal"><input className="input" placeholder="NF-001" value={cab.nf} onChange={e=>setC('nf',e.target.value)}/></Field>
            <Field label="Fornecedor"><input className="input" placeholder="Nome do fornecedor" value={cab.fornecedor} onChange={e=>setC('fornecedor',e.target.value)}/></Field>
            <Field label="Responsável"><input className="input" placeholder="Nome" value={cab.responsavel} onChange={e=>setC('responsavel',e.target.value)}/></Field>
            <Field label="Observações"><input className="input" placeholder="Opcional" value={cab.obs} onChange={e=>setC('obs',e.target.value)}/></Field>
          </div>

          {/* Linhas de itens */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="label">Itens do Carregamento</span>
              <button type="button" className="btn-secondary flex items-center gap-1.5 !py-1 !text-xs"
                onClick={()=>setLinhas(ls=>[...ls,{...LINHA_VAZIA}])}>
                <Plus size={13}/> Adicionar Item
              </button>
            </div>

            {linhas.map((linha,idx)=>(
              <div key={idx} className="bg-slate-50 rounded-lg p-3 flex flex-col gap-2">
                <div className="grid grid-cols-12 gap-2 items-start">

                  {/* Coluna: seleção/cadastro de item */}
                  <div className="col-span-12 sm:col-span-5 flex flex-col gap-1.5">
                    {!linha.novo
                      ? <ItemCombobox itens={itens} value={linha.item_id} onChange={v=>handleItemChange(idx,v)}/>
                      : (
                        <div className="flex flex-col gap-2">
                          <input className="input" placeholder="Nome do item *" value={linha.nome}
                            onChange={e=>setL(idx,'nome',e.target.value)}/>
                          <div className="grid grid-cols-2 gap-2">
                            <select className="input !text-xs" value={linha.tipo} onChange={e=>setL(idx,'tipo',e.target.value)}>
                              {tipos.map(t=><option key={t}>{t}</option>)}
                            </select>
                            <select className="input !text-xs" value={linha.unidade} onChange={e=>setL(idx,'unidade',e.target.value)}>
                              {UNIDADES.map(u=><option key={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>
                      )
                    }
                    {/* Checkboxes */}
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                        <input type="checkbox" checked={linha.novo} onChange={e=>toggleNovo(idx,e.target.checked)} className="accent-[#07635b]"/>
                        Novo cadastro (primeiro registro deste item)
                      </label>
                      {linha.novo && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                          <input type="checkbox" checked={linha.novoTipo||false}
                            onChange={e=>setL(idx,'novoTipo',e.target.checked)} className="accent-[#07635b]"/>
                          Cadastrar novo tipo
                        </label>
                      )}
                    </div>
                    {linha.novo && linha.novoTipo && (
                      <input className="input !text-xs mt-1" placeholder="Nome do novo tipo..."
                        value={linha.tipoNovo||''}
                        onChange={e=>setL(idx,'tipoNovo',e.target.value)}/>
                    )}
                  </div>

                  {/* Quantidade */}
                  <div className="col-span-5 sm:col-span-3">
                    <input type="number" min="1" step="1" placeholder="Qtd" value={linha.quantidade}
                      className={`input ${!linha.quantidade?'border-red-400':''}`}
                      onChange={e=>setL(idx,'quantidade',e.target.value===''?'':Math.floor(Number(e.target.value)))}/>
                  </div>

                  {/* Vlr Unit */}
                  <div className="col-span-5 sm:col-span-3">
                    <input type="number" min="0" step="0.01" className="input" placeholder="Vlr unit (R$)"
                      value={linha.vlr_unit}
                      onChange={e=>setL(idx,'vlr_unit',e.target.value)}/>
                  </div>

                  {/* Remover */}
                  <div className="col-span-2 sm:col-span-1 flex justify-center pt-1">
                    {linhas.length>1 && (
                      <button type="button" onClick={()=>setLinhas(ls=>ls.filter((_,i)=>i!==idx))}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                        <X size={15}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm text-slate-500">{linhas.filter(l=>l.novo?l.nome:l.item_id).length} item(ns)</span>
            <button type="submit" className="btn-primary flex items-center gap-2 px-6" disabled={saving}>
              <PackagePlus size={16}/> {saving?'Salvando...':'Registrar Entrada'}
            </button>
          </div>
        </form>
      </div>

      {/* Histórico */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Histórico de Entradas</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <PeriodFilter de={periodo.de} ate={periodo.ate} onChange={setPeriodo}/>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="input !pl-8 !py-1.5 !text-xs w-44" placeholder="Buscar..."
              value={busca} onChange={e=>setBusca(e.target.value)}/>
          </div>
        </div>
      </div>

      {loading ? <Spinner/> : (
        <Table
          cols={['Data','NF','Fornecedor','Item','Qtd','Vlr Unit','Vlr Total','Responsável','Obs','']}
          footer={
            <tr>
              <td colSpan={4} className="td font-bold text-right">Total ({filtered.length})</td>
              <td className="td text-center font-black">{totQtd}</td>
              <td className="td"/>
              <td className="td text-center font-bold">R$ {Number(totVlr).toFixed(2)}</td>
              <td colSpan={3} className="td"/>
            </tr>
          }>
          {filtered.length===0?<Empty/>:filtered.map(e=>(
            <tr key={e.id} className="trow">
              <td className="td whitespace-nowrap">{fmtDate(e.data)}</td>
              <td className="td text-slate-500">{e.nf||'—'}</td>
              <td className="td">{e.fornecedor||'—'}</td>
              <td className="td font-medium">{e.item_nome}</td>
              <td className="td text-center font-bold text-emerald-600">{e.quantidade}</td>
              <td className="td text-center">R$ {Number(e.vlr_unit||0).toFixed(2)}</td>
              <td className="td text-center font-medium">R$ {(Number(e.quantidade)*Number(e.vlr_unit||0)).toFixed(2)}</td>
              <td className="td text-slate-500">{e.responsavel||'—'}</td>
              <td className="td text-slate-400 text-xs">{e.obs||''}</td>
              <td className="td">
                <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={()=>setConfirmDel(e)}><Trash2 size={14}/></button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <ConfirmModal open={!!confirmDel} onClose={()=>setConfirmDel(null)}
        onConfirm={()=>excluir(confirmDel?.id)}
        title="Remover Entrada"
        message={`Remover entrada de "${confirmDel?.item_nome}"?`}/>
    </div>
  )
}