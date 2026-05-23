# Seat Reservation Platform

A public seat reservation system where authenticated users can view, hold, and reserve seats through a secure payment flow. Built as a demonstration of engineering judgment, system design, and practical trade-offs.

> **SDLC Score: 8.2/10** — See [Project Consideration](docs/project-consideration.md) for full analysis.

## Architecture

```
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│   React SPA    │──────▶│   NestJS API   │──────▶│  PostgreSQL    │
│  (Vite + TS)   │       │  (REST + JWT)  │       │  (DrizzleORM)  │
└────────────────┘       └────────────────┘       └────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
             Google OAuth   Napas Pay   Cron Jobs
```

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, TypeScript, Zustand, TailwindCSS |
| Backend | NestJS, DrizzleORM, PostgreSQL 15, Passport.js |
| Auth | Google OAuth 2.0, JWT (httpOnly cookie, 90-day session) |
| Payment | Napas gateway (Vietnamese online banking, sandbox) + Mock payment |
| Infra | AWS (ECS Fargate, RDS, ALB, S3+CloudFront), Terraform |
| CI/CD | GitHub Actions (lint, test, security scan, deploy) |
| Testing | Jest (unit + integration), Playwright (E2E) |
| Security | CodeQL, Gitleaks, Trivy, OWASP security headers |
| Package Manager | Bun |

## Features

- **3 reservable seats** with real-time availability
- **Google Sign-In** with 90-day session persistence
- **Pessimistic seat locking** — prevents double-booking via `SELECT FOR UPDATE`
- **5-minute hold window** — auto-releases if payment isn't completed
- **Napas payment integration** — redirect-based, IPN webhook verification
- **Mock payment** — instant demo flow for testing without payment gateway
- **Email notifications** — confirmation email with PDF ticket attachment
- **Security hardened** — OWASP headers, rate limiting, input validation
- **Fail-fast config** — Zod-validated environment variables at startup
- **Multi-environment** — Local, Development, UAT, Production configs

> 📋 Full user stories & acceptance criteria: [`docs/requirements/user-stories.md`](docs/requirements/user-stories.md)

## Quick Start (Local)

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.1
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com/apis/credentials))

### Setup

```bash
# 1. Clone
git clone git@github.com:brucetrantech/reservation-seats.git
cd reservation-seats

# 2. Install dependencies
bun install

# 3. Generate .env files from templates
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh

# 4. Fill in your credentials
#    → apps/api/.env   (Google OAuth, JWT secret, Napas keys)
#    → apps/web/.env   (API URL)

# 5. Start PostgreSQL
docker compose up -d

# 6. Run migrations & seed
bun run --filter api db:migrate
bun run --filter api db:seed

# 7. Start development servers
bun run dev
```

The API runs at **http://localhost:3000** and the frontend at **http://localhost:5173**.

## Project Structure

```
reservation-seats/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/     # Google OAuth, JWT, guards
│   │   │   │   ├── seats/    # Seat availability + cron expiry
│   │   │   │   ├── bookings/ # Hold & confirm logic
│   │   │   │   ├── payments/ # Napas + Mock payment
│   │   │   │   └── notifications/ # Email + PDF ticket
│   │   │   ├── database/     # Drizzle schema, migrations, repositories
│   │   │   ├── config/       # Env validation (Zod)
│   │   │   └── common/       # Guards, decorators, middleware
│   │   └── test/             # Integration tests
│   ├── web/                  # React frontend
│   │   └── src/
│   │       ├── pages/        # Login, Seats, Payment, Confirmation
│   │       ├── stores/       # Zustand (auth, seat, booking)
│   │       └── api/          # HTTP client
│   └── e2e/                  # Playwright E2E tests
├── docs/                     # Project documentation
│   ├── requirements/         # User stories, test plan
│   └── project-consideration.md  # SDLC analysis & scaling plan
├── environments/             # Multi-environment configs
├── infra/                    # Terraform (AWS)
├── .github/workflows/        # CI/CD + security pipelines
├── SECURITY.md               # Security policy & OWASP compliance
├── docker-compose.yml        # Local PostgreSQL
└── Dockerfile.api            # Production API image
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| GET | `/health` | — | Health check |
| GET | `/auth/google` | — | Initiate Google OAuth |
| GET | `/auth/google/callback` | — | OAuth callback |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/logout` | 🔒 | Revoke session |
| GET | `/auth/me` | 🔒 | Current user profile |
| GET | `/seats` | — | List seats + status |
| POST | `/bookings/hold` | 🔒 | Hold a seat (5 min) |
| GET | `/bookings/:id` | 🔒 | Booking details |
| POST | `/bookings/:id/cancel` | 🔒 | Cancel booking |
| POST | `/payments/create` | 🔒 | Create Napas payment |
| GET | `/payments/return` | — | Payment return redirect |
| POST | `/payments/ipn` | — | Napas IPN webhook |

## Core Business Flow

```
1. User views seats        → GET /seats (public)
2. User signs in           → Google OAuth → JWT cookie (90-day)
3. User holds a seat       → POST /bookings/hold → seat locked 5 min
4. User pays               → POST /payments/create → redirect to Napas
5. Payment confirmed       → IPN webhook → seat reserved permanently
   └── If timeout/fail     → seat auto-released back to available
```

