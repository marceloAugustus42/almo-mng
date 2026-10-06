require('dotenv').config()
const db = require('../src/db/connection')

const d = (ano, mes, dia) => `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`

const ITENS_PATRIMONIO = [
  { nome:'Cadeira de Escritório',    tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:350.00 },
  { nome:'Mesa de Escritório',       tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:520.00 },
  { nome:'Armário de Aço',           tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:890.00 },
  { nome:'Computador Desktop',       tipo:'Equipamento', unidade:'Unidade', vlr_unit:2800.00},
  { nome:'Notebook',                 tipo:'Equipamento', unidade:'Unidade', vlr_unit:3500.00},
  { nome:'Impressora Laser',         tipo:'Equipamento', unidade:'Unidade', vlr_unit:1200.00},
  { nome:'Nobreak',                  tipo:'Equipamento', unidade:'Unidade', vlr_unit:650.00 },
  { nome:'Monitor 24"',              tipo:'Equipamento', unidade:'Unidade', vlr_unit:980.00 },
  { nome:'Teclado',                  tipo:'Informática', unidade:'Unidade', vlr_unit:120.00 },
  { nome:'Mouse',                    tipo:'Informática', unidade:'Unidade', vlr_unit:85.00  },
  { nome:'Roteador Wi-Fi',           tipo:'Informática', unidade:'Unidade', vlr_unit:320.00 },
  { nome:'Cabo de Rede (m)',         tipo:'Informática', unidade:'Metro',   vlr_unit:4.50   },
  { nome:'Pen Drive 32GB',           tipo:'Informática', unidade:'Unidade', vlr_unit:45.00  },
  { nome:'Ar Condicionado 9000 BTU', tipo:'Equipamento', unidade:'Unidade', vlr_unit:2100.00},
  { nome:'Ventilador de Teto',       tipo:'Equipamento', unidade:'Unidade', vlr_unit:380.00 },
  { nome:'Telefone Fixo',            tipo:'Equipamento', unidade:'Unidade', vlr_unit:180.00 },
  { nome:'Quadro Branco',            tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:290.00 },
  { nome:'Projetor',                 tipo:'Equipamento', unidade:'Unidade', vlr_unit:2200.00},
  { nome:'Extintor CO2',             tipo:'Segurança',   unidade:'Unidade', vlr_unit:220.00 },
  { nome:'Câmera de Segurança',      tipo:'Segurança',   unidade:'Unidade', vlr_unit:450.00 },
  { nome:'Arquivo Morto',            tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:160.00 },
  { nome:'Cafeteira Elétrica',       tipo:'Equipamento', unidade:'Unidade', vlr_unit:240.00 },
  { nome:'Bebedouro',                tipo:'Equipamento', unidade:'Unidade', vlr_unit:780.00 },
  { nome:'Frigobar',                 tipo:'Equipamento', unidade:'Unidade', vlr_unit:920.00 },
  { nome:'Sofá de Espera',           tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:1100.00},
  { nome:'Cadeira de Reunião',       tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:280.00 },
  { nome:'Mesa de Reunião',          tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:1800.00},
  { nome:'Purificador de Água',      tipo:'Equipamento', unidade:'Unidade', vlr_unit:860.00 },
  { nome:'Scanner',                  tipo:'Equipamento', unidade:'Unidade', vlr_unit:740.00 },
  { nome:'Caixa de Som',             tipo:'Equipamento', unidade:'Unidade', vlr_unit:310.00 },
  { nome:'HD Externo 1TB',           tipo:'Informática', unidade:'Unidade', vlr_unit:290.00 },
  { nome:'Switch de Rede',           tipo:'Informática', unidade:'Unidade', vlr_unit:380.00 },
  { nome:'Rack de Servidor',         tipo:'Informática', unidade:'Unidade', vlr_unit:1200.00},
  { nome:'Lousa Digital',            tipo:'Equipamento', unidade:'Unidade', vlr_unit:3200.00},
  { nome:'Carrinho de Transporte',   tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:420.00 },
  { nome:'Escada 6 Degraus',         tipo:'Equipamento', unidade:'Unidade', vlr_unit:280.00 },
  { nome:'Bomba d\'Água',            tipo:'Equipamento', unidade:'Unidade', vlr_unit:650.00 },
  { nome:'Gerador 5kVA',             tipo:'Equipamento', unidade:'Unidade', vlr_unit:4800.00},
  { nome:'Micro-ondas',              tipo:'Equipamento', unidade:'Unidade', vlr_unit:520.00 },
  { nome:'Estante de Aço',           tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:680.00 },
  { nome:'Régua de Tomadas',         tipo:'Informática', unidade:'Unidade', vlr_unit:65.00  },
  { nome:'Cartucho de Toner',        tipo:'Informática', unidade:'Unidade', vlr_unit:180.00 },
  { nome:'Headset',                  tipo:'Informática', unidade:'Unidade', vlr_unit:145.00 },
  { nome:'Webcam',                   tipo:'Informática', unidade:'Unidade', vlr_unit:210.00 },
  { nome:'Quadro de Avisos',         tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:130.00 },
  { nome:'Relógio de Ponto',         tipo:'Equipamento', unidade:'Unidade', vlr_unit:890.00 },
  { nome:'Cofre Eletrônico',         tipo:'Segurança',   unidade:'Unidade', vlr_unit:760.00 },
  { nome:'Balança Digital',          tipo:'Equipamento', unidade:'Unidade', vlr_unit:320.00 },
  { nome:'Empilhadeira Manual',      tipo:'Equipamento', unidade:'Unidade', vlr_unit:1400.00},
  { nome:'Placa de Identificação',   tipo:'Segurança',   unidade:'Unidade', vlr_unit:45.00  },
]

