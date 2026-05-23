import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsRepository, BookingsRepository, SeatsRepository, UsersRepository } from '@/database';
import { PaymentMethod } from './dto/create-payment.dto';
import { NotificationsService } from '@/modules/notifications/notifications.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepo: jest.Mocked<PaymentsRepository>;
  let bookingsRepo: jest.Mocked<BookingsRepository>;
  let seatsRepo: jest.Mocked<SeatsRepository>;
  let usersRepo: jest.Mocked<UsersRepository>;

  const mockTx = {} as any;
  const mockDb = { transaction: jest.fn((cb) => cb(mockTx)) };

  beforeEach(async () => {
    const mockPaymentsRepo = {
      create: jest.fn(),
      findByTxnRef: jest.fn(),
      updateStatus: jest.fn(),
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const mockBookingsRepo = {
      findById: jest.fn(),
      findByIdAndUser: jest.fn(),
      setPaymentId: jest.fn(),
      updateStatus: jest.fn(),
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const mockSeatsRepo = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockUsersRepo = {
      findById: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        const values: Record<string, any> = {
          FRONTEND_URL: 'http://localhost:5173',
          NAPAS_TMN_CODE: 'TEST_CODE',
          NAPAS_HASH_SECRET: 'test_secret_key_at_least_32_characters_long',
          NAPAS_PAYMENT_URL: 'https://sandbox.napas.com/paymentv2/vpcpay.html',
          NAPAS_RETURN_URL: 'http://localhost:3000/payments/return',
          NAPAS_IPN_URL: 'http://localhost:3000/payments/ipn',
          API_BASE_URL: 'http://localhost:3000',
        };
        return values[key];
      }),
    };

    const mockNotifications = {
      sendReservationConfirmation: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentsRepository, useValue: mockPaymentsRepo },
        { provide: BookingsRepository, useValue: mockBookingsRepo },
        { provide: SeatsRepository, useValue: mockSeatsRepo },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: ConfigService, useValue: mockConfig },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentsRepo = module.get(PaymentsRepository);
    bookingsRepo = module.get(BookingsRepository);
    seatsRepo = module.get(SeatsRepository);
    usersRepo = module.get(UsersRepository);
  });

  describe('createPayment', () => {
    const userId = 'user-123';
    const bookingId = 'booking-456';

    it('should throw NotFoundException if booking does not exist', async () => {
      bookingsRepo.findByIdAndUser.mockResolvedValue(undefined);

      await expect(
        service.createPayment(userId, bookingId, PaymentMethod.MOCK),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if booking is not pending', async () => {
      bookingsRepo.findByIdAndUser.mockResolvedValue({
        id: bookingId,
        userId,
        status: 'confirmed',
        seatId: 'seat-1',
      } as any);

      await expect(
        service.createPayment(userId, bookingId, PaymentMethod.MOCK),
      ).rejects.toThrow(ConflictException);
    });

    it('should process mock payment successfully', async () => {
      bookingsRepo.findByIdAndUser.mockResolvedValue({
        id: bookingId,
        userId,
        status: 'pending',
        seatId: 'seat-1',
      } as any);

      const mockPayment = { id: 'payment-1', bookingId, userId, amount: '50000' };
      paymentsRepo.create.mockResolvedValue(mockPayment as any);
      paymentsRepo.findByTxnRef.mockResolvedValue({
        ...mockPayment,
        userId,
        amount: '50000',
      } as any);

      bookingsRepo.findById.mockResolvedValue({
        id: bookingId,
        userId,
        seatId: 'seat-1',
      } as any);

      usersRepo.findById.mockResolvedValue({ id: userId, email: 'test@test.com', name: 'Test' } as any);
      seatsRepo.findById.mockResolvedValue({ id: 'seat-1', seatNumber: 1 } as any);

      const result = await service.createPayment(userId, bookingId, PaymentMethod.MOCK);

      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('success', true);
      expect(result.method).toBe(PaymentMethod.MOCK);
    });

    it('should create Napas payment and return payment URL', async () => {
      bookingsRepo.findByIdAndUser.mockResolvedValue({
        id: bookingId,
        userId,
        status: 'pending',
        seatId: 'seat-1',
      } as any);

      const mockPayment = { id: 'payment-1', bookingId, userId, amount: '50000' };
      paymentsRepo.create.mockResolvedValue(mockPayment as any);

      const result = await service.createPayment(userId, bookingId, PaymentMethod.NAPAS);

      expect(result).toHaveProperty('paymentId', 'payment-1');
      expect(result).toHaveProperty('paymentUrl');
      expect(result.method).toBe(PaymentMethod.NAPAS);
      expect(bookingsRepo.setPaymentId).toHaveBeenCalledWith(bookingId, 'payment-1');
    });
  });

  describe('handleReturn', () => {
    it('should return failure for invalid signature', async () => {
      const result = await service.handleReturn({
        vnp_TxnRef: 'txn-1',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'invalid_hash',
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_signature');
    });
  });

  describe('handleIpn', () => {
    it('should return error for invalid signature', async () => {
      const result = await service.handleIpn({
        vnp_TxnRef: 'txn-1',
        vnp_SecureHash: 'bad_signature',
      });

      expect(result.RspCode).toBe('97');
    });
  });
});
