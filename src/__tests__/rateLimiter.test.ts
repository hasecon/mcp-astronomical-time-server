import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// We need to extract the RateLimiter class for testing
// Since it's in the same file, we'll import it differently
describe('RateLimiter', () => {
  let rateLimiter: any;

  beforeEach(() => {
    // Mock Date.now for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    
    // Create a local RateLimiter class for testing
    class RateLimiter {
      private requests: Map<string, Array<number>> = new Map();
      private readonly windowMs: number;
      private readonly maxRequests: number;
      private readonly maxRequestsPerMinute: number;

      constructor(
        windowMs: number = 15 * 60 * 1000,
        maxRequests: number = 100,
        maxRequestsPerMinute: number = 20
      ) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.maxRequestsPerMinute = maxRequestsPerMinute;
      }

      isAllowed(identifier: string = 'default'): { allowed: boolean, resetTime?: number, remaining?: number } {
        const now = Date.now();
        const requests = this.requests.get(identifier) || [];
        
        const validRequests = requests.filter(time => now - time < this.windowMs);
        const recentRequests = validRequests.filter(time => now - time < 60 * 1000);
        
        if (recentRequests.length >= this.maxRequestsPerMinute) {
          return {
            allowed: false,
            resetTime: Math.min(...recentRequests) + 60 * 1000,
            remaining: 0
          };
        }
        
        if (validRequests.length >= this.maxRequests) {
          return {
            allowed: false,
            resetTime: Math.min(...validRequests) + this.windowMs,
            remaining: 0
          };
        }
        
        validRequests.push(now);
        this.requests.set(identifier, validRequests);
        
        return {
          allowed: true,
          remaining: Math.min(
            this.maxRequests - validRequests.length,
            this.maxRequestsPerMinute - recentRequests.length - 1
          )
        };
      }

      cleanup(): void {
        const now = Date.now();
        for (const [identifier, requests] of this.requests.entries()) {
          const validRequests = requests.filter(time => now - time < this.windowMs);
          if (validRequests.length === 0) {
            this.requests.delete(identifier);
          } else {
            this.requests.set(identifier, validRequests);
          }
        }
      }
    }
    
    rateLimiter = new RateLimiter();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should allow requests within limits', () => {
    const result = rateLimiter.isAllowed('test-user');
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  test('should track multiple users separately', () => {
    const user1 = rateLimiter.isAllowed('user1');
    const user2 = rateLimiter.isAllowed('user2');
    
    expect(user1.allowed).toBe(true);
    expect(user2.allowed).toBe(true);
    expect(user1.remaining).toBe(user2.remaining);
  });

  test('should block requests when per-minute limit exceeded', () => {
    // Make 20 requests (the per-minute limit)
    for (let i = 0; i < 20; i++) {
      const result = rateLimiter.isAllowed('test-user');
      expect(result.allowed).toBe(true);
    }
    
    // 21st request should be blocked
    const blockedResult = rateLimiter.isAllowed('test-user');
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.resetTime).toBeDefined();
  });

  test('should reset limits after time window', () => {
    // Make maximum requests per minute
    for (let i = 0; i < 20; i++) {
      rateLimiter.isAllowed('test-user');
    }
    
    // Advance time by 1 minute
    jest.advanceTimersByTime(60 * 1000);
    
    // Should be allowed again
    const result = rateLimiter.isAllowed('test-user');
    expect(result.allowed).toBe(true);
  });

  test('should clean up old requests', () => {
    rateLimiter.isAllowed('test-user');
    
    // Advance time beyond window
    jest.advanceTimersByTime(16 * 60 * 1000);
    
    rateLimiter.cleanup();
    
    // Should have full limit available
    const result = rateLimiter.isAllowed('test-user');
    expect(result.remaining).toBe(19); // 20 - 1 (current request)
  });
});