# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: security@reservation-seats.example.com
3. Include: description, steps to reproduce, potential impact
4. Expected response time: 48 hours

## Security Measures

### Application Security

| Measure | Implementation | Status |
|---------|---------------|--------|
| Input Validation | class-validator + ValidationPipe (whitelist, forbidNonWhitelisted) | ✅ Active |
| SQL Injection Prevention | Drizzle ORM parameterized queries | ✅ Active |
| XSS Prevention | Security headers (CSP, X-XSS-Protection) | ✅ Active |
| CSRF Protection | SameSite cookies + CORS origin restriction | ✅ Active |
| Clickjacking | X-Frame-Options: DENY | ✅ Active |
| Rate Limiting | In-memory rate limiter (100 req/min) | ✅ Active |
| Authentication | JWT (httpOnly, secure cookies) + Google OAuth | ✅ Active |
| Token Rotation | Refresh token rotation on each use | ✅ Active |
| Session Revocation | Manual logout + automatic expiry | ✅ Active |
| Payment Signature | HMAC-SHA512 verification (Napas IPN) | ✅ Active |
| HTTPS Enforcement | HSTS header (max-age: 1 year) | ✅ Active |

### Infrastructure Security

| Measure | Implementation | Status |
|---------|---------------|--------|
| Database SSL | Enforced in production via DATABASE_SSL=true | ✅ Active |
| Network Isolation | VPC with private subnets for RDS | ✅ Active |
| Secret Management | GitHub Secrets (Dev/UAT) + AWS Secrets Manager (Prod) | ✅ Active |
| Container Scanning | Trivy in CI/CD pipeline | ✅ Active |
| Dependency Audit | npm audit + CodeQL in CI | ✅ Active |
| Secret Detection | Gitleaks pre-commit + CI | ✅ Active |

### CI/CD Security

| Measure | Implementation | Status |
|---------|---------------|--------|
| CodeQL SAST | Weekly + on PR | ✅ Active |
| Dependency Audit | On every PR | ✅ Active |
| Secret Scanning | Gitleaks on push | ✅ Active |
| Container Scan | Trivy on main branch | ✅ Active |
| Environment Protection | GitHub environment approvals (prod) | ✅ Active |

## OWASP Top 10 Compliance

| # | Risk | Mitigation |
|---|------|-----------|
| A01 | Broken Access Control | JWT auth guard on all routes, @Public decorator for exceptions, user-scoped DB queries |
| A02 | Cryptographic Failures | JWT with HS256, bcrypt-like hashing for refresh tokens, HTTPS enforced |
| A03 | Injection | Drizzle ORM (parameterized), class-validator input validation, no raw SQL |
| A04 | Insecure Design | Pessimistic locking for seats, transaction isolation, token rotation |
| A05 | Security Misconfiguration | Env validation at startup (Zod), security headers, X-Powered-By removed |
| A06 | Vulnerable Components | Automated dependency auditing (CI), Trivy container scan |
| A07 | Auth Failures | Rate limiting, token expiry, session revocation, no credentials in URLs |
| A08 | Data Integrity Failures | HMAC-SHA512 payment verification, signed JWTs |
| A09 | Logging Failures | NestJS Logger on all operations, email failures logged |
| A10 | SSRF | No user-controlled URL fetching, all external URLs from env config only |

## Pre-Commit Hooks (Recommended)

```bash
# Install husky + gitleaks locally
npx husky init
echo "gitleaks protect --staged" > .husky/pre-commit
```
