import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

// Mock fs
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('<html>{{userName}} {{seatNumber}}</html>'),
}));

// Mock pdf generator
jest.mock('./pdf/ticket-generator', () => ({
  generateTicketPdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        const values: Record<string, any> = {
          SMTP_HOST: 'smtp.test.com',
          SMTP_PORT: 587,
          SMTP_SECURE: 'false',
          SMTP_USER: 'test@test.com',
          SMTP_PASS: 'password',
          SMTP_FROM_NAME: 'Test',
          SMTP_FROM_EMAIL: 'noreply@test.com',
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('sendReservationConfirmation', () => {
    it('should send email without throwing', async () => {
      await expect(
        service.sendReservationConfirmation({
          userName: 'Test User',
          userEmail: 'user@test.com',
          seatNumber: 1,
          bookingId: 'booking-123',
          transactionNo: 'TXN-001',
          amount: '50000',
        }),
      ).resolves.not.toThrow();
    });

    it('should not throw when email sending fails', async () => {
      // Override transporter to simulate failure
      (service as any).transporter.sendMail = jest.fn().mockRejectedValue(new Error('SMTP error'));

      await expect(
        service.sendReservationConfirmation({
          userName: 'Test User',
          userEmail: 'user@test.com',
          seatNumber: 1,
          bookingId: 'booking-123',
          transactionNo: 'TXN-001',
          amount: '50000',
        }),
      ).resolves.not.toThrow();
    });
  });
});
