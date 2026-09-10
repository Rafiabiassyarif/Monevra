# =============================================================================
# Monevra — Dockerfile (opsional, alternatif deploy non-Docker di DEPLOY.md)
#
# Build dari ROOT project (butuh backend/ + frontend/dist):
#   cd deploy && docker compose up -d --build
#
# Struktur di dalam image HARUS begini karena server.js menyajikan frontend
# lewat path relatif '../frontend/dist' terhadap folder backend/:
#   /app/backend/server.js
#   /app/backend/node_modules
#   /app/frontend/dist/
# =============================================================================
FROM node:22-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Backend + dependency produksi
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

# Jangan jalan sebagai root
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3001
WORKDIR /app/backend

# Healthcheck pakai endpoint /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
