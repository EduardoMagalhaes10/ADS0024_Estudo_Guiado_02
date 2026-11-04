// Feature Flags (Feature Toggles) controladas por variável de ambiente.
//
// O valor é lido A CADA CHAMADA (e não uma vez só no carregamento do módulo).
// Assim, os testes conseguem alternar a flag e, em produção, basta reiniciar
// o container com outro valor de ambiente: não é preciso novo build nem novo deploy
// de código, só uma mudança de configuração.
function isEnabled(valor) {
  return String(valor || 'false').toLowerCase() === 'true';
}

function descontoPromoAtivo() {
  return isEnabled(process.env.FEATURE_DESCONTO_PROMO);
}

// Percentual de desconto da promoção (10%).
const PERCENTUAL_DESCONTO_PROMO = 0.1;

module.exports = { isEnabled, descontoPromoAtivo, PERCENTUAL_DESCONTO_PROMO };
