import * as XLSX from 'xlsx'

const fmtDate = d => d ? d.split('-').reverse().join('/') : ''
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
  ws[addr] = { v, t: typeof v==='number'?'n':'s' }
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

  // ── Estoque Atual ──
  const wsEst = {}
  titulo(wsEst,'SALDO ATUAL DE ESTOQUE',8)
  const hdrsEst = ['Tipo','Item','Unidade','Entradas','Saídas','Saldo','Vlr Unit','Saldo R$','Status']
  hdrsEst.forEach((h,c) => { wsEst[XLSX.utils.encode_cell({r:1,c})] = {v:h,t:'s'} })
  hdr(wsEst,2,9)
  itens.forEach((it,i) => {
    const status = it.saldo<=0?'Zerado':it.saldo<=5?'Crítico':'OK'
    const bg = it.saldo<=0?'FDECEA':it.saldo<=5?'FEF3E2':'EAF7EE'
    const vals = [it.tipo,it.nome,it.unidade,it.total_entradas,it.total_saidas,it.saldo,it.vlr_unit,+(it.saldo*it.vlr_unit).toFixed(2),status]
    vals.forEach((v,c) => cell(wsEst,i+2,c,v,i%2===0,c===8?bg:null))
  })
  wsEst['!cols'] = [14,28,12,12,12,10,12,14,12].map(w=>({wch:w}))
  wsEst['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:itens.length+2,c:8}})
  XLSX.utils.book_append_sheet(wb,wsEst,'📦 Estoque Atual')

  // ── Entradas ──
  const wsEnt = {}
  titulo(wsEnt,'CONTROLE DE ENTRADAS',8)
  const hdrsEnt = ['Data','NF','Fornecedor','Item','Unidade','Qtd','Vlr Unit','Vlr Total','Responsável']
  hdrsEnt.forEach((h,c) => { wsEnt[XLSX.utils.encode_cell({r:1,c})] = {v:h,t:'s'} })
  hdr(wsEnt,2,9)
  entradas.forEach((e,i) => {
    const vals = [fmtDate(e.data),e.nf||'',e.fornecedor||'',e.item_nome,e.item_unidade||'',e.quantidade,e.vlr_unit||0,+(e.quantidade*(e.vlr_unit||0)).toFixed(2),e.responsavel||'']
    vals.forEach((v,c) => cell(wsEnt,i+2,c,v,i%2===0))
  })
  wsEnt['!cols'] = [12,10,22,26,10,8,12,12,16].map(w=>({wch:w}))
  wsEnt['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:entradas.length+2,c:8}})
  XLSX.utils.book_append_sheet(wb,wsEnt,'📥 Entradas')

  // ── Saídas ──
  const wsSai = {}
  titulo(wsSai,'CONTROLE DE SAÍDAS',8)
  const hdrsSai = ['Data','Pedido','Item','Tipo','Qtd','Destino','Solicitante','Responsável','Obs']
  hdrsSai.forEach((h,c) => { wsSai[XLSX.utils.encode_cell({r:1,c})] = {v:h,t:'s'} })
  hdr(wsSai,2,9)
  saidas.forEach((s,i) => {
    const vals = [fmtDate(s.data),s.pedido||'',s.item_nome,s.item_tipo||'',s.quantidade,s.destino||'',s.solicitante||'',s.responsavel||'',s.obs||'']
    vals.forEach((v,c) => cell(wsSai,i+2,c,v,i%2===0))
  })
  wsSai['!cols'] = [12,10,26,12,8,20,16,16,20].map(w=>({wch:w}))
  wsSai['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:saidas.length+2,c:8}})
  XLSX.utils.book_append_sheet(wb,wsSai,'📤 Saídas')

  XLSX.writeFile(wb,'Almoxarifado_Completo.xlsx')
}

export function exportPorDestino(saidas, destinos) {
  const wb = XLSX.utils.book_new()
  destinos.forEach(dest => {
    const ws = {}
    const saiDest = saidas.filter(s=>s.destino===dest)
    titulo(ws,`SAÍDAS — ${dest}`,4)
    // Subtítulo
    ws['A2'] = {v:`Destino: ${dest}`,t:'s',s:{fill:{patternType:'solid',fgColor:{rgb:'EBF3FB'}},font:{bold:true,sz:11,color:{rgb:AZUL}},alignment:{horizontal:'center'}}}
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:3}},{s:{r:1,c:0},e:{r:1,c:3}}]

    const hdrs=['Data','Nome do Item','Descrição / Obs','Quantidade']
    hdrs.forEach((h,c)=>{ws[XLSX.utils.encode_cell({r:3,c})]={v:h,t:'s'}})
    hdr(ws,4,4,NAV)

    saiDest.forEach((s,i)=>{
      const vals=[fmtDate(s.data),s.item_nome,s.obs||'',s.quantidade]
      vals.forEach((v,c)=>cell(ws,i+4,c,v,i%2===0))
    })

    // Resumo somatório por item
    const resumoMap = {}
    saiDest.forEach(s=>{ resumoMap[s.item_nome]=(resumoMap[s.item_nome]||0)+s.quantidade })
    const resumoRow = saiDest.length + 6
    ws[XLSX.utils.encode_cell({r:resumoRow,c:0})] = {v:'RESUMO — SOMATÓRIO POR ITEM',t:'s',s:{fill:{patternType:'solid',fgColor:{rgb:NAV}},font:{bold:true,sz:12,color:{rgb:'FFFFFF'}},alignment:{horizontal:'center'}}}
    ws['!merges'].push({s:{r:resumoRow,c:0},e:{r:resumoRow,c:3}})
    const rHdrs=['#','Nome do Item','','Total Enviado']
    rHdrs.forEach((h,c)=>{ws[XLSX.utils.encode_cell({r:resumoRow+1,c})]={v:h,t:'s'}})
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
  titulo(ws,'RELATÓRIO DE ENTRADAS',8)
  const hdrs=['Data','NF','Fornecedor','Item','Unidade','Qtd','Vlr Unit','Vlr Total','Responsável']
  hdrs.forEach((h,c)=>{ws[XLSX.utils.encode_cell({r:1,c})]={v:h,t:'s'}})
  hdr(ws,2,9)
  entradas.forEach((e,i)=>{
    const vals=[fmtDate(e.data),e.nf||'',e.fornecedor||'',e.item_nome,e.item_unidade||'',e.quantidade,e.vlr_unit||0,+(e.quantidade*(e.vlr_unit||0)).toFixed(2),e.responsavel||'']
    vals.forEach((v,c)=>cell(ws,i+2,c,v,i%2===0))
  })
  ws['!cols']=[12,10,22,26,10,8,12,12,16].map(w=>({wch:w}))
  ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:entradas.length+2,c:8}})
  XLSX.utils.book_append_sheet(wb,ws,'Entradas')
  XLSX.writeFile(wb,'Almoxarifado_Entradas.xlsx')
}
