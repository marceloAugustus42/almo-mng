const db    = require('../db/connection')
const Saida = require('../models/SaidaModel')

const saidasController = {
  async list(req, res) {
    const { de, ate, destino, item } = req.query
    const rows = await Saida.findAll({ de, ate, destino, item_id: item })
    res.json(rows)
  },

  async create(req, res) {
    const { item_id, data, pedido, destino, quantidade, solicitante, responsavel, obs } = req.body
    if (!item_id || !data || !destino || !quantidade)
      return res.status(400).json({ error: 'item_id, data, destino e quantidade são obrigatórios.' })

    const qtd = parseInt(quantidade)
    if (isNaN(qtd) || qtd < 1)
      return res.status(400).json({ error: 'Quantidade deve ser um inteiro positivo.' })

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      // Calcula saldo atual com LOCK — previne corrida entre requisições simultâneas
      const [[saldoRow]] = await conn.query(`
        SELECT
          COALESCE((SELECT SUM(e.quantidade) FROM entradas e WHERE e.item_id = i.id), 0)
          - COALESCE((SELECT SUM(s.quantidade) FROM saidas   s WHERE s.item_id = i.id), 0)
          AS saldo
        FROM itens i
        WHERE i.id = ? AND i.ativo = 1
        FOR UPDATE
      `, [item_id])

      if (!saldoRow) {
        await conn.rollback()
        return res.status(404).json({ error: 'Item não encontrado.' })
      }

      const saldo = Math.round(Number(saldoRow.saldo) || 0)
      if (qtd > saldo) {
        await conn.rollback()
        return res.status(400).json({ error: `Saldo insuficiente: disponível ${saldo}, solicitado ${qtd}.` })
      }

      const [result] = await conn.query(
        'INSERT INTO saidas (item_id, data, pedido, destino, quantidade, solicitante, responsavel, obs) VALUES (?,?,?,?,?,?,?,?)',
        [item_id, data, pedido||null, destino, qtd, solicitante||null, responsavel||null, obs||null]
      )

      await conn.commit()
      const saida = await Saida.findById(result.insertId)
      res.status(201).json(saida)
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async update(req, res) {
    const s = await Saida.findById(req.params.id)
    if (!s) return res.status(404).json({ error: 'Saída não encontrada.' })
    const atualizada = await Saida.update(req.params.id, req.body)
    res.json(atualizada)
  },

  async remove(req, res) {
    const ok = await Saida.delete(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Saída não encontrada.' })
    res.json({ ok: true })
  },
}

module.exports = saidasController