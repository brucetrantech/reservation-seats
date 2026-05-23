import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '@/database/constants';
import { sessions } from '@/database/schema';

@Injectable()
export class SessionsRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async findByRefreshTokenHash(hash: string) {
    return this.db.query.sessions.findFirst({
      where: eq(sessions.refreshTokenHash, hash),
    });
  }

  async create(data: { userId: string; refreshTokenHash: string; expiresAt: Date }) {
    const [session] = await this.db
      .insert(sessions)
      .values(data)
      .returning();
    return session;
  }

  async revoke(sessionId: string) {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  async revokeByTokenHash(hash: string) {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.refreshTokenHash, hash));
  }
}
