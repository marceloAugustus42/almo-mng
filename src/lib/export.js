import * as XLSX from 'xlsx'

const fmtDate = d => { if (!d) return ''; const s = String(d).slice(0,10); const [y,m,di]=s.split('-'); return `${di}/${m}/${y}` }
const NAV  = '1B3A5C'
const AZUL = '2E6DA4'

function hdr(ws, row, cols, bg=NAV) {
  for (let c=0; c<cols; c++) {
    const addr = XLSX.utils.encode_cell({r:row-1,c})
    if (!ws[addr]) ws[addr] = { v:'', t:'s' }
    ws[addr].s = {
      fill:{patternType:'solid',fgColor:{rgb:bg}},
      font:{bold:true,color:{rgb:'FFFFFF'},name:'Arial',sz:10},
      alignment:{horizontal:'center',vertical:'center',wrapText:true},
      border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}}
    }
  }
}

function cell(ws, r, c, v, alt=false, bgOverride=null) {
  const addr = XLSX.utils.encode_cell({r,c})
  ws[addr] = { v: v ?? '', t: typeof v==='number'?'n':'s' }
  ws[addr].s = {
    fill:{patternType:'solid',fgColor:{rgb: bgOverride||(alt?'F0F7FF':'FFFFFF')}},
    font:{name:'Arial',sz:10},
    alignment:{horizontal:'center',vertical:'center'},
    border:{top:{style:'thin',color:{rgb:'CCCCCC'}},bottom:{style:'thin',color:{rgb:'CCCCCC'}},
            left:{style:'thin',color:{rgb:'CCCCCC'}},right:{style:'thin',color:{rgb:'CCCCCC'}}}
  }
}

function titulo(ws, txt, ncols) {
  ws['A1'] = { v:txt, t:'s', s:{
    fill:{patternType:'solid',fgColor:{rgb:NAV}},
    font:{bold:true,sz:13,color:{rgb:'FFFFFF'},name:'Arial'},
    alignment:{horizontal:'center',vertical:'center'}
  }}
  ws['!merges'] = ws['!merges']||[]
  ws['!merges'].push({s:{r:0,c:0},e:{r:0,c:ncols-1}})
  ws['!rows'] = [{hpt:28}]
}

