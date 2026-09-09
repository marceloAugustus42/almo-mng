/**
 * SEED — Popula o banco com dados realistas para todos os testes.
 * Execute: node tests/seed.js
 */
require('dotenv').config()
const db = require('../src/db/connection')

const DESTINOS = [
  'CRAS Centro','CRAS Vila','CRAS Triângulo','CRAS Habbitat',
  'Sede','CREAS','Asilo','Conselho Tutelar','Casa dos Conselhos'
]

const ITENS = [
  { nome:'Água Sanitária',        tipo:'Limpeza',    unidade:'Litro',   vlr_unit:4.50 },
  { nome:'Desinfetante',          tipo:'Limpeza',    unidade:'Litro',   vlr_unit:6.00 },
  { nome:'Papel Toalha',          tipo:'Higiene',    unidade:'Pacote',  vlr_unit:12.00 },
  { nome:'Sabão em Pó',           tipo:'Limpeza',    unidade:'Kg',      vlr_unit:8.90 },
  { nome:'Papel A4',              tipo:'Escritório', unidade:'Resma',   vlr_unit:28.00 },
  { nome:'Caneta Esferográfica',  tipo:'Escritório', unidade:'Unidade', vlr_unit:2.50 },
  { nome:'Sabonete Líquido',      tipo:'Higiene',    unidade:'Frasco',  vlr_unit:9.80 },
  { nome:'Vassoura',              tipo:'Limpeza',    unidade:'Unidade', vlr_unit:18.00 },
  { nome:'Álcool 70%',            tipo:'Higiene',    unidade:'Litro',   vlr_unit:11.00 },
  { nome:'Esponja de Aço',        tipo:'Limpeza',    unidade:'Pacote',  vlr_unit:3.50 },
  { nome:'Pano de Chão',          tipo:'Limpeza',    unidade:'Unidade', vlr_unit:7.00 },
  { nome:'Detergente',            tipo:'Limpeza',    unidade:'Frasco',  vlr_unit:3.20 },
  { nome:'Luva de Borracha',      tipo:'Higiene',    unidade:'Par',     vlr_unit:8.00 },
  { nome:'Saco de Lixo 100L',     tipo:'Limpeza',    unidade:'Pacote',  vlr_unit:22.00 },
  { nome:'Clipe de Metal',        tipo:'Escritório', unidade:'Caixa',   vlr_unit:5.00 },
]

// Gera data ISO no mês/ano dado
const d = (ano, mes, dia) => `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`

