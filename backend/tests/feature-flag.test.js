// Testes da Feature Flag FEATURE_DESCONTO_PROMO: a rota /api/desconto precisa se
// comportar de forma diferente com a flag LIGADA e DESLIGADA.
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agrigest-flag-'));
process.env.DATABASE_FILE = path.join(tmpDir, 'test.db');
process.env.JWT_SECRET = 'segredo_apenas_para_testes';

const app = require('../src/app');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  delete process.env.FEATURE_DESCONTO_PROMO;
  server.close();
  require('../src/db/connection').close();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3 });
  } catch {
    // limpeza de arquivo temporário é "melhor esforço"
  }
});

// A flag é lida a cada requisição, então basta alterar a variável de ambiente.
function setFlag(valor) {
  process.env.FEATURE_DESCONTO_PROMO = valor;
}

test('com a flag DESATIVADA, /api/desconto responde 404', async () => {
  setFlag('false');
  const res = await fetch(`${base}/api/desconto?valor=100`);
  assert.equal(res.status, 404);
});

test('com a flag ATIVADA, /api/desconto aplica 10% de desconto', async () => {
  setFlag('true');
  const res = await fetch(`${base}/api/desconto?valor=100`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.desconto, 10);
  assert.equal(data.valorFinal, 90);
});

test('com a flag ATIVADA, valor inválido retorna 400', async () => {
  setFlag('true');
  const res = await fetch(`${base}/api/desconto?valor=abc`);
  assert.equal(res.status, 400);
});

test('sem a variável definida, a flag fica desligada por padrão', async () => {
  delete process.env.FEATURE_DESCONTO_PROMO;
  const res = await fetch(`${base}/api/desconto?valor=100`);
  assert.equal(res.status, 404);
});

test('/api/status reflete o estado da flag', async () => {
  setFlag('false');
  let data = await (await fetch(`${base}/api/status`)).json();
  assert.equal(data.features.FEATURE_DESCONTO_PROMO, false);

  setFlag('true');
  data = await (await fetch(`${base}/api/status`)).json();
  assert.equal(data.features.FEATURE_DESCONTO_PROMO, true);
});
