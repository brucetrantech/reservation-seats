import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsRepository, SeatsRepository } from '@/database';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingsRepo: jest.Mocked<BookingsRepository>;
  let seatsRepo: jest.Mocked<SeatsRepository>;

  const mockTx = {} as any;
  const mockDb = { transaction: jest.fn((cb) => cb(mockTx)) };

  beforeEach(async () => {
    const mockBookingsRepo = {
      findByIdAndUser: jest.fn(),
      findPendingByUserAndSeat: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const mockSeatsRepo = {
      findByIdForUpdate: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn().mockReturnValue(300), // 5 minutes
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsRepository, useValue: mockBookingsRepo },
        { provide: SeatsRepository, useValue: mockSeatsRepo },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingsRepo = module.get(BookingsRepository);
    seatsRepo = module.get(SeatsRepository);
  });

  describe('holdSeat', () => {
    const userId = 'user-123';
    const seatId = 'seat-456';

    it('should hold an available seat and return booking', async () => {
      seatsRepo.findByIdForUpdate.mockResolvedValue({
        id: seatId,
        seatNumber: 1,
        status: 'available',
        heldBy: null,
        heldUntil: null,
        reservedBy: null,
      } as any);

      const mockBooking = { id: 'booking-1', userId, seatId, status: 'pending' };
      bookingsRepo.create.mockResolvedValue(mockBooking as any);

      const result = await service.holdSeat(userId, seatId);

      expect(result).toHaveProperty('expiresAt');
      expect(seatsRepo.findByIdForUpdate).toHaveBeenCalledWith(mockTx, seatId);
      expect(seatsRepo.updateStatus).toHaveBeenCalledWith(
        seatId,
        expect.objectContaining({ status: 'held', heldBy: userId }),
        mockTx,
      );
      expect(bookingsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId, seatId, status: 'pending' }),
        mockTx,
      );
    });

    it('should throw NotFoundException if seat does not exist', async () => {
      seatsRepo.findByIdForUpdate.mockResolvedValue(undefined);

      await expect(service.holdSeat(userId, seatId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if seat is already held by another user', async () => {
      seatsRepo.findByIdForUpdate.mockResolvedValue({
        id: seatId,
        status: 'held',
        heldBy: 'other-user',
      } as any);

      await expect(service.holdSeat(userId, seatId)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if seat is reserved', async () => {
      seatsRepo.findByIdForUpdate.mockResolvedValue({
        id: seatId,
        status: 'reserved',
        heldBy: null,
        reservedBy: 'other-user',
      } as any);

      await expect(service.holdSeat(userId, seatId)).rejects.toThrow(ConflictException);
    });

    it('should return existing booking if user already holds the seat', async () => {
      seatsRepo.findByIdForUpdate.mockResolvedValue({
        id: seatId,
        status: 'held',
        heldBy: userId,
      } as any);

      const existingBooking = { id: 'existing-booking', userId, seatId, status: 'pending' };
      bookingsRepo.findPendingByUserAndSeat.mockResolvedValue(existingBooking as any);

      const result = await service.holdSeat(userId, seatId);

      expect(result).toEqual(existingBooking);
    });
  });

  describe('findOne', () => {
    it('should return booking if found', async () => {
      const mockBooking = { id: 'booking-1', userId: 'user-1', seatId: 'seat-1', status: 'pending' };
      bookingsRepo.findByIdAndUser.mockResolvedValue(mockBooking as any);

      const result = await service.findOne('booking-1', 'user-1');

      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException if booking not found', async () => {
      bookingsRepo.findByIdAndUser.mockResolvedValue(undefined);

      await expect(service.findOne('not-exists', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel a pending booking and release the seat', async () => {
      const mockBooking = { id: 'booking-1', userId: 'user-1', seatId: 'seat-1', status: 'pending' };
      bookingsRepo.findByIdAndUser.mockResolvedValue(mockBooking as any);

      await service.cancel('booking-1', 'user-1');

      expect(bookingsRepo.updateStatus).toHaveBeenCalledWith('booking-1', 'cancelled', mockTx);
      expect(seatsRepo.updateStatus).toHaveBeenCalledWith(
        'seat-1',
        expect.objectContaining({ status: 'available', heldBy: null }),
        mockTx,
      );
    });

    it('should throw ConflictException if booking is not pending', async () => {
      const mockBooking = { id: 'booking-1', userId: 'user-1', seatId: 'seat-1', status: 'confirmed' };
      bookingsRepo.findByIdAndUser.mockResolvedValue(mockBooking as any);

      await expect(service.cancel('booking-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });
});
