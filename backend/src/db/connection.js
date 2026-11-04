const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATABASE_FILE = process.env.DATABASE_FILE || './data/agrigest.db';

// Garante que a pasta do arquivo de banco exista
const dir = path.dirname(DATABASE_FILE);
// O caminho vem de variável de ambiente definida pelo operador (não de entrada do usuário),
// portanto o alerta de "caminho não literal" é um falso positivo neste ponto.
/* eslint-disable security/detect-non-literal-fs-filename -- caminho vem de configuração, não de input externo */
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
/* eslint-enable security/detect-non-literal-fs-filename */

const db = new DatabaseSync(DATABASE_FILE);
db.exec('PRAGMA foreign_keys = ON;');

// Aplica o schema (idempotente: usa CREATE TABLE IF NOT EXISTS)
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

module.exports = db;