async function run() {
  console.log('🌱 Iniciando seed...')

  // Limpa na ordem certa (FK)
  await db.query('SET FOREIGN_KEY_CHECKS=0')
  await db.query('TRUNCATE TABLE saidas')
  await db.query('TRUNCATE TABLE entradas')
  await db.query('TRUNCATE TABLE itens')
  await db.query('SET FOREIGN_KEY_CHECKS=1')

  // ── Itens ─────────────────────────────────────────────────────────────────
  console.log('  → Inserindo itens...')
  const itemIds = {}
  for (const it of ITENS) {
    const [r] = await db.query(
      'INSERT INTO itens (nome,tipo,unidade,vlr_unit) VALUES (?,?,?,?)',
      [it.nome, it.tipo, it.unidade, it.vlr_unit]
    )
    itemIds[it.nome] = r.insertId
  }

  // ── Entradas (10 pedidos em datas variadas) ───────────────────────────────
  // Teste de filtro por período: entradas em jan, mar, mai, jul, ago, set/2026
  console.log('  → Inserindo entradas...')
  const entradas = [
    // Pedido 1 — Jan
    { nome:'Água Sanitária',       data:d(2026,1,5),  nf:'NF-001', forn:'Distribuidora ABC', qtd:200, vlr:4.50, resp:'Maria' },
    { nome:'Desinfetante',         data:d(2026,1,5),  nf:'NF-001', forn:'Distribuidora ABC', qtd:100, vlr:6.00, resp:'Maria' },
    { nome:'Sabão em Pó',          data:d(2026,1,5),  nf:'NF-001', forn:'Distribuidora ABC', qtd:50,  vlr:8.90, resp:'Maria' },
    // Pedido 2 — Mar
    { nome:'Papel Toalha',         data:d(2026,3,10), nf:'NF-002', forn:'Papel & Cia',       qtd:120, vlr:12.00,resp:'João'  },
    { nome:'Papel A4',             data:d(2026,3,10), nf:'NF-002', forn:'Papel & Cia',       qtd:60,  vlr:28.00,resp:'João'  },
    { nome:'Caneta Esferográfica', data:d(2026,3,10), nf:'NF-002', forn:'Papel & Cia',       qtd:200, vlr:2.50, resp:'João'  },
    // Pedido 3 — Mai
    { nome:'Sabonete Líquido',     data:d(2026,5,15), nf:'NF-003', forn:'Higiene Total',     qtd:80,  vlr:9.80, resp:'Maria' },
    { nome:'Álcool 70%',           data:d(2026,5,15), nf:'NF-003', forn:'Higiene Total',     qtd:60,  vlr:11.00,resp:'Maria' },
    { nome:'Luva de Borracha',     data:d(2026,5,15), nf:'NF-003', forn:'Higiene Total',     qtd:40,  vlr:8.00, resp:'Maria' },
    // Pedido 4 — Jul
    { nome:'Vassoura',             data:d(2026,7,3),  nf:'NF-004', forn:'Materiais Casa',    qtd:30,  vlr:18.00,resp:'João'  },
    { nome:'Pano de Chão',         data:d(2026,7,3),  nf:'NF-004', forn:'Materiais Casa',    qtd:50,  vlr:7.00, resp:'João'  },
    { nome:'Esponja de Aço',       data:d(2026,7,3),  nf:'NF-004', forn:'Materiais Casa',    qtd:80,  vlr:3.50, resp:'João'  },
    // Pedido 5 — Ago
    { nome:'Água Sanitária',       data:d(2026,8,1),  nf:'NF-005', forn:'Distribuidora ABC', qtd:150, vlr:4.50, resp:'Maria' },
    { nome:'Desinfetante',         data:d(2026,8,1),  nf:'NF-005', forn:'Distribuidora ABC', qtd:80,  vlr:6.00, resp:'Maria' },
    { nome:'Detergente',           data:d(2026,8,1),  nf:'NF-005', forn:'Distribuidora ABC', qtd:100, vlr:3.20, resp:'Maria' },
    // Pedido 6 — Ago
    { nome:'Saco de Lixo 100L',    data:d(2026,8,12), nf:'NF-006', forn:'Embalagens Sul',    qtd:60,  vlr:22.00,resp:'João'  },
    { nome:'Clipe de Metal',       data:d(2026,8,12), nf:'NF-006', forn:'Embalagens Sul',    qtd:30,  vlr:5.00, resp:'João'  },
    // Pedido 7 — Set
    { nome:'Papel A4',             data:d(2026,9,1),  nf:'NF-007', forn:'Papel & Cia',       qtd:40,  vlr:28.00,resp:'Maria' },
    { nome:'Caneta Esferográfica', data:d(2026,9,1),  nf:'NF-007', forn:'Papel & Cia',       qtd:100, vlr:2.50, resp:'Maria' },
    // Pedido 8 — Set
    { nome:'Álcool 70%',           data:d(2026,9,3),  nf:'NF-008', forn:'Higiene Total',     qtd:50,  vlr:11.00,resp:'João'  },
    { nome:'Sabonete Líquido',     data:d(2026,9,3),  nf:'NF-008', forn:'Higiene Total',     qtd:40,  vlr:9.80, resp:'João'  },
    // Pedido 9 — Set
    { nome:'Água Sanitária',       data:d(2026,9,5),  nf:'NF-009', forn:'Distribuidora ABC', qtd:100, vlr:4.50, resp:'Maria' },
    { nome:'Desinfetante',         data:d(2026,9,5),  nf:'NF-009', forn:'Distribuidora ABC', qtd:60,  vlr:6.00, resp:'Maria' },
    // Pedido 10 — Set
    { nome:'Vassoura',             data:d(2026,9,6),  nf:'NF-010', forn:'Materiais Casa',    qtd:20,  vlr:18.00,resp:'João'  },
    { nome:'Pano de Chão',         data:d(2026,9,6),  nf:'NF-010', forn:'Materiais Casa',    qtd:30,  vlr:7.00, resp:'João'  },
    { nome:'Saco de Lixo 100L',    data:d(2026,9,6),  nf:'NF-010', forn:'Materiais Casa',    qtd:20,  vlr:22.00,resp:'João'  },
  ]

  for (const e of entradas) {
    await db.query(
      'INSERT INTO entradas (item_id,data,nf,fornecedor,quantidade,vlr_unit,responsavel) VALUES (?,?,?,?,?,?,?)',
      [itemIds[e.nome], e.data, e.nf, e.forn, e.qtd, e.vlr, e.resp]
    )
  }

  // ── Saídas (≥5 por destino, dados inteligentes para somatório) ────────────
  console.log('  → Inserindo saídas...')
  let pedNum = 1
  const ped = () => `PED-2026${String(pedNum++).padStart(4,'0')}`

  // Saídas distribuídas por destino com itens que fazem sentido no somatório
  const saidas = [
    // CRAS Centro — 6 saídas
    { nome:'Água Sanitária',       dest:'CRAS Centro',      data:d(2026,8,3),  pedido:ped(), qtd:10, solic:'Ana',    resp:'Maria' },
    { nome:'Desinfetante',         dest:'CRAS Centro',      data:d(2026,8,3),  pedido:ped(), qtd:5,  solic:'Ana',    resp:'Maria' },
    { nome:'Papel Toalha',         dest:'CRAS Centro',      data:d(2026,8,10), pedido:ped(), qtd:8,  solic:'Ana',    resp:'João'  },
    { nome:'Sabonete Líquido',     dest:'CRAS Centro',      data:d(2026,9,2),  pedido:ped(), qtd:10, solic:'Ana',    resp:'Maria' },
    { nome:'Água Sanitária',       dest:'CRAS Centro',      data:d(2026,9,4),  pedido:ped(), qtd:15, solic:'Ana',    resp:'Maria' },
    { nome:'Álcool 70%',           dest:'CRAS Centro',      data:d(2026,9,4),  pedido:ped(), qtd:8,  solic:'Ana',    resp:'Maria' },
    // CRAS Vila — 6 saídas
    { nome:'Água Sanitária',       dest:'CRAS Vila',        data:d(2026,8,4),  pedido:ped(), qtd:8,  solic:'Pedro',  resp:'João'  },
    { nome:'Sabão em Pó',          dest:'CRAS Vila',        data:d(2026,8,4),  pedido:ped(), qtd:5,  solic:'Pedro',  resp:'João'  },
    { nome:'Papel Toalha',         dest:'CRAS Vila',        data:d(2026,8,18), pedido:ped(), qtd:10, solic:'Pedro',  resp:'Maria' },
    { nome:'Desinfetante',         dest:'CRAS Vila',        data:d(2026,9,2),  pedido:ped(), qtd:6,  solic:'Pedro',  resp:'João'  },
    { nome:'Álcool 70%',           dest:'CRAS Vila',        data:d(2026,9,3),  pedido:ped(), qtd:5,  solic:'Pedro',  resp:'João'  },
    { nome:'Sabonete Líquido',     dest:'CRAS Vila',        data:d(2026,9,3),  pedido:ped(), qtd:8,  solic:'Pedro',  resp:'João'  },
    // CRAS Triângulo — 5 saídas
    { nome:'Água Sanitária',       dest:'CRAS Triângulo',   data:d(2026,8,6),  pedido:ped(), qtd:12, solic:'Rita',   resp:'Maria' },
    { nome:'Papel A4',             dest:'CRAS Triângulo',   data:d(2026,8,6),  pedido:ped(), qtd:5,  solic:'Rita',   resp:'Maria' },
    { nome:'Detergente',           dest:'CRAS Triângulo',   data:d(2026,8,20), pedido:ped(), qtd:10, solic:'Rita',   resp:'João'  },
    { nome:'Pano de Chão',         dest:'CRAS Triângulo',   data:d(2026,9,3),  pedido:ped(), qtd:5,  solic:'Rita',   resp:'João'  },
    { nome:'Água Sanitária',       dest:'CRAS Triângulo',   data:d(2026,9,5),  pedido:ped(), qtd:10, solic:'Rita',   resp:'Maria' },
    // CRAS Habbitat — 5 saídas
    { nome:'Água Sanitária',       dest:'CRAS Habbitat',    data:d(2026,8,8),  pedido:ped(), qtd:10, solic:'Sônia',  resp:'João'  },
    { nome:'Papel Toalha',         dest:'CRAS Habbitat',    data:d(2026,8,8),  pedido:ped(), qtd:10, solic:'Sônia',  resp:'João'  },
    { nome:'Sabonete Líquido',     dest:'CRAS Habbitat',    data:d(2026,8,22), pedido:ped(), qtd:6,  solic:'Sônia',  resp:'Maria' },
    { nome:'Álcool 70%',           dest:'CRAS Habbitat',    data:d(2026,9,2),  pedido:ped(), qtd:8,  solic:'Sônia',  resp:'Maria' },
    { nome:'Desinfetante',         dest:'CRAS Habbitat',    data:d(2026,9,4),  pedido:ped(), qtd:5,  solic:'Sônia',  resp:'João'  },
    // Sede — 6 saídas
    { nome:'Papel A4',             dest:'Sede',             data:d(2026,8,7),  pedido:ped(), qtd:10, solic:'Carla',  resp:'João'  },
    { nome:'Caneta Esferográfica', dest:'Sede',             data:d(2026,8,7),  pedido:ped(), qtd:20, solic:'Carla',  resp:'João'  },
    { nome:'Clipe de Metal',       dest:'Sede',             data:d(2026,8,15), pedido:ped(), qtd:5,  solic:'Carla',  resp:'Maria' },
    { nome:'Água Sanitária',       dest:'Sede',             data:d(2026,9,1),  pedido:ped(), qtd:15, solic:'Carla',  resp:'Maria' },
    { nome:'Papel A4',             dest:'Sede',             data:d(2026,9,5),  pedido:ped(), qtd:8,  solic:'Carla',  resp:'João'  },
    { nome:'Detergente',           dest:'Sede',             data:d(2026,9,5),  pedido:ped(), qtd:10, solic:'Carla',  resp:'João'  },
    // CREAS — 5 saídas
    { nome:'Papel A4',             dest:'CREAS',            data:d(2026,8,9),  pedido:ped(), qtd:5,  solic:'Marcos', resp:'Maria' },
    { nome:'Sabonete Líquido',     dest:'CREAS',            data:d(2026,8,9),  pedido:ped(), qtd:8,  solic:'Marcos', resp:'Maria' },
    { nome:'Água Sanitária',       dest:'CREAS',            data:d(2026,8,25), pedido:ped(), qtd:10, solic:'Marcos', resp:'João'  },
    { nome:'Álcool 70%',           dest:'CREAS',            data:d(2026,9,3),  pedido:ped(), qtd:10, solic:'Marcos', resp:'João'  },
    { nome:'Desinfetante',         dest:'CREAS',            data:d(2026,9,4),  pedido:ped(), qtd:8,  solic:'Marcos', resp:'Maria' },
    // Asilo — 6 saídas
    { nome:'Sabonete Líquido',     dest:'Asilo',            data:d(2026,8,12), pedido:ped(), qtd:10, solic:'Lúcia',  resp:'Maria' },
    { nome:'Álcool 70%',           dest:'Asilo',            data:d(2026,8,12), pedido:ped(), qtd:10, solic:'Lúcia',  resp:'Maria' },
    { nome:'Papel Toalha',         dest:'Asilo',            data:d(2026,8,26), pedido:ped(), qtd:12, solic:'Lúcia',  resp:'João'  },
    { nome:'Água Sanitária',       dest:'Asilo',            data:d(2026,9,2),  pedido:ped(), qtd:15, solic:'Lúcia',  resp:'João'  },
    { nome:'Luva de Borracha',     dest:'Asilo',            data:d(2026,9,4),  pedido:ped(), qtd:10, solic:'Lúcia',  resp:'Maria' },
    { nome:'Detergente',           dest:'Asilo',            data:d(2026,9,5),  pedido:ped(), qtd:8,  solic:'Lúcia',  resp:'Maria' },
    // Conselho Tutelar — 5 saídas
    { nome:'Álcool 70%',           dest:'Conselho Tutelar', data:d(2026,8,15), pedido:ped(), qtd:8,  solic:'Fábio',  resp:'João'  },
    { nome:'Caneta Esferográfica', dest:'Conselho Tutelar', data:d(2026,8,15), pedido:ped(), qtd:15, solic:'Fábio',  resp:'João'  },
    { nome:'Papel A4',             dest:'Conselho Tutelar', data:d(2026,8,28), pedido:ped(), qtd:5,  solic:'Fábio',  resp:'Maria' },
    { nome:'Sabonete Líquido',     dest:'Conselho Tutelar', data:d(2026,9,2),  pedido:ped(), qtd:6,  solic:'Fábio',  resp:'Maria' },
    { nome:'Água Sanitária',       dest:'Conselho Tutelar', data:d(2026,9,4),  pedido:ped(), qtd:8,  solic:'Fábio',  resp:'João'  },
    // Casa dos Conselhos — 5 saídas
    { nome:'Desinfetante',         dest:'Casa dos Conselhos',data:d(2026,8,20),pedido:ped(), qtd:8,  solic:'Dário',  resp:'Maria' },
    { nome:'Água Sanitária',       dest:'Casa dos Conselhos',data:d(2026,8,20),pedido:ped(), qtd:10, solic:'Dário',  resp:'Maria' },
    { nome:'Papel Toalha',         dest:'Casa dos Conselhos',data:d(2026,9,1), pedido:ped(), qtd:8,  solic:'Dário',  resp:'João'  },
    { nome:'Caneta Esferográfica', dest:'Casa dos Conselhos',data:d(2026,9,3), pedido:ped(), qtd:20, solic:'Dário',  resp:'João'  },
    { nome:'Álcool 70%',           dest:'Casa dos Conselhos',data:d(2026,9,5), pedido:ped(), qtd:6,  solic:'Dário',  resp:'Maria' },
  ]

  for (const s of saidas) {
    await db.query(
      'INSERT INTO saidas (item_id,data,pedido,destino,quantidade,solicitante,responsavel) VALUES (?,?,?,?,?,?,?)',
      [itemIds[s.nome], s.data, s.pedido, s.dest, s.qtd, s.solic, s.resp]
    )
  }

  console.log(`✅ Seed concluído!`)
  console.log(`   ${ITENS.length} itens | ${entradas.length} linhas de entrada | ${saidas.length} saídas`)
  await db.end()
}

run().catch(e => { console.error('❌ Erro no seed:', e.message); process.exit(1) })
