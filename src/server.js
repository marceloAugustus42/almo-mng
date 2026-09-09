require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const routes  = require('./routes')

const app  = express()
const PORT = process.env.PORT || 3001

// Permite chamadas do frontend em desenvolvimento e produção local
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())
app.use('/api', routes)

// Handler global de erros — retorna JSON em vez de HTML
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' })
})

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`)
  console.log(`   Frontend esperado em http://localhost:5173`)
})