export function exportCompleto(itens, entradas, saidas) {
  const wb = XLSX.utils.book_new()

  // Estoque
  const wsEst = {}
  titulo(wsEst,'SALDO ATUAL DE ESTOQUE',9)
  const hdrsEst = ['Tipo','Item','Unidade','Entradas','Saídas','Saldo','Vlr Unit','Saldo R$','Status']
  hdrsEst.forEach((h,c) => { wsEst[XLSX.utils.encode_cell({r:1,c})] = {v:h,t:'s'} })
  hdr(wsEst,2,9)
  itens.forEach((it,i) => {
    const status = Number(it.saldo)<=0?'Zerado':Number(it.saldo)<=5?'Crítico':'OK'
    const bg = Number(it.saldo)<=0?'FDECEA':Number(it.saldo)<=5?'FEF3E2':'EAF7EE'
    const vals = [it.tipo,it.nome,it.unidade,Number(it.total_entradas),Number(it.total_saidas),Number(it.saldo),Number(it.vlr_unit),+(Number(it.saldo)*Number(it.vlr_unit)).toFixed(2),status]
    vals.forEach((v,c) => cell(wsEst,i+2,c,v,i%2===0,c===8?bg:null))
  })
  wsEst['!cols'] = [14,28,12,12,12,10,12,14,12].map(w=>({wch:w}))
  wsEst['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:itens.length+2,c:8}})
  XLSX.utils.book_append_sheet(wb,wsEst,'📦 Estoque Atual')

  // Entradas
  const wsEnt = {}
  titulo(wsEnt,'CONTROLE DE ENTRADAS',9)
  const hdrsEnt = ['Data','NF','Fornecedor','Item','Unidade','Qtd','Vlr Unit','Vlr Total','Responsável']
  hdrsEnt.forEach((h,c) => { wsEnt[XLSX.utils.encode_cell({r:1,c})] = {v:h,t:'s'} })
  hdr(wsEnt,2,9)
  entradas.forEach((e,i) => {
    const vlr = Number(e.quantidade)*Number(e.vlr_unit||0)
    const vals = [fmtDate(e.data),e.nf||'',e.fornecedor||'',e.item_nome,e.item_unidade||'',Number(e.quantidade),Number(e.vlr_unit||0),+vlr.toFixed(2),e.responsavel||'']
    vals.forEach((v,c) => cell(wsEnt,i+2,c,v,i%2===0))
  })
  wsEnt['!cols'] = [12,10,22,26,10,8,12,12,16].map(w=>({wch:w}))
  wsEnt['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:entradas.length+2,c:8}})
  XLSX.utils.book_append_sheet(wb,wsEnt,'📥 Entradas')

  // Saídas
  exportSaidasSheet(wb, saidas)

  XLSX.writeFile(wb,'Almoxarifado_Completo.xlsx')
}

// Aba de saídas reutilizável (usada em exportCompleto e exportSaidasRelatorio)
function exportSaidasSheet(wb, saidas, nomeAba='📤 Saídas') {
  const wsSai = {}
  titulo(wsSai,'CONTROLE DE SAÍDAS',10)
  const hdrsSai = ['Data','Pedido','Item','Tipo','Qtd','Vlr Unit','Vlr Total','Destino','Solicitante','Obs']
  hdrsSai.forEach((h,c) => { wsSai[XLSX.utils.encode_cell({r:1,c})] = {v:h,t:'s'} })
  hdr(wsSai,2,10)
  let totQtd=0, totVlr=0
  saidas.forEach((s,i) => {
    const vlrUnit = Number(s.vlr_unit||0)
    const vlrTot  = Number(s.quantidade)*vlrUnit
    totQtd += Number(s.quantidade); totVlr += vlrTot
    const vals = [fmtDate(s.data),s.pedido||'',s.item_nome,s.item_tipo||'',Number(s.quantidade),vlrUnit,+vlrTot.toFixed(2),s.destino||'',s.solicitante||'',s.obs||'']
    vals.forEach((v,c) => cell(wsSai,i+2,c,v,i%2===0))
  })
  // Linha de total
  const tr = saidas.length+2
  wsSai[XLSX.utils.encode_cell({r:tr,c:0})] = {v:'TOTAL',t:'s',s:{font:{bold:true},fill:{patternType:'solid',fgColor:{rgb:'BDD7EE'}},alignment:{horizontal:'right'}}}
  for(let col=1;col<4;col++) wsSai[XLSX.utils.encode_cell({r:tr,c:col})]={v:'',t:'s',s:{fill:{patternType:'solid',fgColor:{rgb:'BDD7EE'}}}}
  cell(wsSai,tr,4,totQtd,false,'BDD7EE')
  cell(wsSai,tr,5,0,false,'BDD7EE')
  cell(wsSai,tr,6,+totVlr.toFixed(2),false,'BDD7EE')
  for(let col=7;col<10;col++) wsSai[XLSX.utils.encode_cell({r:tr,c:col})]={v:'',t:'s',s:{fill:{patternType:'solid',fgColor:{rgb:'BDD7EE'}}}}

  wsSai['!cols'] = [12,12,26,14,8,12,12,20,16,20].map(w=>({wch:w}))
  wsSai['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:tr,c:9}})
  XLSX.utils.book_append_sheet(wb,wsSai,nomeAba)
}

// Exporta relatório de saídas do período visível (com vlr unit e vlr total)
export function exportSaidasRelatorio(saidas, periodo) {
  const wb = XLSX.utils.book_new()
  const label = periodo?.de && periodo?.ate
    ? `Saídas ${fmtDate(periodo.de)} a ${fmtDate(periodo.ate)}`
    : 'Relatório de Saídas'
  exportSaidasSheet(wb, saidas, '📤 Saídas')
  XLSX.writeFile(wb,`${label}.xlsx`)
}

export function exportPorDestino(saidas, destinos) {
  const wb = XLSX.utils.book_new()
  destinos.forEach(dest => {
    const ws = {}
    const saiDest = saidas.filter(s=>s.destino===dest)
    titulo(ws,`SAÍDAS — ${dest}`,4)
    ws['A2'] = {v:`Destino: ${dest}`,t:'s',s:{fill:{patternType:'solid',fgColor:{rgb:'EBF3FB'}},font:{bold:true,sz:11,color:{rgb:AZUL}},alignment:{horizontal:'center'}}}
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:3}},{s:{r:1,c:0},e:{r:1,c:3}}]

    const hdrs=['Data','Nome do Item','Descrição / Obs','Quantidade']
    hdrs.forEach((h,c)=>{ ws[XLSX.utils.encode_cell({r:3,c})]={v:h,t:'s'} })
    hdr(ws,4,4,NAV)

    saiDest.forEach((s,i)=>{
      const vals=[fmtDate(s.data),s.item_nome,s.obs||'',Number(s.quantidade)]
      vals.forEach((v,c)=>cell(ws,i+4,c,v,i%2===0))
    })

    // Resumo por item
    const resumoMap = {}
    saiDest.forEach(s=>{ resumoMap[s.item_nome]=(resumoMap[s.item_nome]||0)+Number(s.quantidade) })
    const resumoRow = saiDest.length+6
    ws[XLSX.utils.encode_cell({r:resumoRow,c:0})]={v:'RESUMO — SOMATÓRIO POR ITEM',t:'s',s:{fill:{patternType:'solid',fgColor:{rgb:NAV}},font:{bold:true,sz:12,color:{rgb:'FFFFFF'}},alignment:{horizontal:'center'}}}
    ws['!merges'].push({s:{r:resumoRow,c:0},e:{r:resumoRow,c:3}})
    const rHdrs=['#','Nome do Item','','Total Enviado']
    rHdrs.forEach((h,c)=>{ ws[XLSX.utils.encode_cell({r:resumoRow+1,c})]={v:h,t:'s'} })
    hdr(ws,resumoRow+2,4,AZUL)
    Object.entries(resumoMap).forEach(([nome,total],i)=>{
      cell(ws,resumoRow+2+i,0,i+1,i%2===0)
      cell(ws,resumoRow+2+i,1,nome,i%2===0,'FFFDE7')
      cell(ws,resumoRow+2+i,2,'',i%2===0,'FFFDE7')
      cell(ws,resumoRow+2+i,3,total,i%2===0)
    })
    ws['!cols']=[14,30,40,14].map(w=>({wch:w}))
    ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:resumoRow+2+Object.keys(resumoMap).length,c:3}})
    XLSX.utils.book_append_sheet(wb,ws,dest.substring(0,31))
  })
  XLSX.writeFile(wb,'Almoxarifado_Saidas_Destino.xlsx')
}

