import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators';
import { SeatsService } from './seats.service';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Public()
  @Get()
  findAll() {
    return this.seatsService.findAll();
  }
}
