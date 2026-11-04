# Estudo Guiado 02: Pipeline DevSecOps (AgriGest, Node.js)

Adaptação do roteiro (Python/Flask) para o projeto Node.js. Equivalências:

| Roteiro (Python)        | Este projeto (Node.js)                                   |
|-------------------------|----------------------------------------------------------|
| Bandit (SAST)           | ESLint + `eslint-plugin-security` (`npm run sast`)       |
| pip-audit (SCA)         | `npm audit` (`npm run audit:deps`)                       |
| TruffleHog              | TruffleHog (igual, via Docker)                           |
| Trivy                   | Trivy (igual, via Docker)                                |
| pytest                  | `node --test` (`npm test`)                               |
| `/api/status`, `/api/desconto` | idem, em `src/controllers/features.controller.js` |

## O que foi adicionado
- `backend/src/config/features.js`: Feature Flag `FEATURE_DESCONTO_PROMO` (lida a cada requisição).
- `GET /api/status` (mostra a flag) e `GET /api/desconto?valor=100` (10% de desconto; 404 com a flag desligada).
- `backend/tests/feature-flag.test.js`: testes com a flag ligada, desligada e ausente.
- `backend/eslint.security.config.js` + scripts `sast`, `sast:report`, `audit:deps`.
- `Dockerfile`: `FEATURE_DESCONTO_PROMO=false` por padrão.
- `.github/workflows/devsecops-pipeline.yml` (substitui o `ci.yml`).

## Testar localmente
```bash
cd backend
npm ci
npm test                       # 20 testes
FEATURE_DESCONTO_PROMO=true npm start
curl localhost:3001/api/status
curl "localhost:3001/api/desconto?valor=100"
```
(No PowerShell: `$env:FEATURE_DESCONTO_PROMO="true"; npm start`.)

## Estado inicial = pipeline falhando de propósito (para o vídeo)
1. **SAST falha** (`npm run sast`): 3 alertas.
   - `features.js` → `security/detect-object-injection`
   - `db/connection.js` (2x) → `security/detect-non-literal-fs-filename`
2. **Troca do comando** (análogo ao Bandit): `npm run sast` usa `--max-warnings 0`
   (qualquer alerta reprova). `npm run sast:report` roda as mesmas regras, mas
   alertas são apenas avisos e o pipeline passa. A verificação continua visível,
   só deixa de bloquear.
3. **Correção do código** (melhor opção: manter o comando rígido e corrigir):
   - `features.js`: trocar a leitura dinâmica `process.env[nome]` por acesso direto:
     ```js
     function isEnabled(valor) {
       return String(valor || 'false').toLowerCase() === 'true';
     }
     function descontoPromoAtivo() {
       return isEnabled(process.env.FEATURE_DESCONTO_PROMO);
     }
     ```
   - `db/connection.js`: o caminho vem de variável de ambiente do operador, então é
     **falso positivo**. Suprimir só nessa linha, com justificativa:
     ```js
     /* eslint-disable security/detect-non-literal-fs-filename -- caminho vem de configuração, não de input externo */
     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
     /* eslint-enable security/detect-non-literal-fs-filename */
     ```
4. **SCA falha** (`npm run audit:deps`): `body-parser` (HIGH, DoS, GHSA-27r3-jxmh-p828).
   Correção: `cd backend && npm audit fix` (atualiza o `package-lock.json`), commit e push.
   Sobram 5 vulnerabilidades *moderate* só em devDependencies (ESLint), que o gate
   (`--omit=dev --audit-level=high`) não bloqueia.
5. **Trivy**: roda na imagem depois do build. Se apontar pacotes do Alpine com
   *Fixed Version*, descomente `RUN apk upgrade --no-cache` no Dockerfile. Se mesmo assim
   falhar, use apenas `--severity CRITICAL` no workflow.
6. **Segredos**: para demonstrar, commite um arquivo com uma chave de teste e veja o TruffleHog
   bloquear. Remover o arquivo em um novo commit **não** basta (continua no histórico).
   Use `git reset`/reescrita de histórico e **revogue a chave**.

## Observação sobre a troca de versão (Seção 9)
O roteiro pede trocar `VERSAO_PYTHON`. Aqui o equivalente é `VERSAO_NODE`
(só 22+ funciona por causa do `node:sqlite`). Versões de Node não alteram o resultado do
`npm audit`, que olha o `package-lock.json`. Vale mencionar isso na análise.

## Publicação
No push para `main`, a imagem vai para `ghcr.io/<usuario>/<repositorio>` (tags `latest` e SHA)
usando o `GITHUB_TOKEN`. Em *Settings → Actions → General*, deixe as permissões de workflow
como *Read and write* se o push for negado.
