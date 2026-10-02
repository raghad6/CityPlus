FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npx nest build
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
# Sync the schema, optionally load demo data, then start.
CMD ["sh", "-c", "npx prisma db push --skip-generate && if [ \"$SEED_DEMO\" = \"true\" ]; then npx ts-node --transpile-only prisma/seed.ts; fi && node dist/main.js"]
