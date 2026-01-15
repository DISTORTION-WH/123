FROM node:20.10.0-alpine AS base
WORKDIR /app
RUN npm install -g turbo@1.10.16

FROM base AS prune
COPY . .
RUN turbo prune --scope=client_app --docker

FROM base AS builder
WORKDIR /app
COPY --from=prune /app/out/json/ .
COPY --from=prune /app/out/package-lock.json ./package-lock.json
RUN npm install

COPY --from=prune /app/out/full/ .
RUN turbo run build --filter=client_app...

FROM node:20.10.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/client_app/public ./apps/client_app/public

COPY --from=builder --chown=nextjs:nodejs /app/apps/client_app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/client_app/.next/static ./apps/client_app/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/client_app/server.js"]