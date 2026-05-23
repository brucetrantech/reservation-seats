import { IsUUID } from 'class-validator';

export class HoldSeatDto {
  @IsUUID()
  seatId: string;
}
