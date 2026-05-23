import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '@/database/database.module';
import { bookings } from '@/database/schema';

@Injectable()
export class BookingsRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async findById(bookingId: string) {
    return this.db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });
  }

  async findByIdAndUser(bookingId: string, userId: string) {
    return this.db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.userId, userId)),
    });
  }

  async findPendingByUserAndSeat(userId: string, seatId: string, tx?: any) {
    const executor = tx ?? this.db;
    return executor.query.bookings.findFirst({
      where: and(
        eq(bookings.userId, userId),
        eq(bookings.seatId, seatId),
        eq(bookings.status, 'pending'),
      ),
    });
  }

  async create(data: { userId: string; seatId: string; status?: string }, tx?: any) {
    const executor = tx ?? this.db;
    const [booking] = await executor
      .insert(bookings)
      .values(data)
      .returning();
    return booking;
  }

  async updateStatus(bookingId: string, status: string, tx?: any) {
    const executor = tx ?? this.db;
    await executor
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
  }

  async setPaymentId(bookingId: string, paymentId: string) {
    await this.db
      .update(bookings)
      .set({ paymentId, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
  }

  getDb() {
    return this.db;
  }
}
