import { useState, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, BarChart2, FileDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { api, DESTINOS } from '../lib/api'
import { toast, Spinner, Table, Empty } from '../components/UI'
import { exportCompleto, exportPorDestino, exportEntradas, exportPedido } from '../lib/export'

export default function Relatorios() {
  const [itens, setItens]     = useState([])
  const [entradas, setEntradas] = useState([])
  const [saidas, setSaidas]   = useState([])
  const [loading, setLoading] = useState(true)

  const [buscaPedido, setBuscaPedido] = useState('')
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 12

  useEffect(() => { setPagina(1) }, [buscaPedido])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/itens'),
      api.get('/entradas'),
      api.get('/saidas'),
    ]).then(([i,e,s]) => { setItens(i); setEntradas(e); setSaidas(s) })
      .finally(() => setLoading(false))
  }, [])

  // Resumo por destino
  const resumoDestino = DESTINOS.map(d => {
    const s = saidas.filter(x=>x.destino===d)
    return { dest: d, count: s.length, total: Math.round(s.reduce((a,b)=>a+b.quantidade,0)) }
  }).sort((a,b)=>b.total-a.total)

  // Agrupa saídas por número de pedido
  const pedidos = Object.values(
    saidas.reduce((acc, s) => {
      const num = s.pedido || ('SEM-PEDIDO-' + s.id)
      if (!acc[num]) acc[num] = {
        numero: num, data: s.data, destino: s.destino,
        solicitante: s.solicitante || '—', responsavel: s.responsavel || '—',
        obs: s.obs || '', itens: [], total: 0,
      }
      acc[num].itens.push(s)
      acc[num].total += Number(s.quantidade)
      return acc
    }, {})
  ).sort((a,b) => (b.data||'').localeCompare(a.data||''))

  const pedidosFiltrados = pedidos.filter(p =>
    !buscaPedido ||
    p.numero.toLowerCase().includes(buscaPedido.toLowerCase()) ||
    p.destino?.toLowerCase().includes(buscaPedido.toLowerCase()) ||
    p.solicitante?.toLowerCase().includes(buscaPedido.toLowerCase())
  )

  function fmtDate(d) {
    if (!d) return '—'
    const s = String(d).slice(0,10)
    const [y,m,di] = s.split('-')
    return `${di}/${m}/${y}`
  }

  function gerarRelatorioPedido(pedido) {
    try { exportPedido(pedido, pedido.itens); toast(`Relatório ${pedido.numero} exportado!`) }
    catch { toast('Erro ao exportar.','error') }
  }

  // Gráfico mensal por destino (últimos 6 meses)
  const mesesLabels = []
  const now = new Date()
  for (let i=5; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
    mesesLabels.push(`${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`)
  }
  const chartData = mesesLabels.map(ml => {
    const [mm,yyyy] = ml.split('/')
    const prefix = `${yyyy}-${mm}`
    const obj = { mes: ml }
    // Agrupa top 4 destinos
    const top4 = resumoDestino.slice(0,4).map(r=>r.dest)
    top4.forEach(d => {
      obj[d] = Math.round(saidas.filter(s=>s.destino===d&&s.data.startsWith(prefix)).reduce((a,b)=>a+b.quantidade,0))
    })
    return obj
  })
  const top4Destinos = resumoDestino.slice(0,4).map(r=>r.dest)
  const COLORS = ['#2E6DA4','#27AE60','#E67E22','#C0392B']

  function exportarCompleto() {
    try { exportCompleto(itens, entradas, saidas); toast('Planilha completa exportada!') }
    catch { toast('Erro ao exportar.','error') }
  }
  function exportarDestinos() {
    try { exportPorDestino(saidas, DESTINOS); toast('Saídas por destino exportadas!') }
    catch { toast('Erro ao exportar.','error') }
  }
  function exportarEnt() {
    try { exportEntradas(entradas); toast('Relatório de entradas exportado!') }
    catch { toast('Erro ao exportar.','error') }
  }

  function ExportCard({ icon: Icon, title, desc, btnLabel, onClick, color='bg-brand-500' }) {
    return (
      <div className="card p-6 flex flex-col gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white"/>
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
        </div>
        <button className="btn-primary mt-auto flex items-center gap-2" onClick={onClick}>
          <Download size={14}/> {btnLabel}
        </button>
      </div>
    )
  }

  if (loading) return <div className="p-6"><Spinner/></div>

  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-xl mx-auto">
      <h1 className="page-title">Relatórios e Exportação</h1>

      {/* Cards de exportação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ExportCard
          icon={FileSpreadsheet}
          title="Planilha Completa"
          desc="Exporta Dashboard, Entradas, Saídas e Estoque Atual em um único arquivo .xlsx com formatação completa."
          btnLabel="Exportar Completo (.xlsx)"
          onClick={exportarCompleto}
          color="bg-navy-700"
        />
        <ExportCard
          icon={BarChart2}
          title="Saídas por Destino"
          desc="Uma aba por destino com todas as saídas e somatório por item — mesmo formato das planilhas originais."
          btnLabel="Exportar por Destino (.xlsx)"
          onClick={exportarDestinos}
          color="bg-brand-500"
        />
        <ExportCard
          icon={FileText}
          title="Relatório de Entradas"
          desc="Lista completa de entradas com NF, fornecedor, valores unitários e totais por item."
          btnLabel="Exportar Entradas (.xlsx)"
          onClick={exportarEnt}
          color="bg-emerald-600"
        />
      </div>

      {/* Relatórios por Pedido */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="section-title">📋 Relatórios por Pedido</h2>
          <input className="input !py-1.5 !text-xs w-64"
            placeholder="Buscar por pedido, destino ou solicitante..."
            value={buscaPedido} onChange={e=>setBuscaPedido(e.target.value)}/>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-max">
            <thead className="bg-[#07635b]">
              <tr>
                {['Nº Pedido','Data','Destino','Solicitante','Itens','Total Qtd',''].map((h,i)=>(
                  <th key={i} className="th whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0
                ? <tr><td colSpan={7} className="td text-center text-slate-400 py-8">Nenhum pedido encontrado.</td></tr>
                : pedidosFiltrados.slice((pagina-1)*POR_PAGINA, pagina*POR_PAGINA).map((p,i) => (
                    <tr key={p.numero} className={`trow ${i%2===0?'':'bg-slate-50/50'}`}>
                      <td className="td font-mono text-xs font-semibold text-[#07635b]">{p.numero}</td>
                      <td className="td whitespace-nowrap">{fmtDate(p.data)}</td>
                      <td className="td">
                        <span className="text-xs font-medium bg-[#dbf1ef] text-[#07635b] px-2 py-0.5 rounded-full">{p.destino}</span>
                      </td>
                      <td className="td text-slate-500">{p.solicitante}</td>
                      <td className="td text-center text-xs text-slate-500">{p.itens.length} item(ns)</td>
                      <td className="td text-center font-bold text-orange-500">{Math.round(p.total)}</td>
                      <td className="td">
                        <button
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#07635b] hover:bg-[#dbf1ef] px-2 py-1 rounded-lg transition-colors"
                          onClick={() => gerarRelatorioPedido(p)}>
                          <FileDown size={14}/> .xlsx
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <p className="text-xs text-slate-400">
            {pedidosFiltrados.length} pedido(s) • página {pagina} de {Math.ceil(pedidosFiltrados.length/POR_PAGINA)||1}
          </p>
          <div className="flex gap-1 flex-wrap">
            <button className="btn-ghost text-xs px-2 py-1" disabled={pagina===1}
              onClick={()=>setPagina(p=>p-1)}>← Anterior</button>
            {Array.from({length: Math.ceil(pedidosFiltrados.length/POR_PAGINA)}, (_,i)=>(
              <button key={i} onClick={()=>setPagina(i+1)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${pagina===i+1?'bg-[#07635b] text-white':'hover:bg-[#dbf1ef] text-slate-600'}`}>
                {i+1}
              </button>
            ))}
            <button className="btn-ghost text-xs px-2 py-1"
              disabled={pagina>=Math.ceil(pedidosFiltrados.length/POR_PAGINA)}
              onClick={()=>setPagina(p=>p+1)}>Próximo →</button>
          </div>
        </div>
      </div>

      {/* Gráfico comparativo mensal */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Saídas por Destino — Últimos 6 Meses (Top 4)</h2>
        {saidas.length === 0
          ? <p className="text-slate-400 text-sm py-8 text-center">Sem dados para exibir.</p>
          : <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{left:0}}>
                <XAxis dataKey="mes" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip/>
                <Legend wrapperStyle={{fontSize:12}}/>
                {top4Destinos.map((d,i) => (
                  <Bar key={d} dataKey={d} fill={COLORS[i]} radius={[3,3,0,0]}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Resumo por destino */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Resumo Total de Saídas por Destino</h2>
        <Table cols={['Destino','Nº de Saídas','Total de Itens Enviados']}>
          {resumoDestino.length === 0
            ? <Empty />
            : resumoDestino.map((r,i) => (
                <tr key={r.dest} className="trow">
                  <td className="td font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center">{i+1}</span>
                      {r.dest}
                    </span>
                  </td>
                  <td className="td text-center">{r.count}</td>
                  <td className="td text-center font-black text-brand-600 text-lg">{r.total}</td>
                </tr>
              ))
          }
        </Table>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total de Itens',     value: itens.length,                             icon:'📦' },
          { label:'Total de Entradas',  value: entradas.length,                          icon:'📥' },
          { label:'Total de Saídas',    value: saidas.length,                            icon:'📤' },
          { label:'Valor em Estoque',   value:`R$ ${itens.reduce((s,i)=>s+(i.saldo||0)*(i.vlr_unit||0),0).toFixed(2)}`, icon:'💰' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-2xl font-black text-brand-600">{k.value}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}