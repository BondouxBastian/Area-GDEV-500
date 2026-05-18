FROM node:20-alpine AS deps
WORKDIR /app

# better-sqlite3 nécessite python3 + make + g++ pour compiler ses bindings natifs
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# ─── Image finale (sans les outils de compilation) ───────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/

EXPOSE 8080
CMD ["node", "src/index.js"]
