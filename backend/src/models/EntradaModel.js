const BaseModel = require('./BaseModel')

class EntradaModel extends BaseModel {
  constructor() { super('entradas') }

  async findAll({ de, ate, item_id } = {}) {
    let sql = `
      SELECT e.*, i.nome AS item_nome, i.unidade AS item_unidade
      FROM entradas e
      JOIN itens i ON i.id = e.item_id
      WHERE 1=1`
    const params = []
    if (de)      { sql += ' AND e.data >= ?'; params.push(de) }
    if (ate)     { sql += ' AND e.data <= ?'; params.push(ate) }
    if (item_id) { sql += ' AND e.item_id = ?'; params.push(item_id) }
    sql += ' ORDER BY e.data DESC, e.criado_em DESC'
    return this.query(sql, params)
  }

  async create({ item_id, data, nf, fornecedor, quantidade, vlr_unit = 0, responsavel, obs }) {
    const result = await this.query(
      `INSERT INTO entradas (item_id, data, nf, fornecedor, quantidade, vlr_unit, responsavel, obs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id, data, nf || null, fornecedor || null, quantidade, vlr_unit, responsavel || null, obs || null]
    )
    return this.findById(result.insertId)
  }
}

module.exports = new EntradaModel()
