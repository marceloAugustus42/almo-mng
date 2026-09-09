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
    if (!item_id || !data || !quantidade) return res.status(400).json({ error: 'item_id, data e quantidade são obrigatórios.' })
    const item = await Item.findById(item_id)
    if (!item) return res.status(404).json({ error: 'Item não encontrado.' })
    const entrada = await Entrada.create({ item_id, data, nf, fornecedor, quantidade, vlr_unit, responsavel, obs })
    res.status(201).json(entrada)
  },

  async remove(req, res) {
    const ok = await Entrada.delete(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Entrada não encontrada.' })
    res.json({ ok: true })
  },
}

module.exports = entradasController
