import { Booking, PaymentResult } from '@/models';
import { api } from './client';



export const bookingApi = {
  hold: (seatId: string) => api.post<Booking>('/bookings/hold', { seatId }),

  getById: (id: string) => api.get<Booking>(`/bookings/${id}`),

  cancel: (id: string) => api.post<{ message: string }>(`/bookings/${id}/cancel`),

  createPayment: (bookingId: string) =>
    api.post<PaymentResult>('/payments/create', { bookingId }),
};
