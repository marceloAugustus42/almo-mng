import { useState, useEffect, useCallback } from 'react'
import { Download, Pencil, Plus, Check, X, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Table, Empty, Spinner, PeriodFilter, Modal, toast } from '../components/UI'
import { exportPorDestino } from '../lib/export'

const fmtDate = d => d ? d.split('-').reverse().join('/') : ''

const DESTINOS_KEY = 'almoxa_destinos'
const SENHA_ADMIN  = 'mikeobrabo'

const hoje = () => new Date().toISOString().slice(0, 10)
const anoAtual = () => new Date().getFullYear()
const periodoInicial = () => ({ de: `${anoAtual()}-01-01`, ate: hoje() })

const DESTINOS_PADRAO = [
  'CRAS Centro','CRAS Vila','CRAS Triângulo','CRAS Habbitat',
  'Sede','CREAS','Asilo','Conselho Tutelar','Casa dos Conselhos'
]

function getDestinos() {
  try {
    const raw = localStorage.getItem(DESTINOS_KEY)
    return raw ? JSON.parse(raw) : DESTINOS_PADRAO
  } catch { return DESTINOS_PADRAO }
}

function saveDestinos(lista) {
  localStorage.setItem(DESTINOS_KEY, JSON.stringify(lista))
}

// Modal de autenticação
function SenhaModal({ open, onClose, onSuccess }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)

  function confirmar() {
    if (senha === SENHA_ADMIN) { setSenha(''); setErro(false); onSuccess() }
    else { setErro(true); setSenha('') }
  }

  return (
    <Modal open={open} onClose={() => { setSenha(''); setErro(false); onClose() }} title="Autenticação" width="max-w-xs">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">Digite a senha para gerenciar destinos.</p>
        <input
          type="password" className={`input ${erro ? 'border-red-400' : ''}`}
          placeholder="Senha" value={senha} autoFocus
          onChange={e => { setSenha(e.target.value); setErro(false) }}
          onKeyDown={e => e.key === 'Enter' && confirmar()}
        />
        {erro && <p className="text-xs text-red-500 -mt-2">Senha incorreta.</p>}
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={() => { setSenha(''); setErro(false); onClose() }}>Cancelar</button>
          <button className="btn-primary" onClick={confirmar}>Confirmar</button>
        </div>
      </div>
    </Modal>
  )
}

