// SAST (Static Application Security Testing) para Node.js.
// Equivalente ao Bandit do roteiro em Python: analisa a AST do código procurando
// padrões inseguros (regex vulnerável, fs com caminho dinâmico, object injection etc.).
const security = require('eslint-plugin-security');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'data/', 'tests/'] },
  security.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
];
