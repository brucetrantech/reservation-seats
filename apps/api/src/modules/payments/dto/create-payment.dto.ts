import { IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum PaymentMethod {
  NAPAS = 'napas',
  MOCK = 'mock',
}

export class CreatePaymentDto {
  @IsUUID()
  bookingId!: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod = PaymentMethod.NAPAS;
}
