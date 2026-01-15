FROM node:20.10.0-alpine AS base
WORKDIR /app
RUN npm install -g turbo@1.10.16

FROM base AS prune
COPY . .
RUN turbo prune --scope=@innogram/notifications --docker

FROM base AS builder
COPY --from=prune /app/out/json/ .
COPY --from=prune /app/out/package-lock.json ./package-lock.json
RUN npm install

COPY --from=prune /app/out/full/ .
RUN turbo run build --filter=@innogram/notifications...

FROM node:20.10.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/notifications_consumer_microservice/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/notifications_consumer_microservice/package.json ./package.json

EXPOSE 3003
CMD ["node", "dist/main"]