import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '@/database/constants';
import { payments } from '@/database/schema';

@Injectable()
export class PaymentsRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async findByTxnRef(txnRef: string) {
    return this.db.query.payments.findFirst({
      where: eq(payments.napasTxnRef, txnRef),
    });
  }

  async create(data: {
    bookingId: string;
    userId: string;
    amount: string;
    napasTxnRef: string;
    status: 'initiated' | 'processing' | 'success' | 'failed' | 'timeout';
    paymentUrl: string;
  }) {
    const [payment] = await this.db
      .insert(payments)
      .values(data)
      .returning();
    return payment;
  }

  async updateStatus(
    paymentId: string,
    data: {
      status: 'initiated' | 'processing' | 'success' | 'failed' | 'timeout';
      napasTransactionNo?: string | null;
      ipnReceivedAt?: Date;
    },
    tx?: any,
  ) {
    const executor = tx ?? this.db;
    await executor
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, paymentId));
  }

  getDb() {
    return this.db;
  }
}