const ITENS_CALAMIDADE = [
  { nome:'Colchonete',               tipo:'Higiene',     unidade:'Unidade', vlr_unit:45.00  },
  { nome:'Cobertor',                 tipo:'Higiene',     unidade:'Unidade', vlr_unit:38.00  },
  { nome:'Kit Higiene Emergência',   tipo:'Higiene',     unidade:'Pacote',  vlr_unit:22.00  },
  { nome:'Cesta Básica',             tipo:'Alimentação', unidade:'Caixa',   vlr_unit:180.00 },
  { nome:'Água Mineral 20L',         tipo:'Alimentação', unidade:'Galão',   vlr_unit:18.00  },
  { nome:'Bolacha Salgada',          tipo:'Alimentação', unidade:'Pacote',  vlr_unit:8.50   },
  { nome:'Sardinha em Lata',         tipo:'Alimentação', unidade:'Unidade', vlr_unit:6.90   },
  { nome:'Feijão 1kg',               tipo:'Alimentação', unidade:'Pacote',  vlr_unit:9.80   },
  { nome:'Arroz 5kg',                tipo:'Alimentação', unidade:'Pacote',  vlr_unit:28.00  },
  { nome:'Macarrão 500g',            tipo:'Alimentação', unidade:'Pacote',  vlr_unit:5.50   },
  { nome:'Óleo de Cozinha 900ml',    tipo:'Alimentação', unidade:'Frasco',  vlr_unit:8.90   },
  { nome:'Sal 1kg',                  tipo:'Alimentação', unidade:'Pacote',  vlr_unit:3.50   },
  { nome:'Açúcar 1kg',               tipo:'Alimentação', unidade:'Pacote',  vlr_unit:6.20   },
  { nome:'Leite Longa Vida',         tipo:'Alimentação', unidade:'Caixa',   vlr_unit:5.80   },
  { nome:'Café 250g',                tipo:'Alimentação', unidade:'Pacote',  vlr_unit:12.00  },
  { nome:'Toalha de Banho',          tipo:'Higiene',     unidade:'Unidade', vlr_unit:28.00  },
  { nome:'Sabonete',                 tipo:'Higiene',     unidade:'Unidade', vlr_unit:3.50   },
  { nome:'Shampoo',                  tipo:'Higiene',     unidade:'Frasco',  vlr_unit:12.00  },
  { nome:'Escova de Dente',          tipo:'Higiene',     unidade:'Unidade', vlr_unit:4.50   },
  { nome:'Pasta de Dente',           tipo:'Higiene',     unidade:'Unidade', vlr_unit:6.80   },
  { nome:'Absorvente',               tipo:'Higiene',     unidade:'Pacote',  vlr_unit:9.90   },
  { nome:'Papel Higiênico',          tipo:'Higiene',     unidade:'Pacote',  vlr_unit:14.00  },
  { nome:'Máscara Cirúrgica',        tipo:'Saúde',       unidade:'Caixa',   vlr_unit:18.00  },
  { nome:'Luva Descartável',         tipo:'Saúde',       unidade:'Caixa',   vlr_unit:22.00  },
  { nome:'Álcool em Gel 500ml',      tipo:'Saúde',       unidade:'Frasco',  vlr_unit:12.00  },
  { nome:'Curativo Adesivo',         tipo:'Saúde',       unidade:'Caixa',   vlr_unit:8.00   },
  { nome:'Atadura de Crepe',         tipo:'Saúde',       unidade:'Unidade', vlr_unit:4.50   },
  { nome:'Kit Primeiros Socorros',   tipo:'Saúde',       unidade:'Kit',     vlr_unit:85.00  },
  { nome:'Lanterna LED',             tipo:'Equipamento', unidade:'Unidade', vlr_unit:35.00  },
  { nome:'Pilha AA',                 tipo:'Equipamento', unidade:'Pacote',  vlr_unit:18.00  },
  { nome:'Vela',                     tipo:'Equipamento', unidade:'Pacote',  vlr_unit:8.00   },
  { nome:'Isqueiro',                 tipo:'Equipamento', unidade:'Unidade', vlr_unit:5.00   },
  { nome:'Lona Plástica',            tipo:'Equipamento', unidade:'Rolo',    vlr_unit:45.00  },
  { nome:'Corda 10m',                tipo:'Equipamento', unidade:'Rolo',    vlr_unit:28.00  },
  { nome:'Pá',                       tipo:'Ferramenta',  unidade:'Unidade', vlr_unit:38.00  },
  { nome:'Enxada',                   tipo:'Ferramenta',  unidade:'Unidade', vlr_unit:42.00  },
  { nome:'Balde 20L',                tipo:'Limpeza',     unidade:'Unidade', vlr_unit:22.00  },
  { nome:'Vassoura',                 tipo:'Limpeza',     unidade:'Unidade', vlr_unit:18.00  },
  { nome:'Rodo',                     tipo:'Limpeza',     unidade:'Unidade', vlr_unit:15.00  },
  { nome:'Saco de Lixo 100L',        tipo:'Limpeza',     unidade:'Pacote',  vlr_unit:22.00  },
  { nome:'Detergente',               tipo:'Limpeza',     unidade:'Frasco',  vlr_unit:3.20   },
  { nome:'Água Sanitária 1L',        tipo:'Limpeza',     unidade:'Frasco',  vlr_unit:4.50   },
  { nome:'Desinfetante 2L',          tipo:'Limpeza',     unidade:'Frasco',  vlr_unit:9.00   },
  { nome:'Marmita Descartável',      tipo:'Alimentação', unidade:'Pacote',  vlr_unit:18.00  },
  { nome:'Copo Descartável',         tipo:'Alimentação', unidade:'Pacote',  vlr_unit:7.50   },
  { nome:'Colher Descartável',       tipo:'Alimentação', unidade:'Pacote',  vlr_unit:5.00   },
  { nome:'Barraca de Emergência',    tipo:'Equipamento', unidade:'Unidade', vlr_unit:320.00 },
  { nome:'Saco de Dormir',           tipo:'Higiene',     unidade:'Unidade', vlr_unit:95.00  },
  { nome:'Repelente',                tipo:'Saúde',       unidade:'Frasco',  vlr_unit:18.00  },
  { nome:'Protetor Solar FPS 30',    tipo:'Saúde',       unidade:'Frasco',  vlr_unit:24.00  },
]

