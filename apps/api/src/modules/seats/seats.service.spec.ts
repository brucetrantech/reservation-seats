import { Test, TestingModule } from '@nestjs/testing';
import { SeatsService } from './seats.service';
import { SeatsRepository } from '@/database';

describe('SeatsService', () => {
  let service: SeatsService;
  let seatsRepo: jest.Mocked<SeatsRepository>;

  beforeEach(async () => {
    const mockSeatsRepo = {
      findAll: jest.fn(),
      releaseExpiredHolds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatsService,
        { provide: SeatsRepository, useValue: mockSeatsRepo },
      ],
    }).compile();

    service = module.get<SeatsService>(SeatsService);
    seatsRepo = module.get(SeatsRepository);
  });

  describe('findAll', () => {
    it('should return all seats', async () => {
      const mockSeats = [
        { id: '1', seatNumber: 1, status: 'available', heldBy: null, heldUntil: null, reservedBy: null },
        { id: '2', seatNumber: 2, status: 'held', heldBy: 'user-1', heldUntil: new Date(), reservedBy: null },
        { id: '3', seatNumber: 3, status: 'reserved', heldBy: null, heldUntil: null, reservedBy: 'user-2' },
      ];
      seatsRepo.findAll.mockResolvedValue(mockSeats as any);

      const result = await service.findAll();

      expect(result).toEqual(mockSeats);
      expect(seatsRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('releaseExpiredHolds', () => {
    it('should call repository to release expired holds', async () => {
      seatsRepo.releaseExpiredHolds.mockResolvedValue(undefined);

      await service.releaseExpiredHolds();

      expect(seatsRepo.releaseExpiredHolds).toHaveBeenCalledTimes(1);
    });
  });
});
