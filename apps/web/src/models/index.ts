export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export interface Seat {
  id: string;
  seatNumber: number;
  status: 'available' | 'held' | 'reserved';
};

export interface Booking {
  id: string;
  seatId: string;
  status: string;
  expiresAt?: string;
};

export interface PaymentResult {
  paymentId: string;
  paymentUrl: string;
};