const ITENS_CEGONHA = [
  { nome:'Fralda Descartável P',     tipo:'Higiene',     unidade:'Pacote',  vlr_unit:28.00  },
  { nome:'Fralda Descartável M',     tipo:'Higiene',     unidade:'Pacote',  vlr_unit:32.00  },
  { nome:'Fralda Descartável G',     tipo:'Higiene',     unidade:'Pacote',  vlr_unit:36.00  },
  { nome:'Leite em Pó Infantil',     tipo:'Alimentação', unidade:'Lata',    vlr_unit:52.00  },
  { nome:'Enxoval Bebê',             tipo:'Vestuário',   unidade:'Kit',     vlr_unit:95.00  },
  { nome:'Mamadeira',                tipo:'Higiene',     unidade:'Unidade', vlr_unit:38.00  },
  { nome:'Chupeta',                  tipo:'Higiene',     unidade:'Unidade', vlr_unit:18.00  },
  { nome:'Pomada para Assadura',     tipo:'Saúde',       unidade:'Unidade', vlr_unit:22.00  },
  { nome:'Shampoo Infantil',         tipo:'Higiene',     unidade:'Frasco',  vlr_unit:16.00  },
  { nome:'Sabonete Infantil',        tipo:'Higiene',     unidade:'Unidade', vlr_unit:8.00   },
  { nome:'Toalha de Banho Bebê',     tipo:'Higiene',     unidade:'Unidade', vlr_unit:45.00  },
  { nome:'Lenço Umedecido',          tipo:'Higiene',     unidade:'Pacote',  vlr_unit:12.00  },
  { nome:'Termômetro Digital',       tipo:'Saúde',       unidade:'Unidade', vlr_unit:35.00  },
  { nome:'Aspirador Nasal',          tipo:'Saúde',       unidade:'Unidade', vlr_unit:28.00  },
  { nome:'Cortador de Unha Bebê',    tipo:'Higiene',     unidade:'Unidade', vlr_unit:15.00  },
  { nome:'Cobertor Bebê',            tipo:'Vestuário',   unidade:'Unidade', vlr_unit:48.00  },
  { nome:'Macacão Recém-Nascido',    tipo:'Vestuário',   unidade:'Unidade', vlr_unit:32.00  },
  { nome:'Meias Bebê',               tipo:'Vestuário',   unidade:'Par',     vlr_unit:8.00   },
  { nome:'Touca Bebê',               tipo:'Vestuário',   unidade:'Unidade', vlr_unit:12.00  },
  { nome:'Luva Bebê',                tipo:'Vestuário',   unidade:'Par',     vlr_unit:10.00  },
  { nome:'Berço Portátil',           tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:280.00 },
  { nome:'Carrinho de Bebê',         tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:450.00 },
  { nome:'Bebê Conforto',            tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:320.00 },
  { nome:'Banheira Bebê',            tipo:'Higiene',     unidade:'Unidade', vlr_unit:85.00  },
  { nome:'Suporte de Mamadeira',     tipo:'Higiene',     unidade:'Unidade', vlr_unit:28.00  },
  { nome:'Esterilizador de Mamadeira',tipo:'Higiene',    unidade:'Unidade', vlr_unit:95.00  },
  { nome:'Colchão para Berço',       tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:180.00 },
  { nome:'Kit Maternidade',          tipo:'Higiene',     unidade:'Kit',     vlr_unit:145.00 },
  { nome:'Cadeira de Amamentação',   tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:380.00 },
  { nome:'Cinto de Grávida',         tipo:'Saúde',       unidade:'Unidade', vlr_unit:65.00  },
  { nome:'Sutiã Amamentação',        tipo:'Vestuário',   unidade:'Unidade', vlr_unit:42.00  },
  { nome:'Absorvente Pós-Parto',     tipo:'Higiene',     unidade:'Pacote',  vlr_unit:18.00  },
  { nome:'Calcinha Descartável',     tipo:'Higiene',     unidade:'Pacote',  vlr_unit:22.00  },
  { nome:'Travesseiro para Gestante',tipo:'Higiene',     unidade:'Unidade', vlr_unit:120.00 },
  { nome:'Vitamina Pré-Natal',       tipo:'Saúde',       unidade:'Caixa',   vlr_unit:38.00  },
  { nome:'Ácido Fólico',             tipo:'Saúde',       unidade:'Caixa',   vlr_unit:22.00  },
  { nome:'Sulfato Ferroso',          tipo:'Saúde',       unidade:'Caixa',   vlr_unit:18.00  },
  { nome:'Pasta de Amendoim Infantil',tipo:'Alimentação',unidade:'Frasco',  vlr_unit:28.00  },
  { nome:'Papa Infantil',            tipo:'Alimentação', unidade:'Caixa',   vlr_unit:12.00  },
  { nome:'Suco de Fruta Infantil',   tipo:'Alimentação', unidade:'Caixa',   vlr_unit:8.50   },
  { nome:'Biscoito Infantil',        tipo:'Alimentação', unidade:'Pacote',  vlr_unit:6.80   },
  { nome:'Andador Bebê',             tipo:'Mobiliário',  unidade:'Unidade', vlr_unit:180.00 },
  { nome:'Mordedor Refrigerante',    tipo:'Higiene',     unidade:'Unidade', vlr_unit:22.00  },
  { nome:'Monitor de Bebê',          tipo:'Equipamento', unidade:'Unidade', vlr_unit:320.00 },
  { nome:'Humidificador de Ar',      tipo:'Equipamento', unidade:'Unidade', vlr_unit:280.00 },
  { nome:'Balança Bebê',             tipo:'Equipamento', unidade:'Unidade', vlr_unit:180.00 },
  { nome:'Brinquedo Chocalho',       tipo:'Brinquedo',   unidade:'Unidade', vlr_unit:18.00  },
  { nome:'Mobile Musical',           tipo:'Brinquedo',   unidade:'Unidade', vlr_unit:85.00  },
  { nome:'Tapete de Atividades',     tipo:'Brinquedo',   unidade:'Unidade', vlr_unit:95.00  },
  { nome:'Saco Térmico Mamadeira',   tipo:'Higiene',     unidade:'Unidade', vlr_unit:48.00  },
]

