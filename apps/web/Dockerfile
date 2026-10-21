# OneHR Web — Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile --registry https://registry.npmmirror.com || pnpm install --registry https://registry.npmmirror.com
RUN NEXT_OUTPUT=server pnpm --filter onehr-web exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# The container runs `next start`, which needs a server build — the static
# export (the default) has no server to start. See apps/web/next.config.js.
ENV NEXT_OUTPUT=server
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || wget -qO- http://localhost:3000/ || exit 1
CMD ["node", "apps/web/node_modules/next/dist/bin/next", "start", "-p", "3000", "--hostname", "0.0.0.0"]