export default function Destinos() {
  const [destinos, setDestinos] = useState(getDestinos)
  const [destino, setDestino]   = useState(() => getDestinos()[0] || '')
  const [saidas, setSaidas]     = useState([])
  const [todasSaidas, setTodasSaidas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [periodo, setPeriodo]   = useState(periodoInicial)

  // Estados de edição
  const [senhaModal, setSenhaModal]     = useState(false)
  const [acaoAposSenha, setAcaoAposSenha] = useState(null) // fn a executar após autenticar
  const [editando, setEditando]         = useState(null)   // nome sendo editado
  const [nomeEdit, setNomeEdit]         = useState('')
  const [novoNome, setNovoNome]         = useState('')
  const [criando, setCriando]           = useState(false)

  // Persiste destinos no localStorage sempre que mudam
  useEffect(() => { saveDestinos(destinos) }, [destinos])

  const loadSaidas = useCallback(() => {
    setLoading(true)
    let path = `/saidas?destino=${encodeURIComponent(destino)}`
    if (periodo.de)  path += `&de=${periodo.de}`
    if (periodo.ate) path += `&ate=${periodo.ate}`
    api.get(path).then(setSaidas).finally(() => setLoading(false))
  }, [destino, periodo])

  useEffect(() => { api.get('/saidas').then(setTodasSaidas) }, [])
  useEffect(() => { if (destino) loadSaidas() }, [loadSaidas])

  // Seleciona primeiro destino se o atual foi removido
  useEffect(() => {
    if (!destinos.includes(destino)) setDestino(destinos[0] || '')
  }, [destinos])

  // ── Ações protegidas por senha ──────────────────────────────────────────
  function pedirSenha(acao) {
    setAcaoAposSenha(() => acao)
    setSenhaModal(true)
  }

  function onSenhaOk() {
    setSenhaModal(false)
    acaoAposSenha?.()
    setAcaoAposSenha(null)
  }

  function iniciarEdicao(nome) {
    pedirSenha(() => { setEditando(nome); setNomeEdit(nome) })
  }

  function salvarEdicao() {
    const trimado = nomeEdit.trim()
    if (!trimado || trimado === editando) { setEditando(null); return }
    if (destinos.includes(trimado)) { toast('Já existe um destino com esse nome.', 'error'); return }
    setDestinos(ds => ds.map(d => d === editando ? trimado : d))
    if (destino === editando) setDestino(trimado)
    setEditando(null)
    toast('Destino renomeado.')
  }

  function excluirDestino(nome) {
    if (destinos.length <= 1) { toast('É necessário pelo menos um destino.', 'error'); return }
    setDestinos(ds => ds.filter(d => d !== nome))
    toast('Destino removido.', 'warn')
  }

  function iniciarCriacao() {
    pedirSenha(() => { setCriando(true); setNovoNome('') })
  }

  function salvarNovo() {
    const trimado = novoNome.trim()
    if (!trimado) { setCriando(false); return }
    if (destinos.includes(trimado)) { toast('Já existe um destino com esse nome.', 'error'); return }
    setDestinos(ds => [...ds, trimado])
    setDestino(trimado)
    setCriando(false)
    toast('Destino criado!')
  }

  // ── Exportação ──────────────────────────────────────────────────────────
  function exportarDestino() {
    try { exportPorDestino(saidas, [destino]); toast(`Excel de "${destino}" exportado!`) }
    catch { toast('Erro ao exportar.', 'error') }
  }

  function exportarTodos() {
    try { exportPorDestino(todasSaidas, destinos); toast('Excel com todos os destinos exportado!') }
    catch { toast('Erro ao exportar.', 'error') }
  }

  // ── Resumo ──────────────────────────────────────────────────────────────
  const resumoMap = saidas.reduce((acc, s) => {
    if (!acc[s.item_nome]) acc[s.item_nome] = { nome: s.item_nome, unidade: s.item_unidade || '', total: 0 }
    acc[s.item_nome].total += s.quantidade
    return acc
  }, {})
  const resumoList  = Object.values(resumoMap).sort((a, b) => b.total - a.total)
  const totalGeral  = saidas.reduce((s, e) => s + e.quantidade, 0)

  return (
    <div className="flex min-h-screen">

      {/* Sidebar de destinos */}
      <aside className="w-52 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destinos</p>
          <button title="Novo destino" onClick={iniciarCriacao}
            className="p-1 rounded-lg text-[#07635b] hover:bg-[#dbf1ef] transition-colors">
            <Plus size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          {destinos.map(d => (
            <div key={d}
              className={`group flex items-center border-r-2 transition-colors
                ${destino === d
                  ? 'bg-[#dbf1ef] border-[#07635b]'
                  : 'border-transparent hover:bg-slate-50'}`}>

              {/* Nome ou input de edição */}
              {editando === d ? (
                <div className="flex items-center gap-1 flex-1 px-2 py-1">
                  <input
                    className="input !py-1 !text-xs flex-1"
                    value={nomeEdit} autoFocus
                    onChange={e => setNomeEdit(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' ? salvarEdicao() : e.key === 'Escape' && setEditando(null)}
                  />
                  <button onClick={salvarEdicao} className="text-[#07635b] hover:text-[#054d47]"><Check size={14}/></button>
                  <button onClick={() => excluirDestino(d)} className="text-red-400 hover:text-red-600"><Trash2 size={13}/></button>
                  <button onClick={() => setEditando(null)} className="text-slate-400 hover:text-slate-600"><X size={13}/></button>
                </div>
              ) : (
                <button
                  onClick={() => setDestino(d)}
                  className="flex-1 text-left pl-3 pr-1 py-2.5 text-sm font-medium text-slate-700 truncate">
                  {d}
                </button>
              )}

              {/* Lápis — direita, visível ao hover */}
              {editando !== d && (
                <button
                  title="Editar destino"
                  onClick={() => iniciarEdicao(d)}
                  className="pr-2 pl-1 py-2.5 text-slate-300 group-hover:text-[#5e8e89] transition-colors shrink-0">
                  <Pencil size={13} />
                </button>
              )}
            </div>
          ))}

          {/* Input novo destino */}
          {criando && (
            <div className="flex items-center gap-1 px-2 py-2 border-t border-slate-100">
              <input
                className="input !py-1 !text-xs flex-1" placeholder="Nome do destino"
                value={novoNome} autoFocus
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' ? salvarNovo() : e.key === 'Escape' && setCriando(false)}
              />
              <button onClick={salvarNovo} className="text-[#07635b]"><Check size={14}/></button>
              <button onClick={() => setCriando(false)} className="text-slate-400"><X size={14}/></button>
            </div>
          )}
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col gap-5 p-6 overflow-auto">
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

        <PeriodFilter de={periodo.de} ate={periodo.ate} onChange={setPeriodo} />

        {loading ? <Spinner /> : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Tabela saídas */}
            <div className="xl:col-span-2 flex flex-col gap-2">
              <h2 className="section-title">Saídas Registradas</h2>
              <Table cols={['Data','Pedido','Item','Qtd','Unidade','Solicitante','Responsável']}>
                {saidas.length === 0
                  ? <Empty msg="Nenhuma saída para este destino." />
                  : saidas.map(s => (
                      <tr key={s.id} className="trow">
                        <td className="td whitespace-nowrap">{fmtDate(s.data)}</td>
                        <td className="td text-slate-500 text-xs">{s.pedido || '—'}</td>
                        <td className="td font-medium">{s.item_nome}</td>
                        <td className="td text-center font-bold text-orange-500">{s.quantidade}</td>
                        <td className="td text-slate-500 text-center">{s.item_unidade || '—'}</td>
                        <td className="td text-slate-500">{s.solicitante || '—'}</td>
                        <td className="td text-slate-500">{s.responsavel || '—'}</td>
                      </tr>
                    ))
                }
              </Table>
              {saidas.length > 0 && (
                <p className="text-right text-sm font-semibold text-slate-600">
                  Total: <span className="text-orange-500 font-black text-lg">{Math.round(totalGeral)}</span> itens enviados
                </p>
              )}
            </div>

            {/* Somatório */}
            <div className="flex flex-col gap-3">
              <h2 className="section-title">Somatório por Item</h2>
              <div className="card overflow-hidden">
                {resumoList.length === 0
                  ? <p className="p-6 text-center text-slate-400 text-sm">Sem dados.</p>
                  : (
                    <table className="w-full">
                      <thead className="bg-[#07635b]">
                        <tr>
                          <th className="th">#</th>
                          <th className="th text-left">Item</th>
                          <th className="th">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumoList.map((r, i) => (
                          <tr key={r.nome} className={`trow ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                            <td className="td text-center text-xs text-slate-400">{i + 1}</td>
                            <td className="td">
                              <p className="font-medium text-slate-800">{r.nome}</p>
                              <p className="text-xs text-slate-400">{r.unidade}</p>
                            </td>
                            <td className="td text-center font-black text-[#07635b] text-lg">{Math.round(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={2} className="td font-bold text-right text-slate-600">Total Geral</td>
                          <td className="td text-center font-black text-orange-500 text-lg">{Math.round(totalGeral)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )
                }
              </div>

              {resumoList.length > 0 && (
                <div className="card p-4" style={{ background: 'linear-gradient(135deg,#07635b,#5e8e89)' }}>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wide">{destino}</p>
                  <p className="text-white text-3xl font-black mt-1">{Math.round(totalGeral)}</p>
                  <p className="text-white/70 text-xs mt-0.5">itens enviados no período</p>
                  <p className="text-white/50 text-xs mt-1">{resumoList.length} tipo(s) de item</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de senha */}
      <SenhaModal open={senhaModal} onClose={() => setSenhaModal(false)} onSuccess={onSenhaOk} />
    </div>
  )
}