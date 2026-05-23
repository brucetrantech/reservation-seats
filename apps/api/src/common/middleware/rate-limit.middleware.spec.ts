import { HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { Request, Response } from 'express';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new RateLimitMiddleware();
    mockReq = {
      ip: '127.0.0.1',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any,
    };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should allow requests within rate limit', () => {
    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '99');
  });

  it('should throw 429 when rate limit exceeded', () => {
    // Exhaust the rate limit
    for (let i = 0; i < 100; i++) {
      middleware.use(mockReq as Request, mockRes as Response, mockNext);
    }

    // 101st request should throw
    expect(() => {
      middleware.use(mockReq as Request, mockRes as Response, mockNext);
    }).toThrow(HttpException);
  });

  it('should use x-forwarded-for header for client identification', () => {
    mockReq.headers = { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' };

    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should track different IPs separately', () => {
    // First IP
    const req1 = { ip: '192.168.1.1', headers: {}, socket: { remoteAddress: '192.168.1.1' } } as any;
    for (let i = 0; i < 100; i++) {
      middleware.use(req1 as Request, mockRes as Response, mockNext);
    }

    // Second IP should still work
    const req2 = { ip: '192.168.1.2', headers: {}, socket: { remoteAddress: '192.168.1.2' } } as any;
    mockNext.mockClear();
    middleware.use(req2 as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
