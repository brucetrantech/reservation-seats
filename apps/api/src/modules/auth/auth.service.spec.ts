import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersRepository, SessionsRepository } from '@/database';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<UsersRepository>;
  let sessionsRepo: jest.Mocked<SessionsRepository>;

  beforeEach(async () => {
    const mockUsersRepo = {
      findByGoogleId: jest.fn(),
      create: jest.fn(),
    };

    const mockSessionsRepo = {
      findByRefreshTokenHash: jest.fn(),
      create: jest.fn(),
      revoke: jest.fn(),
      revokeByTokenHash: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        const values: Record<string, any> = {
          JWT_SECRET: 'test-jwt-secret-that-is-at-least-32-characters',
          JWT_ACCESS_EXPIRY: '15m',
          JWT_REFRESH_EXPIRY: '90d',
          FRONTEND_URL: 'http://localhost:5173',
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: SessionsRepository, useValue: mockSessionsRepo },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(UsersRepository);
    sessionsRepo = module.get(SessionsRepository);
  });

  describe('login', () => {
    const googleUser = {
      googleId: 'google-123',
      email: 'user@example.com',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    it('should create a new user if not exists and return tokens', async () => {
      usersRepo.findByGoogleId.mockResolvedValue(undefined);
      usersRepo.create.mockResolvedValue({ id: 'user-1', ...googleUser } as any);
      sessionsRepo.create.mockResolvedValue({} as any);

      const result = await service.login(googleUser);

      expect(usersRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        email: googleUser.email,
        googleId: googleUser.googleId,
      }));
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should use existing user if already registered', async () => {
      usersRepo.findByGoogleId.mockResolvedValue({ id: 'existing-user', ...googleUser } as any);
      sessionsRepo.create.mockResolvedValue({} as any);

      const result = await service.login(googleUser);

      expect(usersRepo.create).not.toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if no refresh token', async () => {
      await expect(service.refreshTokens('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if session not found', async () => {
      sessionsRepo.findByRefreshTokenHash.mockResolvedValue(undefined);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if session is revoked', async () => {
      sessionsRepo.findByRefreshTokenHash.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      await expect(service.refreshTokens('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if session is expired', async () => {
      sessionsRepo.findByRefreshTokenHash.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
      } as any);

      await expect(service.refreshTokens('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should revoke old session and issue new tokens', async () => {
      sessionsRepo.findByRefreshTokenHash.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000), // valid
      } as any);
      sessionsRepo.create.mockResolvedValue({} as any);

      const result = await service.refreshTokens('valid-token');

      expect(sessionsRepo.revoke).toHaveBeenCalledWith('session-1');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('revokeSession', () => {
    it('should do nothing if no refresh token', async () => {
      await service.revokeSession('');

      expect(sessionsRepo.revokeByTokenHash).not.toHaveBeenCalled();
    });

    it('should revoke session by token hash', async () => {
      await service.revokeSession('some-token');

      expect(sessionsRepo.revokeByTokenHash).toHaveBeenCalled();
    });
  });
});
