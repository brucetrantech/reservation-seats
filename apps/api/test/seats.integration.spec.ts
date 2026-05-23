import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Seats (Integration)', () => {
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

  describe('GET /seats', () => {
    it('should return an array of seats', async () => {
      const response = await request(app.getHttpServer())
        .get('/seats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const seat = response.body[0];
      expect(seat).toHaveProperty('id');
      expect(seat).toHaveProperty('seatNumber');
      expect(seat).toHaveProperty('status');
    });

    it('should return seats without requiring authentication', async () => {
      // No auth token provided — should still succeed
      await request(app.getHttpServer())
        .get('/seats')
        .expect(200);
    });
  });
});
