import { Injectable } from '@nestjs/common';
import { SeatsRepository } from '@/database';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SeatsService {
  constructor(
    private readonly seatsRepo: SeatsRepository,
  ) {}

  async findAll() {
    return this.seatsRepo.findAll();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredHolds() {
    await this.seatsRepo.releaseExpiredHolds();
  }
}
