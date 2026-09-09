const router  = require('express').Router()
const itens      = require('../controllers/itensController')
const entradas   = require('../controllers/entradasController')
const saidas     = require('../controllers/saidasController')
const dashboard  = require('../controllers/dashboardController')

// Helper para capturar erros async sem try/catch em cada rota
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Itens
router.get   ('/itens',       wrap(itens.list))
router.post  ('/itens',       wrap(itens.create))
router.put   ('/itens/:id',   wrap(itens.update))
router.delete('/itens/:id',   wrap(itens.remove))

// Entradas
router.get   ('/entradas',    wrap(entradas.list))
router.post  ('/entradas',    wrap(entradas.create))
router.delete('/entradas/:id',wrap(entradas.remove))

// Saídas
router.get   ('/saidas',      wrap(saidas.list))
router.post  ('/saidas',      wrap(saidas.create))
router.delete('/saidas/:id',  wrap(saidas.remove))

// Dashboard
router.get('/dashboard', wrap(dashboard.get))

module.exports = router
