import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '@/database/constants';
import { users } from '@/database/schema';

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async findByGoogleId(googleId: string) {
    return this.db.query.users.findFirst({
      where: eq(users.googleId, googleId),
    });
  }

  async findById(id: string, columns?: { id?: boolean; email?: boolean; name?: boolean; avatarUrl?: boolean }) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
      ...(columns && { columns }),
    });
  }

  async create(data: { email: string; name: string; googleId: string; avatarUrl?: string | null }) {
    const [user] = await this.db
      .insert(users)
      .values(data)
      .returning();
    return user;
  }
}