## Environment Configuration

This project supports **4 environments**: Local, Development, UAT, and Production.

| Environment | Trigger | Secrets |
|-------------|---------|---------|
| Local | `bun run dev` | `.env` file |
| Development | Push to `main` | GitHub Secrets |
| UAT | Push to `release/*` | GitHub Secrets |
| Production | Git tag `v*` | AWS Secrets Manager |

> 📖 Full environment matrix and setup: [`environments/README.md`](environments/README.md)

| File | Purpose |
|------|---------|
| `apps/api/.env.example` | Backend: DB, OAuth, JWT, Napas, SMTP |
| `environments/.env.development` | Shared dev environment template |
| `environments/.env.uat` | UAT environment template |
| `environments/.env.production` | Production environment template |

## Scripts

| Command | Description |
|---------|-------------|
| `bun install` | Install all workspace dependencies |
| `bun run dev` | Start API + Web in development |
| `bun run build` | Production build (all apps) |
| `bun run lint` | ESLint across all workspaces |
| `bun run test` | Run unit tests |
| `bun run test:cov` | Run unit tests with coverage report |
| `bun run test:integration` | Run integration tests (needs DB) |
| `bun run test:e2e` | Run Playwright E2E tests |
| `bun run --filter api db:migrate` | Apply database migrations |
| `bun run --filter api db:seed` | Seed 3 seats |
| `bun run --filter api db:generate` | Generate migration from schema |
| `bun run --filter api db:studio` | Open Drizzle Studio |
| `docker compose up -d` | Start PostgreSQL |
| `docker compose down -v` | Stop & remove DB data |

## Testing

```bash
# Unit tests (37 tests across 7 suites)
bun run test

# Integration tests (API endpoints with real DB)
bun run test:integration

# E2E tests (Playwright browser automation)
bun run test:e2e
```

| Layer | Coverage | Tools |
|-------|----------|-------|
| Unit | Services, middleware, utilities | Jest, ts-jest |
| Integration | API endpoints, auth guards, DB transactions | Jest, Supertest |
| E2E | User flows (seats, auth, reservation) | Playwright |

> 📋 Test strategy details: [`docs/requirements/test-plan.md`](docs/requirements/test-plan.md)

## Deployment (AWS)

```bash
# 1. Configure Terraform variables
cd infra && cp terraform.tfvars.example terraform.tfvars
# Fill in values, then:
terraform init && terraform apply

# 2. Push API image to ECR
docker build -f Dockerfile.api -t reservation-api .
# Tag & push (see setup guide)

# 3. Deploy frontend
cd apps/web && bun run build
aws s3 sync dist/ s3://<bucket> --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

Full deployment guide: [Section 8.2 in IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

## CI/CD Pipelines

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main | Lint, unit tests, integration tests, build |
| `security.yml` | Push/PR + weekly | CodeQL, Gitleaks, Trivy, dependency audit |
| `deploy-api.yml` | Push to main (api changes) | Build & deploy API to ECS |
| `deploy-web.yml` | Push to main (web changes) | Build & deploy frontend to S3+CloudFront |
| `deploy-uat.yml` | Push to release/* | Deploy to UAT + run E2E tests |
| `deploy-prod.yml` | Tag v* | Deploy to production (with environment approval) |

## Design Decisions & Trade-offs

| Decision | Reasoning |
|----------|-----------|
| JWT in httpOnly cookie | No XSS token theft; trade-off: can't revoke instantly (mitigated by short access token + refresh rotation) |
| Pessimistic DB lock | Simple, correct for 3 seats; wouldn't scale to 10K without a queue |
| 5-min seat hold | Balances UX (enough time to pay) vs fairness (don't block others forever) |
| Redirect-based payment | Napas handles PCI compliance; simpler than embedded iframe |
| ECS Fargate over Lambda | Persistent connections, predictable latency, simpler debugging |
| Drizzle over Prisma | Lighter runtime, better SQL control, no code generation step |
| Zod env validation | Fail fast at startup, not at runtime when a key is first accessed |

## Security

- **OWASP Top 10 compliant** — security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate limiting** — 100 requests/min per IP
- **CSRF protection** via SameSite=Strict cookies
- **Input validation** — class-validator (backend), Zod (config)
- **Payment signature** — HMAC-SHA512 verification on IPN callbacks
- **CORS** restricted to frontend origin only
- **Secret scanning** — Gitleaks pre-commit + CI
- **Container scanning** — Trivy for Docker vulnerabilities
- **SAST** — CodeQL for code-level security analysis
- **Secrets management** — env vars locally, AWS Secrets Manager in production

> 🔒 Full security policy & OWASP compliance matrix: [`SECURITY.md`](SECURITY.md)

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/requirements/user-stories.md`](docs/requirements/user-stories.md) | User stories & acceptance criteria (6 epics, 13 stories) |
| [`docs/requirements/test-plan.md`](docs/requirements/test-plan.md) | Testing strategy & coverage targets |
| [`docs/project-consideration.md`](docs/project-consideration.md) | SDLC assessment, feature analysis, scale-up plan |
| [`environments/README.md`](environments/README.md) | Multi-environment configuration guide |
| [`SECURITY.md`](SECURITY.md) | Security policy & OWASP Top 10 compliance |

## License

Private — assessment submission.
