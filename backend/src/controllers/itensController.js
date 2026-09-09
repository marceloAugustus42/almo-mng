const Item = require('../models/ItemModel')

const itensController = {
  async list(req, res) {
    const itens = await Item.findAll()
    res.json(itens)
  },

  async create(req, res) {
    const { nome, tipo, unidade, vlr_unit } = req.body
    if (!nome || !tipo || !unidade) return res.status(400).json({ error: 'nome, tipo e unidade são obrigatórios.' })
    const existe = await Item.findByNome(nome)
    if (existe) return res.status(409).json({ error: 'Já existe um item com esse nome.' })
    const item = await Item.create({ nome, tipo, unidade, vlr_unit })
    res.status(201).json(item)
  },

  async update(req, res) {
    const item = await Item.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'Item não encontrado.' })
    const atualizado = await Item.update(req.params.id, req.body)
    res.json(atualizado)
  },

  async remove(req, res) {
    const ok = await Item.softDelete(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Item não encontrado.' })
    res.json({ ok: true })
  },
}

module.exports = itensController
