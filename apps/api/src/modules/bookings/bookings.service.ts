import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingsRepository, SeatsRepository } from '@/database';
import { EnvConfig } from '@/config';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepo: BookingsRepository,
    private readonly seatsRepo: SeatsRepository,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async holdSeat(userId: string, seatId: string) {
    const holdDuration = this.config.get('SEAT_HOLD_DURATION_SECONDS');
    const db = this.bookingsRepo.getDb();

    return db.transaction(async (tx) => {
      // Pessimistic lock on the seat row
      const seat = await this.seatsRepo.findByIdForUpdate(tx, seatId);

      if (!seat) {
        throw new NotFoundException('Seat not found');
      }

      if (seat.status !== 'available') {
        if (seat.status === 'held' && seat.heldBy === userId) {
          const existing = await this.bookingsRepo.findPendingByUserAndSeat(userId, seatId, tx);
          if (existing) return existing;
        }
        throw new ConflictException('Seat is no longer available');
      }

      const heldUntil = new Date(Date.now() + holdDuration * 1000);

      // Update seat status
      await this.seatsRepo.updateStatus(seatId, {
        status: 'held',
        heldBy: userId,
        heldUntil,
      }, tx);

      // Create booking record
      const booking = await this.bookingsRepo.create({
        userId,
        seatId,
        status: 'pending',
      }, tx);

      return {
        ...booking,
        expiresAt: heldUntil,
      };
    });
  }

  async findOne(bookingId: string, userId: string) {
    const booking = await this.bookingsRepo.findByIdAndUser(bookingId, userId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async cancel(bookingId: string, userId: string) {
    const booking = await this.findOne(bookingId, userId);

    if (booking.status !== 'pending') {
      throw new ConflictException('Only pending bookings can be cancelled');
    }

    const db = this.bookingsRepo.getDb();

    await db.transaction(async (tx) => {
      await this.bookingsRepo.updateStatus(bookingId, 'cancelled', tx);

      await this.seatsRepo.updateStatus(booking.seatId, {
        status: 'available',
        heldBy: null,
        heldUntil: null,
      }, tx);
    });

    return { message: 'Booking cancelled' };
  }
}
