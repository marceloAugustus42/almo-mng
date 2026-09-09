const Saida = require('../models/SaidaModel')
const Item  = require('../models/ItemModel')

const saidasController = {
  async list(req, res) {
    const { de, ate, destino, item } = req.query
    const rows = await Saida.findAll({ de, ate, destino, item_id: item })
    res.json(rows)
  },

  async create(req, res) {
    const { item_id, data, pedido, destino, quantidade, solicitante, responsavel, obs } = req.body
    if (!item_id || !data || !destino || !quantidade) return res.status(400).json({ error: 'item_id, data, destino e quantidade são obrigatórios.' })
    const item = await Item.findById(item_id)
    if (!item) return res.status(404).json({ error: 'Item não encontrado.' })
    const saida = await Saida.create({ item_id, data, pedido, destino, quantidade, solicitante, responsavel, obs })
    res.status(201).json(saida)
  },

  async remove(req, res) {
    const ok = await Saida.delete(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Saída não encontrada.' })
    res.json({ ok: true })
  },
}

module.exports = saidasController
