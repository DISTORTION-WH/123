FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g turbo@^1.10.0

FROM base AS prune
COPY . .
RUN turbo prune --scope=@innogram/auth --docker

FROM base AS builder
WORKDIR /app
COPY --from=prune /app/out/json/ .
COPY --from=prune /app/out/package-lock.json ./package-lock.json
RUN npm install

COPY --from=prune /app/out/full/ .
RUN turbo run build --filter=@innogram/auth...


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs


COPY --from=builder --chown=expressjs:expressjs /app .

USER expressjs

EXPOSE 3002

CMD ["node", "apps/auth_microservice/dist/index.js"]