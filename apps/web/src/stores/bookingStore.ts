import { create } from 'zustand';
import { bookingApi } from '@/api/booking';
import { Booking } from '@/models';

interface BookingState {
  currentBooking: Booking | null;
  paymentUrl: string | null;
  isLoading: boolean;
  error: string | null;
  holdSeat: (seatId: string) => Promise<void>;
  createPayment: (bookingId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
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

  createPayment: async (bookingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await bookingApi.createPayment(bookingId);
      set({ paymentUrl: result.paymentUrl, isLoading: false });
      window.location.href = result.paymentUrl;
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
