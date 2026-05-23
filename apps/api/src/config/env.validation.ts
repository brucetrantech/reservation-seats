import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_BASE_URL: z.string().default('http://localhost:3000'),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_SSL: z.string().default('false'),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('90d'),

  FRONTEND_URL: z.string().url(),

  NAPAS_TMN_CODE: z.string().min(1),
  NAPAS_HASH_SECRET: z.string().min(1),
  NAPAS_PAYMENT_URL: z.string().url(),
  NAPAS_RETURN_URL: z.string().url(),
  NAPAS_IPN_URL: z.string().url(),

  SEAT_HOLD_DURATION_SECONDS: z.coerce.number().default(300),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM_NAME: z.string().default('Reservation Seats'),
  SMTP_FROM_EMAIL: z.string().email(),
});

export type EnvConfig = z.infer<typeof envSchema>;
