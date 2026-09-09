const BaseModel = require('./BaseModel')

class ItemModel extends BaseModel {
  constructor() { super('itens') }

  // Lista todos com saldo calculado via view
  async findAll() {
    return this.query('SELECT * FROM vw_saldos ORDER BY nome')
  }

  async findByNome(nome) {
    const [row] = await this.query('SELECT * FROM itens WHERE nome = ?', [nome])
    return row || null
  }

  async create({ nome, tipo, unidade, vlr_unit = 0 }) {
    const result = await this.query(
      'INSERT INTO itens (nome, tipo, unidade, vlr_unit) VALUES (?, ?, ?, ?)',
      [nome, tipo, unidade, vlr_unit]
    )
    return this.findById(result.insertId)
  }

  async update(id, { nome, tipo, unidade, vlr_unit }) {
    await this.query(
      'UPDATE itens SET nome=?, tipo=?, unidade=?, vlr_unit=? WHERE id=?',
      [nome, tipo, unidade, vlr_unit, id]
    )
    return this.findById(id)
  }

  // Soft delete — preserva histórico
  async softDelete(id) {
    const result = await this.query('UPDATE itens SET ativo=0 WHERE id=?', [id])
    return result.affectedRows > 0
  }
}

module.exports = new ItemModel()
