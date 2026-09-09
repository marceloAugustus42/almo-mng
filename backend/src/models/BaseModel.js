const db = require('../db/connection')

class BaseModel {
  constructor(table) {
    this.table = table
  }

  async query(sql, params = []) {
    const [rows] = await db.query(sql, params)
    return rows
  }

  async findById(id) {
    const [row] = await this.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id])
    return row || null
  }

  async delete(id) {
    const result = await this.query(`DELETE FROM ${this.table} WHERE id = ?`, [id])
    return result.affectedRows > 0
  }
}

module.exports = BaseModel
