# Test Plan

## Overview

This document defines the testing strategy for the Reservation Seats platform, covering unit tests, integration tests, and end-to-end (E2E) tests.

## Testing Pyramid

```
       ┌─────────┐
       │  E2E    │  ← Playwright (critical user journeys)
      ┌┴─────────┴┐
      │Integration │  ← API + DB (module boundaries)
    ┌─┴────────────┴─┐
    │   Unit Tests    │  ← Services, utilities (isolated logic)
    └────────────────┘
```

## Test Coverage Targets

| Layer | Target | Tool |
|-------|--------|------|
| Unit | ≥ 80% of service logic | Jest |
| Integration | All API endpoints | Jest + Supertest |
| E2E | Critical user flows | Playwright |

## Environment

- **Test database**: Separate PostgreSQL instance (`reservation_seats_test`)
- **Test runner**: Jest 29 (API), Vitest (Web), Playwright (E2E)
- **CI**: All tests run in GitHub Actions on every PR

## Test Data Strategy

- Unit tests: Mocked repositories
- Integration tests: Real database with transaction rollback
- E2E tests: Seeded database reset before each test suite

## Running Tests

```bash
# Unit tests
bun run test

# Unit tests with coverage
bun run test:cov

# Integration tests
bun run test:integration

# E2E tests (requires running app)
bun run test:e2e
```
