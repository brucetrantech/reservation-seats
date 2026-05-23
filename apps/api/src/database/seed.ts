import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { seats } from './schema';

async function seed() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    database: process.env.DATABASE_NAME || 'reservation_seats',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  const db = drizzle(pool);

  console.log('🌱 Seeding seats...');

  await db
    .insert(seats)
    .values([
      { seatNumber: 1, status: 'available' },
      { seatNumber: 2, status: 'available' },
      { seatNumber: 3, status: 'available' },
    ])
    .onConflictDoNothing({ target: seats.seatNumber });

  console.log('✅ Seeded 3 seats');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
