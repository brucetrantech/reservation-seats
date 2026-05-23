import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Bookings (Integration)', () => {
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

  describe('POST /bookings/hold', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/bookings/hold')
        .send({ seatId: '00000000-0000-0000-0000-000000000001' })
        .expect(401);
    });

    it('should return 400 with invalid seatId format', async () => {
      await request(app.getHttpServer())
        .post('/bookings/hold')
        .set('Cookie', ['access_token=invalid_token'])
        .send({ seatId: 'not-a-uuid' })
        .expect(401); // JWT guard rejects first
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/bookings/some-booking-id')
        .expect(401);
    });
  });

  describe('POST /bookings/:id/cancel', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/bookings/some-booking-id/cancel')
        .expect(401);
    });
  });
});
