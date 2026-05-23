# Environment Configuration

This project supports 4 environments: **Local**, **Development**, **UAT**, and **Production**.

## Environment Files

```
environments/
├── .env.development    # Shared dev environment (AWS dev account)
├── .env.uat            # User Acceptance Testing
└── .env.production     # Live production
```

The local environment uses `apps/api/.env` (gitignored), copied from `apps/api/.env.example`.

## Environment Matrix

| Property | Local | Development | UAT | Production |
|----------|-------|-------------|-----|------------|
| NODE_ENV | development | development | production | production |
| Database | Local Docker | RDS (dev) | RDS (uat) | RDS (prod) |
| SSL | false | true | true | true |
| Payment Gateway | Sandbox/Mock | Sandbox | Sandbox | Production |
| JWT Refresh Expiry | 90d | 90d | 30d | 30d |
| SMTP | Gmail (dev) | SES (dev) | SES (uat) | SES (prod) |
| Secrets Management | .env file | GitHub Secrets | GitHub Secrets | AWS Secrets Manager |

## Setup

### Local Development
```bash
cp apps/api/.env.example apps/api/.env
# Edit .env with your local values
docker compose up -d  # Start PostgreSQL
bun run dev
```

### CI/CD (Dev, UAT, Prod)
Secrets are injected via GitHub Actions secrets and AWS Secrets Manager.
The deployment workflows select the environment configuration automatically based on the target branch/tag.

## Branch → Environment Mapping

| Branch/Trigger | Environment | Workflow |
|----------------|-------------|----------|
| `main` (push) | Development | `deploy-api.yml`, `deploy-web.yml` |
| `release/*` (push) | UAT | `deploy-uat.yml` |
| Git tag `v*` | Production | `deploy-prod.yml` |

## Secrets Management Strategy

| Environment | Method |
|-------------|--------|
| Local | `.env` file (gitignored) |
| Development | GitHub Actions Secrets (environment: `development`) |
| UAT | GitHub Actions Secrets (environment: `uat`) |
| Production | AWS Secrets Manager → ECS Task Definition |
