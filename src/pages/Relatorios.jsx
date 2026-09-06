import { useState, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { api, DESTINOS } from '../lib/api'
import { toast, Spinner, Table, Empty } from '../components/UI'
import { exportCompleto, exportPorDestino, exportEntradas } from '../lib/export'

export default function Relatorios() {
  const [itens, setItens]     = useState([])
  const [entradas, setEntradas] = useState([])
  const [saidas, setSaidas]   = useState([])
  const [loading, setLoading] = useState(true)

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
