import { create } from 'zustand';
import { seatApi } from '@/api/seat';
import { Seat } from '@/models';


interface SeatState {
  seats: Seat[];
  selectedSeat: Seat | null;
  isLoading: boolean;
  error: string | null;
  fetchSeats: () => Promise<void>;
  selectSeat: (seat: Seat) => void;
  clearSelection: () => void;
}

export const useSeatStore = create<SeatState>((set) => ({
  seats: [],
  selectedSeat: null,
  isLoading: false,
  error: null,

  fetchSeats: async () => {
    set({ isLoading: true, error: null });
    try {
      const seats = await seatApi.getAll();
      set({ seats, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectSeat: (seat) => set({ selectedSeat: seat }),
  clearSelection: () => set({ selectedSeat: null }),
}));
