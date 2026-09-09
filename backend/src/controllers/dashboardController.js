const Dashboard = require('../models/DashboardModel')

const dashboardController = {
  async get(req, res) {
    const now = new Date()
    const mes = req.query.mes || String(now.getMonth() + 1).padStart(2, '0')
    const ano = req.query.ano || String(now.getFullYear())

    const [kpis, alertas, entradasVsSaidas, curvaABC, composicaoEstoque, parado, movs, porDestino] =
      await Promise.all([
        Dashboard.getKpis(mes, ano),
        Dashboard.getAlertas(),
        Dashboard.getEntradasVsSaidas(mes, ano),
        Dashboard.getCurvaABC(mes, ano),
        Dashboard.getComposicaoEstoque(),
        Dashboard.getEstoqueParado(),
        Dashboard.getUltimasMovimentacoes(),
        Dashboard.getPorDestino(mes, ano),
      ])

    res.json({ kpis, alertas, entradasVsSaidas, curvaABC, composicaoEstoque, parado, movs, porDestino, top10: curvaABC })
  },
}

module.exports = dashboardController
