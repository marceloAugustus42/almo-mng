import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { ToastContainer } from './components/UI'
import Dashboard  from './pages/Dashboard'
import Estoque    from './pages/Estoque'
import Entradas   from './pages/Entradas'
import Saidas     from './pages/Saidas'
import Destinos   from './pages/Destinos'
import Relatorios from './pages/Relatorios'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/estoque"    element={<Estoque />} />
            <Route path="/entradas"   element={<Entradas />} />
            <Route path="/saidas"     element={<Saidas />} />
            <Route path="/destinos"   element={<Destinos />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </BrowserRouter>
  )
}
