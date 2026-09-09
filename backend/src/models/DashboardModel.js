const BaseModel = require('./BaseModel')

class DashboardModel extends BaseModel {
  constructor() { super('itens') }

  async getKpis(mes, ano) {
    const prefix = `${ano}-${mes}`
    const [[totItens]]      = [await this.query('SELECT COUNT(*) AS v FROM vw_saldos')]
    const [[totEnt]]        = [await this.query('SELECT COALESCE(SUM(quantidade),0) AS v FROM entradas WHERE DATE_FORMAT(data,"%Y-%m")=?', [prefix])]
    const [[totSai]]        = [await this.query('SELECT COALESCE(SUM(quantidade),0) AS v FROM saidas WHERE DATE_FORMAT(data,"%Y-%m")=?', [prefix])]
    const [[criticos]]      = [await this.query('SELECT COUNT(*) AS v FROM vw_saldos WHERE saldo>0 AND saldo<=5')]
    const [[zerados]]       = [await this.query('SELECT COUNT(*) AS v FROM vw_saldos WHERE saldo<=0')]
    return {
      total_itens:        totItens.v,
      total_entradas_qtd: Number(totEnt.v),
      total_saidas_qtd:   Number(totSai.v),
      criticos:           criticos.v,
      zerados:            zerados.v,
    }
  }

  async getAlertas() {
    return this.query('SELECT * FROM vw_saldos WHERE saldo<=5 ORDER BY saldo ASC')
  }

  async getEntradasVsSaidas(mes, ano) {
    const prefix = `${ano}-${mes}`
    const entradas = await this.query(
      `SELECT DAY(data) AS dia, SUM(quantidade) AS total FROM entradas
       WHERE DATE_FORMAT(data,"%Y-%m")=? GROUP BY DAY(data)`, [prefix])
    const saidas = await this.query(
      `SELECT DAY(data) AS dia, SUM(quantidade) AS total FROM saidas
       WHERE DATE_FORMAT(data,"%Y-%m")=? GROUP BY DAY(data)`, [prefix])

    const diasNoMes = new Date(ano, mes, 0).getDate()
    return Array.from({ length: diasNoMes }, (_, i) => {
      const d = i + 1
      const label = `${String(d).padStart(2,'0')}/${mes}`
      const ent = entradas.find(e => e.dia === d)?.total || 0
      const sai = saidas.find(s => s.dia === d)?.total || 0
      return { dia: label, entradas: Number(ent), saidas: Number(sai) }
    }).filter(d => d.entradas > 0 || d.saidas > 0)
  }

  async getCurvaABC(mes, ano) {
    const prefix = `${ano}-${mes}`
    const rows = await this.query(
      `SELECT i.nome, SUM(s.quantidade) AS qtd
       FROM saidas s JOIN itens i ON i.id=s.item_id
       WHERE DATE_FORMAT(s.data,"%Y-%m")=?
       GROUP BY s.item_id ORDER BY qtd DESC LIMIT 10`, [prefix])
    const total = rows.reduce((acc, r) => acc + Number(r.qtd), 0)
    let acum = 0
    return rows.map(r => {
      acum += Number(r.qtd)
      return { nome: r.nome, qtd: Number(r.qtd), pct: total > 0 ? +((acum/total)*100).toFixed(1) : 0 }
    })
  }

  async getComposicaoEstoque() {
    return this.query(
      `SELECT tipo, ROUND(SUM(saldo * vlr_unit),2) AS valor
       FROM vw_saldos WHERE saldo>0 GROUP BY tipo ORDER BY valor DESC`)
  }

  async getEstoqueParado() {
    return this.query(`
      SELECT v.*,
        MAX(s.data) AS ultima_saida,
        DATEDIFF(CURDATE(), COALESCE(MAX(s.data), v.criado_em)) AS dias_parado,
        ROUND(v.saldo * v.vlr_unit, 2) AS valor_parado
      FROM vw_saldos v
      LEFT JOIN saidas s ON s.item_id = v.id
      WHERE v.saldo > 0
      GROUP BY v.id
      HAVING dias_parado >= 90
      ORDER BY dias_parado DESC`)
  }

  async getUltimasMovimentacoes() {
    return this.query(`
      (SELECT 'Entrada' AS tipo, e.data, e.criado_em, i.nome AS item_nome,
              e.quantidade AS qtd, COALESCE(e.fornecedor, e.responsavel,'—') AS solicitante
       FROM entradas e JOIN itens i ON i.id=e.item_id)
      UNION ALL
      (SELECT 'Saída' AS tipo, s.data, s.criado_em, i.nome AS item_nome,
              s.quantidade AS qtd, COALESCE(s.solicitante, s.destino,'—') AS solicitante
       FROM saidas s JOIN itens i ON i.id=s.item_id)
      ORDER BY criado_em DESC LIMIT 15`)
  }

  async getPorDestino(mes, ano) {
    const prefix = `${ano}-${mes}`
    return this.query(
      `SELECT destino AS dest, SUM(quantidade) AS qtd FROM saidas
       WHERE DATE_FORMAT(data,"%Y-%m")=? GROUP BY destino ORDER BY qtd DESC`, [prefix])
  }
}

module.exports = new DashboardModel()
