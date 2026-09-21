require('dotenv').config()
const db = require('../src/db/connection')

const ESTOQUES = ['PATRIMÔNIO','CALAMIDADE','CEGONHA SOCIAL']

const ITENS = [
  // PATRIMÔNIO
  { nome:'Cadeira de Escritório', tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:350.00, estoque:'PATRIMÔNIO' },
  { nome:'Computador Desktop',    tipo:'Equipamento', unidade:'Unidade', vlr_unit:2800.00,estoque:'PATRIMÔNIO' },
  { nome:'Impressora Laser',      tipo:'Equipamento', unidade:'Unidade', vlr_unit:1200.00,estoque:'PATRIMÔNIO' },
  // CALAMIDADE
  { nome:'Colchonete',            tipo:'Higiene',     unidade:'Unidade', vlr_unit:45.00,  estoque:'CALAMIDADE' },
  { nome:'Cobertor',              tipo:'Higiene',     unidade:'Unidade', vlr_unit:38.00,  estoque:'CALAMIDADE' },
  { nome:'Kit Higiene Emergência',tipo:'Higiene',     unidade:'Pacote',  vlr_unit:22.00,  estoque:'CALAMIDADE' },
  // CEGONHA SOCIAL
  { nome:'Fralda Descartável P',  tipo:'Higiene',     unidade:'Pacote',  vlr_unit:28.00,  estoque:'CEGONHA SOCIAL' },
  { nome:'Leite em Pó Infantil',  tipo:'Alimentação', unidade:'Lata',    vlr_unit:52.00,  estoque:'CEGONHA SOCIAL' },
  { nome:'Enxoval Bebê',          tipo:'Vestuário',   unidade:'Kit',     vlr_unit:95.00,  estoque:'CEGONHA SOCIAL' },
]

const ENTRADAS = [
  { item:'Cadeira de Escritório', qtd:10, nf:'NF-P01', forn:'Móveis & Cia',   resp:'Admin' },
  { item:'Computador Desktop',    qtd:5,  nf:'NF-P02', forn:'TechStore',       resp:'Admin' },
  { item:'Impressora Laser',      qtd:3,  nf:'NF-P03', forn:'TechStore',       resp:'Admin' },
  { item:'Colchonete',            qtd:50, nf:'NF-C01', forn:'Atacado Sul',     resp:'Admin' },
  { item:'Cobertor',              qtd:50, nf:'NF-C02', forn:'Atacado Sul',     resp:'Admin' },
  { item:'Kit Higiene Emergência',qtd:30, nf:'NF-C03', forn:'Higiene Total',   resp:'Admin' },
  { item:'Fralda Descartável P',  qtd:40, nf:'NF-G01', forn:'Bebê & Cia',     resp:'Admin' },
  { item:'Leite em Pó Infantil',  qtd:20, nf:'NF-G02', forn:'Distribuidora X', resp:'Admin' },
  { item:'Enxoval Bebê',          qtd:15, nf:'NF-G03', forn:'Bebê & Cia',     resp:'Admin' },
]

async function run() {
  console.log('🌱 Iniciando seed mínimo...')
  await db.query('SET FOREIGN_KEY_CHECKS=0')
  await db.query('TRUNCATE TABLE saidas')
  await db.query('TRUNCATE TABLE entradas')
  await db.query('TRUNCATE TABLE itens')
  await db.query('SET FOREIGN_KEY_CHECKS=1')

  const ids = {}
  const hoje = new Date().toISOString().slice(0,10)

  for (const it of ITENS) {
    const [r] = await db.query(
      'INSERT INTO itens (nome,tipo,unidade,vlr_unit,estoque) VALUES (?,?,?,?,?)',
      [it.nome, it.tipo, it.unidade, it.vlr_unit, it.estoque]
    )
    ids[it.nome] = r.insertId
  }
  for (const e of ENTRADAS) {
    await db.query(
      'INSERT INTO entradas (item_id,data,nf,fornecedor,quantidade,vlr_unit,responsavel) VALUES (?,?,?,?,?,?,?)',
      [ids[e.item], hoje, e.nf, e.forn, e.qtd,
       ITENS.find(i=>i.nome===e.item).vlr_unit, e.resp]
    )
  }
  console.log('✅ Seed concluído — 9 itens (3 por estoque), 9 entradas')
  await db.end()
}
run().catch(e=>{ console.error('❌',e.message); process.exit(1) })
