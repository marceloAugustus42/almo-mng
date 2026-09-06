import { useState, useEffect, useCallback } from 'react'
import { Download } from 'lucide-react'
import { api, DESTINOS } from '../lib/api'
import { Table, Empty, Spinner, PeriodFilter, toast } from '../components/UI'
import { exportPorDestino } from '../lib/export'

const fmtDate = d => d ? d.split('-').reverse().join('/') : ''

export default function Destinos() {
  const [destino, setDestino] = useState(DESTINOS[0])
  const [saidas, setSaidas] = useState([])
  const [todasSaidas, setTodasSaidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState({ de:'', ate:'' })

  const loadSaidas = useCallback(() => {
    setLoading(true)
    let path = `/saidas?destino=${encodeURIComponent(destino)}`
    if (periodo.de)  path += `&de=${periodo.de}`
    if (periodo.ate) path += `&ate=${periodo.ate}`
    api.get(path).then(setSaidas).finally(()=>setLoading(false))
  }, [destino, periodo])

  // Carrega todas as saídas para exportação completa
  useEffect(() => {
    api.get('/saidas').then(setTodasSaidas)
  }, [])

  useEffect(() => { loadSaidas() }, [loadSaidas])

  // Somatório por item
  const resumo = saidas.reduce((acc, s) => {
    const key = s.item_nome
    if (!acc[key]) acc[key] = { nome: key, unidade: s.item_unidade||'', total: 0 }
    acc[key].total += s.quantidade
    return acc
  }, {})
  const resumoList = Object.values(resumo).sort((a,b) => b.total - a.total)
  const totalGeral = saidas.reduce((s,e)=>s+e.quantidade,0)

  function exportarDestino() {
    try {
      exportPorDestino(saidas, [destino])
      toast(`Excel de "${destino}" exportado!`)
    } catch { toast('Erro ao exportar.','error') }
  }

  function exportarTodos() {
    try {
      exportPorDestino(todasSaidas, DESTINOS)
      toast('Excel com todos os destinos exportado!')
    } catch { toast('Erro ao exportar.','error') }
  }

  return (
    <div className="flex gap-0 h-full min-h-screen">
      {/* Sidebar de destinos */}
      <aside className="w-48 shrink-0 border-r border-slate-200 bg-white pt-6">
        <p className="px-4 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Destinos</p>
        {DESTINOS.map(d => (
          <button
            key={d}
            onClick={() => setDestino(d)}
            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors border-r-2
              ${destino === d
                ? 'bg-brand-50 text-brand-600 border-brand-500'
                : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
          >
            {d}
          </button>
        ))}
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col gap-5 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">{destino}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Controle de saídas por destino</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn-secondary flex items-center gap-2" onClick={exportarDestino}>
              <Download size={15}/> Exportar este destino
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={exportarTodos}>
              <Download size={15}/> Exportar todos (.xlsx)
            </button>
          </div>
        </div>

        {/* Filtro período */}
        <PeriodFilter de={periodo.de} ate={periodo.ate} onChange={setPeriodo} />

        {loading ? <Spinner /> : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Tabela de saídas */}
            <div className="xl:col-span-2 flex flex-col gap-2">
              <h2 className="section-title">Saídas Registradas</h2>
              <Table cols={['Data','Pedido','Item','Qtd','Unidade','Solicitante','Responsável']}>
                {saidas.length === 0 ? <Empty msg="Nenhuma saída para este destino." /> :
                  saidas.map(s => (
                    <tr key={s.id} className="trow">
                      <td className="td whitespace-nowrap">{fmtDate(s.data)}</td>
                      <td className="td text-slate-500">{s.pedido||'—'}</td>
                      <td className="td font-medium">{s.item_nome}</td>
                      <td className="td text-center font-bold text-orange-500">{s.quantidade}</td>
                      <td className="td text-slate-500 text-center">{s.item_unidade||'—'}</td>
                      <td className="td text-slate-500">{s.solicitante||'—'}</td>
                      <td className="td text-slate-500">{s.responsavel||'—'}</td>
                    </tr>
                  ))
                }
              </Table>
              {saidas.length > 0 && (
                <div className="text-right text-sm font-semibold text-slate-600 mt-1">
                  Total: <span className="text-orange-500 font-black text-lg">{Math.round(totalGeral)}</span> itens enviados
                </div>
              )}
            </div>

            {/* Resumo somatório por item */}
            <div className="flex flex-col gap-2">
              <h2 className="section-title">Somatório por Item</h2>
              <div className="card overflow-hidden">
                {resumoList.length === 0
                  ? <p className="p-6 text-center text-slate-400 text-sm">Sem dados.</p>
                  : (
                    <table className="w-full">
                      <thead className="bg-navy-700">
                        <tr>
                          <th className="th">#</th>
                          <th className="th text-left">Item</th>
                          <th className="th">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumoList.map((r,i) => (
                          <tr key={r.nome} className={`trow ${i%2===0?'':'bg-slate-50/50'}`}>
                            <td className="td text-center text-xs text-slate-400">{i+1}</td>
                            <td className="td">
                              <div className="font-medium text-slate-800">{r.nome}</div>
                              <div className="text-xs text-slate-400">{r.unidade}</div>
                            </td>
                            <td className="td text-center">
                              <span className="font-black text-brand-600 text-lg">{Math.round(r.total)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={2} className="td font-bold text-right text-slate-600">Total Geral</td>
                          <td className="td text-center font-black text-orange-500 text-lg">
                            {Math.round(totalGeral)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )
                }
              </div>

              {/* Card visual de totais */}
              {resumoList.length > 0 && (
                <div className="card p-4 bg-brand-500 border-0">
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">{destino}</p>
                  <p className="text-white text-3xl font-black mt-1">{Math.round(totalGeral)}</p>
                  <p className="text-blue-200 text-xs mt-0.5">itens enviados no período</p>
                  <p className="text-blue-300 text-xs mt-2">{resumoList.length} tipo(s) de item</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
