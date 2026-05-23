import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentsRepository, BookingsRepository, SeatsRepository } from '@/database';
import { EnvConfig } from '@/config';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepo: PaymentsRepository,
    private readonly bookingsRepo: BookingsRepository,
    private readonly seatsRepo: SeatsRepository,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async createPayment(userId: string, bookingId: string) {
    const booking = await this.bookingsRepo.findByIdAndUser(bookingId, userId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new ConflictException('Booking is not in pending status');
    }

    const txnRef = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const amount = 50000; // 50,000 VND per seat (demo)

    // Build Napas/VNPay payment URL
    const paymentUrl = this.buildPaymentUrl(txnRef, amount, bookingId);

    const payment = await this.paymentsRepo.create({
      bookingId,
      userId,
      amount: amount.toString(),
      napasTxnRef: txnRef,
      status: 'initiated',
      paymentUrl,
    });

    // Link payment to booking
    await this.bookingsRepo.setPaymentId(bookingId, payment.id);

    return { paymentId: payment.id, paymentUrl };
  }

  async handleReturn(query: Record<string, string>) {
    const isValid = this.verifySignature(query);
    if (!isValid) {
      return { success: false, reason: 'invalid_signature' };
    }

    const txnRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];

    const payment = await this.paymentsRepo.findByTxnRef(txnRef);

    if (!payment) {
      return { success: false, reason: 'payment_not_found' };
    }

    if (responseCode === '00') {
      await this.confirmPayment(payment.id, payment.bookingId, query['vnp_TransactionNo']);
      return { success: true, bookingId: payment.bookingId };
    }

    await this.failPayment(payment.id, payment.bookingId);
    return { success: false, reason: 'payment_declined' };
  }

  async handleIpn(query: Record<string, string>) {
    const isValid = this.verifySignature(query);
    if (!isValid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const txnRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];

    const payment = await this.paymentsRepo.findByTxnRef(txnRef);

    if (!payment) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    if (payment.status === 'success') {
      return { RspCode: '02', Message: 'Already confirmed' };
    }

    if (responseCode === '00') {
      await this.confirmPayment(payment.id, payment.bookingId, query['vnp_TransactionNo']);
      return { RspCode: '00', Message: 'Confirmed' };
    }

    await this.failPayment(payment.id, payment.bookingId);
    return { RspCode: '00', Message: 'Confirmed' };
  }

  getFrontendUrl() {
    return this.config.get('FRONTEND_URL');
  }

  private async confirmPayment(
    paymentId: string,
    bookingId: string,
    transactionNo?: string,
  ) {
    const db = this.paymentsRepo.getDb();

    await db.transaction(async (tx) => {
      await this.paymentsRepo.updateStatus(paymentId, {
        status: 'success',
        napasTransactionNo: transactionNo || null,
        ipnReceivedAt: new Date(),
      }, tx);

      const booking = await this.bookingsRepo.findById(bookingId);

      if (booking) {
        await this.bookingsRepo.updateStatus(bookingId, 'confirmed', tx);

        await this.seatsRepo.updateStatus(booking.seatId, {
          status: 'reserved',
          reservedBy: booking.userId,
          heldBy: null,
          heldUntil: null,
        }, tx);
      }
    });
  }

  private async failPayment(paymentId: string, bookingId: string) {
    const db = this.paymentsRepo.getDb();

    await db.transaction(async (tx) => {
      await this.paymentsRepo.updateStatus(paymentId, {
        status: 'failed',
      }, tx);

      const booking = await this.bookingsRepo.findById(bookingId);

      if (booking) {
        await this.bookingsRepo.updateStatus(bookingId, 'cancelled', tx);

        await this.seatsRepo.updateStatus(booking.seatId, {
          status: 'available',
          heldBy: null,
          heldUntil: null,
        }, tx);
      }
    });
  }

  private buildPaymentUrl(txnRef: string, amount: number, orderInfo: string): string {
    const tmnCode = this.config.get('NAPAS_TMN_CODE');
    const baseUrl = this.config.get('NAPAS_PAYMENT_URL');
    const returnUrl = this.config.get('NAPAS_RETURN_URL');

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: (amount * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Payment for booking ${orderInfo}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: this.formatDate(new Date()),
    };

    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, string>,
      );

    const queryString = new URLSearchParams(sortedParams).toString();
    const signature = this.signData(queryString);

    return `${baseUrl}?${queryString}&vnp_SecureHash=${signature}`;
  }

  private verifySignature(query: Record<string, string>): boolean {
    const secureHash = query['vnp_SecureHash'];
    if (!secureHash) return false;

    const params = { ...query };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sortedParams = Object.keys(params)
      .sort()
      .filter((key) => params[key] !== '' && params[key] !== undefined)
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, string>,
      );

    const queryString = new URLSearchParams(sortedParams).toString();
    const expectedHash = this.signData(queryString);

    return secureHash === expectedHash;
  }

  private signData(data: string): string {
    const secret = this.config.get('NAPAS_HASH_SECRET');
    return crypto
      .createHmac('sha512', secret)
      .update(data)
      .digest('hex');
  }

  private formatDate(date: Date): string {
    return date
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
  }
}
