# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Innogram** is a social media application using a microservices architecture. It is a TypeScript monorepo managed with npm workspaces and Turbo for build orchestration.

## Commands

```bash
# Install dependencies
npm install

# Start all services in development mode
npm run dev

# Build all services
npm run build

# Run all tests
npm run test

# Lint all services
npm run lint

# Type-check all services
npm run type-check

# Start/stop infrastructure (Postgres, MongoDB, Redis, RabbitMQ)
npm run docker:up
npm run docker:down

# Database migrations
npm run db:migrate
npm run db:seed
```

### Per-service commands

```bash
# Core microservice (NestJS)
cd apps/core_microservice
npm run start:dev                # Dev server with watch
npm run test                     # Unit tests (Jest)
npm run test:watch               # Tests in watch mode
npm run test -- --testPathPattern=profiles  # Run tests for a specific module
npm run test:e2e                 # E2E tests

# Auth microservice (Express)
cd apps/auth_microservice
npm run dev                      # Dev server with ts-node-dev

# Notifications microservice (NestJS)
cd apps/notifications_consumer_microservice
npm run start:dev

# Client app (Next.js)
cd apps/client_app
npm run dev
```

## Architecture

### Services

| Service | Framework | Port | Database | Purpose |
|---------|-----------|------|----------|---------|
| `apps/core_microservice` | NestJS | 3001 | PostgreSQL (TypeORM) | API gateway, business logic, real-time chat (Socket.io) |
| `apps/auth_microservice` | Express.js | 3002 | MongoDB (Mongoose) | Authentication, JWT, OAuth (Google) |
| `apps/notifications_consumer_microservice` | NestJS | 3003 | None | RabbitMQ consumer, email notifications via Handlebars |
| `apps/client_app` | Next.js 16 | 3000 | None | Frontend (React 19, Tailwind CSS 4) |

### Inter-service Communication

- **HTTP**: Core service validates JWT tokens by calling Auth service at `/internal/auth/validate` via `@nestjs/axios`
- **RabbitMQ (AMQP)**: Async messaging between services
  - `user_sync_queue`: Auth -> Core (syncs new users to PostgreSQL on registration)
  - `notifications_queue`: Core -> Notifications (triggers emails, e.g. `post_liked`, `user_created`)
- **WebSocket**: Socket.io on `/chats` namespace for real-time chat (events: `join_chat`, `send_message`, `typing`, `leave_chat`)

### Infrastructure (Docker Compose)

- **PostgreSQL 15** on port `5435` (mapped from 5432 inside container)
- **MongoDB 6** on port `27017`
- **Redis 7** on port `6379`
- **RabbitMQ 3** on port `5672` (management UI on `15672`)
- All on `innogram-network` bridge network

### Core Microservice Structure

Modules: Auth, Users, Profiles, Posts, Comments, Assets, Chats. Each follows `controller -> service -> TypeORM repository`.

Key paths:
- Entities: `src/database/entities/` (User, Profile, Post, PostAsset, PostLike, Comment, CommentLike, Chat, ChatParticipant, Message, MessageAsset, Asset, ProfileFollow)
- Migrations: `src/database/migrations/`, DataSource config in `src/database/data-source.ts`
- Guards: `src/guards/jwt-auth.guard.ts` (HTTP), `src/chats/guards/ws-jwt.guard.ts` (WebSocket)
- Decorators: `src/decorators/current-user.decorator.ts` — `@CurrentUser()` extracts `{ id, email, role }`
- Constants: `src/constants/services.ts` (injection tokens), `src/constants/error-messages.ts`

All entities use UUID primary keys and `created_at`/`updated_at` timestamp columns.

### Authentication Flow

1. Auth service issues JWT access/refresh tokens; refresh token IDs stored in Redis
2. Core service's `JwtAuthGuard` validates tokens by HTTP call to Auth service `/internal/auth/validate`
3. Auth service checks Redis blacklist on validation; logout blacklists tokens
4. WebSocket connections use `WsJwtGuard` (token from header or query param)
5. `@CurrentUser()` decorator extracts the authenticated user from requests
6. Dual-database sync: users created in MongoDB (Auth), then synced to PostgreSQL (Core) via RabbitMQ + lazy sync on login

### Auth Microservice Specifics

- Routes all under `/internal/auth`: register, login, refresh, validate, logout, forgot-password, reset-password
- Uses **Zod** for validation (not class-validator like the Core service)
- Redis (ioredis) for refresh tokens, blacklisting, and password reset tokens
- Publishes `user_created` to `user_sync_queue` on registration (non-blocking)

### Client App

- Next.js App Router with `output: "standalone"`
- API calls via Axios instance in `src/lib/axios.ts` (base URL: Core service, auto-attaches Bearer token from localStorage)
- React Hook Form + Zod for form validation

### Code Conventions

- DTOs in Core service validated with `class-validator` decorators; DTOs in Auth service use Zod schemas
- Swagger/OpenAPI docs at `http://localhost:3001/api/docs` (auto-generated from controller decorators)
- File uploads use Multer with disk storage to `./uploads`
- Single quotes, trailing commas, semicolons required (Prettier + ESLint enforced)
- 2-space indentation, max 80 char line length
- Feature branches named `feature/INO-XXX`

### Environment Setup

Copy `.env.example` to `.env` and configure. Key variable groups:
- **Database**: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- **Redis**: `REDIS_HOST`, `REDIS_PORT`
- **JWT**: Core uses `JWT_SECRET`; Auth uses separate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- **Services**: `CORE_SERVICE_URL`, `AUTH_SERVICE_URL`, `CLIENT_URL`
- **RabbitMQ**: `RABBITMQ_URL` (default `amqp://localhost:5672`)
- **SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

Note: The `packages/` directory (shared types/utilities) is referenced in workspace config but not yet implemented.
