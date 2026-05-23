import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public, CurrentUser } from '@/common/decorators';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  createPayment(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(user.id, dto.bookingId, dto.method);
  }

  @Public()
  @Get('return')
  async handleReturn(@Query() query: Record<string, string>, @Res() res: Response) {
    const result = await this.paymentsService.handleReturn(query);
    const frontendUrl = this.paymentsService.getFrontendUrl();

    if (result.success) {
      res.redirect(`${frontendUrl}/confirmation?bookingId=${result.bookingId}`);
    } else {
      res.redirect(`${frontendUrl}/payment-failed?reason=${result.reason}`);
    }
  }

  @Public()
  @Post('ipn')
  async handleIpn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleIpn(query);
  }
}
