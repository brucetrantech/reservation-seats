import {
  pgTable,
  uuid,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const seatStatusEnum = pgEnum('seat_status', [
  'available',
  'held',
  'reserved',
]);

export const seats = pgTable('seats', {
  id: uuid('id').defaultRandom().primaryKey(),
  seatNumber: integer('seat_number').notNull().unique(),
  status: seatStatusEnum('status').notNull().default('available'),
  heldBy: uuid('held_by').references(() => users.id),
  heldUntil: timestamp('held_until'),
  reservedBy: uuid('reserved_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
