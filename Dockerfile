FROM node:24-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma.config.js ./prisma.config.js
COPY backend/prisma ./prisma
RUN npm ci --include=dev && npx prisma generate

COPY backend ./
COPY index.html app.js admin.html admin.js trial-order-parser.mjs styles.css firebase-config.js firebase-data.js manifest.webmanifest service-worker.js /app/
COPY icons /app/icons

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && exec node --import tsx server.js"]
