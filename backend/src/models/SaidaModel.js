const BaseModel = require('./BaseModel')

class SaidaModel extends BaseModel {
  constructor() { super('saidas') }

  async findAll({ de, ate, destino, item_id } = {}) {
    let sql = `
      SELECT s.*, i.nome AS item_nome, i.unidade AS item_unidade
      FROM saidas s
      JOIN itens i ON i.id = s.item_id
      WHERE 1=1`
    const params = []
    if (de)      { sql += ' AND s.data >= ?'; params.push(de) }
    if (ate)     { sql += ' AND s.data <= ?'; params.push(ate) }
    if (destino) { sql += ' AND s.destino = ?'; params.push(destino) }
    if (item_id) { sql += ' AND s.item_id = ?'; params.push(item_id) }
    sql += ' ORDER BY s.data DESC, s.criado_em DESC'
    return this.query(sql, params)
  }

  async create({ item_id, data, pedido, destino, quantidade, solicitante, responsavel, obs }) {
    const result = await this.query(
      `INSERT INTO saidas (item_id, data, pedido, destino, quantidade, solicitante, responsavel, obs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id, data, pedido || null, destino, quantidade, solicitante || null, responsavel || null, obs || null]
    )
    return this.findById(result.insertId)
  }
}

module.exports = new SaidaModel()
