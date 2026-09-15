require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const routes  = require('./routes')
const db      = require('./db/connection')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())
app.use('/api', routes)

// Rota de health check — frontend usa para saber se backend está online
app.get('/health', (req, res) => res.json({ ok: true }))

// Handler global de erros
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' })
})

// Testa conexão com MySQL antes de subir
db.query('SELECT 1')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Backend rodando em http://localhost:${PORT}`)
      console.log(`   MySQL conectado com sucesso.`)
      console.log(`   Frontend esperado em http://localhost:5173`)
    })
  })
  .catch(err => {
    console.error('❌ Falha ao conectar no MySQL:', err.message)
    console.error('   Verifique as configurações no arquivo .env')
    process.exit(1)
  })
