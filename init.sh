#!/bin/bash

# Innogram Project Initialization Script
# This script creates the basic project structure for the Innogram social media application

echo "🚀 Initializing Innogram Project Structure..."

# Create main project structure
echo "📁 Creating main project structure..."

# Root directories
directories=(
    "apps"
    "apps/core_microservice"
    "apps/auth_microservice"
    "apps/notifications_consumer_microservice"
    "apps/client_app"
    "packages"
    "packages/shared"
    "packages/types"
    "scripts"
    "docker"
    ".github"
    ".github/workflows"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "  ✅ Created: $dir"
    fi
done

# Create root package.json
echo "📦 Creating root package.json..."
cat > package.json << 'EOF'
{
  "name": "innogram",
  "version": "1.0.0",
  "description": "Innogram - Social Media Application",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "db:migrate": "turbo run db:migrate",
    "db:seed": "turbo run db:seed"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0"
  }
}
EOF

# Create turbo.json
echo "⚡ Creating turbo.json..."
cat > turbo.json << 'EOF'
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
EOF

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Database
*.db
*.sqlite

# Docker
.dockerignore
EOF

# Create .env.example
echo "🔐 Creating .env.example..."
cat > .env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/innogram
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=innogram_user
POSTGRES_PASSWORD=innogram_password
POSTGRES_DB=innogram

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Application URLs
CORE_SERVICE_URL=http://localhost:3001
AUTH_SERVICE_URL=http://localhost:3002
NOTIFICATIONS_SERVICE_URL=http://localhost:3003
CLIENT_URL=http://localhost:3000

# Message Broker
RABBITMQ_URL=amqp://localhost:5672
KAFKA_BROKERS=localhost:9092

# Development
NODE_ENV=development
LOG_LEVEL=debug
EOF

# Create docker-compose.yml
echo "🐳 Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: innogram-postgres
    environment:
      POSTGRES_DB: innogram
      POSTGRES_USER: innogram_user
      POSTGRES_PASSWORD: innogram_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - innogram-network

  redis:
    image: redis:7-alpine
    container_name: innogram-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - innogram-network

  rabbitmq:
    image: rabbitmq:3-management
    container_name: innogram-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: innogram
      RABBITMQ_DEFAULT_PASS: innogram_password
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - innogram-network

volumes:
  postgres_data:
  redis_data:

networks:
  innogram-network:
    driver: bridge
EOF

# Create README.md
echo "📚 Creating README.md..."
cat > README.md << 'EOF'
# Innogram - Social Media Application

A modern social media application built with microservices architecture.

## Project Structure

```
innogram/
├── apps/
│   ├── core_microservice/          # NestJS API Gateway & Business Logic
│   ├── auth_microservice/          # Express.js Authentication Service
│   ├── notifications_consumer_microservice/  # NestJS Notifications Service
│   └── client_app/                 # Next.js Frontend Application
├── packages/
│   ├── shared/                     # Shared utilities and constants
│   └── types/                      # Shared TypeScript types
├── scripts/                       # Build and deployment scripts
├── docker/                        # Docker configurations
└── .github/workflows/             # CI/CD pipelines
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- Docker (optional)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start infrastructure services:**
   ```bash
   npm run docker:up
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all services
- `npm run test` - Run tests for all services
- `npm run lint` - Lint all services
- `npm run type-check` - Type check all services
- `npm run docker:up` - Start infrastructure services
- `npm run docker:down` - Stop infrastructure services

## Services

### Core Microservice (Port 3001)
- NestJS API Gateway
- Main business logic
- Database operations
- Real-time features

### Authentication Microservice (Port 3002)
- Express.js service
- JWT token management
- OAuth 2.0 integration
- Session management

### Notifications Consumer (Port 3003)
- NestJS service
- Message processing
- Email notifications
- Real-time notifications

### Client Application (Port 3000)
- Next.js frontend
- React components
- User interface
- Real-time updates

## Development Workflow

1. Each feature should be focused and testable
2. Follow microservices architecture patterns
3. Implement features incrementally
4. Write tests for each component

## Contributing

1. Create a feature branch: `git checkout -b feature/INO-XXX`
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Create a Pull Request

## License

MIT
EOF

# Create TypeScript config
echo "⚙️ Creating TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/shared/*": ["./packages/shared/*"],
      "@/types/*": ["./packages/types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
  "exclude": ["node_modules", "dist", "build", ".next"]
}
EOF

# Create ESLint config
echo "🔍 Creating ESLint configuration..."
cat > .eslintrc.json << 'EOF'
{
  "root": true,
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "prettier/prettier": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": ["error", 2],
    "comma-dangle": ["error", "es5"],
    "max-len": [
      "error",
      {
        "code": 80,
        "ignoreUrls": true,
        "ignoreStrings": true
      }
    ]
  },
  "ignorePatterns": ["node_modules/", "dist/", "build/", ".next/"]
}
EOF

echo "✅ Project structure initialized successfully!"
echo "📋 Next steps:"
echo "  1. Run: npm install"
echo "  2. Copy .env.example to .env and configure"
echo "  3. Run: npm run docker:up"
echo "  4. Start implementing features"