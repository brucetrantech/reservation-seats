import { create } from 'zustand';
import { bookingApi } from '@/api/booking';
import { Booking, PaymentMethod } from '@/models';

interface BookingState {
  currentBooking: Booking | null;
  paymentUrl: string | null;
  isLoading: boolean;
  error: string | null;
  holdSeat: (seatId: string) => Promise<void>;
  createPayment: (bookingId: string, method?: PaymentMethod) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  currentBooking: null,
  paymentUrl: null,
  isLoading: false,
  error: null,

  holdSeat: async (seatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingApi.hold(seatId);
      set({ currentBooking: booking, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createPayment: async (bookingId: string, method: PaymentMethod = 'napas') => {
    set({ isLoading: true, error: null });
    try {
      const result = await bookingApi.createPayment(bookingId, method);

      if (result.method === 'mock') {
        if (result.success) {
          // Mock payment succeeded — navigate to confirmation
          set({ isLoading: false });
          window.location.href = `/confirmation?bookingId=${bookingId}`;
        } else {
          set({ error: result.reason || 'Mock payment failed', isLoading: false });
        }
        return;
      }

      // Napas flow — redirect to external payment URL
      set({ paymentUrl: result.paymentUrl || null, isLoading: false });
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  cancelBooking: async (bookingId: string) => {
    set({ isLoading: true, error: null });
    try {
      await bookingApi.cancel(bookingId);
      set({ currentBooking: null, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  reset: () => set({ currentBooking: null, paymentUrl: null, error: null }),
}));
