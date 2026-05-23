import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { bookings } from './bookings';

export const paymentStatusEnum = pgEnum('payment_status', [
  'initiated',
  'processing',
  'success',
  'failed',
  'timeout',
]);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('VND'),
  napasTxnRef: varchar('napas_txn_ref', { length: 255 }).notNull().unique(),
  napasTransactionNo: varchar('napas_transaction_no', { length: 255 }),
  status: paymentStatusEnum('status').notNull().default('initiated'),
  paymentUrl: text('payment_url'),
  ipnReceivedAt: timestamp('ipn_received_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
