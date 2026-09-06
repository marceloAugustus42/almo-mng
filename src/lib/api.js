// API wrapper — aponta para backend Express em localhost:3001
// Em desenvolvimento sem backend, usa dados mock automaticamente

const BASE = null // sem backend

async function req(method, path, body) {
  // Sem backend configurado: usa LocalStorage diretamente
  return mockFallback(method, path, body)
}

export const api = {
  get:    (path)        => req('GET',    path),
  post:   (path, body)  => req('POST',   path, body),
  put:    (path, body)  => req('PUT',    path, body),
  delete: (path)        => req('DELETE', path),
}

// ── Mock local (localStorage) ──────────────────────────────────────────────
const DESTINOS = ['CRAS Centro','CRAS Vila','CRAS Triângulo','CRAS Habbitat',
                  'Sede','CREAS','Asilo','Conselho Tutelar','Casa dos Conselhos']

function getDB() {
  const raw = localStorage.getItem('almoxa_db')
  if (raw) return JSON.parse(raw)
  // Seed inicial
  const db = {
    itens: [
      { id:1, nome:'Água Sanitária',   tipo:'Limpeza',    unidade:'Litro',   vlr_unit:4.50,  ativo:1 },
      { id:2, nome:'Desinfetante',     tipo:'Limpeza',    unidade:'Litro',   vlr_unit:6.00,  ativo:1 },
      { id:3, nome:'Papel Toalha',     tipo:'Higiene',    unidade:'Pacote',  vlr_unit:12.00, ativo:1 },
      { id:4, nome:'Sabão em Pó',      tipo:'Limpeza',    unidade:'Kg',      vlr_unit:8.90,  ativo:1 },
      { id:5, nome:'Papel A4',         tipo:'Escritório', unidade:'Resma',   vlr_unit:28.00, ativo:1 },
      { id:6, nome:'Caneta Esferográfica', tipo:'Escritório', unidade:'Unidade', vlr_unit:2.50, ativo:1 },
      { id:7, nome:'Sabonete Líquido', tipo:'Higiene',    unidade:'Frasco',  vlr_unit:9.80,  ativo:1 },
      { id:8, nome:'Vassoura',         tipo:'Limpeza',    unidade:'Unidade', vlr_unit:18.00, ativo:1 },
      { id:9, nome:'Álcool 70%',       tipo:'Higiene',    unidade:'Litro',   vlr_unit:11.00, ativo:1 },
      { id:10,nome:'Esponja de Aço',   tipo:'Limpeza',    unidade:'Pacote',  vlr_unit:3.50,  ativo:1 },
    ],
    entradas: [
      { id:1, item_id:1, data:'2026-08-01', nf:'NF-001', fornecedor:'Distribuidora ABC', quantidade:100, vlr_unit:4.50, responsavel:'Maria', obs:'' },
      { id:2, item_id:2, data:'2026-08-01', nf:'NF-001', fornecedor:'Distribuidora ABC', quantidade:60,  vlr_unit:6.00, responsavel:'Maria', obs:'' },
      { id:3, item_id:3, data:'2026-08-05', nf:'NF-002', fornecedor:'Papel & Cia',       quantidade:80,  vlr_unit:12.00,responsavel:'João',  obs:'' },
      { id:4, item_id:5, data:'2026-08-05', nf:'NF-002', fornecedor:'Papel & Cia',       quantidade:30,  vlr_unit:28.00,responsavel:'João',  obs:'' },
      { id:5, item_id:7, data:'2026-08-10', nf:'NF-003', fornecedor:'Higiene Total',     quantidade:50,  vlr_unit:9.80, responsavel:'Maria', obs:'' },
      { id:6, item_id:9, data:'2026-08-10', nf:'NF-003', fornecedor:'Higiene Total',     quantidade:40,  vlr_unit:11.00,responsavel:'Maria', obs:'' },
      { id:7, item_id:4, data:'2026-09-02', nf:'NF-004', fornecedor:'Distribuidora ABC', quantidade:25,  vlr_unit:8.90, responsavel:'João',  obs:'' },
      { id:8, item_id:6, data:'2026-09-02', nf:'NF-004', fornecedor:'Distribuidora ABC', quantidade:100, vlr_unit:2.50, responsavel:'João',  obs:'' },
    ],
    saidas: [
      { id:1,  item_id:1, data:'2026-08-03', pedido:'PED-001', destino:'CRAS Centro',       quantidade:10, solicitante:'Ana',    responsavel:'Maria', obs:'' },
      { id:2,  item_id:2, data:'2026-08-03', pedido:'PED-001', destino:'CRAS Centro',       quantidade:5,  solicitante:'Ana',    responsavel:'Maria', obs:'' },
      { id:3,  item_id:3, data:'2026-08-04', pedido:'PED-002', destino:'CRAS Vila',         quantidade:8,  solicitante:'Pedro',  responsavel:'João',  obs:'' },
      { id:4,  item_id:1, data:'2026-08-06', pedido:'PED-003', destino:'Sede',              quantidade:15, solicitante:'Carla',  responsavel:'Maria', obs:'' },
      { id:5,  item_id:5, data:'2026-08-07', pedido:'PED-004', destino:'CREAS',             quantidade:5,  solicitante:'Marcos', responsavel:'João',  obs:'' },
      { id:6,  item_id:7, data:'2026-08-12', pedido:'PED-005', destino:'Asilo',             quantidade:10, solicitante:'Lúcia',  responsavel:'Maria', obs:'' },
      { id:7,  item_id:9, data:'2026-08-15', pedido:'PED-006', destino:'Conselho Tutelar',  quantidade:8,  solicitante:'Fábio',  responsavel:'João',  obs:'' },
      { id:8,  item_id:1, data:'2026-08-20', pedido:'PED-007', destino:'CRAS Triângulo',    quantidade:12, solicitante:'Rita',   responsavel:'Maria', obs:'' },
      { id:9,  item_id:3, data:'2026-08-22', pedido:'PED-008', destino:'CRAS Habbitat',     quantidade:10, solicitante:'Sônia',  responsavel:'João',  obs:'' },
      { id:10, item_id:2, data:'2026-08-25', pedido:'PED-009', destino:'Casa dos Conselhos',quantidade:8,  solicitante:'Dário',  responsavel:'Maria', obs:'' },
      { id:11, item_id:6, data:'2026-09-01', pedido:'PED-010', destino:'Sede',              quantidade:20, solicitante:'Carla',  responsavel:'João',  obs:'' },
      { id:12, item_id:4, data:'2026-09-03', pedido:'PED-011', destino:'CRAS Centro',       quantidade:5,  solicitante:'Ana',    responsavel:'Maria', obs:'' },
      { id:13, item_id:9, data:'2026-09-04', pedido:'PED-012', destino:'Asilo',             quantidade:10, solicitante:'Lúcia',  responsavel:'João',  obs:'' },
      { id:14, item_id:3, data:'2026-09-05', pedido:'PED-013', destino:'CREAS',             quantidade:8,  solicitante:'Marcos', responsavel:'Maria', obs:'' },
    ],
    nextId: { itens:11, entradas:9, saidas:15 }
  }
  saveDB(db); return db
}

