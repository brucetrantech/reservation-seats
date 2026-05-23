import { Inject, Injectable } from '@nestjs/common';
import { eq, and, lt } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '@/database/constants';
import { seats } from '@/database/schema';

@Injectable()
export class SeatsRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async findAll() {
    return this.db
      .select({
        id: seats.id,
        seatNumber: seats.seatNumber,
        status: seats.status,
      })
      .from(seats)
      .orderBy(seats.seatNumber);
  }

  async findByIdForUpdate(tx: any, seatId: string) {
    const [seat] = await tx
      .select()
      .from(seats)
      .where(eq(seats.id, seatId))
      .for('update');
    return seat ?? null;
  }

  async updateStatus(
    seatId: string,
    data: {
      status: 'available' | 'held' | 'reserved';
      heldBy?: string | null;
      heldUntil?: Date | null;
      reservedBy?: string | null;
    },
    tx?: any,
  ) {
    const executor = tx ?? this.db;
    await executor
      .update(seats)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(seats.id, seatId));
  }

  async releaseExpiredHolds() {
    const now = new Date();
    await this.db
      .update(seats)
      .set({
        status: 'available',
        heldBy: null,
        heldUntil: null,
        updatedAt: now,
      })
      .where(and(eq(seats.status, 'held'), lt(seats.heldUntil, now)));
  }
}
