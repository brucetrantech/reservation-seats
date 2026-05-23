import { Seat } from '@/models';
import { api } from './client';

export const seatApi = {
  getAll: () => api.get<Seat[]>('/seats'),
};
