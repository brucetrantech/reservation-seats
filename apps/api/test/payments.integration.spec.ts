import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Payments (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /payments/create', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/payments/create')
        .send({ bookingId: '00000000-0000-0000-0000-000000000001', method: 'mock' })
        .expect(401);
    });
  });

  describe('GET /payments/return', () => {
    it('should handle return without valid params', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/return')
        .query({ vnp_TxnRef: 'fake', vnp_SecureHash: 'invalid' });

      // Should redirect to frontend with error (302) or return error
      expect([200, 302]).toContain(response.status);
    });
  });

  describe('POST /payments/ipn', () => {
    it('should reject invalid signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments/ipn')
        .send({ vnp_TxnRef: 'fake', vnp_SecureHash: 'invalid' });

      expect(response.body).toHaveProperty('RspCode', '97');
    });
  });
});