function saveDB(db) { localStorage.setItem('almoxa_db', JSON.stringify(db)) }

function calcSaldos(db) {
  return db.itens.filter(i => i.ativo).map(item => {
    const ent = db.entradas.filter(e => e.item_id === item.id).reduce((s,e) => s+e.quantidade, 0)
    const sai = db.saidas.filter(s => s.item_id === item.id).reduce((s,e) => s+e.quantidade, 0)
    return { ...item, total_entradas: ent, total_saidas: sai, saldo: ent - sai }
  })
}

function mockFallback(method, path, body) {
  const db = getDB()
  const [,, resource, idStr] = path.split('/')
  const id = idStr ? parseInt(idStr) : null
  const qIdx = path.indexOf('?')
  const qs = qIdx >= 0 ? new URLSearchParams(path.slice(qIdx+1)) : new URLSearchParams()

  // ── itens ──
  if (resource === 'itens') {
    if (method === 'GET' && !id) {
      const saldos = calcSaldos(db)
      return Promise.resolve(saldos)
    }
    if (method === 'POST') {
      const novo = { ...body, id: db.nextId.itens++, ativo:1 }
      db.itens.push(novo); saveDB(db)
      return Promise.resolve(novo)
    }
    if (method === 'PUT') {
      const i = db.itens.findIndex(x => x.id === id)
      if (i>=0) { db.itens[i] = { ...db.itens[i], ...body }; saveDB(db) }
      return Promise.resolve(db.itens[i])
    }
    if (method === 'DELETE') {
      const i = db.itens.findIndex(x => x.id === id)
      if (i>=0) { db.itens[i].ativo = 0; saveDB(db) }
      return Promise.resolve({ ok:true })
    }
  }

  // ── entradas ──
  if (resource === 'entradas') {
    if (method === 'GET') {
      let list = [...db.entradas].sort((a,b) => b.data.localeCompare(a.data))
      if (qs.get('de'))   list = list.filter(e => e.data >= qs.get('de'))
      if (qs.get('ate'))  list = list.filter(e => e.data <= qs.get('ate'))
      if (qs.get('item')) list = list.filter(e => e.item_id === parseInt(qs.get('item')))
      return Promise.resolve(list.map(e => ({
        ...e,
        item_nome: db.itens.find(i => i.id===e.item_id)?.nome || '',
        vlr_total: e.quantidade * (e.vlr_unit||0)
      })))
    }
    if (method === 'POST') {
      const novo = { ...body, id: db.nextId.entradas++ }
      db.entradas.push(novo); saveDB(db)
      return Promise.resolve(novo)
    }
    if (method === 'DELETE') {
      db.entradas = db.entradas.filter(e => e.id !== id); saveDB(db)
      return Promise.resolve({ ok:true })
    }
  }

  // ── saidas ──
  if (resource === 'saidas') {
    if (method === 'GET') {
      let list = [...db.saidas].sort((a,b) => b.data.localeCompare(a.data))
      if (qs.get('de'))      list = list.filter(s => s.data >= qs.get('de'))
      if (qs.get('ate'))     list = list.filter(s => s.data <= qs.get('ate'))
      if (qs.get('destino')) list = list.filter(s => s.destino === qs.get('destino'))
      if (qs.get('item'))    list = list.filter(s => s.item_id === parseInt(qs.get('item')))
      return Promise.resolve(list.map(s => ({
        ...s,
        item_nome: db.itens.find(i => i.id===s.item_id)?.nome || '',
        item_unidade: db.itens.find(i => i.id===s.item_id)?.unidade || '',
      })))
    }
    if (method === 'POST') {
      const novo = { ...body, id: db.nextId.saidas++ }
      db.saidas.push(novo); saveDB(db)
      return Promise.resolve(novo)
    }
    if (method === 'DELETE') {
      db.saidas = db.saidas.filter(s => s.id !== id); saveDB(db)
      return Promise.resolve({ ok:true })
    }
  }

  // ── dashboard ──
  if (resource === 'dashboard') {
    const mes = qs.get('mes') || String(new Date().getMonth()+1).padStart(2,'0')
    const ano = qs.get('ano') || String(new Date().getFullYear())
    const prefix = `${ano}-${mes}`
    const saldos = calcSaldos(db)
    const sMes = db.saidas.filter(s => s.data.startsWith(prefix))
    const eMes = db.entradas.filter(e => e.data.startsWith(prefix))

    // Top 10 itens saídas no mês
    const topMap = {}
    sMes.forEach(s => { topMap[s.item_id] = (topMap[s.item_id]||0)+s.quantidade })
    const top10 = Object.entries(topMap)
      .sort((a,b)=>b[1]-a[1]).slice(0,10)
      .map(([id,qtd]) => ({ nome: db.itens.find(i=>i.id===parseInt(id))?.nome||'', qtd }))

    // Por destino no mês
    const destMap = {}
    sMes.forEach(s => { destMap[s.destino] = (destMap[s.destino]||0)+s.quantidade })
    const porDestino = Object.entries(destMap).map(([dest,qtd]) => ({ dest, qtd }))

    // Últimas 10 movimentações
    const movs = [
      ...db.entradas.map(e => ({ tipo:'Entrada', data:e.data, item_id:e.item_id, qtd:e.quantidade, extra:e.fornecedor||'' })),
      ...db.saidas.map(s => ({ tipo:'Saída', data:s.data, item_id:s.item_id, qtd:s.quantidade, extra:s.destino||'' }))
    ].sort((a,b) => b.data.localeCompare(a.data)).slice(0,10)
      .map(m => ({ ...m, item_nome: db.itens.find(i=>i.id===m.item_id)?.nome||'' }))

    return Promise.resolve({
      kpis: {
        total_itens: saldos.length,
        total_entradas_qtd: db.entradas.filter(e=>e.data.startsWith(prefix)).reduce((s,e)=>s+e.quantidade,0),
        total_saidas_qtd:   sMes.reduce((s,e)=>s+e.quantidade,0),
        criticos: saldos.filter(s=>s.saldo>0&&s.saldo<=5).length,
        zerados:  saldos.filter(s=>s.saldo<=0).length,
      },
      alertas: saldos.filter(s=>s.saldo<=5).sort((a,b)=>a.saldo-b.saldo),
      top10,
      porDestino,
      movs,
    })
  }

  return Promise.resolve([])
}

export { DESTINOS }
