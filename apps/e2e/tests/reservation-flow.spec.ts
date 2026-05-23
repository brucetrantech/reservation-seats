import { test, expect } from '@playwright/test';

test.describe('Reservation Flow (E2E)', () => {
  // Note: Full flow tests require authenticated session.
  // In CI, use a mock auth provider or pre-seeded session cookies.

  test('API health check is accessible', async ({ request }) => {
    const apiBase = process.env.E2E_API_URL || 'http://localhost:3000';
    const response = await request.get(`${apiBase}/health`);

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('seats API returns data without auth', async ({ request }) => {
    const apiBase = process.env.E2E_API_URL || 'http://localhost:3000';
    const response = await request.get(`${apiBase}/seats`);

    expect(response.ok()).toBe(true);
    const seats = await response.json();
    expect(Array.isArray(seats)).toBe(true);
    expect(seats.length).toBe(3);
  });

  test('hold endpoint requires authentication', async ({ request }) => {
    const apiBase = process.env.E2E_API_URL || 'http://localhost:3000';
    const response = await request.post(`${apiBase}/bookings/hold`, {
      data: { seatId: '00000000-0000-0000-0000-000000000001' },
    });

    expect(response.status()).toBe(401);
  });

  test('payment create endpoint requires authentication', async ({ request }) => {
    const apiBase = process.env.E2E_API_URL || 'http://localhost:3000';
    const response = await request.post(`${apiBase}/payments/create`, {
      data: { bookingId: '00000000-0000-0000-0000-000000000001', method: 'mock' },
    });

    expect(response.status()).toBe(401);
  });

  test('IPN endpoint rejects invalid signatures', async ({ request }) => {
    const apiBase = process.env.E2E_API_URL || 'http://localhost:3000';
    const response = await request.post(`${apiBase}/payments/ipn`, {
      data: { vnp_TxnRef: 'fake_txn', vnp_SecureHash: 'invalid' },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.RspCode).toBe('97');
  });
});
