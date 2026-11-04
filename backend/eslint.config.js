const js = require('@eslint/js');
const globals = require('globals');
const security = require('eslint-plugin-security');

module.exports = [
  { ignores: ['node_modules/', 'data/'] },
  js.configs.recommended,
    { linterOptions: { reportUnusedDisableDirectives: 'off' } },
  {
    files: ['**/*.js'],
    // Só registra o plugin (sem ativar regras) para os comentários de supressão do SAST
    // serem reconhecidos. As regras de segurança rodam em 'npm run sast'.
    plugins: { security },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // 'next' é obrigatório na assinatura do handler de erro do Express
      'no-unused-vars': ['error', { argsIgnorePattern: '^(next|req|res)$', caughtErrors: 'none' }],
    },
  },
];
