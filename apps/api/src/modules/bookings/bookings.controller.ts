import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators';
import { BookingsService } from './bookings.service';
import { HoldSeatDto } from './dto/hold-seat.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('hold')
  holdSeat(@CurrentUser() user: { id: string }, @Body() dto: HoldSeatDto) {
    return this.bookingsService.holdSeat(user.id, dto.seatId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user.id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.bookingsService.cancel(id, user.id);
  }
}
