# OneHR API — Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
# Install pnpm
RUN npm install -g pnpm
# Copy monorepo root
COPY package.json pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src
RUN pnpm install --frozen-lockfile --registry https://registry.npmmirror.com || pnpm install --registry https://registry.npmmirror.com
RUN pnpm --filter onehr-api exec prisma generate --schema=./prisma/schema.prisma
RUN pnpm --filter onehr-api exec tsc -p apps/api/tsconfig.json

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3001/v1/health || exit 1
CMD ["node", "apps/api/dist/main.js"]
