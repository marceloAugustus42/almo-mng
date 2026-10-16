const db     = require('../db/connection')
const Entrada = require('../models/EntradaModel')
const Item    = require('../models/ItemModel')

const entradasController = {
  async list(req, res) {
    const { de, ate, item } = req.query
    const rows = await Entrada.findAll({ de, ate, item_id: item })
    res.json(rows)
  },

  async create(req, res) {
    const { item_id, data, nf, fornecedor, quantidade, vlr_unit, responsavel, obs } = req.body
    if (!item_id || !data || !quantidade)
      return res.status(400).json({ error: 'item_id, data e quantidade são obrigatórios.' })

    const qtd = parseInt(quantidade)
    if (isNaN(qtd) || qtd < 1)
      return res.status(400).json({ error: 'Quantidade deve ser um inteiro positivo.' })

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      // Verifica se item existe (com lock para evitar race condition)
      const [[item]] = await conn.query('SELECT id FROM itens WHERE id = ? AND ativo = 1 FOR UPDATE', [item_id])
      if (!item) {
        await conn.rollback()
        return res.status(404).json({ error: 'Item não encontrado.' })
      }

      const [result] = await conn.query(
        'INSERT INTO entradas (item_id, data, nf, fornecedor, quantidade, vlr_unit, responsavel, obs) VALUES (?,?,?,?,?,?,?,?)',
        [item_id, data, nf||null, fornecedor||null, qtd, parseFloat(vlr_unit)||0, responsavel||null, obs||null]
      )

      await conn.commit()
      const entrada = await Entrada.findById(result.insertId)
      res.status(201).json(entrada)
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async update(req, res) {
    const e = await Entrada.findById(req.params.id)
    if (!e) return res.status(404).json({ error: 'Entrada não encontrada.' })
    const atualizada = await Entrada.update(req.params.id, req.body)
    res.json(atualizada)
  },

  async remove(req, res) {
    const ok = await Entrada.delete(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Entrada não encontrada.' })
    res.json({ ok: true })
  },
}

module.exports = entradasController