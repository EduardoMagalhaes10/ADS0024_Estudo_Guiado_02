const { descontoPromoAtivo, PERCENTUAL_DESCONTO_PROMO } = require('../config/features');

// GET /api/status: mostra o estado das feature flags (útil para a demonstração).
function status(req, res) {
  res.json({
    servico: 'AgriGest API',
    versao: '2.0.0',
    features: { FEATURE_DESCONTO_PROMO: descontoPromoAtivo() },
  });
}

// GET /api/desconto?valor=100: calcula o desconto promocional.
// Com a flag desligada a rota responde 404, como se não existisse (Dark Launch):
// o código já está em produção, mas a funcionalidade ainda não foi liberada (Release).
function desconto(req, res) {
  if (!descontoPromoAtivo()) {
    return res.status(404).json({ erro: 'Funcionalidade indisponível.' });
  }

  const valor = Number(req.query.valor);
  if (!Number.isFinite(valor) || valor < 0) {
    return res.status(400).json({ erro: 'Informe um valor numérico maior ou igual a zero.' });
  }

  const valorDesconto = Math.round(valor * PERCENTUAL_DESCONTO_PROMO * 100) / 100;
  res.json({
    valorOriginal: valor,
    percentual: PERCENTUAL_DESCONTO_PROMO * 100,
    desconto: valorDesconto,
    valorFinal: Math.round((valor - valorDesconto) * 100) / 100,
  });
}

module.exports = { status, desconto };
