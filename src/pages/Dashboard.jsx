import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api } from '../lib/api'
import { KpiCard, StatusBadge, Spinner, Table, Empty } from '../components/UI'

const COLORS = ['#2E6DA4','#3A8AC4','#5BA4D4','#27AE60','#E67E22','#C0392B','#8E44AD','#16A085','#D4AC0D']
const fmtDate = d => d ? d.split('-').reverse().join('/') : ''

const EMPTY_DATA = {
  kpis: { total_itens:0, total_entradas_qtd:0, total_saidas_qtd:0, criticos:0, zerados:0 },
  alertas: [], top10: [], porDestino: [], movs: []
}

export default function Dashboard() {
  const now = new Date()
  const [mes, setMes] = useState(String(now.getMonth()+1).padStart(2,'0'))
  const [ano, setAno] = useState(String(now.getFullYear()))
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/dashboard?mes=${mes}&ano=${ano}`)
      .then(res => setData(res && res.kpis ? res : EMPTY_DATA))
      .catch(() => setData(EMPTY_DATA))
      .finally(() => setLoading(false))
  }, [mes, ano])

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const anos = ['2024','2025','2026','2027']
  const kpis = data.kpis || EMPTY_DATA.kpis

  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Período:</span>
          <select className="input !py-1.5 !text-xs w-24"
            value={mes} onChange={e => setMes(e.target.value)}>
            {meses.map((m,i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
          </select>
          <select className="input !py-1.5 !text-xs w-20"
            value={ano} onChange={e => setAno(e.target.value)}>
            {anos.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : <>
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard label="Itens Cadastrados"    value={kpis.total_itens}                     icon="📦" />
          <KpiCard label="Entradas no Mês"      value={Math.round(kpis.total_entradas_qtd)}  icon="📥" />
          <KpiCard label="Saídas no Mês"        value={Math.round(kpis.total_saidas_qtd)}    icon="📤" />
          <KpiCard label="Estoque Crítico (≤5)" value={kpis.criticos} color="text-amber-500" icon="⚠️" />
          <KpiCard label="Estoque Zerado"       value={kpis.zerados}  color="text-red-500"   icon="🔴" />
        </div>

        {/* Alertas */}
        {data.alertas?.length > 0 && (
          <div className="card p-5">
            <h2 className="section-title mb-3 text-amber-600">⚠️ Itens com Estoque Crítico ou Zerado</h2>
            <Table cols={['Item','Tipo','Unidade','Saldo','Status']}>
              {data.alertas.map(it => (
                <tr key={it.id} className={`trow ${it.saldo<=0?'trow-danger':'trow-warn'}`}>
                  <td className="td font-medium">{it.nome}</td>
                  <td className="td">{it.tipo}</td>
                  <td className="td">{it.unidade}</td>
                  <td className="td font-bold text-center">{Math.round(it.saldo)}</td>
                  <td className="td text-center"><StatusBadge saldo={it.saldo} /></td>
                </tr>
              ))}
            </Table>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="section-title mb-4">Top 10 Itens — Saídas no Mês</h2>
            {!data.top10?.length
              ? <p className="text-slate-400 text-sm py-8 text-center">Sem dados no período.</p>
              : <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.top10} layout="vertical" margin={{left:20}}>
                    <XAxis type="number" tick={{fontSize:11}} />
                    <YAxis type="category" dataKey="nome" tick={{fontSize:11}} width={120} />
                    <Tooltip formatter={v => [v, 'Qtd']} />
                    <Bar dataKey="qtd" fill="#2E6DA4" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">Saídas por Destino — Mês</h2>
            {!data.porDestino?.length
              ? <p className="text-slate-400 text-sm py-8 text-center">Sem dados no período.</p>
              : <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={data.porDestino} dataKey="qtd" nameKey="dest"
                         cx="50%" cy="50%" outerRadius={90}
                         label={({dest,percent}) => `${dest.split(' ')[0]} ${(percent*100).toFixed(0)}%`}
                         labelLine={false}>
                      {data.porDestino.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v,n,p) => [v, p.payload.dest]} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* Últimas movimentações */}
        <div className="card p-5">
          <h2 className="section-title mb-3">🕐 Últimas Movimentações</h2>
          <Table cols={['Data','Tipo','Item','Qtd','Destino / Fornecedor']}>
            {!data.movs?.length
              ? <Empty />
              : data.movs.map((m,i) => (
                  <tr key={i} className="trow">
                    <td className="td">{fmtDate(m.data)}</td>
                    <td className="td">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold
                        ${m.tipo==='Entrada'?'bg-emerald-100 text-emerald-700':'bg-orange-100 text-orange-700'}`}>
                        {m.tipo==='Entrada'?'📥':'📤'} {m.tipo}
                      </span>
                    </td>
                    <td className="td font-medium">{m.item_nome}</td>
                    <td className="td text-center font-bold">{Math.round(m.qtd)}</td>
                    <td className="td text-slate-500">{m.extra}</td>
                  </tr>
                ))
            }
          </Table>
        </div>
      </>}
    </div>
  )
}
