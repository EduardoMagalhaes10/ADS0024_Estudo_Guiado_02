# AgriGest API - imagem de produção (backend Node.js + Express + node:sqlite)
# O módulo nativo node:sqlite exige Node 22.5+.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_FILE=/app/data/agrigest.db \
    FEATURE_DESCONTO_PROMO=false

# Correção de vulnerabilidades do sistema operacional (Seção 9, análise com Trivy).
RUN apk upgrade --no-cache

# Copiar só os manifestos primeiro aproveita o cache de camadas do Docker:
# se o código mudar mas as dependências não, o 'npm ci' não roda de novo.
COPY backend/package.json backend/package-lock.json ./
# Depois de instalar as dependências, remove o npm/yarn da imagem final: o app roda
# só com 'node', e as ferramentas de build carregam pacotes com vulnerabilidades.
RUN npm ci --omit=dev \
 && npm cache clean --force \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY backend/src ./src

# Pasta do banco SQLite, com permissão para o usuário não-root
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# O seed é idempotente: cria o schema e o usuário admin se ainda não existirem.
CMD ["sh", "-c", "node src/db/seed.js && node src/server.js"]