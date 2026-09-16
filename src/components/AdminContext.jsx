import { createContext, useContext, useState } from 'react'
import { Modal } from './UI'

const SENHA_ADMIN = 'mikeobrabo'
const AdminContext = createContext(null)

// Hook para usar em qualquer página
export function useAdmin() {
  return useContext(AdminContext)
}

// Modal de senha reutilizável
function SenhaModal({ open, onClose, onSuccess }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro]   = useState(false)

  function confirmar() {
    if (senha === SENHA_ADMIN) { setSenha(''); setErro(false); onSuccess() }
    else { setErro(true); setSenha('') }
  }

  return (
    <Modal open={open} onClose={() => { setSenha(''); setErro(false); onClose() }}
      title="Modo Administrador" width="max-w-xs">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">Digite a senha para acessar funções administrativas.</p>
        <input
          type="password" autoFocus
          className={`input ${erro ? 'border-red-400' : ''}`}
          placeholder="Senha"
          value={senha}
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

// Botão padrão de admin — usado no rodapé de cada página
export function AdminButton() {
  const { ativo, entrar, sair, pedirSenha } = useAdmin()
  return (
    <div className="flex justify-end mt-4">
      {ativo
        ? <button className="btn-danger flex items-center gap-2 text-xs" onClick={sair}>
            🔓 Sair do Modo Admin
          </button>
        : <button className="btn-secondary flex items-center gap-2 text-xs" onClick={pedirSenha}>
            🔐 Modo Administrador
          </button>
      }
    </div>
  )
}

// Provider — envolve o App inteiro
export function AdminProvider({ children }) {
  const [ativo, setAtivo]       = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [callback, setCallback]   = useState(null)

  // Pede senha e executa callback após autenticação (ou simplesmente ativa modo admin)
  function pedirSenha(cb) {
    setCallback(() => cb || null)
    setModalOpen(true)
  }

  function onSuccess() {
    setModalOpen(false)
    setAtivo(true)
    callback?.()
    setCallback(null)
  }

  function sair() { setAtivo(false) }
  function entrar() { pedirSenha() }

  return (
    <AdminContext.Provider value={{ ativo, entrar, sair, pedirSenha }}>
      {children}
      <SenhaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setCallback(null) }}
        onSuccess={onSuccess}
      />
    </AdminContext.Provider>
  )
}
