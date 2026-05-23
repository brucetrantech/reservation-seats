# Seat Reservation Platform

A public seat reservation system where authenticated users can view, hold, and reserve seats through a secure payment flow. Built as a demonstration of engineering judgment, system design, and practical trade-offs.

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
| Payment | Napas gateway (Vietnamese online banking, sandbox) |
| Infra | AWS (ECS Fargate, RDS, ALB, S3+CloudFront), Terraform |
| CI/CD | GitHub Actions |
| Package Manager | Bun |

## Features

- **3 reservable seats** with real-time availability
- **Google Sign-In** with 90-day session persistence
- **Pessimistic seat locking** — prevents double-booking via `SELECT FOR UPDATE`
- **5-minute hold window** — auto-releases if payment isn't completed
- **Napas payment integration** — redirect-based, IPN webhook verification
- **Fail-fast config** — Zod-validated environment variables at startup

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
│   │   │   │   ├── seats/    # Seat availability
│   │   │   │   ├── bookings/ # Hold & confirm logic
│   │   │   │   └── payments/ # Napas integration
│   │   │   ├── database/     # Drizzle schema, migrations, seed
│   │   │   ├── config/       # Env validation (Zod)
│   │   │   └── common/       # Guards, decorators, filters
│   │   └── package.json
│   └── web/                  # React frontend
│       ├── src/
│       │   ├── pages/        # Login, Seats, Payment, Confirmation
│       │   ├── components/   # SeatMap, AuthGuard, etc.
│       │   ├── stores/       # Zustand (auth, seat, booking)
│       │   └── api/          # HTTP client
│       └── package.json
├── infra/                    # Terraform (AWS)
├── scripts/                  # Setup & utility scripts
├── .github/workflows/        # CI/CD pipelines
├── docker-compose.yml        # Local PostgreSQL
├── Dockerfile.api            # Production API image
└── package.json              # Workspace root
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

Each site has a `.env.example` template. Run `./scripts/setup-env.sh` to generate all `.env` files, then paste your real values.

| File | Purpose |
|------|---------|
| `apps/api/.env.example` | Backend: DB, OAuth, JWT, Napas |
| `apps/web/.env.example` | Frontend: API URL |
| `infra/terraform.tfvars.example` | AWS infrastructure variables |

See the [Environment Configuration section](IMPLEMENTATION_PLAN.md#7-environment-configuration-strategy) in the implementation plan for full details.

## Scripts

| Command | Description |
|---------|-------------|
| `bun install` | Install all workspace dependencies |
| `bun run dev` | Start API + Web in development |
| `bun run build` | Production build (all apps) |
| `bun run lint` | ESLint across all workspaces |
| `bun run test` | Run all tests |
| `bun run --filter api db:migrate` | Apply database migrations |
| `bun run --filter api db:seed` | Seed 3 seats |
| `bun run --filter api db:generate` | Generate migration from schema |
| `bun run --filter api db:studio` | Open Drizzle Studio |
| `docker compose up -d` | Start PostgreSQL |
| `docker compose down -v` | Stop & remove DB data |

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

- CSRF protection via SameSite=Strict cookies
- Rate limiting on auth and payment endpoints
- HMAC-SHA256 signature verification on payment callbacks
- Input validation (class-validator on backend, Zod on frontend)
- CORS restricted to frontend origin
- Secrets never committed — loaded from env vars / AWS Secrets Manager

## License

Private — assessment submission.
