import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle, MapPin, BarChart2 } from 'lucide-react'

const links = [
  { to:'/',           label:'Dashboard',   icon: LayoutDashboard },
  { to:'/estoque',    label:'Estoque',     icon: Package },
  { to:'/entradas',   label:'Entradas',    icon: ArrowDownCircle },
  { to:'/saidas',     label:'Saídas',      icon: ArrowUpCircle },
  { to:'/destinos',   label:'Por Destino', icon: MapPin },
  { to:'/relatorios', label:'Relatórios',  icon: BarChart2 },
]

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-52 shrink-0 min-h-screen"
      style={{ background: 'linear-gradient(180deg, #054d47 0%, #07635b 100%)' }}>

      {/* Logo SUAS */}
      <div className="flex flex-col items-center px-4 pt-5 pb-3 border-b border-white/10">
        <img
          src="/logo-suas.jpeg"
          alt="Logo SUAS"
          className="w-20 h-20 object-contain rounded-full mb-3"
          style={{ background: 'white', padding: '4px' }}
        />
        <div className="text-center">
          <p className="text-white font-bold text-sm leading-tight">Almoxarifado</p>
          <p className="text-[#dbf1ef] text-xs opacity-80">Controle de Estoque</p>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
               ${isActive
                 ? 'bg-white/20 text-white shadow-md border border-white/20'
                 : 'text-[#dbf1ef] hover:bg-white/10 hover:text-white'}`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[#dbf1ef] text-xs opacity-60">v1.0 — Uso local</p>
        <p className="text-[#dbf1ef] text-xs opacity-40 mt-0.5">SUAS</p>
      </div>
    </aside>
  )
}