export function exportEntradas(entradas) {
  const wb = XLSX.utils.book_new()
  const ws = {}
  titulo(ws,'RELATÓRIO DE ENTRADAS',9)
  const hdrs=['Data','NF','Fornecedor','Item','Unidade','Qtd','Vlr Unit','Vlr Total','Responsável']
  hdrs.forEach((h,c)=>{ ws[XLSX.utils.encode_cell({r:1,c})]={v:h,t:'s'} })
  hdr(ws,2,9)
  let totQtd=0,totVlr=0
  entradas.forEach((e,i)=>{
    const vlr=Number(e.quantidade)*Number(e.vlr_unit||0)
    totQtd+=Number(e.quantidade); totVlr+=vlr
    const vals=[fmtDate(e.data),e.nf||'',e.fornecedor||'',e.item_nome,e.item_unidade||'',Number(e.quantidade),Number(e.vlr_unit||0),+vlr.toFixed(2),e.responsavel||'']
    vals.forEach((v,c)=>cell(ws,i+2,c,v,i%2===0))
  })
  ws['!cols']=[12,10,22,26,10,8,12,12,16].map(w=>({wch:w}))
  ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:entradas.length+3,c:8}})
  XLSX.utils.book_append_sheet(wb,ws,'Entradas')
  XLSX.writeFile(wb,'Almoxarifado_Entradas.xlsx')
}