// Datas variadas para entradas
const DATAS = [
  d(2026,1,10), d(2026,2,5),  d(2026,3,12), d(2026,4,8),
  d(2026,5,15), d(2026,6,20), d(2026,7,3),  d(2026,8,18),
  d(2026,9,1),  d(2026,9,20),
]

async function run() {
  console.log('🌱 Iniciando seed completo — 50 itens por estoque...')
  await db.query('SET FOREIGN_KEY_CHECKS=0')
  await db.query('TRUNCATE TABLE saidas')
  await db.query('TRUNCATE TABLE entradas')
  await db.query('TRUNCATE TABLE itens')
  await db.query('SET FOREIGN_KEY_CHECKS=1')

  const grupos = [
    { itens: ITENS_PATRIMONIO, estoque: 'PATRIMÔNIO' },
    { itens: ITENS_CALAMIDADE, estoque: 'CALAMIDADE' },
    { itens: ITENS_CEGONHA,    estoque: 'CEGONHA SOCIAL' },
  ]

  let totalItens = 0, totalEntradas = 0

  for (const grupo of grupos) {
    console.log(`  → Inserindo ${grupo.itens.length} itens em ${grupo.estoque}...`)
    for (let i = 0; i < grupo.itens.length; i++) {
      const it = grupo.itens[i]
      const [r] = await db.query(
        'INSERT INTO itens (nome,tipo,unidade,vlr_unit,estoque) VALUES (?,?,?,?,?)',
        [it.nome, it.tipo, it.unidade, it.vlr_unit, grupo.estoque]
      )
      const item_id = r.insertId

      // 2 entradas por item em datas diferentes
      const data1 = DATAS[i % 5]
      const data2 = DATAS[(i % 5) + 5]
      const qtd1  = Math.floor(Math.random() * 20) + 10  // 10–29
      const qtd2  = Math.floor(Math.random() * 10) + 5   // 5–14

      await db.query(
        'INSERT INTO entradas (item_id,data,nf,fornecedor,quantidade,vlr_unit,responsavel) VALUES (?,?,?,?,?,?,?)',
        [item_id, data1, `NF-${grupo.estoque.slice(0,3)}-${String(i+1).padStart(2,'0')}A`, 'Fornecedor Padrão', qtd1, it.vlr_unit, 'Admin']
      )
      await db.query(
        'INSERT INTO entradas (item_id,data,nf,fornecedor,quantidade,vlr_unit,responsavel) VALUES (?,?,?,?,?,?,?)',
        [item_id, data2, `NF-${grupo.estoque.slice(0,3)}-${String(i+1).padStart(2,'0')}B`, 'Fornecedor Padrão', qtd2, it.vlr_unit, 'Admin']
      )
      totalEntradas += 2
      totalItens++
    }
  }

  console.log(`✅ Seed concluído!`)
  console.log(`   ${totalItens} itens | ${totalEntradas} entradas`)
  await db.end()
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
