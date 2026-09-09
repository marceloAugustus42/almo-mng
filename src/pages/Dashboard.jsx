import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine, ComposedChart, Area
} from 'recharts'
import { api } from '../lib/api'
import { KpiCard, StatusBadge, Spinner, Table, Empty } from '../components/UI'

// ── Paleta ────────────────────────────────────────────────────────────────────
const COR_ENT  = '#07635b'
const COR_SAI  = '#E67E22'
const COR_ABC  = '#07635b'
const COR_PCT  = '#5e8e89'
const DONUT_COLORS = ['#07635b','#5e8e89','#dbf1ef','#E67E22','#C0392B','#8E44AD','#3498DB','#D4AC0D']

const fmtDate = d => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return String(d).slice(0,10).split('-').reverse().join('/')
  return `${String(dt.getUTCDate()).padStart(2,'0')}/${String(dt.getUTCMonth()+1).padStart(2,'0')}/${dt.getUTCFullYear()}`
}

const fmtHora = s => {
  if (!s) return '—'
  const dt = new Date(s)
  if (isNaN(dt)) return '—'
  const h = String(dt.getUTCHours()).padStart(2,'0')
  const m = String(dt.getUTCMinutes()).padStart(2,'0')
  return h === '00' && m === '00' ? '—' : `${h}:${m}`
}
const fmtMoeda = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits:2 })}`

const EMPTY_DATA = {
  kpis: { total_itens:0, total_entradas_qtd:0, total_saidas_qtd:0, criticos:0, zerados:0 },
  alertas:[], entradasVsSaidas:[], curvaABC:[], composicaoEstoque:[], parado:[], movs:[], porDestino:[], top10:[]
}

// ── Tooltip customizado ───────────────────────────────────────────────────────
function TooltipEntvsSai({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function SectionTitle({ children, color }) {
  return (
    <h2 className="section-title mb-3" style={color ? { color } : {}}>
      {children}
    </h2>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const now = new Date()
  const [mes, setMes] = useState(String(now.getMonth()+1).padStart(2,'0'))
  const [ano, setAno] = useState(String(now.getFullYear()))
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/dashboard?mes=${mes}&ano=${ano}`)
      .then(res => setData(res?.kpis ? res : EMPTY_DATA))
      .catch(() => setData(EMPTY_DATA))
      .finally(() => setLoading(false))
  }, [mes, ano])

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const anos  = ['2024','2025','2026','2027']
  const kpis  = data.kpis || EMPTY_DATA.kpis

  // Label do donut
  const donutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, tipo }) => {
    if (percent < 0.07) return null
    const r = innerRadius + (outerRadius - innerRadius) * 0.6
    const x = cx + r * Math.cos(-midAngle * Math.PI / 180)
    const y = cy + r * Math.sin(-midAngle * Math.PI / 180)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {(percent*100).toFixed(0)}%
      </text>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Período:</span>
          <select className="input !py-1.5 !text-xs w-24" value={mes} onChange={e => setMes(e.target.value)}>
            {meses.map((m,i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
          </select>
          <select className="input !py-1.5 !text-xs w-20" value={ano} onChange={e => setAno(e.target.value)}>
            {anos.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : <>

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard label="Itens Cadastrados"    value={kpis.total_itens}                     icon="📦" />
          <KpiCard label="Entradas no Mês"      value={Math.round(kpis.total_entradas_qtd)}  icon="📥" color="text-[#07635b]" />
          <KpiCard label="Saídas no Mês"        value={Math.round(kpis.total_saidas_qtd)}    icon="📤" color="text-orange-500" />
          <KpiCard label="Estoque Crítico (≤5)" value={kpis.criticos} color="text-amber-500" icon="⚠️" />
          <KpiCard label="Estoque Zerado"       value={kpis.zerados}  color="text-red-500"   icon="🔴" />
        </div>

        {/* ── Alertas críticos ──────────────────────────────────────────────── */}
        {data.alertas?.length > 0 && (
          <div className="card p-5">
            <SectionTitle color="#b45309">⚠️ Itens com Estoque Crítico ou Zerado</SectionTitle>
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

        {/* ── Gráfico 1: Entradas vs Saídas por dia ────────────────────────── */}
        <div className="card p-5">
          <SectionTitle>📈 Entradas vs. Saídas — Dia a Dia ({meses[parseInt(mes)-1]}/{ano})</SectionTitle>
          {!data.entradasVsSaidas?.length
            ? <p className="text-slate-400 text-sm py-8 text-center">Sem movimentações no período.</p>
            : <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data.entradasVsSaidas} margin={{ left:0, right:10 }}>
                  <XAxis dataKey="dia" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:11 }} allowDecimals={false} />
                  <Tooltip content={<TooltipEntvsSai />} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <ReferenceLine y={0} stroke="#e2e8f0" />
                  <Bar dataKey="entradas" name="Entradas" fill={COR_ENT} radius={[3,3,0,0]} opacity={0.85} />
                  <Bar dataKey="saidas"   name="Saídas"   fill={COR_SAI} radius={[3,3,0,0]} opacity={0.85} />
                  <Line type="monotone" dataKey="entradas" stroke={COR_ENT} dot={false} strokeWidth={2} name=" " legendType="none" />
                  <Line type="monotone" dataKey="saidas"   stroke={COR_SAI} dot={false} strokeWidth={2} name=" " legendType="none" />
                </ComposedChart>
              </ResponsiveContainer>
          }
        </div>

        {/* ── Gráficos 2 e 3 lado a lado ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Curva ABC */}
          <div className="card p-5">
            <SectionTitle>📊 Curva ABC — Top 10 Mais Consumidos</SectionTitle>
            <p className="text-xs text-slate-400 mb-3">Linha = % acumulada do consumo total</p>
            {!data.curvaABC?.length
              ? <p className="text-slate-400 text-sm py-8 text-center">Sem dados no período.</p>
              : <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={data.curvaABC} layout="vertical" margin={{ left:8, right:40 }}>
                    <XAxis type="number" tick={{ fontSize:10 }} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize:10 }} width={110} />
                    <Tooltip formatter={(v, name) => name === 'pct' ? [`${v}%`, '% Acum.'] : [v, 'Qtd']} />
                    <Bar dataKey="qtd" name="Qtd" fill={COR_ABC} radius={[0,3,3,0]} />
                    <Line type="monotone" dataKey="pct" name="% Acum."
                      stroke={COR_PCT} strokeWidth={2} dot={{ r:3, fill:COR_PCT }}
                      yAxisId={0}
                      label={{ position:'right', fontSize:9, formatter:v=>`${v}%`, fill:COR_PCT }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Composição do estoque - Donut */}
          <div className="card p-5">
            <SectionTitle>🍩 Composição do Estoque por Tipo (R$)</SectionTitle>
            {!data.composicaoEstoque?.length
              ? <p className="text-slate-400 text-sm py-8 text-center">Sem valor em estoque.</p>
              : <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.composicaoEstoque} dataKey="valor" nameKey="tipo"
                        cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                        labelLine={false} label={donutLabel}
                      >
                        {data.composicaoEstoque.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => [fmtMoeda(v), 'Valor']} />
                      <Legend wrapperStyle={{ fontSize:11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-col gap-1">
                    {data.composicaoEstoque.map((c, i) => (
                      <div key={c.tipo} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          {c.tipo}
                        </span>
                        <span className="font-semibold text-slate-600">{fmtMoeda(c.valor)}</span>
                      </div>
                    ))}
                  </div>
                </>
            }
          </div>
        </div>

        {/* ── Tabela: Estoque Parado / Obsoleto ────────────────────────────── */}
        <div className="card p-5">
          <SectionTitle color="#7c3aed">📦 Estoque Parado / Obsoleto (sem saída há ≥ 90 dias)</SectionTitle>
          {!data.parado?.length
            ? (
              <div className="flex items-center gap-2 py-4 text-emerald-600 text-sm">
                <span className="text-lg">✅</span> Nenhum item parado. Estoque saudável!
              </div>
            )
            : (
              <Table cols={['Produto','Tipo','Em Estoque','Valor Paralisado (R$)','Última Saída','Dias Parado']}>
                {data.parado.map(it => (
                  <tr key={it.id} className="trow">
                    <td className="td font-medium">{it.nome}</td>
                    <td className="td">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{it.tipo}</span>
                    </td>
                    <td className="td text-center font-bold">{Math.round(it.saldo)} {it.unidade}</td>
                    <td className="td text-center font-semibold text-purple-600">{fmtMoeda(it.valorParado)}</td>
                    <td className="td text-center text-slate-500">{it.ultimaSaida ? fmtDate(it.ultimaSaida) : 'Nunca'}</td>
                    <td className="td text-center">
                      <span className={`font-bold px-2 py-0.5 rounded-full text-xs
                        ${it.diasParado >= 180 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {it.diasParado === 9999 ? 'Nunca saiu' : `${it.diasParado}d`}
                      </span>
                    </td>
                  </tr>
                ))}
              </Table>
            )
          }
        </div>

        {/* ── Tabela: Últimas Movimentações (Auditoria) ────────────────────── */}
        <div className="card p-5">
          <SectionTitle>🕐 Últimas Movimentações — Log de Auditoria</SectionTitle>
          <Table cols={['Hora','Tipo','Produto','Quantidade','Solicitante / Fornecedor']}>
            {!data.movs?.length
              ? <Empty />
              : data.movs.map((m, i) => (
                  <tr key={i} className="trow">
                    <td className="td font-mono text-xs text-slate-500 whitespace-nowrap">
                      {fmtDate(m.criado_em || m.data)}{fmtHora(m.criado_em) !== '—' ? ` ${fmtHora(m.criado_em)}` : ''}
                    </td>
                    <td className="td">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                        ${m.tipo==='Entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {m.tipo==='Entrada' ? '📥' : '📤'} {m.tipo}
                      </span>
                    </td>
                    <td className="td font-medium">{m.item_nome}</td>
                    <td className="td text-center font-bold text-slate-700">{Math.round(m.qtd)}</td>
                    <td className="td text-slate-500">{m.solicitante}</td>
                  </tr>
                ))
            }
          </Table>
        </div>

      </>}
    </div>
  )
}